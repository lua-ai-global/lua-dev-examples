import { Data, LuaAgent, LuaSkill, LuaTool } from 'lua-cli';
import { z } from 'zod';

/** The org-shared collection an org admin created, with this agent in `readers`. */
const PRICE_BOOK = 'price_book';
const PRODUCTS = 'products';

function codeOf(err: unknown): string | undefined {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

/** A reader never writes, so only these two codes are expected here. */
function explain(err: unknown): string {
  switch (codeOf(err)) {
    case 'shared_data_forbidden':
      return 'The price book is not available to this agent. Ask an org admin to add it to the readers.';
    case 'shared_data_unavailable_offline':
      return 'The price book is only reachable from a deployed agent, not from a local test run.';
    default:
      throw err;
  }
}

function money(priceCents: number, currency: string): string {
  return `${(priceCents / 100).toFixed(2)} ${currency}`;
}

class GetPriceTool implements LuaTool {
  name = 'get_price';
  description = 'Look up the current price of one product by its SKU';

  inputSchema = z.object({
    sku: z.string().min(1).describe('The product SKU'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const { data } = await Data.shared(PRICE_BOOK).get(PRODUCTS, { sku: input.sku }, 1, 1);
      if (data.length === 0) return { found: false, sku: input.sku };
      const product = data[0].data;
      return {
        found: true,
        sku: product.sku,
        name: product.name,
        price: money(product.priceCents, product.currency),
      };
    } catch (err) {
      return { found: false, error: explain(err) };
    }
  }
}

class FindProductsTool implements LuaTool {
  name = 'find_products';
  description = 'Find products in the price book that match what the customer describes';

  inputSchema = z.object({
    query: z.string().min(1).describe('What the customer is looking for, in their words'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      // Vector search over the searchText the writer set; at most 5 matches above a 0.6 score.
      const matches = await Data.shared(PRICE_BOOK).search(PRODUCTS, input.query, 5, 0.6);
      return {
        products: matches.map((entry) => ({
          sku: entry.data.sku,
          name: entry.data.name,
          price: money(entry.data.priceCents, entry.data.currency),
        })),
      };
    } catch (err) {
      return { products: [], error: explain(err) };
    }
  }
}

const quotingSkill = new LuaSkill({
  name: 'quoting',
  description: 'Answer price questions from the shared price book',
  context: `
Use find_products when the customer describes what they want.
Use get_price when the customer gives a SKU.
Quote only prices the tools return. If a product is not found, say so and offer to look for something similar.`,
  tools: [new GetPriceTool(), new FindProductsTool()],
});

export const agent = new LuaAgent({
  name: 'Sales Assistant',
  persona: `You are the sales assistant of a furniture shop.
You are friendly and to the point.
You never make up a price: every price you quote comes from the price book.`,
  skills: [quotingSkill],
});
