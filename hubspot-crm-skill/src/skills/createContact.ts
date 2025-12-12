// src/skills/createContact.ts
import fetch from "node-fetch";

export type CreateInput = {
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
};

const HUBSPOT_BASE =
  (process.env.HUBSPOT_API_BASE_URL || "https://api.hubapi.com").replace(/\/+$/, "");

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;

export default async function createContact(input: CreateInput) {
  if (!TOKEN) {
    return {
      ok: false,
      error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment.",
    };
  }

  const properties: Record<string, any> = {};

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

    const body: any = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: body?.message ?? JSON.stringify(body),
      };
    }

    return {
      ok: true,
      id: body?.id,
      properties: body?.properties ?? {},
      raw: body,
    };
  } catch (err: any) {
    return { ok: false, error: err.message ?? String(err) };
  }
}