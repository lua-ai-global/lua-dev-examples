# Linear OAuth — an agent that handles OAuth itself

An agent that links an end user's own Linear account during a conversation. It sends an
authorize link, exchanges the code the user pastes back, stores the tokens, and keeps them
alive with a scheduled job. When a token can no longer be refreshed, it asks the user to link
again.

This is the companion project for the guide
[Let your agent handle OAuth](https://docs.heylua.ai/build/handle-oauth). The guide explains
each file; this README is how to run it.

## What this example demonstrates

- An OAuth authorization-code flow run by the agent, with the user carrying the code by hand.
- The hosted code page at `https://heylua.ai/oauth/code` as the callback URL.
- Per-user tokens in a `Data` collection, never returned to the model and never logged.
- A `LuaJob` that refreshes tokens ahead of expiry and handles rotated refresh tokens.
- Relinking: the job messages the user once, and any tool answers `needsRelink` so the agent
  sends a new link in the conversation.

## How the flow works

1. The user asks to link Linear. `connect_linear` builds the authorize URL with a one-time
   `state` and the agent sends it as a link.
2. The user approves in Linear and lands on `https://heylua.ai/oauth/code`, which shows the
   code with a copy button.
3. The user pastes the code into the chat. `finish_linear_connect` exchanges it for an access
   token and a refresh token.
4. `list_linear_teams` (or any tool you add) reads the stored token.
5. `linear-token-keepalive` runs every 6 hours and refreshes every token with less than 12
   hours left. A Linear access token lasts 24 hours.

## Prerequisites

1. A Linear OAuth application: **Settings** › **API** › **OAuth applications**.
2. This callback URL registered on it, exactly:

   ```text
   https://heylua.ai/oauth/code?provider=linear
   ```

3. lua-cli 3.41.0 or later, signed in with `lua auth configure`.

## Run

```bash
cp .env.example .env       # then fill in the client ID and secret
npm install
lua init                   # creates lua.skill.yaml linked to an agent
lua compile --ci
```

Link your own account from the terminal:

```bash
lua test --ci skill --name connect_linear --input '{}'
# open the url it prints, approve, copy the code, then within 10 minutes:
lua test --ci skill --name finish_linear_connect --input '{"code":"<code>"}'
lua test --ci skill --name list_linear_teams --input '{}'
lua test job --name linear-token-keepalive --ci
```

`lua test` runs as you, so the link is stored against your own user record on the agent. The
calls to Linear and the writes to `Data` are real.

To release it, set the same three values for production with `lua env production`, then push,
create a version, and promote it. The guide has the commands.

## Files

```
lua-linear-oauth/
├── src/
│   ├── index.ts                          # Agent: the skill and the job
│   ├── lib/
│   │   └── linear-oauth.ts               # Link, exchange, refresh, storage
│   ├── skills/
│   │   ├── linear.skill.ts               # Context that tells the model how to run the flow
│   │   └── tools/
│   │       ├── ConnectLinearTool.ts      # Builds the authorize link
│   │       ├── FinishLinearConnectTool.ts # Exchanges the pasted code
│   │       ├── ListLinearTeamsTool.ts    # Uses the stored token
│   │       └── DisconnectLinearTool.ts   # Revokes and deletes
│   └── jobs/
│       └── LinearTokenKeepaliveJob.ts    # Refreshes tokens, prompts a relink
├── .env.example
├── package.json
└── tsconfig.json
```

## Use another provider

Change the three URLs and the authorize parameters in `src/lib/linear-oauth.ts`, and set the
job's schedule from the access token's lifetime so it runs at least twice within it. For a
GitHub App the callback is `https://heylua.ai/oauth/code?provider=github`, the access token
lasts 8 hours, and the refresh token rotates and expires after 6 months. The guide has a
side-by-side table.

## Where the tokens live

Tokens are stored in the `linear-connections` collection. `Data` is readable by any credential
with `knowledge:read` on the agent, and collections are shared by the sandbox and production.
Return only what the reply needs from a tool, and never log a token.
