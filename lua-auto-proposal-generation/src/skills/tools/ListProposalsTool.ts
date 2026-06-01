import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { ProposalStatus } from '../../types/proposal.types.js';
import { formatCurrency } from '../../utils/pricing.utils.js';
import { unwrapEntry } from '../../utils/data.utils.js';

export class ListProposalsTool implements LuaTool {
  name = 'list_proposals';
  description = 'Query proposals with filters by status and client. Supports pagination and fuzzy client name search.';

  inputSchema = z.object({
    status: z.string().optional().describe('Filter by status: draft, sent, under_review, accepted, rejected, or expired'),
    clientName: z.string().optional().describe('Filter by client name (fuzzy search when used alone, exact match when combined with status)'),
    page: z.number().optional().default(1).describe('Page number'),
    limit: z.number().min(1).max(50).optional().default(10).describe('Items per page'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const mapEntry = (entry: any) => {
      const d = unwrapEntry(entry);
      return {
        proposalEntryId: entry.id,
        proposalId: d.proposalId,
        title: d.title,
        clientName: d.clientName,
        status: d.status,
        total: d.pricing ? formatCurrency(d.pricing.total, d.pricing.currency) : 'N/A',
        createdAt: d.createdAt,
        validUntil: d.validUntil,
      };
    };

    // Use fuzzy search when only clientName is provided (no status filter)
    if (input.clientName && !input.status) {
      const searchResults = await Data.search('proposals', input.clientName, input.limit ?? 10, 0.6);
      const proposals = (searchResults ?? []).map(mapEntry);
      return {
        proposals,
        pagination: { page: 1, totalCount: proposals.length, hasNextPage: false },
        message: `Found ${proposals.length} proposal(s) matching "${input.clientName}".`,
      };
    }

    const filter: Record<string, any> = {};
    if (input.status) filter.status = input.status;
    if (input.clientName) filter.clientName = input.clientName;

    const results = await Data.get('proposals', filter, input.page, input.limit);
    const proposals = results.data.map(mapEntry);

    return {
      proposals,
      pagination: results.pagination,
      message: `Found ${results.pagination.totalCount} proposal(s)${input.status ? ` with status "${input.status}"` : ''}.`,
    };
  }
}
