import type { BrowserCommandResult } from 'lua-cli';

const BROWSER_HELP: Record<string, string> = {
  BROWSER_DISABLED: 'This agent has no browser. Add `browser: true` or a LuaBrowser, then push the agent again.',
  BROWSER_UNAVAILABLE:
    'The browser does not run here. `lua test` never opens one: push the agent and use chat, `lua browser read` or `lua browser run`.',
  BROWSER_DOMAIN_NOT_ALLOWED: 'That host is not in the allowedDomains of this browser, so no page was opened.',
  BROWSER_PROFILE_NOT_FOUND:
    'No browser by that name is attached to this agent. Push the browser and the agent, then try again.',
  BROWSER_SESSION_LIMIT: 'Too many browser sessions are open for this person. One has to close first.',
  BROWSER_OUT_OF_CREDITS: 'The workspace has no actions left for a cloud browser session. Nothing was opened.',
  BROWSER_RUN_SCOPE_MISSING: 'There was no conversation or run to tie a browser session to.',
  BROWSER_BOT_WALL: 'The site refused an automated browser.',
  no_page: 'No page is open in this session yet.',
  session_lost: 'The browser session ended, so the page has to be opened again.',
  session_cap: 'The cloud browser is at capacity right now.',
  timeout: 'The page did not finish loading inside the time budget.',
  http_error: 'The page answered with an HTTP error and nothing to read.',
  unreachable: 'The cloud browser could not be reached. Worth trying again shortly.',
  engine_error: 'The browser reported an error, often a selector that was never found on the page.',
  unsupported: 'This browser cannot run that command.',
  files_disabled: 'This browser has no maxDownloadMb, so it may not move files.',
  file_cap: 'The file is bigger than the per-file cap on this browser.',
  mime: 'The type read from the bytes of the file is not one of the allowedMimeTypes on this browser.',
  file_not_clean: 'The file is still being scanned for malware, so it cannot be opened or uploaded yet.',
  scripts_disabled: 'This browser may not run page scripts.',
  browser_logins_disabled: 'Saved logins are turned off here.',
  browser_login_not_found: 'There is no saved login by that name yet.',
  browser_login_needs_user: 'A saved login only works on a live chat turn of the person it belongs to.',
  browser_login_grant_required: 'A scheduled job may use a saved login only once the person allows that job.',
  browser_login_read_only: 'That login is read-only, so the browser may only read the page.',
  browser_login_site_not_allowed: 'A signed-in session may not leave the hosts the login was saved for.',
  too_many_attempts: 'The sign-in is in a cooldown. Say when it can be tried again, and stop.',
  secrets_unavailable: 'A saved login belongs to a person in a live chat, so it only works on the platform.',
};

export function codeOf(value: unknown): string | undefined {
  const code = (value as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

export function explain(code: string | undefined): string | undefined {
  return code ? BROWSER_HELP[code] : undefined;
}

export function thrown(error: unknown) {
  const code = codeOf(error);
  return {
    ok: false as const,
    code,
    error: (error as { message?: string } | null)?.message,
    status: (error as { status?: number } | null)?.status,
    reason: explain(code),
  };
}

export function failedCommand(command: string, result: BrowserCommandResult) {
  return { ok: false as const, command, code: result.code, error: result.error, reason: explain(result.code) };
}

const VALUE_KEYS = ['text', 'value', 'count', 'html', 'title', 'url'] as const;

export function dataOf(result: BrowserCommandResult): unknown {
  const { data } = result;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    for (const key of VALUE_KEYS) {
      if (key in record) return record[key];
    }
  }
  return data;
}

export function pause(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}
