import { Data, LuaAgent, LuaSkill, LuaTool } from 'lua-cli';
import { z } from 'zod';

/** The org-shared collection an org admin created, with this agent in `writers`. */
const PRICE_BOOK = 'price_book';
/** The collection inside it that holds one entry per product. */
const PRODUCTS = 'products';

/** Shared-data failures carry a stable `code`; the message is for people. */
function codeOf(err: unknown): string | undefined {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

function explain(err: unknown): string {
  switch (codeOf(err)) {
    case 'shared_data_forbidden':
      return 'This agent may not write the shared price book. Ask an org admin to add it to the writers.';
    case 'shared_data_test_session_write_refused':
      return 'Test sessions can read the shared price book but not change it.';
    case 'shared_data_unavailable_offline':
      return 'The shared price book is only reachable from a deployed agent, not from a local test run.';
    default:
      throw err;
  }
}

class SetPriceTool implements LuaTool {
  name = 'set_price';
  description = 'Create or update one product in the shared price book that the sales agents quote from';

  inputSchema = z.object({
    sku: z.string().min(1).describe('The product SKU, for example "CHAIR-OAK-01"'),
    name: z.string().min(1).describe('The product name as customers see it'),
    priceCents: z.number().int().nonnegative().describe('The price in cents'),
    currency: z.string().length(3).describe('ISO currency code, for example "EUR"'),
    description: z.string().default('').describe('A short description, used for search'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const book = Data.shared(PRICE_BOOK);
    const row = {
      sku: input.sku,
      name: input.name,
      priceCents: input.priceCents,
      currency: input.currency.toUpperCase(),
      description: input.description,
    };
    const searchText = `${input.name} ${input.description}`.trim();

    try {
      const { data: existing } = await book.get(PRODUCTS, { sku: input.sku }, 1, 1);
      if (existing.length > 0) {
        await book.update(PRODUCTS, existing[0].id, row, { searchText });
        return { ok: true, action: 'updated', sku: input.sku };
      }
      // Declare the filtered field once so lookups by SKU stay fast as the book grows.
      const created = await book.create(PRODUCTS, row, { searchText, index: ['sku'] });
      return { ok: true, action: 'created', sku: input.sku, id: created.id };
    } catch (err) {
      return { ok: false, error: explain(err) };
    }
  }
}

class RemoveProductTool implements LuaTool {
  name = 'remove_product';
  description = 'Remove a discontinued product from the shared price book';

  inputSchema = z.object({
    sku: z.string().min(1).describe('The SKU of the product to remove'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const book = Data.shared(PRICE_BOOK);
    try {
      const { data: existing } = await book.get(PRODUCTS, { sku: input.sku }, 1, 1);
      if (existing.length === 0) return { ok: true, action: 'none', sku: input.sku };
      await book.delete(PRODUCTS, existing[0].id);
      return { ok: true, action: 'removed', sku: input.sku };
    } catch (err) {
      return { ok: false, error: explain(err) };
    }
  }
}

const priceBookSkill = new LuaSkill({
  name: 'price-book-admin',
  description: 'Maintain the organization-wide price book',
  context: `
Use set_price when a staff member gives you a new product or a new price.
Use remove_product when a product is discontinued.
Always confirm the SKU and the price back to the staff member after a change.
If a tool returns ok: false, tell the staff member the error word for word.`,
  tools: [new SetPriceTool(), new RemoveProductTool()],
});

export const agent = new LuaAgent({
  name: 'Pricing Desk',
  persona: `You are Pricing Desk, the internal assistant that keeps the company price book current.
You only talk to staff. You are precise and brief.
You never invent a price: every change comes from what the staff member tells you.`,
  skills: [priceBookSkill],
});
