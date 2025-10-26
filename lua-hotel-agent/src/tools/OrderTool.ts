import { LuaTool, Orders, } from "lua-cli";
import { z } from "zod";
import { OrderStatus } from 'lua-cli';



export class CreateOrderTool implements LuaTool {
    name = "create_order";
    description = "Create a new order";
    inputSchema = z.object({
        order: z.object({
            basketId: z.string(),
            data: z.object({
                storeId: z.string(),
            }).optional()
        })
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        return Orders.create(input.order);
    }
}

export class UpdateOrderStatusTool implements LuaTool {
    name = "update_order_status";
    description = "Update the status of an order";
    inputSchema = z.object({
        orderId: z.string(),
        status: z.enum(['pending', 'confirmed', 'fulfilled', 'cancelled'])
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        const order = await Orders.getById(input.orderId);
        return order.updateStatus(input.status as OrderStatus);
    }
}

export class GetUserOrdersTool implements LuaTool {
    name = "get_user_orders";
    description = "Get all orders for a user";
    inputSchema = z.object({});
    async execute(input: z.infer<typeof this.inputSchema>) {
        return Orders.get();
    }
}

export class GetOrderByIdTool implements LuaTool {
    name = "get_order_by_id";
    description = "Get an order by id";
    inputSchema = z.object({
        orderId: z.string()
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        return Orders.getById(input.orderId);
    }
}
