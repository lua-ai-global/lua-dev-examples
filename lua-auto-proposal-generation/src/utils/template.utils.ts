import { ClientProfile, ScopeOfWork, PricingResult } from '../types/proposal.types.js';
import { formatCurrency } from './pricing.utils.js';

/**
 * Interpolate {{variable}} placeholders in a template body.
 */
export function renderTemplate(body: string, variables: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match; // leave unresolved placeholders as-is
  });
}

/**
 * Return default sections for a given proposal type.
 */
export function getDefaultSections(type: string): string[] {
  const sectionMap: Record<string, string[]> = {
    consulting: [
      'Executive Summary',
      'Understanding Your Challenges',
      'Our Approach',
      'Scope of Work',
      'Team & Expertise',
      'Timeline',
      'Investment',
      'Terms & Conditions',
      'Next Steps',
    ],
    technical: [
      'Executive Summary',
      'Technical Assessment',
      'Proposed Architecture',
      'Implementation Plan',
      'Scope of Work',
      'Timeline',
      'Investment',
      'Assumptions & Risks',
      'Terms & Conditions',
    ],
    strategy: [
      'Executive Summary',
      'Current State Analysis',
      'Strategic Recommendations',
      'Implementation Roadmap',
      'Scope of Work',
      'Expected Outcomes',
      'Investment',
      'Terms & Conditions',
    ],
    staff_augmentation: [
      'Executive Summary',
      'Resource Overview',
      'Team Profiles',
      'Engagement Model',
      'Pricing',
      'Terms & Conditions',
    ],
  };

  return sectionMap[type] ?? sectionMap['consulting']!;
}

/**
 * Flatten client, scope, and pricing data into a flat variables map for template interpolation.
 */
export function buildProposalContext(
  client: ClientProfile,
  scope: ScopeOfWork,
  pricing: PricingResult,
): Record<string, string> {
  const totalHours = scope.items.reduce((sum, item) => sum + item.estimatedHours, 0);

  return {
    companyName: client.companyName,
    industry: client.industry,
    companySize: client.companySize,
    contactName: client.contacts[0]?.name ?? 'N/A',
    contactTitle: client.contacts[0]?.title ?? 'N/A',
    contactEmail: client.contacts[0]?.email ?? 'N/A',
    painPoints: client.painPoints.join(', '),
    budget: client.budget ?? 'To be discussed',
    timeline: client.timeline ?? 'To be discussed',
    scopeTitle: scope.title,
    scopeOverview: scope.overview,
    totalHours: totalHours.toString(),
    pricingModel: pricing.model.replace(/_/g, ' '),
    subtotal: formatCurrency(pricing.subtotal, pricing.currency),
    discount: formatCurrency(pricing.discount, pricing.currency),
    total: formatCurrency(pricing.total, pricing.currency),
    currency: pricing.currency,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
}
