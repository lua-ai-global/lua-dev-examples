import { z } from 'zod';
import { db } from '../database';

export const ZohoStatusTool = {
    name: 'zoho_status',
    description: 'Update the status of a specific Zoho CRM Lead',
    schema: z.object({
        leadId: z.string().describe('The ID of the lead to update'),
        status: z.string().describe('The new status to apply to the lead')
    }),
    handler: async (args: { leadId: string; status: string }) => {
        const updated = db.updateStatus(args.leadId, args.status);
        if (!updated) {
            return { error: `Lead not found: ${args.leadId}` };
        }
        return { success: true, lead: updated };
    }
};
