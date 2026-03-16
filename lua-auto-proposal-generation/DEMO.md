# Demo Flow: Auto Proposal Generation Agent

A tight 5-step demo showcasing the key differentiators: client intake → scope → magic proposal generation → pipeline tracking → dashboard.

---

## Step 0 — Reset (run before every demo)

```bash
lua chat -e production -m "delete all dev data"
lua chat clear --force
```

---

## Step 1 — Client Intake

```bash
lua chat -e production -m "New client: Acme Health, healthcare SaaS. Contact: James Liu, CTO, james@acmehealth.com. Pain points: manual data reconciliation and no real-time patient analytics. Budget: $80k-$120k. Timeline: 4 months. Website: acmehealth.com"
```

**Expected:** Searches for existing client (none found), creates profile, returns `CLIENT-xxxx`.

---

## Step 2 — Scope of Work

```bash
lua chat -e production -m "Create a scope for Acme Health: Phase 1 - Data Audit (senior consultant 20hrs, data engineer 30hrs), Phase 2 - Integration Build (lead developer 60hrs, data engineer 80hrs), Phase 3 - Analytics Dashboard (lead developer 40hrs, QA engineer 20hrs). 4-month timeline, fixed price."
```

**Expected:** Full scope with auto-filled standard rates, total hours/cost, `SCOPE-xxxx`.

---

## Step 3 — The Magic Moment ✨

```bash
lua chat -e production -m "Generate the full proposal for Acme Health using a consulting template. Fixed price model. Make it compelling."
```

**Expected:** AI-generated executive summary + full proposal body tailored to healthcare, pricing breakdown ($80k–$120k range), `PROP-xxxx`.

---

## Step 4 — Pipeline Tracking

```bash
lua chat clear --force
lua chat -e production -m "Mark the Acme Health proposal as sent. Reason: delivered via email after internal review."
```

**Expected:** Status transitions `draft → sent`, status history updated with reason and timestamp.

---

## Step 5 — Pipeline Dashboard

```bash
lua chat -e production -m "Give me the full pipeline summary"
```

**Expected:** Proposal counts by status, total pipeline value, win rate, any expiring-soon alerts.
