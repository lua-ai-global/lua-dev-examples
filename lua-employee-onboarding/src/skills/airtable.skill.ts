import { LuaSkill } from "lua-cli";
import { GetRecordTool, ListRecordsTool, CreateRecordsTool, UpdateRecordTool, DeleteRecordTool, CreateBaseTool, ListBasesTool, CreateTableTool, UpdateTableTool, CreateFieldTool, UpdateFieldTool } from "./tools/AirtableTools";

const airtableSkill = new LuaSkill({
  name: "airtable-skill",
  version: "1.0.0",
  description: "Airtable database integration for managing, querying, and creating records in any Airtable base",
  
  context: `You have access to Airtable for managing data in bases and tables.

# Workflows:

## Creating Records
1. **List available bases**: Use list_airtable_bases to see what bases exist
2. **If base/table exists**: Use create_airtable_records directly with the data
3. **If base/table missing**: Inform user which base/table is needed and cannot proceed

**Important:** Field names in records must exactly match field names in the table (case-sensitive).

## Updating Records
1. **Get current record**: Use get_airtable_record to see existing values
2. **Update fields**: Use update_airtable_record to change only what's needed
3. **Verify field names**: Ensure exact case-sensitive matches

# Available Tools:

## get_airtable_record
Retrieve a single record by its record ID.

**Parameters:**
- baseId: The Airtable base ID (e.g., 'appXXXXXXXXXXXXXX')
- tableIdOrName: Table name or ID
- recordId: Record ID (e.g., 'recXXXXXXXXXXXXXX')
- cellFormat: Optional - 'json' (default) or 'string'
- returnFieldsByFieldId: Optional - Return fields by ID instead of name

## update_airtable_record
Update specific fields in an existing record. Only updates fields you specify.

**Parameters:**
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
- baseId: The Airtable base ID
- tableIdOrName: Table name or ID
- recordId: Record ID to delete

**Warning:** This action is permanent and cannot be reversed.

## create_airtable_records
Create 1-10 records in a table.

**Parameters:**
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

## list_airtable_records
Query and retrieve multiple records with filtering and sorting.

**Parameters:**
- baseId: The Airtable base ID
- tableIdOrName: Table name or ID
- fields: Optional - Array of field names to return
- filterByFormula: Optional - Filter using Airtable formulas
  - Examples: \`{Status} = 'Active'\`, \`AND({Type} = 'Lead', {Region} = 'West')\`
- sort: Optional - Array of sort objects with field and direction
- maxRecords: Optional - Limit results
- view: Optional - Use a predefined view
- offset: Optional - For pagination (provided in response when more records exist)

**Pagination:**
Results limited to 100 records per request. Use 'offset' from response to fetch next page.

## list_airtable_bases
List all bases accessible by your token. Returns up to 1000 bases per request.

**Parameters:**
- offset: Optional - For pagination (provided in response when more bases exist)

**Returns:**
- Array of bases with id, name, and permission level (none/read/comment/edit/create)
- Offset for next page if more bases exist

## create_airtable_table
Create a new table in an existing base. Requires base creator role.

**Parameters:**
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
- baseId: Base ID containing the table
- tableIdOrName: Table ID or name to update
- name: Optional - New table name
- description: Optional - New description (max 20,000 characters, empty string to clear)
- dateDependencySettings: Optional - Date dependency configuration

**Note:** Only specified properties are updated. Others remain unchanged.

## create_airtable_field
Create a new field (column) in an existing table. Requires base creator role.

**Parameters:**
- baseId: Base ID containing the table
- tableId: Table ID where field will be created
- name: Field name
- type: Field type (e.g., 'singleLineText', 'number', 'checkbox', 'multipleSelects')
- description: Optional - Field description
- options: Optional - Field-specific configuration

## update_airtable_field
Update field name or description. Requires base creator role.

**Parameters:**
- baseId: Base ID containing the table
- tableId: Table ID containing the field
- fieldId: Field ID to update
- name: Optional - New field name
- description: Optional - New description (max 20,000 characters, empty string to clear)

**Note:** At least one of name or description must be specified.

## create_airtable_base
Create a new Airtable base with tables and fields. Requires workspace creator role.

**Parameters:**
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

# Formula Examples:

Basic: \`{Status} = 'Active'\`
AND: \`AND({Status} = 'Active', {Priority} = 'High')\`
OR: \`OR({Type} = 'Lead', {Type} = 'Customer')\`
Date: \`{DueDate} >= TODAY()\`
Text: \`FIND('urgent', {Notes})\`

# Best Practices:

- Use filterByFormula to get specific records
- Use maxRecords to limit response size
- Handle pagination with offset when needed
- Field names must match exactly (case-sensitive)
- Rate limit: 5 requests/second per base`,

  tools: [
    new GetRecordTool(),
    new ListRecordsTool(),
    new CreateRecordsTool(),
    new UpdateRecordTool(),
    new DeleteRecordTool(),
    new ListBasesTool(),
    new CreateBaseTool(),
    new CreateTableTool(),
    new UpdateTableTool(),
    new CreateFieldTool(),
    new UpdateFieldTool(),
  ],
});

export default airtableSkill;

