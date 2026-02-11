import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, refreshMarketingList } from "../utils/hubspotMarketingHelpers";

export default class RefreshMarketingListTool implements LuaTool {
  name = "refreshMarketingList";
  description = "Forces a marketing list to refresh so new contacts that match the filters are evaluated immediately.";

  inputSchema = z.object({
    listId: z.string().min(1).describe("HubSpot list ID to refresh"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token, baseUrl } = getHubSpotConfig();
    if (!token) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const response = await refreshMarketingList(input.listId, token, baseUrl);
    if (!response.ok) {
      return { ok: false, error: response.error };
    }

    return {
      ok: true,
      listId: input.listId,
      message: `List ${input.listId} refresh queued successfully.`,
    };
  }
}
