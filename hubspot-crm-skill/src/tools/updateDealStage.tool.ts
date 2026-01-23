import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig } from "../utils/hubspotHelpers";

async function getDealById(dealId: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/crm/v3/objects/deals/${dealId}?properties=dealname,dealstage,amount,closedate,pipeline`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false, error: (body as { message?: string })?.message ?? JSON.stringify(body) };
    }
    return { ok: true, deal: body as Record<string, unknown> };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export default class UpdateDealStageTool implements LuaTool {
  name = "updateDealStage";
  description = "Updates the stage of an existing deal in HubSpot CRM, typically after a sales call or meeting";
  
  inputSchema = z.object({
    dealId: z.string().describe("The HubSpot Deal ID to update"),
    dealstage: z.string().describe("The new deal stage ID (e.g., 'qualifiedtobuy', 'closedwon', or numeric ID like '139921')"),
    notes: z.string().optional().describe("Optional notes about why the stage was updated"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const currentDeal = await getDealById(input.dealId, TOKEN, HUBSPOT_BASE);
    if (!currentDeal.ok) {
      return { ok: false, error: `Could not find deal with ID ${input.dealId}: ${currentDeal.error}` };
    }

    const url = `${HUBSPOT_BASE}/crm/v3/objects/deals/${input.dealId}`;
    const properties = { dealstage: input.dealstage };

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ properties }),
      });

      const body = await res.json();

      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: (body as { message?: string })?.message ?? JSON.stringify(body),
        };
      }

      const responseBody = body as { id?: string; properties?: Record<string, string> };
      return {
        ok: true,
        id: responseBody?.id,
        properties: responseBody?.properties ?? {},
        message: `Successfully updated deal stage to '${input.dealstage}'`,
        previousDeal: currentDeal.deal,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
