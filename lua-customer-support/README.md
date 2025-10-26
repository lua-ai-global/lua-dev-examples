# Customer Support Agent

> Support automation with Zendesk API + Lua vector search

## Overview

AI-powered customer support that integrates with **Zendesk** for ticketing and **Lua Data API** for knowledge base search.

**What it does:**

* Search knowledge base with semantic search
* Create support tickets in Zendesk
* Check ticket status
* Answer common questions
* Escalate to human agents

**APIs used:** Zendesk API (external) + Lua Data API (vector search)

## Complete Implementation

### src/index.ts

```typescript
import { LuaAgent, LuaSkill, LuaWebhook, LuaJob, User, Data } from "lua-cli";
import {
  SearchKnowledgeBaseTool,
  CreateTicketTool,
  GetTicketStatusTool,
  UpdateTicketTool
} from "./tools/SupportTools";

// Support skill
const supportSkill = new LuaSkill({
  name: "customer-support",
  version: "1.0.0",
  description: "AI-powered customer support with ticketing and knowledge base",
  context: `
    This skill provides customer support.
    
    - search_knowledge_base: Use first to find answers in documentation
    - create_ticket: Create Zendesk ticket if knowledge base can't help
    - get_ticket_status: Check status of existing tickets
    - update_ticket: Add information to existing tickets
    
    Always search knowledge base before creating tickets.
    Be empathetic and professional.
    Escalate complex issues to human agents.
  `,
  tools: [
    new SearchKnowledgeBaseTool(),
    new CreateTicketTool(),
    new GetTicketStatusTool(),
    new UpdateTicketTool()
  ]
});

// Zendesk webhook for ticket updates
const zendeskWebhook = new LuaWebhook({
  name: 'zendesk-webhook',
  description: 'Handle Zendesk ticket update events',
  execute: async (event: any) => {
    if (event.type === 'ticket.solved') {
      const user = await User.get();
      await user.send([{
        type: 'text',
        text: `✅ Your support ticket #${event.data.id} has been resolved!`
      }]);
    }
    return { received: true };
  }
});

// Daily follow-up job for open tickets
const ticketFollowUpJob = new LuaJob({
  name: 'ticket-followup',
  description: 'Send follow-up messages for open tickets',
  schedule: {
    type: 'cron',
    pattern: '0 10 * * *'  // Daily at 10 AM
  },
  execute: async (job: any) => {
    const tickets = await Data.search('support_tickets', 'status:open', 50);
    const user = await job.user();
    
    if (tickets.count > 0) {
      await user.send([{
        type: 'text',
        text: `You have ${tickets.count} open support ticket(s). Need any updates?`
      }]);
    }
  }
});

// Configure agent (v3.0.0)
export const agent = new LuaAgent({
  name: "Alex",
  
  persona: `You are Alex, a customer support specialist.
  
Your role:
- Help customers find answers to their questions
- Search the knowledge base for solutions
- Create support tickets when needed
- Track and update existing tickets
- Provide empathetic and professional support

Communication style:
- Patient and empathetic
- Clear and professional
- Solution-oriented
- Reassuring and supportive

Workflow:
1. First, search the knowledge base for answers
2. If no solution found, offer to create a ticket
3. For existing tickets, help track status
4. For urgent issues, escalate to priority support

Best practices:
- Always search knowledge base first
- Gather all details before creating tickets
- Set realistic expectations for response times
- Thank customers for their patience
- Confirm resolution before closing

When to escalate:
- Billing disputes over $500
- Account security issues
- Legal or compliance matters
- VIP customer requests`,

  welcomeMessage: "Hi! I'm Alex from Customer Support. I'm here to help resolve any issues you're experiencing. What can I help you with today?",
  
  skills: [supportSkill],
  webhooks: [zendeskWebhook],
  jobs: [ticketFollowUpJob]
});
```

> **Note:** This demo now uses the **v3.0.0 pattern** with `LuaAgent`, including webhooks for Zendesk events and scheduled jobs for ticket follow-ups.

### src/tools/SupportTools.ts

```typescript
import { LuaTool, Data, env } from "lua-cli";
import { z } from "zod";

// 1. Search Knowledge Base (Lua Data with Vector Search)
export class SearchKnowledgeBaseTool implements LuaTool {
  name = "search_knowledge_base";
  description = "Search help articles and documentation";
  
  inputSchema = z.object({
    query: z.string().describe("User's question or search query")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Use Lua's vector search for semantic matching
    const results = await Data.search(
      'help_articles',
      input.query,
      5,
      0.7
    );
    
    if (results.count === 0) {
      return {
        articles: [],
        message: "No articles found. Would you like to create a support ticket?"
      };
    }
    
    return {
      articles: results.data.map(entry => ({
        id: entry.id,
        title: entry.data.title,
        content: entry.data.content.substring(0, 300) + '...',
        category: entry.data.category,
        relevance: `${Math.round(entry.score * 100)}% match`,
        url: entry.data.url
      })),
      count: results.count,
      message: `Found ${results.count} helpful articles`
    };
  }
}

// 2. Create Zendesk Ticket (External API)
export class CreateTicketTool implements LuaTool {
  name = "create_ticket";
  description = "Create a support ticket in Zendesk";
  
  inputSchema = z.object({
    subject: z.string().describe("Ticket subject/summary"),
    description: z.string().describe("Detailed description of the issue"),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    customerEmail: z.string().email().describe("Customer's email address"),
    customerName: z.string().describe("Customer's name")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const zendeskKey = env('ZENDESK_API_KEY');
    const zendeskSubdomain = env('ZENDESK_SUBDOMAIN');
    
    if (!zendeskKey || !zendeskSubdomain) {
      throw new Error('Zendesk API credentials not configured');
    }
    
    // Create ticket in Zendesk
    const response = await fetch(
      `https://${zendeskSubdomain}.zendesk.com/api/v2/tickets.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${input.customerEmail}/token:${zendeskKey}`).toString('base64')}`
        },
        body: JSON.stringify({
          ticket: {
            subject: input.subject,
            description: input.description,
            priority: input.priority,
            requester: {
              name: input.customerName,
              email: input.customerEmail
            },
            tags: ['ai_created', 'chat']
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create ticket: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Also log ticket in Lua Data for our records
    await Data.create('support_tickets', {
      zendeskId: data.ticket.id,
      subject: input.subject,
      customerEmail: input.customerEmail,
      priority: input.priority,
      createdAt: new Date().toISOString()
    }, `${input.subject} ${input.description}`);
    
    return {
      success: true,
      ticketId: data.ticket.id,
      ticketUrl: data.ticket.url,
      message: `Ticket #${data.ticket.id} created. We'll respond within 24 hours.`
    };
  }
}

// 3. Get Ticket Status (External API)
export class GetTicketStatusTool implements LuaTool {
  name = "get_ticket_status";
  description = "Check the status of a support ticket";
  
  inputSchema = z.object({
    ticketId: z.string().describe("Ticket ID")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const zendeskKey = env('ZENDESK_API_KEY');
    const zendeskSubdomain = env('ZENDESK_SUBDOMAIN');
    
    // Get ticket from Zendesk
    const response = await fetch(
      `https://${zendeskSubdomain}.zendesk.com/api/v2/tickets/${input.ticketId}.json`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${env('ZENDESK_EMAIL')}/token:${zendeskKey}`).toString('base64')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Ticket not found: ${input.ticketId}`);
    }
    
    const data = await response.json();
    const ticket = data.ticket;
    
    return {
      ticketId: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: new Date(ticket.created_at).toLocaleDateString(),
      updatedAt: new Date(ticket.updated_at).toLocaleDateString(),
      assignee: ticket.assignee_id ? 'Assigned to support agent' : 'Not yet assigned',
      message: this.getStatusMessage(ticket.status)
    };
  }
  
  private getStatusMessage(status: string): string {
    const messages = {
      new: "Your ticket is in queue and will be reviewed shortly",
      open: "Our team is currently working on your ticket",
      pending: "Waiting for your response",
      solved: "This ticket has been resolved",
      closed: "This ticket is closed"
    };
    return messages[status] || "Status unknown";
  }
}

// 4. Update Ticket (External API)
export class UpdateTicketTool implements LuaTool {
  name = "update_ticket";
  description = "Add a comment or update to an existing ticket";
  
  inputSchema = z.object({
    ticketId: z.string(),
    comment: z.string().describe("Additional information or update")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const zendeskKey = env('ZENDESK_API_KEY');
    const zendeskSubdomain = env('ZENDESK_SUBDOMAIN');
    
    // Add comment to ticket
    const response = await fetch(
      `https://${zendeskSubdomain}.zendesk.com/api/v2/tickets/${input.ticketId}.json`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${env('ZENDESK_EMAIL')}/token:${zendeskKey}`).toString('base64')}`
        },
        body: JSON.stringify({
          ticket: {
            comment: {
              body: input.comment,
              public: true,
              author_id: 'end-user'
            }
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to update ticket');
    }
    
    return {
      success: true,
      ticketId: input.ticketId,
      message: "Your comment has been added to the ticket"
    };
  }
}
```

## Environment Setup

```bash
# .env
ZENDESK_API_KEY=your_zendesk_api_key
ZENDESK_SUBDOMAIN=your_company
ZENDESK_EMAIL=support@yourcompany.com
```

## Seed Knowledge Base

```typescript
// src/seed.ts
import { Data } from "lua-cli";

const articles = [
  {
    title: "How to reset your password",
    content: "To reset your password: 1) Click 'Forgot Password' 2) Enter your email 3) Check your inbox for reset link 4) Create new password",
    category: "Account",
    url: "/help/reset-password"
  },
  {
    title: "Shipping and delivery times",
    content: "Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Free shipping on orders over $50.",
    category: "Shipping",
    url: "/help/shipping"
  },
  {
    title: "Return policy",
    content: "Returns accepted within 30 days of purchase. Items must be unused with original packaging. Refunds processed within 5-10 business days.",
    category: "Returns",
    url: "/help/returns"
  }
];

async function seedKnowledgeBase() {
  for (const article of articles) {
    const searchText = `${article.title} ${article.content} ${article.category}`;
    await Data.create('help_articles', article, searchText);
  }
  console.log('✅ Knowledge base seeded');
}

seedKnowledgeBase();
```

Run with:
```bash
npx ts-node src/seed.ts
```

## Testing

```bash
# Test individual tools
lua test

# Test conversation flow
lua chat
```

**Test conversation flow:**

1. "How do I reset my password?"
2. "What's your shipping policy?"
3. "I need help with my order - create a ticket"
4. "Check the status of ticket #12345"
5. "Add a comment to my ticket"

## Deployment

```bash
lua push
lua deploy
```

## Key Features

### External API Integration
Integrates with Zendesk ticketing system

### Vector Search
AI-powered knowledge base with semantic search

### Hybrid Approach
Combines self-service with human support

### Smart Escalation
Search first, create ticket only if needed

## Customization

### Add More Knowledge Base Articles

```typescript
const moreArticles = [
  {
    title: "How to update billing information",
    content: "Navigate to Settings > Billing > Update Payment Method...",
    category: "Billing",
    url: "/help/billing"
  }
];

for (const article of moreArticles) {
  await Data.create('help_articles', article, 
    `${article.title} ${article.content} ${article.category}`);
}
```

### Integrate with Other Ticketing Systems

Replace Zendesk API calls with your system's API:
- Jira Service Desk
- Freshdesk
- Help Scout
- Intercom

```typescript
// Example: Freshdesk integration
const response = await fetch(
  `https://yourdomain.freshdesk.com/api/v2/tickets`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(env('FRESHDESK_API_KEY') + ':X').toString('base64')}`
    },
    body: JSON.stringify({
      subject: input.subject,
      description: input.description,
      email: input.customerEmail,
      priority: 1,
      status: 2
    })
  }
);
```

## Project Structure

```
lua-customer-support/
├── src/
│   ├── index.ts              # Main skill definition
│   ├── seed.ts               # Seed knowledge base articles
│   └── tools/
│       └── SupportTools.ts   # All 4 support tools
├── lua.skill.yaml            # Configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── .env                      # Zendesk credentials
└── README.md                 # This file
```

## How Vector Search Works

The knowledge base uses **semantic search** to find relevant articles:

1. **Creating Articles:**
   ```typescript
   await Data.create('help_articles', 
     { title, content, category }, 
     searchableText  // This gets vectorized
   );
   ```

2. **Searching:**
   ```typescript
   const results = await Data.search(
     'help_articles',  // collection
     'password reset', // query (vectorized)
     5,                // max results
     0.7               // minimum similarity score
   );
   ```

3. **Results:** Articles are ranked by semantic similarity, not keyword matching. "Can't log in" will find password reset articles even without exact keywords!

## Documentation

For complete API reference and guides, visit [Lua Documentation](https://docs.heylua.ai/)
