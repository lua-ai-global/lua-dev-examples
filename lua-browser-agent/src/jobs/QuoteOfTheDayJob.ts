import { Browser, Data, LuaJob } from 'lua-cli';
import { codeOf } from '../lib/browser';

const QUOTES = 'https://quotes.toscrape.com/';

export default new LuaJob({
  name: 'quote-of-the-day',
  description: 'Reads the first quote on a public demo site every morning and keeps it',
  schedule: { type: 'cron', expression: '0 8 * * *', timezone: 'UTC' },
  timeout: 180,
  retry: { maxAttempts: 2, backoffSeconds: 60 },
  async execute() {
    try {
      const page = await Browser.read(QUOTES, {
        browser: 'research',
        waitFor: '.quote',
        selector: '.quote .text',
      });

      if (page.blocked) {
        console.log('quote-of-the-day blocked', page.blocker, page.blockerKind);
        return { ok: false, blocked: page.blocker };
      }

      const quote = page.content.split('\n\n')[0]?.trim() ?? '';
      if (!quote) return { ok: false, reason: 'The page had no quote on it' };

      await Data.create('quotes', { quote, source: page.finalUrl, at: new Date().toISOString() });
      return { ok: true, quote, quotesOnPage: page.matches };
    } catch (error) {
      console.error('quote-of-the-day failed', codeOf(error), (error as Error).message);
      return { ok: false, code: codeOf(error) };
    }
  },
});
