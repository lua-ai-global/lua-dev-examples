import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, enrollContactsInWorkflow } from "../utils/hubspotMarketingHelpers";

export default class EnrollContactsWorkflowTool implements LuaTool {
  name = "enrollContactsInWorkflow";
  description = "Enrolls one or more contacts into a specified HubSpot workflow to trigger nurture campaigns automatically.";

  inputSchema = z.object({
    workflowId: z.string().describe("The workflow ID where contacts should be enrolled"),
    contactIds: z
      .array(z.string().describe("Contact ID belonging to a HubSpot contact"))
      .min(1)
      .describe("One or more contacts to enroll"),
    note: z.string().optional().describe("Optional note about why the enrollment happened"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token, baseUrl } = getHubSpotConfig();
    if (!token) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const results = await enrollContactsInWorkflow(input.workflowId, input.contactIds, token, baseUrl);
    const failures = results.filter((r) => !r.ok);

    return {
      ok: failures.length === 0,
      workflowId: input.workflowId,
      attempted: results.length,
      enrolled: results.length - failures.length,
      errors: failures.map((f) => ({ contactId: f.contactId, error: f.error })),
      message: failures.length
        ? `Enrolled ${results.length - failures.length} contacts; ${failures.length} failed.`
        : `Successfully enrolled ${results.length} contacts.`,
      note: input.note,
    };
  }
}
