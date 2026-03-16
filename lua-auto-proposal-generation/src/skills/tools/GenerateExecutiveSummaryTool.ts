import { LuaTool, AI } from 'lua-cli';
import { z } from 'zod';
import { formatCurrency } from '../../utils/pricing.utils.js';
import { safeGetEntry } from '../../utils/data.utils.js';

export class GenerateExecutiveSummaryTool implements LuaTool {
  name = 'generate_executive_summary';
  description = 'AI-generates an executive summary from client profile and scope data. Returns polished text ready for the proposal.';

  inputSchema = z.object({
    clientId: z.string().describe('Client ID to generate summary for'),
    scopeId: z.string().describe('Scope ID to reference'),
    tone: z.enum(['formal', 'conversational', 'persuasive']).optional().default('persuasive').describe('Tone of the summary'),
    focusAreas: z.array(z.string()).optional().describe('Specific areas to emphasize'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const client = await safeGetEntry('clients', input.clientId);
    if (!client) return { error: `Client "${input.clientId}" not found.` };

    const scope = await safeGetEntry('scopes', input.scopeId);
    if (!scope) return { error: `Scope "${input.scopeId}" not found.` };

    const totalHours = scope.items.reduce((sum: number, i: any) => sum + i.estimatedHours, 0);
    const totalCost = scope.items.reduce((sum: number, i: any) => sum + i.estimatedHours * i.ratePerHour, 0);

    const context = `You are an expert consulting proposal writer. Write a compelling executive summary for a business proposal.

Guidelines:
- Tone: ${input.tone}
- Length: 2-3 concise paragraphs
- Start by acknowledging the client's challenges
- Describe the proposed solution and approach at a high level
- End with expected outcomes and value
- Do NOT include pricing numbers
- Do NOT use generic filler — be specific to this client
${input.focusAreas ? `- Emphasize: ${input.focusAreas.join(', ')}` : ''}`;

    const prompt = `Write an executive summary for a proposal to ${client.companyName} (${client.industry} industry, ${client.companySize} company).

Their key challenges: ${client.painPoints.join('; ')}
${client.notes ? `Additional context: ${client.notes}` : ''}

Proposed engagement: "${scope.title}"
Overview: ${scope.overview}
Total scope: ${totalHours} hours across ${scope.items.length} deliverables
Key deliverables: ${scope.items.map((i: any) => i.deliverable).join(', ')}
${scope.assumptions?.length ? `Key assumptions: ${scope.assumptions.join('; ')}` : ''}`;

    const summary = await AI.generate(context, [{ type: 'text', text: prompt }]);

    return {
      executiveSummary: summary,
      metadata: {
        clientName: client.companyName,
        scopeTitle: scope.title,
        tone: input.tone,
      },
    };
  }
}
