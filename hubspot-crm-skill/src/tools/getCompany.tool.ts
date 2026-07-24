import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig } from "../utils/hubspotHelpers";

export default class GetCompanyTool implements LuaTool {
  name = "getCompany";
  description = "Get full details of a specific company by their HubSpot ID";
  
  inputSchema = z.object({
    companyId: z.string().describe("The HubSpot Company ID to retrieve"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const properties = [
      "name", "domain", "industry", "phone", "website",
      "city", "state", "country", "address",
      "numberofemployees", "annualrevenue", "description",
      "lifecyclestage", "hs_lead_status",
      "createdate", "hs_lastmodifieddate"
    ].join(",");

    const url = `${HUBSPOT_BASE}/crm/v3/objects/companies/${input.companyId}?properties=${properties}`;

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
          status: res.status,
          error: (body as { message?: string })?.message ?? JSON.stringify(body),
        };
      }

      const responseBody = body as { id?: string; properties?: Record<string, string> };

      return {
        ok: true,
        company: {
          id: responseBody?.id,
          name: responseBody?.properties?.name,
          domain: responseBody?.properties?.domain,
          industry: responseBody?.properties?.industry,
          phone: responseBody?.properties?.phone,
          website: responseBody?.properties?.website,
          city: responseBody?.properties?.city,
          state: responseBody?.properties?.state,
          country: responseBody?.properties?.country,
          address: responseBody?.properties?.address,
          employees: responseBody?.properties?.numberofemployees,
          revenue: responseBody?.properties?.annualrevenue,
          description: responseBody?.properties?.description,
          lifecyclestage: responseBody?.properties?.lifecyclestage,
          leadStatus: responseBody?.properties?.hs_lead_status,
          createdAt: responseBody?.properties?.createdate,
          lastModified: responseBody?.properties?.hs_lastmodifieddate,
        },
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
