import { LuaJob, Data, User } from 'lua-cli';
import { COLLECTION, LinearConnection, refreshConnection, RelinkRequiredError } from '../lib/linear-oauth';

// A Linear access token lasts 24 hours. Every 6 hours, refresh each one that
// has less than 12 hours left, so a missed run or a Linear outage still leaves
// a full day to catch up before anyone is cut off.
const REFRESH_AHEAD_MS = 12 * 60 * 60 * 1000;

export default new LuaJob({
  name: 'linear-token-keepalive',
  description: 'Refresh Linear tokens before they expire and tell users whose link has to be redone',
  schedule: { type: 'cron', expression: '0 */6 * * *', timezone: 'UTC' },
  timeout: 300,
  retry: { maxAttempts: 2, backoffSeconds: 120 },
  async execute() {
    const result = { checked: 0, refreshed: 0, relinkRequired: 0, failed: 0 };
    const dueBefore = Date.now() + REFRESH_AHEAD_MS;

    // Refreshed entries move out of the filter, so always read page 1 until a
    // page adds nothing new; `seen` stops a failing entry being retried forever.
    const seen = new Set<string>();
    for (;;) {
      const page = await Data.get(COLLECTION, { status: 'connected', expiresAt: { $lte: dueBefore } }, 1, 100);
      const fresh = page.data.filter((entry) => !seen.has(entry.id));
      if (fresh.length === 0) break;

      for (const entry of fresh) {
        seen.add(entry.id);
        result.checked += 1;
        const data = entry.data as LinearConnection;
        try {
          await refreshConnection({ id: entry.id, data });
          result.refreshed += 1;
        } catch (error) {
          if (!(error instanceof RelinkRequiredError)) {
            // Temporary (timeout, 5xx): the token is still valid, the next run retries.
            result.failed += 1;
            continue;
          }
          result.relinkRequired += 1;
          // The entry is now `relink_required`, so this message is sent once.
          const user = await User.get(data.userId);
          await user
            ?.send([
              {
                type: 'text',
                text: 'Your Linear connection has expired. Reply here and I will send you a new link to reconnect it.',
              },
            ])
            .catch(() => undefined);
        }
      }
    }
    return result;
  },
});
