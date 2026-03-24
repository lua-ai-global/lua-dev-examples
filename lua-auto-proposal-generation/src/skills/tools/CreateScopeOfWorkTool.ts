import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { fillStandardRates } from '../../utils/pricing.utils.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class CreateScopeOfWorkTool implements LuaTool {
  name = 'create_scope_of_work';
  description = 'Define a scope of work with phases, deliverables, roles, and hour estimates. Auto-fills standard rates for known roles. Saves to scopes collection.';

  inputSchema = z.object({
    clientId: z.string().describe('Client ID this scope is for'),
    title: z.string().describe('Scope title (e.g., "Digital Transformation Phase 1")'),
    overview: z.string().describe('High-level description of the engagement'),
    items: z.array(z.object({
      phase: z.string().describe('Project phase (e.g., "Discovery", "Implementation")'),
      deliverable: z.string().describe('Specific deliverable name'),
      description: z.string().optional().describe('Deliverable description'),
      estimatedHours: z.number().min(1).describe('Estimated hours for this deliverable'),
      role: z.string().describe('Team role (e.g., "Senior Consultant", "Technical Architect")'),
      ratePerHour: z.number().optional().describe('Rate per hour (auto-filled from standard rates if omitted)'),
    })).min(1).describe('List of scope items/deliverables'),
    assumptions: z.array(z.string()).optional().describe('Key assumptions'),
    exclusions: z.array(z.string()).optional().describe('What is explicitly excluded'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Verify the client exists
    const client = await safeGetEntry('clients', input.clientId);
    if (!client) {
      return { error: `Client "${input.clientId}" not found. Create a client profile first.` };
    }

    // Auto-fill rates from standard lookup when not provided
    const { items, error } = fillStandardRates(input.items);
    if (error) return { error };

    const scopeData = {
      clientId: input.clientId,
      title: input.title,
      overview: input.overview,
      items,
      assumptions: input.assumptions ?? [],
      exclusions: input.exclusions ?? [],
      createdAt: new Date().toISOString(),
    };

    const totalHours = items.reduce((sum, i) => sum + i.estimatedHours, 0);
    const searchText = [input.title, input.overview, ...items.map((i) => i.deliverable)].join(' ');
    const entry = await Data.create('scopes', scopeData, searchText);

    return {
      scopeId: entry.id,
      title: input.title,
      totalHours,
      itemCount: items.length,
      message: `Scope of work "${input.title}" created with ${items.length} deliverables totaling ${totalHours} hours.`,
    };
  }
}
