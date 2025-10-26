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

