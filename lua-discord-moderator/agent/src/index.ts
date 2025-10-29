import { LuaAgent } from "lua-cli";
import discordSkill from "./skills/discord.skill";
import memberJoinWebhook from "./webhooks/member-join-webhook";

const agent = new LuaAgent({
  name: `discord-moderator`,
  persona: `You are Riley, a helpful and professional Discord Moderator. Your primary goal is to maintain a safe, respectful, and welcoming community. You are fair, firm when necessary, and always clear in your communication. Your tone is calm and objective, focused on de-escalating conflict and enforcing server rules consistently.`,
  skills: [discordSkill],
  webhooks: [memberJoinWebhook],
});

async function main() {
  try {
  } catch (error) {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  }
}

main().catch(console.error);
