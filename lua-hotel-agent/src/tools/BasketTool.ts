import { LuaTool, Baskets } from "lua-cli";
import { z } from "zod";
import { BasketStatus } from 'lua-cli';
import { v4 as uuidv4 } from 'uuid';


export class CreateBasketTool implements LuaTool {
    name = "create_basket";
    description = "Create a new basket";
    inputSchema = z.object({
        basket: z.object({
            currency: z.string()
        })
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        return Baskets.create(input.basket);
    }
}

export class GetBasketsTool implements LuaTool {
    name = "get_baskets";
    description = "Get all baskets";
    inputSchema = z.object({
        status: z.enum(['active', 'checked_out', 'abandoned', 'expired']).optional()
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        const baskets = await Baskets.get(input.status as BasketStatus);
        return {
            baskets: baskets
        };
    }
}

export class AddItemToBasketTool implements LuaTool {
    name = "add_item_to_basket";
    description = "Add an item to a basket";
    inputSchema = z.object({
        basketId: z.string(),
        item: z.object({
            id: z.string(),
            price: z.number(),
            quantity: z.number()
        })
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        //Get user basket
        const userBasket = await Baskets.getById(input.basketId);
        return userBasket.addItem(input.item);
    }
}

export class RemoveItemFromBasketTool implements LuaTool {
    name = "remove_item_from_basket";
    description = "Remove an item from a basket";
    inputSchema = z.object({
        basketId: z.string(),
        itemId: z.string()
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        const userBasket = await Baskets.getById(input.basketId);
        return userBasket.removeItem(input.itemId);
    }
}

export class ClearBasketTool implements LuaTool {
    name = "clear_basket";
    description = "Clear a basket";
    inputSchema = z.object({
        basketId: z.string()
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        const userBasket = await Baskets.getById(input.basketId);
        return userBasket.clear();
    }
}

export class UpdateBasketStatusTool implements LuaTool {
    name = "update_basket_status";
    description = "Update the status of a basket";
    inputSchema = z.object({
        basketId: z.string(),
        status: z.enum(['active', 'checked_out', 'abandoned', 'expired'])
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        const userBasket = await Baskets.getById(input.basketId);
        return userBasket.updateStatus(input.status as BasketStatus);
    }
}

//update basket metadata
export class UpdateBasketMetadataTool implements LuaTool {
    name = "update_basket_metadata";
    description = "Update the metadata of a basket";
    inputSchema = z.object({
        basketId: z.string(),
        metadata: z.object({
            key: z.string(),
            value: z.string()
        })
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        const userBasket = await Baskets.getById(input.basketId);
        return userBasket.updateMetadata(input.metadata);
    }
}

//check out basket
export class CheckoutBasketTool implements LuaTool {
    name = "checkout_basket";
    description = "Check out a basket";
    inputSchema = z.object({
        basketId: z.string()
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        const userBasket = await Baskets.getById(input.basketId);
        return userBasket.placeOrder({});
    }
}

//get basket by id
export class GetBasketByIdTool implements LuaTool {
    name = "get_basket_by_id";
    description = "Get a basket by id";
    inputSchema = z.object({
        basketId: z.string()
    });
    async execute(input: z.infer<typeof this.inputSchema>) {
        return Baskets.getById(input.basketId);
    }
}
