# Browser Agent

> An agent that drives a real browser: it reads public pages, works a task step by step, holds a submit until you approve it, moves files, and reads a page behind a sign-in with a login you saved.

Requires `lua-cli` 3.58.0 or later.

## What it does

Web helper opens pages in a real Chrome browser, which is the only way to read a page whose content arrives after its JavaScript runs. Everything in this example points at four public demo sites, so a fresh clone works with no accounts, no API keys and no bot walls:

| Site | Used for |
| --- | --- |
| [books.toscrape.com](https://books.toscrape.com) | prices and stock, category pages |
| [quotes.toscrape.com](https://quotes.toscrape.com) | the scheduled read |
| [the-internet.herokuapp.com](https://the-internet.herokuapp.com) | files and the saved-login flow |
| [example.com](https://example.com) | the smallest possible read |

The agent has four browsers: three named ones with their own rules, and the agent-level default. A browser is a set of rules about where it may go and what it may do, and the one you name supplies **every** setting: settings never merge with the default.

| Browser | Rules | Used by |
| --- | --- | --- |
| `research` | reads three public hosts, no files, no scripts, 5 minute sessions | `read_page`, `check_price`, `browse_category`, the job |
| `shop` | two hosts, and `confirmActions: ['submit']` holds anything that submits | `run_web_task` with `browser: 'shop'` |
| `files` | one host, `maxDownloadMb: 5` and four `allowedMimeTypes` | `save_files` |
| the `browser` default | all four hosts, no confirmations | `read_as_me`, `lua browser read`, `lua browser run` |

## Clone and run

You need Node 20 or later and a Lua account.

```bash
git clone https://github.com/lua-ai-global/lua-dev-examples.git
cd lua-dev-examples/lua-browser-agent
npm install -g lua-cli
npm install
```

Sign in, then bind the folder to an agent. `lua init` writes your agent and organization ids into `lua.skill.yaml` in place of `YOUR_AGENT_ID` and `YOUR_ORG_ID`:

```bash
lua auth configure
lua agents                          # the ids you already have
lua init --agent-id <your-agent-id> # or: lua init --agent-name "Web helper" --org-id <your-org-id>
```

Check the project compiles before you send anything to the platform:

```bash
npm run smoke
```

Push the three browsers, the agent, the skill and the job together, then make a version and promote it:

```bash
lua push all --force
lua version create
lua version promote <version>
```

Browsers need both pushes: the browser itself and the agent that lists it. `lua push all` does both. Confirm they arrived:

```bash
lua browsers
```

`lua test` never opens a browser: every `Browser` method answers `BROWSER_UNAVAILABLE` there, and a saved login answers `secrets_unavailable`. Try the browser from the terminal instead, against the agent you just pushed:

```bash
lua browser read https://example.com
lua browser read https://books.toscrape.com/catalogue/soumission_998/index.html --selector .product_main
lua browser read https://quotes.toscrape.com --selector ".quote .text" --wait-for .quote --json | jq .data.content
lua browser run "Name the first book on the page and its price" --start-url https://books.toscrape.com/ --max-steps 6 --max-cost 0.25
lua logs --type browser
```

Then talk to the agent. Sandbox first, production once the version is promoted:

```bash
lua chat -m "What does example.com say?"
lua chat -e production -m "What does https://books.toscrape.com/catalogue/soumission_998/index.html cost, and is it in stock?"
lua chat -e production -m "How many books are in the travel_2 category, and what is the first one?"
lua chat -e production -m "Find the cheapest book on the first page of books.toscrape.com"
lua chat -e production -m "Press the Remove button on https://the-internet.herokuapp.com/dynamic_controls"
lua chat -e production -m "Save the demo download page as a PDF and put the first file it links to back into the upload form"
lua chat -e production -m "Sign the browser in to the-internet.herokuapp.com for me"
lua chat -e production -m "What does the secure area say now that I am signed in?"
```

The Remove button submits a form, so that one comes back as a question rather than an answer. Approve it in a second message on the same thread, which is the only place a hold can be approved from:

```bash
lua chat -e production -t approvals -m "Press the Remove button on https://the-internet.herokuapp.com/dynamic_controls"
lua chat -e production -t approvals -m "Yes, go ahead"
```

`lua logs --type browser` after each one is where the browser tells you the truth: which engine ran, which host it refused, which wall it hit, which file it moved and which sign-in it tried.

## The ways in

| Tool | Method | What it shows |
| --- | --- | --- |
| `read_page` | `Browser.read` | One page in one short session, and the difference between a page and a wall. |
| `check_price` | `Browser.read` | The same call with `selector` and `waitFor`, reading a price and a stock count. |
| `browse_category` | `navigate`, `wait`, `get`, `close` | The step-by-step commands sharing one `sessionKey`, closed in a `finally`. |
| `run_web_task` | `Browser.execute` | A task in plain words, with a schema, a step cap and a cost cap, and every `stopReason` handled. |
| `decide_held_action` | `Browser.confirm`, `Browser.deny` | Approving the action a run is holding, then carrying the task on in the same session. |
| `save_files` | `pdf`, `download`, `upload` | Saving a PDF and a file, and uploading that file once its scan clears. |
| `add_demo_login` | `Secrets.request` | Asking the person for a login the agent can use but never sees. |
| `read_as_me` | `Browser.execute` with `credentials` | Reading a page behind a sign-in as that person. |

Reach for them in that order. A browser session costs money and time, so the rule is the narrowest method that does the job:

```ts
const page = await Browser.read(url, { browser: 'research', waitFor: 'load' });
if (page.blocked) return { ok: false, blocked: page.blocker, reason: page.blockerGuidance };
```

`Browser.read` opens its own session and closes it again, which makes it the cheapest call in the API. The step-by-step commands share one session while you hold it, so `browse_category` closes its session in a `finally`, on the error path too. `Browser.execute` adds a model call per step, so `run_web_task` caps both the steps and the spend.

## When a run stops

`Browser.execute` returns a result instead of throwing. `run_web_task` branches on it, which is the whole point of the tool:

| `stopReason` or `code` | What the tool answers |
| --- | --- |
| `done` | The answer, with the steps, the cost and the page it ended on. |
| `confirmation_required` | `needsApproval`, the held action, its `confirmationId` and the `sessionKey`. |
| `repeated_action` | The browser tried the same action three times on a page that did not change, so the task needs exact clicks instead. |
| `BROWSER_BOT_WALL` | The site refused an automated browser, with the three ways through it. |
| `needs_verification` | A private link is on its way to the person, and the run waits for them. |
| `max_steps`, `cost_cap`, `timeout` | The cap it reached, so you can narrow the task rather than raise the cap. |

## Approvals

The `shop` browser sets `confirmActions: ['submit']`, so anything that submits stops the run instead of going through. That covers clicking a button such as Buy, Pay, Place order, Sign in or Send, and pressing Enter:

```ts
if (run.stopReason === 'confirmation_required' && run.pendingAction?.confirmationId) {
  return { needsApproval: true, confirmationId: run.pendingAction.confirmationId, sessionKey: run.sessionKey };
}
```

The agent tells the person what is about to happen in its own words and waits. A hold can only be approved from their **next** message, never in the turn that held it, and it is dropped after 60 seconds. `decide_held_action` then runs it and carries the task on in the same session:

```ts
await Browser.confirm({ sessionKey, browser, id: confirmationId });
await Browser.execute({ task: rest, sessionKey, browser });
```

A job or a webhook has nobody to ask, so it can hold an action but never approve one. Do not put a confirmed step inside a job.

## Saved logins

The agent can ask the browser to sign in as the person, and never sees the username, the password or a verification code. `add_demo_login` asks for the login; Lua sends that person a one-time link in the conversation, they type their details on a Lua page, and they pick the access they are happy with:

```ts
const receipt = await Secrets.request({
  kind: 'browser-login',
  name: 'internet-demo',
  origins: ['the-internet.herokuapp.com'],
  loginUrl: 'https://the-internet.herokuapp.com/login',
  access: 'read',
  reason: 'Read the page behind the demo sign-in as you',
});
```

`read_as_me` then names that login and the browser signs in before the task starts:

```ts
await Browser.execute({ task, startUrl, credentials: ['internet-demo'], maxSteps: 6, maxCostUsd: 0.2 });
```

**The demo credentials.** The demo site prints its own test credentials on its login page: username `tomsmith`, password `SuperSecretPassword!`. They belong to a public practice site that holds nothing, they are the same for everybody, and they exist so you can watch this flow work. Type them on the Lua page when the link arrives. Never put a real credential in code, in a prompt or in an environment variable; there is no API that takes one.

Three rules worth keeping:

- **Ask for `read`** unless the work genuinely writes. `read` can open, navigate, scroll and read, which covers most work. `act` can click, fill, type, select and press with the person approving each one. `act-auto` does those without asking.
- **Never loop on a failed sign-in.** One attempt per 30 minutes by default, and a failure starts a 30 minute cooldown. `result.reason` is already written for the person, so pass it along and stop.
- **One login per site per person**, named for the site. Asking again with the same name replaces that person's login.

A signed-in session is saved and reused, so a second run usually comes back with `restored: true` and no sign-in at all.

**Letting the job use it.** A job has nobody to ask, so a saved login is off limits to it until the person allows that one job, from a live chat turn:

```ts
const [job] = (await Jobs.getAll()).filter((j) => j.name.startsWith('quote-of-the-day'));
await Browser.allowJobLogin({ credential: 'internet-demo', jobId: job.id, access: 'read' });
await Browser.revokeJobLogin({ credential: 'internet-demo', jobId: job.id });
```

The job in this example reads a public page, so it needs no grant. A job that signs in without one is refused with `browser_login_grant_required`.

## Files

Downloads, PDFs and uploads are off until a browser sets `maxDownloadMb`, which also caps each file. The `files` browser sets the smallest cap that fits the work and names the types it accepts:

```ts
maxDownloadMb: 5,
allowedMimeTypes: ['application/pdf', 'text/plain', 'image/png', 'image/jpeg'],
```

There is no download by URL. `save_files` clicks the link instead, which is what `download` is for, and the type is read from the bytes of the file rather than from what the site says it is. The demo download page is a public upload dump, so the file at the top of it changes: a type outside the list is refused with `mime` and a file over the cap with `file_cap`, which is the setting doing its job. Pass a `selector` to pick a different link.

A file the browser has just saved always arrives with `scanStatus: 'scanning'` and cannot be opened or uploaded until the malware scan clears it. `save_files` tries the upload three times, five seconds apart, and then hands the person the name and url of the file rather than waiting on it:

```ts
const got = await Browser.download({ browser: 'files', sessionKey: 'files', selector, name: 'demo-download' });
const file = got.data as BrowserFileResult;   // { fileId, url, name, bytes, mime, scanStatus }
```

## The job

`quote-of-the-day` reads the first quote on quotes.toscrape.com every morning at 08:00 UTC and keeps it in a `quotes` collection:

```ts
const page = await Browser.read(QUOTES, { browser: 'research', waitFor: '.quote', selector: '.quote .text' });
```

A job, a webhook, a trigger, a web route and a workflow step all run with nobody at a desktop, so they always use the Lua cloud browser. Run it without waiting for the morning:

```bash
lua test job --name quote-of-the-day         # local: the Browser call answers BROWSER_UNAVAILABLE
lua jobs trigger -i quote-of-the-day         # on the platform, where the browser is real
lua logs --type job --name quote-of-the-day
lua logs --type browser
```

## What it costs

Browser work is billed to your Lua organization in actions:

- **0.5 actions per cloud browser minute**, so sessions are the cost. Close what you open.
- **A 0.1 action minimum per session**, so a handful of one-second reads is not free.
- **Model and Browser-Use cost plus 30%** on a `Browser.execute` run. `maxSteps` and `maxCostUsd` are the only things between a confused model and a long bill.
- **$0.10 per GB downloaded**, on top of the minutes.

`Browser.read` is one short session with no model calls. The step-by-step commands are one session and no model calls. `Browser.execute` is a session plus a model call per step. That ordering is why the skill tells the agent to reach for the narrowest tool.

## Safety

- **Name the sites.** `allowedDomains` is checked on the server before every command that opens a URL, and on the cloud browser it covers redirects and everything a page loads too. A page that tries to talk the agent into going somewhere else cannot.
- **Hold what changes something.** Anything that submits, pays or sends belongs in `confirmActions`, approved by a person in a later message.
- **Logins never pass through chat or code.** The person types them on a Lua page. The receipt carries no link and no token, so it is safe to return from a tool; names and states are all your code ever sees.
- **Scripts stay off.** No browser here sets `allowScripts`, so `Browser.eval` is refused with `scripts_disabled`. The chat model never runs page scripts at all.
- **Read the logs.** `lua logs --type browser` carries a row per session, command, step, wall, refusal, confirmation, file and sign-in. Page text appears only with `logContent: 'full'`, and arguments that look like secrets are redacted.

## Project structure

```
lua-browser-agent/
├── src/
│   ├── index.ts                      # The agent, its browser default and its three browsers
│   ├── browsers/
│   │   ├── research.ts               # Read-only, three public hosts
│   │   ├── shop.ts                   # Holds anything that submits
│   │   └── files.ts                  # Downloads, PDFs and uploads, capped
│   ├── skills/
│   │   ├── web.skill.ts              # The skill and how the agent should use the tools
│   │   └── tools/                    # The eight tools, one per way in
│   ├── jobs/
│   │   └── QuoteOfTheDayJob.ts       # Browser.read on a schedule
│   └── lib/
│       └── browser.ts                # Error codes turned into one line a person can read
├── scripts/
│   └── smoke.mjs                     # npm run smoke: types, compile and primitive count
├── lua.skill.yaml                    # Agent and organization ids
├── package.json
├── tsconfig.json
├── env.example                       # No keys needed
└── README.md                         # This file
```

## Documentation

- [`Browser`](https://docs.heylua.ai/reference/sdk/browser) — every method, saved logins, files, limits and error codes
- [`LuaBrowser`](https://docs.heylua.ai/reference/sdk/luabrowser) — named browsers and every setting one takes
- [Use the browser](https://docs.heylua.ai/build/use-the-browser) — which method to reach for, and the settings worth having from the start
- [`lua browser`](https://docs.heylua.ai/reference/cli/browser) — reading a page or running a task from the terminal
