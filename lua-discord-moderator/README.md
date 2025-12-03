# Lua - Discord Community Assistant

A friendly community helper bot for the Lua Discord server, built with `lua-cli`. This example showcases **all major lua-cli features** in a single project.

## Features Demonstrated

| Feature | Implementation |
|---------|---------------|
| **LuaAgent** | Unified agent configuration |
| **LuaSkill** | Community assistance skill |
| **LuaTool** | 4 custom tools (with conditions) |
| **LuaMCPServer** | lua-dev-docs (SSE transport) |
| **LuaWebhook** | Welcome new members |
| **LuaJob** | Weekly tips (static cron job) |
| **Jobs API** | User reminders (dynamic) |
| **PreProcessor** | Rate limiting, Analytics |
| **PostProcessor** | Add documentation links |
| **User API** | Discord ID sync, rate limits |
| **Data API** | Save/search forum posts |

## How It Works

### Bot → Agent Communication

```
Discord (WebSocket) → Bot (Discord.js) → Lua API → Agent → Response → Discord
```

### Session Strategy

| Context | Session ID | Behavior |
|---------|------------|----------|
| **DMs** | `discord-dm-{userId}` | Personal conversation history |
| **Threads** | `discord-thread-{threadId}` | Shared context (all users) |
| **Channels** | `discord-channel-{userId}` | Per-user in public spaces |

This means in forum threads, all users share the same conversation context - the agent sees the full discussion!

### When Does the Agent Respond?

| Trigger | Action |
|---------|--------|
| **DM to bot** | Always respond |
| **Message in #ask-lua** | Always respond |
| **@Lua mention** | Always respond |
| **New forum post** | Search for similar resolved posts |
| **Forum post resolved** | Save to knowledge base |
| **New member joins** | Send welcome DM (via webhook) |

## Project Structure

```
lua-discord-moderator/
├── agent/                    # Lua CLI agent
│   └── src/
│       ├── index.ts          # LuaAgent configuration
│       ├── skills/
│       │   └── community.skill.ts
│       ├── tools/
│       │   ├── SavePostTool.ts      # Data API (conditional)
│       │   ├── SearchPostsTool.ts   # Vector search
│       │   ├── SetReminderTool.ts   # Jobs API + User API
│       │   └── MarkResolvedTool.ts  # Discord API (conditional)
│       ├── mcp/
│       │   └── lua-docs.ts          # MCP Server
│       ├── webhooks/
│       │   └── new-member.ts
│       ├── jobs/
│       │   └── weekly-tip.ts
│       ├── preprocessors/
│       │   ├── rate-limiter.ts      # Per-user DM rate limiting
│       │   └── analytics.ts         # Interaction tracking
│       ├── postprocessors/
│       │   └── add-docs-link.ts
│       ├── utils/
│       │   └── discord-context.ts   # Context helper
│       └── services/
│           └── DiscordService.ts
└── bot/                      # Discord bot
    └── src/
        └── bot.ts            # Event handling & forwarding
```

## Setup

### 1. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section → Create bot
4. Enable these **Privileged Gateway Intents**:
   - Message Content Intent
   - Server Members Intent
5. Copy the bot token
6. Go to "OAuth2" → "URL Generator"
   - Select scopes: `bot`
   - Select permissions: See below

**Required Bot Permissions:**
- Read Messages/View Channels
- Send Messages
- Send Messages in Threads
- Read Message History
- **Manage Threads** (for adding Resolved tag)

**Permission Integer:** `326417591296`

Invite URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=326417591296&scope=bot
```

### 2. Configure Discord Server

1. Create a channel called `#ask-lua`
2. Create a forum channel for questions
3. In the forum, create a tag called `Resolved`
4. Create a channel for tips (e.g., `#tips`)

### 3. Deploy the Agent

```bash
cd agent
npm install

# Set environment variables for production
lua env production
# Add: DISCORD_BOT_TOKEN, TIPS_CHANNEL_ID

# Push and deploy
lua push all --force --auto-deploy

# Activate MCP server
lua mcp activate lua-docs
```

### 4. Run the Bot

Create `bot/.env`:
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
LUA_AGENT_ID=your_agent_id
LUA_API_URL=https://api.heylua.ai
LUA_WEBHOOK_URL=https://webhook.heylua.ai
ASK_LUA_CHANNEL_NAME=ask-lua
RESOLVED_TAG_NAME=Resolved
```

> **Note:** No `LUA_API_KEY` needed! The bot uses session-based authentication with `x-session-id` header.

Run locally:
```bash
cd bot
npm install
npm run dev
```

Or with Docker:
```bash
cd bot
docker-compose up --build
```

Or deploy to Fly.io:
```bash
cd bot
fly launch
fly secrets set DISCORD_BOT_TOKEN=xxx LUA_AGENT_ID=xxx
fly deploy
```

## Environment Variables

### Agent (lua env production)

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Discord bot token (for tools that call Discord API) |
| `TIPS_CHANNEL_ID` | Channel ID for weekly tips job |

### Bot (.env)

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `LUA_AGENT_ID` | Your Lua agent ID |
| `LUA_API_URL` | Lua API URL (default: https://api.heylua.ai) |
| `LUA_WEBHOOK_URL` | Webhook URL (default: https://webhook.heylua.ai) |
| `ASK_LUA_CHANNEL_NAME` | Channel name to monitor (default: ask-lua) |
| `RESOLVED_TAG_NAME` | Forum tag name for resolved posts (default: Resolved) |

## Tools

| Tool | API | Condition | Description |
|------|-----|-----------|-------------|
| `save_post` | Data | `trigger === "forum_resolved"` | Save resolved forum posts |
| `search_posts` | Data | None | Semantic search through past solutions |
| `set_reminder` | Jobs + User | None | Create reminders with DM delivery |
| `mark_resolved` | Discord | `isThread && trigger === "mention"` | Add Resolved tag to forum threads |

## PreProcessors

| Name | Priority | Description |
|------|----------|-------------|
| `rate-limiter` | 1 | Per-user rate limiting for DMs (5/min) |
| `analytics` | 10 | Track interactions, sync Discord ID to user profile |

## PostProcessor

**add-docs-link**: Appends relevant documentation links to responses based on detected topics (100+ topic mappings).

## MCP Server

The agent connects to `https://docs.heylua.ai/mcp` to answer questions about lua-cli directly from the documentation.

```typescript
new LuaMCPServer({
  name: "lua-docs",
  transport: "sse",
  url: "https://docs.heylua.ai/mcp",
});
```

## Context Passing

Discord context is passed to the agent via a single `DISCORD_REQUEST_CONTEXT` JSON env variable:

```typescript
// bot.ts
envOverride: {
  DISCORD_REQUEST_CONTEXT: JSON.stringify({
    channelId, channelName, channelType, guildId,
    authorId, authorTag, messageId, isThread, parentId, trigger
  })
}

// In agent tools/preprocessors
import { getDiscordContext } from "../utils/discord-context";
const ctx = getDiscordContext();
// ctx.authorId, ctx.trigger, ctx.isThread, etc.
```

## Learn More

- [lua-cli Documentation](https://docs.heylua.ai)
- [Discord.js Guide](https://discordjs.guide/)
- [Discord Developer Portal](https://discord.com/developers/docs)
