import { LuaTool, env } from "lua-cli";
import { z } from "zod";

export default class CreatePaymentLinkTool implements LuaTool {
    name = "create_payment_link";
    description = "Create a Stripe payment link for a one-time payment";
    inputSchema = z.object({
        amount: z.number().int().positive(), // in cents
        currency: z.string().default("usd")
    });
    outputSchema = z.object({
        url: z.string(),
        id: z.string(),
    });

    async execute(input: z.infer<typeof this.inputSchema>) {
        const apiKey = env("STRIPE_SECRET_KEY");
        if (!apiKey) {
            throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
        }

        // Create a one-time Checkout Session with dummy redirect URLs
        const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                mode: "payment",
                "line_items[0][price_data][currency]": input.currency,
                "line_items[0][price_data][product_data][name]": "One-time Payment",
                "line_items[0][price_data][unit_amount]": input.amount.toString(),
                "line_items[0][quantity]": "1",
                success_url: "https://example.com/success",
                cancel_url: "https://example.com/cancel",
            }),
        });

        if (!sessionRes.ok) {
            throw new Error(`Failed to create checkout session: ${await sessionRes.text()}`);
        }

        const session = await sessionRes.json();

        return {
            url: session.url,
            id: session.id,
        };
    }
}
