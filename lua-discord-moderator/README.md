# Lua - Discord Community Assistant

A friendly community helper bot for the Lua Discord server, built with `lua-cli`. This example showcases **all major lua-cli features** in a single project.

## Features Demonstrated

| Feature | Implementation |
|---------|---------------|
| **LuaAgent** | Unified agent configuration |
| **LuaSkill** | Community assistance skill |
| **LuaTool** | 5 custom tools |
| **LuaMCPServer** | lua-dev-docs (SSE transport) |
| **LuaWebhook** | Welcome new members |
| **LuaJob** | Weekly tips (static cron job) |
| **Jobs API** | User reminders (dynamic) |
| **PreProcessor** | Help request detection |
| **PostProcessor** | Add documentation links |
| **User API** | Builder profile tracking |
| **Data API** | Save/search forum posts |
| **CDN API** | Upload code examples |

## How It Works

### Bot → Agent Communication

```
Discord (WebSocket) → Bot (Discord.js) → Lua API → Agent → Response → Discord
```

### When Does the Agent Respond?

The bot only forwards messages that need attention:

| Trigger | Action |
|---------|--------|
| **DM to bot** | Always respond |
| **Message in #ask-lua** | Always respond |
| **@Lua mention** | Always respond |
| **New forum post** | Search for similar resolved posts |
| **Forum post resolved** | Save to knowledge base |
| **New member joins** | Send welcome DM |

### Forum Integration

- **New post created** → Agent searches knowledge base for similar questions
- **Post marked "Resolved"** → Agent saves the Q&A to help future users

## Project Structure

```
lua-discord-moderator/
├── agent/                    # Lua CLI agent
│   └── src/
│       ├── index.ts          # LuaAgent configuration
│       ├── skills/
│       │   └── community.skill.ts
│       ├── tools/
│       │   ├── SavePostTool.ts      # Data API
│       │   ├── SearchPostsTool.ts   # Vector search
│       │   ├── SetReminderTool.ts   # Jobs API
│       │   ├── GetProfileTool.ts    # User API
│       │   └── UploadExampleTool.ts # CDN API
│       ├── mcp/
│       │   └── lua-docs.ts          # MCP Server
│       ├── webhooks/
│       │   └── new-member.ts
│       ├── jobs/
│       │   └── weekly-tip.ts
│       ├── preprocessors/
│       │   └── help-detector.ts
│       ├── postprocessors/
│       │   └── add-docs-link.ts
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
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Create Public Threads`, `Read Message History`, `Manage Threads`
7. Use the generated URL to invite bot to your server

### 2. Configure Discord Server

1. Create a channel called `#ask-lua`
2. Create a forum channel for questions
3. In the forum, create a tag called `Resolved`
4. Create a channel for tips (e.g., `#tips`)

### 3. Deploy the Agent

```bash
cd agent
npm install

# Set environment variables
lua env sandbox
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
LUA_API_KEY=your_lua_api_key
LUA_API_URL=https://api.heylua.ai
ASK_LUA_CHANNEL_NAME=ask-lua
RESOLVED_TAG_NAME=Resolved
```

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

## Environment Variables

### Agent (lua env)

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Discord bot token (for tools that call Discord API) |
| `TIPS_CHANNEL_ID` | Channel ID for weekly tips job |

### Bot (.env)

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `LUA_AGENT_ID` | Your Lua agent ID |
| `LUA_API_KEY` | Your Lua API key |
| `LUA_API_URL` | Lua API URL (default: https://api.heylua.ai) |
| `ASK_LUA_CHANNEL_NAME` | Channel name to monitor (default: ask-lua) |
| `RESOLVED_TAG_NAME` | Forum tag name for resolved posts (default: Resolved) |

## Tools

| Tool | API | Description |
|------|-----|-------------|
| `save_post` | Data | Save resolved forum posts with vector indexing |
| `search_posts` | Data | Semantic search through past solutions |
| `set_reminder` | Jobs | Create user reminders (dynamic jobs) |
| `get_profile` | User | Get/update builder profile |
| `upload_example` | CDN | Upload files to share |

## MCP Server

The agent connects to `https://docs.heylua.ai/mcp` to answer questions about lua-cli directly from the documentation.

```typescript
new LuaMCPServer({
  name: "lua-docs",
  transport: "sse",
  url: "https://docs.heylua.ai/mcp",
});
```

## Webhooks

**New Member Webhook:**
```
POST https://api.heylua.ai/webhooks/{agent_id}/new-member
{
  "userId": "discord_user_id",
  "guildId": "discord_guild_id",
  "username": "optional_username"
}
```

## Learn More

- [lua-cli Documentation](https://docs.heylua.ai)
- [Discord.js Guide](https://discordjs.guide/)
- [Discord Developer Portal](https://discord.com/developers/docs)
