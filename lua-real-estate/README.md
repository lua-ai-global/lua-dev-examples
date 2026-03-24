# PropFlow AI — Real Estate Agent

A demo agent built with [lua-cli](https://docs.heylua.ai) that showcases a **magic moment**: a tenant applies for a property and the application is scored, approved, and a lease is auto-generated — all in one seamless conversational flow.

Two skills communicate through lua-cli's `Data` store, simulating event-driven microservices:

```
Tenant: "I want to apply for Parkside Commons"
  -> apply_for_property writes to Data('applications')
  -> process_application reads Data, runs scoring engine (87/100)
  -> create_lease generates lease from approved application
  -> Tenant sees: applied -> scored -> approved -> lease created
```

## Architecture

```
LuaAgent: PropFlow AI
├── Skill: tenant-engagement (8 tools)
│   ├── search_properties        — Filter by location/beds/price/pets
│   ├── compare_properties       — Side-by-side comparison (2-4 units)
│   ├── schedule_viewing         — Book weekday viewings, 9am-5pm
│   ├── cancel_viewing           — Cancel or reschedule by confirmation ID
│   ├── submit_maintenance_request — Create maintenance tickets
│   ├── ask_lease_question       — FAQ lookup (pets, deposits, subletting, etc.)
│   ├── apply_for_property       — MAGIC TRIGGER — writes to Data store
│   └── get_application_status   — Look up by ID, name, or email
│
└── Skill: lease-management (6 tools)
    ├── process_application      — MAGIC RECEIVER — scores & decides
    ├── create_lease             — Generate lease from approval
    ├── renew_lease              — Renew expiring leases (capped 5% increase)
    ├── track_payments           — Record/check payments & balances
    ├── generate_lease_document  — Summary, full agreement, or move-in checklist
    └── get_portfolio            — Occupancy, revenue, vacancies
```

## Project Structure

```
src/
├── index.ts                              # Agent + persona + magic chaining instructions
├── types/
│   ├── property.types.ts                 # Property, PropertyFilter, Amenity
│   ├── tenant.types.ts                   # TenantProfile, Viewing, MaintenanceRequest
│   └── lease.types.ts                    # Application, Lease, Payment, ScoreBreakdown
├── data/
│   ├── properties.data.ts                # 6 properties in Maplewood ($950-$3,200/mo)
│   ├── tenants.data.ts                   # 3 tenant profiles (varying credit/income)
│   └── leases.data.ts                    # 2 active leases + payment history + portfolio
├── utils/
│   ├── id.util.ts                        # Short ID generator (APP-7x3k)
│   ├── date.util.ts                      # formatDate, addMonths, isWeekday, formatCurrency
│   ├── time.util.ts                      # parseAndValidateTime, validateBusinessHours
│   ├── property.util.ts                  # resolveProperty (shared ID/name lookup)
│   └── scoring.util.ts                   # Multi-factor scorer (credit/income/history/employment)
└── skills/
    ├── tenant-engagement.skill.ts
    ├── lease-management.skill.ts
    └── tools/
        ├── tenant/
        │   ├── SearchPropertiesTool.ts
        │   ├── ComparePropertiesTool.ts
        │   ├── ScheduleViewingTool.ts
        │   ├── CancelViewingTool.ts
        │   ├── SubmitMaintenanceRequestTool.ts
        │   ├── AskLeaseQuestionTool.ts
        │   ├── ApplyForPropertyTool.ts
        │   └── GetApplicationStatusTool.ts
        └── lease/
            ├── ProcessApplicationTool.ts
            ├── CreateLeaseTool.ts
            ├── RenewLeaseTool.ts
            ├── TrackPaymentsTool.ts
            ├── GenerateLeaseDocumentTool.ts
            └── GetPortfolioTool.ts
```

## Setup

```bash
npm install
lua compile
```

No external APIs or env vars needed — everything uses realistic mock data.

## Scoring Engine

Applications are scored on four factors (100 points total):

| Factor         | Max | Thresholds                                            |
| -------------- | --- | ----------------------------------------------------- |
| Credit Score   | 35  | 780+ = 35, 720+ = 28, 680+ = 20, below = 10           |
| Income Ratio   | 30  | 3x+ rent = 30, 2.5x+ = 22, 2x+ = 15, below = 5        |
| Rental History | 20  | Years x 5 (capped at 20), minus 5 per negative remark |
| Employment     | 15  | Full-time = 15, Part-time = 10, Freelance = 8         |

**Decision thresholds:** >= 75 Approved, 50-74 Under Review, < 50 Rejected

Rejected and under-review applicants receive personalized improvement suggestions.

## Mock Data

**6 Properties in Maplewood:**

| Property           | Beds | Rent   | Neighborhood  | Pet-Friendly |
| ------------------ | ---- | ------ | ------------- | ------------ |
| Sunrise Loft       | 1    | $1,450 | Downtown      | No           |
| Oakwood Terrace    | 2    | $2,100 | Riverside     | Yes ($500)   |
| The Riverview      | 3    | $3,200 | Riverside     | Yes ($750)   |
| Cedar Heights      | 1    | $950   | Hilltop       | No           |
| Parkside Commons   | 2    | $1,750 | Greenway      | Yes ($400)   |
| Industrial Loft 7B | 1    | $1,600 | Arts District | Yes ($350)   |

**2 Active Leases:** James Rivera at Oakwood Terrace, Lisa Park at Cedar Heights (1 overdue payment).

**3 Tenant Profiles:** Sarah Chen (excellent), Marcus Johnson (good), Priya Patel (weak).

---

## Demo Script

Run each section in order. Clear chat between scenarios to reset context.

### 1. Property Search

```bash
lua chat clear --force
lua chat -e sandbox -m "I'm looking for a pet-friendly apartment in Maplewood under \$2000/month"
```

**Expected:** Returns Parkside Commons ($1,750) and Industrial Loft 7B ($1,600). Both pet-friendly with deposits listed.

### 2. Property Comparison

```bash
lua chat -e sandbox -m "Can you compare Parkside Commons and Industrial Loft 7B side by side?"
```

**Expected:** Side-by-side comparison with rent/sqft, amenities, pet deposits, and highlights (lowest rent, largest unit, most amenities).

### 3. The Magic Moment — Perfect Applicant (apply -> score -> approve -> lease)

```bash
lua chat clear --force
lua chat -e sandbox -m "I'd like to apply for Parkside Commons. I'm Sarah Chen, sarah@test.com, \$8500/mo income, full-time software engineer, credit score 780, 5 years renting with no issues, no pets, move in April 1st."
```

**Expected:** All three tools chain automatically in one response:

1. Application submitted (APP-xxxx)
2. Scored **100/100** with full breakdown (35 + 30 + 20 + 15)
3. Approved
4. Lease created (LSE-xxxx) with move-in costs ($3,500 total)
5. Next steps: digital signature, renters insurance, key pickup

### 4. Rejection Path — Weak Applicant with Improvement Suggestions

```bash
lua chat clear --force
lua chat -e sandbox -m "I want to apply for The Riverview. Name: Priya Patel, email: priya@test.com, income \$4000/mo, freelance designer, credit score 620, 1 year rental history with 2 negative remarks, no pets, move in May 1st."
```

**Expected:** Application scored **23/100**, rejected, with specific improvement suggestions:

- Credit: need 720+ for more points
- Income: need $8,000/mo for 2.5x ratio on $3,200 rent
- Rental history: provide verified references
- Employment: full-time earns max points
- Alternative: apply with co-signer or consider lower-rent properties

### 5. Application Status Check

```bash
lua chat -e sandbox -m "Can you check the status of Priya Patel's application?"
```

**Expected:** Looks up by name, shows application ID, property, status (rejected), score (23/100), timestamps.

### 6. Schedule a Viewing

```bash
lua chat clear --force
lua chat -e sandbox -m "I'd like to schedule a viewing at Sunrise Loft for next Wednesday at 2:00 PM. My name is Alex Torres, phone 555-0199."
```

**Expected:** Viewing confirmed with confirmation ID, property address, date, time. Reminder to bring photo ID.

### 7. Cancel / Reschedule a Viewing

```bash
lua chat -e sandbox -m "Actually, can I reschedule that viewing to Thursday at 10:00 AM instead?"
```

**Expected:** Uses the confirmation ID from previous response, updates date/time, shows old vs new.

### 8. Maintenance Request

```bash
lua chat clear --force
lua chat -e sandbox -m "I need to report a leaky faucet in Cedar Heights. It's been dripping for a couple days."
```

**Expected:** Maintenance ticket created (MNT-xxxx), category: plumbing, urgency: medium, estimated response: 2-3 business days.

### 9. Emergency Maintenance

```bash
lua chat clear --force
lua chat -e sandbox -m "URGENT: There's water flooding from the ceiling in my unit at Oakwood Terrace! It's coming through the light fixture."
```

**Expected:** Emergency ticket, urgency: emergency, 1-2 hour response, safety warning about calling 911 if needed.

### 10. Lease FAQ

```bash
lua chat clear --force
lua chat -e sandbox -m "Do you allow dogs in your apartments?"
```

**Expected:** Pet policy answer — cats and dogs under 50 lbs, $350-$750 deposit, breed restrictions.

```bash
lua chat -e sandbox -m "What if I need to break my lease early?"
```

**Expected:** 60 days notice + 2 months rent penalty, reduced to 1 month if replacement tenant found.

### 11. Portfolio Overview (Property Manager View)

```bash
lua chat clear --force
lua chat -e sandbox -m "Show me the full property portfolio with financials and vacancies"
```

**Expected:**

- 6 total units, 2 occupied, 4 vacant (33% occupancy)
- Monthly revenue: $3,050
- 1 overdue payment ($950)
- List of all vacant properties with rent and availability dates
- Active leases with tenant names and expiry dates

### 12. Payment Tracking

```bash
lua chat -e sandbox -m "Show me the payment history for lease-001"
```

**Expected:** Chronological list of all payments for Oakwood Terrace (James Rivera). All rent paid through March 2026.

```bash
lua chat -e sandbox -m "What's the balance on lease-002?"
```

**Expected:** Cedar Heights (Lisa Park) has 1 overdue payment of $950 for March 2026.

### 13. Lease Document Generation

```bash
lua chat clear --force
lua chat -e sandbox -m "Generate a move-in checklist for lease-002"
```

**Expected:** Formatted checklist with items: lease signed, deposit received, insurance proof, photo ID, inspection, keys issued, parking, utilities, emergency contacts.

```bash
lua chat -e sandbox -m "Now generate the full lease agreement for lease-001"
```

**Expected:** Full legal-style document with all 10 clauses (premises, term, rent, late fees, deposit, utilities, maintenance, early termination, insurance, governing law).

### 14. Lease Renewal

```bash
lua chat clear --force
lua chat -e sandbox -m "Renew lease-001 for another 12 months with a 3% rent increase"
```

**Expected:** New lease created showing old rent ($2,100) vs new rent ($2,163), +$63/mo increase, starts when current lease ends (2026-05-31), no additional deposit.

### 15. Lease Renewal — Policy Cap

```bash
lua chat -e sandbox -m "Actually, renew lease-002 with a 7% increase"
```

**Expected:** Rejected — rent increases capped at 5% for renewing tenants per policy.

### 16. Validation Edge Cases

```bash
# Negative income
lua test skill --name apply_for_property --input '{"propertyId": "prop-001", "tenantName": "Test", "tenantEmail": "t@t.com", "monthlyIncome": -500, "employmentStatus": "full-time", "creditScore": 700}'
# Expected: "Monthly income must be a positive number."

# Weekend viewing
lua test skill --name schedule_viewing --input '{"propertyId": "prop-001", "preferredDate": "2026-03-14", "tenantName": "Test", "tenantPhone": "555-0000"}'
# Expected: "Viewings are only available on weekdays"

# After-hours viewing
lua test skill --name schedule_viewing --input '{"propertyId": "prop-001", "preferredDate": "2026-03-16", "preferredTime": "7:00 PM", "tenantName": "Test", "tenantPhone": "555-0000"}'
# Expected: "Viewings are only available between 9:00 AM and 5:00 PM."

# Invalid time — hour out of range
lua test skill --name schedule_viewing --input '{"propertyId": "prop-001", "preferredDate": "2026-03-13", "preferredTime": "25:00 PM", "tenantName": "Test", "tenantPhone": "555-0000"}'
# Expected: "Invalid hour: 25. For AM/PM format, hour must be between 1 and 12."

# Invalid time — minutes out of range
lua test skill --name schedule_viewing --input '{"propertyId": "prop-001", "preferredDate": "2026-03-13", "preferredTime": "13:99", "tenantName": "Test", "tenantPhone": "555-0000"}'
# Expected: "Invalid minutes: 99. Minutes must be between 0 and 59."

# Past date viewing
lua test skill --name schedule_viewing --input '{"propertyId": "prop-001", "preferredDate": "2025-01-10", "preferredTime": "10:00 AM", "tenantName": "Test", "tenantPhone": "555-0000"}'
# Expected: "Cannot schedule a viewing for a past date"

# Pets in non-pet-friendly unit
lua test skill --name apply_for_property --input '{"propertyId": "prop-001", "tenantName": "Test", "tenantEmail": "t@t.com", "monthlyIncome": 5000, "employmentStatus": "full-time", "creditScore": 700, "hasPets": true}'
# Expected: "Sunrise Loft does not allow pets."

# Rent decrease beyond floor
lua test skill --name renew_lease --input '{"leaseId": "lease-001", "newTermMonths": 12, "rentAdjustmentPercent": -50}'
# Expected: "Rent decreases are limited to -5% per our policy."

# Lease term too long
lua test skill --name create_lease --input '{"applicationId": "APP-fake", "leaseTermMonths": 30}'
# Expected: "Lease term must be between 1 and 24 months."
```

## Key Design Decisions

- **Data store as message bus** — `Data.create('applications', ...)` bridges the two skills, simulating microservice communication without external APIs
- **Static + dynamic data merging** — Tools check static mock data first, then fall back to Data store for dynamically created records (leases, payments). Portfolio, documents, and payment tracking all merge both sources
- **Persona-driven orchestration** — The persona explicitly tells the AI to chain tools after application submission. This is the magic moment
- **Scoring transparency** — Every point breakdown is shown with thresholds, so users understand exactly why they were approved/rejected
- **Name resolution** — All tenant-facing tools accept property names or IDs via shared `resolveProperty()`, so users can say "Parkside Commons" instead of "prop-005"
- **Input validation** — Time parsing validates hours/minutes and enforces 9am-5pm business hours; past dates are rejected; duplicate applications per email+property are prevented; lease terms are bounded (1-24 months); rent adjustments are capped (-5% to +5%)
- **Mock data, not stubs** — Rich realistic data (addresses, amenities, credit scores, payment history) makes the demo feel production-ready
- **No external APIs** — Everything works out of the box with zero configuration

## Commands Reference

```bash
lua compile                    # Compile all primitives
lua test skill --name <name>   # Unit test a specific tool
lua chat -e sandbox -m "..."   # Send a message in sandbox
lua chat clear --force         # Clear conversation history
lua logs --type skill --limit 20  # View recent skill execution logs
lua push all --force --auto-deploy  # Deploy to production
```

---

_Built with [lua-cli](https://docs.heylua.ai)_
