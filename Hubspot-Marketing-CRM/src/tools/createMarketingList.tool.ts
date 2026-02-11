import { LuaTool } from "lua-cli";
import { z } from "zod";
import { getHubSpotConfig, createMarketingList, ListFilter } from "../utils/hubspotMarketingHelpers";

export default class CreateMarketingListTool implements LuaTool {
  name = "createMarketingList";
  description =
    "Creates a new marketing list (static or dynamic) from provided filters so you can scope campaigns and workflows.";

  inputSchema = z.object({
    name: z.string().min(3).describe("Name for the new marketing list"),
    description: z.string().optional().describe("Optional description for documentation"),
    dynamic: z.boolean().optional().default(false).describe("Whether the list should stay dynamic"),
    filters: z
      .array(
        z
          .object({
            propertyName: z.string().describe("HubSpot contact property to filter on"),
            operator: z.string().describe("Comparison operator (EQ, NEQ, GT, LT, CONTAINS, etc.)"),
            value: z.string().describe("Value to compare"),
          })
          .describe("Single condition that becomes part of the list definition"),
      )
      .optional(),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const { token, baseUrl } = getHubSpotConfig();
    if (!token) {
      return { ok: false, error: "Missing HUBSPOT_PRIVATE_APP_TOKEN in environment." };
    }

    const filterDefs: ListFilter[] | undefined = input.filters?.map((filter) => ({
      propertyName: filter.propertyName,
      operator: filter.operator,
      value: filter.value,
    }));

    const response = await createMarketingList(input.name, filterDefs, input.dynamic ?? false, token, baseUrl);
    if (!response.ok) {
      return { ok: false, error: response.error };
    }

    return {
      ok: true,
      listId: response.listId,
      name: input.name,
      description: input.description,
      message: `Marketing list "${input.name}" created (ID ${response.listId}).`,
    };
  }
}
