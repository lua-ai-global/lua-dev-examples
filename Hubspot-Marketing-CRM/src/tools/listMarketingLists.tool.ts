import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, listMarketingLists } from "../utils/hubspotMarketingHelpers";

export default class ListMarketingListsTool implements LuaTool {
  name = "listMarketingLists";
  description = "Returns a list of marketing audiences so you can understand what's available before building automation.";

  inputSchema = z.object({
    limit: z.number().int().positive().optional().describe("Maximum number of lists to return (default 25)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token, baseUrl } = getHubSpotConfig();
    if (!token) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const response = await listMarketingLists(token, baseUrl, input.limit ?? 25);
    if (!response.ok) {
      return { ok: false, error: response.error };
    }

    return {
      ok: true,
      lists: response.lists,
      message: `Retrieved ${response.lists.length} marketing lists.`,
    };
  }
}
