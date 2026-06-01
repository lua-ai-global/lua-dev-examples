# ProposalPro - Auto Proposal Generation Agent

An AI agent that automates the full consulting proposal lifecycle: client discovery, scope definition, pricing, document generation, and pipeline tracking. Built on lua-cli (TypeScript).

## Architecture

```
src/
  index.ts                                 # LuaAgent config + ProposalPro persona
  types/
    proposal.types.ts                      # Shared interfaces, enums, standard rates
  utils/
    data.utils.ts                          # Safe Data API wrapper (safeGetEntry, unwrapEntry)
    pricing.utils.ts                       # Rate calcs, discounts, retainer/milestone math, shared pricing engine
    formatting.utils.ts                    # Markdown rendering, scope tables, timelines
    template.utils.ts                      # {{variable}} interpolation, default sections
  skills/
    discovery.skill.ts                     # Client intake (4 tools)
    scope-pricing.skill.ts                 # Scope & pricing (5 tools)
    proposal-assembly.skill.ts             # Proposal generation (7 tools)
    pipeline.skill.ts                      # Pipeline tracking (5 tools)
    tools/
      CreateClientProfileTool.ts           # Capture client info -> Data.create('clients')
      SearchClientsTool.ts                 # Semantic search clients -> Data.search()
      GetClientProfileTool.ts              # Get client by ID
      UpdateClientProfileTool.ts           # Edit existing client profiles
      CreateScopeOfWorkTool.ts             # Define deliverables with auto-rate fill
      SearchScopesTool.ts                  # Semantic search scopes
      ListScopesTool.ts                    # List scopes by client with pagination
      UpdateScopeOfWorkTool.ts             # Add/remove items, edit scope fields
      EstimatePricingTool.ts               # Multi-model pricing calculator (no persistence)
      GenerateExecutiveSummaryTool.ts      # AI-generated exec summary -> AI.generate()
      GenerateProposalTool.ts              # Full proposal assembly + AI content (all pricing models)
      UpdateProposalTool.ts                # Edit draft proposal content
      DuplicateProposalTool.ts             # Clone proposal as new draft (warns on new client)
      SaveTemplateTool.ts                  # Store reusable templates
      SearchTemplatesTool.ts               # Find templates by keyword
      DeleteTemplateTool.ts                # Delete a template
      UpdateProposalStatusTool.ts          # Status transitions with validation
      ListProposalsTool.ts                 # Query proposals with filters + fuzzy client search
      GetProposalTool.ts                   # Retrieve proposal (full/summary/markdown)
      DeleteProposalTool.ts                # Delete draft proposals
      PipelineSummaryTool.ts               # Pipeline analytics dashboard
```

## Quick Start

```bash
npm install
lua compile        # Compile and sync with server
lua chat           # Chat with the agent in sandbox mode
```

## Skills & Tools Reference

### 1. Client Discovery (4 tools)

| Tool                    | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| `create_client_profile` | Capture company name, industry, size, contacts, pain points, budget, timeline |
| `search_clients`        | Semantic search across existing clients by name/industry/pain points          |
| `get_client_profile`    | Retrieve full client details by ID                                            |
| `update_client_profile` | Edit existing client — add contacts, update pain points, budget, notes        |

### 2. Scope & Pricing (5 tools)

| Tool                   | Description                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `create_scope_of_work` | Define phases, deliverables, roles, hours. Auto-fills rates for 13 standard roles (case-insensitive) |
| `search_scopes`        | Semantic search across existing scopes by title, overview, or deliverable names                      |
| `list_scopes`          | List scopes with optional client filter and pagination                                               |
| `update_scope_of_work` | Modify existing scopes — update title/overview, add/remove items, change assumptions/exclusions      |
| `estimate_pricing`     | Multi-model calculator: fixed, T&M, retainer, milestone, value-based                                 |

**Standard Roles & Rates** (case-insensitive lookup):

| Role                  | Rate/hr |
| --------------------- | ------: |
| Junior Consultant     |    $125 |
| Consultant            |    $175 |
| Senior Consultant     |    $225 |
| Principal Consultant  |    $300 |
| Managing Director     |    $400 |
| Subject Matter Expert |    $350 |
| Project Manager       |    $200 |
| Technical Architect   |    $275 |
| Data Analyst          |    $150 |
| UX Designer           |    $175 |
| Developer             |    $200 |
| Senior Developer      |    $250 |
| QA Engineer           |    $150 |

**Volume Discounts:** 5% over $50k, 10% over $100k, 15% over $250k

### 3. Proposal Assembly (7 tools)

| Tool                         | Description                                                                                                                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate_executive_summary` | AI-generates exec summary with configurable tone (formal/conversational/persuasive)                                                                                                                                                                               |
| `generate_proposal`          | Full proposal assembly with all pricing models: fetches client/scope, AI content, Markdown render, saves as draft. For retainer, pass `retainerMonthlyHours` + `retainerTermMonths`. For milestone, pass `milestones[]`. For value-based, pass `valueMultiplier`. |
| `update_proposal`            | Edit a draft proposal — update title, executive summary, content, or validity period                                                                                                                                                                              |
| `duplicate_proposal`         | Clone an existing proposal as a new draft. Warns when duplicating to a new client (content still references original)                                                                                                                                             |
| `save_template`              | Store reusable templates with `{{variable}}` placeholders                                                                                                                                                                                                         |
| `search_templates`           | Semantic search templates by industry/type                                                                                                                                                                                                                        |
| `delete_template`            | Delete a template by entry ID                                                                                                                                                                                                                                     |

**Template Variables:** `{{companyName}}`, `{{industry}}`, `{{contactName}}`, `{{contactTitle}}`, `{{painPoints}}`, `{{scopeTitle}}`, `{{scopeOverview}}`, `{{totalHours}}`, `{{total}}`, `{{date}}`

### 4. Pipeline (5 tools)

| Tool                     | Description                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `update_proposal_status` | Move through pipeline with transition validation                                                 |
| `list_proposals`         | Query by status/client with pagination. Fuzzy client name search when used without status filter |
| `get_proposal`           | Retrieve in full, summary, or rendered Markdown format                                           |
| `delete_proposal`        | Delete a draft proposal (non-draft proposals are protected)                                      |
| `pipeline_summary`       | Dashboard: counts by status, pipeline value, win rate, expiry alerts                             |

**Pipeline Stages:** `draft` -> `sent` -> `under_review` -> `accepted` / `rejected` / `expired`

## Data Collections

| Collection  | Purpose                     | Search Fields                  |
| ----------- | --------------------------- | ------------------------------ |
| `clients`   | Client profiles             | company, industry, pain points |
| `scopes`    | Scope of work definitions   | title, deliverables            |
| `proposals` | Full generated proposals    | title, client, status          |
| `templates` | Reusable proposal templates | name, industry, type           |

---

## Demo Walkthrough

This walkthrough exercises every tool and skill in the agent. Run each step in order.

### Prerequisites

```bash
npm install
lua compile
lua chat clear --force
```

### Step 1: Client Discovery

Start a sandbox chat session and create your first client.

```bash
lua chat -e sandbox
```

**You:** I need to create a proposal for a healthcare company called MedTech Solutions. They're a medium-sized company struggling with data silos, manual reporting, and poor patient outcome tracking. My contact is Sarah Chen, VP of Operations, sarah@medtech.com. Budget is $75k-$120k, timeline Q2 2026.

**What happens:** The agent searches for existing clients (exercises `search_clients`), finds none, then creates a profile (exercises `create_client_profile`). It confirms the details and suggests moving to scoping.

**Verify:** Note the `clientId` returned. Then ask:

**You:** Show me Sarah's full profile.

**What happens:** Exercises `get_client_profile` — returns all stored details.

**You:** Actually, Sarah mentioned they also need HIPAA compliance consulting. Add that as a pain point and update her title to Chief Operations Officer.

**What happens:** Exercises `update_client_profile` — appends the pain point and updates the contact title.

### Step 2: Scope & Pricing

**You:** Let's scope this out. Break it into discovery, design, implementation, and training phases. Use your judgment on deliverables and hours — keep it within their budget. Show me the pricing breakdown.

**What happens:** The agent creates a scope of work (exercises `create_scope_of_work`) with auto-filled standard rates (case-insensitive — "senior consultant" resolves to $225/hr), then runs pricing (exercises `estimate_pricing`) with the fixed model. It presents the full breakdown with phases, roles, hours, rates, and volume discounts.

**Verify:** Check that the total is within the $75k-$120k budget and that volume discounts are applied correctly (5% over $50k, 10% over $100k).

**You:** Search for any existing scopes related to healthcare data.

**What happens:** Exercises `search_scopes` — finds the scope just created (and any from prior sessions). Returns scope IDs, titles, total hours, and relevance scores.

**You:** List all scopes for this client.

**What happens:** Exercises `list_scopes` with clientId filter — shows all scopes for the MedTech client with pagination.

**You:** Actually, add a "Security Audit" deliverable to the implementation phase (40 hours, Senior Consultant), and remove the training workshop.

**What happens:** Exercises `update_scope_of_work` — adds the new item with auto-filled rate, removes the specified deliverable, and returns updated totals.

**You:** Can you also show me what this would look like as a retainer model? Say 80 hours/month for 6 months.

**What happens:** Exercises `estimate_pricing` again with the retainer model — shows monthly rate (includes 10% retainer discount), term, and total contract value. The agent will compare both options.

### Step 3: Template Management

**You:** Before we generate, search for any existing healthcare templates.

**What happens:** Exercises `search_templates` — may find templates from previous sessions or return empty.

**You:** Save this as a reusable template called "Healthcare Data Integration Assessment" with sections: Executive Summary, Understanding Your Challenges, Our Approach, Scope of Work, Team & Expertise, Timeline, Investment, Terms & Conditions, and Next Steps.

**What happens:** Exercises `save_template` with `{{variable}}` placeholders. Returns a `templateId`.

**You:** Search for healthcare templates now.

**What happens:** Exercises `search_templates` again — finds the just-saved template with a high relevance score.

**You:** Delete that old generic template we don't need anymore.

**What happens:** Exercises `delete_template` — removes the template by entry ID.

### Step 4: Proposal Generation

**You:** Generate the full proposal using the consulting proposal type and retainer pricing (80 hours/month, 6 months). Use the template we just saved.

**What happens:** Exercises `generate_proposal` with `pricingModel: "retainer"`, `retainerMonthlyHours: 80`, `retainerTermMonths: 6` — fetches client, scope, and template; calculates retainer pricing (not just subtotal - discount); generates AI content; renders to Markdown; saves as a draft. Returns the proposal ID and total reflecting the retainer model.

**You:** Show me the full proposal in markdown format.

**What happens:** Exercises `get_proposal` with format `markdown` — renders the complete proposal document with all sections including retainer details.

**You:** Can I see just a quick summary of this proposal?

**What happens:** Exercises `get_proposal` with format `summary` — returns key fields only (title, client, status, total, dates).

### Step 5: Executive Summary Refinement & Proposal Editing

**You:** I want to tweak the executive summary. Regenerate it with a formal tone and emphasize ROI and patient outcomes.

**What happens:** Exercises `generate_executive_summary` with tone `formal` and focusAreas `["ROI", "patient outcomes"]`. Returns the new summary text for review.

**You:** Update the proposal with this new executive summary. Also change the title to "MedTech Solutions - Data Integration & Analytics" and extend validity to 60 days.

**What happens:** Exercises `update_proposal` — updates the title, executive summary, and resets validity to 60 days from now. Only works because the proposal is in `draft` status.

### Step 6: Proposal Duplication

**You:** Duplicate this proposal for a different client — use the PayFlow client.

**What happens:** Exercises `duplicate_proposal` with `newClientId` — creates a copy as a new draft with a fresh proposal ID. Shows `duplicatedFrom` reference and a **warning** that the content still references the original client (MedTech), suggesting to regenerate with `generate_proposal` for client-specific content.

**You:** Delete that duplicated proposal — I'll regenerate it properly for PayFlow instead.

**What happens:** Exercises `delete_proposal` — deletes the draft proposal. (Only drafts can be deleted — sent/accepted/etc. are protected.)

### Step 7: Pipeline Management

**You:** Mark the original MedTech proposal as sent. Reason: "Emailed to Sarah Chen on March 11."

**What happens:** Exercises `update_proposal_status` — transitions from `draft` to `sent`, records the reason in status history.

**You:** Now move it to under review. Sarah confirmed she's reviewing it with her team.

**What happens:** Exercises `update_proposal_status` again — transitions from `sent` to `under_review`.

**You:** Try marking it as expired.

**What happens:** Exercises `update_proposal_status` — this should work since `under_review` -> `expired` is a valid transition.

**You:** Now try moving it back to sent.

**What happens:** The agent attempts the transition and gets an error: `expired` is a terminal state with no valid transitions. It explains this to you.

### Step 8: Pipeline Analytics

**You:** Show me my full pipeline summary.

**What happens:** Exercises `pipeline_summary` — returns:

- Total proposals and count by status
- Active pipeline value (sum of draft + sent + under_review)
- Win rate (accepted / (accepted + rejected), or "no data" if none decided)
- Alerts for proposals expiring within 7 days

**You:** List all my draft proposals.

**What happens:** Exercises `list_proposals` with status filter `draft` — returns paginated results with proposal ID, title, client, total, and validity dates.

### Step 9: Second Client (Full Cycle)

Create another client to show the agent handles multiple clients.

**You:** New client: PayFlow, a fintech startup with 50 people. Contact is Mike Torres, Head of Product, mike@payflow.io. They need a fraud detection system built. Budget $150k-$200k, 6 months timeline.

**What happens:** Agent searches for existing clients, creates a new profile.

**You:** Scope it out as a technical project with discovery, design, development, testing, and deployment phases. Generate the proposal.

**What happens:** Creates scope, calculates pricing, generates a full technical proposal with AI content tailored to fintech/fraud detection. The proposal type `technical` produces different default sections (Technical Assessment, Proposed Architecture, Implementation Plan, etc.).

**You:** Show me the pipeline summary now.

**What happens:** Pipeline summary shows both clients, total pipeline value, and counts across all statuses.

### Step 10: Pricing Model Comparison

**You:** For the PayFlow proposal, show me milestone-based pricing with 25% at kickoff, 25% at design completion, 25% at development completion, and 25% at final delivery.

**What happens:** Exercises `estimate_pricing` with milestone model — shows payment schedule table with amounts and due descriptions.

**You:** Now show me value-based pricing with a 1.8x multiplier.

**What happens:** Exercises `estimate_pricing` with value-based model and 1.8x multiplier — shows the premium pricing without volume discounts.

### Verification Commands

After running the demo, verify the data was created correctly:

```bash
# Check all tools compiled (expect 26 primitives: 1 agent, 4 skills, 21 tools)
lua compile

# Test individual tools directly
lua test skill --name search_clients --input '{"query":"healthcare"}'
lua test skill --name search_scopes --input '{"query":"data integration"}'
lua test skill --name list_scopes --input '{"clientId":"<client-id>"}'
lua test skill --name list_proposals --input '{"clientName":"MedTech"}'
lua test skill --name pipeline_summary --input '{}'

# Test case-insensitive role lookup
lua test skill --name create_scope_of_work --input '{"clientId":"<id>","title":"Test","overview":"Test","items":[{"phase":"P1","deliverable":"D1","estimatedHours":10,"role":"senior consultant"}]}'

# Test pricing models
lua test skill --name estimate_pricing --input '{"scopeItems":[{"phase":"P1","deliverable":"D1","estimatedHours":100,"role":"Senior Consultant"}],"pricingModel":"retainer","retainerMonthlyHours":40,"retainerTermMonths":3}'

# Check execution logs
lua logs --type skill --limit 20
```

### Demo Reset

To start fresh, clear the chat history and re-run from step 1. Note that data in collections (clients, scopes, proposals, templates) persists across sessions.

```bash
lua chat clear --force
```

---

## Pricing Models

| Model                | Description                                | When to Use                                         |
| -------------------- | ------------------------------------------ | --------------------------------------------------- |
| **Fixed**            | Subtotal minus volume discount             | Well-defined scope, client wants budget certainty   |
| **Time & Materials** | Same calc as fixed, billed on actuals      | Scope is uncertain, ongoing work                    |
| **Retainer**         | Monthly hours x rate x term (10% discount) | Long-term engagements, ongoing advisory             |
| **Milestone**        | Total split into payment stages by %       | Large projects, client wants incremental payments   |
| **Value-Based**      | Subtotal x multiplier (e.g., 1.5x)         | High-impact strategic work, outcomes-driven pricing |

## Technical Notes

- **Persona:** ProposalPro — senior consulting proposal strategist. Follows structured workflow and asks clarifying questions before generating.
- **AI Content:** Executive summaries and proposal body sections are generated via `AI.generate()` with industry-specific prompts.
- **Semantic Search:** All four collections support vector search via `Data.search()` for finding clients, scopes, templates, and proposals by natural language queries.
- **Shared Pricing Engine:** `calculateFullPricing()` handles all pricing models (fixed, T&M, retainer, milestone, value-based) and is used by both `estimate_pricing` and `generate_proposal`.
- **Case-Insensitive Roles:** Standard role lookup is case-insensitive — "senior consultant", "Senior Consultant", and "SENIOR CONSULTANT" all resolve to the same rate.
- **Status Validation:** Pipeline transitions are enforced — you cannot skip stages or reverse terminal states (accepted/rejected/expired). Only draft proposals can be edited or deleted.
- **Timeline Estimation:** Timeline accounts for parallel work across roles within a phase, producing more realistic duration estimates.
- **Template System:** Supports `{{variable}}` interpolation with 4 proposal types (consulting, technical, strategy, staff_augmentation), each with different default sections.

## Commands Reference

| Command | What it does |
|---------|-------------|
| `lua compile` | Compile all primitives |
| `lua test skill --name <name>` | Unit test a specific tool |
| `lua chat -e sandbox -m "..."` | Send a message in sandbox |
| `lua chat clear --force` | Clear conversation history |
| `lua push all --force --auto-deploy` | Deploy to production |
| `lua logs --type skill --limit 20` | View recent execution logs |
| `lua env sandbox -k KEY -v "value"` | Set an environment variable |

## Learn More

- **Lua CLI Docs:** https://docs.heylua.ai
- **API Reference:** https://docs.heylua.ai/api
- **Examples:** https://docs.heylua.ai/examples
