import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig } from "../utils/hubspotMarketingHelpers";

export default class SearchContactsTool implements LuaTool {
  name = "searchContacts";
  description = "Search for contacts in HubSpot by email, name, or company. Returns matching contacts with their details.";
  
  inputSchema = z.object({
    query: z.string().describe("Search query - can be email, name, or company name"),
    searchBy: z.enum(["email", "firstname", "lastname", "company"]).optional().describe("Which field to search by (defaults to searching email first, then name)"),
    limit: z.number().optional().describe("Maximum number of results to return (default 10, max 100)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const limit = Math.min(input.limit || 10, 100);
    const url = `${HUBSPOT_BASE}/crm/v3/objects/contacts/search`;

    let filters: Array<{ propertyName: string; operator: string; value: string }> = [];

    if (input.searchBy) {
      filters = [{ propertyName: input.searchBy, operator: "CONTAINS_TOKEN", value: input.query }];
    } else {
      if (input.query.includes("@")) {
        filters = [{ propertyName: "email", operator: "EQ", value: input.query }];
      } else {
        filters = [
          { propertyName: "firstname", operator: "CONTAINS_TOKEN", value: input.query },
        ];
      }
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          filterGroups: [{ filters }],
          properties: ["email", "firstname", "lastname", "phone", "company", "createdate", "lastmodifieddate"],
          limit,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        return {
          ok: false,
          error: (body as { message?: string })?.message ?? JSON.stringify(body),
        };
      }

      const responseBody = body as {
        total?: number;
        results?: Array<{ id?: string; properties?: Record<string, string> }>;
      };

      const contacts = (responseBody?.results ?? []).map((c) => ({
        id: c.id,
        email: c.properties?.email,
        firstname: c.properties?.firstname,
        lastname: c.properties?.lastname,
        phone: c.properties?.phone,
        company: c.properties?.company,
      }));

      return {
        ok: true,
        total: responseBody?.total ?? 0,
        count: contacts.length,
        contacts,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
