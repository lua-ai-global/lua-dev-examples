export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // Handle month overflow (e.g., Jan 31 + 1 month should be Feb 28, not Mar 3)
  if (result.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setDate(0); // Set to last day of previous month
  }
  return result;
}

export function isWeekday(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day !== 0 && day !== 6;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}
