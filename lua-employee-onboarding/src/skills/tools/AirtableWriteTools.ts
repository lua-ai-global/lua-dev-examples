import AirtableService from "@/src/services/AirtableService";
import { LuaTool, env } from "lua-cli";
import { z } from "zod";


export class CreateRecordsTool implements LuaTool {
  name = "create_airtable_records";
  description = "Create one or multiple records in an Airtable table (up to 10 records per request). Use this to add new data like employee entries, onboarding tasks, or any structured information.";

  inputSchema = z.object({
    userId: z.string().describe("The unique identifier of the user requesting this action (required for authentication)"),
    baseId: z.string().describe("The Airtable base ID (starts with 'app', e.g., 'appXXXXXXXXXXXXXX')"),
    tableIdOrName: z.string().describe("The table ID or table name to create records in"),
    records: z.array(z.object({
      fields: z.record(z.any()).describe("Object containing field names/IDs as keys and their values")
    })).min(1).max(10).describe("Array of record objects to create (1-10 records). Each record must have a 'fields' object with field name/value pairs."),
    returnFieldsByFieldId: z.boolean().optional().describe("If true, return fields keyed by field ID instead of field name (default: false)"),
    typecast: z.boolean().optional().describe("If true, Airtable will auto-convert string values to appropriate field types. Use with caution. (default: false)"),
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
      const result = await airtableService.createRecords(input);

      if (result.success) {
        return {
          success: true,
          message: `Successfully created ${result.records?.length || 0} record(s)`,
          records: result.records,
          details: result.details,
          tip: result.details ? "Partial success - some attachments may have failed. Check details for more info." : undefined,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Create Airtable Records Error:", error);
      return {
        success: false,
        error: error.message || "Failed to create records",
      };
    }
  }
}

export class DeleteRecordTool implements LuaTool {
  name = "delete_airtable_record";
  description = "Delete a single record from an Airtable table by its record ID. This action is permanent and cannot be undone.";

  inputSchema = z.object({
    userId: z.string().describe("The unique identifier of the user requesting this action (required for authentication)"),
    baseId: z.string().describe("The Airtable base ID (starts with 'app', e.g., 'appXXXXXXXXXXXXXX')"),
    tableIdOrName: z.string().describe("The table ID or table name containing the record"),
    recordId: z.string().describe("The unique record ID to delete (starts with 'rec', e.g., 'recXXXXXXXXXXXXXX')"),
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
      const result = await airtableService.deleteRecord(input);

      if (result.success) {
        return {
          success: true,
          message: "Record deleted successfully",
          id: result.id,
          deleted: result.deleted,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Delete Airtable Record Error:", error);
      return {
        success: false,
        error: error.message || "Failed to delete record",
      };
    }
  }
}

export class UpdateRecordTool implements LuaTool {
  name = "update_airtable_record";
  description = "Update specific fields in an existing Airtable record. Only updates the fields you specify, leaving other fields unchanged.";

  inputSchema = z.object({
    userId: z.string().describe("The unique identifier of the user requesting this action (required for authentication)"),
    baseId: z.string().describe("The Airtable base ID (starts with 'app', e.g., 'appXXXXXXXXXXXXXX')"),
    tableIdOrName: z.string().describe("The table ID or table name containing the record"),
    recordId: z.string().describe("The unique record ID to update (starts with 'rec', e.g., 'recXXXXXXXXXXXXXX')"),
    fields: z.record(z.any()).describe("Object containing field names/IDs as keys and their new values. Only specified fields will be updated."),
    returnFieldsByFieldId: z.boolean().optional().describe("If true, return fields keyed by field ID instead of field name (default: false)"),
    typecast: z.boolean().optional().describe("If true, Airtable will auto-convert string values to appropriate field types. Use with caution. (default: false)"),
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
      const result = await airtableService.updateRecord(input);

      if (result.success) {
        return {
          success: true,
          message: "Record updated successfully",
          record: result.record,
          details: result.details,
          tip: result.details ? "Partial success - some attachments may have failed. Check details for more info." : undefined,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Update Airtable Record Error:", error);
      return {
        success: false,
        error: error.message || "Failed to update record",
      };
    }
  }
}

export class CreateBaseTool implements LuaTool {
  name = "create_airtable_base";
  description = "Create a new Airtable base with tables and fields. Requires workspace creator permissions.";

  inputSchema = z.object({
    userId: z.string().describe("The unique identifier of the user requesting this action (required for authentication)"),
    name: z.string().describe("The name for the new base"),
    workspaceId: z.string().optional().describe("The workspace ID where the base will be created. If not provided, uses AIRTABLE_WORKSPACE_ID from environment."),
    tables: z.array(z.object({
      name: z.string().describe("Table name"),
      description: z.string().optional().describe("Optional table description"),
      fields: z.array(z.object({
        name: z.string().describe("Field name (must be unique within table)"),
        type: z.string().describe("Field type (e.g., 'singleLineText', 'number', 'multipleSelects', 'date', etc.)"),
        description: z.string().optional().describe("Optional field description"),
        options: z.record(z.any()).optional().describe("Field-specific options (varies by field type)")
      })).min(1).describe("Array of field definitions. First field becomes the primary field.")
    })).min(1).describe("Array of tables to create. At least one table required.")
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

      const workspaceId = input.workspaceId || env("AIRTABLE_WORKSPACE_ID");
      
      if (!workspaceId) {
        return {
          success: false,
          error: "Workspace ID is required. Either provide it in the request or set AIRTABLE_WORKSPACE_ID in environment variables.",
        };
      }

      const airtableService = new AirtableService(airtableToken);
      const result = await airtableService.createBase({
        ...input,
        workspaceId
      });

      if (result.success) {
        return {
          success: true,
          message: "Base created successfully",
          baseId: result.id,
          tables: result.tables,
          tip: "A default grid view has been created for each table with all fields visible.",
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Create Airtable Base Error:", error);
      return {
        success: false,
        error: error.message || "Failed to create base",
      };
    }
  }
}

export class CreateTableTool implements LuaTool {
  name = "create_airtable_table";
  description = "Create a new table in an existing Airtable base. Requires base creator permissions.";

  inputSchema = z.object({
    userId: z.string().describe("The unique identifier of the user requesting this action (required for authentication)"),
    baseId: z.string().describe("The Airtable base ID where the table will be created"),
    name: z.string().describe("The name for the new table"),
    description: z.string().optional().describe("Optional table description (max 20,000 characters)"),
    fields: z.array(z.object({
      name: z.string().describe("Field name (must be unique within table)"),
      type: z.string().describe("Field type (e.g., 'singleLineText', 'number', 'multipleSelects', 'date', etc.)"),
      description: z.string().optional().describe("Optional field description"),
      options: z.record(z.any()).optional().describe("Field-specific options (varies by field type)")
    })).min(1).describe("Array of field definitions. First field becomes the primary field (at least 1 required).")
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
      const result = await airtableService.createTable(input);

      if (result.success) {
        return {
          success: true,
          message: "Table created successfully",
          table: result.table,
          tip: "A default grid view has been created with all fields visible.",
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Create Airtable Table Error:", error);
      return {
        success: false,
        error: error.message || "Failed to create table",
      };
    }
  }
}

export class UpdateTableTool implements LuaTool {
  name = "update_airtable_table";
  description = "Update the name, description, or date dependency settings of an existing Airtable table. Requires base creator permissions.";

  inputSchema = z.object({
    userId: z.string().describe("The unique identifier of the user requesting this action (required for authentication)"),
    baseId: z.string().describe("The Airtable base ID containing the table"),
    tableIdOrName: z.string().describe("The table ID or table name to update"),
    name: z.string().optional().describe("New table name"),
    description: z.string().optional().describe("New table description (max 20,000 characters, or empty string to clear)"),
    dateDependencySettings: z.record(z.any()).optional().describe("Date dependency settings for the table")
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
      const result = await airtableService.updateTable(input);

      if (result.success) {
        return {
          success: true,
          message: "Table updated successfully",
          table: result.table,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Update Airtable Table Error:", error);
      return {
        success: false,
        error: error.message || "Failed to update table",
      };
    }
  }
}

export class CreateFieldTool implements LuaTool {
  name = "create_airtable_field";
  description = "Create a new field (column) in an existing Airtable table. Requires base creator permissions.";

  inputSchema = z.object({
    userId: z.string().describe("The unique identifier of the user requesting this action (required for authentication)"),
    baseId: z.string().describe("The Airtable base ID containing the table"),
    tableId: z.string().describe("The table ID where the field will be created"),
    name: z.string().describe("The name for the new field"),
    type: z.string().describe("Field type (e.g., 'singleLineText', 'number', 'multipleSelects', 'date', 'checkbox', etc.)"),
    description: z.string().optional().describe("Optional field description"),
    options: z.record(z.any()).optional().describe("Field-specific options (varies by field type)")
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
      const result = await airtableService.createField(input);

      if (result.success) {
        return {
          success: true,
          message: "Field created successfully",
          field: result.field,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Create Airtable Field Error:", error);
      return {
        success: false,
        error: error.message || "Failed to create field",
      };
    }
  }
}

export class UpdateFieldTool implements LuaTool {
  name = "update_airtable_field";
  description = "Update the name or description of an existing field (column). Requires base creator permissions.";

  inputSchema = z.object({
    userId: z.string().describe("The unique identifier of the user requesting this action (required for authentication)"),
    baseId: z.string().describe("The Airtable base ID containing the table"),
    tableId: z.string().describe("The table ID containing the field"),
    fieldId: z.string().describe("The field ID to update"),
    name: z.string().optional().describe("New field name"),
    description: z.string().optional().describe("New field description (max 20,000 characters, or empty string to clear)")
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
      const result = await airtableService.updateField(input);

      if (result.success) {
        return {
          success: true,
          message: "Field updated successfully",
          field: result.field,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Update Airtable Field Error:", error);
      return {
        success: false,
        error: error.message || "Failed to update field",
      };
    }
  }
}
