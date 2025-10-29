import DiscordService from "@/src/services/DiscordService";
import { LuaTool, env } from "lua-cli";
import { z } from "zod";

/**
 * Delete Message Tool
 *
 * Deletes a message from Discord that violates policies.
 */
export default class DeleteMessageTool implements LuaTool {
  name = "delete_message";
  description = "Delete an inappropriate message from Discord";

  inputSchema = z.object({
    channelId: z.string().describe("Channel ID where the message is"),
    messageId: z.string().describe("ID of the message to delete"),
    reason: z.string().describe("Reason for deletion"),
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
      return await discordService.deleteMessage(input);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
