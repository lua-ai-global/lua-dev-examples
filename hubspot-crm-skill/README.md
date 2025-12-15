# HubSpot CRM Skill - Lua AI Agent

A comprehensive Lua AI Agent skill for HubSpot CRM integration. Manage contacts, update deals, and track sales/marketing activity.

## Quick Start

```bash
npm install
npm run build
lua chat
lua push
```

## Tools Available

### 1. createContact
Create a new contact in HubSpot CRM.

### 2. createContactFromChat
Turn inbound chat conversations into HubSpot contacts. Automatically checks for existing contacts before creating duplicates.

### 3. updateDealStage
Update deal stages after sales calls or meetings.

### 4. getDealPipelines
Retrieve all pipelines and their stage IDs.

### 5. getContactActivitySummary
Get a comprehensive summary of a contact's recent marketing and sales activity (calls, emails, notes, tasks, meetings).

## Environment Variables

```bash
HUBSPOT_PRIVATE_APP_TOKEN=your-token-here
HUBSPOT_API_BASE_URL=https://api.hubapi.com
```

## Required HubSpot Scopes

- crm.objects.contacts.read
- crm.objects.contacts.write
- crm.objects.deals.read
- crm.objects.deals.write
- crm.schemas.deals.read

## Resources

- [Lua Docs](https://docs.heylua.ai)
- [HubSpot API Docs](https://developers.hubspot.com/docs/api/overview)
