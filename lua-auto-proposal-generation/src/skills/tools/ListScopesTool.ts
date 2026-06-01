import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { unwrapEntry } from '../../utils/data.utils.js';

export class ListScopesTool implements LuaTool {
  name = 'list_scopes';
  description = 'List scopes of work with optional client filter and pagination.';

  inputSchema = z.object({
    clientId: z.string().optional().describe('Filter scopes by client ID'),
    page: z.number().optional().default(1).describe('Page number'),
    limit: z.number().min(1).max(50).optional().default(10).describe('Items per page'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const filter: Record<string, any> = {};
    if (input.clientId) filter.clientId = input.clientId;

    const results = await Data.get('scopes', filter, input.page, input.limit);

    const scopes = results.data.map((entry: any) => {
      const d = unwrapEntry(entry);
      return {
        scopeId: entry.id,
        clientId: d.clientId,
        title: d.title,
        overview: d.overview,
        itemCount: d.items?.length ?? 0,
        totalHours: d.items?.reduce((sum: number, i: any) => sum + (i.estimatedHours ?? 0), 0) ?? 0,
        createdAt: d.createdAt,
      };
    });

    return {
      scopes,
      pagination: results.pagination,
      message: `Found ${results.pagination.totalCount} scope(s)${input.clientId ? ` for client "${input.clientId}"` : ''}.`,
    };
  }
}
