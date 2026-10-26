import { Browser, LuaTool } from 'lua-cli';
import { z } from 'zod';
import { dataOf, failedCommand, thrown } from '../../lib/browser';

const SITE = 'https://books.toscrape.com';
const BOOK = 'article.product_pod';
const SESSION = { browser: 'research', sessionKey: 'books' };

export default class BrowseCategoryTool implements LuaTool {
  name = 'browse_category';
  description =
    'Open a books.toscrape.com category one command at a time and report how many books it holds and what the first one costs.';

  inputSchema = z.object({
    category: z
      .string()
      .regex(/^[a-z-]+_\d+$/)
      .describe('A books.toscrape.com category slug, for example "travel_2", "mystery_3" or "poetry_23"'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const opened = await Browser.navigate({
        ...SESSION,
        url: `${SITE}/catalogue/category/books/${input.category}/index.html`,
        waitUntil: 'load',
      });
      if (opened.error) return failedCommand('navigate', opened);

      const ready = await Browser.wait({ ...SESSION, selector: BOOK, state: 'visible' });
      if (ready.error) {
        return { ...failedCommand('wait', ready), reason: `No category by the slug "${input.category}".` };
      }

      const count = await Browser.get({ ...SESSION, what: 'count', selector: BOOK });
      if (count.error) return failedCommand('get count', count);

      const title = await Browser.get({ ...SESSION, what: 'attr', selector: `${BOOK} h3 a`, attr: 'title' });
      if (title.error) return failedCommand('get attr', title);

      const price = await Browser.get({ ...SESSION, what: 'text', selector: `${BOOK} .price_color` });
      if (price.error) return failedCommand('get text', price);

      return {
        ok: true,
        category: input.category,
        booksOnPage: dataOf(count),
        firstBook: dataOf(title),
        firstPrice: dataOf(price),
        engine: opened.engine,
      };
    } catch (error) {
      return thrown(error);
    } finally {
      await Browser.close(SESSION).catch(() => undefined);
    }
  }
}
