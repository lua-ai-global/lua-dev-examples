import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { ProposalStatus } from '../../types/proposal.types.js';
import { formatCurrency } from '../../utils/pricing.utils.js';
import { unwrapEntry } from '../../utils/data.utils.js';

export class PipelineSummaryTool implements LuaTool {
  name = 'pipeline_summary';
  description = 'Get a high-level summary of the proposal pipeline: counts and total value by status, win rate, and alerts for expiring proposals.';

  inputSchema = z.object({});

  async execute() {
    const statuses = Object.values(ProposalStatus);
    const summary: Record<string, { count: number; totalValue: number }> = {};
    const expiringSoon: Array<{ proposalId: string; title: string; clientName: string; validUntil: string }> = [];
    const sevenDaysFromNow = Date.now() + 7 * 86400000;

    for (const status of statuses) {
      summary[status] = { count: 0, totalValue: 0 };
    }

    // Fetch all proposals (paginate through)
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const results = await Data.get('proposals', {}, page, 50);
      for (const entry of results.data) {
        const d = unwrapEntry(entry);
        const status = d.status as string;
        if (summary[status]) {
          summary[status].count++;
          summary[status].totalValue += d.pricing?.total ?? 0;
        }

        // Check for proposals expiring within 7 days (only active ones)
        if (['draft', 'sent', 'under_review'].includes(status) && d.validUntil) {
          const validDate = new Date(d.validUntil).getTime();
          if (validDate <= sevenDaysFromNow && validDate > Date.now()) {
            expiringSoon.push({
              proposalId: d.proposalId,
              title: d.title,
              clientName: d.clientName,
              validUntil: d.validUntil,
            });
          }
        }
      }
      hasMore = results.pagination.hasNextPage;
      page++;
    }

    const totalProposals = Object.values(summary).reduce((s, v) => s + v.count, 0);
    const accepted = summary[ProposalStatus.Accepted];
    const rejected = summary[ProposalStatus.Rejected];
    const decided = (accepted?.count ?? 0) + (rejected?.count ?? 0);
    const winRate = decided > 0 ? Math.round(((accepted?.count ?? 0) / decided) * 100) : null;

    const totalPipelineValue = [ProposalStatus.Draft, ProposalStatus.Sent, ProposalStatus.UnderReview]
      .reduce((s, status) => s + (summary[status]?.totalValue ?? 0), 0);

    return {
      totalProposals,
      byStatus: Object.entries(summary)
        .filter(([, v]) => v.count > 0)
        .map(([status, v]) => ({
          status,
          count: v.count,
          totalValue: formatCurrency(v.totalValue),
        })),
      activePipelineValue: formatCurrency(totalPipelineValue),
      winRate: winRate !== null ? `${winRate}%` : 'No decided proposals yet',
      expiringSoon: expiringSoon.length > 0 ? expiringSoon : 'No proposals expiring within 7 days',
    };
  }
}
