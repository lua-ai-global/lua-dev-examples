# Quick Start - 5 Minutes to Your First AI Skill

Get up and running in 5 minutes!

---

## ⚡ Super Quick Start

```bash
# 1. Test the examples
lua test

# 2. Start dev mode
lua dev

# 3. Chat at http://localhost:3000
# Try: "What's the weather in London?"

# 4. Customize src/index.ts

# 5. Deploy
lua push
lua deploy
```

**Done!** 🎉

---

## 🧪 Step 1: Test Tools (1 minute)

```bash
lua test
```

**Try these:**

1. **Select:** `get_weather`
   - **Input:** city: `London`
   - **Output:** Temperature, wind speed, conditions

2. **Select:** `search_products`
   - **Input:** query: `laptop`
   - **Output:** Product list

3. **Select:** `search_movies`
   - **Input:** query: `thriller`
   - **Output:** Movies with similarity scores

**What you learned:** How tools work!

---

## 💬 Step 2: Chat Test (2 minutes)

```bash
lua dev
```

**Browser opens at http://localhost:3000**

**Try chatting:**
- "What's the weather in Tokyo?"
- "Show me your products"
- "Create a movie called Inception directed by Christopher Nolan in 2010"
- "Search for movies about dreams"
- "Create a shopping basket and add a laptop"

**What you learned:** How AI uses your tools!

---

## 🎨 Step 3: Customize (2 minutes)

Open **`src/index.ts`** and simplify:

```typescript
import { LuaSkill } from "lua-cli";
import GetWeatherTool from "./tools/GetWeatherTool";

// Keep only what you need
const mySkill = new LuaSkill({
  name: "my-skill",
  version: "1.0.0",
  description: "My custom AI assistant",
  context: "Use get_weather when users ask about weather.",
  tools: [
    new GetWeatherTool()
  ]
});
```

**Save the file** - dev mode auto-reloads!

Chat again: "What's the weather in Paris?"

**What you learned:** How to customize!

---

## 🚀 What's Next?

### Option A: Learn by Exploring

1. Read each tool in `src/tools/`
2. Try modifying them
3. Test your changes
4. Build confidence

**Time:** A few hours  
**Best for:** Visual learners

---

### Option B: Build Something Specific

Pick a use case:
- **Knowledge Base** → Use CustomDataTool.ts as template
- **E-commerce** → Use ProductsTool.ts + BasketTool.ts
- **Booking System** → Modify CustomDataTool.ts
- **CRM** → Create customer management tools

**Time:** 1-2 hours  
**Best for:** Goal-oriented builders

---

### Option C: Follow Complete Tutorial

Read **README.md** in this directory for:
- Detailed tool explanations
- Customization recipes
- Multi-skill projects
- Best practices

**Time:** 30 minutes reading, 1 hour building  
**Best for:** Thorough learners

---

## 🎯 Common First Tasks

### Remove Unused Tools

```bash
# Delete what you don't need
rm src/tools/BasketTool.ts
rm src/tools/OrderTool.ts

# Update src/index.ts to remove imports
```

---

### Add Your Own Tool

1. **Create** `src/tools/MyTool.ts`:
```typescript
import { LuaTool } from "lua-cli";
import { z } from "zod";

export default class MyTool implements LuaTool {
  name = "my_tool";
  description = "What it does";
  inputSchema = z.object({ param: z.string() });

  async execute(input: any) {
    return { result: "Hello " + input.param };
  }
}
```

2. **Add to** `src/index.ts`:
```typescript
import MyTool from "./tools/MyTool";

const skill = new LuaSkill({
  tools: [new MyTool()]
});
```

3. **Test:**
```bash
lua test
# Select "my_tool" → Enter param → See result
```

---

### Use External API

Example: Call a REST API

```typescript
async execute(input: any) {
  const response = await fetch('https://api.example.com/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  
  const data = await response.json();
  return data;
}
```

---

### Store Data

Example: Save user preferences

```typescript
import { Data } from "lua-cli";

async execute(input: any) {
  // Create
  await Data.create('preferences', {
    theme: input.theme,
    language: input.language
  });
  
  // Later: Get
  const prefs = await Data.get('preferences');
  
  return prefs;
}
```

---

## 🎨 Template Features

### 30+ Working Examples

Every common pattern is demonstrated:
- ✅ External API calls
- ✅ Platform API usage
- ✅ Vector search
- ✅ CRUD operations
- ✅ Multi-step workflows
- ✅ Error handling
- ✅ Input validation

### All Platform APIs

- ✅ User - User data management
- ✅ Data - Custom data with search
- ✅ Products - Product catalog
- ✅ Baskets - Shopping carts
- ✅ Orders - Order processing

### Production Ready

- ✅ TypeScript configured
- ✅ Type-safe
- ✅ Error handling
- ✅ Validation
- ✅ Ready to deploy

---

## 🚨 Need Help?

### Quick Answers

**"How do I test?"**
```bash
lua test  # Interactive testing
```

**"How do I see it work?"**
```bash
lua dev  # Chat interface at http://localhost:3000
```

**"How do I deploy?"**
```bash
lua push    # Upload
lua deploy  # Go live
```

**"Which tool should I start with?"**
- Simple: `CreatePostTool.ts`
- External API: `GetWeatherTool.ts`
- Platform API: `UserDataTool.ts`
- Complex: `BasketTool.ts`

---

### Documentation

- **README.md** (this directory) - Complete project guide
- **TOOL_EXAMPLES.md** - Detailed tool explanations
- **../API_REFERENCE.md** - Full API docs
- **../CLI_REFERENCE.md** - All commands
- **../GETTING_STARTED.md** - Complete tutorial

---

## ✨ Pro Tips

1. **Start with `lua dev`** - See everything in action
2. **Copy, don't write from scratch** - Modify examples
3. **Test often** - `lua test` after every change
4. **Read the code** - Examples are well-commented
5. **Ask the AI** - Use dev mode to test edge cases

---

## 🎯 5-Minute Challenge

**Can you:**
1. Run `lua dev`
2. Chat: "What's the weather in your city?"
3. Edit `GetWeatherTool.ts` to add a fun fact about the city
4. Save and see it auto-reload
5. Chat again and see your change

**If yes, you're ready to build!** 🚀

---

**For more details, see README.md in this directory**

