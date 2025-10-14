import { LuaSkill } from "lua-cli";
import {
  SearchKnowledgeBaseTool,
  CreateTicketTool,
  GetTicketStatusTool,
  UpdateTicketTool
} from "./tools/SupportTools";

const customerSupportSkill = new LuaSkill({
  name: "customer-support-agent",
  version: "1.0.0",
  description: "AI customer support agent with knowledge base and ticketing",
  context: `
    This skill helps customers get support through:
    
    Support Flow:
    - search_knowledge_base: Search help articles first to find answers
    - create_ticket: Create a Zendesk ticket if the issue can't be resolved
    - get_ticket_status: Check status of existing tickets
    - update_ticket: Add comments or updates to tickets
    
    Guidelines:
    - Always search knowledge base first before creating tickets
    - Be empathetic and helpful
    - Collect necessary details before creating tickets
    - Provide clear ticket IDs when created
  `,
  tools: [
    new SearchKnowledgeBaseTool(),
    new CreateTicketTool(),
    new GetTicketStatusTool(),
    new UpdateTicketTool()
  ]
});

// Test cases for customer support skill
const testCases = [
    { tool: "search_knowledge_base", query: "How do I reset my password?" },
    { tool: "search_knowledge_base", query: "shipping policy" },
];

async function runTests() {
    console.log("🎧 Customer Support Agent - Running tests...\n");

    // Test search functionality
    for (const [index, testCase] of testCases.entries()) {
        try {
            console.log(`Test ${index + 1}: ${testCase.tool}`);
            const result = await customerSupportSkill.run(testCase);
            console.log("✅ Success:", JSON.stringify(result, null, 2));
        } catch (error: any) {
            console.log("❌ Error:", error.message);
        }
        console.log(""); // Empty line for readability
    }
}

async function main() {
    try {
        await runTests();
    } catch (error) {
        console.error("💥 Unexpected error:", error);
        process.exit(1);
    }
}

main().catch(console.error);

