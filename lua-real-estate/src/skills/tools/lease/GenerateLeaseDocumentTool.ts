import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { existingLeases } from '../../../data/leases.data';

export class GenerateLeaseDocumentTool implements LuaTool {
  name = 'generate_lease_document';
  description = 'Generate a lease document in summary, full, or checklist format for an existing lease.';

  inputSchema = z.object({
    leaseId: z.string().describe('Lease ID (e.g., "lease-001")'),
    type: z.enum(['summary', 'full', 'checklist']).describe('Document type to generate'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      // U4: Check static leases first, then fall back to Data store
      let lease: any = existingLeases.find(l => l.id === input.leaseId);
      if (!lease) {
        const results = await Data.get('leases', { id: input.leaseId });
        const record = results.data?.find((r: any) => r.data?.id === input.leaseId);
        if (!record) {
          return { success: false, error: `Lease ${input.leaseId} not found.` };
        }
        lease = record.data;
      }

      let content = '';

      if (input.type === 'summary') {
        content = [
          `LEASE SUMMARY — ${lease.propertyName}`,
          `${'='.repeat(45)}`,
          `Lease ID: ${lease.id}`,
          `Tenant: ${lease.tenantName} (${lease.tenantEmail})`,
          `Property: ${lease.propertyName}`,
          `Monthly Rent: $${lease.monthlyRent}`,
          `Security Deposit: $${lease.deposit}`,
          `Lease Period: ${lease.startDate} to ${lease.endDate} (${lease.termMonths} months)`,
          `Status: ${lease.status}`,
        ].join('\n');
      }

      if (input.type === 'full') {
        const createdDate = lease.createdAt?.split('T')[0] || 'N/A';
        content = [
          `RESIDENTIAL LEASE AGREEMENT`,
          `${'='.repeat(45)}`,
          ``,
          `This Lease Agreement is entered into as of ${createdDate}`,
          `by and between PropFlow Properties LLC ("Landlord")`,
          `and ${lease.tenantName} ("Tenant").`,
          ``,
          `1. PREMISES: ${lease.propertyName}`,
          `2. TERM: ${lease.termMonths} months, from ${lease.startDate} to ${lease.endDate}`,
          `3. RENT: $${lease.monthlyRent}/month, due on the 1st of each month`,
          `4. LATE FEE: $${Math.round(lease.monthlyRent * 0.05)} if paid after the 5th`,
          `5. SECURITY DEPOSIT: $${lease.deposit}, refundable within 30 days of move-out`,
          `6. UTILITIES: Tenant pays electricity and internet; water/trash included`,
          `7. MAINTENANCE: Tenant reports issues promptly; Landlord repairs within reasonable time`,
          `8. EARLY TERMINATION: 60 days notice + 2 months rent penalty`,
          `9. RENTERS INSURANCE: Required, $100k liability minimum`,
          `10. GOVERNING LAW: State residential tenancy laws apply`,
          ``,
          `Signatures pending electronic execution.`,
        ].join('\n');
      }

      if (input.type === 'checklist') {
        content = [
          `MOVE-IN CHECKLIST — ${lease.propertyName}`,
          `${'='.repeat(45)}`,
          `Tenant: ${lease.tenantName}`,
          `Move-in Date: ${lease.startDate}`,
          ``,
          `[ ] Lease agreement signed by all parties`,
          `[ ] Security deposit of $${lease.deposit} received`,
          `[ ] First month's rent of $${lease.monthlyRent} received`,
          `[ ] Renters insurance proof provided`,
          `[ ] Photo ID verified`,
          `[ ] Move-in inspection completed`,
          `[ ] Keys and access cards issued`,
          `[ ] Parking assignment confirmed`,
          `[ ] Utility transfer confirmed`,
          `[ ] Emergency contact information collected`,
          `[ ] Building rules and amenity guide provided`,
          `[ ] Welcome packet delivered`,
        ].join('\n');
      }

      return {
        success: true,
        document: {
          leaseId: lease.id,
          type: input.type,
          content,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
