import AirtableService from "@/src/services/AirtableService";
import { LuaTool, env } from "lua-cli";
import { z } from "zod";

export class GetRecordTool implements LuaTool {
  name = "get_airtable_record";
  description = "Retrieve a single record from an Airtable table by its record ID. Returns the complete record with all field values.";

  inputSchema = z.object({
    baseId: z.string().describe("The Airtable base ID (starts with 'app', e.g., 'appXXXXXXXXXXXXXX')"),
    tableIdOrName: z.string().describe("The table ID or table name containing the record"),
    recordId: z.string().describe("The unique record ID (starts with 'rec', e.g., 'recXXXXXXXXXXXXXX')"),
    cellFormat: z.string().optional().describe("Format for cell values: 'json' (default, structured data) or 'string' (user-facing strings)"),
    returnFieldsByFieldId: z.boolean().optional().describe("If true, return fields keyed by field ID instead of field name (default: false)"),
    timeZone: z.string().optional().describe("Time zone for string formatting (required if cellFormat is 'string', e.g., 'America/New_York')"),
    userLocale: z.string().optional().describe("User locale for string formatting (required if cellFormat is 'string', e.g., 'en-US')"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const airtableToken = env("AIRTABLE_TOKEN");
      
      if (!airtableToken) {
        return {
          success: false,
          error: "AIRTABLE_TOKEN not found in environment variables.",
        };
      }

      const airtableService = new AirtableService(airtableToken);
      const result = await airtableService.getRecord(input);

      if (result.success) {
        return {
          success: true,
          message: "Record retrieved successfully",
          record: result.record,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Get Airtable Record Error:", error);
      return {
        success: false,
        error: error.message || "Failed to get record",
      };
    }
  }
}

export class ListRecordsTool implements LuaTool {
  name = "list_airtable_records";
  description = "List records from an Airtable table. Retrieve data with optional filtering, sorting, and field selection. Supports pagination for large datasets.";

  inputSchema = z.object({
    baseId: z.string().describe("The Airtable base ID (starts with 'app', e.g., 'appXXXXXXXXXXXXXX')"),
    tableIdOrName: z.string().describe("The table ID or table name to list records from"),
    fields: z.array(z.string()).optional().describe("Array of field names to return. If not specified, all fields are returned."),
    filterByFormula: z.string().optional().describe("Airtable formula to filter records (e.g., \"Status='Active'\", \"{Name}='John'\")"),
    maxRecords: z.number().optional().describe("Maximum number of records to return (max 100 per page)"),
    pageSize: z.number().optional().describe("Number of records per page (default: 100)"),
    sort: z.array(z.object({
      field: z.string().describe("Field name to sort by"),
      direction: z.string().describe("Sort direction: 'asc' for ascending or 'desc' for descending")
    })).optional().describe("Array of sort objects to sort records"),
    view: z.string().optional().describe("Name or ID of a view in the table. Returns records in that view."),
    offset: z.string().optional().describe("Pagination offset from previous response. Use to fetch next page of results.")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const airtableToken = env("AIRTABLE_TOKEN");
      
      if (!airtableToken) {
        return {
          success: false,
          error: "AIRTABLE_TOKEN not found in environment variables.",
        };
      }

      const airtableService = new AirtableService(airtableToken);
      const result = await airtableService.listRecords(input);

      if (result.success) {
        return {
          success: true,
          message: `Successfully retrieved ${result.records?.length || 0} record(s)`,
          records: result.records,
          offset: result.offset,
          hasMoreRecords: !!result.offset,
          tip: result.offset ? "There are more records. Use the 'offset' value to fetch the next page." : undefined,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("List Airtable Records Error:", error);
      return {
        success: false,
        error: error.message || "Failed to list records",
      };
    }
  }
}

export class ListBasesTool implements LuaTool {
  name = "list_airtable_bases";
  description = "List all Airtable bases accessible by the current token. Returns up to 1000 bases at a time with pagination support.";

  inputSchema = z.object({
    offset: z.string().optional().describe("Pagination offset from previous response. Use to fetch next page of results.")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const airtableToken = env("AIRTABLE_TOKEN");
      
      if (!airtableToken) {
        return {
          success: false,
          error: "AIRTABLE_TOKEN not found in environment variables.",
        };
      }

      const airtableService = new AirtableService(airtableToken);
      const result = await airtableService.listBases(input);

      if (result.success) {
        return {
          success: true,
          message: `Found ${result.bases?.length || 0} base(s)`,
          bases: result.bases,
          offset: result.offset,
          hasMoreBases: !!result.offset,
          tip: result.offset ? "There are more bases. Use the 'offset' value to fetch the next page." : undefined,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("List Airtable Bases Error:", error);
      return {
        success: false,
        error: error.message || "Failed to list bases",
      };
    }
  }
}

export class GetBaseSchemaTool implements LuaTool{
    name = "get_airtable_base_schema";
    description = "Get the schema of an Airtable base. Returns the schema of the base with all table names and fields.";

    inputSchema = z.object({
        baseId: z.string().describe("The Airtable base ID (starts with 'app', e.g., 'appXXXXXXXXXXXXXX')"),
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        try {
            const airtableToken = env("AIRTABLE_TOKEN");
            if (!airtableToken) {
                return {
                    success: false,
                    error: "AIRTABLE_TOKEN not found in environment variables.",
                };
            }
            const airtableService = new AirtableService(airtableToken);
            const result = await airtableService.getBaseSchema(input);
            if (result.success) {
                return {
                    success: true,
                    message: "Base schema retrieved successfully",
                    schema: result.schema,
                };
            }
            else {
                return {
                    success: false,
                    error: result.error,
                };
            }
        }
        catch (error: any) {
            console.error("Get Airtable Base Schema Error:", error);
            return {
                success: false,
                error: error.message || "Failed to get base schema",
            };
        }
    }
}

