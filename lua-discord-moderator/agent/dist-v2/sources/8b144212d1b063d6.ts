import { env } from "lua-cli";

/**
 * Discord context passed from bot.ts via envOverride.
 */
export interface DiscordContext {
  channelId: string;
  channelName: string;
  channelType: string;
  guildId: string;
  authorId: string;
  authorTag: string;
  messageId: string;
  isThread: boolean;
  parentId?: string;
  trigger: string;
}

/**
 * Get the Discord context from the DISCORD_REQUEST_CONTEXT env variable.
 * Returns null if not available (e.g., not called from Discord).
 */
export function getDiscordContext(): DiscordContext | null {
  const contextJson = env("DISCORD_REQUEST_CONTEXT");
  console.log("DISCORD_REQUEST_CONTEXT:", contextJson);
  if (!contextJson) return null;
  
  try {
    return JSON.parse(contextJson) as DiscordContext;
  } catch {
    console.error("Failed to parse DISCORD_REQUEST_CONTEXT:", contextJson);
    return null;
  }
}

