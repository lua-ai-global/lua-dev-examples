import { LuaTool, env } from "lua-cli";
import { z } from "zod";
import DiscordService from "../services/DiscordService";
import { getDiscordContext } from "../utils/discord-context";

/**
 * Mark a forum thread as resolved by adding the "Resolved" tag.
 * Only available when @mentioned in a forum thread.
 * 
 * This triggers the threadUpdate event in Discord, which will then
 * cause the bot to send a [Forum Resolved] message to the agent,
 * triggering the save_post tool to save the solution.
 */
export default class MarkResolvedTool implements LuaTool {
  name = "mark_resolved";
  description =
    "Mark the current forum thread as resolved. Use when a user asks you to mark their issue as solved.";

  inputSchema = z.object({});

  /**
   * Only available when @mentioned in a thread.
   */
  condition = async () => {
    const ctx = getDiscordContext();
    if (!ctx) return false;
    
    return ctx.isThread && ctx.trigger === "mention";
  };

  async execute() {
    const botToken = env("DISCORD_BOT_TOKEN");
    const ctx = getDiscordContext();

    if (!botToken || !ctx?.channelId || !ctx?.parentId) {
      return {
        success: false,
        error: "Missing Discord context. This tool only works in forum threads.",
      };
    }

    const discord = new DiscordService(botToken);
    const result = await discord.addForumTag({
      threadId: ctx.channelId,
      parentChannelId: ctx.parentId,
      tagName: "Resolved",
    });

    if (result.success) {
      return {
        success: true,
        message: "✅ Marked this thread as resolved! The solution will be saved to help others.",
      };
    }

    return {
      success: false,
      error: result.message,
    };
  }
}

