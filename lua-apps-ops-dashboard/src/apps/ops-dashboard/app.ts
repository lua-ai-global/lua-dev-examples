import { Data, defineWebApp, json, route } from 'lua-cli';
import { z } from 'zod';

/**
 * ops-dashboard: a small ticket board for the agent's team.
 *
 * Pages: the Vite project in ./web. Routes: the handlers below. Each route runs
 * in the Lua sandbox as the person who opened the app (`auth`), so writes record
 * who made them.
 *
 *   lua apps dev ops-dashboard
 *   lua test webapp --name ops-dashboard --route 'GET /tickets?status=open'
 *   lua push webapp --name ops-dashboard
 */

const COLLECTION = 'tickets';

const Ticket = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(['low', 'normal', 'high']),
  status: z.enum(['open', 'closed']),
  createdBy: z.string(),
  createdAt: z.string(),
  closedBy: z.string().optional(),
  closedAt: z.string().optional(),
  note: z.string().optional(),
});
type Ticket = z.infer<typeof Ticket>;

/** A stored entry as the page sees it: the entry id plus its fields. */
function toTicket(entry: { id: string; data: Record<string, any> }): Ticket {
  return { id: entry.id, ...entry.data } as Ticket;
}

export default defineWebApp({
  name: 'ops-dashboard',
  description: 'Open and closed tickets for the team',
  pages: {
    root: './web',
    nav: [{ path: '/', label: 'Tickets' }],
  },
  routes: {
    'GET /tickets': route({
      description: 'Lists tickets with one status, newest first',
      query: z.object({ status: z.enum(['open', 'closed']).default('open') }),
      responses: { 200: z.object({ items: z.array(Ticket) }) },
      handler: async ({ query }) => {
        // The schema fills in the default; `?? 'open'` is for the type checker.
        const page = await Data.get(COLLECTION, { status: query.status ?? 'open' }, 1, 50);
        const items = page.data.map(toTicket).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return { items };
      },
    }),

    'POST /tickets': route({
      description: 'Opens a ticket as the signed-in person',
      body: z.object({
        title: z.string().trim().min(1).max(200),
        priority: z.enum(['low', 'normal', 'high']).default('normal'),
      }),
      responses: { 201: Ticket },
      handler: async ({ body, auth }) => {
        const fields = {
          title: body.title,
          priority: body.priority,
          status: 'open' as const,
          createdBy: auth.name ?? auth.email ?? auth.userId,
          createdAt: new Date().toISOString(),
        };
        const entry = await Data.create(COLLECTION, fields, body.title);
        return json({ id: entry.id, ...fields }, 201);
      },
    }),

    'POST /tickets/:id/close': route({
      description: 'Closes a ticket and records who closed it',
      params: z.object({ id: z.string().min(1) }),
      body: z.object({ note: z.string().max(500).optional() }),
      responses: { 404: z.object({ message: z.string() }) },
      handler: async ({ params, body, auth }) => {
        try {
          await Data.getEntry(COLLECTION, params.id);
        } catch {
          return json({ message: `No ticket ${params.id}` }, 404);
        }
        await Data.patch(COLLECTION, params.id, {
          set: {
            status: 'closed',
            closedBy: auth.name ?? auth.email ?? auth.userId,
            closedAt: new Date().toISOString(),
            ...(body.note ? { note: body.note } : {}),
          },
        });
        return json(undefined, 204);
      },
    }),
  },
});
