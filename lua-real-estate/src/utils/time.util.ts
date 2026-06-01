/**
 * Validates and parses a time string. Returns the 24h hour or an error message.
 * Accepts formats: "2:00 PM", "14:00", "9:30 AM"
 */
export function parseAndValidateTime(timeStr: string): { hour: number; minute: number } | { error: string } {
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!timeMatch) {
    return { error: 'Invalid time format. Use format like "10:00 AM" or "14:00".' };
  }

  let hour = parseInt(timeMatch[1]);
  const minute = parseInt(timeMatch[2]);
  const ampm = timeMatch[3]?.toUpperCase();

  if (minute < 0 || minute > 59) {
    return { error: `Invalid minutes: ${minute}. Minutes must be between 0 and 59.` };
  }

  if (ampm) {
    // 12-hour format: hour must be 1-12
    if (hour < 1 || hour > 12) {
      return { error: `Invalid hour: ${hour}. For AM/PM format, hour must be between 1 and 12.` };
    }
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  } else {
    // 24-hour format: hour must be 0-23
    if (hour < 0 || hour > 23) {
      return { error: `Invalid hour: ${hour}. For 24-hour format, hour must be between 0 and 23.` };
    }
  }

  return { hour, minute };
}

/**
 * Validates that a time string falls within 9am-5pm business hours.
 * Returns null if valid, or an error string if invalid.
 */
export function validateBusinessHours(timeStr: string): string | null {
  const result = parseAndValidateTime(timeStr);
  if ('error' in result) return result.error;

  if (result.hour < 9 || result.hour >= 17) {
    return 'Viewings are only available between 9:00 AM and 5:00 PM.';
  }

  return null;
}
