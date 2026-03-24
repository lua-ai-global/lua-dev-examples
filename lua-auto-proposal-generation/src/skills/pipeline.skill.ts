import { LuaSkill } from 'lua-cli';
import { UpdateProposalStatusTool } from './tools/UpdateProposalStatusTool.js';
import { ListProposalsTool } from './tools/ListProposalsTool.js';
import { GetProposalTool } from './tools/GetProposalTool.js';
import { PipelineSummaryTool } from './tools/PipelineSummaryTool.js';
import { DeleteProposalTool } from './tools/DeleteProposalTool.js';
import { DeleteAllDevTool } from './tools/DeleteAllDevTool.js';

export const pipelineSkill = new LuaSkill({
  name: 'pipeline-skill',
  description: 'Track proposals through the sales pipeline — update status, list, retrieve, delete, and get pipeline analytics.',
  context: `Use these tools to manage the proposal pipeline:

- Use update_proposal_status to move proposals through stages: draft -> sent -> under_review -> accepted/rejected/expired. The tool validates transitions — you cannot skip stages or reverse terminal states.
- Use list_proposals to query proposals by status and/or client name with pagination. Client name search is fuzzy when used alone.
- Use get_proposal to retrieve full proposal details. Supports three formats: "full" (all data), "summary" (key fields), "markdown" (rendered document).
- Use delete_proposal to permanently delete a draft proposal. Only proposals in draft status can be deleted.
- Use pipeline_summary to get a high-level overview of the entire pipeline: proposal counts by status, total pipeline value, win rate, and alerts for proposals expiring within 7 days. Use this when the user asks "how's the pipeline?" or wants a dashboard view.

Pipeline stages:
- draft: Initial state after generation. Proposal is being reviewed internally.
- sent: Proposal has been sent to the client.
- under_review: Client is actively reviewing the proposal.
- accepted: Client accepted — engagement won!
- rejected: Client declined the proposal.
- expired: Proposal validity period has passed.

Pipeline management tips:
- When listing proposals, default to showing all statuses if not specified
- When updating status, always ask for a reason to maintain good records
- Use pipeline_summary when the user wants an overview instead of listing individual proposals
- Alert the user about proposals nearing their validity date
- Celebrate accepted proposals and suggest follow-up actions for rejected ones`,
  tools: [
    new UpdateProposalStatusTool(),
    new ListProposalsTool(),
    new GetProposalTool(),
    new DeleteProposalTool(),
    new PipelineSummaryTool(),
    new DeleteAllDevTool(),
  ],
});
