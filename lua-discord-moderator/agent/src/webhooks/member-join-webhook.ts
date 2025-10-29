import { env, LuaWebhook } from "lua-cli";
import { z } from "zod";
import DiscordService from "@/src/services/DiscordService";

const memberJoinWebhook = new LuaWebhook({
  name: "member-join-webhook",
  version: "1.0.0",
  description: "Triggered when a new member joins the Discord server.",
  context:
    "This webhook is triggered when a new member joins the Discord server. It sends a welcome message to the new member.",
  bodySchema: z.object({
    userId: z.string(),
    guildId: z.string(),
  }),
  execute: async (event) => {
    try {
      const welcomeMessage = `Welcome to the server! We're glad to have you.

Please take a moment to review our server rules in the #rules channel.

If you have any questions, feel free to ask in the #help channel. Enjoy your stay!`;

      const botToken = env("DISCORD_BOT_TOKEN");
      if (!botToken) {
        throw new Error(
          "DISCORD_BOT_TOKEN is not set in environment variables."
        );
      }

      const discordService = new DiscordService(botToken);
      await discordService.sendDm({
        userId: event.body.userId,
        message: welcomeMessage,
      });

      return {
        received: true,
        message: `Sent welcome DM to ${event.body.userId}`,
      };
    } catch (error: any) {
      console.error("Error in member-join-webhook:", error);
      return {
        received: false,
        error: error.message || "An unexpected error occurred.",
      };
    }
  },
});

export default memberJoinWebhook;
