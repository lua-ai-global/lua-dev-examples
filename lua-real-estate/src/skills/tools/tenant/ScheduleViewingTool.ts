import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { resolveProperty } from '../../../utils/property.util';
import { generateId } from '../../../utils/id.util';
import { isWeekday, formatDate } from '../../../utils/date.util';
import { validateBusinessHours } from '../../../utils/time.util';

export class ScheduleViewingTool implements LuaTool {
  name = 'schedule_viewing';
  description = 'Schedule an in-person property viewing. Viewings are available Monday-Friday, 9am-5pm.';

  inputSchema = z.object({
    propertyId: z.string().describe('Property ID or name (e.g., "prop-001" or "Sunrise Loft")'),
    preferredDate: z.string().describe('Preferred date in YYYY-MM-DD format'),
    preferredTime: z.string().optional().describe('Preferred time (e.g., "2:00 PM"). Defaults to 10:00 AM'),
    tenantName: z.string().describe('Full name of the person viewing'),
    tenantPhone: z.string().describe('Contact phone number'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const property = resolveProperty(input.propertyId);
      if (!property) {
        return { success: false, error: `Property "${input.propertyId}" not found. Use search_properties to find available listings.` };
      }

      if (!property.available) {
        return { success: false, error: `${property.name} is not currently available for viewing.` };
      }

      // B8: Validate date is not in the past
      const today = formatDate(new Date());
      if (input.preferredDate < today) {
        return { success: false, error: `Cannot schedule a viewing for a past date (${input.preferredDate}). Please choose today or a future date.` };
      }

      if (!isWeekday(input.preferredDate)) {
        return {
          success: false,
          error: 'Viewings are only available on weekdays (Monday-Friday). Please choose a different date.',
        };
      }

      // B1: Validate time format and business hours
      if (input.preferredTime) {
        const timeError = validateBusinessHours(input.preferredTime);
        if (timeError) {
          return { success: false, error: timeError };
        }
      }

      const viewing = {
        id: generateId('VIEW'),
        propertyId: input.propertyId,
        propertyName: property.name,
        address: property.address,
        tenantName: input.tenantName,
        tenantPhone: input.tenantPhone,
        date: input.preferredDate,
        time: input.preferredTime || '10:00 AM',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };

      await Data.create('viewings', viewing);

      return {
        success: true,
        message: `Viewing scheduled successfully!`,
        viewing: {
          confirmationId: viewing.id,
          property: property.name,
          address: property.address,
          date: viewing.date,
          time: viewing.time,
          contact: input.tenantName,
        },
        reminder: 'Please bring a valid photo ID to the viewing. You will receive a confirmation text shortly.',
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
