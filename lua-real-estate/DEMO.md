# Real Estate Agent — Demo Flow

A tight 5-step walkthrough showcasing the key differentiators:
**search → magic moment → rejection path → portfolio**

---

## Step 0 — Reset (run before every demo)

```bash
lua chat -e production -m "delete all dev data"
lua chat clear --force
```

---

## Step 1 — Property Search

```bash
lua chat -e production -m "I'm looking for a pet-friendly apartment in Maplewood under \$2000/month"
```

**Expected:** Returns Parkside Commons ($1,750) and Industrial Loft 7B ($1,600) immediately. No clarifying questions.

---

## Step 2 — Side-by-Side Comparison

```bash
lua chat -e production -m "Can you compare Parkside Commons and Industrial Loft 7B side by side?"
```

**Expected:** Full comparison table — rent, sqft, amenities, pet deposits, highlights.

---

## Step 3 — The Magic Moment ✨

```bash
lua chat clear --force
lua chat -e production -m "I'd like to apply for Parkside Commons. I'm Sarah Chen, sarah@test.com, \$8500/mo income, full-time software engineer, credit score 780, 5 years renting with no issues, no pets, move in April 1st."
```

**Expected:** Single response showing the full chain:
1. Application submitted (APP-xxxx)
2. Scored **100/100** (35+30+20+15 breakdown)
3. Approved
4. Lease created (LSE-xxxx), $3,500 move-in costs

---

## Step 4 — Rejection Path (scoring transparency)

```bash
lua chat clear --force
lua chat -e production -m "I want to apply for The Riverview. Name: Priya Patel, email: priya@test.com, income \$4000/mo, freelance designer, credit score 620, 1 year rental history with 2 negative remarks, no pets, move in May 1st."
```

**Expected:** Scored **23/100**, rejected, with specific improvement suggestions per factor.

---

## Step 5 — Portfolio View (property manager perspective)

```bash
lua chat clear --force
lua chat -e production -m "Show me the full property portfolio with financials and vacancies"
```

**Expected:** 6 units, static + dynamic occupancy, monthly revenue, overdue payments, all active leases.

---

## Verification Commands

```bash
# Compile — expect 18 primitives (1 agent, 2 skills, 15 tools)
lua compile

# Test the delete tool directly
lua test skill --name delete_all_dev --input '{}'
```
