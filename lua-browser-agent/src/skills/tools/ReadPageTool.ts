import { Browser, LuaTool } from 'lua-cli';
import { z } from 'zod';
import { thrown } from '../../lib/browser';

const MAX_TEXT = 2000;

export default class ReadPageTool implements LuaTool {
  name = 'read_page';
  description =
    'Read the text of one public page with the research browser. Use it when the user names a page and wants what it says.';

  inputSchema = z.object({
    url: z.string().url().describe('The absolute http(s) URL of the page to read'),
    selector: z
      .string()
      .optional()
      .describe('A CSS selector to read instead of the whole page, for example ".price_color"'),
    waitFor: z
      .string()
      .optional()
      .describe('What to wait for first: "load", "networkidle", or a CSS selector that has to appear'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const page = await Browser.read(input.url, {
        browser: 'research',
        waitFor: input.waitFor ?? 'load',
        ...(input.selector ? { selector: input.selector } : {}),
      });

      if (page.blocked) {
        return {
          ok: false,
          blocked: page.blocker,
          kind: page.blockerKind,
          finalUrl: page.finalUrl,
          reason: page.blockerGuidance,
        };
      }

      if (typeof page.status === 'number' && page.status >= 400) {
        return { ok: false, status: page.status, reason: `The page answered ${page.status}.` };
      }

      return {
        ok: true,
        title: page.title,
        finalUrl: page.finalUrl,
        status: page.status,
        matches: page.matches,
        truncated: page.truncated || page.content.length > MAX_TEXT,
        text: page.content.slice(0, MAX_TEXT),
      };
    } catch (error) {
      return thrown(error);
    }
  }
}
