HubSpot CRM Skill - Lua AI Agent
A production-ready Lua AI Agent skill for comprehensive HubSpot CRM integration. Manage contacts, companies, deals, and track sales/marketing activity with fail-safe duplicate prevention.

Features
10 CRM Tools - Complete contact, company, and deal management
Fail-Safe Duplicate Prevention - Blocks creation if duplicate-check fails (network error, rate limit, auth error)
Consistent Architecture - All tools use shared configuration helpers
Production Ready - Comprehensive error handling and input validation
Quick Start
# Install dependencies
npm install
# Build TypeScript
npm run build
# Test interactively
lua chat
# Deploy to Lua
lua push

Available Tools (10)
Contact Management
Tool	Description
createContact	Create new contact with duplicate prevention by email
searchContacts	Search contacts by email, name, or company
getContact	Get full contact details by ID
updateContact	Update existing contact properties
getContactActivitySummary	Summarize recent calls, emails, notes, tasks, meetings

Company Management
Tool	Description
createCompany	Create new company with duplicate prevention by domain
searchCompanies	Search companies by name or domain
getCompany	Get full company details by ID

Deal Management
Tool	Description
getDealPipelines	Get available pipelines and stage IDs
updateDealStage	Update deal stage after sales calls

Environment Variables
# Required
HUBSPOT_PRIVATE_APP_TOKEN=your-private-app-token
# Optional (defaults to HubSpot production API)
HUBSPOT_API_BASE_URL=https://api.hubapi.com

Required HubSpot Scopes
Your HubSpot Private App must have these scopes:

crm.objects.contacts.read
crm.objects.contacts.write
crm.objects.companies.read
crm.objects.companies.write
crm.objects.deals.read
crm.objects.deals.write
crm.schemas.deals.read

Project Structure
src/
├── index.ts                    # Agent configuration
├── skills/
│   └── hubspotCRM.skill.ts     # Skill definition with context
├── tools/
│   ├── createContact.tool.ts
│   ├── searchContacts.tool.ts
│   ├── getContact.tool.ts
│   ├── updateContact.tool.ts
│   ├── getContactActivitySummary.tool.ts
│   ├── searchCompanies.tool.ts
│   ├── createCompany.tool.ts
│   ├── getCompany.tool.ts
│   ├── getDealPipelines.tool.ts
│   └── updateDealStage.tool.ts
└── utils/
    └── hubspotHelpers.ts       # Shared configuration and helpers

Architecture Notes
Lua CLI Bundler Compliant: Each tool uses export default class with inline inputSchema
Fail-Safe Duplicate Prevention: If HubSpot API fails during duplicate check, creation is blocked
Consistent Configuration: All tools use getHubSpotConfig() helper
Native Fetch: No external HTTP dependencies (uses Node.js native fetch)
Error Handling
All tools return consistent response objects:

// Success
{ ok: true, ... }
// Failure
{ ok: false, error: "Human-readable error message" }
// Duplicate found
{ ok: true, alreadyExists: true, contactId: "123", ... }

Resources
Lua Documentation
HubSpot API Reference
HubSpot Private Apps
License
MIT