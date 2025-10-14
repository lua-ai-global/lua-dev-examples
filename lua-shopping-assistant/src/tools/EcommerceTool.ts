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

