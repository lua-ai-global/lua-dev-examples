import { z } from 'zod';
import { db } from '../database';

export const ZohoNoteTool = {
    name: 'zoho_note',
    description: 'Add a new note to a specific Zoho CRM Lead',
    schema: z.object({
        leadId: z.string().describe('The ID of the lead to add the note to'),
        note: z.string().describe('The content of the note')
    }),
    handler: async (args: { leadId: string; note: string }) => {
        const updated = db.addNote(args.leadId, args.note);
        if (!updated) {
            return { error: `Lead not found: ${args.leadId}` };
        }
        return { success: true, lead: updated };
    }
};
