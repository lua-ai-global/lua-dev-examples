import { LuaSkill } from "lua-cli";
import CreateContactTool from "../tools/createContact.tool";
import SearchContactsTool from "../tools/searchContacts.tool";
import GetContactTool from "../tools/getContact.tool";
import UpdateContactTool from "../tools/updateContact.tool";
import UpdateDealStageTool from "../tools/updateDealStage.tool";
import GetDealPipelinesTool from "../tools/getDealPipelines.tool";
import GetContactActivitySummaryTool from "../tools/getContactActivitySummary.tool";
import SearchCompaniesTool from "../tools/searchCompanies.tool";
import CreateCompanyTool from "../tools/createCompany.tool";
import GetCompanyTool from "../tools/getCompany.tool";

const hubspotCRM = new LuaSkill({
  name: "hubspotCRM",
  description: "HubSpot CRM integration skill for managing contacts, companies, deals, and activity tracking",
  context: `
## HubSpot CRM Skill

This skill provides comprehensive HubSpot CRM integration for managing contacts, companies, deals, and tracking sales/marketing activity.

### Available Tools

---

### Contact Management

#### 1. createContact
Creates a new contact in HubSpot CRM with automatic duplicate prevention.

**When to use:**
- When a user asks to add a new contact to HubSpot
- When capturing leads from conversations or chat
- When saving customer information to the CRM

**Input Requirements:**
- Email is required (used for duplicate detection)
- Optional: firstname, lastname, phone, company, chatSummary

**Example prompts:**
- "Create a contact with email john@example.com and name John Doe"
- "Add this chat visitor to HubSpot: sarah@company.com"

---

#### 2. searchContacts
Search for contacts by email, name, or company.

**When to use:**
- "Find john@example.com"
- "Look up contacts at Acme Corp"
- "Search for contacts named Sarah"

**Input Requirements:**
- query: The search term (email, name, or company)
- searchBy: Optional - specify which field to search (email, firstname, lastname, company)

---

#### 3. getContact
Get full details of a specific contact by ID.

**When to use:**
- After searching to get complete contact information
- When user asks for details about a specific contact
- "Show me contact 12345's info"

---

#### 4. updateContact
Updates an existing contact's properties in HubSpot CRM.

**When to use:**
- When contact information needs to be corrected or updated
- After learning new details about a contact
- "Update contact 12345 with new phone number"

---

#### 5. getContactActivitySummary
Provides a comprehensive summary of a contact's recent marketing and sales engagements.

**When to use:**
- Before a sales call to prepare with contact history
- To understand a contact's engagement level
- "What's the activity history for john@company.com?"

---

### Company Management

#### 6. searchCompanies
Search for companies by name or domain.

**When to use:**
- "Find companies named Acme"
- "Look up acme.com"
- "Search for tech companies"

**Input Requirements:**
- query: The search term (company name or domain)
- searchBy: Optional - specify 'name' or 'domain'

---

#### 7. createCompany
Creates a new company in HubSpot with automatic duplicate prevention by domain.

**When to use:**
- When adding a new company to the CRM
- When a contact mentions their company
- "Create a company called Acme Corp with domain acme.com"

---

#### 8. getCompany
Get full details of a specific company by ID.

**When to use:**
- After searching to get complete company information
- "Show me company 12345's details"

---

### Deal Management

#### 9. getDealPipelines
Retrieves all deal pipelines and their stages to help identify valid stage IDs.

**When to use:**
- Before updating a deal stage to find the correct stage ID
- When user asks about available deal stages
- "What deal stages are available?"

---

#### 10. updateDealStage
Updates the pipeline stage of an existing deal after sales activities.

**When to use:**
- After a sales call to reflect deal progression
- When moving deals through the pipeline
- "Update deal 12345 to closedwon"

**Common Stage IDs (default pipeline):**
- "qualifiedtobuy" - Qualified to Buy
- "presentationscheduled" - Presentation Scheduled
- "decisionmakerboughtin" - Decision Maker Bought-In
- "contractsent" - Contract Sent
- "closedwon" - Closed Won
- "closedlost" - Closed Lost

---

### Error Handling

**Common Errors:**
- "Missing HUBSPOT_PRIVATE_APP_TOKEN" - Ensure the API token is configured
- "Contact not found" - Verify the contact ID or email exists
- "Company not found" - Check that the company ID is correct
- "Deal not found" - Check that the deal ID is correct
- "Invalid deal stage" - Use getDealPipelines to find valid stage IDs

### Required HubSpot Scopes
Ensure your HubSpot Private App has these scopes:
- crm.objects.contacts.read
- crm.objects.contacts.write
- crm.objects.companies.read
- crm.objects.companies.write
- crm.objects.deals.read
- crm.objects.deals.write
- crm.schemas.deals.read
`.trim(),
  tools: [
    new CreateContactTool(),
    new SearchContactsTool(),
    new GetContactTool(),
    new UpdateContactTool(),
    new GetContactActivitySummaryTool(),
    new SearchCompaniesTool(),
    new CreateCompanyTool(),
    new GetCompanyTool(),
    new GetDealPipelinesTool(),
    new UpdateDealStageTool(),
  ],
});

export default hubspotCRM;
