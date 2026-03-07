import { z } from 'zod';
import { db } from '../database';

export const ZohoLeadTool = {
    name: 'zoho_lead',
    description: 'Fetch details for a specific Zoho CRM Lead by ID',
    schema: z.object({
        leadId: z.string().describe('The ID of the lead to fetch, e.g., LEAD-101')
    }),
    handler: async (args: { leadId: string }) => {
        const lead = db.getLead(args.leadId);
        if (!lead) {
            return { error: `Lead not found: ${args.leadId}` };
        }
        return { lead };
    }
};
