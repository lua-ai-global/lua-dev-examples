import { LuaTool, AI, Data } from 'lua-cli';
import { z } from 'zod';
import { PricingModel, ProposalStatus } from '../../types/proposal.types.js';
import { calculateFullPricing, formatCurrency } from '../../utils/pricing.utils.js';
import { generateProposalId, formatScopeTable, formatTimeline } from '../../utils/formatting.utils.js';
import { buildProposalContext, getDefaultSections, renderTemplate } from '../../utils/template.utils.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class GenerateProposalTool implements LuaTool {
  name = 'generate_proposal';
  description = 'Assemble a full proposal: fetches client/scope data, optionally uses a template, generates AI content for key sections, renders to Markdown, and saves as a draft.';

  inputSchema = z.object({
    clientId: z.string().describe('Client ID'),
    scopeId: z.string().describe('Scope ID'),
    title: z.string().describe('Proposal title'),
    pricingModel: z.string().optional().default(PricingModel.Fixed).describe('Pricing model: fixed, time_and_materials, retainer, milestone, or value_based'),
    retainerMonthlyHours: z.number().optional().describe('Monthly hours for retainer model'),
    retainerTermMonths: z.number().optional().describe('Contract term in months for retainer model'),
    milestones: z.array(z.object({
      name: z.string(),
      percentage: z.number().min(1).max(100),
      dueDescription: z.string(),
    })).optional().describe('Milestone definitions for milestone pricing'),
    valueMultiplier: z.number().optional().default(1.5).describe('Multiplier for value-based pricing (e.g., 1.5x = 50% premium)'),
    templateId: z.string().optional().describe('Optional template ID to use'),
    validDays: z.number().optional().default(30).describe('Number of days the proposal is valid'),
    proposalType: z.string().optional().default('consulting').describe('Proposal type for default sections (consulting, technical, strategy, staff_augmentation)'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Fetch client and scope
    const client = await safeGetEntry('clients', input.clientId);
    if (!client) return { error: `Client "${input.clientId}" not found.` };

    const scope = await safeGetEntry('scopes', input.scopeId);
    if (!scope) return { error: `Scope "${input.scopeId}" not found.` };

    // Calculate pricing using the shared pricing engine
    const pricingResult = calculateFullPricing(scope.items, input.pricingModel ?? PricingModel.Fixed, {
      retainerMonthlyHours: input.retainerMonthlyHours,
      retainerTermMonths: input.retainerTermMonths,
      milestones: input.milestones,
      valueMultiplier: input.valueMultiplier,
    });

    if ('error' in pricingResult) {
      return { error: pricingResult.error };
    }

    const pricing = pricingResult;

    // Build template context
    const templateVars = buildProposalContext(client as any, scope as any, pricing);

    // If a template is provided, render it
    let templateContent = '';
    if (input.templateId) {
      const template = await safeGetEntry('templates', input.templateId);
      if (template) {
        templateContent = renderTemplate(template.body, templateVars);
      }
    }

    // Generate AI content for approach and body sections
    const sections = getDefaultSections(input.proposalType ?? 'consulting');
    const aiContext = `You are an expert consulting proposal writer. Generate professional proposal content.

Guidelines:
- Be specific to the client's industry and challenges
- Use a confident, professional tone
- Include concrete details from the scope
- Each section should be 1-3 paragraphs
- Use Markdown formatting with ## headers for each section
- Do NOT include pricing details (that will be added separately)
- Do NOT include an executive summary (that is generated separately)`;

    const aiPrompt = `Generate the body sections for a ${input.proposalType} proposal.

Client: ${client.companyName} (${client.industry}, ${client.companySize})
Challenges: ${client.painPoints.join('; ')}
Engagement: "${scope.title}"
Overview: ${scope.overview}
Deliverables: ${scope.items.map((i: any) => `${i.phase} - ${i.deliverable} (${i.estimatedHours}h, ${i.role})`).join('\n')}
${scope.assumptions?.length ? `Assumptions: ${scope.assumptions.join('; ')}` : ''}
${scope.exclusions?.length ? `Exclusions: ${scope.exclusions.join('; ')}` : ''}

Sections to write: ${sections.filter((s) => s !== 'Executive Summary' && s !== 'Investment').join(', ')}

${templateContent ? `Use this template as a guide:\n${templateContent}` : ''}`;

    const aiContent = await AI.generate(aiContext, [{ type: 'text', text: aiPrompt }]);

    // Generate executive summary
    const execSummaryContext = `You are an expert consulting proposal writer. Write a compelling 2-3 paragraph executive summary.
- Acknowledge the client's challenges
- Describe the proposed solution at a high level
- End with expected outcomes and value
- Do NOT include pricing`;

    const execPrompt = `Write an executive summary for "${input.title}" proposal to ${client.companyName}.
Challenges: ${client.painPoints.join('; ')}
Engagement: ${scope.overview}
Deliverables: ${scope.items.map((i: any) => i.deliverable).join(', ')}`;

    const executiveSummary = await AI.generate(execSummaryContext, [{ type: 'text', text: execPrompt }]);

    // Build scope table and timeline
    const scopeTable = formatScopeTable(scope.items);
    const timeline = formatTimeline(scope.items);

    // Compose full content
    const content = [aiContent, '', '## Scope of Work', '', scopeTable, '', timeline].join('\n');

    // Build proposal object
    const proposalId = generateProposalId();
    const now = new Date().toISOString();
    const validUntil = new Date(Date.now() + (input.validDays ?? 30) * 86400000).toISOString();

    const proposal = {
      proposalId,
      title: input.title,
      clientId: input.clientId,
      clientName: client.companyName,
      scopeId: input.scopeId,
      templateId: input.templateId,
      status: ProposalStatus.Draft,
      executiveSummary,
      content,
      pricing,
      validUntil,
      statusHistory: [{ from: ProposalStatus.Draft, to: ProposalStatus.Draft, changedAt: now, reason: 'Created' }],
      createdAt: now,
      updatedAt: now,
    };

    const searchText = [input.title, client.companyName, ProposalStatus.Draft, scope.title].join(' ');
    const entry = await Data.create('proposals', proposal, searchText);

    return {
      proposalEntryId: entry.id,
      proposalId,
      title: input.title,
      clientName: client.companyName,
      status: ProposalStatus.Draft,
      total: formatCurrency(pricing.total),
      validUntil,
      message: `Proposal "${input.title}" generated for ${client.companyName}. Total: ${formatCurrency(pricing.total)}. Status: Draft.`,
    };
  }
}
