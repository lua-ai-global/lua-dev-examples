import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { existingLeases } from '../../../data/leases.data';
import { generateId } from '../../../utils/id.util';
import { formatDate, addMonths, formatCurrency } from '../../../utils/date.util';

export class RenewLeaseTool implements LuaTool {
  name = 'renew_lease';
  description = 'Renew an existing lease for a current tenant. Generates a new lease starting from the current lease end date with an optional rent adjustment.';

  inputSchema = z.object({
    leaseId: z.string().describe('Current lease ID to renew (e.g., "lease-001")'),
    newTermMonths: z.number().optional().describe('New lease term in months. Default: 12'),
    rentAdjustmentPercent: z.number().optional().describe('Rent adjustment percentage (e.g., 3 for 3% increase, 0 for same rate). Default: 0. Max: 5 for renewing tenants.'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const currentLease = existingLeases.find(l => l.id === input.leaseId);
      if (!currentLease) {
        // Also check Data store for dynamically created leases
        const results = await Data.get('leases', { id: input.leaseId });
        const record = results.data?.find((r: any) => r.data?.id === input.leaseId);
        if (!record) {
          return { success: false, error: `Lease ${input.leaseId} not found.` };
        }
        return this.processRenewal(record.data, input);
      }

      return this.processRenewal(currentLease, input);
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async processRenewal(lease: any, input: z.infer<typeof this.inputSchema>) {
    if (lease.status !== 'active' && lease.status !== 'pending-signature') {
      return { success: false, error: `Lease ${input.leaseId} is ${lease.status}. Only active leases can be renewed.` };
    }

    const adjustPercent = input.rentAdjustmentPercent ?? 0;
    if (adjustPercent > 5) {
      return { success: false, error: 'Rent increases are capped at 5% for renewing tenants per our policy.' };
    }
    if (adjustPercent < -5) {
      return { success: false, error: 'Rent decreases are limited to -5% per our policy.' };
    }

    const termMonths = input.newTermMonths ?? 12;
    const newRent = Math.round(lease.monthlyRent * (1 + adjustPercent / 100));
    const newStartDate = lease.endDate;
    const newEndDate = formatDate(addMonths(new Date(newStartDate), termMonths));
    const newLeaseId = generateId('LSE');

    const renewedLease = {
      id: newLeaseId,
      applicationId: lease.applicationId,
      propertyId: lease.propertyId,
      propertyName: lease.propertyName,
      tenantName: lease.tenantName,
      tenantEmail: lease.tenantEmail,
      monthlyRent: newRent,
      deposit: lease.deposit, // deposit carries over
      petDeposit: lease.petDeposit || 0,
      startDate: newStartDate,
      endDate: newEndDate,
      termMonths,
      status: 'pending-signature',
      renewedFrom: input.leaseId,
      createdAt: new Date().toISOString(),
    };

    await Data.create('leases', renewedLease);

    return {
      success: true,
      message: `Lease renewed for ${lease.tenantName} at ${lease.propertyName}!`,
      previousLease: {
        leaseId: input.leaseId,
        rent: formatCurrency(lease.monthlyRent) + '/mo',
        endDate: lease.endDate,
      },
      newLease: {
        leaseId: newLeaseId,
        tenant: lease.tenantName,
        property: lease.propertyName,
        rent: formatCurrency(newRent) + '/mo',
        rentChange: adjustPercent > 0 ? `+${adjustPercent}% (${formatCurrency(newRent - lease.monthlyRent)}/mo increase)` : 'No change',
        startDate: newStartDate,
        endDate: newEndDate,
        term: `${termMonths} months`,
        status: 'Pending Signature',
      },
      nextSteps: [
        `Renewal agreement sent to ${lease.tenantEmail} for signature`,
        'No additional deposit required for renewals',
        `New lease starts ${newStartDate}`,
      ],
    };
  }
}
