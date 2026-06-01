import { LuaMCPServer } from "lua-cli";

/**
 * MCP Server for Lua Dev Docs
 *
 * Connects to the hosted lua-dev-docs MCP server to provide
 * documentation search capabilities to the agent.
 */
const luaDocsMCP = new LuaMCPServer({
  name: "lua-docs",
  transport: "sse",
  url: "https://docs.heylua.ai/mcp",
});

export default luaDocsMCP;

