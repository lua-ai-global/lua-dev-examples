import SlackService from "@/src/services/SlackService";
import { LuaTool, env } from "lua-cli";
import { z } from "zod";

/**
 * Send Slack Message Tool
 * 
 * Sends a message to a Slack channel. Agent crafts the message content.
 */
export class SendSlackMessageTool implements LuaTool {
  name = "send_slack_message";
  description = "Send a message to a Slack channel. Craft creative, personalized messages for announcements, updates, or communications. Use this for new employee announcements or any team communication.";

  inputSchema = z.object({
    channelId: z.string().describe("Slack channel ID where to send the message"),
    text: z.string().describe("The message text you've crafted. Be creative, warm, and engaging! Can use Slack markdown formatting."),
    threadTs: z.string().optional().describe("Thread timestamp if replying to a thread (optional)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const slackBotToken = env("SLACK_BOT_TOKEN");
      
      if (!slackBotToken) {
        return {
          success: false,
          error: "SLACK_BOT_TOKEN not found in environment variables.",
        };
      }

      const slackService = new SlackService(slackBotToken);
      const result = await slackService.postMessage({
        channelId: input.channelId,
        text: input.text,
        threadTs: input.threadTs,
      });

      if (result.success) {
        return {
          success: true,
          message: "Message sent successfully",
          timestamp: result.ts,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Send Slack Message Error:", error);
      return {
        success: false,
        error: error.message || "Failed to send message",
      };
    }
  }
}

/**
 * Send Direct Message Tool
 * 
 * Sends a direct message to a Slack user. Agent crafts personalized message content.
 */
export class SendDirectMessageTool implements LuaTool {
  name = "send_direct_message";
  description = "Send a personalized direct message to a Slack user. Craft warm, engaging messages that make employees feel welcomed and valued. Use this for onboarding conversations, answering questions, or private communications.";

  inputSchema = z.object({
    userId: z.string().describe("Slack user ID to send the DM to"),
    text: z.string().describe("The personalized message you've crafted. Make it warm, helpful, and reflect your Friday personality! Can use Slack markdown formatting."),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const slackBotToken = env("SLACK_BOT_TOKEN");
      
      if (!slackBotToken) {
        return {
          success: false,
          error: "SLACK_BOT_TOKEN not found in environment variables.",
        };
      }

      const slackService = new SlackService(slackBotToken);
      const result = await slackService.sendDirectMessage({
        userId: input.userId,
        text: input.text,
      });

      if (result.success) {
        return {
          success: true,
          message: result.message,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Send Direct Message Error:", error);
      return {
        success: false,
        error: error.message || "Failed to send direct message",
      };
    }
  }
}

/**
 * Add Reaction Tool
 * 
 * Adds an emoji reaction to a Slack message.
 */
export class AddReactionTool implements LuaTool {
  name = "add_reaction";
  description = "Add an emoji reaction to a Slack message. Use this to acknowledge messages or show engagement.";

  inputSchema = z.object({
    channelId: z.string().describe("Channel ID where the message is"),
    timestamp: z.string().describe("Message timestamp to react to"),
    reaction: z.string().describe("Emoji name without colons (e.g., 'wave', 'thumbsup', 'tada')"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const slackBotToken = env("SLACK_BOT_TOKEN");
      
      if (!slackBotToken) {
        return {
          success: false,
          error: "SLACK_BOT_TOKEN not found in environment variables.",
        };
      }

      const slackService = new SlackService(slackBotToken);
      const result = await slackService.addReaction({
        channelId: input.channelId,
        timestamp: input.timestamp,
        reaction: input.reaction,
      });

      if (result.success) {
        return {
          success: true,
          message: result.message,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Add Reaction Error:", error);
      return {
        success: false,
        error: error.message || "Failed to add reaction",
      };
    }
  }
}

/**
 * Delete Message Tool
 * 
 * Deletes a message in Slack (only messages sent by the bot).
 */
export class DeleteMessageTool implements LuaTool {
  name = "delete_message";
  description = "Delete a message in Slack. You can only delete messages that were sent by you (the bot). Use this to remove incorrect or outdated messages.";

  inputSchema = z.object({
    channelId: z.string().describe("Channel ID where the message is"),
    timestamp: z.string().describe("Message timestamp (ts) to delete"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const slackBotToken = env("SLACK_BOT_TOKEN");
      
      if (!slackBotToken) {
        return {
          success: false,
          error: "SLACK_BOT_TOKEN not found in environment variables.",
        };
      }

      const slackService = new SlackService(slackBotToken);
      const result = await slackService.deleteMessage({
        channelId: input.channelId,
        timestamp: input.timestamp,
      });

      if (result.success) {
        return {
          success: true,
          message: "Message deleted successfully",
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Delete Message Error:", error);
      return {
        success: false,
        error: error.message || "Failed to delete message",
      };
    }
  }
}

