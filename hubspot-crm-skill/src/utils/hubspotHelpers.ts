import { env } from "lua-cli";

export function getHubSpotConfig() {
  const token = env("HUBSPOT_PRIVATE_APP_TOKEN");
  const baseUrl = (env("HUBSPOT_API_BASE_URL") || "https://api.hubapi.com").replace(/\/+$/, "");
  return { token, baseUrl };
}

export async function searchContactByEmail(email: string, token: string, baseUrl: string) {
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
    const body = await res.json() as { results?: Array<{ id?: string; properties?: Record<string, string> }>; message?: string };
    
    if (!res.ok) {
      return { ok: false as const, error: body.message || `HubSpot API error: ${res.status}` };
    }
    
    if (body.results && body.results.length > 0) {
      return { ok: true as const, contactId: body.results[0].id, contact: body.results[0] };
    }
    return { ok: true as const, contactId: undefined };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function searchCompanyByDomain(domain: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/crm/v3/objects/companies/search`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "domain", operator: "EQ", value: domain }] }],
        properties: ["name", "domain", "industry", "phone", "city", "state", "country"],
      }),
    });
    const body = await res.json() as { results?: Array<{ id?: string; properties?: Record<string, string> }>; message?: string };
    
    if (!res.ok) {
      return { ok: false as const, error: body.message || `HubSpot API error: ${res.status}` };
    }
    
    if (body.results && body.results.length > 0) {
      return { ok: true as const, companyId: body.results[0].id, company: body.results[0] };
    }
    return { ok: true as const, companyId: undefined };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}
