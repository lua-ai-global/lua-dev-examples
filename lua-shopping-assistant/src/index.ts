import { LuaSkill } from "lua-cli";
import {
  SearchProductsTool,
  GetProductDetailsTool,
  AddToCartTool,
  ViewCartTool,
  RemoveFromCartTool,
  CheckoutTool,
  TrackOrderTool
} from "./tools/EcommerceTool";

const ecommerceSkill = new LuaSkill({
  name: "ecommerce-assistant",
  version: "1.0.0",
  description: "AI shopping assistant for e-commerce websites",
  context: `
    This skill helps customers shop and complete purchases.
    
    Shopping Flow:
    - search_products: When users describe what they want to buy
    - get_product_details: When they want more info about a specific product
    - add_to_cart: When they decide to purchase something
    - view_cart: To review their shopping cart
    - remove_from_cart: To remove unwanted items
    - checkout: To complete the purchase
    - track_order: To check order status
    
    Guidelines:
    - Always confirm items and quantities before adding to cart
    - Show total price before checkout
    - Ask for shipping address during checkout
    - Be helpful with product recommendations
  `,
  tools: [
    new SearchProductsTool(),
    new GetProductDetailsTool(),
    new AddToCartTool(),
    new ViewCartTool(),
    new RemoveFromCartTool(),
    new CheckoutTool(),
    new TrackOrderTool()
  ]
});

// Test cases for e-commerce skill
const testCases = [
    { tool: "search_products", query: "laptop", maxPrice: 1500 },
    { tool: "search_products", query: "headphones" },
];

async function runTests() {
    console.log("🛍️  E-commerce Assistant - Running tests...\n");

    // Test search functionality
    for (const [index, testCase] of testCases.entries()) {
        try {
            console.log(`Test ${index + 1}: ${testCase.tool}`);
            const result = await ecommerceSkill.run(testCase);
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

