import axios from "axios";
import ms from "ms";

const DISCORD_API_BASE = "https://discord.com/api/v10";

/**
 * Discord Service
 *
 * Handles direct Discord REST API operations for moderation actions.
 * This service does not maintain a WebSocket connection but makes stateless API calls.
 */
export default class DiscordService {
  private botToken: string;

  constructor(botToken: string) {
    if (!botToken) {
      throw new Error("Discord bot token is required for DiscordService");
    }
    this.botToken = botToken;
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bot ${this.botToken}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Delete a message from a channel.
   */
  async deleteMessage(params: {
    channelId: string;
    messageId: string;
    reason: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      await axios.delete(
        `${DISCORD_API_BASE}/channels/${params.channelId}/messages/${params.messageId}`,
        {
          headers: this.getAuthHeaders(),
          data: { reason: params.reason },
        }
      );
      return {
        success: true,
        message: `Deleted message ${params.messageId}. Reason: ${params.reason}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to delete message ${params.messageId}: ${
          error.response?.data?.message || error.message
        }`,
      };
    }
  }

  /**
   * Timeout (mute) a user in a guild.
   */
  async timeoutUser(params: {
    guildId: string;
    channelId: string; // Used for sending public notification
    userId: string;
    duration: string;
    reason: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const durationMs = ms(params.duration);

      if (typeof durationMs !== "number" || durationMs <= 0) {
        return {
          success: false,
          message: `Invalid or out-of-range duration: ${params.duration}.`,
        };
      }

      const maxDurationMs = ms("28d");
      if (durationMs > maxDurationMs) {
        return {
          success: false,
          message: `Duration ${params.duration} exceeds Discord's 28-day limit`,
        };
      }

      // Modify guild member to apply timeout
      await axios.patch(
        `${DISCORD_API_BASE}/guilds/${params.guildId}/members/${params.userId}`,
        {
          communication_disabled_until: new Date(
            Date.now() + durationMs
          ).toISOString(),
        },
        { headers: this.getAuthHeaders(), params: { reason: params.reason } }
      );

      // Send public notification
      await this.sendEmbedMessage(params.channelId, {
        color: 0xff0000,
        title: "🛑 Moderation Action: User Timed Out",
        description: `User <@${params.userId}> has been timed out for **${params.duration}**.\nReason: ${params.reason}`,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Timed out user ${params.userId} for ${params.duration}. Reason: ${params.reason}`,
      };
    } catch (error: any) {
      let errorMessage = `Failed to timeout user ${params.userId}: ${
        error.response?.data?.message || error.message
      }`;
      if (error.response?.status === 403) {
        errorMessage +=
          ". This is likely due to role hierarchy or insufficient permissions.";
      }
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Send a warning message to a channel.
   */
  async sendWarning(params: {
    channelId: string;
    userId: string;
    reason: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      await this.sendEmbedMessage(params.channelId, {
        color: 0xffa500,
        title: "⚠️ Policy Reminder",
        description: `<@${params.userId}>, please remember to keep discussions respectful and adhere to server rules.\nReason: ${params.reason}`,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Sent warning to user ${params.userId}. Reason: ${params.reason}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send warning to channel ${params.channelId}: ${
          error.response?.data?.message || error.message
        }`,
      };
    }
  }

  /**
   * Send a direct message to a user.
   */
  async sendDm(params: {
    userId: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // First, create a DM channel with the user
      const channelResponse = await axios.post(
        `${DISCORD_API_BASE}/users/@me/channels`,
        { recipient_id: params.userId },
        { headers: this.getAuthHeaders() }
      );
      const channelId = channelResponse.data.id;

      // Then, send the message to that channel
      await this.sendEmbedMessage(channelId, {
        color: 0x00ff00,
        title: "📣 Notification",
        description: params.message,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Sent DM to user ${params.userId}.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to send DM to user ${params.userId}: ${
          error.response?.data?.message || error.message
        }`,
      };
    }
  }

  private async sendEmbedMessage(channelId: string, embed: any): Promise<void> {
    await axios.post(
      `${DISCORD_API_BASE}/channels/${channelId}/messages`,
      { embeds: [embed] },
      { headers: this.getAuthHeaders() }
    );
  }
}
