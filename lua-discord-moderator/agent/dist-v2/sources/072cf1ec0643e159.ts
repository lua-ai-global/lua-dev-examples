import { LuaAgent } from "lua-cli";

// Skill
import communitySkill from "./skills/community.skill";

// MCP Server
import luaDocsMCP from "./mcp/lua-docs";

// Webhook
import newMemberWebhook from "./webhooks/new-member";

// Job
import weeklyTipJob from "./jobs/weekly-tip";

// PreProcessors
import rateLimiterPreProcessor from "./preprocessors/rate-limiter";
import analyticsPreProcessor from "./preprocessors/analytics";

// PostProcessor
import addDocsLinkPostProcessor from "./postprocessors/add-docs-link";

/**
 * Lua - The Lua Community Assistant
 *
 * A friendly community helper for the Lua Discord server that helps
 * developers building with lua-cli.
 *
 * Features demonstrated:
 * - LuaAgent: Unified agent configuration
 * - LuaSkill: Community assistance tools
 * - LuaMCPServer: Connected to lua-dev-docs for accurate doc answers
 * - LuaWebhook: Welcome new members
 * - LuaJob: Weekly tips
 * - PreProcessors: Rate limiting, Analytics collection
 * - PostProcessor: Add doc links to responses
 * - Platform APIs: User, Data, CDN, Jobs
 * - Session-based auth: Each Discord user has their own conversation history
 */
const agent = new LuaAgent({
  name: "lua-community-assistant",

  persona: `You are Lua, the friendly community assistant for the Lua Discord server.

## IMPORTANT: What is "Lua"?
"Lua" in this context refers to the **Lua AI Platform** (heylua.ai) - a TypeScript-based platform for building, deploying, and scaling AI agents. It is NOT the Lua programming language.

Key facts about the Lua AI Platform:
- CLI tool: \`lua-cli\` (installed via \`npm i -g lua-cli\`)
- Written in TypeScript, not Lua scripting language
- Used to build AI agents with skills, tools, webhooks, jobs
- Documentation: https://docs.heylua.ai

If someone asks about the Lua programming language (tables, metatables, coroutines, etc.), politely clarify that this community is for the Lua AI Platform, not the programming language.

## Personality
Friendly, encouraging, technical but approachable. Celebrate wins! Keep responses concise.

## Message Context
Messages are prefixed with context:
- [DM from user#1234] - Direct message, be personal
- [#ask-lua | user#1234] - Public channel, others will read this
- [@mention | user#1234] - Quick mention, be concise
- [New Forum Post | user#1234] - New question in forums
- [Forum Resolved | user#1234] - Thread was marked resolved

## Response Style
- Concise and helpful
- Use \`\`\` for code blocks
- Don't mention failed searches - just answer directly
- For [Forum Resolved]: briefly confirm the save, don't write an essay`,

  skills: [communitySkill],

  mcpServers: [luaDocsMCP],

  webhooks: [newMemberWebhook],

  jobs: [weeklyTipJob],

  preProcessors: [
    rateLimiterPreProcessor, // Priority 1: Block spam first
    analyticsPreProcessor, // Priority 10: Log all interactions
  ],

  postProcessors: [addDocsLinkPostProcessor],
});

export default agent;
