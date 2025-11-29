import { LuaSkill } from "lua-cli";
import {
  CreateRecordsTool,
  UpdateRecordTool,
  DeleteRecordTool,
  CreateBaseTool,
  CreateTableTool,
  UpdateTableTool,
  CreateFieldTool,
  UpdateFieldTool,
} from "./tools/AirtableWriteTools";

const airtableWriteSkill = new LuaSkill({
  name: "airtable-write-skill",
  version: "1.0.0",
  description:
    "Airtable database write operations for creating, updating, and deleting bases, tables, fields, and records",
  context: `You have access to Airtable for writing and modifying data in bases and tables.

# CRITICAL RULES:

**NEVER generate or fabricate baseId or tableIdOrName values.**

Always follow this sequence:
1. Use list_airtable_bases (from read skill) to discover available bases
2. Use get_airtable_base_schema (from read skill) with the appropriate baseId to get complete schema
3. The schema response contains:
   - Array of tables with their IDs and names
   - All fields in each table with their names and types
4. Use ONLY the actual IDs and names from these responses in subsequent operations

**All write operations require a userId parameter for authentication and authorization.**

# Workflows:

## Creating Records
1. **List available bases**: Use list_airtable_bases (read skill) to see what bases exist
2. **Get base schema**: Use get_airtable_base_schema (read skill) to get baseId, tableIdOrName, and field names
3. **Create records**: Use create_airtable_records with userId and exact baseId, tableIdOrName, and field names from schema
4. **If base/table missing**: Inform user which base/table is needed and cannot proceed

**Important:** Field names in records must exactly match field names in the table (case-sensitive).

## Updating Records
1. **List bases and get schema**: Use list_airtable_bases and get_airtable_base_schema (read skill) to get correct IDs
2. **Get current record**: Use get_airtable_record (read skill) with actual baseId and tableIdOrName from schema
3. **Update fields**: Use update_airtable_record with userId to change only what's needed
4. **Verify field names**: Ensure exact case-sensitive matches with schema

## Deleting Records
1. **Verify record exists**: Use get_airtable_record (read skill) to confirm the record
2. **Delete record**: Use delete_airtable_record with userId
3. **Confirm action**: This action is permanent and cannot be undone

## Creating Schema (Bases, Tables, Fields)
1. **Check existing bases**: Use list_airtable_bases (read skill) to avoid duplicates
2. **Create new structures**: Use create_airtable_base, create_airtable_table, or create_airtable_field with userId
3. **Verify creation**: Use get_airtable_base_schema (read skill) to confirm the new structure

# Available Tools:

## create_airtable_records
Create 1-10 records in a table.

**Parameters:**
- userId: The unique identifier of the user requesting this action (required for authentication)
- baseId: The Airtable base ID
- tableIdOrName: Table name or ID
- records: Array of record objects (max 10), each with a 'fields' object
  - Example: [{ fields: { "Name": "John Doe", "Email": "john@example.com" } }]
- typecast: Optional - Auto-convert string values to proper field types
- returnFieldsByFieldId: Optional - Return fields by ID instead of name

**Important:**
- Field names are case-sensitive
- Maximum 10 records per request
- Returns created record IDs in response

## update_airtable_record
Update specific fields in an existing record. Only updates fields you specify.

**Parameters:**
- userId: The unique identifier of the user requesting this action (required for authentication)
- baseId: The Airtable base ID
- tableIdOrName: Table name or ID
- recordId: Record ID to update
- fields: Object with field names and new values
  - Example: { "Status": "Complete", "Notes": "Updated info" }
- typecast: Optional - Auto-convert string values to proper field types
- returnFieldsByFieldId: Optional - Return fields by ID instead of name

**Note:** Only specified fields are updated. Other fields remain unchanged.

## delete_airtable_record
Delete a single record permanently. Cannot be undone.

**Parameters:**
- userId: The unique identifier of the user requesting this action (required for authentication)
- baseId: The Airtable base ID
- tableIdOrName: Table name or ID
- recordId: Record ID to delete

**Warning:** This action is permanent and cannot be reversed.

## create_airtable_base
Create a new Airtable base with tables and fields. Requires workspace creator role.

**Parameters:**
- userId: The unique identifier of the user requesting this action (required for authentication)
- name: Base name
- workspaceId: Optional - Workspace ID (uses AIRTABLE_WORKSPACE_ID from env if not provided)
- tables: Array of table definitions (at least 1 required)
  - name: Table name
  - description: Optional table description
  - fields: Array of field definitions (at least 1 required)
    - name: Field name (unique within table)
    - type: Field type (e.g., 'singleLineText', 'number', 'multipleSelects')
    - description: Optional field description
    - options: Field-specific options

**Important:**
- First field in each table becomes the primary field
- Field names must be unique within table (case-insensitive)
- Default grid view created automatically for each table

## create_airtable_table
Create a new table in an existing base. Requires base creator role.

**Parameters:**
- userId: The unique identifier of the user requesting this action (required for authentication)
- baseId: Base ID where table will be created
- name: Table name
- description: Optional table description (max 20,000 characters)
- fields: Array of field definitions (at least 1 required)
  - name: Field name (unique within table)
  - type: Field type (e.g., 'singleLineText', 'number', 'multipleSelects')
  - description: Optional field description
  - options: Field-specific options

**Important:**
- First field becomes the primary field
- Field names must be unique within table (case-insensitive)
- Default grid view created automatically

## update_airtable_table
Update table properties (name, description, date dependency settings). Requires base creator role.

**Parameters:**
- userId: The unique identifier of the user requesting this action (required for authentication)
- baseId: Base ID containing the table
- tableIdOrName: Table ID or name to update
- name: Optional - New table name
- description: Optional - New description (max 20,000 characters, empty string to clear)
- dateDependencySettings: Optional - Date dependency configuration

**Note:** Only specified properties are updated. Others remain unchanged.

## create_airtable_field
Create a new field (column) in an existing table. Requires base creator role.

**Parameters:**
- userId: The unique identifier of the user requesting this action (required for authentication)
- baseId: Base ID containing the table
- tableId: Table ID where field will be created
- name: Field name
- type: Field type (e.g., 'singleLineText', 'number', 'checkbox', 'multipleSelects')
- description: Optional - Field description
- options: Optional - Field-specific configuration

## update_airtable_field
Update field name or description. Requires base creator role.

**Parameters:**
- userId: The unique identifier of the user requesting this action (required for authentication)
- baseId: Base ID containing the table
- tableId: Table ID containing the field
- fieldId: Field ID to update
- name: Optional - New field name
- description: Optional - New description (max 20,000 characters, empty string to clear)

**Note:** At least one of name or description must be specified.

# Supported Field Types:

Common types:
- singleLineText, multilineText, richText
- email, url, phoneNumber
- number, percent, currency, rating, duration
- singleSelect, multipleSelects
- date, dateTime
- checkbox
- multipleAttachments
- singleCollaborator, multipleCollaborators
- multipleRecordLinks

Advanced types:
- formula, rollup, lookup, multipleLookupValues, count
- autoNumber, barcode
- button, aiText
- createdTime, lastModifiedTime, createdBy, lastModifiedBy
- externalSyncSource

# Best Practices:

- Always verify baseId and tableIdOrName from schema before write operations
- Use userId for all write operations to enable proper authentication and audit trails
- Field names must match exactly (case-sensitive)
- Test with read operations first to ensure correct IDs
- Rate limit: 5 requests/second per base
- Consider using typecast cautiously to avoid unexpected data type conversions`,

  tools: [
    new CreateRecordsTool(),
    new UpdateRecordTool(),
    new DeleteRecordTool(),
    new CreateBaseTool(),
    new CreateTableTool(),
    new UpdateTableTool(),
    new CreateFieldTool(),
    new UpdateFieldTool(),
  ],
});

export default airtableWriteSkill;

