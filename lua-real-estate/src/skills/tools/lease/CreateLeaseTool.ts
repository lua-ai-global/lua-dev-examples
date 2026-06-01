import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { generateId } from '../../../utils/id.util';
import { formatDate, addMonths, formatCurrency } from '../../../utils/date.util';
import { findProperty } from '../../../data/properties.data';

export class CreateLeaseTool implements LuaTool {
  name = 'create_lease';
  description = 'Generate a lease agreement for an approved application. Reads the approved application from Data store and creates a lease with all terms.';

  inputSchema = z.object({
    applicationId: z.string().describe('Application ID that was approved (e.g., "APP-7x3k")'),
    leaseTermMonths: z.number().optional().describe('Lease duration in months. Default: 12'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      // Read application from Data store
      const results = await Data.get('applications', { id: input.applicationId });
      const record = results.data?.find((r: any) => r.data?.id === input.applicationId);

      if (!record) {
        return { success: false, error: `Application ${input.applicationId} not found.` };
      }

      const app = record.data;

      if (app.status !== 'approved') {
        return {
          success: false,
          error: `Application ${input.applicationId} is not approved (current status: ${app.status}). Only approved applications can have leases created.`,
        };
      }

      const termMonths = input.leaseTermMonths ?? 12;
      if (termMonths < 1 || termMonths > 24) {
        return { success: false, error: `Lease term must be between 1 and 24 months. Received: ${termMonths} months.` };
      }
      const property = findProperty(app.propertyId);
      const propertyAvailableDate = property?.availableDate;

      // Use desired move-in, but never before property availability
      let startDate = app.desiredMoveIn || formatDate(addMonths(new Date(), 1));
      if (propertyAvailableDate && startDate < propertyAvailableDate) {
        startDate = propertyAvailableDate;
      }
      const endDate = formatDate(addMonths(new Date(startDate), termMonths));
      const leaseId = generateId('LSE');

      // Use actual property pet deposit, not hardcoded
      const petDeposit = app.hasPets && property?.petDeposit ? property.petDeposit : 0;

      const lease = {
        id: leaseId,
        applicationId: input.applicationId,
        propertyId: app.propertyId,
        propertyName: app.propertyName,
        tenantName: app.tenantName,
        tenantEmail: app.tenantEmail,
        monthlyRent: app.propertyRent,
        deposit: app.propertyRent,
        petDeposit,
        startDate,
        endDate,
        termMonths,
        status: 'pending-signature',
        createdAt: new Date().toISOString(),
      };

      await Data.create('leases', lease);

      const totalMoveIn = lease.monthlyRent + lease.deposit + lease.petDeposit;

      return {
        success: true,
        message: `Lease ${leaseId} created successfully for ${app.tenantName} at ${app.propertyName}!`,
        lease: {
          leaseId,
          property: app.propertyName,
          tenant: app.tenantName,
          monthlyRent: formatCurrency(lease.monthlyRent),
          securityDeposit: formatCurrency(lease.deposit),
          petDeposit: lease.petDeposit > 0 ? formatCurrency(lease.petDeposit) : 'N/A',
          leaseStart: startDate,
          leaseEnd: endDate,
          term: `${termMonths} months`,
          status: 'Pending Signature',
        },
        moveInCosts: {
          firstMonthRent: formatCurrency(lease.monthlyRent),
          securityDeposit: formatCurrency(lease.deposit),
          petDeposit: lease.petDeposit > 0 ? formatCurrency(lease.petDeposit) : 'N/A',
          total: formatCurrency(totalMoveIn),
        },
        nextSteps: [
          'Lease agreement sent to ' + app.tenantEmail + ' for digital signature',
          'Renters insurance proof required before move-in',
          `Move-in date: ${startDate}`,
          'Key pickup available after lease signing and payment processing',
        ],
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
