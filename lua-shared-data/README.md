# Shared Data Collection — two agents, one price book

> One agent keeps a price book up to date. Another agent quotes from it. Both use `Data.shared(name)`.

Requires `lua-cli` 3.50.0 or later.

## What it does

`Data` is private to each agent. When several agents of one organization need the same reference data, an org admin
creates a **shared collection** and names which agents may read it and which may write it.

This example has two agents in two folders:

| Folder | Agent | Access | Tools |
| --- | --- | --- | --- |
| [`writer/`](./writer) | Pricing Desk (staff only) | writer | `set_price` creates or updates a product, `remove_product` deletes one |
| [`reader/`](./reader) | Sales Assistant (customers) | reader | `get_price` looks up a SKU, `find_products` searches by description |

Both use the shared collection `price_book`, which holds one collection, `products`.

```typescript
const book = Data.shared('price_book');

// Pricing Desk (writer)
await book.create('products', { sku, name, priceCents, currency }, { searchText, index: ['sku'] });

// Sales Assistant (reader)
const { data } = await book.get('products', { sku: 'CHAIR-OAK-01' });
const matches = await book.search('products', 'oak dining chair', 5, 0.6);
```

`Data.shared(name)` has the same methods as `Data`: `collections`, `create`, `get`, `getEntry`, `update`, `patch`,
`increment`, `search` and `delete`, with the same filters, limits, indexes and vector search.

## Setup

### 1. Create both agents

Install each folder and link it to its own agent. `lua init` fills in `YOUR_AGENT_ID` and `YOUR_ORG_ID` in
`lua.skill.yaml`.

```bash
cd writer && npm install && lua init
cd ../reader && npm install && lua init
```

Note both agent ids and your organization id (`lua agents --json --ci` prints them).

### 2. Create the shared collection (org admin)

Agents never create or grant a shared collection themselves. An org admin creates it once:

```bash
curl -sS -X POST "https://api.heylua.ai/admin/orgs/<<YOUR_ORG_ID>>/shared-collections" \
  -H "Authorization: Bearer <<YOUR_API_KEY>>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "price_book",
    "readers": ["<sales-assistant-agent-id>"],
    "writers": ["<pricing-desk-agent-id>"]
  }'
```

- `name` is unique in the organization: 1 to 128 characters of `A-Z a-z 0-9 _ . -`.
- `readers` and `writers` are explicit agent ids of the same organization (no `*`). A writer can also read.

Manage it later with the same API:

```http
GET    /admin/orgs/:orgId/shared-collections                list them with their access lists
PUT    /admin/orgs/:orgId/shared-collections/price_book     { "readers": [...], "writers": [...] }  replaces both lists
DELETE /admin/orgs/:orgId/shared-collections/price_book     ends access at once and purges the entries
```

A change applies to the next `Data.shared` call.

### 3. Deploy both agents

In each folder, push the agent, then make a version and promote it:

```bash
lua push
lua version create
lua version promote <version>
```

Shared collections are only reachable from a deployed agent. Then ask Pricing Desk to add a product ("Add CHAIR-OAK-01,
Oak dining chair, 149 EUR") and ask the Sales Assistant "How much is an oak dining chair?".

## Errors

Every failure has a stable `code`. Both agents turn the codes into a message the model can repeat:

| Code | Status | When |
| --- | --- | --- |
| `shared_data_forbidden` | 403 | The agent is not in the access list for that call (a reader that writes, for example), or the name does not exist, or it belongs to another organization. All three get the same answer. |
| `shared_data_test_session_write_refused` | 409 | A test session tried to write. Test sessions may read a shared collection but never write it. |
| `shared_data_unavailable_offline` | — | Any call under `lua test` or another local run: the access list lives on the platform. Deploy the agent to try it. |

## Good to know

- **Audit.** Every write records the agent, the collection and the entry id (never the value) in the organization's
  audit log.
- **Billing.** Search text embedding is billed to the agent that writes the entry.
- **No personal data.** A shared collection is organization reference data. Do not store end-customer personal data
  in it.
- **When to use it.** Use `Data` for data one agent owns. Use a shared collection when several agents need the same
  reference data and one or a few of them maintain it.

[Data reference →](https://docs.heylua.ai/reference/sdk/data)
