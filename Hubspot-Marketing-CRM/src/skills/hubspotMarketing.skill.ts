import { LuaSkill } from "lua-cli";
import CreateMarketingListTool from "../tools/createMarketingList.tool";
import RefreshMarketingListTool from "../tools/refreshMarketingList.tool";
import EnrollContactsWorkflowTool from "../tools/enrollContactsInWorkflow.tool";
import SummarizeCampaignROITool from "../tools/summarizeCampaignROI.tool";
import SearchContactsTool from "../tools/searchContacts.tool";
import CreateContactTool from "../tools/createContact.tool";
import ListMarketingListsTool from "../tools/listMarketingLists.tool";
import GetWorkflowDetailsTool from "../tools/getWorkflowDetails.tool";
import PauseWorkflowTool from "../tools/pauseWorkflow.tool";
import ResumeWorkflowTool from "../tools/resumeWorkflow.tool";

const hubspotMarketing = new LuaSkill({
  name: "hubspotMarketing",
  description: "HubSpot Marketing Hub skill focused on audience hygiene, automation, and ROI storytelling.",
  context: `
## HubSpot Marketing Skill

This skill gives the agent full control over marketing audiences, workflows, and campaign ROI storytelling inside HubSpot Marketing Hub while remaining decoupled from the sales CRM primitives.

### Available Tools

----

#### Audience management

##### 1. createMarketingList
Creates a static or dynamic list from provided filters so email, ads, and workflow automation always target the right scope.

**When to use:**
- Launching a campaign and you need a precise audience (e.g., lifecycle stage + region).
- Building a nurture path that requires “MQL who visited pricing” type segments.

**Input requirements:**
- name (required) – clear human-readable list name.
- dynamic (optional) – enables ongoing evaluation.
- filters (optional) – array of property/condition triples (propertyName, operator, value).

**Example prompts:**
- “Create a marketing list called ‘Mid-market nurture’ for contacts with lifecycle stage marketingqualifiedlead and company size over 50.”
- “Build a dynamic audience for anyone who visited pricing in the last 30 days.”

----

##### 2. refreshMarketingList
Triggers an immediate refresh of the matching logic so new behavior enters audiences before the next send.

**When to use:**
- After you see a spike in intent and need contacts to appear in the list immediately.
- Just before a workflow enrollment window opens.

**Input requirements:**
- listId (required) – ID of the target marketing list.

**Example prompt:**
- “Refresh marketing list 12345 so the latest visitors are eligible.”

----

##### 3. listMarketingLists
Returns the marketing audiences you already own (name, ID, dynamic flag) to avoid redundant segmentation.

**When to use:**
- Before creating a new list so you can reuse or clear existing ones.

**Input requirements:**
- limit (optional) – how many lists to return.

**Example prompt:**
- “Show me the 10 most recent marketing lists.”

----

#### Workflow automation

##### 4. enrollContactsInWorkflow
Enters contacts into a workflow with automatic reporting of failures.

**When to use:**
- A segment moved to “high intent” and should be enrolled.
- Manual trigger after a lead scoring update.

**Input requirements:**
- workflowId (required) – workflow to touch.
- contactIds (required) – contacts to enroll.
- note (optional) – add context for auditing.

**Example prompt:**
- “Enroll contacts 101,102,103 into workflow 204 when they reach leadscore 80.”

----

##### 5. getWorkflowDetails
Fetches metadata, enrollment criteria, and status for a workflow before altering it.

**When to use:**
- You need to understand what a workflow currently does before pausing or resuming it.

**Input requirements:**
- workflowId (required).

**Example prompt:**
- “Explain workflow 204’s enrollment logic.”

----

##### 6. pauseWorkflow
Temporarily stops enrollments when the signal requires review or you’re about to revisit the workflow.

**When to use:**
- You detect segment overload or a bad campaign.

**Input requirements:**
- workflowId (required).

**Example prompt:**
- “Pause workflow 204 until we confirm the new trigger logic.”

----

##### 7. resumeWorkflow
Restarts paused workflows once the issue is resolved.

**When to use:**
- Quality checks pass and you’re ready to onboard new leads again.

**Input requirements:**
- workflowId (required).

**Example prompt:**
- “Resume workflow 204 and notify ops.”

----

#### Analytics & supporting tools

##### 8. summarizeCampaignROI
Produces revenue/contact metrics for marketing campaigns so leadership hears explainable performance.

**When to use:**
- Reporting weekly ROI or evaluating a new channel.

**Input requirements:**
- limit (optional) – number of campaigns to summarize.

**Example prompt:**
- “Summarize the ROI of the five latest campaigns.”

----

##### 9. searchContacts
Retrieves contact metadata needed to seed lists or workflows.

**When to use:**
- Finding contact IDs or verifying emails before automation.

**Input requirements:**
- query (required); optionally searchBy and limit.

**Example prompt:**
- “Search for sarah@brand.com.”

----

##### 10. createContact
Creates a contact with duplicate prevention and supports the marketing workflow by seeding leads early.

**When to use:**
- Capturing new leads from forms or chat before feeding them into automation.

**Input requirements:**
- email (required); optional firstname, lastname, phone, company, chatSummary.

**Example prompt:**
- “Create contact janedoe@example.com, Jane Doe from Luna Labs.”

----

### Guardrails
- Always verify list/filter intent before creation to prevent overlapping audiences.
- Record failures when enrolling contacts and retry or notify ops.
- Use ROI summaries before sending executive updates.

### Error handling
- “Missing HUBSPOT_PRIVATE_APP_TOKEN” – ensure token is configured and valid.
- “List not found” – confirm the list ID before refreshing or editing.
- “Workflow not found / cannot pause” – double-check workflow IDs and status.
- “Enrollment failed for contact X” – include the contact ID to track retries.

### Required HubSpot scopes

- crm.objects.contacts.read
- crm.objects.contacts.write
- crm.objects.companies.read
- crm.objects.companies.write
- crm.objects.deals.read
- crm.objects.deals.write
- crm.schemas.deals.read
`.trim(),
  tools: [
    new CreateMarketingListTool(),
    new RefreshMarketingListTool(),
    new ListMarketingListsTool(),
    new EnrollContactsWorkflowTool(),
    new GetWorkflowDetailsTool(),
    new PauseWorkflowTool(),
    new ResumeWorkflowTool(),
    new SummarizeCampaignROITool(),
    new SearchContactsTool(),
    new CreateContactTool(),
  ],
});

export default hubspotMarketing;
