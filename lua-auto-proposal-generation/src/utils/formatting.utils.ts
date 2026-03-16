import { Proposal, ScopeItem, PricingResult } from '../types/proposal.types.js';
import { formatCurrency } from './pricing.utils.js';

/**
 * Generate a proposal ID in PROP-YYYYMMDD-XXXX format.
 */
export function generateProposalId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PROP-${date}-${rand}`;
}

/**
 * Render a complete proposal as Markdown.
 */
export function formatProposalMarkdown(proposal: Proposal): string {
  const sections: string[] = [];

  sections.push(`# ${proposal.title}`);
  sections.push(`**Proposal ID:** ${proposal.proposalId}`);
  sections.push(`**Client:** ${proposal.clientName}`);
  sections.push(`**Date:** ${new Date(proposal.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  sections.push(`**Valid Until:** ${new Date(proposal.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  sections.push(`**Status:** ${proposal.status.replace(/_/g, ' ').toUpperCase()}`);
  sections.push('---');

  // Executive Summary
  sections.push('## Executive Summary');
  sections.push(proposal.executiveSummary);
  sections.push('');

  // Full content (scope, approach, etc.)
  sections.push(proposal.content);
  sections.push('');

  // Pricing
  sections.push(formatPricingSummary(proposal.pricing));

  return sections.join('\n\n');
}

/**
 * Render scope items as a Markdown table.
 */
export function formatScopeTable(items: ScopeItem[]): string {
  const header = '| Phase | Deliverable | Role | Hours | Rate | Subtotal |';
  const divider = '|-------|-------------|------|------:|-----:|---------:|';
  const rows = items.map((item) => {
    const subtotal = item.estimatedHours * item.ratePerHour;
    return `| ${item.phase} | ${item.deliverable} | ${item.role} | ${item.estimatedHours} | ${formatCurrency(item.ratePerHour)} | ${formatCurrency(subtotal)} |`;
  });
  return [header, divider, ...rows].join('\n');
}

/**
 * Render pricing summary section as Markdown.
 */
export function formatPricingSummary(pricing: PricingResult): string {
  const lines: string[] = [];
  lines.push('## Pricing Summary');
  lines.push(`**Pricing Model:** ${pricing.model.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`);
  lines.push('');
  lines.push(formatScopeTable(pricing.breakdown));
  lines.push('');
  lines.push(`**Subtotal:** ${formatCurrency(pricing.subtotal, pricing.currency)}`);

  if (pricing.discount > 0) {
    lines.push(`**Volume Discount (${pricing.discountPercent}%):** -${formatCurrency(pricing.discount, pricing.currency)}`);
  }

  lines.push(`**Total:** ${formatCurrency(pricing.total, pricing.currency)}`);

  if (pricing.milestones && pricing.milestones.length > 0) {
    lines.push('');
    lines.push('### Payment Schedule');
    lines.push('| Milestone | Amount | Due |');
    lines.push('|-----------|-------:|-----|');
    for (const m of pricing.milestones) {
      lines.push(`| ${m.name} (${m.percentage}%) | ${formatCurrency(m.amount, pricing.currency)} | ${m.dueDescription} |`);
    }
  }

  if (pricing.retainerDetails) {
    const r = pricing.retainerDetails;
    lines.push('');
    lines.push('### Retainer Details');
    lines.push(`- **Monthly Hours:** ${r.monthlyHours}`);
    lines.push(`- **Monthly Rate:** ${formatCurrency(r.monthlyRate, pricing.currency)} (includes 10% retainer discount)`);
    lines.push(`- **Term:** ${r.termMonths} months`);
    lines.push(`- **Total Contract Value:** ${formatCurrency(r.totalRate, pricing.currency)}`);
  }

  return lines.join('\n');
}

/**
 * Render a text-based timeline from scope items.
 */
export function formatTimeline(items: ScopeItem[]): string {
  const phases = new Map<string, { totalHours: number; deliverables: string[]; roles: Set<string> }>();

  for (const item of items) {
    const existing = phases.get(item.phase);
    if (existing) {
      existing.totalHours += item.estimatedHours;
      existing.roles.add(item.role);
      if (!existing.deliverables.includes(item.deliverable)) {
        existing.deliverables.push(item.deliverable);
      }
    } else {
      phases.set(item.phase, { totalHours: item.estimatedHours, deliverables: [item.deliverable], roles: new Set([item.role]) });
    }
  }

  const lines: string[] = ['## Project Timeline', ''];
  let weekOffset = 0;

  for (const [phase, info] of phases) {
    const parallelWorkers = Math.max(1, info.roles.size);
    const weeks = Math.max(1, Math.ceil(info.totalHours / (parallelWorkers * 40)));
    const startWeek = weekOffset + 1;
    const endWeek = weekOffset + weeks;
    lines.push(`### ${phase} (Weeks ${startWeek}-${endWeek})`);
    for (const d of info.deliverables) {
      lines.push(`- ${d}`);
    }
    lines.push(`- *Estimated: ${info.totalHours} hours across ${parallelWorkers} role(s) (assuming parallel work across roles)*`);
    lines.push('');
    weekOffset = endWeek;
  }

  lines.push(`**Total Duration:** ~${weekOffset} weeks`);
  return lines.join('\n');
}
