import axios, { AxiosInstance } from 'axios';

const SLACK_API_BASE = 'https://slack.com/api';
const GENERAL_CHANNEL_ID = 'C080Y0TKNR3';

/**
 * Slack Service
 * 
 * Handles all Slack API interactions for employee onboarding.
 * This service manages channel announcements, direct messages, and user interactions.
 */
export default class SlackService {
  private client: AxiosInstance;
  private botToken: string;

  constructor(botToken: string) {
    if (!botToken) {
      throw new Error('Slack bot token is required for SlackService');
    }
    this.botToken = botToken;
    
    this.client = axios.create({
      baseURL: SLACK_API_BASE,
      headers: {
        'Authorization': `Bearer ${this.botToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Post a message to a Slack channel
   */
  async postMessage(params: {
    channelId?: string;
    text?: string;
    blocks?: any[];
    threadTs?: string;
  }): Promise<{ success: boolean; message?: string; ts?: string; error?: string }> {
    try {
      if (!params.channelId) {
        params.channelId = GENERAL_CHANNEL_ID;
      }

      const response = await this.client.post('/chat.postMessage', {
        channel: params.channelId,
        text: params.text,
        blocks: params.blocks,
        thread_ts: params.threadTs,
      });

      if (response.data.ok) {
        return {
          success: true,
          message: 'Message posted successfully',
          ts: response.data.ts,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to post message',
        };
      }
    } catch (error: any) {
      console.error('Slack Post Message Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Send a direct message to a user
   */
  async sendDirectMessage(params: {
    userId: string;
    text?: string;
    blocks?: any[];
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Open a DM channel with the user
      const dmResponse = await this.client.post('/conversations.open', {
        users: params.userId,
      });

      if (!dmResponse.data.ok) {
        return {
          success: false,
          error: dmResponse.data.error || 'Failed to open DM channel',
        };
      }

      const channelId = dmResponse.data.channel.id;

      // Send the message
      const messageResponse = await this.client.post('/chat.postMessage', {
        channel: channelId,
        text: params.text,
        blocks: params.blocks,
      });

      if (messageResponse.data.ok) {
        return {
          success: true,
          message: `Direct message sent to user ${params.userId}`,
        };
      } else {
        return {
          success: false,
          error: messageResponse.data.error || 'Failed to send DM',
        };
      }
    } catch (error: any) {
      console.error('Slack Send DM Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }


  /**
   * Get user information from Slack
   */
  async getUserInfo(userId: string): Promise<{ 
    success: boolean; 
    user?: any; 
    error?: string;
  }> {
    try {
      const response = await this.client.get('/users.info', {
        params: { user: userId },
      });

      if (response.data.ok) {
        return {
          success: true,
          user: response.data.user,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to get user info',
        };
      }
    } catch (error: any) {
      console.error('Slack Get User Info Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(params: {
    channelId: string;
    timestamp: string;
    reaction: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.client.post('/reactions.add', {
        channel: params.channelId,
        timestamp: params.timestamp,
        name: params.reaction,
      });

      if (response.data.ok) {
        return {
          success: true,
          message: 'Reaction added successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to add reaction',
        };
      }
    } catch (error: any) {
      console.error('Slack Add Reaction Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(params: {
    channelId: string;
    timestamp: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.client.post('/chat.delete', {
        channel: params.channelId,
        ts: params.timestamp,
      });

      if (response.data.ok) {
        return {
          success: true,
          message: 'Message deleted successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to delete message',
        };
      }
    } catch (error: any) {
      console.error('Slack Delete Message Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Search for users in the workspace by name
   */
  async searchUsers(searchTerm: string): Promise<{ 
    success: boolean; 
    users?: Array<{ id: string; name: string; realName: string; email?: string }>;
    error?: string;
  }> {
    try {
      const response = await this.client.get('/users.list', {
        params: { limit: 1000 }
      });

      if (response.data.ok) {
        const allUsers = response.data.members || [];
        
        // Filter users by search term (case-insensitive match on name, real_name, or display_name)
        const searchLower = searchTerm.toLowerCase();
        const matchedUsers = allUsers
          .filter((user: any) => {
            if (user.deleted || user.is_bot) return false; // Skip deleted users and bots
            
            const name = (user.name || '').toLowerCase();
            const realName = (user.real_name || '').toLowerCase();
            const displayName = (user.profile?.display_name || '').toLowerCase();
            
            return name.includes(searchLower) || 
                   realName.includes(searchLower) || 
                   displayName.includes(searchLower);
          })
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            realName: user.real_name || user.name,
            email: user.profile?.email,
          }));

        return {
          success: true,
          users: matchedUsers,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to search users',
        };
      }
    } catch (error: any) {
      console.error('Slack Search Users Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

