import { Browser, LuaTool } from 'lua-cli';
import { z } from 'zod';
import { thrown } from '../../lib/browser';

const PRICE = /(\d+\.\d{2})/;
const IN_STOCK = /In stock \((\d+) available\)/i;

export default class CheckPriceTool implements LuaTool {
  name = 'check_price';
  description =
    'Read the price and the stock of one book on books.toscrape.com. Use it when the user asks what something costs or whether it is in stock.';

  inputSchema = z.object({
    url: z
      .string()
      .url()
      .describe('A books.toscrape.com product page URL, for example https://books.toscrape.com/catalogue/soumission_998/index.html'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const page = await Browser.read(input.url, {
        browser: 'research',
        waitFor: '.product_main',
        selector: '.product_main',
      });

      if (page.blocked) {
        return { ok: false, blocked: page.blocker, reason: page.blockerGuidance };
      }

      const price = PRICE.exec(page.content);
      const stock = IN_STOCK.exec(page.content);

      if (!price) {
        return {
          ok: false,
          title: page.title,
          reason: 'That page has no price on it. It may not be a product page.',
        };
      }

      return {
        ok: true,
        title: page.title.replace(/\s*\|.*$/, '').trim(),
        price: `GBP ${price[1]}`,
        inStock: stock !== null,
        available: stock ? Number(stock[1]) : 0,
        finalUrl: page.finalUrl,
      };
    } catch (error) {
      return thrown(error);
    }
  }
}
