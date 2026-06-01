import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';

export class SearchScopesTool implements LuaTool {
  name = 'search_scopes';
  description = 'Search existing scopes of work by title, overview, or deliverable names using semantic search.';

  inputSchema = z.object({
    query: z.string().describe('Search query (scope title, deliverable names, overview keywords, etc.)'),
    limit: z.number().min(1).max(20).optional().default(5).describe('Max results to return'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const results = await Data.search('scopes', input.query, input.limit, 0.6);

    if (!results || results.length === 0) {
      return { scopes: [], message: `No scopes found matching "${input.query}".` };
    }

    const scopes = results.map((entry: any) => ({
      scopeId: entry.id,
      clientId: entry.clientId,
      title: entry.title,
      overview: entry.overview,
      itemCount: entry.items?.length ?? 0,
      totalHours: entry.items?.reduce((sum: number, i: any) => sum + (i.estimatedHours ?? 0), 0) ?? 0,
      createdAt: entry.createdAt,
      score: entry.score,
    }));

    return {
      scopes,
      count: scopes.length,
      message: `Found ${scopes.length} scope(s) matching "${input.query}".`,
    };
  }
}
