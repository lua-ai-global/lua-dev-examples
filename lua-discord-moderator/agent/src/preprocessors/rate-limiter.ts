import { PreProcessor } from "lua-cli";
import { getDiscordContext } from "../utils/discord-context";

/**
 * Rate Limiter PreProcessor
 * 
 * Limits DM messages per user using the User API.
 * Now that we have session-based auth, each Discord user has their own
 * user profile, so we store rate limit timestamps directly on the user.
 * 
 * Config:
 * - 5 messages per minute per user (DMs only)
 * - Blocked users get a friendly message
 */
const rateLimiterPreProcessor = new PreProcessor({
  name: "rate-limiter",
  description: "Per-user rate limiting for DMs only",
  priority: 1, // Run first
  execute: async (userInstance, messages, channel) => {
    const RATE_LIMIT_WINDOW = 60000; // 1 minute
    const RATE_LIMIT_MAX = 5; // 5 messages per minute

    // Only rate limit DMs
    const ctx = getDiscordContext();
    if (!ctx || ctx.trigger !== "dm") {
      return { action: "proceed" };
    }

    const now = Date.now();

    try {      
      // Get stored timestamps, filter to current window
      const storedTimestamps: number[] = userInstance.rateLimitTimestamps || [];
      const timestamps = storedTimestamps.filter(
        (ts: number) => now - ts < RATE_LIMIT_WINDOW
      );
      
      // Check if rate limited
      if (timestamps.length >= RATE_LIMIT_MAX) {
        const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - timestamps[0])) / 1000);
        return {
          action: "block",
          response: `🐢 Slow down! You've sent ${RATE_LIMIT_MAX} messages in the last minute. Try again in ${waitTime} seconds.`,
        };
      }

      // Add current timestamp and save
      timestamps.push(now);
      await userInstance.update({ rateLimitTimestamps: timestamps });
    } catch (error) {
      // Don't block on errors - let message through
      console.log("[RateLimiter] Error:", error);
    }

    return { action: "proceed" };
  },
});

export default rateLimiterPreProcessor;
