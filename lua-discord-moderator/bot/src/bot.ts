/**
 * Lua Community Discord Bot
 * 
 * Connects Discord to the Lua AI agent for community assistance.
 * 
 * ============================================================
 * REQUIRED DISCORD BOT PERMISSIONS
 * ============================================================
 * 
 * The bot needs these permissions in the Discord server:
 * 
 * General:
 * - Read Messages/View Channels    - To see messages in channels
 * - Send Messages                  - To respond to users
 * - Send Messages in Threads       - To respond in forum threads
 * - Read Message History           - To read thread content
 * 
 * For Forum Features:
 * - Manage Threads                 - To add "Resolved" tag to forum posts
 * 
 * For DM Features:
 * - (No special permission needed, users must share a server with the bot)
 * 
 * Privileged Gateway Intents (enable in Discord Developer Portal):
 * - Message Content Intent         - To read message content
 * - Server Members Intent          - To detect new member joins
 * 
 * Permission Integer: 326417591296
 * (Use this when creating the bot invite link)
 * 
 * Invite URL format:
 * https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=326417591296&scope=bot
 * 
 * ============================================================
 */

import {
  Client,
  GatewayIntentBits,
  Message,
  ThreadChannel,
  ChannelType,
  ForumChannel,
  Partials,
} from "discord.js";
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// CONFIGURATION
// ============================================================

const config = {
  // Discord
  botToken: process.env.DISCORD_BOT_TOKEN!,
  askLuaChannel: process.env.ASK_LUA_CHANNEL_NAME || "ask-lua",
  resolvedTag: process.env.RESOLVED_TAG_NAME || "Resolved",

  // Lua API
  agentId: process.env.LUA_AGENT_ID!,
  apiUrl: process.env.LUA_API_URL || "https://api.heylua.ai",
  webhookUrl: process.env.LUA_WEBHOOK_URL || "https://webhook.heylua.ai",

  // Retry settings
  maxRetries: 3,
  retryDelay: 1000,
};

// Validate required config
function validateConfig() {
  const required = ["botToken", "agentId"] as const;
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => {
      const envName = {
        botToken: "DISCORD_BOT_TOKEN",
        agentId: "LUA_AGENT_ID",
      }[key];
      console.error(`   - ${envName}`);
    });
    process.exit(1);
  }
}

// ============================================================
// LOGGING
// ============================================================

const log = {
  info: (msg: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] INFO: ${msg}`, data || "");
  },
  error: (msg: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, error || "");
  },
  debug: (msg: string, data?: any) => {
    if (process.env.DEBUG) {
      console.log(`[${new Date().toISOString()}] DEBUG: ${msg}`, data || "");
    }
  },
};

// ============================================================
// DISCORD CLIENT
// ============================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ============================================================
// API HELPERS
// ============================================================

/**
 * Call Lua API using session-based authentication.
 * Each Discord user gets their own session (via x-session-id header),
 * which means each user has their own conversation history!
 */
async function callLuaApi(
  endpoint: string,
  data: any,
  sessionId: string,
  retries = config.maxRetries
): Promise<any> {
  try {
    const response = await axios.post(`${config.apiUrl}${endpoint}`, data, {
      headers: {
        "x-session-id": sessionId, // Session-based auth - each Discord user gets their own session
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    // Don't retry on 4xx errors
    if (axiosError.response?.status && axiosError.response.status < 500) {
      log.error(`API error (${axiosError.response.status})`, axiosError.response.data);
      throw error;
    }

    // Retry on network/5xx errors
    if (retries > 0) {
      log.info(`Retrying API call... (${retries} attempts left)`);
      await sleep(config.retryDelay);
      return callLuaApi(endpoint, data, sessionId, retries - 1);
    }

    throw error;
  }
}

async function callWebhook(webhookName: string, data: any): Promise<any> {
  const url = `${config.webhookUrl}/${config.agentId}/${webhookName}`;
  try {
    const response = await axios.post(url, data, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    log.error(`Webhook error (${webhookName})`, error);
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface DiscordContext {
  channelId: string;
  channelName: string;
  channelType: string;
  guildId: string;
  authorId: string;
  authorTag: string;
  messageId: string;
  isThread: boolean;
  parentId?: string; // Parent channel ID for threads
  trigger: string;
}

function buildEnvOverride(ctx: DiscordContext): Record<string, string> {
  return {
    DISCORD_REQUEST_CONTEXT: JSON.stringify(ctx),
  };
}

/**
 * Determine the session ID based on context.
 * - DMs: Per-user (personal conversation history)
 * - Threads: Per-thread (collaborative, all users share context)
 * - Channels: Per-user (individual context in public spaces)
 */
function getSessionId(ctx: DiscordContext): string {
  if (ctx.trigger === "dm") {
    // DMs are personal - each user has their own history
    return `discord-dm-${ctx.authorId}`;
  }
  
  if (ctx.isThread) {
    // Threads are collaborative - all users share the same context
    return `discord-thread-${ctx.channelId}`;
  }
  
  // Channel messages - per-user context
  return `discord-channel-${ctx.authorId}`;
}

/**
 * Format message with context prefix so the agent knows who sent it and from where
 */
function formatMessageWithContext(trigger: string, authorTag: string, channelName: string, content: string): string {
  switch (trigger) {
    case "dm":
      return `[DM from ${authorTag}] ${content}`;
    case "mention":
      return `[@mention in #${channelName} | ${authorTag}] ${content}`;
    case "ask-lua":
    case "ask-lua-thread":
      return `[#${channelName} | ${authorTag}] ${content}`;
    case "new_forum_post":
      return `[New Forum Post | ${authorTag}] ${content}`;
    case "forum_resolved":
      return `[Forum Resolved | ${authorTag}] ${content}`;
    default:
      return `[${authorTag}] ${content}`;
  }
}

// ============================================================
// MESSAGE HANDLING
// ============================================================

// Track recently created threads to prevent double-response
const recentlyCreatedThreads = new Set<string>();

function shouldForwardMessage(message: Message): { forward: boolean; reason: string } {
  if (message.author.bot) return { forward: false, reason: "bot" };

  // DMs
  if (message.channel.type === ChannelType.DM) {
    return { forward: true, reason: "dm" };
  }

  // @mention
  if (client.user && message.mentions.has(client.user)) {
    return { forward: true, reason: "mention" };
  }

  // #ask-lua channel
  if ("name" in message.channel && message.channel.name === config.askLuaChannel) {
    return { forward: true, reason: "ask-lua" };
  }

  // Thread in #ask-lua
  if (message.channel.isThread()) {
    // Skip if this is a newly created forum thread (handled by threadCreate)
    if (recentlyCreatedThreads.has(message.channel.id)) {
      return { forward: false, reason: "new-thread-handled" };
    }

    const parent = message.channel.parent;
    if (parent && "name" in parent && parent.name === config.askLuaChannel) {
      return { forward: true, reason: "ask-lua-thread" };
    }
    // Forum thread - only respond to @mentions (already handled above)
  }

  return { forward: false, reason: "ignored" };
}

async function forwardToAgent(message: Message, context: Record<string, any> = {}) {
  const channelName = "name" in message.channel ? message.channel.name : "dm";
  const channelType = ChannelType[message.channel.type];
  const trigger = context.triggerReason || "unknown";

  const isThread = message.channel.isThread();
  const discordCtx: DiscordContext = {
    channelId: message.channel.id,
    channelName: channelName || "unknown",
    channelType,
    guildId: message.guild?.id || "",
    authorId: message.author.id,
    authorTag: message.author.tag,
    messageId: message.id,
    isThread,
    parentId: isThread ? (message.channel as ThreadChannel).parentId || undefined : undefined,
    trigger,
  };

  // Format message with context prefix so agent knows who sent it
  const formattedMessage = formatMessageWithContext(
    trigger,
    message.author.tag,
    channelName || "dm",
    message.content
  );

  try {
    const sessionId = getSessionId(discordCtx);
    
    const response = await callLuaApi(
      `/chat/generate/${config.agentId}`,
      {
        messages: [{ type: "text", text: formattedMessage }],
        runtimeContext: JSON.stringify({ source: "discord", ...discordCtx, ...context }),
        envOverride: buildEnvOverride(discordCtx),
      },
      sessionId
    );

    if (response.text) {
      await sendResponse(message, response.text);
    }

    return response;
  } catch (error) {
    log.error(`Failed to forward message from ${message.author.tag}`, error);
  }
}

async function sendResponse(original: Message, text: string) {
  try {
    const maxLength = 2000;
    const truncated = text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;

    // DM or existing thread - reply directly
    if (original.channel.type === ChannelType.DM || original.channel.isThread()) {
      await original.reply(truncated);
      return;
    }

    // Channel message - create thread
    try {
      const threadName = original.content.substring(0, 50) || "Help";
      const thread = await original.startThread({
        name: `💬 ${threadName}${threadName.length >= 50 ? "..." : ""}`,
        autoArchiveDuration: 60,
      });
      await thread.send(truncated);
    } catch {
      await original.reply(truncated);
    }
  } catch (error) {
    log.error("Failed to send Discord response", error);
  }
}

// ============================================================
// FORUM HANDLING
// ============================================================

async function handleNewForumThread(thread: ThreadChannel) {
  log.info(`New forum thread: ${thread.name}`);

  // Mark as handled to prevent messageCreate from also responding
  recentlyCreatedThreads.add(thread.id);
  setTimeout(() => recentlyCreatedThreads.delete(thread.id), 5000);

  await sleep(1500); // Wait for starter message

  try {
    const starter = await thread.fetchStarterMessage();
    if (!starter) return;

    const discordCtx: DiscordContext = {
      channelId: thread.id,
      channelName: thread.name,
      channelType: "GuildForum",
      guildId: thread.guildId || "",
      authorId: starter.author.id,
      authorTag: starter.author.tag,
      messageId: starter.id,
      isThread: true,
      trigger: "new_forum_post",
    };

    // Format message with context - agent will search for similar posts
    const formattedMessage = formatMessageWithContext(
      "new_forum_post",
      starter.author.tag,
      thread.name,
      `Title: ${thread.name}\n\n${starter.content}`
    );

    // Forum threads use thread-based sessions - all users share context
    const sessionId = `discord-thread-${thread.id}`;

    const response = await callLuaApi(
      `/chat/generate/${config.agentId}`,
      {
        messages: [{ type: "text", text: formattedMessage }],
        runtimeContext: JSON.stringify({
          source: "discord",
          eventType: "new_forum_post",
          ...discordCtx,
          parentId: thread.parentId,
        }),
        envOverride: buildEnvOverride(discordCtx),
      },
      sessionId
    );

    if (response.text) {
      await thread.send(response.text);
    }
  } catch (error) {
    log.error(`Failed to handle new forum thread: ${thread.name}`, error);
  }
}

async function handleResolvedThread(thread: ThreadChannel) {
  log.info(`Thread resolved: ${thread.name}`);

  try {
    const messages = await thread.messages.fetch({ limit: 50 });
    const sorted = [...messages.values()].sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp
    );

    if (sorted.length === 0) return;

    const firstMsg = sorted[0];
    const lastMessages = sorted
      .slice(-5)
      .map((m) => `${m.author.tag}: ${m.content}`)
      .join("\n\n");

    const discordCtx: DiscordContext = {
      channelId: thread.id,
      channelName: thread.name,
      channelType: "GuildForum",
      guildId: thread.guildId || "",
      authorId: firstMsg.author.id,
      authorTag: firstMsg.author.tag,
      messageId: firstMsg.id,
      isThread: true,
      trigger: "forum_resolved",
    };

    // Format message with context - agent will save to knowledge base
    const formattedMessage = formatMessageWithContext(
      "forum_resolved",
      firstMsg.author.tag,
      thread.name,
      `Title: ${thread.name}\n\nQuestion: ${firstMsg.content}\n\nDiscussion:\n${lastMessages}`
    );

    // Forum threads use thread-based sessions - all users share context
    const sessionId = `discord-thread-${thread.id}`;

    const response = await callLuaApi(
      `/chat/generate/${config.agentId}`,
      {
        messages: [{ type: "text", text: formattedMessage }],
        runtimeContext: JSON.stringify({
          source: "discord",
          eventType: "forum_post_resolved",
          ...discordCtx,
          threadUrl: `https://discord.com/channels/${thread.guildId}/${thread.id}`,
        }),
        envOverride: buildEnvOverride(discordCtx),
      },
      sessionId
    );

    if (response.text) {
      await thread.send(response.text);
    }
  } catch (error) {
    log.error(`Failed to save resolved thread: ${thread.name}`, error);
  }
}

function hasResolvedTag(thread: ThreadChannel): boolean {
  if (!thread.appliedTags?.length) return false;

  const parent = thread.parent;
  if (parent?.type !== ChannelType.GuildForum) return false;

  const forum = parent as ForumChannel;
  const tag = forum.availableTags.find(
    (t) => t.name.toLowerCase() === config.resolvedTag.toLowerCase()
  );

  return tag ? thread.appliedTags.includes(tag.id) : false;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

client.once("ready", () => {
  log.info(`Bot online as ${client.user?.tag}`);
  log.info(`Agent: ${config.agentId}`);
  log.info(`Monitoring: DMs, #${config.askLuaChannel}, @mentions, forums`);
});

client.on("messageCreate", async (message) => {
  const { forward, reason } = shouldForwardMessage(message);
  if (!forward) return;

  log.debug(`[${reason}] ${message.author.tag}: ${message.content.substring(0, 50)}`);
  await forwardToAgent(message, { triggerReason: reason });
});

client.on("threadCreate", async (thread) => {
  if (thread.parent?.type !== ChannelType.GuildForum) return;
  await handleNewForumThread(thread);
});

client.on("threadUpdate", async (oldThread, newThread) => {
  if (newThread.parent?.type !== ChannelType.GuildForum) return;

  const wasResolved = hasResolvedTag(oldThread as ThreadChannel);
  const isResolved = hasResolvedTag(newThread as ThreadChannel);

  if (!wasResolved && isResolved) {
    await handleResolvedThread(newThread as ThreadChannel);
  }
});

client.on("guildMemberAdd", async (member) => {
  log.info(`New member: ${member.user.tag}`);
  try {
    await callWebhook("new-member", {
      userId: member.id,
      guildId: member.guild.id,
      username: member.user.tag,
    });
  } catch {
    // Webhook errors are already logged
  }
});

client.on("error", (error) => log.error("Discord client error", error));
client.on("warn", (msg) => log.info("Discord warning", msg));

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

async function shutdown(signal: string) {
  log.info(`Received ${signal}, shutting down...`);
  client.destroy();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  log.error("Unhandled rejection", reason);
});

process.on("uncaughtException", (error) => {
  log.error("Uncaught exception", error);
  process.exit(1);
});

// ============================================================
// START
// ============================================================

validateConfig();
log.info("Starting Lua Community Bot...");
client.login(config.botToken);
