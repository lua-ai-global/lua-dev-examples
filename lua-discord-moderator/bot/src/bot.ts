import { Client, GatewayIntentBits, Message } from "discord.js";
import axios from "axios";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Discord Moderation Bot
 *
 * This bot sets up a WebSocket connection to Discord and forwards messages
 * to the Lua AI agent. The agent handles all analysis and moderation actions.
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Get configuration from environment
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const LUA_AGENT_ID = process.env.LUA_AGENT_ID;
const LUA_API_KEY = process.env.LUA_API_KEY;
const LUA_API_URL = process.env.LUA_API_URL || "https://api.heylua.ai";
const LUA_WEBHOOK_URL = `${LUA_API_URL}/webhooks/${LUA_AGENT_ID}/member-join-webhook`;

if (!DISCORD_BOT_TOKEN) {
  throw new Error("DISCORD_BOT_TOKEN is required in .env file");
}
if (!LUA_AGENT_ID) {
  throw new Error("LUA_AGENT_ID is required in .env file");
}
if (!LUA_API_KEY) {
  throw new Error("LUA_API_KEY is required in .env file");
}

/**
 * Forwards message to Lua AI agent for analysis and moderation.
 * The agent handles everything: analysis, decision-making, and executing actions.
 */
async function forwardToAgent(message: Message) {
  try {
    const response = await axios.post(
      `${LUA_API_URL}/chat/generate/${LUA_AGENT_ID}`,
      {
        messages: [
          {
            type: "text",
            text: message.content,
          },
        ],
        runtimeContext: `
      messageId: ${message.id},
      channelId: ${message.channel.id},
      guildId: ${message.guild?.id},
      authorTag: ${message.author.tag},
      authorId: ${message.author.id},
      `,
      },
      {
        headers: {
          Authorization: `Bearer ${LUA_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`[FORWARDED] Message from ${message.author.tag}`);
    console.log(`[RESPONSE] ${response.data.text}`);
  } catch (error: any) {
    console.error("Error forwarding to Lua AI agent:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

// Event: Bot is ready
client.once("ready", () => {
  console.log(`✅ Discord Moderation Bot is online as ${client.user?.tag}!`);
  console.log(`🤖 Forwarding messages to Lua AI Agent: ${LUA_AGENT_ID}`);
});

// Event: New message received
client.on("messageCreate", async (message: Message) => {
  if (message.author.bot || !message.guild) return;
  console.log(`\n[MESSAGE] ${message.author.tag}: ${message.content}`);
  await forwardToAgent(message);
});

// Event: New member joins the server
client.on("guildMemberAdd", async (member) => {
  console.log(`\n[NEW MEMBER] ${member.user.tag} has joined the server.`);

  try {
    const webhookPayload = {
      userId: member.id,
      guildId: member.guild.id,
    };

    // Call the agent's webhook endpoint
    await axios.post(LUA_WEBHOOK_URL, webhookPayload, {
      headers: {
        "Content-Type": "application/json",
        // No auth is needed if the webhook's verifySignature is false
      },
    });

    console.log(
      `[WEBHOOK] Notified agent about new member: ${member.user.tag}`
    );
  } catch (error: any) {
    console.error("Error calling member-join-webhook:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
});

// Event: Handle errors
client.on("error", (error) => {
  console.error("Discord client error:", error);
});

// Start the bot
console.log("🚀 Starting Discord Moderation Bot...");
client.login(DISCORD_BOT_TOKEN);
