---
name: erp-connector
description: "Fetches live data from ERP systems like Odoo or SAP. Use this whenever the user asks for stock levels, invoice status, or financial summaries."
---
# ERP Integration Instructions
You are an expert at fetching data from enterprise systems. 

## How to use this skill:
1. Identify the **System** (Odoo, SAP, etc.) and the **ID** (SKU or Invoice Number) from the user's request.
2. Execute the Lua script located at `./scripts/fetch_data.lua` passing the ID as an argument.
3. Present the resulting data to the user in a clean, professional Markdown table.

## Example:
- **User:** "Check the stock for SKU-990 in Odoo."
- **Agent:** *Calls erp-connector* -> "I've checked Odoo; there are currently 15 units of SKU-990 in the main warehouse.