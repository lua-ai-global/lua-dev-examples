import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { fillStandardRates } from '../../utils/pricing.utils.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class UpdateScopeOfWorkTool implements LuaTool {
  name = 'update_scope_of_work';
  description = 'Modify an existing scope of work — update title, overview, add/remove items, or change assumptions and exclusions.';

  inputSchema = z.object({
    scopeId: z.string().describe('Scope ID to update'),
    title: z.string().optional().describe('Updated scope title'),
    overview: z.string().optional().describe('Updated scope overview'),
    addItems: z.array(z.object({
      phase: z.string(),
      deliverable: z.string(),
      description: z.string().optional(),
      estimatedHours: z.number().min(1),
      role: z.string(),
      ratePerHour: z.number().optional().describe('Rate per hour (auto-filled from standard rates if omitted)'),
    })).optional().describe('New items to add to the scope'),
    removeDeliverables: z.array(z.string()).optional().describe('Deliverable names to remove from the scope'),
    assumptions: z.array(z.string()).optional().describe('Replace assumptions list'),
    exclusions: z.array(z.string()).optional().describe('Replace exclusions list'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const entry = await safeGetEntry('scopes', input.scopeId);
    if (!entry) {
      return { error: `Scope "${input.scopeId}" not found.` };
    }

    if (input.title !== undefined) entry.title = input.title;
    if (input.overview !== undefined) entry.overview = input.overview;
    if (input.assumptions !== undefined) entry.assumptions = input.assumptions;
    if (input.exclusions !== undefined) entry.exclusions = input.exclusions;

    // Remove deliverables by name
    if (input.removeDeliverables && input.removeDeliverables.length > 0) {
      const toRemove = new Set(input.removeDeliverables.map(d => d.toLowerCase()));
      entry.items = (entry.items ?? []).filter(
        (item: any) => !toRemove.has(item.deliverable.toLowerCase())
      );
    }

    // Add new items with auto-filled rates
    if (input.addItems && input.addItems.length > 0) {
      const { items: filledItems, error } = fillStandardRates(input.addItems);
      if (error) return { error };
      entry.items = [...(entry.items ?? []), ...filledItems];
    }

    const totalHours = (entry.items ?? []).reduce((sum: number, i: any) => sum + i.estimatedHours, 0);

    const searchText = [entry.title, entry.overview, ...(entry.items ?? []).map((i: any) => i.deliverable)].join(' ');
    await entry.save(searchText);

    return {
      scopeId: input.scopeId,
      title: entry.title,
      totalHours,
      itemCount: entry.items?.length ?? 0,
      message: `Scope "${entry.title}" updated. ${entry.items?.length ?? 0} deliverables, ${totalHours} total hours.`,
    };
  }
}
