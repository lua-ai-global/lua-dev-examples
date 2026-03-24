import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { PricingModel } from '../../types/proposal.types.js';
import {
  fillStandardRates,
  calculateFullPricing,
  formatCurrency,
} from '../../utils/pricing.utils.js';

export class EstimatePricingTool implements LuaTool {
  name = 'estimate_pricing';
  description = 'Calculate pricing for a scope of work. Supports fixed, time & materials, retainer, milestone-based, and value-based pricing models. Pure calculator — does not persist data.';

  inputSchema = z.object({
    scopeItems: z.array(z.object({
      phase: z.string(),
      deliverable: z.string(),
      estimatedHours: z.number().min(1),
      role: z.string(),
      ratePerHour: z.number().optional().describe('Rate per hour (uses standard rate if omitted)'),
    })).min(1).describe('Scope items to price'),
    pricingModel: z.string().describe('Pricing model: fixed, time_and_materials, retainer, milestone, or value_based'),
    currency: z.string().optional().default('USD').describe('Currency code'),
    retainerMonthlyHours: z.number().optional().describe('Monthly hours for retainer model'),
    retainerTermMonths: z.number().optional().describe('Contract term in months for retainer model'),
    milestones: z.array(z.object({
      name: z.string(),
      percentage: z.number().min(1).max(100),
      dueDescription: z.string(),
    })).optional().describe('Milestone definitions for milestone pricing'),
    valueMultiplier: z.number().optional().default(1.5).describe('Multiplier for value-based pricing (e.g., 1.5x = 50% premium)'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const validModels = Object.values(PricingModel) as string[];
    if (!validModels.includes(input.pricingModel)) {
      return { error: `Invalid pricing model "${input.pricingModel}". Valid models: ${validModels.join(', ')}.` };
    }

    // Fill in standard rates where missing
    const { items, error } = fillStandardRates(input.scopeItems);
    if (error) return { error };

    const result = calculateFullPricing(items, input.pricingModel, {
      currency: input.currency,
      retainerMonthlyHours: input.retainerMonthlyHours,
      retainerTermMonths: input.retainerTermMonths,
      milestones: input.milestones,
      valueMultiplier: input.valueMultiplier,
    });

    if ('error' in result) return { error: result.error };

    return {
      ...result,
      formattedTotal: formatCurrency(result.total, result.currency),
      formattedSubtotal: formatCurrency(result.subtotal, result.currency),
    };
  }
}
