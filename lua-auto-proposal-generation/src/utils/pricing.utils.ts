import {
  ScopeItem,
  MilestonePayment,
  PricingModel,
  PricingResult,
  STANDARD_RATES,
} from '../types/proposal.types.js';

/**
 * Sum hours * rate for each scope item.
 */
export function calculateSubtotal(items: ScopeItem[]): number {
  return items.reduce((sum, item) => sum + item.estimatedHours * item.ratePerHour, 0);
}

/**
 * Tiered volume discount:
 * - 5% for subtotals over $50k
 * - 10% for subtotals over $100k
 * - 15% for subtotals over $250k
 */
export function applyVolumeDiscount(subtotal: number): { discount: number; discountPercent: number } {
  if (subtotal >= 250_000) return { discount: subtotal * 0.15, discountPercent: 15 };
  if (subtotal >= 100_000) return { discount: subtotal * 0.10, discountPercent: 10 };
  if (subtotal >= 50_000) return { discount: subtotal * 0.05, discountPercent: 5 };
  return { discount: 0, discountPercent: 0 };
}

/**
 * Retainer pricing: monthly hours * rate * term, with a 10% retainer discount.
 */
export function calculateRetainerPrice(
  monthlyHours: number,
  rate: number,
  termMonths: number,
): { monthlyRate: number; totalRate: number } {
  const monthlyRate = monthlyHours * rate * 0.9; // 10% retainer discount
  return { monthlyRate, totalRate: monthlyRate * termMonths };
}

/**
 * Split total into milestone payments based on percentage allocations.
 */
export function calculateMilestonePayments(
  total: number,
  milestones: Array<{ name: string; percentage: number; dueDescription: string }>,
): MilestonePayment[] {
  return milestones.map((m) => ({
    name: m.name,
    percentage: m.percentage,
    amount: Math.round((total * m.percentage) / 100 * 100) / 100,
    dueDescription: m.dueDescription,
  }));
}

/**
 * Look up standard rate for a consulting role (case-insensitive). Returns undefined if not found.
 */
export function getStandardRate(role: string): number | undefined {
  const key = Object.keys(STANDARD_RATES).find(
    k => k.toLowerCase() === role.toLowerCase()
  );
  return key ? STANDARD_RATES[key] : undefined;
}

/**
 * Auto-fill standard rates for scope items that don't have a rate set.
 * Returns filled items or an error message.
 */
export function fillStandardRates(items: Array<{ role: string; ratePerHour?: number; [k: string]: any }>):
  { items: Array<any>; error?: string } {
  const filled = [];
  for (const item of items) {
    const rate = item.ratePerHour ?? getStandardRate(item.role);
    if (!rate) return { items: [], error: `No rate for role "${item.role}". Provide ratePerHour or use a standard role.` };
    if (rate < 0) return { items: [], error: `Rate for "${item.role}" cannot be negative.` };
    filled.push({ ...item, ratePerHour: rate });
  }
  return { items: filled };
}

/**
 * Calculate full pricing for a set of scope items based on the pricing model.
 * Shared logic used by both EstimatePricingTool and GenerateProposalTool.
 */
export function calculateFullPricing(
  items: ScopeItem[],
  model: string,
  options?: {
    currency?: string;
    retainerMonthlyHours?: number;
    retainerTermMonths?: number;
    milestones?: Array<{ name: string; percentage: number; dueDescription: string }>;
    valueMultiplier?: number;
  },
): PricingResult | { error: string } {
  const currency = options?.currency ?? 'USD';
  const subtotal = calculateSubtotal(items);
  const { discount, discountPercent } = applyVolumeDiscount(subtotal);

  const result: PricingResult = {
    model: model as any,
    subtotal,
    discount,
    discountPercent,
    total: subtotal - discount,
    currency,
    breakdown: items,
  };

  switch (model) {
    case PricingModel.Retainer: {
      if (!options?.retainerMonthlyHours || !options?.retainerTermMonths) {
        return { error: 'Retainer model requires retainerMonthlyHours and retainerTermMonths.' };
      }
      if (options.retainerMonthlyHours <= 0 || options.retainerTermMonths <= 0) {
        return { error: 'retainerMonthlyHours and retainerTermMonths must be positive.' };
      }
      const totalHours = items.reduce((s, i) => s + i.estimatedHours, 0);
      const avgRate = subtotal / totalHours;
      const retainer = calculateRetainerPrice(options.retainerMonthlyHours, avgRate, options.retainerTermMonths);
      result.retainerDetails = {
        monthlyHours: options.retainerMonthlyHours,
        monthlyRate: retainer.monthlyRate,
        termMonths: options.retainerTermMonths,
        totalRate: retainer.totalRate,
      };
      result.total = retainer.totalRate;
      result.discount = 0;
      result.discountPercent = 0;
      break;
    }

    case PricingModel.Milestone: {
      const milestones = options?.milestones ?? [
        { name: 'Project Kickoff', percentage: 25, dueDescription: 'Upon contract signing' },
        { name: 'Mid-Project Delivery', percentage: 50, dueDescription: 'Upon delivery of Phase 2' },
        { name: 'Final Delivery', percentage: 25, dueDescription: 'Upon project completion' },
      ];
      const totalPct = milestones.reduce((s, m) => s + m.percentage, 0);
      if (totalPct !== 100) {
        return { error: `Milestone percentages must sum to 100. Current sum: ${totalPct}.` };
      }
      result.milestones = calculateMilestonePayments(result.total, milestones);
      break;
    }

    case PricingModel.ValueBased: {
      const multiplier = options?.valueMultiplier ?? 1.5;
      if (multiplier <= 0) {
        return { error: 'valueMultiplier must be positive.' };
      }
      result.total = Math.round(subtotal * multiplier * 100) / 100;
      result.discount = 0;
      result.discountPercent = 0;
      break;
    }

    // Fixed and T&M use the default subtotal - discount calculation
    default:
      break;
  }

  return result;
}

/**
 * Format a number as currency.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
