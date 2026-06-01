import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { formatCurrency } from '../../../utils/date.util';

export class GetApplicationStatusTool implements LuaTool {
  name = 'get_application_status';
  description = 'Check the status of a rental application by application ID or tenant name/email. Shows current status, score, and next steps.';

  inputSchema = z.object({
    applicationId: z.string().optional().describe('Application ID (e.g., "APP-7x3k")'),
    tenantName: z.string().optional().describe('Tenant name to search by (if applicationId not known)'),
    tenantEmail: z.string().optional().describe('Tenant email to search by (if applicationId not known)'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      if (!input.applicationId && !input.tenantName && !input.tenantEmail) {
        return { success: false, error: 'Please provide an applicationId, tenantName, or tenantEmail to look up the application.' };
      }

      let filter: Record<string, string> = {};
      if (input.applicationId) {
        filter = { id: input.applicationId };
      } else if (input.tenantEmail) {
        filter = { tenantEmail: input.tenantEmail };
      } else if (input.tenantName) {
        filter = { tenantName: input.tenantName };
      }

      const results = await Data.get('applications', filter);

      // Try matching by filter field
      const records = results.data?.filter((r: any) => {
        const d = r.data;
        if (input.applicationId) return d?.id === input.applicationId;
        if (input.tenantEmail) return d?.tenantEmail?.toLowerCase() === input.tenantEmail!.toLowerCase();
        if (input.tenantName) return d?.tenantName?.toLowerCase() === input.tenantName!.toLowerCase();
        return false;
      });

      if (!records || records.length === 0) {
        return {
          success: true,
          found: false,
          message: 'No applications found matching your criteria. If you recently applied, the application may still be processing.',
        };
      }

      const applications = records.map((r: any) => {
        const app = r.data;
        const statusMessages: Record<string, string> = {
          'pending': 'Your application is awaiting review. It will be processed shortly.',
          'approved': 'Your application has been approved! A lease will be generated.',
          'under-review': 'Your application is under manual review by a property manager. You will hear back within 1-2 business days.',
          'rejected': 'Unfortunately your application was not approved at this time.',
        };

        return {
          applicationId: app.id,
          property: app.propertyName,
          rent: formatCurrency(app.propertyRent) + '/mo',
          status: app.status,
          statusMessage: statusMessages[app.status] || 'Unknown status.',
          score: app.score ? `${app.score}/100` : 'Not yet scored',
          submittedAt: app.createdAt,
          processedAt: app.processedAt || 'Pending',
        };
      });

      return {
        success: true,
        found: true,
        count: applications.length,
        applications,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
