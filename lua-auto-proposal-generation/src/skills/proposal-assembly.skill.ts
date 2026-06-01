import { LuaSkill } from 'lua-cli';
import { GenerateExecutiveSummaryTool } from './tools/GenerateExecutiveSummaryTool.js';
import { GenerateProposalTool } from './tools/GenerateProposalTool.js';
import { DuplicateProposalTool } from './tools/DuplicateProposalTool.js';
import { UpdateProposalTool } from './tools/UpdateProposalTool.js';
import { SaveTemplateTool } from './tools/SaveTemplateTool.js';
import { SearchTemplatesTool } from './tools/SearchTemplatesTool.js';
import { DeleteTemplateTool } from './tools/DeleteTemplateTool.js';

export const proposalAssemblySkill = new LuaSkill({
  name: 'proposal-assembly-skill',
  description: 'Generate complete proposals with AI-written content, edit drafts, duplicate proposals, and manage reusable templates.',
  context: `Use these tools to generate and manage proposals:

- Use generate_executive_summary to create a standalone executive summary from client + scope data. Use this when the user wants to preview or refine the summary before generating the full proposal.
- Use generate_proposal to assemble a complete proposal. This fetches client/scope data, generates AI content, renders Markdown, and saves as a draft. Requires clientId and scopeId. Supports all pricing models — for retainer, provide retainerMonthlyHours and retainerTermMonths; for milestone, provide milestones array; for value_based, provide valueMultiplier.
- Use update_proposal to edit a draft proposal — update title, executive summary, content, or validity period. Only draft proposals can be edited.
- Use duplicate_proposal to create a copy of an existing proposal as a new draft. Useful for revised proposals or adapting a winning proposal for a new client. Note: when duplicating to a new client, the AI content still references the original client.
- Use save_template to store reusable proposal templates with {{variable}} placeholders.
- Use search_templates to find existing templates by industry or type before generating a proposal.
- Use delete_template to remove a template that is no longer needed.

Proposal generation workflow:
1. Ensure client profile and scope of work exist
2. Optionally search for a matching template
3. Generate the full proposal (or generate executive summary first for review)
4. Present the generated proposal to the user
5. Use update_proposal to refine content if needed
6. Suggest saving as a template if it could be reused
7. Remind the user to review before changing status to "sent"

Available template variables: {{companyName}}, {{industry}}, {{contactName}}, {{contactTitle}}, {{painPoints}}, {{scopeTitle}}, {{scopeOverview}}, {{totalHours}}, {{total}}, {{date}}`,
  tools: [
    new GenerateExecutiveSummaryTool(),
    new GenerateProposalTool(),
    new UpdateProposalTool(),
    new DuplicateProposalTool(),
    new SaveTemplateTool(),
    new SearchTemplatesTool(),
    new DeleteTemplateTool(),
  ],
});
