import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { existingLeases, existingPayments } from '../../../data/leases.data';
import { formatCurrency } from '../../../utils/date.util';
import { generateId } from '../../../utils/id.util';

export class TrackPaymentsTool implements LuaTool {
  name = 'track_payments';
  description = 'Track, record, or check payment history and balances for a lease.';

  inputSchema = z.object({
    leaseId: z.string().describe('Lease ID (e.g., "lease-001")'),
    action: z.enum(['record', 'balance', 'history']).describe('"record" to log a payment, "balance" to check outstanding balance, "history" to see payment history'),
    amount: z.number().optional().describe('Payment amount (required for action "record")'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      // B5: Check static leases first, then fall back to Data store for dynamic leases
      let lease = existingLeases.find(l => l.id === input.leaseId);
      if (!lease) {
        const results = await Data.get('leases', { id: input.leaseId });
        const record = results.data?.find((r: any) => r.data?.id === input.leaseId);
        if (!record) {
          return { success: false, error: `Lease ${input.leaseId} not found.` };
        }
        lease = record.data;
      }

      // B6: Merge static payments with dynamically recorded payments from Data store
      const staticPayments = existingPayments.filter(p => p.leaseId === input.leaseId);
      let dynamicPayments: any[] = [];
      try {
        const paymentResults = await Data.get('payments', { leaseId: input.leaseId });
        dynamicPayments = (paymentResults.data || [])
          .filter((r: any) => r.data?.leaseId === input.leaseId)
          .map((r: any) => r.data);
      } catch {
        // Data store may be empty — that's fine
      }

      // Deduplicate by id (static data takes precedence)
      const staticIds = new Set(staticPayments.map(p => p.id));
      const mergedPayments = [
        ...staticPayments,
        ...dynamicPayments.filter((p: any) => !staticIds.has(p.id)),
      ];

      if (input.action === 'history') {
        return {
          success: true,
          lease: { id: lease!.id, property: lease!.propertyName, tenant: lease!.tenantName },
          payments: mergedPayments.map(p => ({
            id: p.id,
            date: p.date,
            amount: formatCurrency(p.amount),
            type: p.type,
            status: p.status,
          })),
          summary: {
            totalPayments: mergedPayments.length,
            totalPaid: formatCurrency(mergedPayments.filter(p => p.status === 'paid').reduce((s: number, p: any) => s + p.amount, 0)),
            overdue: mergedPayments.filter(p => p.status === 'overdue').length,
          },
        };
      }

      if (input.action === 'balance') {
        const overdue = mergedPayments.filter(p => p.status === 'overdue');
        const totalOverdue = overdue.reduce((s: number, p: any) => s + p.amount, 0);
        return {
          success: true,
          lease: { id: lease!.id, property: lease!.propertyName, tenant: lease!.tenantName },
          monthlyRent: formatCurrency(lease!.monthlyRent),
          overduePayments: overdue.length,
          overdueAmount: formatCurrency(totalOverdue),
          nextPaymentDue: formatCurrency(lease!.monthlyRent + totalOverdue),
          status: overdue.length > 0 ? 'Has overdue balance' : 'Current',
        };
      }

      if (input.action === 'record') {
        if (!input.amount) {
          return { success: false, error: 'Amount is required when recording a payment.' };
        }
        const paymentId = generateId('PAY');
        const payment = {
          id: paymentId,
          leaseId: lease!.id,
          amount: input.amount,
          date: new Date().toISOString().split('T')[0],
          type: 'rent' as const,
          status: 'paid' as const,
        };

        // Persist to Data store
        await Data.create('payments', {
          ...payment,
          propertyName: lease!.propertyName,
          tenantName: lease!.tenantName,
        });

        return {
          success: true,
          message: `Payment of ${formatCurrency(input.amount)} recorded for ${lease!.propertyName}.`,
          payment: {
            ...payment,
            amount: formatCurrency(input.amount),
          },
        };
      }

      return { success: false, error: 'Invalid action.' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
