import DiscordService from "@/src/services/DiscordService";
import { LuaTool, env } from "lua-cli";
import { z } from "zod";

export default class SendWarningTool implements LuaTool {
  name = "send_warning";
  description = "Send a public warning message for minor rule violations";

  inputSchema = z.object({
    channelId: z.string().describe("Channel ID to post warning"),
    userId: z.string().describe("User ID being warned"),
    reason: z.string().describe("Reason for warning"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const botToken = env("DISCORD_BOT_TOKEN");
      if (!botToken) {
        return {
          success: false,
          error: "DISCORD_BOT_TOKEN not found in environment",
        };
      }
      const discordService = new DiscordService(botToken);
      return await discordService.sendWarning(input);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
