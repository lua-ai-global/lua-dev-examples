import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';

const COLLECTIONS = ['clients', 'scopes', 'proposals', 'templates'];

export class DeleteAllDevTool implements LuaTool {
  name = 'delete_all_dev';
  description =
    '⚠️ TESTING ONLY: Delete all dynamic data (clients, scopes, proposals, templates). Use before re-running demos to start fresh.';
  inputSchema = z.object({});

  async execute() {
    const results: Record<string, number> = {};
    let totalDeleted = 0;

    for (const collection of COLLECTIONS) {
      try {
        const res = await Data.get(collection, {});
        const entries = res.data || [];
        for (const entry of entries) {
          await Data.delete(collection, entry.id);
        }
        results[collection] = entries.length;
        totalDeleted += entries.length;
      } catch {
        results[collection] = 0;
      }
    }

    return {
      success: true,
      message: `⚠️ DEV RESET COMPLETE: Deleted ${totalDeleted} records across ${COLLECTIONS.length} collections.`,
      deleted: results,
    };
  }
}
