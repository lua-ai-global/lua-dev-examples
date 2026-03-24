import { PostProcessor, UserDataInstance } from "lua-cli";

/**
 * PostProcessor that adds relevant documentation links to responses.
 * Makes it easy for users to dive deeper into topics.
 */
const addDocsLinkPostProcessor = new PostProcessor({
  name: "add-docs-link",
  description: "Adds relevant documentation links to responses",
  execute: async (
    user: UserDataInstance,
    message: string,
    response: string,
    channel: string
  ) => {
    // Skip if response is very short (likely an error or simple acknowledgment)
    if (response.length < 100) {
      return { modifiedResponse: response };
    }

    // Comprehensive topic to documentation URL mapping
    // Includes variations and common ways users might mention these topics
    const topicLinks: Record<string, string> = {
      // ============================================
      // CORE CLASSES
      // ============================================

      // LuaAgent
      LuaAgent: "https://docs.heylua.ai/api/luaagent",
      "Lua Agent": "https://docs.heylua.ai/api/luaagent",
      "new LuaAgent": "https://docs.heylua.ai/api/luaagent",
      "agent configuration": "https://docs.heylua.ai/api/luaagent",

      // LuaSkill
      LuaSkill: "https://docs.heylua.ai/api/luaskill",
      "Lua Skill": "https://docs.heylua.ai/api/luaskill",
      "new LuaSkill": "https://docs.heylua.ai/api/luaskill",
      "skill configuration": "https://docs.heylua.ai/api/luaskill",

      // LuaTool
      LuaTool: "https://docs.heylua.ai/api/luatool",
      "Lua Tool": "https://docs.heylua.ai/api/luatool",
      "implements LuaTool": "https://docs.heylua.ai/api/luatool",
      inputSchema: "https://docs.heylua.ai/api/luatool",

      // LuaWebhook
      LuaWebhook: "https://docs.heylua.ai/api/luawebhook",
      "Lua Webhook": "https://docs.heylua.ai/api/luawebhook",
      "new LuaWebhook": "https://docs.heylua.ai/api/luawebhook",
      "webhook URL": "https://docs.heylua.ai/api/luawebhook",
      webhooks: "https://docs.heylua.ai/overview/webhooks",

      // LuaJob
      LuaJob: "https://docs.heylua.ai/api/luajob",
      "Lua Job": "https://docs.heylua.ai/api/luajob",
      "new LuaJob": "https://docs.heylua.ai/api/luajob",
      "scheduled job": "https://docs.heylua.ai/api/luajob",
      "cron job": "https://docs.heylua.ai/api/luajob",
      "cron pattern": "https://docs.heylua.ai/api/luajob",

      // LuaMCPServer
      LuaMCPServer: "https://docs.heylua.ai/api/luamcpserver",
      "MCP Server": "https://docs.heylua.ai/api/luamcpserver",
      "MCP server": "https://docs.heylua.ai/api/luamcpserver",
      "Model Context Protocol": "https://docs.heylua.ai/api/luamcpserver",
      "stdio transport": "https://docs.heylua.ai/api/luamcpserver",
      "sse transport": "https://docs.heylua.ai/api/luamcpserver",

      // PreProcessor
      PreProcessor: "https://docs.heylua.ai/api/preprocessor",
      "Pre Processor": "https://docs.heylua.ai/api/preprocessor",
      preprocessor: "https://docs.heylua.ai/api/preprocessor",
      preProcessors: "https://docs.heylua.ai/api/preprocessor",
      "message filtering": "https://docs.heylua.ai/api/preprocessor",

      // PostProcessor
      PostProcessor: "https://docs.heylua.ai/api/postprocessor",
      "Post Processor": "https://docs.heylua.ai/api/postprocessor",
      postprocessor: "https://docs.heylua.ai/api/postprocessor",
      postProcessors: "https://docs.heylua.ai/api/postprocessor",
      "response formatting": "https://docs.heylua.ai/api/postprocessor",

      // ============================================
      // PLATFORM APIs
      // ============================================

      // Data API
      "Data API": "https://docs.heylua.ai/api/data",
      "Data.create": "https://docs.heylua.ai/api/data",
      "Data.search": "https://docs.heylua.ai/api/data",
      "Data.get": "https://docs.heylua.ai/api/data",
      "Data.update": "https://docs.heylua.ai/api/data",
      "Data.delete": "https://docs.heylua.ai/api/data",
      "vector search": "https://docs.heylua.ai/api/data",
      "semantic search": "https://docs.heylua.ai/api/data",
      DataEntryInstance: "https://docs.heylua.ai/api/data",

      // User API
      "User API": "https://docs.heylua.ai/api/user",
      "User.get": "https://docs.heylua.ai/api/user",
      UserDataInstance: "https://docs.heylua.ai/api/user",
      "user.save": "https://docs.heylua.ai/api/user",
      "user profile": "https://docs.heylua.ai/api/user",

      // CDN API
      "CDN API": "https://docs.heylua.ai/api/cdn",
      "CDN.upload": "https://docs.heylua.ai/api/cdn",
      "CDN.get": "https://docs.heylua.ai/api/cdn",
      "file upload": "https://docs.heylua.ai/api/cdn",
      "file storage": "https://docs.heylua.ai/api/cdn",

      // Products API
      "Products API": "https://docs.heylua.ai/api/products",
      "Products.search": "https://docs.heylua.ai/api/products",
      "Products.create": "https://docs.heylua.ai/api/products",
      "Products.getById": "https://docs.heylua.ai/api/products",
      ProductInstance: "https://docs.heylua.ai/api/products",

      // Baskets API
      "Baskets API": "https://docs.heylua.ai/api/baskets",
      "Baskets.create": "https://docs.heylua.ai/api/baskets",
      "Baskets.addItem": "https://docs.heylua.ai/api/baskets",
      "Baskets.placeOrder": "https://docs.heylua.ai/api/baskets",
      BasketInstance: "https://docs.heylua.ai/api/baskets",
      "shopping cart": "https://docs.heylua.ai/api/baskets",

      // Orders API
      "Orders API": "https://docs.heylua.ai/api/orders",
      "Orders.create": "https://docs.heylua.ai/api/orders",
      OrderInstance: "https://docs.heylua.ai/api/orders",
      OrderStatus: "https://docs.heylua.ai/api/orders",
      "order management": "https://docs.heylua.ai/api/orders",

      // Jobs API (dynamic)
      "Jobs API": "https://docs.heylua.ai/api/jobs",
      "Jobs.create": "https://docs.heylua.ai/api/jobs",
      "dynamic job": "https://docs.heylua.ai/api/jobs",
      "jobInstance.user": "https://docs.heylua.ai/api/jobs",

      // Templates API
      "Templates API": "https://docs.heylua.ai/api/templates",
      "Templates.whatsapp": "https://docs.heylua.ai/api/templates",
      "WhatsApp template": "https://docs.heylua.ai/api/templates",
      "template message": "https://docs.heylua.ai/api/templates",

      // AI API
      "AI API": "https://docs.heylua.ai/api/ai",
      "AI.generate": "https://docs.heylua.ai/api/ai",

      // ============================================
      // CLI COMMANDS
      // ============================================

      "lua init": "https://docs.heylua.ai/cli/skill-management",
      "lua compile": "https://docs.heylua.ai/cli/skill-management",
      "lua test": "https://docs.heylua.ai/cli/skill-management",
      "lua push": "https://docs.heylua.ai/cli/skill-management",
      "lua deploy": "https://docs.heylua.ai/cli/skill-management",
      "lua chat": "https://docs.heylua.ai/cli/chat-command",
      "lua env": "https://docs.heylua.ai/cli/env-command",
      "lua persona": "https://docs.heylua.ai/cli/persona-command",
      "lua features": "https://docs.heylua.ai/cli/features-command",
      "lua skills": "https://docs.heylua.ai/cli/skills-command",
      "lua logs": "https://docs.heylua.ai/cli/logs-command",
      "lua mcp": "https://docs.heylua.ai/cli/mcp-command",
      "lua production": "https://docs.heylua.ai/cli/production-command",
      "lua channels": "https://docs.heylua.ai/cli/cli-management",
      "lua auth": "https://docs.heylua.ai/cli/authentication",
      "lua completion": "https://docs.heylua.ai/cli/utility-commands",
      "lua admin": "https://docs.heylua.ai/cli/utility-commands",
      "lua docs": "https://docs.heylua.ai/cli/utility-commands",
      "lua marketplace": "https://docs.heylua.ai/marketplace/overview",

      // ============================================
      // CONCEPTS
      // ============================================

      "skills and tools": "https://docs.heylua.ai/concepts/skills-and-tools",
      "platform APIs": "https://docs.heylua.ai/concepts/platform-apis",
      "environment variables": "https://docs.heylua.ai/concepts/environment-variables",
      workflows: "https://docs.heylua.ai/concepts/workflows",

      // ============================================
      // GETTING STARTED
      // ============================================

      "quick start": "https://docs.heylua.ai/getting-started/quick-start",
      quickstart: "https://docs.heylua.ai/getting-started/quick-start",
      "getting started": "https://docs.heylua.ai/getting-started/quick-start",
      "first skill": "https://docs.heylua.ai/getting-started/first-skill",
      "first tool": "https://docs.heylua.ai/getting-started/first-skill",

      // ============================================
      // CHANNELS
      // ============================================

      WhatsApp: "https://docs.heylua.ai/channels/whatsapp",
      "WhatsApp Business": "https://docs.heylua.ai/channels/whatsapp",
      Facebook: "https://docs.heylua.ai/channels/facebook-messenger",
      "Facebook Messenger": "https://docs.heylua.ai/channels/facebook-messenger",
      Instagram: "https://docs.heylua.ai/channels/instagram",
      Slack: "https://docs.heylua.ai/channels/slack",
      Email: "https://docs.heylua.ai/channels/email",
      "HTTP API": "https://docs.heylua.ai/channels/http-api",
      "quick testing": "https://docs.heylua.ai/channels/quick-testing",

      // ============================================
      // CHAT WIDGET
      // ============================================

      LuaPop: "https://docs.heylua.ai/chat-widget/introduction",
      "chat widget": "https://docs.heylua.ai/chat-widget/introduction",
      "embed widget": "https://docs.heylua.ai/chat-widget/quick-start",
      "voice chat": "https://docs.heylua.ai/chat-widget/voice-chat",

      // ============================================
      // FORMATTING (Rich Responses)
      // ============================================

      "rich formatting": "https://docs.heylua.ai/formatting/introduction",
      "rich responses": "https://docs.heylua.ai/formatting/introduction",
      "list-item": "https://docs.heylua.ai/formatting/list-item",
      "image gallery": "https://docs.heylua.ai/formatting/images",

      // ============================================
      // EXAMPLES & DEMOS
      // ============================================

      examples: "https://docs.heylua.ai/examples/overview",
      demos: "https://docs.heylua.ai/demos/overview",
      "e-commerce": "https://docs.heylua.ai/demos/ecommerce-assistant",
      "customer support": "https://docs.heylua.ai/demos/customer-support",

      // ============================================
      // ENVIRONMENT & CONFIG
      // ============================================

      "env()": "https://docs.heylua.ai/api/environment",
      ".env file": "https://docs.heylua.ai/concepts/environment-variables",
      "lua.skill.yaml": "https://docs.heylua.ai/template/project-structure",
      "project structure": "https://docs.heylua.ai/template/project-structure",

      // ============================================
      // VALIDATION
      // ============================================

      Zod: "https://docs.heylua.ai/api/luatool",
      "zod schema": "https://docs.heylua.ai/api/luatool",
      "z.object": "https://docs.heylua.ai/api/luatool",
      validation: "https://docs.heylua.ai/api/luatool",

      // ============================================
      // MARKETPLACE
      // ============================================

      marketplace: "https://docs.heylua.ai/marketplace/overview",
      "install skill": "https://docs.heylua.ai/marketplace/installer-guide",
      "publish skill": "https://docs.heylua.ai/marketplace/publisher-guide",

      // ============================================
      // TROUBLESHOOTING
      // ============================================

      troubleshooting: "https://docs.heylua.ai/cli/troubleshooting",
      debugging: "https://docs.heylua.ai/cli/troubleshooting",
      "common errors": "https://docs.heylua.ai/cli/troubleshooting",
    };

    const detectedTopics: string[] = [];
    const seenUrls = new Set<string>();

    // Check for topics in the response (case-sensitive for code-like terms)
    for (const topic of Object.keys(topicLinks)) {
      if (response.includes(topic)) {
        const url = topicLinks[topic];
        // Avoid duplicate URLs
        if (!seenUrls.has(url)) {
          detectedTopics.push(topic);
          seenUrls.add(url);
        }
      }
    }

    // If we detected topics, add a docs section
    if (detectedTopics.length > 0) {
      const links = detectedTopics
        .slice(0, 3) // Limit to 3 links
        .map((topic) => `• [${topic}](${topicLinks[topic]})`)
        .join("\n");

      const docsSection = `\n\n📚 **Related Docs:**\n${links}`;

      return { modifiedResponse: response + docsSection };
    }

    return { modifiedResponse: response };
  },
});

export default addDocsLinkPostProcessor;
