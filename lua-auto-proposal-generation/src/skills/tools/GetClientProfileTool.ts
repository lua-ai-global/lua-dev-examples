import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { safeGetEntry } from '../../utils/data.utils.js';

export class GetClientProfileTool implements LuaTool {
  name = 'get_client_profile';
  description = 'Retrieve a client profile by its ID. Returns full client details including contacts, pain points, and discovery notes.';

  inputSchema = z.object({
    clientId: z.string().describe('The client ID to retrieve'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const entry = await safeGetEntry('clients', input.clientId);

    if (!entry) {
      return { error: `Client with ID "${input.clientId}" not found.` };
    }

    return {
      clientId: entry.id,
      companyName: entry.companyName,
      industry: entry.industry,
      companySize: entry.companySize,
      contacts: entry.contacts,
      painPoints: entry.painPoints,
      budget: entry.budget,
      timeline: entry.timeline,
      notes: entry.notes,
      website: entry.website,
      createdAt: entry.createdAt,
    };
  }
}
