import { env } from "lua-cli";

export function getHubSpotConfig() {
  const token = env("HUBSPOT_PRIVATE_APP_TOKEN");
  const baseUrl = (env("HUBSPOT_API_BASE_URL") || "https://api.hubapi.com").replace(/\/+$/, "");
  return { token, baseUrl };
}

export interface ListFilter {
  propertyName: string;
  operator: string;
  value: string;
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
    const body = (await res.json()) as { results?: Array<{ id?: string; properties?: Record<string, string> }>; message?: string };

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

export async function createMarketingList(
  name: string,
  filters: ListFilter[] | undefined,
  dynamic: boolean,
  token: string,
  baseUrl: string,
) {
  const url = `${baseUrl}/contacts/v3/lists`;
  const body: Record<string, unknown> = {
    name,
    dynamic,
  };
  if (filters && filters.length) {
    body.filters = filters.map((filter) => ({
      propertyName: filter.propertyName,
      operator: filter.operator,
      value: filter.value,
    }));
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    const parsed = (await res.json()) as { listId?: number; message?: string };
    if (!res.ok) {
      return { ok: false as const, error: parsed.message || `HubSpot API error: ${res.status}` };
    }
    return { ok: true as const, listId: parsed.listId };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function refreshMarketingList(listId: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/contacts/v3/lists/${listId}/refresh`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const parsed = await res.json();
      return { ok: false as const, error: parsed?.message ?? `HubSpot API error: ${res.status}` };
    }
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function enrollContactsInWorkflow(
  workflowId: string,
  contactIds: string[],
  token: string,
  baseUrl: string,
) {
  const results: Array<{ contactId: string; ok: boolean; error?: string }> = [];
  for (const contactId of contactIds) {
    try {
      const url = `${baseUrl}/automation/v3/workflows/${workflowId}/enrollments/contacts/${contactId}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const parsed = await res.json();
        results.push({
          contactId,
          ok: false,
          error: parsed?.message ?? `HubSpot API error: ${res.status}`,
        });
        continue;
      }
      results.push({ contactId, ok: true });
    } catch (err: unknown) {
      results.push({
        contactId,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

export async function summarizeCampaignROI(limit: number, token: string, baseUrl: string) {
  const url = `${baseUrl}/analytics/v2/reports/campaigns?limit=${limit}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false as const, error: body?.message ?? `HubSpot API error: ${res.status}` };
    }
    const metrics = Array.isArray(body?.objects) ? body.objects : [];
    const summary = metrics.map((metric: any) => ({
      campaignId: metric.id,
      name: metric.name,
      closeRevenue: metric.metrics?.closeRevenue,
      contacts: metric.metrics?.contactCount,
    }));
    return { ok: true as const, summary };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function listMarketingLists(token: string, baseUrl: string, count = 25) {
  const url = `${baseUrl}/contacts/v3/lists?count=${count}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false as const, error: body?.message ?? `HubSpot API error: ${res.status}` };
    }
    const lists: Array<{ listId?: number; name?: string; dynamic?: boolean }> = Array.isArray(body?.lists)
      ? body.lists
      : [];
    return { ok: true as const, lists };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getWorkflowDetails(workflowId: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/automation/v3/workflows/${workflowId}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const body = await res.json();
    if (!res.ok) {
      return { ok: false as const, error: body?.message ?? `HubSpot API error: ${res.status}` };
    }
    return { ok: true as const, workflow: body };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function pauseWorkflow(workflowId: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/automation/v3/workflows/${workflowId}/actions/pause`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const body = await res.json();
      return { ok: false as const, error: body?.message ?? `HubSpot API error: ${res.status}` };
    }
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function resumeWorkflow(workflowId: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/automation/v3/workflows/${workflowId}/actions/reactivate`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const body = await res.json();
      return { ok: false as const, error: body?.message ?? `HubSpot API error: ${res.status}` };
    }
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}
