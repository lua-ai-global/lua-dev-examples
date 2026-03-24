import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';

export class SaveTemplateTool implements LuaTool {
  name = 'save_template';
  description = 'Store a reusable proposal template with {{variable}} placeholders. Templates can be searched and reused across proposals.';

  inputSchema = z.object({
    name: z.string().describe('Template name (e.g., "Standard Consulting Proposal")'),
    industry: z.string().optional().describe('Target industry'),
    type: z.string().optional().default('consulting').describe('Proposal type (consulting, technical, strategy, staff_augmentation)'),
    sections: z.array(z.string()).describe('Ordered list of section names'),
    body: z.string().describe('Template body with {{variable}} placeholders. Available variables: companyName, industry, contactName, contactTitle, painPoints, scopeTitle, scopeOverview, totalHours, total, date'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const templateData = {
      name: input.name,
      industry: input.industry,
      type: input.type,
      sections: input.sections,
      body: input.body,
      createdAt: new Date().toISOString(),
    };

    const searchText = [input.name, input.industry, input.type, ...input.sections].filter(Boolean).join(' ');
    const entry = await Data.create('templates', templateData, searchText);

    return {
      templateId: entry.id,
      name: input.name,
      message: `Template "${input.name}" saved successfully.`,
    };
  }
}
