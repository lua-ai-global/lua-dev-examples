import { LuaTool, env } from "lua-cli";
import { z } from "zod";

export default class CreateContactTool implements LuaTool {
  name = "createContact";
  description = "Creates a new contact in HubSpot CRM with the provided properties";
  
  inputSchema = z.object({
    email: z.string().email().optional().describe("Contact's email address (recommended for unique identification)"),
    firstname: z.string().optional().describe("Contact's first name"),
    lastname: z.string().optional().describe("Contact's last name"),
    phone: z.string().optional().describe("Contact's phone number"),
    company: z.string().optional().describe("Company name the contact is associated with"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const TOKEN = env("HUBSPOT_PRIVATE_APP_TOKEN");
    const HUBSPOT_BASE = (env("HUBSPOT_API_BASE_URL") || "https://api.hubapi.com").replace(/\/+$/, "");

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const properties: Record<string, string> = {};
    if (input.email) properties.email = input.email;
    if (input.firstname) properties.firstname = input.firstname;
    if (input.lastname) properties.lastname = input.lastname;
    if (input.phone) properties.phone = input.phone;
    if (input.company) properties.company = input.company;

    if (Object.keys(properties).length === 0) {
      return { ok: false, error: "No properties provided." };
    }

    const url = `${HUBSPOT_BASE}/crm/v3/objects/contacts`;

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
        id: responseBody?.id,
        properties: responseBody?.properties ?? {},
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
