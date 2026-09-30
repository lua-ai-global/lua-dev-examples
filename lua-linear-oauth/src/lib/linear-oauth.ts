import { Data, env } from 'lua-cli';

// One entry per end user in this collection holds that user's Linear tokens.
// Tokens never leave this module except as the bearer header of a Linear call:
// no tool returns one, and nothing here logs one.
export const COLLECTION = 'linear-connections';

const AUTHORIZE_URL = 'https://linear.app/oauth/authorize';
const TOKEN_URL = 'https://api.linear.app/oauth/token';
const REVOKE_URL = 'https://api.linear.app/oauth/revoke';

// How long a connect link stays valid after the agent sends it.
const LINK_TTL_MS = 10 * 60_000;
// Refresh inside a tool only when the token is about to lapse; the keep-alive
// job normally refreshes hours earlier.
const EXPIRY_MARGIN_MS = 60_000;

// The fields the tools and the job filter on. Declared on every write so the
// platform keeps the indexes built.
const INDEXES = { index: ['userId', ['status', 'expiresAt']] };

export type ConnectionStatus = 'pending' | 'connected' | 'relink_required';

export interface LinearConnection {
  userId: string;
  status: ConnectionStatus;
  /** Set while a connect link is outstanding. */
  state?: string | null;
  linkSentAt?: number | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  /** Epoch milliseconds, so the job can filter with $lte. */
  expiresAt?: number | null;
  scope?: string;
  connectedAt?: string;
  refreshedAt?: string;
  relinkReason?: string | null;
}

export interface StoredConnection {
  id: string;
  data: LinearConnection;
}

/** The user has to authorize again: there is no usable refresh token. */
export class RelinkRequiredError extends Error {
  constructor(message = 'The Linear connection has to be linked again') {
    super(message);
    this.name = 'RelinkRequiredError';
  }
}

function config() {
  const clientId = env('LINEAR_CLIENT_ID');
  const clientSecret = env('LINEAR_CLIENT_SECRET');
  const redirectUri = env('LINEAR_REDIRECT_URI');
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET and LINEAR_REDIRECT_URI are not set');
  }
  return { clientId, clientSecret, redirectUri };
}

export async function findConnection(userId: string): Promise<StoredConnection | null> {
  const page = await Data.get(COLLECTION, { userId }, 1, 1);
  const entry = page.data[0];
  return entry ? { id: entry.id, data: entry.data as LinearConnection } : null;
}

async function saveConnection(userId: string, fields: Partial<LinearConnection>): Promise<void> {
  const existing = await findConnection(userId);
  if (existing) await Data.update(COLLECTION, existing.id, fields, INDEXES);
  else await Data.create(COLLECTION, { userId, ...fields }, INDEXES);
}

/** Start a link: remember a one-time `state` for this user and build the URL to send them. */
export async function startLink(userId: string): Promise<{ url: string; reference: string }> {
  const { clientId, redirectUri } = config();
  const state = crypto.randomUUID();
  const existing = await findConnection(userId);
  await saveConnection(userId, {
    // A user who is relinking keeps `relink_required` until the new code is exchanged.
    status: existing?.data.status === 'relink_required' ? 'relink_required' : 'pending',
    state,
    linkSentAt: Date.now(),
  });

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'read,write');
  url.searchParams.set('actor', 'app');
  url.searchParams.set('state', state);
  return { url: url.toString(), reference: state };
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

// Linear answers a dead code or refresh token with `invalid_grant`. Everything
// else (timeouts, 5xx, rate limits) is temporary and must not drop the link.
async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = config();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ ...params, client_id: clientId, client_secret: clientSecret }),
    signal: AbortSignal.timeout(10_000),
  });
  if (res.ok) return (await res.json()) as TokenResponse;

  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (body.error === 'invalid_grant') throw new RelinkRequiredError();
  throw new Error(`Linear token endpoint answered ${res.status}${body.error ? ` (${body.error})` : ''}`);
}

function tokenFields(tokens: TokenResponse): Partial<LinearConnection> {
  return {
    status: 'connected',
    accessToken: tokens.access_token,
    // Linear rotates the refresh token: each response carries the next one.
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    expiresAt: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope,
    state: null,
    linkSentAt: null,
    relinkReason: null,
  };
}

/** Finish a link with the code the user pasted. `reference` is the state shown on the code page. */
export async function finishLink(userId: string, code: string, reference?: string): Promise<{ expiresAt: number }> {
  const connection = await findConnection(userId);
  const pending = connection?.data;
  if (!pending?.state || !pending.linkSentAt) {
    throw new Error('No connect link is outstanding for this user. Send a new link first.');
  }
  if (Date.now() - pending.linkSentAt > LINK_TTL_MS) {
    throw new Error('The connect link has expired. Send a new link.');
  }
  if (reference && reference !== pending.state) {
    throw new Error('That code belongs to a different connect link. Send a new link.');
  }

  let tokens: TokenResponse;
  try {
    tokens = await tokenRequest({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config().redirectUri,
    });
  } catch (error) {
    // A wrong, reused or expired code: nothing about the stored link changed.
    if (error instanceof RelinkRequiredError) {
      throw new Error('Linear rejected that code. Codes work once and expire quickly; send a new link.');
    }
    throw error;
  }

  const fields = tokenFields(tokens);
  await saveConnection(userId, { ...fields, connectedAt: new Date().toISOString() });
  return { expiresAt: fields.expiresAt as number };
}

/** Swap the refresh token for a new pair. Marks the link `relink_required` when Linear refuses it. */
export async function refreshConnection(connection: StoredConnection): Promise<LinearConnection> {
  const { id, data } = connection;
  if (!data.refreshToken) {
    await Data.update(COLLECTION, id, { status: 'relink_required', relinkReason: 'no refresh token' }, INDEXES);
    throw new RelinkRequiredError();
  }
  try {
    const tokens = await tokenRequest({ grant_type: 'refresh_token', refresh_token: data.refreshToken });
    const fields = { ...tokenFields(tokens), refreshedAt: new Date().toISOString() };
    await Data.update(COLLECTION, id, fields, INDEXES);
    return { ...data, ...fields };
  } catch (error) {
    if (error instanceof RelinkRequiredError) {
      await Data.update(
        COLLECTION,
        id,
        { status: 'relink_required', accessToken: null, refreshToken: null, relinkReason: 'refresh token rejected' },
        INDEXES
      );
    }
    throw error;
  }
}

/** A token that is valid right now, refreshing first when it is about to lapse. */
export async function getAccessToken(userId: string): Promise<string> {
  const connection = await findConnection(userId);
  if (!connection || connection.data.status !== 'connected' || !connection.data.accessToken) {
    throw new RelinkRequiredError('Linear is not linked for this user');
  }
  const { accessToken, expiresAt } = connection.data;
  if (expiresAt && expiresAt - Date.now() > EXPIRY_MARGIN_MS) return accessToken;
  const refreshed = await refreshConnection(connection);
  return refreshed.accessToken as string;
}

/** Revoke the tokens at Linear and forget the link. */
export async function unlink(userId: string): Promise<boolean> {
  const connection = await findConnection(userId);
  if (!connection) return false;
  const token = connection.data.refreshToken ?? connection.data.accessToken;
  if (token) {
    // Best effort: the entry is deleted either way.
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  }
  await Data.delete(COLLECTION, connection.id);
  return true;
}
