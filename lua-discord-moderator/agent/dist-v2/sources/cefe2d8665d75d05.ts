import { LuaJob, env } from "lua-cli";
import DiscordService from "../services/DiscordService";

const weeklyTipJob = new LuaJob({
  name: "weekly-tip",
  description: "Posts a weekly lua-cli tip to the community",
  schedule: {
    type: "cron",
    expression: "0 9 * * 1", // Every Monday at 9 AM
  },
  execute: async (job) => {
    try {
      const botToken = env("DISCORD_BOT_TOKEN");
      const channelId = env("TIPS_CHANNEL_ID");

      if (!botToken) {
        console.error("DISCORD_BOT_TOKEN not set");
        return { success: false, error: "Missing bot token" };
      }

      if (!channelId) {
        console.error("TIPS_CHANNEL_ID not set");
        return { success: false, error: "Missing channel ID" };
      }

      const tips = [
        {
          title: "🧪 Test Tools Interactively",
          content:
            "Use `lua test` to test individual tools with specific inputs. Select a tool from the list, enter test inputs, and verify the output - perfect for debugging edge cases!",
        },
        {
          title: "💬 Sandbox vs Production Mode",
          content:
            "Running `lua chat` gives you two modes:\n• **Sandbox** - Uses local code + `.env` file (great for development)\n• **Production** - Uses deployed skills + server env vars (for validation)",
        },
        {
          title: "🚀 One-Command Deploy",
          content:
            "Use `lua push all --force --auto-deploy` to push all your skills, webhooks, jobs, processors, and MCP servers at once - then auto-deploy them!",
        },
        {
          title: "🔍 Semantic Vector Search",
          content:
            "The Data API has powerful semantic search:\n```ts\nconst results = await Data.search(\n  'collection',\n  'natural language query',\n  10,    // limit\n  0.7    // score threshold\n);\n```\nFinds similar content even without exact word matches!",
        },
        {
          title: "⏰ Dynamic Jobs with User Context",
          content:
            "Jobs created with `Jobs.create()` from tools automatically capture user context. Use `jobInstance.user()` - no userId required!\n\nPre-defined `LuaJob` runs outside conversations, so use `User.get(userId)` instead.",
        },
        {
          title: "🪝 Webhook URL Formats",
          content:
            "After `lua push webhook`, you get two URL formats:\n• `https://webhook.heylua.ai/{agentId}/{webhookId}`\n• `https://webhook.heylua.ai/{agentId}/{webhook-name}`\n\nBoth work - use whichever is easier to remember!",
        },
        {
          title: "📥 PreProcessor Pipeline",
          content:
            "PreProcessors run in order of **priority** (lowest first). They can:\n• **Block** messages (spam, profanity)\n• **Modify** messages (add context)\n• **Route** messages\n\nIf any preprocessor blocks, the agent never sees the message.",
        },
        {
          title: "📤 PostProcessor Chain",
          content:
            "PostProcessors modify AI responses before sending. Great for:\n• Adding disclaimers\n• Injecting branding\n• Formatting output\n• User personalization\n\nThey also run in priority order - each receives the output of the previous one.",
        },
        {
          title: "🔌 MCP Server Transports",
          content:
            "Connect external tools via MCP servers with two transports:\n• **stdio** - Local process (npm packages, CLI tools)\n• **sse** - Remote server (hosted services)\n\n```ts\nnew LuaMCPServer({\n  name: 'docs',\n  transport: 'sse',\n  url: 'https://mcp.example.com/sse'\n});\n```",
        },
        {
          title: "⚙️ Environment Variables",
          content:
            "Use `lua env sandbox` to manage your `.env` file locally.\nUse `lua env production` to manage server-side env vars via API.\n\nPro tip: Variables load at startup, so restart `lua chat` after changes!",
        },
        {
          title: "✅ Zod Input Validation",
          content:
            "Every tool needs an `inputSchema` using Zod:\n```ts\ninputSchema = z.object({\n  email: z.string().email(),\n  age: z.number().min(0).max(120),\n  priority: z.enum(['low', 'medium', 'high'])\n});\n```\nYou get runtime validation AND TypeScript types!",
        },
        {
          title: "⌨️ Shell Autocomplete",
          content:
            "Enable tab completion for all Lua CLI commands:\n```bash\nlua completion bash >> ~/.bashrc\nsource ~/.bashrc\n```\n\nNow try: `lua pu<TAB>` → `lua push` 🎉",
        },
        {
          title: "📊 View Your Logs",
          content:
            "Use `lua logs` to view and filter logs by component type:\n• Skills\n• Jobs\n• Webhooks\n• Preprocessors\n• Postprocessors\n\nColor-coded and filterable - great for debugging!",
        },
        {
          title: "🤖 LuaAgent Configuration",
          content:
            "In v3.0.0, configure your entire agent in one place:\n```ts\nexport const agent = new LuaAgent({\n  name: 'my-agent',\n  persona: '...',\n  skills: [...],\n  webhooks: [...],\n  jobs: [...],\n  preProcessors: [...],\n  postProcessors: [...],\n  mcpServers: [...]\n});\n```",
        },
        {
          title: "📱 Quick Testing Channels",
          content:
            "Test your agent on WhatsApp, Slack, Facebook, Instagram, or Email without setting up your own channels!\n\nSend `link-me-to:{your-agent-id}` to the Lua bot on any platform to connect your agent instantly.",
        },
      ];

      // Pick a random tip
      const tip = tips[Math.floor(Math.random() * tips.length)];

      const discordService = new DiscordService(botToken);
      await discordService.sendEmbedToChannel(channelId, {
        color: 0x7c3aed, // Purple - Lua brand color
        title: `💡 Weekly Lua Tip: ${tip.title}`,
        description: tip.content,
        footer: {
          text: "Happy building! 🚀 | Reply with questions",
        },
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        tip: tip.title,
        message: "Weekly tip posted!",
      };
    } catch (error: any) {
      console.error("Error posting weekly tip:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

export default weeklyTipJob;
