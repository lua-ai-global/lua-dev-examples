import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, searchCompanyByDomain } from "../utils/hubspotHelpers";

export default class CreateCompanyTool implements LuaTool {
  name = "createCompany";
  description = "Creates a new company in HubSpot CRM. Automatically checks for existing companies by domain before creating to prevent duplicates.";
  
  inputSchema = z.object({
    name: z.string().describe("Company name (required)"),
    domain: z.string().optional().describe("Company website domain (e.g., 'acme.com') - used for duplicate prevention"),
    industry: z.string().optional().describe("Industry the company operates in"),
    phone: z.string().optional().describe("Company phone number"),
    city: z.string().optional().describe("City where company is located"),
    state: z.string().optional().describe("State/region where company is located"),
    country: z.string().optional().describe("Country where company is located"),
    description: z.string().optional().describe("Brief description of the company"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    if (input.domain) {
      const existingCompany = await searchCompanyByDomain(input.domain, TOKEN, HUBSPOT_BASE);
      
      if (!existingCompany.ok) {
        return { ok: false, error: `Duplicate check failed: ${existingCompany.error}. Cannot safely create company.` };
      }
      
      if (existingCompany.companyId) {
        return {
          ok: true,
          alreadyExists: true,
          companyId: existingCompany.companyId,
          message: `Company with domain ${input.domain} already exists in HubSpot`,
          company: existingCompany.company,
        };
      }
    }

    const properties: Record<string, string> = { name: input.name };
    if (input.domain) properties.domain = input.domain;
    if (input.industry) properties.industry = input.industry;
    if (input.phone) properties.phone = input.phone;
    if (input.city) properties.city = input.city;
    if (input.state) properties.state = input.state;
    if (input.country) properties.country = input.country;
    if (input.description) properties.description = input.description;

    const url = `${HUBSPOT_BASE}/crm/v3/objects/companies`;

    try {
      const res = await fetch(url, {
        method: "POST",
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
        alreadyExists: false,
        id: responseBody?.id,
        properties: responseBody?.properties ?? {},
        message: `Successfully created new company: ${input.name}`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
