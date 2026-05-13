# WhatsApp Flow — OTP Verification

Minimal example showing how to send a [WhatsApp Flow](https://docs.heylua.ai/formatting/flow) as
an interactive form using the `::: flow` component.

The agent sends a Flow that asks the user to enter a verification code; when the user submits the
form, WhatsApp posts the answers back to the agent and a follow-up tool verifies the code.

## What this example demonstrates

- The exact `::: flow` block format the platform parser expects (newline-separated fields).
- The "tool returns `rawInsights`, agent outputs it verbatim" pattern — the safest way to
  emit structured blocks without the model paraphrasing them.
- Handling the `User completed a WhatsApp Flow. Submitted data: …` follow-up message.

## The Flow block

```text
::: flow
flow_id=<FLOW_ID>
flow_cta=Enter Code
body=Tap the button below to securely enter your verification code.
:::
```

**Required fields**: `flow_id`, `flow_cta`. **Optional**: `body`, `header`, `footer`, `screen`.

> **Newlines matter.** The parser splits the block on `\n` and runs a `key[:=]value` regex on
> each line. A single-line variant like
> `::: flow flow_id=1 flow_cta=Go body=Hi :::` will be dropped because the greedy regex
> swallows everything after the first `=` into `flow_id`, leaving `flow_cta` unset.

## Prerequisites

1. A WhatsApp Business account connected to your agent (Admin → Channels → WhatsApp).
2. A **Published** Flow in WhatsApp Manager. Drafts cannot be sent to end users.
   - Go to WhatsApp Manager → Account tools → Flows.
   - Build a Flow with one input field for the code, name it `code` so the submitted data
     matches the `verify_otp_code` tool's schema.
   - Publish it and copy the Flow ID.

## Run

```bash
cp .env.example .env       # then set WHATSAPP_FLOW_ID to your published Flow ID
npm install
lua init                   # creates lua.skill.yaml linked to a new agent
lua dev                    # test in the browser
lua push                   # deploy to staging
```

On WhatsApp the user sees a message with an "Enter Code" CTA button. Tapping it opens the Flow
form inside WhatsApp; submitting it posts the data back to the agent.

On any non-WhatsApp channel the raw `:::` block is delivered as plain text — that is the
documented fallback behaviour. Use this skill only on agents that have WhatsApp connected.

## Files

```
src/
├── index.ts                       # LuaAgent definition + persona
└── skills/
    ├── otp.skill.ts               # Skill wiring + model instructions
    └── tools/
        └── OtpTools.ts            # send_verification_flow, verify_otp_code
```

## References

- [Flow Component docs](https://docs.heylua.ai/formatting/flow)
- [WhatsApp Flows (Meta)](https://developers.facebook.com/docs/whatsapp/flows)
