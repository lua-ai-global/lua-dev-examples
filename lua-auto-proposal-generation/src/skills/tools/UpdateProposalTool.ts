import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { ProposalStatus } from '../../types/proposal.types.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class UpdateProposalTool implements LuaTool {
  name = 'update_proposal';
  description = 'Edit a draft proposal — update title, executive summary, content, or validity period. Only draft proposals can be edited.';

  inputSchema = z.object({
    proposalEntryId: z.string().describe('The Data entry ID of the proposal to edit'),
    title: z.string().optional().describe('Updated proposal title'),
    executiveSummary: z.string().optional().describe('Updated executive summary'),
    content: z.string().optional().describe('Updated proposal body content'),
    validDays: z.number().optional().describe('Reset validity period to this many days from now'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const entry = await safeGetEntry('proposals', input.proposalEntryId);
    if (!entry) {
      return { error: `Proposal "${input.proposalEntryId}" not found.` };
    }

    if (entry.status !== ProposalStatus.Draft) {
      return { error: `Only draft proposals can be edited. This proposal has status "${entry.status}".` };
    }

    if (input.title !== undefined) entry.title = input.title;
    if (input.executiveSummary !== undefined) entry.executiveSummary = input.executiveSummary;
    if (input.content !== undefined) entry.content = input.content;
    if (input.validDays !== undefined) {
      entry.validUntil = new Date(Date.now() + input.validDays * 86400000).toISOString();
    }

    entry.updatedAt = new Date().toISOString();

    const searchText = [entry.title, entry.clientName, entry.status, entry.proposalId].join(' ');
    await entry.save(searchText);

    return {
      proposalEntryId: input.proposalEntryId,
      proposalId: entry.proposalId,
      title: entry.title,
      status: entry.status,
      updatedAt: entry.updatedAt,
      message: `Proposal "${entry.title}" updated successfully.`,
    };
  }
}
