import { LuaWebhook, env } from "lua-cli";
import { z } from "zod";
import DiscordService from "../services/DiscordService";

/**
 * Webhook triggered when a new member joins the Discord server.
 * Sends a welcome DM with getting started resources.
 */
const newMemberWebhook = new LuaWebhook({
  name: "new-member",
  description: "Welcome new members to the Lua Discord community",
  bodySchema: z.object({
    userId: z.string(),
    guildId: z.string(),
    username: z.string().optional(),
  }),
  execute: async (event) => {
    try {
      const welcomeMessage = `Hey! 👋 Welcome to the **Lua Community**

I'm Lua, the community assistant. Congrats on taking the first step toward building AI agents!

## 🚀 5-Minute Quickstart

\`\`\`bash
npm i -g lua-cli      # Install
lua auth configure    # Login (use email)
lua init              # Create project
lua chat              # Test your agent
\`\`\`

That's it - you'll have an AI agent running locally in minutes.

## 📚 Core Concepts

Lua is built on three building blocks:
• **LuaAgent** - Your agent's configuration (persona, skills, webhooks, jobs)
• **LuaSkill** - A collection of related tools with context
• **LuaTool** - A single function the AI can call (connect to any API!)

## ⚡ Development Flow

\`\`\`bash
lua chat              # Test locally (sandbox mode)
lua push && lua deploy  # Ship to production
\`\`\`

Live reload, TypeScript, Zod validation - real developer tools for building AI.

## 🔗 Resources

• **Docs**: https://docs.heylua.ai
• **Quick Start**: https://docs.heylua.ai/getting-started/quick-start
• **30+ Examples**: https://docs.heylua.ai/examples/overview
• **API Reference**: https://docs.heylua.ai/api/overview

## 💬 Need Help?

Drop your questions in **#ask-lua** - I'm always here to help! You can also @mention me anywhere on the server.

What are you planning to build? I'd love to hear about it! 🛠️`;

      const botToken = env("DISCORD_BOT_TOKEN");
      if (!botToken) {
        throw new Error("DISCORD_BOT_TOKEN is not set");
      }

      const discordService = new DiscordService(botToken);
      await discordService.sendDm({
        userId: event.body.userId,
        message: welcomeMessage,
      });

      return {
        success: true,
        message: `Welcomed ${event.body.username || event.body.userId} to the community`,
      };
    } catch (error: any) {
      console.error("Error in new-member webhook:", error);
      return {
        success: false,
        error: error.message || "Failed to send welcome message",
      };
    }
  },
});

export default newMemberWebhook;
