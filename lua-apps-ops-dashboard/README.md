# Ops dashboard — an agent with a web app

An agent with a small web app: a ticket board for the team. The page lists open and closed
tickets, opens new ones and closes them. Each action calls a typed route that runs in the Lua
sandbox as the person who opened the app, so every write records who made it.

This is the companion project for the guide
[Build and open your first web app](https://docs.heylua.ai/build/apps/quickstart). The guide
explains each step; this README is how to run it.

## What this example demonstrates

- A web app as a primitive of the agent: `defineWebApp` in `src/apps/ops-dashboard/app.ts`,
  listed under `webApps` on the `LuaAgent`.
- Three typed routes with Zod schemas for the query, path parameters and body. A request that
  does not match is answered with 400 before your handler runs.
- `Data` reads and writes from a route, with `auth` (the signed-in person) recorded on each write.
- A Vite + React page built with `@lua-ai-global/ui` that calls the routes with `lua.api()` from
  `@lua-ai-global/app-client` and follows the shell's light or dark theme.
- The release path: push a web-app version, then go live with the agent version that pins it.

## Routes

| Route | What it does |
| --- | --- |
| `GET /tickets?status=open` | Lists tickets with one status (`open` by default), newest first |
| `POST /tickets` | Opens a ticket. Body: `{ "title": "…", "priority": "low" \| "normal" \| "high" }` |
| `POST /tickets/:id/close` | Closes a ticket and records who closed it. Body: `{ "note"?: "…" }` |

Tickets are stored in the `tickets` collection.

## Prerequisites

- Node.js 20 or later.
- lua-cli 3.44.0 or later (`npm install -g lua-cli`), signed in with `lua auth configure`.

## Run

Install the agent project and the page project:

```bash
npm install
cd src/apps/ops-dashboard/web && npm install && cd -
```

Link the project to an agent. `lua init` creates `lua.skill.yaml`; pick a new agent or an
existing one:

```bash
lua init
lua compile --ci
```

Run the app locally. The page opens on Vite with hot reload, and the routes run in the local
sandbox as you, against the agent's live `Data`:

```bash
lua apps dev ops-dashboard
```

Open the URL it prints. Press Ctrl+C to stop.

Call one route from the terminal:

```bash
lua test webapp --name ops-dashboard --route 'POST /tickets' --input '{"body":{"title":"Restock the fridge","priority":"high"}}'
lua test webapp --name ops-dashboard --route 'GET /tickets?status=open'
lua test webapp --name ops-dashboard --route 'POST /tickets/<id>/close' --input '{"body":{"note":"Done"}}'
```

`lua test` and `lua apps dev` run as you. The writes to `Data` are real.

## Release

Push the app. This builds the page with the app's own Vite and uploads a web-app version. It is
staged, not live:

```bash
lua push webapp --name ops-dashboard
```

Go live with an agent version. The agent version pins the web-app version:

```bash
lua version create
lua version promote <version>   # the version that `lua version create` printed
```

To roll back, promote the previous agent version.

## Open the app

Open it by URL. Replace `<agentId>` with your agent's ID (it is in `lua.skill.yaml`):

- Lua Workspace in the browser: `https://workspace.heylua.ai/apps/<agentId>/ops-dashboard`
- Admin console: `https://admin.heylua.ai/admin/agents/<agentId>/apps`

Anyone who can read the agent can open the app.

## Files

```
lua-apps-ops-dashboard/
├── src/
│   ├── index.ts                      # Agent: persona and webApps
│   └── apps/
│       └── ops-dashboard/
│           ├── app.ts                # defineWebApp: pages and the three routes
│           └── web/                  # The page: Vite + React + @lua-ai-global/ui
│               ├── index.html
│               ├── package.json
│               ├── tsconfig.json
│               ├── vite.config.ts
│               └── src/
│                   ├── main.tsx      # Theme from the shell, starts the app client
│                   ├── App.tsx       # Ticket list, new-ticket form, close button
│                   └── index.css     # Design system styles + Tailwind
├── package.json
└── tsconfig.json                     # Excludes src/apps/*/web from the agent build
```

The page is its own project. The agent compiler never loads it: `tsconfig.json` excludes
`src/apps/*/web`, and `lua push webapp` builds it with Vite.

## Where the tickets live

Tickets are stored in the `tickets` collection. Collections are shared by the sandbox and
production, so tickets you open with `lua apps dev` show up in the live app too.
