import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, pauseWorkflow } from "../utils/hubspotMarketingHelpers";

export default class PauseWorkflowTool implements LuaTool {
  name = "pauseWorkflow";
  description = "Temporarily pauses a workflow so you can stop enrollments when a segment is overloaded or requires manual review.";

  inputSchema = z.object({
    workflowId: z.string().describe("Workflow ID to pause"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token, baseUrl } = getHubSpotConfig();
    if (!token) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const response = await pauseWorkflow(input.workflowId, token, baseUrl);
    if (!response.ok) {
      return { ok: false, error: response.error };
    }

    return {
      ok: true,
      workflowId: input.workflowId,
      message: `Workflow ${input.workflowId} paused.`,
    };
  }
}
