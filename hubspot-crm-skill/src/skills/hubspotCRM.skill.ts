import { LuaSkill } from "lua-cli";
import CreateContactTool from "../tools/createContact.tool";
import CreateContactFromChatTool from "../tools/createContactFromChat.tool";
import UpdateContactTool from "../tools/updateContact.tool";
import UpdateDealStageTool from "../tools/updateDealStage.tool";
import GetDealPipelinesTool from "../tools/getDealPipelines.tool";
import GetContactActivitySummaryTool from "../tools/getContactActivitySummary.tool";

const hubspotCRM = new LuaSkill({
  name: "hubspotCRM",
  description: "HubSpot CRM integration skill for managing contacts, deals, and activity tracking",
  context: `
## HubSpot CRM Skill

This skill provides comprehensive HubSpot CRM integration for managing contacts, deals, and tracking sales/marketing activity.

### Available Tools

---

#### 1. createContact
Creates a new contact in HubSpot CRM.

**When to use:**
- When a user explicitly asks to add a new contact to HubSpot
- When you need to save customer information to the CRM
- For manual contact creation with known details

**Input Requirements:**
- At least one property must be provided (email, firstname, lastname, phone, or company)
- Email is strongly recommended as it serves as a unique identifier

**Example prompts:**
- "Create a contact with email john@example.com and name John Doe"
- "Add a new lead: Jane Smith from Acme Corp"

---

#### 2. createContactFromChat
Converts inbound chat conversations into HubSpot contacts. Automatically checks for existing contacts before creating.

**When to use:**
- After collecting contact information during a chat conversation
- When a visitor provides their email and wants to be added to your CRM
- To capture leads from chat interactions

**Best Practice:**
- Gather at minimum the email address during chat
- Include a brief chat summary for context
- The tool will check if contact exists before creating a duplicate

**Example prompts:**
- "Add this chat visitor to HubSpot: their email is sarah@company.com"
- "Create a contact from our chat - they mentioned they work at TechCorp"

---

#### 3. updateContact
Updates an existing contact's properties in HubSpot CRM.

**When to use:**
- When contact information needs to be corrected or updated
- After learning new details about a contact (new phone, company change, etc.)
- To modify any contact field (email, name, phone, company)

**Input Requirements:**
- Contact ID is required (can be found via search or previous API calls)
- At least one property to update must be provided

**Example prompts:**
- "Update contact 12345 with new phone number 555-1234"
- "Change the company for contact ID 67890 to Acme Corp"
- "Update John's contact to reflect his new email john.new@company.com"

---

#### 4. updateDealStage
Updates the pipeline stage of an existing deal after sales activities like calls or meetings.

**When to use:**
- After a sales call to reflect deal progression
- When moving deals through the pipeline (e.g., "Qualified" to "Contract Sent")
- To update deal status based on meeting outcomes

**Prerequisites:**
- You need the Deal ID (can be found in HubSpot URL or via search)
- You need the target stage ID (use getDealPipelines to find valid stage IDs)

**Common Stage IDs (default pipeline):**
- "qualifiedtobuy" - Qualified to Buy
- "presentationscheduled" - Presentation Scheduled
- "decisionmakerboughtin" - Decision Maker Bought-In
- "contractsent" - Contract Sent
- "closedwon" - Closed Won
- "closedlost" - Closed Lost

**Example prompts:**
- "Update deal 12345 to closedwon after today's call"
- "Move deal 67890 to contract sent stage"
- "Mark the deal as qualified after the discovery call"

---

#### 5. getDealPipelines
Retrieves all deal pipelines and their stages to help identify valid stage IDs.

**When to use:**
- Before updating a deal stage to find the correct stage ID
- When user asks about available deal stages
- To understand the sales pipeline structure

**Example prompts:**
- "What deal stages are available?"
- "Show me the sales pipeline stages"

---

#### 6. getContactActivitySummary
Provides a comprehensive summary of a contact's recent marketing and sales engagements.

**When to use:**
- Before a sales call to prepare with contact history
- To understand a contact's engagement level
- When asked about a contact's activity or interaction history
- For account research and relationship context

**What it includes:**
- Recent calls, emails, notes, tasks, and meetings
- Total engagement count across all types
- Most recent activity timestamp
- Contact details (name, email)

**Example prompts:**
- "What's the activity history for john@company.com?"
- "Summarize recent interactions with contact ID 12345"
- "Show me the engagement summary before my call with Sarah"
- "How engaged is this lead?"

---

### Error Handling

**Common Errors:**
- "Missing HUBSPOT_PRIVATE_APP_TOKEN" - Ensure the API token is configured
- "Contact not found" - Verify the contact ID or email exists
- "Deal not found" - Check that the deal ID is correct
- "Invalid deal stage" - Use getDealPipelines to find valid stage IDs

### Required HubSpot Scopes
Ensure your HubSpot Private App has these scopes:
- crm.objects.contacts.read
- crm.objects.contacts.write
- crm.objects.deals.read
- crm.objects.deals.write
- crm.schemas.deals.read
`.trim(),
  tools: [
    new CreateContactTool(),
    new CreateContactFromChatTool(),
    new UpdateContactTool(),
    new UpdateDealStageTool(),
    new GetDealPipelinesTool(),
    new GetContactActivitySummaryTool(),
  ],
});

export default hubspotCRM;
