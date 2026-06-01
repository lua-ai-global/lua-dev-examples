import { LuaSkill } from 'lua-cli';
import { SearchPropertiesTool } from './tools/tenant/SearchPropertiesTool';
import { ScheduleViewingTool } from './tools/tenant/ScheduleViewingTool';
import { CancelViewingTool } from './tools/tenant/CancelViewingTool';
import { SubmitMaintenanceRequestTool } from './tools/tenant/SubmitMaintenanceRequestTool';
import { AskLeaseQuestionTool } from './tools/tenant/AskLeaseQuestionTool';
import { ApplyForPropertyTool } from './tools/tenant/ApplyForPropertyTool';
import { GetApplicationStatusTool } from './tools/tenant/GetApplicationStatusTool';
import { ComparePropertiesTool } from './tools/tenant/ComparePropertiesTool';
import { DeleteAllDevTool } from './tools/tenant/DeleteAllDevTool';

export const tenantEngagementSkill = new LuaSkill({
  name: 'tenant-engagement',
  description: 'Tenant-facing tools for property search, comparison, viewing management, applications, maintenance requests, and lease questions.',

  context: `## Tenant Engagement

You help tenants find properties, schedule viewings, ask lease questions, submit maintenance requests, and apply for rentals.

**Property Search & Comparison:**
- When showing search results, present each property with name, neighborhood, rent, bedrooms, key amenities, and availability
- Highlight pet-friendly status and pet deposits when relevant
- If no results, suggest broadening the search criteria
- When a tenant is deciding between properties, proactively offer to compare them side-by-side using compare_properties

**Applications — CRITICAL FLOW:**
- Before submitting an application, gather ALL required info conversationally: name, email, monthly income, employment status, credit score
- Optional but helpful: rental history years, negative remarks, pets, desired move-in date
- After apply_for_property returns an applicationId, you MUST IMMEDIATELY call process_application with that applicationId — do NOT wait for user input
- This automatic chaining is the core experience: apply → score → lease in one flow

**Application Status:**
- When a tenant asks about their application, use get_application_status to look it up by ID, name, or email
- If status is "under-review", reassure them a property manager will follow up within 1-2 business days

**Viewings:**
- Viewings are weekdays only (Mon-Fri), 9am-5pm
- Require tenant name and phone number
- Tenants can cancel or reschedule viewings using their confirmation ID

**Maintenance:**
- Categorize issues properly (plumbing, electrical, hvac, appliance, structural, pest, other)
- Set appropriate urgency — emergency for safety hazards or flooding only`,

  tools: [
    new SearchPropertiesTool(),
    new ComparePropertiesTool(),
    new ScheduleViewingTool(),
    new CancelViewingTool(),
    new SubmitMaintenanceRequestTool(),
    new AskLeaseQuestionTool(),
    new ApplyForPropertyTool(),
    new GetApplicationStatusTool(),
    new DeleteAllDevTool(),
  ],
});
