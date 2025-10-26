import { LuaTool, Products } from "lua-cli";
import { z } from "zod";
import { BasketStatus, OrderStatus } from 'lua-cli';
import { v4 as uuidv4 } from 'uuid';
export class SearchProductsTool implements LuaTool {
    name = "search_products";
    description = "Search for products";
    inputSchema = z.object({
        query: z.string()
    });

    constructor() { }

    async execute(input: z.infer<typeof this.inputSchema>) {
        return await Products.search(input.query);
    }
}

export class GetAllProductsTool implements LuaTool {
    name = "get_all_products";
    description = "Get all products";
    inputSchema = z.object({
        page: z.number().optional(),
        limit: z.number().optional()
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        return await Products.get(input.limit, input.limit);
    }
}

export class CreateProductTool implements LuaTool {
    name = "create_product";
    description = "Create a new product";
    inputSchema = z.object({
        product: z.object({
            name: z.string(),
            description: z.string(),
            price: z.number()
        })
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        return Products.create({ ...input.product, id: uuidv4() });
    }
}

export class UpdateProductTool implements LuaTool {
    name = "update_product";
    description = "Update an existing product";
    inputSchema = z.object({
        product: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            price: z.number()
        })
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        return Products.update({ ...input.product }, input.product.id);
    }
}

export class GetProductByIdTool implements LuaTool {
    name = "get_product_by_id";
    description = "Get a product by its unique identifier";
    inputSchema = z.object({
        id: z.string()
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        return Products.getById(input.id);
    }
}

export class DeleteProductTool implements LuaTool {
    name = "delete_product";
    description = "Delete an existing product";
    inputSchema = z.object({
        id: z.string()
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        const product = await Products.getById(input.id);
        return product.delete();
    }
}


// export class CreateOrderTool implements LuaTool {
//     name = "create_order";
//     description = "Create a new order";
//     inputSchema = z.object({
//         order: z.object({
//             basketId: z.string(),
//             data: z.object({
//                 storeId: z.string(),
//             }).optional()
//         })
//     });
//     async execute(input: z.infer<typeof this.inputSchema>) {
//         return product.order.create(input.order as CreateOrderRequest);
//     }
// }

// export class UpdateOrderStatusTool implements LuaTool {
//     name = "update_order_status";
//     description = "Update the status of an order";
//     inputSchema = z.object({
//         orderId: z.string(),
//         status: z.enum(['pending', 'confirmed', 'fulfilled', 'cancelled'])
//     });
//     async execute(input: z.infer<typeof this.inputSchema>) {
//         return product.order.updateStatus(input.orderId, input.status as OrderStatus);
//     }
// }

// export class GetUserOrdersTool implements LuaTool {
//     name = "get_user_orders";
//     description = "Get all orders for a user";
//     inputSchema = z.object({
//         userId: z.string()
//     });
//     async execute(input: z.infer<typeof this.inputSchema>) {
//         return product.order.get(input.userId);
//     }
// }
