import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { resolveProperty } from '../../../utils/property.util';
import { generateId } from '../../../utils/id.util';

export class SubmitMaintenanceRequestTool implements LuaTool {
  name = 'submit_maintenance_request';
  description = 'Submit a maintenance request for a property. Categories: plumbing, electrical, hvac, appliance, structural, pest, other.';

  inputSchema = z.object({
    propertyId: z.string().describe('Property ID or name (e.g., "prop-004" or "Cedar Heights")'),
    category: z.enum(['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other'])
      .describe('Maintenance category'),
    description: z.string().describe('Detailed description of the issue'),
    urgency: z.enum(['low', 'medium', 'high', 'emergency'])
      .describe('Urgency level. Emergency = safety hazard or flooding'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const property = resolveProperty(input.propertyId);
      if (!property) {
        return { success: false, error: `Property "${input.propertyId}" not found. Use search_properties to find available listings.` };
      }

      const request = {
        id: generateId('MNT'),
        propertyId: input.propertyId,
        propertyName: property.name,
        category: input.category,
        description: input.description,
        urgency: input.urgency,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      };

      await Data.create('maintenance', request);

      const responseTimeMap: Record<string, string> = {
        emergency: '1-2 hours',
        high: '24 hours',
        medium: '2-3 business days',
        low: '5-7 business days',
      };

      return {
        success: true,
        message: 'Maintenance request submitted successfully!',
        ticket: {
          ticketId: request.id,
          property: property.name,
          category: input.category,
          urgency: input.urgency,
          estimatedResponse: responseTimeMap[input.urgency],
        },
        note: input.urgency === 'emergency'
          ? 'EMERGENCY: Our on-call maintenance team has been alerted and will respond within 1-2 hours. If there is an immediate safety risk, please call 911.'
          : `A maintenance coordinator will contact you within ${responseTimeMap[input.urgency]}.`,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
