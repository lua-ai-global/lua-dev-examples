# Odoo ERP Skill for Antigravity 
## Overview
This skill enables an autonomous agent to interact with an Odoo ERP system to fetch inventory data and invoice statuses. It was built as part of the Lua Builder Community marketplace wishlist.

## Features
- **Stock Inquiry:** Retrieve real-time stock levels for specific SKUs.
- **Invoice Status:** Check whether specific invoices have been paid or are pending.

## How to Test
1. Ask the agent: "Check the stock for SKU-990 in Odoo."
2. Ask the agent: "What is the status of invoice INV-5521?"

## Technical Details
- **Language:** Lua
- **Components:** `SKILL.md` (Agent Instructions) and `scripts/fetch_data.lua` (API Simulator).
