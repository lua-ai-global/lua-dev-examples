import { LuaSkill } from "lua-cli";
import { SendNewHireWelcomeTool } from "./tools/OnboardingOutreachTools";

const onboardingOutreachSkill = new LuaSkill({
  name: "onboarding-outreach-skill",
  description:
    "Reach new hires directly on their own channel (email or WhatsApp) with the Channels API — a personal welcome alongside the public Slack announcement.",

  context: `Use this skill to welcome a new hire **personally**, on their own channel, in addition to the #general Slack announcement.

# When to use

After you announce a new hire in #general, also send them a warm, personal welcome on the channel they'll actually use day-to-day:
- **Email** (\`send_new_hire_welcome\` with channel: "email") — always works; great for a "here's what to expect on day one" note.
- **WhatsApp** (channel: "whatsapp") — for a quick, personal hello.

# How it works

This skill uses the Channels API to send outbound messages from the agent — not a Slack post. Every send is recorded to the new hire's conversation thread, so if they reply, you'll have the context.

# WhatsApp note

WhatsApp only allows free-form messages within 24 hours of the person's last message. A brand-new hire hasn't messaged yet, so a WhatsApp welcome is **queued** and delivered once they reply (the tool returns \`queued: true\`). Email has no such window — prefer email for the very first touch unless the hire has already reached out on WhatsApp.

# Crafting the message

- Write in Friday's voice — warm, sharp, genuinely welcoming.
- Personalize with their name and role.
- Keep it short. A new hire's inbox is busy on day one.
- Don't send confirmation chatter — just send the welcome.`,

  tools: [new SendNewHireWelcomeTool()],
});

export default onboardingOutreachSkill;
