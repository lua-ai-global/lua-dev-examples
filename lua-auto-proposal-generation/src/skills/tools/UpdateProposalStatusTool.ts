import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { ProposalStatus, VALID_STATUS_TRANSITIONS } from '../../types/proposal.types.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class UpdateProposalStatusTool implements LuaTool {
  name = 'update_proposal_status';
  description = 'Move a proposal through the pipeline: draft -> sent -> under_review -> accepted/rejected/expired. Validates status transitions and records history.';

  inputSchema = z.object({
    proposalEntryId: z.string().describe('The Data entry ID of the proposal'),
    newStatus: z.string().describe('Target status: draft, sent, under_review, accepted, rejected, or expired'),
    reason: z.string().optional().describe('Reason for the status change'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const entry = await safeGetEntry('proposals', input.proposalEntryId);
    if (!entry) return { error: `Proposal "${input.proposalEntryId}" not found.` };

    const currentStatus = entry.status as ProposalStatus;
    const validNext = VALID_STATUS_TRANSITIONS[currentStatus];

    if (!validNext || !validNext.includes(input.newStatus)) {
      return {
        error: `Invalid transition: "${currentStatus}" -> "${input.newStatus}". Valid transitions from "${currentStatus}": ${validNext?.join(', ') || 'none (terminal state)'}.`,
      };
    }

    const now = new Date().toISOString();
    const history = entry.statusHistory ?? [];
    history.push({
      from: currentStatus,
      to: input.newStatus,
      changedAt: now,
      reason: input.reason,
    });

    entry.status = input.newStatus;
    entry.statusHistory = history;
    entry.updatedAt = now;

    const searchText = [entry.title, entry.clientName, input.newStatus].join(' ');
    await entry.save(searchText);

    return {
      proposalEntryId: input.proposalEntryId,
      proposalId: entry.proposalId,
      previousStatus: currentStatus,
      newStatus: input.newStatus,
      reason: input.reason,
      message: `Proposal "${entry.title}" moved from ${currentStatus} to ${input.newStatus}.`,
    };
  }
}
