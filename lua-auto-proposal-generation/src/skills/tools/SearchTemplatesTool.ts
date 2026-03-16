import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';

export class SearchTemplatesTool implements LuaTool {
  name = 'search_templates';
  description = 'Search reusable proposal templates by keyword, industry, or type using semantic search.';

  inputSchema = z.object({
    query: z.string().describe('Search query (e.g., "healthcare consulting", "technical proposal")'),
    limit: z.number().min(1).max(20).optional().default(5).describe('Max results'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const results = await Data.search('templates', input.query, input.limit, 0.6);

    if (!results || results.length === 0) {
      return { templates: [], message: `No templates found matching "${input.query}".` };
    }

    const templates = results.map((entry: any) => ({
      templateId: entry.id,
      name: entry.name,
      industry: entry.industry,
      type: entry.type,
      sections: entry.sections,
      score: entry.score,
    }));

    return {
      templates,
      count: templates.length,
      message: `Found ${templates.length} template(s) matching "${input.query}".`,
    };
  }
}
