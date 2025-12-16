import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, searchContactByEmail } from "../utils/hubspotHelpers";

export default class CreateContactTool implements LuaTool {
  name = "createContact";
  description = "Creates a new contact in HubSpot CRM. Automatically checks for existing contacts by email before creating to prevent duplicates.";
  
  inputSchema = z.object({
    email: z.string().email().describe("Contact's email address (required for duplicate prevention)"),
    firstname: z.string().optional().describe("Contact's first name"),
    lastname: z.string().optional().describe("Contact's last name"),
    phone: z.string().optional().describe("Contact's phone number"),
    company: z.string().optional().describe("Company name the contact is associated with"),
    chatSummary: z.string().optional().describe("Optional context about how this contact was acquired"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const existingContact = await searchContactByEmail(input.email, TOKEN, HUBSPOT_BASE);
    
    if (!existingContact.ok) {
      return { ok: false, error: `Duplicate check failed: ${existingContact.error}. Cannot safely create contact.` };
    }
    
    if (existingContact.contactId) {
      return {
        ok: true,
        alreadyExists: true,
        contactId: existingContact.contactId,
        message: `Contact with email ${input.email} already exists in HubSpot`,
        contact: existingContact.contact,
      };
    }

    const properties: Record<string, string> = { email: input.email };
    if (input.firstname) properties.firstname = input.firstname;
    if (input.lastname) properties.lastname = input.lastname;
    if (input.phone) properties.phone = input.phone;
    if (input.company) properties.company = input.company;

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
        alreadyExists: false,
        id: responseBody?.id,
        properties: responseBody?.properties ?? {},
        message: `Successfully created new contact: ${input.email}`,
        chatSummary: input.chatSummary,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
