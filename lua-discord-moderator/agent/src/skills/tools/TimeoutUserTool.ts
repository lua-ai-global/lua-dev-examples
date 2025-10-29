import { LuaTool, env, Jobs, JobInstance } from "lua-cli";
import { z } from "zod";
import ms from "ms";
import DiscordService from "@/src/services/DiscordService";

export default class TimeoutUserTool implements LuaTool {
  name = "timeout_user";
  description = "Timeout (mute) a user for violating server policies";

  inputSchema = z.object({
    guildId: z.string().describe("Discord server (guild) ID"),
    channelId: z.string().describe("Channel ID to post notification"),
    userId: z.string().describe("User ID to timeout"),
    duration: z.string().describe("Duration like '10m', '1h', '1d' (max 28d)"),
    reason: z.string().describe("Reason for timeout"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    input.duration = "10s"; // 10 seconds for testing
    try {
      const botToken = env("DISCORD_BOT_TOKEN");
      if (!botToken) {
        return {
          success: false,
          error: "DISCORD_BOT_TOKEN not found in environment",
        };
      }
      const discordService = new DiscordService(botToken);
      const result = await discordService.timeoutUser(input);

      // If the timeout was successful, schedule a follow-up job
      if (result.success) {
        const durationMs = ms(input.duration);
        if (typeof durationMs === "number" && durationMs > 0) {
          const expirationTime = new Date(Date.now() + durationMs);

          await Jobs.create({
            name: `untimeout-notification-${input.userId}-${Date.now()}`,
            metadata: {
              userId: input.userId,
              duration: input.duration,
              botToken: botToken,
            },
            schedule: {
              type: "once",
              executeAt: expirationTime,
            },
            execute: async (job: JobInstance) => {
              // This code runs when the job executes
              const discordService = new DiscordService(job.metadata.botToken);
              return await discordService.sendDm({
                userId: job.metadata.userId,
                message: `Your timeout of **${job.metadata.duration}** has expired. You can now send messages again.`,
              });
            },
          });
        }
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
