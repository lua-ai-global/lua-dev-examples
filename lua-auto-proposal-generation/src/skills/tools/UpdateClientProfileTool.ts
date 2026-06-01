import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { safeGetEntry } from '../../utils/data.utils.js';

export class UpdateClientProfileTool implements LuaTool {
  name = 'update_client_profile';
  description = 'Update an existing client profile. Can modify contacts, pain points, budget, timeline, notes, or any other field. Merges with existing data.';

  inputSchema = z.object({
    clientId: z.string().describe('Client ID to update'),
    companyName: z.string().optional().describe('Updated company name'),
    industry: z.string().optional().describe('Updated industry'),
    companySize: z.string().optional().describe('Updated size: startup, small, medium, large, or enterprise'),
    addContact: z.object({
      name: z.string(),
      title: z.string(),
      email: z.string(),
      phone: z.string().optional(),
      isPrimary: z.boolean().optional(),
    }).optional().describe('Add a new contact to the client profile'),
    painPoints: z.array(z.string()).optional().describe('Replace pain points list (overwrites existing)'),
    addPainPoints: z.array(z.string()).optional().describe('Add additional pain points to existing list'),
    budget: z.string().optional().describe('Updated budget range'),
    timeline: z.string().optional().describe('Updated timeline'),
    notes: z.string().optional().describe('Updated notes (appends to existing)'),
    website: z.string().optional().describe('Updated website URL'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const entry = await safeGetEntry('clients', input.clientId);
    if (!entry) {
      return { error: `Client "${input.clientId}" not found.` };
    }

    if (input.companyName !== undefined) entry.companyName = input.companyName;
    if (input.industry !== undefined) entry.industry = input.industry;
    if (input.companySize !== undefined) entry.companySize = input.companySize;
    if (input.budget !== undefined) entry.budget = input.budget;
    if (input.timeline !== undefined) entry.timeline = input.timeline;
    if (input.website !== undefined) entry.website = input.website;

    if (input.addContact) {
      const contacts = entry.contacts ?? [];
      contacts.push(input.addContact);
      entry.contacts = contacts;
    }

    if (input.painPoints) {
      entry.painPoints = input.painPoints;
    } else if (input.addPainPoints) {
      const existing = entry.painPoints ?? [];
      entry.painPoints = [...existing, ...input.addPainPoints];
    }

    if (input.notes !== undefined) {
      if (input.notes === '') {
        entry.notes = '';
      } else {
        const existing = entry.notes ? `${entry.notes}\n\n` : '';
        entry.notes = `${existing}${input.notes}`;
      }
    }

    entry.updatedAt = new Date().toISOString();

    const searchText = [
      entry.companyName,
      entry.industry,
      entry.companySize,
      ...(entry.painPoints ?? []),
      entry.notes,
    ].filter(Boolean).join(' ');

    await entry.save(searchText);

    return {
      clientId: input.clientId,
      companyName: entry.companyName,
      message: `Client profile for "${entry.companyName}" updated successfully.`,
    };
  }
}
