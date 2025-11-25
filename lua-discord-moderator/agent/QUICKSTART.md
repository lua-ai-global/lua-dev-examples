# 🚀 Quick Start Guide

Welcome to your Lua AI Agent! This template provides a complete example of how to build powerful AI agents with custom tools, webhooks, scheduled jobs, and more.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Essential Commands](#essential-commands)
- [Understanding LuaAgent](#understanding-luaagent)
- [Project Structure](#project-structure)
- [Next Steps](#next-steps)

---

## 🎯 Getting Started

Your project has been initialized with everything you need to build and deploy an AI agent!

### What's Included

✅ **Example Skills** - Pre-built tools for weather, user data, products, baskets, orders  
✅ **Example Webhooks** - HTTP endpoints that receive external events  
✅ **Example Jobs** - Scheduled tasks that run automatically  
✅ **Example Processors** - Pre/post-process chat messages  
✅ **LuaAgent Configuration** - Unified agent setup in `src/index.ts`  

---

## 🛠️ Essential Commands

### 1. Test Your Tools & Skills

Test individual tools interactively before deploying:

```bash
lua test
```

**What it does:**
- Lets you select a tool/webhook/job to test
- Prompts for input values
- Executes in a local sandbox
- Shows the output

**Perfect for:**
- Testing tool logic before deployment
- Debugging input/output schemas
- Validating webhook handlers

---

### 2. Chat with Your Agent

Have a conversation with your agent to see tools in action:

```bash
lua chat
```

**Select environment:**
- **🔧 Sandbox** - Test with your local code (not deployed yet)
- **🚀 Production** - Chat with your deployed agent

**Try asking:**
- "What's the weather in London?"
- "Show me all products"
- "Create a basket for user 123"

**Pro tip:** Use sandbox mode to test changes before deploying!

---

### 3. Deploy to Production

When ready, push your skills to the server:

```bash
# Interactive deployment (recommended for first time)
lua push

# Or push all components at once
lua push all --force

# Push and deploy to production in one command
lua push all --force --auto-deploy
```

**What happens:**
1. Compiles your code
2. Bundles all tools/webhooks/jobs
3. Pushes new version to server
4. Updates `lua.skill.yaml` with new version
5. Optionally deploys to production

---

## 🤖 Understanding LuaAgent

The `LuaAgent` is the **central configuration** for your AI agent. It's defined in `src/index.ts`:

```typescript
export const agent = new LuaAgent({
  name: 'my-assistant',
  persona: 'You are a helpful AI assistant...',
  skills: [generalSkill, userSkill, productSkill],
  webhooks: [paymentWebhook],
  jobs: [dailyCleanupJob],
  preProcessors: [messageMatchingProcessor],
  postProcessors: [responseModifierProcessor]
});
```

### Key Properties

#### `name` (string)
- Your agent's identifier
- Used for logging and organization
- Example: `'customer-support-agent'`

#### `persona` (string)
- Defines your agent's personality and behavior
- How the AI should respond to users
- What tone and style to use

**Example:**
```typescript
persona: `You are Emma, a friendly customer support agent for Acme Corp. 
You're helpful, patient, and always prioritize customer satisfaction.
Use a warm, professional tone and offer solutions proactively.`
```

#### `skills` (array of LuaSkill)
- Collections of tools grouped by functionality
- Each skill contains multiple related tools
- Agents can use all tools from all skills

**Example:**
```typescript
skills: [
  generalSkill,      // Weather, posts, calculations
  productSkill,      // Product search, CRUD operations
  basketSkill,       // Shopping cart management
  orderSkill         // Order processing
]
```

#### `webhooks` (array of LuaWebhook, optional)
- HTTP endpoints that receive external events
- Trigger actions based on external systems
- Examples: Payment notifications, order updates

**Example:**
```typescript
webhooks: [
  paymentWebhook,    // Stripe payment confirmations
  userEventWebhook   // External system notifications
]
```

#### `jobs` (array of LuaJob, optional)
- Scheduled tasks that run automatically
- Can be one-time, recurring, or cron-based
- Examples: Daily cleanups, health checks, reminders

**Example:**
```typescript
jobs: [
  dailyCleanupJob,          // Runs every day at midnight
  abandonedBasketProcessor  // Checks for abandoned baskets hourly
]
```

#### `preProcessors` (array of PreProcessor, optional)
- Run **before** messages reach the agent
- Modify, filter, or enhance incoming messages
- Examples: Profanity filtering, intent detection, routing

**Example:**
```typescript
preProcessors: [
  messageMatchingProcessor  // Routes messages based on patterns
]
```

#### `postProcessors` (array of PostProcessor, optional)
- Run **after** the agent generates a response
- Modify, enhance, or format responses
- Examples: Add disclaimers, translate, format

**Example:**
```typescript
postProcessors: [
  responseModifierProcessor  // Adds custom formatting
]
```

---

## 📁 Project Structure

```
your-project/
├── src/
│   ├── index.ts                 # 🎯 Main file - LuaAgent definition
│   ├── skills/                  # Skills grouped by functionality
│   │   ├── tools/              # Individual tool implementations
│   │   │   ├── GetWeatherTool.ts
│   │   │   ├── ProductsTool.ts
│   │   │   └── BasketTool.ts
│   │   ├── product.skill.ts    # Product skill (groups product tools)
│   │   └── basket.skill.ts     # Basket skill (groups basket tools)
│   ├── webhooks/               # HTTP webhook handlers
│   │   ├── PaymentWebhook.ts
│   │   └── UserEventWebhook.ts
│   ├── jobs/                   # Scheduled background tasks
│   │   ├── DailyCleanupJob.ts
│   │   └── HealthCheckJob.ts
│   ├── preprocessors/          # Message preprocessors
│   │   └── messageMatching.ts
│   ├── postprocessors/         # Response postprocessors
│   │   └── modifyResponse.ts
│   └── services/               # Shared utilities
│       ├── ApiService.ts
│       └── GetWeather.ts
├── lua.skill.yaml              # 📝 Configuration & metadata
├── package.json
└── tsconfig.json
```

---

## 🎓 Key Concepts

### Skills vs Tools

**Tools** are individual functions:
```typescript
export default class GetWeatherTool implements LuaTool {
  name = "get_weather";
  description = "Get weather for a city";
  // ... implementation
}
```

**Skills** group related tools:
```typescript
export const weatherSkill = new LuaSkill({
  name: 'weather-skill',
  description: 'Weather information tools',
  context: 'Use these tools to get weather data',
  tools: [getWeatherTool, forecastTool]
});
```

**Why?** Skills help organize tools and provide context to the AI about when to use them.

### The LuaAgent Advantage

Instead of exporting individual skills, webhooks, and jobs separately, the **LuaAgent** provides a single, unified configuration:

**❌ Old Way (Legacy):**
```typescript
export const skill1 = new LuaSkill({...});
export const skill2 = new LuaSkill({...});
export const webhook1 = new LuaWebhook({...});
// Hard to manage, hard to see the big picture
```

**✅ New Way (LuaAgent):**
```typescript
export const agent = new LuaAgent({
  name: 'my-agent',
  persona: '...',
  skills: [skill1, skill2],
  webhooks: [webhook1],
  jobs: [job1]
});
// Everything in one place, easy to understand
```

**Benefits:**
- 📦 Single source of truth
- 🎯 Clear agent configuration
- 🔄 Automatic YAML sync
- 📝 Better organization

---

## 🧪 Development Workflow

### Typical Development Flow

1. **Create/Modify Tools**
   ```bash
   # Edit your tools in src/skills/tools/
   vim src/skills/tools/MyNewTool.ts
   ```

2. **Test Locally**
   ```bash
   # Test the specific tool
   lua test
   ```

3. **Chat Test (Sandbox)**
   ```bash
   # Chat with your agent using local code
   lua chat
   # Select: Sandbox
   ```

4. **Compile**
   ```bash
   # Bundle everything
   lua compile
   ```

5. **Push to Server**
   ```bash
   # Upload new version
   lua push
   ```

6. **Chat Test (Production)**
   ```bash
   # Chat with deployed agent
   lua chat
   # Select: Production
   ```

---

## 🚀 Quick Examples

### Example 1: Adding a New Tool

Create a new tool file:

```typescript
// src/skills/tools/GreetingTool.ts
import { LuaTool } from "lua-cli/skill";
import { z } from "zod";

export default class GreetingTool implements LuaTool {
  name = "greet_user";
  description = "Generate a personalized greeting";
  
  inputSchema = z.object({
    name: z.string(),
    language: z.enum(['en', 'es', 'fr']).optional()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const greetings = {
      en: `Hello, ${input.name}!`,
      es: `¡Hola, ${input.name}!`,
      fr: `Bonjour, ${input.name}!`
    };
    
    const lang = input.language || 'en';
    return { greeting: greetings[lang] };
  }
}
```

Add it to your skill:

```typescript
// src/skills/general.skill.ts
import GreetingTool from './tools/GreetingTool';

export const generalSkill = new LuaSkill({
  name: 'general-skill',
  description: 'General purpose utilities',
  context: 'Use these for common tasks',
  tools: [
    new GetWeatherTool(),
    new GreetingTool(),  // ✅ Add your new tool
  ]
});
```

Test it:
```bash
lua test
# Select: greet_user
# Input name: "Alice"
# Input language: "es"
# Output: { greeting: "¡Hola, Alice!" }
```

### Example 2: Creating a Scheduled Job

```typescript
// src/jobs/DailyReportJob.ts
import { LuaJob, User } from "lua-cli";

export default new LuaJob({
  name: "daily-report",
  description: "Send daily summary to admin",
  
  schedule: {
    type: "cron",
    pattern: "0 9 * * *"  // Every day at 9 AM
  },
  
  execute: async (job) => {
    const user = await job.user();
    
    // Generate report
    const report = `Daily Summary for ${new Date().toDateString()}`;
    
    // Send to user
    await user.send([{
      type: "text",
      text: report
    }]);
    
    return { success: true, sent: true };
  }
});
```

Add to LuaAgent:
```typescript
import dailyReportJob from './jobs/DailyReportJob';

export const agent = new LuaAgent({
  // ...
  jobs: [dailyReportJob]
});
```

### Example 3: Creating a Webhook

```typescript
// src/webhooks/OrderWebhook.ts
import { LuaWebhook, Orders } from "lua-cli";
import { z } from "zod";

export default new LuaWebhook({
  name: "order-notification",
  description: "Receive order updates from external systems",
  
  bodySchema: z.object({
    orderId: z.string(),
    status: z.string(),
    amount: z.number()
  }),
  
  execute: async ({ body }) => {
    // Update order in your system
    await Orders.updateStatus(body.status, body.orderId);
    
    return {
      status: 200,
      body: { success: true, orderId: body.orderId }
    };
  }
});
```

---

## 📚 Available APIs

Your tools and jobs have access to these powerful APIs:

### User Data
```typescript
const user = await User.get();
await user.update({ preferences: 'dark mode' });
await user.send([{ type: "text", text: "Hello!" }]);
```

### Products
```typescript
const products = await Products.get();
const product = await Products.create({ name: "Widget", price: 29.99 });
await product.update({ price: 24.99 });
```

### Baskets
```typescript
const basket = await Baskets.create();
await basket.addItem({ productId: "123", quantity: 2 });
await basket.placeOrder();
```

### Orders
```typescript
const orders = await Orders.get();
await Orders.updateStatus('confirmed', orderId);
```

### Custom Data
```typescript
const movies = await Data.get('movies');
await Data.create('movies', { title: "Inception", year: 2010 });
```

### Jobs (Dynamic)
```typescript
const job = await Jobs.create({
  name: "remind-user",
  schedule: { type: "once", executeAt: new Date(Date.now() + 3600000) },
  metadata: { message: "Time for your meeting!" },
  execute: async (job) => {
    const user = await job.user();
    await user.send([{ type: "text", text: job.metadata.message }]);
    return { success: true };
  }
});
```

---

## 🔑 Key Features

### Auto-Sync Between Code and YAML

Your `lua.skill.yaml` and `LuaAgent` in `index.ts` stay synchronized automatically:

**When you run `lua init`:**
- ✅ Agent name, persona, and welcome message are added to both YAML and code

**When you run `lua compile`:**
- ✅ LuaAgent persona and welcome message sync to YAML

**Why?** This ensures your configuration is always consistent!

### Environment Variables

Use `.env` for API keys and sensitive data:

```bash
# .env
OPENAI_API_KEY=your-key-here
STRIPE_SECRET_KEY=your-stripe-key
PINECONE_API_KEY=your-pinecone-key
LUA_API_KEY=your-lua-api-key  # Optional: for CI/CD
```

Access in your code:
```typescript
import { env } from "lua-cli/skill";

const apiKey = env('OPENAI_API_KEY');
```

---

## 📖 Common Patterns

### Pattern 1: Tool with External API

```typescript
import { LuaTool } from "lua-cli/skill";
import { z } from "zod";
import axios from "axios";
import { env } from "lua-cli/skill";

export default class WeatherTool implements LuaTool {
  name = "get_weather";
  description = "Get current weather for a city";
  
  inputSchema = z.object({
    city: z.string()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const apiKey = env('WEATHER_API_KEY');
    
    const response = await axios.get(`https://api.weather.com/current`, {
      params: { city: input.city, apiKey }
    });
    
    return {
      temperature: response.data.temp,
      condition: response.data.condition,
      city: input.city
    };
  }
}
```

### Pattern 2: Tool that Creates a Job

```typescript
import { LuaTool, Jobs, JobInstance } from "lua-cli";
import { z } from "zod";

export default class ReminderTool implements LuaTool {
  name = "set_reminder";
  description = "Set a reminder for later";
  
  inputSchema = z.object({
    message: z.string(),
    delayMinutes: z.number()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Create a job that will notify the user later
    const job = await Jobs.create({
      name: `reminder-${Date.now()}`,
      description: "User reminder",
      metadata: {
        message: input.message  // ✅ Pass data via metadata
      },
      schedule: {
        type: "once",
        executeAt: new Date(Date.now() + input.delayMinutes * 60000)
      },
      execute: async (jobInstance: JobInstance) => {
        const user = await jobInstance.user();
        const message = jobInstance.metadata.message;
        
        await user.send([{ 
          type: "text", 
          text: `⏰ Reminder: ${message}` 
        }]);
        
        return { success: true };
      }
    });
    
    return { 
      success: true, 
      message: `Reminder set for ${input.delayMinutes} minutes from now`,
      jobId: job.id 
    };
  }
}
```

**Important:** Job execute functions must be self-contained. Use `metadata` to pass data!

### Pattern 3: Webhook that Triggers Job

```typescript
import { LuaWebhook, Jobs } from "lua-cli";
import { z } from "zod";

export default new LuaWebhook({
  name: "order-received",
  description: "Handle new order notifications",
  
  bodySchema: z.object({
    orderId: z.string(),
    userId: z.string()
  }),
  
  execute: async ({ body }) => {
    // Create a job to process the order in 5 minutes
    await Jobs.create({
      name: `process-order-${body.orderId}`,
      metadata: { orderId: body.orderId },
      schedule: {
        type: "once",
        executeAt: new Date(Date.now() + 300000)
      },
      execute: async (job) => {
        // Process order logic here
        return { success: true };
      }
    });
    
    return {
      status: 200,
      body: { received: true, orderId: body.orderId }
    };
  }
});
```

---

## 🎯 Next Steps

### 1. Customize Your Agent

Edit `src/index.ts` and update:
- Agent name
- Persona (how your agent behaves)
- Welcome message

### 2. Explore Example Tools

Look in `src/skills/tools/` to see:
- `GetWeatherTool.ts` - External API integration
- `ProductsTool.ts` - CRUD operations with Products API
- `BasketTool.ts` - Shopping cart management
- `GameScoreTrackerTool.ts` - Complex state management

### 3. Test Everything

```bash
# Test individual tools
lua test

# Chat with your agent
lua chat

# Compile and check for errors
lua compile
```

### 4. Deploy

```bash
# Push new version
lua push

# Or push everything at once
lua push all --force --auto-deploy
```

### 5. Monitor & Manage

```bash
# View production status
lua production

# Manage environment variables
lua env production

# Update persona
lua persona production

# View logs
lua logs
```

---

## 💡 Tips & Best Practices

### Tool Design
✅ **Clear names** - Use descriptive tool names like `get_weather`, not `weather`  
✅ **Validate inputs** - Use Zod schemas to ensure data quality  
✅ **Good descriptions** - Help the AI understand when to use your tool  
✅ **Handle errors** - Return error messages instead of throwing  

### Job Design
✅ **Self-contained** - Jobs should not depend on parent scope variables  
✅ **Use metadata** - Pass data through `metadata` field  
✅ **Proper scheduling** - Choose appropriate schedule types (once, cron, interval)  
✅ **Idempotent** - Jobs should be safe to run multiple times  

### Webhook Design
✅ **Validate inputs** - Use schemas for query, headers, and body  
✅ **Return proper status** - Use HTTP status codes (200, 400, etc.)  
✅ **Handle failures** - Return error responses gracefully  
✅ **Security** - Validate signatures for production webhooks  

### Agent Persona
✅ **Be specific** - Define personality, tone, and behavior clearly  
✅ **Set boundaries** - Explain what the agent can and cannot do  
✅ **Give examples** - Show how the agent should respond  
✅ **Update regularly** - Refine based on user interactions  

---

## 🆘 Need Help?

### Commands
```bash
lua --help              # All available commands
lua compile --help      # Compilation help
lua push --help         # Deployment help
lua test --help         # Testing help
```

### Common Issues

**Q: Tool not showing up in agent?**
- ✅ Make sure it's added to a skill
- ✅ Make sure the skill is added to LuaAgent
- ✅ Run `lua compile`

**Q: Job execute function has undefined variables?**
- ✅ Use `metadata` to pass data to the job
- ✅ Job functions must be self-contained

**Q: Changes not reflecting in production?**
- ✅ Run `lua compile` first
- ✅ Run `lua push` to upload
- ✅ Select the right environment in `lua chat`

---

## 🎉 You're Ready!

You now have everything you need to build powerful AI agents with Lua. Start by:

1. Testing the example tools with `lua test`
2. Chatting with your agent using `lua chat`
3. Exploring the code in `src/skills/tools/`
4. Customizing the agent persona in `src/index.ts`

Happy building! 🚀

---

## 📞 Support

- **Documentation:** https://docs.heylua.ai
- **GitHub:** https://github.com/heylua/lua-cli
- **Email:** support@heylua.ai

---

*This template is part of lua-cli v3.0.0. For the latest updates, run `npm install -g lua-cli`*

