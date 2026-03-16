import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { ProposalStatus } from '../../types/proposal.types.js';
import { generateProposalId } from '../../utils/formatting.utils.js';
import { formatCurrency } from '../../utils/pricing.utils.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class DuplicateProposalTool implements LuaTool {
  name = 'duplicate_proposal';
  description = 'Create a copy of an existing proposal as a new draft. Useful for creating revised proposals or using an accepted proposal as a template for a new client.';

  inputSchema = z.object({
    proposalEntryId: z.string().describe('The Data entry ID of the proposal to duplicate'),
    newTitle: z.string().optional().describe('Title for the new proposal (defaults to original + "- Revised")'),
    newClientId: z.string().optional().describe('Optionally assign to a different client'),
    validDays: z.number().optional().default(30).describe('Validity period for the new proposal'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const original = await safeGetEntry('proposals', input.proposalEntryId);
    if (!original) {
      return { error: `Proposal "${input.proposalEntryId}" not found.` };
    }

    let clientName = original.clientName;
    if (input.newClientId) {
      const client = await safeGetEntry('clients', input.newClientId);
      if (!client) return { error: `Client "${input.newClientId}" not found.` };
      clientName = client.companyName;
    }

    const now = new Date().toISOString();
    const proposalId = generateProposalId();
    const title = input.newTitle ?? `${original.title} - Revised`;
    const validUntil = new Date(Date.now() + (input.validDays ?? 30) * 86400000).toISOString();

    const newProposal = {
      proposalId,
      title,
      clientId: input.newClientId ?? original.clientId,
      clientName,
      scopeId: original.scopeId,
      templateId: original.templateId,
      status: ProposalStatus.Draft,
      executiveSummary: original.executiveSummary,
      content: original.content,
      pricing: original.pricing,
      validUntil,
      statusHistory: [{ from: ProposalStatus.Draft, to: ProposalStatus.Draft, changedAt: now, reason: `Duplicated from ${original.proposalId}` }],
      createdAt: now,
      updatedAt: now,
    };

    const searchText = [title, clientName, ProposalStatus.Draft].join(' ');
    const entry = await Data.create('proposals', newProposal, searchText);

    const result: Record<string, any> = {
      proposalEntryId: entry.id,
      proposalId,
      title,
      clientName,
      status: ProposalStatus.Draft,
      total: original.pricing ? formatCurrency(original.pricing.total, original.pricing.currency) : 'N/A',
      validUntil,
      duplicatedFrom: original.proposalId,
      message: `Proposal duplicated as "${title}" (${proposalId}). Status: Draft.`,
    };

    if (input.newClientId && input.newClientId !== original.clientId) {
      result.warning = 'Content references original client. Consider regenerating the proposal with generate_proposal for client-specific content.';
    }

    return result;
  }
}
