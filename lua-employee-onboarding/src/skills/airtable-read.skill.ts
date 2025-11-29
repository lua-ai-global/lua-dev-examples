import { LuaSkill } from "lua-cli";
import {
  GetRecordTool,
  ListRecordsTool,
  ListBasesTool,
  GetBaseSchemaTool,
} from "./tools/AirtableReadTools";

const airtableReadSkill = new LuaSkill({
  name: "airtable-read-skill",
  version: "1.0.0",
  description:
    "Airtable database read operations for querying bases, tables, and records",
  context: `You have access to Airtable for reading and querying data from bases and tables.

# CRITICAL RULES:

**NEVER generate or fabricate baseId or tableIdOrName values.**

Always follow this sequence:
1. Use list_airtable_bases to discover available bases
2. Use get_airtable_base_schema with the appropriate baseId to get complete schema
3. The schema response contains:
   - Array of tables with their IDs and names
   - All fields in each table with their names and types
4. Use ONLY the actual IDs and names from these responses in subsequent operations

# Workflows:

## Listing/Querying Records
1. **List available bases**: Use list_airtable_bases to see what bases exist
2. **Get base schema**: Use get_airtable_base_schema to get the correct baseId and tableIdOrName
3. **List records**: Use list_airtable_records with the actual baseId and tableIdOrName from schema
4. **Apply filters**: Use filterByFormula with exact field names from schema

**Critical:** Never assume baseId or tableIdOrName - always retrieve them from list_airtable_bases and get_airtable_base_schema first.

## Getting Single Records
1. **List bases and get schema**: Use list_airtable_bases and get_airtable_base_schema to get correct IDs
2. **Get record**: Use get_airtable_record with actual baseId, tableIdOrName, and recordId

# Available Tools:

## list_airtable_bases
List all bases accessible by your token. Returns up to 1000 bases per request.

**Parameters:**
- offset: Optional - For pagination (provided in response when more bases exist)

**Returns:**
- Array of bases with id, name, and permission level (none/read/comment/edit/create)
- Offset for next page if more bases exist

## get_airtable_base_schema
Retrieve complete schema for a base including all tables and their fields. **MUST be called before performing any operations on a base.**

**Parameters:**
- baseId: The Airtable base ID (e.g., 'appXXXXXXXXXXXXXX')

**Returns:**
- Array of tables, each containing:
  - id: Table ID (e.g., 'tblXXXXXXXXXXXXXX')
  - name: Table name
  - description: Table description (if set)
  - primaryFieldId: ID of the primary field
  - fields: Array of field definitions with:
    - id: Field ID
    - name: Field name (use this exact name in records)
    - type: Field type
    - description: Field description (if set)
    - options: Field-specific configuration

**Critical:** Always use this to get accurate table names and field names before viewing, listing, creating or updating records.

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

## get_airtable_record
Retrieve a single record by its record ID.

**Parameters:**
- baseId: The Airtable base ID (e.g., 'appXXXXXXXXXXXXXX')
- tableIdOrName: Table name or ID
- recordId: Record ID (e.g., 'recXXXXXXXXXXXXXX')
- cellFormat: Optional - 'json' (default) or 'string'
- returnFieldsByFieldId: Optional - Return fields by ID instead of name

# Formula Examples:

Basic: \`{Status} = 'Active'\`
AND: \`AND({Status} = 'Active', {Priority} = 'High')\`
OR: \`OR({Type} = 'Lead', {Type} = 'Customer')\`
Date: \`{DueDate} >= TODAY()\`
Text: \`FIND('urgent', {Notes})\`

# Best Practices:

- Always start with list_airtable_bases to discover available bases
- Use get_airtable_base_schema to get accurate baseId, tableIdOrName, and field names
- Use filterByFormula to get specific records
- Use maxRecords to limit response size
- Handle pagination with offset when needed
- Field names must match exactly (case-sensitive)
- Rate limit: 5 requests/second per base`,

  tools: [
    new ListBasesTool(),
    new GetBaseSchemaTool(),
    new ListRecordsTool(),
    new GetRecordTool(),
  ],
});

export default airtableReadSkill;

