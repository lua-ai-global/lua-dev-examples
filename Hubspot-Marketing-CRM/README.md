# Marketing CRM HubSpot

This folder is a standalone marketing-focused Lua AI Agent workspace. It encapsulates the marketing persona, tools, and helpers so you can iterate on audience hygiene, automation, and ROI storytelling independently.

## Layout

```
Marketing CRM Hubspot/
├── src/
│   ├── index.ts                    # Marketing agent entry point
│   ├── skills/
│   │   └── hubspotMarketing.skill.ts # Marketing skill prompts + guardrails
│   ├── tools/                      # Marketing tools for lists, workflows, and campaign reporting
│   └── utils/
│       └── hubspotMarketingHelpers.ts # Shared config + HubSpot Marketing helpers
└── README.md                       # This guide
```

### Tool catalog

| Tool | Purpose |
| --- | --- |
| `createMarketingList` | Build a static or dynamic list from CRM filters. |
| `refreshMarketingList` | Force list recalculation to capture the latest matching contacts. |
| `listMarketingLists` | Inventory the marketing audiences you already have. |
| `enrollContactsInWorkflow` | Enroll contacts in workflows for self-healing nurture. |
| `getWorkflowDetails` | Inspect workflow metadata before adjustments. |
| `pauseWorkflow` | Pause enrollments when manual review is required. |
| `resumeWorkflow` | Resume workflows once the underlying issue is resolved. |
| `summarizeCampaignROI` | Provide explainable campaign revenue/contact impact. |
| `searchContacts` | Retrieve contacts by email/name/company for segmentation. |
| `createContact` | Persist new leads before feeding them into automation. |

## Highlights

- `createMarketingList` builds audiences (static/dynamic) from CRM filters.
- `refreshMarketingList` reruns filters to capture new intent signals.
- `listMarketingLists` inventories existing audiences before creating new ones.
- `enrollContactsInWorkflow` keeps nurture systems autonomous and self-healing.
- `getWorkflowDetails` inspects workflow metadata before edits.
- `pauseWorkflow` halts enrollments when segments need manual review.
- `resumeWorkflow` restarts paused workflows once issues are resolved.
- `summarizeCampaignROI` surfaces explainable revenue/contact impact for campaigns.
- Marketing tools reuse `createContact`/`searchContacts` so the marketing skill remains self-contained.

## Tools (10 total)

| Tool | Purpose |
| --- | --- |
| `createMarketingList` | Build a static or smart list from contact filters. |
| `refreshMarketingList` | Force a list to refresh and capture the latest matching contacts. |
| `listMarketingLists` | Return the available marketing audiences plus metadata. |
| `enrollContactsInWorkflow` | Enroll multiple contacts into a workflow to trigger nurturing. |
| `getWorkflowDetails` | Fetch workflow configuration before making automation decisions. |
| `pauseWorkflow` | Temporarily stop enrollments when manual intervention is needed. |
| `resumeWorkflow` | Restart paused workflows once the issue is resolved. |
| `summarizeCampaignROI` | Summarize campaign ROI, revenue, and contact metrics for reporting. |
| `searchContacts` | Find contact IDs/properties needed for audiences or workflows. |
| `createContact` | Persist new leads before feeding them to the marketing automation. |

## Setup

1. From the repository root run `npm install` once; the marketing workspace shares the same `node_modules`.
2. Navigate into this folder: `cd "Marketing CRM Hubspot"`.
3. Run marketing-specific scripts using the root `package.json` commands, e.g., `npm run build` or `lua chat` (the marketing entry point expects the marketing skill to be compiled too).

## Environment

Use a HubSpot Private App token that includes the required scopes listed in the root README:

```bash
HUBSPOT_PRIVATE_APP_TOKEN=your-private-app-token
HUBSPOT_API_BASE_URL=https://api.hubapi.com
```

## Verification

- `npm run build` at the repo root compiles both the CRM and marketing TypeScript sources (the marketing folder sits under `src` for the standalone persona).

## Why this structure?

Keeping the marketing skill in its own folder avoids prompting conflicts and lets you deploy the marketing persona independently. Use this directory when you want a mission-critical marketing agent focused on lists, workflows, and ROI storytelling.
