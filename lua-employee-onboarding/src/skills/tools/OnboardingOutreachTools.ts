import { LuaTool, Channels } from "lua-cli";
import { z } from "zod";

/**
 * Channels API showcase — agent-initiated outreach.
 *
 * Friday announces a new hire in #general (the Slack tools), but a warm welcome
 * also lands on the new hire's *own* channel. This tool uses the Channels API to
 * reach them directly on email or WhatsApp, separate from the team announcement.
 *
 * - `Channels.email.send(...)` has no time window — it always works, even for
 *   someone who has never messaged the agent.
 * - `Channels.send({ channel: 'whatsapp' })` only delivers free-form within 24h of
 *   the recipient's last message. For a brand-new hire who hasn't messaged yet, the
 *   message is queued and delivered once they reply (`queued: true`); to reach them
 *   immediately, send an approved template with `Channels.whatsapp.sendTemplate`.
 */
export class SendNewHireWelcomeTool implements LuaTool {
  name = "send_new_hire_welcome";
  description =
    "Send a personal welcome to a new hire on their own channel (email or WhatsApp), separate from the team Slack announcement. Use after announcing them in #general.";

  inputSchema = z.object({
    channel: z
      .enum(["email", "whatsapp"])
      .describe("Which channel to reach the new hire on"),
    fullName: z.string().describe("The new hire's full name"),
    email: z
      .string()
      .optional()
      .describe("New hire's email address (required when channel is 'email')"),
    phoneNumber: z
      .string()
      .optional()
      .describe(
        "New hire's phone in E.164 format, e.g. +14155552671 (required when channel is 'whatsapp')"
      ),
    message: z
      .string()
      .describe("The personalized welcome message — warm, in Friday's voice"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    if (input.channel === "email") {
      if (!input.email) {
        return { success: false, error: "email is required when channel is 'email'" };
      }

      const result = await Channels.email.send({
        to: { email: input.email },
        subject: `Welcome to Lua, ${input.fullName}! 🎉`,
        text: input.message,
      });

      return { success: result.delivered, persisted: result.persisted };
    }

    // WhatsApp
    if (!input.phoneNumber) {
      return {
        success: false,
        error: "phoneNumber is required when channel is 'whatsapp'",
      };
    }

    const result = await Channels.send({
      channel: "whatsapp",
      to: { phoneNumber: input.phoneNumber },
      text: input.message,
    });

    // Outside the 24h window the message is queued until the hire replies.
    return {
      success: result.delivered || Boolean(result.queued),
      delivered: result.delivered,
      queued: result.queued,
    };
  }
}
