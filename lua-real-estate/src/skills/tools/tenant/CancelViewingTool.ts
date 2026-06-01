import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { isWeekday, formatDate } from '../../../utils/date.util';
import { validateBusinessHours } from '../../../utils/time.util';

export class CancelViewingTool implements LuaTool {
  name = 'cancel_viewing';
  description = 'Cancel or reschedule a previously scheduled property viewing by confirmation ID.';

  inputSchema = z.object({
    viewingId: z.string().describe('Viewing confirmation ID (e.g., "VIEW-a1b2")'),
    action: z.enum(['cancel', 'reschedule']).describe('"cancel" to cancel the viewing, "reschedule" to change date/time'),
    newDate: z.string().optional().describe('New date in YYYY-MM-DD format (required for reschedule)'),
    newTime: z.string().optional().describe('New time (e.g., "2:00 PM") (optional for reschedule)'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const results = await Data.get('viewings', { id: input.viewingId });
      const record = results.data?.find((r: any) => r.data?.id === input.viewingId);

      if (!record) {
        return { success: false, error: `Viewing ${input.viewingId} not found. Please check the confirmation ID.` };
      }

      const viewing = record.data;

      if (viewing.status === 'cancelled') {
        return { success: false, error: `Viewing ${input.viewingId} has already been cancelled.` };
      }

      if (input.action === 'cancel') {
        await Data.update('viewings', record.id, {
          ...viewing,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
        });

        return {
          success: true,
          message: `Viewing at ${viewing.propertyName} on ${viewing.date} at ${viewing.time} has been cancelled.`,
          viewingId: input.viewingId,
        };
      }

      if (input.action === 'reschedule') {
        if (!input.newDate) {
          return { success: false, error: 'A new date is required for rescheduling.' };
        }

        // B8: Validate date is not in the past
        const today = formatDate(new Date());
        if (input.newDate < today) {
          return { success: false, error: `Cannot reschedule to a past date (${input.newDate}). Please choose today or a future date.` };
        }

        // B2: Use shared isWeekday() utility for consistent timezone handling
        if (!isWeekday(input.newDate)) {
          return { success: false, error: 'Viewings are only available on weekdays (Monday-Friday).' };
        }

        // B3: Validate business hours for new time
        const timeToValidate = input.newTime || viewing.time;
        const timeError = validateBusinessHours(timeToValidate);
        if (timeError) {
          return { success: false, error: timeError };
        }

        await Data.update('viewings', record.id, {
          ...viewing,
          date: input.newDate,
          time: input.newTime || viewing.time,
          rescheduledAt: new Date().toISOString(),
        });

        return {
          success: true,
          message: `Viewing rescheduled successfully!`,
          viewing: {
            confirmationId: input.viewingId,
            property: viewing.propertyName,
            oldDate: `${viewing.date} at ${viewing.time}`,
            newDate: `${input.newDate} at ${input.newTime || viewing.time}`,
          },
        };
      }

      return { success: false, error: 'Invalid action.' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
