import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig } from "../utils/hubspotHelpers";

export default class SearchCompaniesTool implements LuaTool {
  name = "searchCompanies";
  description = "Search for companies in HubSpot by name or domain. Returns matching companies with their details.";
  
  inputSchema = z.object({
    query: z.string().describe("Search query - can be company name or domain"),
    searchBy: z.enum(["name", "domain"]).optional().describe("Which field to search by (defaults to name)"),
    limit: z.number().optional().describe("Maximum number of results to return (default 10, max 100)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const limit = Math.min(input.limit || 10, 100);
    const url = `${HUBSPOT_BASE}/crm/v3/objects/companies/search`;

    const searchField = input.searchBy || "name";
    const operator = searchField === "domain" ? "EQ" : "CONTAINS_TOKEN";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: searchField, operator, value: input.query }] }],
          properties: ["name", "domain", "industry", "phone", "city", "state", "country", "numberofemployees", "annualrevenue", "createdate"],
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

      const companies = (responseBody?.results ?? []).map((c) => ({
        id: c.id,
        name: c.properties?.name,
        domain: c.properties?.domain,
        industry: c.properties?.industry,
        phone: c.properties?.phone,
        city: c.properties?.city,
        state: c.properties?.state,
        country: c.properties?.country,
        employees: c.properties?.numberofemployees,
        revenue: c.properties?.annualrevenue,
      }));

      return {
        ok: true,
        total: responseBody?.total ?? 0,
        count: companies.length,
        companies,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
