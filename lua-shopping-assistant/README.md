# Your Lua AI Skill Project

Welcome to your Lua AI skill project! This project is ready to customize and deploy.

---

## 🎯 What You Have

This project includes:
- ✅ **7 Example Skills** - Pre-configured skill examples
- ✅ **30+ Example Tools** - Working tool implementations
- ✅ **All Platform APIs** - User, Products, Baskets, Orders, Custom Data
- ✅ **TypeScript Setup** - Full type safety
- ✅ **Ready to Deploy** - Just customize and go!

---

## 🚀 Quick Start

```bash
# 1. Test a tool locally
npm run test
# or
lua test

# 2. Start development mode (live reload + chat interface)
npm run dev
# or
lua dev

# 3. Push to server
npm run push
# or
lua push

# 4. Deploy to production
lua deploy
```

**Your AI is now live!** 🎉

---

## 📁 Project Structure

```
your-project/
├── src/
│   ├── index.ts              # YOUR STARTING POINT - Define skills here
│   └── tools/                # Tool implementations
│       ├── GetWeatherTool.ts       # External API example
│       ├── UserDataTool.ts         # User API example
│       ├── ProductsTool.ts         # Products API (6 tools)
│       ├── BasketTool.ts           # Baskets API (9 tools)
│       ├── OrderTool.ts            # Orders API (4 tools)
│       ├── CustomDataTool.ts       # Custom Data API (6 tools)
│       ├── PaymentTool.ts          # Payment integration
│       └── CreatePostTool.ts       # Simple example
├── lua.skill.yaml            # Configuration (auto-managed)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── .env                      # Environment variables (create this)
└── README.md                 # This file
```

---

## 🎓 Getting Started

### Step 1: Understand the Template

Open **`src/index.ts`** - this is where your skills are defined:

```typescript
// Example: General purpose skill
const generalSkill = new LuaSkill({
  name: "general-skill",
  version: "0.0.2",
  description: "Weather and utility tools",
  context: "Use get_weather for weather info...",
  tools: [
    new GetWeatherTool(),
    new CreatePostTool()
  ]
});
```

**You have 7 skills pre-configured:**
1. `general-skill` - Weather and posts
2. `user-data-skill` - User management
3. `product-skill` - Product catalog
4. `basket-skill` - Shopping carts
5. `order-skill` - Order processing
6. `custom-data-skill` - Custom data (movies example)
7. `payment-skill` - Payment links

---

### Step 2: Test the Examples

```bash
lua test
```

**Try these tools:**
- `get_weather` - Enter city: "London"
- `search_products` - Enter query: "laptop"
- `create_movie` - Enter title, director, year
- `get_user_data` - No input needed

---

### Step 3: Start Dev Mode

```bash
lua dev
```

**Opens chat interface at http://localhost:3000**

**Try chatting:**
- "What's the weather in Tokyo?"
- "Show me your products"
- "Create a shopping basket"
- "Add product XYZ to my basket"

---

### Step 4: Customize for Your Use Case

#### Option A: Modify Existing Tools

Edit `src/tools/GetWeatherTool.ts`:
```typescript
async execute(input: any) {
  const weather = await this.getWeather(input.city);
  
  // Add your customization
  return {
    ...weather,
    recommendation: this.getClothingAdvice(weather.temperature)
  };
}
```

#### Option B: Remove Unused Skills

Clean up `src/index.ts`:
```typescript
// Remove skills you don't need
// Keep only what's relevant to your use case

import { LuaSkill } from "lua-cli";
import GetWeatherTool from "./tools/GetWeatherTool";

const mySkill = new LuaSkill({
  name: "my-custom-skill",
  version: "1.0.0",
  description: "My specific use case",
  context: "Clear instructions for the AI...",
  tools: [
    new GetWeatherTool()
    // Add your tools
  ]
});
```

#### Option C: Create New Tools

Create `src/tools/MyTool.ts`:
```typescript
import { LuaTool } from "lua-cli";
import { z } from "zod";

export default class MyTool implements LuaTool {
  name = "my_tool";
  description = "What my tool does";
  
  inputSchema = z.object({
    param: z.string()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Your logic here
    return { success: true };
  }
}
```

Add to `src/index.ts`:
```typescript
import MyTool from "./tools/MyTool";

const mySkill = new LuaSkill({
  tools: [new MyTool()]
});
```

---

## 🛠️ Tool Examples Explained

### GetWeatherTool.ts
**What it does:** Fetches weather for any city using Open-Meteo API (free, no key required)

**Learn from this:**
- External API integration
- Error handling for API calls
- Data transformation

**Use it for:**
- Weather information
- Location-based services
- External API patterns

---

### UserDataTool.ts
**What it does:** Gets and updates user data (2 tools)

**Learn from this:**
- Using Platform APIs (`User`)
- Simple CRUD operations
- Data retrieval and updates

**Use it for:**
- User profile management
- Preference storage
- User-specific data

---

### ProductsTool.ts
**What it does:** Complete product management (6 tools)

**Learn from this:**
- Full CRUD operations
- Search functionality
- Pagination handling
- Platform API usage

**Tools included:**
- `search_products` - Search catalog
- `get_all_products` - List with pagination
- `create_product` - Add new products
- `update_product` - Modify existing
- `get_product_by_id` - Get specific product
- `delete_product` - Remove products

**Use it for:**
- E-commerce catalogs
- Inventory management
- Product recommendations

---

### BasketTool.ts
**What it does:** Shopping cart operations (9 tools)

**Learn from this:**
- Multi-step workflows
- State management
- Complex business logic

**Tools included:**
- `create_basket` - Start shopping
- `get_baskets` - List carts
- `add_to_basket` - Add items
- `remove_from_basket` - Remove items
- `clear_basket` - Empty cart
- `update_basket_status` - Change status
- `update_basket_metadata` - Add metadata
- `checkout_basket` - Convert to order
- `get_basket_by_id` - Get specific basket

**Use it for:**
- Shopping carts
- Temporary storage
- Multi-item collections

---

### OrderTool.ts
**What it does:** Order creation and tracking (4 tools)

**Learn from this:**
- Order fulfillment flows
- Status management
- Basket-to-order conversion

**Use it for:**
- Order processing
- Purchase completion
- Order tracking

---

### CustomDataTool.ts
**What it does:** Movie database with vector search (6 tools)

**Learn from this:**
- **Vector search** - Semantic similarity search
- Custom data collections
- Search indexing
- CRUD on custom schemas

**Tools included:**
- `create_movie` - Add movie with search indexing
- `get_movies` - List all movies
- `get_movie_by_id` - Get specific movie
- `update_movie` - Modify movie data
- `search_movies` - **Semantic search** (find similar)
- `delete_movie` - Remove movie

**Use it for:**
- Knowledge bases
- Document search
- FAQs
- Any searchable content
- Recommendation systems

**Vector Search Example:**
```typescript
// Create with search text
await Data.create('movies', {
  title: 'Inception',
  director: 'Christopher Nolan'
}, 'Inception Christopher Nolan sci-fi thriller dreams');

// Search semantically
const results = await Data.search('movies', 'mind-bending thriller', 10, 0.7);
// Returns: Inception with high similarity score!
```

---

### PaymentTool.ts
**What it does:** Creates payment links (Stripe example)

**Learn from this:**
- Environment variables for API keys
- External service integration
- Payment processing

**Use it for:**
- Payment collection
- Checkout flows
- Subscription management

---

### CreatePostTool.ts
**What it does:** Simple example tool

**Learn from this:**
- Basic tool structure
- Minimal implementation
- Good starting point

---

## 🎨 Customization Guide

### Scenario 1: Keep Only What You Need

**If you only need products:**

1. **Update `src/index.ts`:**
```typescript
import { LuaSkill } from "lua-cli";
import { SearchProductsTool, CreateProductTool } from "./tools/ProductsTool";

const productSkill = new LuaSkill({
  name: "product-catalog-skill",
  version: "1.0.0",
  description: "Product search and management",
  context: "Use search_products to find items. Use create_product to add new items.",
  tools: [
    new SearchProductsTool(),
    new CreateProductTool()
  ]
});
```

2. **Delete unused tool files:**
```bash
rm src/tools/BasketTool.ts
rm src/tools/OrderTool.ts
rm src/tools/CustomDataTool.ts
# Keep only ProductsTool.ts
```

3. **Test:**
```bash
lua test
```

---

### Scenario 2: Build a Restaurant Skill

1. **Rename tools to match your domain:**

Rename `CustomDataTool.ts` → `MenuTool.ts`

2. **Update tool names and descriptions:**
```typescript
export class CreateMenuItemTool implements LuaTool {
  name = "create_menu_item";
  description = "Add a new item to the restaurant menu";
  
  inputSchema = z.object({
    name: z.string(),
    category: z.enum(['appetizers', 'mains', 'desserts', 'drinks']),
    price: z.number(),
    description: z.string()
  });

  async execute(input: any) {
    const searchText = `${input.name} ${input.category} ${input.description}`;
    return await Data.create('menu_items', input, searchText);
  }
}
```

3. **Update skill context:**
```typescript
const restaurantSkill = new LuaSkill({
  description: "Restaurant assistant for menu, orders, and reservations",
  context: `
    Help customers interact with the restaurant.
    
    - Use show_menu when asked about food or drinks
    - Use create_order when taking orders (confirm items first)
    - Use make_reservation for table bookings
    
    Always mention daily specials.
    Confirm order details before submitting.
  `,
  tools: [new ShowMenuTool(), new CreateOrderTool()]
});
```

---

### Scenario 3: Build a CRM Skill

1. **Create customer management tools:**

Create `src/tools/CustomerTool.ts`:
```typescript
import { LuaTool, Data } from "lua-cli";
import { z } from "zod";

export class CreateCustomerTool implements LuaTool {
  name = "create_customer";
  description = "Add a new customer to CRM";
  
  inputSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    company: z.string().optional(),
    phone: z.string().optional()
  });

  async execute(input: any) {
    const searchText = `${input.name} ${input.email} ${input.company || ''}`;
    
    const customer = await Data.create('customers', {
      ...input,
      status: 'active',
      createdAt: new Date().toISOString()
    }, searchText);
    
    return {
      customerId: customer.id,
      message: `Customer ${input.name} added to CRM`
    };
  }
}

export class SearchCustomersTool implements LuaTool {
  name = "search_customers";
  description = "Search customers by name, email, or company";
  inputSchema = z.object({ query: z.string() });

  async execute(input: any) {
    const results = await Data.search('customers', input.query, 10, 0.7);
    
    return {
      customers: results.data.map(entry => ({
        id: entry.id,
        ...entry.data,
        relevance: entry.score
      }))
    };
  }
}
```

2. **Create interaction tracking:**

```typescript
export class LogInteractionTool implements LuaTool {
  name = "log_interaction";
  description = "Log customer interaction";
  
  inputSchema = z.object({
    customerId: z.string(),
    type: z.enum(['call', 'email', 'meeting']),
    notes: z.string()
  });

  async execute(input: any) {
    await Data.create('interactions', {
      customerId: input.customerId,
      type: input.type,
      notes: input.notes,
      timestamp: new Date().toISOString()
    }, `${input.type} ${input.notes}`);
    
    return { success: true };
  }
}
```

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Test tools interactively
npm run test
# or
lua test

# Start development mode
npm run dev
# or
lua dev

# Compile skill
npm run compile
# or
lua compile

# Push to server
npm run push
# or
lua push

# Deploy to production
lua deploy
```

---

## 📝 Configuration Files

### `lua.skill.yaml`

Auto-managed configuration file. Contains:
- Agent ID and organization ID
- Skill IDs (auto-created during compilation)
- Optional environment variables

```yaml
agent:
  agentId: agent_abc123
  orgId: org_xyz789

skills:
  - name: my-skill
    version: 1.0.0
    skillId: skill_xyz789  # Auto-created
```

**Don't manually edit `skillId`** - it's auto-managed!

---

### `.env` File

Create `.env` for environment variables:

```bash
# External API Keys
STRIPE_API_KEY=sk_test_abc123
SENDGRID_API_KEY=SG.xyz789
OPENAI_API_KEY=sk-abc123

# Configuration
API_BASE_URL=https://api.example.com
ENABLE_DEBUG=false
```

**Remember:** Add `.env` to `.gitignore`!

---

### `package.json`

Contains your dependencies and scripts:

```json
{
  "name": "your-skill-name",
  "version": "1.0.0",
  "scripts": {
    "test": "lua test",
    "dev": "lua dev",
    "compile": "lua compile",
    "push": "lua push"
  },
  "dependencies": {
    "lua-cli": "^2.0.0",
    "zod": "^3.0.0"
  }
}
```

---

## 🎯 Next Steps

### 1. Explore the Examples

**Try each tool:**
```bash
lua test
```

- Test `get_weather` - See external API calls
- Test `search_products` - See platform API usage
- Test `search_movies` - See vector search
- Test `create_basket` → `add_to_basket` → `checkout_basket` - See workflows

---

### 2. Understand the Code

**Read the tool files** in `src/tools/`:
- Start with simple ones (`GetWeatherTool.ts`, `CreatePostTool.ts`)
- Then explore complex ones (`BasketTool.ts`, `ProductsTool.ts`)
- Study vector search (`CustomDataTool.ts`)

**Key files to understand:**
- `src/index.ts` - How skills are structured
- `src/tools/ProductsTool.ts` - Complete CRUD pattern
- `src/tools/CustomDataTool.ts` - Vector search pattern
- `src/tools/BasketTool.ts` - Multi-step workflow pattern

---

### 3. Make It Yours

**Choose your approach:**

#### A. Modify Examples
Keep examples, change them to your domain:
- Movies → Your data type
- Products → Your catalog
- Weather → Your external API

#### B. Start Fresh
Delete examples, create new tools:
```bash
rm src/tools/*.ts
touch src/tools/MyFirstTool.ts
```

#### C. Mix and Match
Keep useful examples, add custom tools:
- Keep: `UserDataTool.ts` (always useful)
- Keep: `CustomDataTool.ts` (for knowledge base)
- Remove: `BasketTool.ts` (if not e-commerce)
- Add: Your custom tools

---

### 4. Deploy

```bash
# Test thoroughly
lua test
lua dev

# Push to server
lua push

# Deploy to production
lua deploy
```

---

## 📚 Documentation

### In This Project
- **README.md** - This file (project overview)
- **QUICKSTART.md** - 5-minute start guide
- **TOOL_EXAMPLES.md** - Detailed tool explanations

### Lua CLI Documentation
- **Getting Started** - Complete tutorial
- **API Reference** - All platform APIs
- **CLI Reference** - All commands
- **Template Guide** - This template explained

**Access via:**
```bash
# In your node_modules
ls node_modules/lua-cli/*.md

# Or online
https://docs.heylua.ai
```

---

## 💡 Tips & Tricks

### Tip 1: Start with Dev Mode

```bash
lua dev
```

**Why?**
- Instant feedback
- Chat testing
- Live reload
- See what the AI actually does

---

### Tip 2: Use Vector Search

For any searchable content:
```typescript
// When creating
await Data.create('items', data, searchableText);

// When searching
const results = await Data.search('items', query, 10, 0.7);
```

**Great for:**
- FAQs
- Documentation
- Product descriptions
- Customer notes

---

### Tip 3: Write Good Context

The `context` field is critical - it guides the AI:

**✅ Good:**
```typescript
context: `
  This skill helps users find and purchase products.
  
  - Use search_products when users describe what they want
  - Use create_basket to start a new shopping session
  - Use add_to_basket when they want to buy something
  - Use checkout_basket to complete the purchase
  
  Always confirm items and total before checkout.
  Mention shipping options during checkout.
`
```

**❌ Bad:**
```typescript
context: "Product and shopping tools"
```

---

### Tip 4: Test with Real Scenarios

Don't just test with perfect inputs:

```bash
lua dev
```

**Try:**
- ✅ "What's the weather?" (missing city - should prompt)
- ✅ "Add laptop to cart" (need basket ID - should create)
- ✅ "XYZ" (nonsense - should handle gracefully)

---

### Tip 5: Use Environment Variables

**Never hardcode secrets:**

```typescript
// ❌ Bad
const apiKey = 'sk_abc123';

// ✅ Good
import { env } from 'lua-cli';
const apiKey = env('STRIPE_API_KEY');
```

Create `.env`:
```bash
STRIPE_API_KEY=your_key_here
```

---

## 🎨 Customization Recipes

### Recipe 1: Simple Weather Skill

```typescript
// src/index.ts
import { LuaSkill } from "lua-cli";
import GetWeatherTool from "./tools/GetWeatherTool";

const weatherSkill = new LuaSkill({
  name: "weather-skill",
  version: "1.0.0",
  description: "Provides weather information worldwide",
  context: "Use get_weather when users ask about weather or temperature. Always include the city name.",
  tools: [new GetWeatherTool()]
});
```

**Deploy:**
```bash
lua test  # Test it
lua push  # Upload
lua deploy # Go live
```

---

### Recipe 2: Knowledge Base Skill

Use CustomDataTool.ts as template:

1. Rename collections: `movies` → `articles`
2. Update fields: title, director → title, content, category
3. Update descriptions to match your domain
4. Update skill context

**Result:** Searchable knowledge base!

---

### Recipe 3: E-commerce Skill

Keep: `ProductsTool.ts`, `BasketTool.ts`, `OrderTool.ts`

Remove: Everything else

**Result:** Complete shopping experience!

---

## 🔍 Understanding Multi-Skill Projects

This template has **7 skills** in one project:

**Why multiple skills?**
- Different domains (products vs orders)
- Different deployment schedules
- Logical organization
- Easier to manage

**How it works:**
- Each skill gets its own `skillId` in `lua.skill.yaml`
- All skills deploy together with `lua push`
- All skills available to your agent
- AI chooses right skill automatically

**You can:**
- Keep all 7 (if relevant)
- Merge into 1 (simpler)
- Create your own grouping

---

## 📊 Tool Inventory

### Included Tools (30 total)

| Category | Count | Examples |
|----------|-------|----------|
| **Weather** | 1 | get_weather |
| **User Data** | 2 | get_user_data, update_user_data |
| **Products** | 6 | search, create, update, get, delete, get_by_id |
| **Baskets** | 9 | create, add_item, remove, clear, checkout, etc. |
| **Orders** | 4 | create, update_status, get, get_by_id |
| **Custom Data** | 6 | create, search, update, delete (movies example) |
| **Payment** | 1 | create_payment_link |
| **Posts** | 1 | create_post |

**Total: 30 working examples** covering all major use cases!

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Hardcoding API Keys
```typescript
const apiKey = 'sk_abc123';  // DON'T DO THIS
```

✅ **Fix:** Use environment variables
```typescript
import { env } from 'lua-cli';
const apiKey = env('API_KEY');
```

---

### ❌ Mistake 2: Unclear Tool Names
```typescript
name = "tool1"  // Unclear
name = "do_stuff"  // Too generic
```

✅ **Fix:** Be specific
```typescript
name = "search_products"
name = "create_order"
name = "get_user_profile"
```

---

### ❌ Mistake 3: Weak Descriptions
```typescript
description = "Gets data"  // Too vague
```

✅ **Fix:** Be descriptive
```typescript
description = "Searches product catalog by name, category, or description"
```

---

### ❌ Mistake 4: Missing Error Handling
```typescript
async execute(input: any) {
  const result = await api.call(input);
  return result;  // What if it fails?
}
```

✅ **Fix:** Handle errors
```typescript
async execute(input: any) {
  try {
    const result = await api.call(input);
    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }
    return result.data;
  } catch (error) {
    throw new Error(`Failed to fetch data: ${error.message}`);
  }
}
```

---

## 🎓 Learning Path

### Week 1: Learn by Testing
- ✅ Run `lua test` daily
- ✅ Try every example tool
- ✅ Understand inputs and outputs
- ✅ Read the tool code

### Week 2: Modify Examples
- ✅ Change descriptions
- ✅ Add new input fields
- ✅ Modify return values
- ✅ Test your changes

### Week 3: Build Your Own
- ✅ Create 1-2 custom tools
- ✅ Remove unused examples
- ✅ Update skill context
- ✅ Deploy to production

---

## 🔗 Resources

### Documentation
- See markdown files in `node_modules/lua-cli/`
- Visit https://docs.heylua.ai
- Check CLI help: `lua --help`

### Examples
- All tools in `src/tools/` are working examples
- Copy, modify, learn!

### Community
- GitHub: https://github.com/lua-ai/lua-cli
- Issues: Report bugs or ask questions
- Email: support@lua.ai

---

## ✅ Checklist Before Deploying

- [ ] Removed unused tools and skills
- [ ] Updated skill names and descriptions
- [ ] Wrote clear context for AI
- [ ] Tested all tools with `lua test`
- [ ] Tested conversationally with `lua dev`
- [ ] No hardcoded secrets (use `.env`)
- [ ] Updated version number
- [ ] Reviewed error messages
- [ ] Checked tool names (no spaces!)

---

## 🎉 You're Ready!

This template gives you:
- ✅ **30 working tools** to learn from
- ✅ **All API patterns** demonstrated
- ✅ **Production-ready** structure
- ✅ **Easy to customize** for your needs

**Next steps:**
1. Test the examples: `lua test`
2. Chat with the AI: `lua dev`
3. Make it yours: Edit tools and skills
4. Deploy: `lua push && lua deploy`

**Go build something amazing!** 🚀

---

**Quick Links:**
- 📘 [Quick Start](QUICKSTART.md) - 5-minute guide
- 🔧 [Tool Examples](TOOL_EXAMPLES.md) - Detailed tool docs
- 💻 [CLI Commands](../CLI_REFERENCE.md) - Command reference
- 📚 [API Docs](../API_REFERENCE.md) - Complete API reference

