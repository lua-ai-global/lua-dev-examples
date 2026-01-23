import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig } from "../utils/hubspotHelpers";

export default class GetDealPipelinesTool implements LuaTool {
  name = "getDealPipelines";
  description = "Retrieves all deal pipelines and their stages from HubSpot to help identify valid stage IDs";
  
  inputSchema = z.object({});

  async execute() {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const url = `${HUBSPOT_BASE}/crm/v3/pipelines/deals`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/json",
        },
      });

      const body = await res.json();

      if (!res.ok) {
        return {
          ok: false,
          error: (body as { message?: string })?.message ?? JSON.stringify(body),
        };
      }

      const responseBody = body as {
        results?: Array<{
          id: string;
          label: string;
          stages: Array<{ id: string; label: string; displayOrder: number }>;
        }>;
      };

      return {
        ok: true,
        pipelines: responseBody?.results ?? [],
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
