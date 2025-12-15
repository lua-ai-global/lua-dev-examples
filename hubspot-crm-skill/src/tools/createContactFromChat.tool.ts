import { LuaTool, env } from "lua-cli";
import { z } from "zod";

async function searchContactByEmail(email: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/crm/v3/objects/contacts/search`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
        properties: ["email", "firstname", "lastname", "phone", "company"],
      }),
    });
    const body = await res.json() as { results?: Array<{ id?: string; properties?: Record<string, string> }> };
    if (res.ok && body.results && body.results.length > 0) {
      return { ok: true, contactId: body.results[0].id, contact: body.results[0] };
    }
    return { ok: true, contactId: undefined };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function createContact(properties: Record<string, string>, token: string, baseUrl: string) {
  const url = `${baseUrl}/crm/v3/objects/contacts`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ properties }),
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false, error: (body as { message?: string })?.message ?? JSON.stringify(body) };
    }
    const responseBody = body as { id?: string; properties?: Record<string, string> };
    return { ok: true, id: responseBody?.id, properties: responseBody?.properties ?? {} };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export default class CreateContactFromChatTool implements LuaTool {
  name = "createContactFromChat";
  description = "Creates a HubSpot contact from information gathered during an inbound chat conversation";
  
  inputSchema = z.object({
    email: z.string().email().describe("Email address extracted from chat conversation"),
    firstname: z.string().optional().describe("First name mentioned in chat"),
    lastname: z.string().optional().describe("Last name mentioned in chat"),
    phone: z.string().optional().describe("Phone number if provided in chat"),
    company: z.string().optional().describe("Company name if mentioned in chat"),
    chatSummary: z.string().optional().describe("Brief summary of the chat conversation for context"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const TOKEN = env("HUBSPOT_PRIVATE_APP_TOKEN");
    const HUBSPOT_BASE = (env("HUBSPOT_API_BASE_URL") || "https://api.hubapi.com").replace(/\/+$/, "");

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const existingContact = await searchContactByEmail(input.email, TOKEN, HUBSPOT_BASE);
    if (existingContact.ok && existingContact.contactId) {
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

    const result = await createContact(properties, TOKEN, HUBSPOT_BASE);

    if (result.ok) {
      return {
        ...result,
        alreadyExists: false,
        message: `Successfully created new contact from chat: ${input.email}`,
        chatSummary: input.chatSummary,
      };
    }

    return result;
  }
}
