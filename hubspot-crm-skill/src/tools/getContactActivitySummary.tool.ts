import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, searchContactByEmail } from "../utils/hubspotHelpers";

type EngagementType = "calls" | "emails" | "notes" | "tasks" | "meetings";

async function getContactAssociations(contactId: string, engagementType: EngagementType, token: string, baseUrl: string): Promise<string[]> {
  const url = `${baseUrl}/crm/v4/objects/contacts/${contactId}/associations/${engagementType}`;
  try {
    const res = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (!res.ok) return [];
    const body = await res.json() as { results?: Array<{ toObjectId?: string }> };
    return (body.results ?? []).map((r) => r.toObjectId ?? "").filter(Boolean);
  } catch { return []; }
}

function getPropertiesForType(type: EngagementType): string[] {
  switch (type) {
    case "calls": return ["hs_call_title", "hs_call_body", "hs_call_status", "hs_createdate"];
    case "emails": return ["hs_email_subject", "hs_email_text", "hs_createdate"];
    case "notes": return ["hs_note_body", "hs_createdate"];
    case "tasks": return ["hs_task_subject", "hs_task_status", "hs_createdate"];
    case "meetings": return ["hs_meeting_title", "hs_meeting_outcome", "hs_createdate"];
    default: return ["hs_createdate"];
  }
}

async function getEngagementDetails(engagementType: EngagementType, engagementId: string, token: string, baseUrl: string) {
  const properties = getPropertiesForType(engagementType);
  const url = `${baseUrl}/crm/v3/objects/${engagementType}/${engagementId}?properties=${properties.join(",")}`;
  try {
    const res = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json() as Record<string, unknown>;
  } catch { return null; }
}

function extractEngagementInfo(type: EngagementType, data: Record<string, unknown>) {
  const props = (data.properties ?? {}) as Record<string, string>;
  const id = (data.id as string) ?? "";
  switch (type) {
    case "calls": return { id, createdAt: props.hs_createdate, subject: props.hs_call_title };
    case "emails": return { id, createdAt: props.hs_createdate, subject: props.hs_email_subject };
    case "notes": return { id, createdAt: props.hs_createdate, body: props.hs_note_body };
    case "tasks": return { id, createdAt: props.hs_createdate, subject: props.hs_task_subject, status: props.hs_task_status };
    case "meetings": return { id, createdAt: props.hs_createdate, subject: props.hs_meeting_title };
    default: return { id, createdAt: props.hs_createdate };
  }
}

export default class GetContactActivitySummaryTool implements LuaTool {
  name = "getContactActivitySummary";
  description = "Summarizes a contact's recent marketing and sales activity including calls, emails, notes, tasks, and meetings";
  
  inputSchema = z.object({
    contactId: z.string().optional().describe("HubSpot Contact ID to get activity for"),
    email: z.string().email().optional().describe("Email address to search for contact (alternative to contactId)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token: TOKEN, baseUrl: HUBSPOT_BASE } = getHubSpotConfig();

    if (!TOKEN) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    let contactId = input.contactId;

    if (!contactId && input.email) {
      const searchResult = await searchContactByEmail(input.email, TOKEN, HUBSPOT_BASE);
      if (!searchResult.ok) {
        return { ok: false, error: `Failed to search for contact: ${searchResult.error}` };
      }
      if (!searchResult.contactId) {
        return { ok: false, error: `No contact found with email ${input.email}` };
      }
      contactId = searchResult.contactId;
    }

    if (!contactId) {
      return { ok: false, error: "Either contactId or email must be provided" };
    }

    try {
      const contactUrl = `${HUBSPOT_BASE}/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname`;
      const contactRes = await fetch(contactUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      });

      if (!contactRes.ok) {
        const errorBody = await contactRes.json() as { message?: string };
        return { ok: false, error: errorBody?.message ?? "Contact not found" };
      }

      const contactData = await contactRes.json() as {
        id?: string;
        properties?: { email?: string; firstname?: string; lastname?: string };
      };

      const engagementTypes: EngagementType[] = ["calls", "emails", "notes", "tasks", "meetings"];
      const summaries: Record<EngagementType, { count: number; items: Array<Record<string, unknown>> }> = {
        calls: { count: 0, items: [] },
        emails: { count: 0, items: [] },
        notes: { count: 0, items: [] },
        tasks: { count: 0, items: [] },
        meetings: { count: 0, items: [] },
      };

      const allItems: Array<{ type: EngagementType; createdAt?: string }> = [];

      for (const engType of engagementTypes) {
        const associationIds = await getContactAssociations(contactId, engType, TOKEN, HUBSPOT_BASE);
        const recentIds = associationIds.slice(0, 5);
        for (const engId of recentIds) {
          const details = await getEngagementDetails(engType, engId, TOKEN, HUBSPOT_BASE);
          if (details) {
            const info = extractEngagementInfo(engType, details);
            summaries[engType].items.push(info);
            allItems.push({ type: engType, createdAt: info.createdAt });
          }
        }
        summaries[engType].count = associationIds.length;
      }

      allItems.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      const totalEngagements = summaries.calls.count + summaries.emails.count + summaries.notes.count + summaries.tasks.count + summaries.meetings.count;
      const recentActivity = allItems[0] ? `Most recent: ${allItems[0].type} on ${allItems[0].createdAt ?? "unknown date"}` : "No recent activity found";
      const contactName = [contactData.properties?.firstname, contactData.properties?.lastname].filter(Boolean).join(" ") || "Unknown";

      return {
        ok: true,
        contactId: contactData.id,
        contactName,
        email: contactData.properties?.email,
        summary: { calls: summaries.calls, emails: summaries.emails, notes: summaries.notes, tasks: summaries.tasks, meetings: summaries.meetings, totalEngagements, recentActivity },
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { ok: false, error: errorMessage };
    }
  }
}
