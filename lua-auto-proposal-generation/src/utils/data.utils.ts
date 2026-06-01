import { Data } from 'lua-cli';

/**
 * Safely get a data entry by ID. Returns null instead of throwing if not found.
 */
export async function safeGetEntry(collection: string, id: string): Promise<any | null> {
  try {
    return await Data.getEntry(collection, id);
  } catch {
    return null;
  }
}

/**
 * Unwrap a Data.get() entry which may nest custom fields under entry.data.
 */
export function unwrapEntry(entry: any): any {
  return entry.data ?? entry;
}
