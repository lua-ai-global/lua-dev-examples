import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';

export class SearchClientsTool implements LuaTool {
  name = 'search_clients';
  description = 'Search existing client profiles by name, industry, or pain points using semantic search.';

  inputSchema = z.object({
    query: z.string().describe('Search query (company name, industry, pain points, etc.)'),
    limit: z.number().min(1).max(20).optional().default(5).describe('Max results to return'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const results = await Data.search('clients', input.query, input.limit, 0.6);

    if (!results || results.length === 0) {
      return { clients: [], message: `No clients found matching "${input.query}".` };
    }

    const clients = results.map((entry: any) => ({
      clientId: entry.id,
      companyName: entry.companyName,
      industry: entry.industry,
      companySize: entry.companySize,
      painPoints: entry.painPoints,
      budget: entry.budget,
      score: entry.score,
    }));

    return {
      clients,
      count: clients.length,
      message: `Found ${clients.length} client(s) matching "${input.query}".`,
    };
  }
}
