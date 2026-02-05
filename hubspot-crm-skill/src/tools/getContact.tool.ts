import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig } from "../utils/hubspotHelpers";

export default class GetContactTool implements LuaTool {
  name = "getContact";
  description = "Get full details of a specific contact by their HubSpot ID";
  
  inputSchema = z.object({
    contactId: z.string().describe("The HubSpot Contact ID to retrieve"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const properties = [
      "email", "firstname", "lastname", "phone", "company",
      "jobtitle", "website", "city", "state", "country",
      "lifecyclestage", "hs_lead_status",
      "createdate", "lastmodifieddate", "notes_last_updated"
    ].join(",");

    const url = `${HUBSPOT_BASE}/crm/v3/objects/contacts/${input.contactId}?properties=${properties}`;

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

      const responseBody = body as { id?: string; properties?: Record<string, string>; createdAt?: string; updatedAt?: string };

      return {
        ok: true,
        contact: {
          id: responseBody?.id,
          email: responseBody?.properties?.email,
          firstname: responseBody?.properties?.firstname,
          lastname: responseBody?.properties?.lastname,
          phone: responseBody?.properties?.phone,
          company: responseBody?.properties?.company,
          jobtitle: responseBody?.properties?.jobtitle,
          website: responseBody?.properties?.website,
          city: responseBody?.properties?.city,
          state: responseBody?.properties?.state,
          country: responseBody?.properties?.country,
          lifecyclestage: responseBody?.properties?.lifecyclestage,
          leadStatus: responseBody?.properties?.hs_lead_status,
          createdAt: responseBody?.properties?.createdate,
          lastModified: responseBody?.properties?.lastmodifieddate,
        },
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
