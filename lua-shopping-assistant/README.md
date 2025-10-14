# E-commerce Shopping Assistant

> Complete shopping experience using Lua Platform APIs

## Overview

A fully-featured e-commerce shopping assistant using **Lua Platform APIs** for products, shopping cart, and order management.

**What it does:**

* Search and browse products
* Add items to cart
* Manage shopping basket
* Complete checkout
* Track orders

**APIs used:** Lua Platform APIs (Products, Baskets, Orders)

## Complete Implementation

### src/index.ts

```typescript
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
```

### src/tools/EcommerceTool.ts

```typescript
import { LuaTool, Products, Baskets, Orders } from "lua-cli";
import { z } from "zod";

// 1. Search Products
export class SearchProductsTool implements LuaTool {
  name = "search_products";
  description = "Search for products by name, category, or description";
  
  inputSchema = z.object({
    query: z.string().describe("Search query (e.g., 'laptop', 'running shoes')"),
    maxPrice: z.number().optional().describe("Maximum price filter")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const results = await Products.search(input.query);
    
    // Filter by max price if specified
    let products = results.data;
    if (input.maxPrice) {
      products = products.filter(p => p.price <= input.maxPrice);
    }
    
    return {
      products: products.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        price: `$${p.price.toFixed(2)}`,
        category: p.category,
        inStock: p.inStock,
        description: p.description?.substring(0, 100) + '...'
      })),
      total: products.length,
      showing: Math.min(products.length, 10)
    };
  }
}

// 2. Get Product Details
export class GetProductDetailsTool implements LuaTool {
  name = "get_product_details";
  description = "Get detailed information about a specific product";
  
  inputSchema = z.object({
    productId: z.string().describe("Product ID")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const product = await Products.getById(input.productId);
    
    if (!product) {
      throw new Error(`Product not found: ${input.productId}`);
    }
    
    return {
      id: product.id,
      name: product.name,
      price: `$${product.price.toFixed(2)}`,
      description: product.description,
      category: product.category,
      sku: product.sku,
      inStock: product.inStock,
      availability: product.inStock 
        ? "✅ In stock - Ships within 24 hours" 
        : "❌ Out of stock - Notify when available?"
    };
  }
}

// 3. Add to Cart
export class AddToCartTool implements LuaTool {
  name = "add_to_cart";
  description = "Add a product to the shopping cart";
  
  inputSchema = z.object({
    productId: z.string().describe("Product ID to add"),
    quantity: z.number().min(1).default(1).describe("Quantity to add"),
    basketId: z.string().optional().describe("Existing basket ID (creates new if not provided)")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Get product details
    const product = await Products.getById(input.productId);
    
    if (!product) {
      throw new Error(`Product not found: ${input.productId}`);
    }
    
    if (!product.inStock) {
      return {
        success: false,
        message: `Sorry, ${product.name} is currently out of stock`
      };
    }
    
    // Get or create basket
    let basket;
    if (input.basketId) {
      basket = await Baskets.getById(input.basketId);
    } else {
      basket = await Baskets.create({
        currency: 'USD',
        metadata: { source: 'ai_chat' }
      });
    }
    
    // Add item to basket
    const updated = await Baskets.addItem(basket.id, {
      id: input.productId,
      price: product.price,
      quantity: input.quantity,
      SKU: product.sku
    });
    
    return {
      success: true,
      basketId: updated.id,
      itemCount: updated.common.itemCount,
      subtotal: `$${updated.common.totalAmount.toFixed(2)}`,
      message: `Added ${input.quantity}x ${product.name} to your cart`
    };
  }
}

// 4. View Cart
export class ViewCartTool implements LuaTool {
  name = "view_cart";
  description = "View items in the shopping cart";
  
  inputSchema = z.object({
    basketId: z.string().describe("Basket ID")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const basket = await Baskets.getById(input.basketId);
    
    if (!basket) {
      throw new Error("Cart not found");
    }
    
    return {
      items: basket.common.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: `$${item.price.toFixed(2)}`,
        subtotal: `$${(item.price * item.quantity).toFixed(2)}`,
        sku: item.SKU
      })),
      itemCount: basket.common.itemCount,
      total: `$${basket.common.totalAmount.toFixed(2)}`,
      basketId: basket.id
    };
  }
}

// 5. Remove from Cart
export class RemoveFromCartTool implements LuaTool {
  name = "remove_from_cart";
  description = "Remove an item from the shopping cart";
  
  inputSchema = z.object({
    basketId: z.string(),
    itemId: z.string().describe("Item/Product ID to remove")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    await Baskets.removeItem(input.basketId, input.itemId);
    
    const updated = await Baskets.getById(input.basketId);
    
    return {
      success: true,
      itemCount: updated.common.itemCount,
      total: `$${updated.common.totalAmount.toFixed(2)}`,
      message: "Item removed from cart"
    };
  }
}

// 6. Checkout
export class CheckoutTool implements LuaTool {
  name = "checkout";
  description = "Complete purchase and create order";
  
  inputSchema = z.object({
    basketId: z.string(),
    shippingAddress: z.object({
      name: z.string(),
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string().default('USA')
    }),
    email: z.string().email(),
    paymentMethod: z.string().default('stripe')
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const basket = await Baskets.getById(input.basketId);
    
    if (basket.common.itemCount === 0) {
      return {
        success: false,
        message: "Cannot checkout with empty cart"
      };
    }
    
    // Create order
    const order = await Baskets.placeOrder({
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      customerEmail: input.email
    }, input.basketId);
    
    return {
      success: true,
      orderId: order.id,
      total: `$${basket.common.totalAmount.toFixed(2)}`,
      itemCount: basket.common.itemCount,
      estimatedDelivery: this.calculateDeliveryDate(),
      message: `Order confirmed! You'll receive a confirmation email at ${input.email}`
    };
  }
  
  private calculateDeliveryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 5); // 5 business days
    return date.toLocaleDateString();
  }
}

// 7. Track Order
export class TrackOrderTool implements LuaTool {
  name = "track_order";
  description = "Get order status and tracking information";
  
  inputSchema = z.object({
    orderId: z.string().describe("Order ID to track")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const order = await Orders.getById(input.orderId);
    
    if (!order) {
      throw new Error(`Order not found: ${input.orderId}`);
    }
    
    const statusMessages = {
      pending: "Your order is being processed",
      confirmed: "Order confirmed and being prepared for shipping",
      fulfilled: "Order delivered!",
      cancelled: "Order was cancelled"
    };
    
    return {
      orderId: order.id,
      status: order.common.status,
      statusMessage: statusMessages[order.common.status] || "Unknown status",
      total: `$${order.common.totalAmount.toFixed(2)}`,
      itemCount: order.common.itemCount,
      estimatedDelivery: order.data?.estimatedDelivery,
      trackingNumber: order.data?.trackingNumber
    };
  }
}
```

## Environment Setup

```bash
# .env (not needed - uses Platform APIs)
# No external API keys required
```

## Testing

```bash
# Test individual tools
lua test

# Test conversation flow
lua chat
```

**Test conversation flow in sandbox mode:**

1. "Search for laptops under $1000"
2. "Add the MacBook to my cart"
3. "Show me my cart"
4. "Checkout with shipping to 123 Main St, New York, NY 10001"
5. "Track my order"

## Deployment

```bash
lua push
lua deploy
```

## Key Features

### Platform APIs
Uses Lua's built-in e-commerce APIs

### Complete Flow
Search → Add → Checkout → Track

### No External Dependencies
Everything built-in

### Production Ready
Full error handling and validation

## Customization

### Add Recommendations

```typescript
async execute(input) {
  const product = await Products.getById(input.productId);
  
  // Find similar products
  const similar = await Products.search(product.category);
  const recommendations = similar.data
    .filter(p => p.id !== product.id)
    .slice(0, 3);
  
  return {
    product,
    recommendations
  };
}
```

### Add Discount Codes

```typescript
inputSchema = z.object({
  basketId: z.string(),
  discountCode: z.string().optional()
});

async execute(input) {
  const basket = await Baskets.getById(input.basketId);
  
  if (input.discountCode) {
    const discount = await validateDiscountCode(input.discountCode);
    await Baskets.updateMetadata(input.basketId, {
      discountCode: input.discountCode,
      discountAmount: basket.common.totalAmount * discount.percentage
    });
  }
}
```

## Project Structure

```
lua-shopping-assistant/
├── src/
│   ├── index.ts              # Main skill definition
│   ├── seed.ts               # Seed product data
│   └── tools/
│       └── EcommerceTool.ts  # All 7 e-commerce tools
├── lua.skill.yaml            # Configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

## Documentation

For complete API reference and guides, visit [Lua Documentation](https://docs.heylua.ai/)

