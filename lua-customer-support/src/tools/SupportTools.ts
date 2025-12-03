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
    
    if (results.length === 0) {
      return {
        articles: [],
        message: "No articles found. Would you like to create a support ticket?"
      };
    }
    
    return {
      articles: results.map(entry => ({
        id: entry.id,
        title: entry.title,
        content: entry.content.substring(0, 300) + '...',
        category: entry.category,
        relevance: `${Math.round(entry.score * 100)}% match`,
        url: entry.url
      })),
      count: results.length,
      message: `Found ${results.length} helpful articles`
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