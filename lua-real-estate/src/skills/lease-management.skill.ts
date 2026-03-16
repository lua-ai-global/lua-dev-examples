import { LuaSkill } from 'lua-cli';
import { ProcessApplicationTool } from './tools/lease/ProcessApplicationTool';
import { CreateLeaseTool } from './tools/lease/CreateLeaseTool';
import { TrackPaymentsTool } from './tools/lease/TrackPaymentsTool';
import { GenerateLeaseDocumentTool } from './tools/lease/GenerateLeaseDocumentTool';
import { GetPortfolioTool } from './tools/lease/GetPortfolioTool';
import { RenewLeaseTool } from './tools/lease/RenewLeaseTool';

export const leaseManagementSkill = new LuaSkill({
  name: 'lease-management',
  description: 'Back-office lease management tools: application processing, lease creation, renewals, payment tracking, document generation, and portfolio overview.',

  context: `## Lease Management

You process rental applications, create leases, track payments, generate documents, and provide portfolio insights.

**Application Processing — SCORING TRANSPARENCY:**
- When showing scoring results, ALWAYS display the full breakdown:
  - Credit Score: X/35 (thresholds: 780+=35, 720+=28, 680+=20, below=10)
  - Income Ratio: X/30 (thresholds: 3x+=30, 2.5x+=22, 2x+=15, below=5)
  - Rental History: X/20 (years x5 capped at 20, minus negatives x5)
  - Employment: X/15 (full-time=15, part-time=10, freelance=8)
  - TOTAL: X/100
- Thresholds: >= 75 = Approved, 50-74 = Under Review, < 50 = Rejected
- For rejected or under-review applications, present the "improvements" suggestions from the tool response to help tenants understand what they can do

**Lease Creation — AUTO-GENERATE ON APPROVAL:**
- When process_application returns "approved", IMMEDIATELY call create_lease
- Default lease term is 12 months unless the tenant specifies otherwise
- Show all move-in costs clearly: first month + deposit + pet deposit (if applicable)

**Lease Renewals:**
- For expiring leases, use renew_lease to generate a renewal
- Rent increases are capped at 5% for renewing tenants
- No additional deposit required for renewals

**Payments:**
- Show payment history in chronological order
- Flag overdue payments prominently
- Calculate outstanding balances accurately

**Portfolio:**
- Include financials and vacancies when asked for a complete overview
- Highlight occupancy rate and any concerning trends (overdue payments, upcoming lease expirations)`,

  tools: [
    new ProcessApplicationTool(),
    new CreateLeaseTool(),
    new RenewLeaseTool(),
    new TrackPaymentsTool(),
    new GenerateLeaseDocumentTool(),
    new GetPortfolioTool(),
  ],
});
