import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, getWorkflowDetails } from "../utils/hubspotMarketingHelpers";

export default class GetWorkflowDetailsTool implements LuaTool {
  name = "getWorkflowDetails";
  description = "Fetches metadata for a workflow by ID so you can validate enrollment rules before touching it.";

  inputSchema = z.object({
    workflowId: z.string().describe("Workflow ID to inspect"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token, baseUrl } = getHubSpotConfig();
    if (!token) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const response = await getWorkflowDetails(input.workflowId, token, baseUrl);
    if (!response.ok) {
      return { ok: false, error: response.error };
    }

    return {
      ok: true,
      workflow: response.workflow,
      message: `Fetched workflow ${input.workflowId}.`,
    };
  }
}
