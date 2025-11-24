![Lua Platform](https://mintcdn.com/luaglobal/NNnbZwzU4fGTYSKM/images/hero.png?w=1100&fit=max&auto=format&n=NNnbZwzU4fGTYSKM&q=85&s=531844b3f145203b48cffa965ae78504)

# Lua Platform Demo Examples

> Production-ready AI agent examples showcasing the Lua Platform capabilities

This repository contains **4 complete, production-ready demo applications** built with Lua CLI v3.0.0. Each demo showcases different platform features and real-world use cases.

---

## 🎯 What's Inside

### 1. 🛍️ [E-commerce Shopping Assistant](./lua-shopping-assistant)
**Agent:** Mira  
**Use Case:** Complete online shopping experience

**Features:**
- Product search and catalog browsing
- Shopping cart management
- Checkout and order processing
- Order tracking

**APIs Used:** Lua Platform APIs (Products, Baskets, Orders)

**Perfect for:** E-commerce stores, online retailers, product catalogs

[View Demo →](./lua-shopping-assistant)

---

### 2. 🎧 [Customer Support Agent](./lua-customer-support)
**Agent:** Alex  
**Use Case:** Automated customer support with ticketing

**Features:**
- Knowledge base search (vector similarity)
- Zendesk ticket creation and management
- Ticket status tracking
- **Webhooks** for real-time ticket updates
- **Scheduled jobs** for daily follow-ups

**APIs Used:** Zendesk API + Lua Data API (vector search)

**Perfect for:** Support teams, helpdesks, customer service automation

[View Demo →](./lua-customer-support)

---

### 3. 🏦 [Financial Services Onboarding](./lua-financial-services)
**Agent:** Financial Onboarding Specialist  
**Use Case:** KYC-compliant account opening

**Features:**
- Multi-step onboarding journey
- Identity verification (Stripe Identity)
- Document upload and verification
- Risk assessment and suitability scoring
- **Webhooks** for verification events
- **PreProcessors** for validation
- **PostProcessors** for compliance disclaimers

**APIs Used:** Stripe Identity API + Lua Data API

**Perfect for:** Banks, fintech, financial services, regulated industries

[View Demo →](./lua-financial-services)

---

### 4. 🏨 [Hotel Booking Agent](./lua-hotel-agent)
**Agent:** Hotel Concierge  
**Use Case:** Hotel reservations and guest services

**Features:**
- Room availability checking
- Reservation creation and management
- Booking modifications and cancellations
- Room service requests
- Confirmation code system

**APIs Used:** Lua Data API

**Perfect for:** Hotels, vacation rentals, hospitality services

[View Demo →](./lua-hotel-agent)

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Lua CLI globally
npm install -g lua-cli

# Or use npx
npx lua-cli --version
```

### Try a Demo

```bash
# 1. Navigate to any demo
cd lua-shopping-assistant

# 2. Install dependencies
npm install

# 3. Test tools interactively
lua test

# 4. Start development mode (chat interface)
lua dev

# 5. Push to server
lua push

# 6. Deploy to production
lua deploy
```

---

## 🆕 What's New in v3.0.0

All demos have been updated to use the **latest Lua CLI v3.0.0 patterns**:

### 1. **Unified Agent Configuration**
```typescript
export const agent = new LuaAgent({
  name: "agent-name",
  persona: `Detailed personality and behavior guidelines...`,
  skills: [mySkill],
  webhooks: [myWebhook],        // NEW in v3.0.0
  jobs: [myScheduledJob],        // NEW in v3.0.0
  preProcessors: [validator],    // NEW in v3.0.0
  postProcessors: [formatter]    // NEW in v3.0.0
});
```

### 2. **Webhooks** (Customer Support, Financial Services)
React to external events in real-time:
```typescript
const webhook = new LuaWebhook({
  name: 'zendesk-webhook',
  execute: async (event) => {
    // Handle external events
    await User.send([{ type: 'text', text: 'Event received!' }]);
  }
});
```

### 3. **Scheduled Jobs** (Customer Support)
Automate recurring tasks:
```typescript
const job = new LuaJob({
  name: 'daily-followup',
  schedule: { type: 'cron', pattern: '0 10 * * *' },
  execute: async (job) => {
    // Run daily at 10 AM
  }
});
```

### 4. **PreProcessors & PostProcessors** (Financial Services)
Process messages before/after AI handling:
```typescript
const preProcessor = new PreProcessor({
  execute: async (message, user) => {
    // Validate before processing
    return { block: false };
  }
});

const postProcessor = new PostProcessor({
  execute: async (response, user) => {
    // Add disclaimers, format output
    return { modifiedResponse: response + "\n\nDisclaimer..." };
  }
});
```

---

## 📚 Feature Comparison

| Feature | Shopping | Support | Financial | Hotel |
|---------|----------|---------|-----------|-------|
| **Platform APIs** | ✅ Products, Baskets, Orders | ✅ Data (vector) | ✅ Data | ✅ Data |
| **External APIs** | ❌ | ✅ Zendesk | ✅ Stripe Identity | ❌ |
| **Webhooks** | ❌ | ✅ Ticket updates | ✅ Verification | ❌ |
| **Scheduled Jobs** | ❌ | ✅ Daily follow-ups | ❌ | ❌ |
| **PreProcessors** | ❌ | ❌ | ✅ Validation | ❌ |
| **PostProcessors** | ❌ | ❌ | ✅ Disclaimers | ❌ |
| **Vector Search** | ❌ | ✅ Knowledge base | ❌ | ❌ |
| **Multi-Step Flow** | ✅ Cart → Checkout | ❌ | ✅ 7-step onboarding | ✅ Book → Confirm |
| **Complexity** | Basic | Intermediate | Advanced | Basic |

---

## 🛠️ Technology Stack

All demos use:
- **TypeScript** - Full type safety
- **Zod** - Schema validation
- **Lua CLI 3.0.1** - Latest version
- **Node.js** - Runtime environment

Additional integrations:
- **Zendesk API** (Customer Support)
- **Stripe Identity API** (Financial Services)
- **OpenAI** (Embeddings for vector search)
- **Pinecone** (Vector database)

---

## 📖 Learning Path

### Beginner: Start Here
1. **Hotel Booking Agent** - Simplest demo, basic CRUD operations
2. **Shopping Assistant** - Platform APIs, multi-tool workflows

### Intermediate: Level Up
3. **Customer Support** - External APIs, webhooks, scheduled jobs, vector search

### Advanced: Deep Dive
4. **Financial Services** - Complex multi-step flows, compliance, pre/post processors

---

## 🎨 Customization Guide

Each demo is designed to be easily customized:

### Use As-Is
Deploy directly for quick prototyping

### Modify for Your Domain
- Change tool descriptions
- Update data schemas
- Adjust persona and behavior
- Add/remove tools

### Mix and Match
Combine tools from different demos:
```typescript
import { SearchProductsTool } from '../lua-shopping-assistant/tools/EcommerceTool';
import { SearchKnowledgeBaseTool } from '../lua-customer-support/tools/SupportTools';

const hybridSkill = new LuaSkill({
  tools: [
    new SearchProductsTool(),
    new SearchKnowledgeBaseTool()
  ]
});
```

---

## 📁 Repository Structure

```
lua-dev-examples/
├── lua-shopping-assistant/       # E-commerce demo
│   ├── src/
│   │   ├── index.ts             # Agent configuration
│   │   └── tools/
│   │       └── EcommerceTool.ts # 7 shopping tools
│   ├── lua.skill.yaml
│   ├── package.json
│   └── README.md
│
├── lua-customer-support/         # Support automation demo
│   ├── src/
│   │   ├── index.ts             # Agent with webhooks & jobs
│   │   └── tools/
│   │       └── SupportTools.ts  # 4 support tools
│   ├── lua.skill.yaml
│   └── README.md
│
├── lua-financial-services/       # KYC onboarding demo
│   ├── src/
│   │   ├── index.ts             # Agent with pre/post processors
│   │   └── tools/
│   │       └── FinancialOnboardingTools.ts  # 7 onboarding tools
│   ├── lua.skill.yaml
│   └── README.md
│
├── lua-hotel-agent/              # Hotel booking demo
│   ├── src/
│   │   ├── index.ts             # Simple agent configuration
│   │   └── tools/
│   │       └── HotelTool.ts     # 5 hotel tools
│   ├── lua.skill.yaml
│   └── README.md
│
└── README.md                      # This file
```

---

## 🧪 Testing

Each demo includes comprehensive testing:

### Interactive Tool Testing
```bash
cd lua-shopping-assistant
lua test
```
Test each tool individually with interactive prompts.

### Chat Interface Testing
```bash
lua dev
```
Opens browser-based chat interface at `http://localhost:3000`

### Production Testing
```bash
lua push    # Deploy to staging
# Test in production environment
lua deploy  # Promote to production
```

---

## 🔐 Environment Variables

Some demos require API keys. Create a `.env` file:

### Customer Support
```bash
ZENDESK_API_KEY=your_zendesk_key
ZENDESK_SUBDOMAIN=your_company
ZENDESK_EMAIL=support@yourcompany.com
```

### Financial Services
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BANKING_API_KEY=your_banking_api_key
```

**Security Note:** Never commit `.env` files to version control. All demos include `.env` in `.gitignore`.

---

## 📊 Use Case Matrix

| Industry | Recommended Demo | Why |
|----------|-----------------|-----|
| **E-commerce** | Shopping Assistant | Product catalog, cart, checkout flow |
| **SaaS** | Customer Support | Knowledge base, ticketing, automation |
| **Banking** | Financial Services | KYC compliance, identity verification |
| **Hospitality** | Hotel Agent | Reservations, bookings, guest services |
| **Healthcare** | Financial Services | Patient onboarding, compliance |
| **Insurance** | Financial Services | Policy application, risk assessment |
| **Real Estate** | Hotel Agent | Property viewing, bookings |
| **Education** | Customer Support | Student support, FAQ automation |

---

## 🎯 Key Concepts Demonstrated

### 1. Platform APIs
- **Products API** - Catalog management
- **Baskets API** - Shopping cart operations
- **Orders API** - Order processing
- **Data API** - Custom data with vector search
- **User API** - User management

### 2. External Integrations
- **REST APIs** - Zendesk, Stripe Identity
- **Webhooks** - Real-time event handling
- **Authentication** - API key management
- **Error Handling** - Graceful degradation

### 3. Advanced Patterns
- **Multi-step workflows** - Guided journeys
- **State management** - Application tracking
- **Vector search** - Semantic similarity
- **Scheduled automation** - Cron jobs
- **Message processing** - Pre/post processors

### 4. Best Practices
- **Type safety** - Full TypeScript
- **Schema validation** - Zod schemas
- **Error handling** - Try/catch patterns
- **Security** - Environment variables
- **Documentation** - Comprehensive READMEs

---

## 💡 Tips & Best Practices

### 1. Start Simple
Begin with Hotel or Shopping demos, then progress to more complex ones.

### 2. Test Thoroughly
Use `lua test` and `lua dev` extensively before deploying.

### 3. Customize Gradually
Make small changes, test frequently, iterate.

### 4. Read the Code
All tools are well-commented and production-ready. Learn by reading!

### 5. Use Vector Search
For any searchable content (FAQs, docs, products), use `Data.search()`.

### 6. Handle Errors Gracefully
All demos show proper error handling patterns.

---

## 🚀 Deployment

### Development
```bash
lua dev          # Local development with hot reload
```

### Staging
```bash
lua push         # Deploy to staging environment
```

### Production
```bash
lua deploy       # Promote to production
```

### Monitoring
Check your Lua Platform dashboard for:
- Agent analytics
- Tool usage statistics
- Error logs
- User conversations

---

## 📚 Additional Resources

### Documentation
- [Lua Platform Docs](https://docs.heylua.ai)
- [API Reference](https://docs.heylua.ai/api)
- [CLI Guide](https://docs.heylua.ai/cli)

### Support
- GitHub Issues: Report bugs or request features
- Email: support@lua.ai
- Community: [Discord Server](https://discord.gg/lua)

### Video Tutorials
- Getting Started with Lua Platform
- Building Your First Agent
- Advanced Patterns & Best Practices

---

## 🤝 Contributing

Found a bug? Have an improvement? Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

All demos are provided as examples for learning and customization. Modify freely for your use case.

---

## 🎉 Get Started Now!

Choose a demo that matches your use case:

```bash
# E-commerce
cd lua-shopping-assistant && lua dev

# Customer Support
cd lua-customer-support && lua dev

# Financial Services
cd lua-financial-services && lua dev

# Hotel Booking
cd lua-hotel-agent && lua dev
```

**Build something amazing with Lua Platform! 🚀**

---

<p align="center">
  <strong>Questions?</strong> Check the individual demo READMEs or visit <a href="https://docs.heylua.ai">docs.heylua.ai</a>
</p>

