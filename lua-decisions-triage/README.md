# Decisions Triage Agent

> A support agent for a small online shop that routes every message with typed decisions.

## What it does

Sam answers customers of a small online shop. Before Sam replies, the agent decides three things about the message:

* Is the customer asking for a refund?
* Which team should handle it: billing, tech, sales or legal?
* How frustrated is the customer: calm, annoyed or angry?

Clear refund requests never reach the chat model. A gate hands them to a person and tells the customer so. Everything else gets a team, a refund score and an urgency flag that Sam uses to reply.

The same routing is available to other systems. A webhook takes a message from any channel and returns the team.

## How it works

The example uses one primitive, `Decisions`, in three places.

| Piece | Name | What it does |
| --- | --- | --- |
| Tool | `triage_message` | Asks all three questions with `Decisions.ask` and returns the routing to Sam. |
| Named decision | `triage` | Declares the same three questions once on the agent, with a version history. |
| Webhook | `inbound-message` | Runs the named decision with `Decisions.run('triage', state)` and returns the routing. |
| Pre-processor | `refund-gate` | Asks one refund question before the agent sees the message. |

There is no prompt parsing anywhere. Each question has a type, and each answer comes back typed:

```typescript
const result = await Decisions.ask({
  state: { message: input.text },
  questions: {
    refund: Decisions.odds('Is the customer asking for a refund?'),
    team: Decisions.choice('Which team should handle this message?', TEAMS),
    frustration: Decisions.score('How frustrated is the customer?', ['calm', 'annoyed', 'angry']),
  },
  minConfidence: 0.7,
});
```

`refund` is a probability from 0 to 1. `team` is one of the four team keys. `frustration` is one of the three levels. A choice or score below the 0.7 confidence floor comes back with `uncertain: true`, and the agent sends it to a person instead of guessing.

Any answer can be `refused`. The code checks `answer.type` before it reads `odds`, `choice` or `level`, so a refusal can never be read as a real answer. TypeScript enforces that check.

### Why not ask the chat model?

You could ask a model to "reply with the team name" and parse the text. This example does not, for three reasons.

* **Typed answers.** The answer is a number or a fixed key. There is no free text to parse and nothing to clean up.
* **Fast.** A decision takes about 200 to 300 ms, so the gate runs on every message without slowing the chat.
* **Cheap.** A call costs a fraction of an action: 0.005 actions when Jev answers, 0.01 actions when OpenAI answers. A cached hit and a failed call cost nothing.

### The refund gate

`refund-gate` runs before the agent on every message. It asks one question, using the short form of `Decisions.ask`: the state first, then a single question, which resolves to that one answer instead of an `answers` map.

```typescript
const refund = await Decisions.ask({ message: text }, Decisions.odds('Is the customer asking for a refund?'));
```

When the odds are 0.9 or higher, the gate saves the message to the `refund_requests` collection and blocks it with a short reply. A person picks it up from there. Below 0.9, the message goes on to Sam with `refundOdds` in its metadata.

If the decision fails, the gate lets the message through. A routing outage never blocks a customer.

### Errors

A failed call throws a `DecisionError`. The tool catches it and branches on `err.code`:

| Code | What the tool does |
| --- | --- |
| `decision_invalid` | The message was empty or too long. The tool says so and picks no team. |
| `decision_timeout` | The tool asks for a person instead of guessing. |
| `decision_unavailable` | The tool asks for a person instead of guessing. |

Any other code is thrown again. The tool logs `err.decisionId` on every failure, so `lua logs --type decisions` finds the call.

## Run it

You need the Lua CLI 3.48.0 or later.

```bash
npm install -g lua-cli
lua auth configure
```

Clone this folder and install it. Or run `lua init` in an empty folder and copy `src/index.ts` into it.

```bash
cd lua-decisions-triage
npm install
```

Put your agent and organization ids in `lua.skill.yaml` in place of `YOUR_AGENT_ID` and `YOUR_ORG_ID`. `lua init` fills them in for you.

Push the agent, then make a version and promote it:

```bash
lua push
lua version create
lua version promote <version>
```

The named decision only answers after a promote. Until then, `Decisions.run('triage', ...)` throws `decision_not_found`.

Try the tool on its own:

```bash
lua test tool --name triage_message --input '{"text":"I was charged twice for the same order and I am furious"}'
```

Then talk to Sam:

```bash
lua chat
```

Try these messages:

1. "My order arrived broken. I want my money back." The gate hands it to a person.
2. "The checkout page keeps logging me out." Sam routes it to tech.
3. "Do you have this jacket in a medium?" Sam routes it to sales.
4. "This is the third time I have asked. Nobody answers." Sam marks it urgent.

To try the webhook, send a POST with a JSON body to `inbound-message`:

```json
{ "text": "Can I get an invoice for my last order?" }
```

It returns the team, the refund odds, the urgency flag and the decision id. Try it from the terminal:

```bash
lua test webhook --name inbound-message --input '{"body":{"text":"Can I get an invoice for my last order?"}}'
```

## The decision lifecycle

`triage` is declared once on the agent:

```typescript
export const triage = new LuaDecision({
  name: 'triage',
  description: 'Route a customer message to the team that should handle it',
  questions: {
    refund: Decisions.odds('Is the customer asking for a refund?'),
    team: Decisions.choice('Which team should handle this message?', TEAMS),
    frustration: Decisions.score('How frustrated is the customer?', ['calm', 'annoyed', 'angry']),
  },
  minConfidence: 0.7,
});
```

Each `lua push` stages a new version of it. A staged version does nothing yet. It goes live when you promote the agent version that includes it:

```bash
lua push
lua version create
lua version promote <version>
```

See every version, newest first, with its questions and confidence floor:

```bash
lua decisions versions triage
```

Run the current version on a message without going through chat:

```bash
lua decisions run triage --message 'I want a refund for order 1042'
```

Roll back by publishing an older version. It is live at once, with no redeploy:

```bash
lua decisions publish triage <older-version>
```

The next `lua version promote` sets the decision back to the version that agent version included.

## What to try

**Change the confidence floor from the dashboard.** Open the agent's Decisions section, raise `minConfidence` on `triage` from 0.7 to 0.85 and publish. More messages now come back `uncertain` and go to a person. The webhook uses the new floor on its next call, with no push and no redeploy. The tool keeps its 0.7, because it asks its own questions with `Decisions.ask`. That is the difference between the two: a named decision can change without touching code.

**Roll it back.** Run `lua decisions versions triage`, find the version before your edit and publish it with `lua decisions publish triage <older-version>`. The floor is 0.7 again.

**Add a team.** Add `shipping` to `TEAMS` with a one-line description. Push, create a version and promote it. `lua decisions run triage --message 'Where is my parcel?'` now answers `shipping`.

**Move the refund line.** Change `REFUND_FLOOR` from 0.9 to 0.8 and watch more messages go straight to a person.

## Project structure

```
lua-decisions-triage/
├── src/
│   └── index.ts        # Agent, tool, named decision, webhook and gate
├── lua.skill.yaml      # Agent and organization ids
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── env.example         # No keys needed
└── README.md           # This file
```

## Documentation

For the full Decisions reference, visit [Lua Documentation](https://docs.heylua.ai/).
