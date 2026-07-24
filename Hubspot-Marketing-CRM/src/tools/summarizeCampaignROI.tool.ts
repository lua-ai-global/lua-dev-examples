import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, summarizeCampaignROI } from "../utils/hubspotMarketingHelpers";

export default class SummarizeCampaignROITool implements LuaTool {
  name = "summarizeCampaignROI";
  description =
    "Gathers the latest campaign ROI data (revenue, contacts, and performance indicators) so you can explain marketing impact to stakeholders.";

  inputSchema = z.object({
    limit: z.number().int().positive().optional().describe("Maximum number of campaigns to include in the summary (default 5)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token, baseUrl } = getHubSpotConfig();
    if (!token) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const response = await summarizeCampaignROI(input.limit ?? 5, token, baseUrl);
    if (!response.ok) {
      return { ok: false, error: response.error };
    }

    return {
      ok: true,
      campaigns: response.summary,
      message: "Campaign ROI summary retrieved.",
    };
  }
}
