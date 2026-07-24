import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, resumeWorkflow } from "../utils/hubspotMarketingHelpers";

export default class ResumeWorkflowTool implements LuaTool {
  name = "resumeWorkflow";
  description = "Reactivate a paused workflow so automation can continue once you resolve the underlying issue.";

  inputSchema = z.object({
    workflowId: z.string().describe("Workflow ID to resume"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token, baseUrl } = getHubSpotConfig();
    if (!token) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const response = await resumeWorkflow(input.workflowId, token, baseUrl);
    if (!response.ok) {
      return { ok: false, error: response.error };
    }

    return {
      ok: true,
      workflowId: input.workflowId,
      message: `Workflow ${input.workflowId} resumed.`,
    };
  }
}
