import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { formatProposalMarkdown } from '../../utils/formatting.utils.js';
import { formatCurrency } from '../../utils/pricing.utils.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class GetProposalTool implements LuaTool {
  name = 'get_proposal';
  description = 'Retrieve the full proposal by its entry ID. Returns all details including rendered Markdown content.';

  inputSchema = z.object({
    proposalEntryId: z.string().describe('The Data entry ID of the proposal'),
    format: z.enum(['full', 'summary', 'markdown']).optional().default('full').describe('Response format'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const entry = await safeGetEntry('proposals', input.proposalEntryId);
    if (!entry) return { error: `Proposal "${input.proposalEntryId}" not found.` };

    if (input.format === 'markdown') {
      return {
        markdown: formatProposalMarkdown(entry as any),
      };
    }

    if (input.format === 'summary') {
      return {
        proposalEntryId: entry.id,
        proposalId: entry.proposalId,
        title: entry.title,
        clientName: entry.clientName,
        status: entry.status,
        total: entry.pricing ? formatCurrency(entry.pricing.total, entry.pricing.currency) : 'N/A',
        createdAt: entry.createdAt,
        validUntil: entry.validUntil,
      };
    }

    // Full format
    return {
      proposalEntryId: entry.id,
      proposalId: entry.proposalId,
      title: entry.title,
      clientName: entry.clientName,
      clientId: entry.clientId,
      scopeId: entry.scopeId,
      status: entry.status,
      executiveSummary: entry.executiveSummary,
      content: entry.content,
      pricing: entry.pricing,
      validUntil: entry.validUntil,
      statusHistory: entry.statusHistory,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
