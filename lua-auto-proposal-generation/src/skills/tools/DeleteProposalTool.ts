import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { ProposalStatus } from '../../types/proposal.types.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class DeleteProposalTool implements LuaTool {
  name = 'delete_proposal';
  description = 'Delete a draft proposal. Only proposals in draft status can be deleted.';

  inputSchema = z.object({
    proposalEntryId: z.string().describe('The Data entry ID of the proposal to delete'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const entry = await safeGetEntry('proposals', input.proposalEntryId);
    if (!entry) {
      return { error: `Proposal "${input.proposalEntryId}" not found.` };
    }

    if (entry.status !== ProposalStatus.Draft) {
      return { error: `Only draft proposals can be deleted. This proposal has status "${entry.status}".` };
    }

    await Data.delete('proposals', input.proposalEntryId);

    return {
      proposalEntryId: input.proposalEntryId,
      proposalId: entry.proposalId,
      title: entry.title,
      message: `Proposal "${entry.title}" (${entry.proposalId}) deleted.`,
    };
  }
}
