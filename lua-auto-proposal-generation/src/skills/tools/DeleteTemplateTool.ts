import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { safeGetEntry } from '../../utils/data.utils.js';

export class DeleteTemplateTool implements LuaTool {
  name = 'delete_template';
  description = 'Delete a proposal template by its entry ID.';

  inputSchema = z.object({
    templateId: z.string().describe('The Data entry ID of the template to delete'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const entry = await safeGetEntry('templates', input.templateId);
    if (!entry) {
      return { error: `Template "${input.templateId}" not found.` };
    }

    await Data.delete('templates', input.templateId);

    return {
      templateId: input.templateId,
      name: entry.name,
      message: `Template "${entry.name}" deleted.`,
    };
  }
}
