import { LuaTool, Jobs, JobInstance, User, env } from "lua-cli";
import { z } from "zod";
import ms from "ms";
import DiscordService from "../services/DiscordService";

/**
 * Set a reminder using the dynamic Jobs API.
 * Sends the reminder via Discord DM when the time comes.
 * 
 * The Discord ID is retrieved from the user profile (saved by analytics preprocessor).
 */
export default class SetReminderTool implements LuaTool {
  name = "set_reminder";
  description =
    "Set a reminder for the user. Example: 'remind me in 30 minutes to check my deployment'";

  inputSchema = z.object({
    message: z.string().describe("What to remind the user about"),
    delay: z
      .string()
      .describe("When to send reminder - e.g. '30m', '2h', '1d'"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Get Discord user ID from user profile (saved by analytics preprocessor)
    const user = await User.get();
    const discordUserId = user.discordId;
    
    if (!discordUserId) {
      return {
        success: false,
        error: "Could not find your Discord ID. Please try again.",
      };
    }

    const delayMs = ms(input.delay);
    if (typeof delayMs !== "number" || delayMs <= 0) {
      return {
        success: false,
        error: `Invalid delay format: "${input.delay}". Use formats like '30m', '2h', '1d'.`,
      };
    }

    const executeAt = new Date(Date.now() + delayMs);

    const job = await Jobs.create({
      name: `reminder-${Date.now()}`,
      metadata: {
        message: input.message,
        delay: input.delay,
        discordUserId,
      },
      schedule: {
        type: "once",
        executeAt,
      },
      execute: async (jobInstance: JobInstance) => {
        const { message, discordUserId } = jobInstance.activeVersion?.metadata || {};
        const botToken = env("DISCORD_BOT_TOKEN");

        if (!botToken) {
          console.error("Missing DISCORD_BOT_TOKEN for reminder");
          return;
        }

        if (!discordUserId) {
          console.error("Missing Discord user ID for reminder");
          return;
        }

        const discord = new DiscordService(botToken);
        const result = await discord.sendDm({
          userId: discordUserId,
          message: `⏰ **Reminder:** ${message}`,
        });

        if (!result.success) {
          console.error("Failed to send reminder:", result.message);
        }
      },
    });

    return {
      success: true,
      jobId: job.id,
      message: `Got it! I'll remind you in ${input.delay}: "${input.message}"`,
      scheduledFor: executeAt.toISOString(),
    };
  }
}
