import { PreProcessor, Data } from "lua-cli";
import { getDiscordContext } from "../utils/discord-context";

/**
 * Analytics PreProcessor
 * 
 * Captures every interaction with full Discord context.
 * Discord info is passed via envOverride from bot.ts as DISCORD_CONTEXT JSON.
 * 
 * Also saves the Discord user ID to the user profile for future use
 * by tools like SetReminderTool.
 * 
 * Tracks:
 * - Discord context (channel, user, guild)
 * - Timestamp and usage patterns
 * - Detected lua-cli topics
 * 
 * Use cases:
 * - Most active channels
 * - Most active users  
 * - Peak usage hours
 * - Popular topics
 */
const analyticsPreProcessor = new PreProcessor({
  name: "analytics",
  description: "Captures interaction data and syncs Discord ID to user profile",
  priority: 10, // Run after rate limiter
  execute: async (userInstance, messages, channel) => {
    const latestMessage = messages.find((msg) => msg.type === "text");
    const messageText = latestMessage?.type === "text" ? latestMessage.text : "";

    // Get Discord context from envOverride
    const ctx = getDiscordContext();
    if (!ctx) {
      return { action: "proceed" };
    }

    // Save Discord ID to user profile if not already set
    // This allows tools like SetReminderTool to access it later via User API
    if (ctx.authorId && !userInstance.discordId) {
      try {
        const result = await userInstance.update({ discordId: ctx.authorId, discordTag: ctx.authorTag });
        console.log("[Analytics] Discord ID saved to user:", result);
      } catch (error) {
        console.log("[Analytics] Failed to save Discord ID to user:", error);
      }
    }

    // Detect lua-cli topics mentioned
    const topicPatterns: Record<string, RegExp> = {
      tools: /\b(tool|tools|LuaTool)\b/i,
      skills: /\b(skill|skills|LuaSkill)\b/i,
      webhooks: /\b(webhook|webhooks)\b/i,
      jobs: /\b(job|jobs|cron|schedule|reminder)\b/i,
      preprocessors: /\b(preprocessor|preprocess)\b/i,
      postprocessors: /\b(postprocessor|postprocess)\b/i,
      data_api: /\b(data api|Data\.|vector|search|collection)\b/i,
      user_api: /\b(user api|User\.|profile)\b/i,
      mcp: /\b(mcp|MCP)\b/i,
      deploy: /\b(deploy|push|compile)\b/i,
      error: /\b(error|bug|issue|broken|not working)\b/i,
    };

    const detectedTopics: string[] = [];
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(messageText)) {
        detectedTopics.push(topic);
      }
    }

    // Build analytics record
    const now = new Date();
    const analyticsRecord = {
      // Timestamps
      timestamp: now.toISOString(),
      date: now.toISOString().split("T")[0],
      hour: now.getHours(),
      dayOfWeek: now.getDay(),

      // Discord context
      discordChannelId: ctx.channelId,
      discordChannelName: ctx.channelName,
      discordChannelType: ctx.channelType,
      discordGuildId: ctx.guildId,
      discordAuthorId: ctx.authorId,
      discordAuthorTag: ctx.authorTag,
      discordIsThread: ctx.isThread,
      discordTrigger: ctx.trigger,

      // Message characteristics
      messageLength: messageText.length,
      hasQuestion: messageText.includes("?"),
      hasCodeBlock: messageText.includes("```"),

      // Topics
      detectedTopics,
      topicCount: detectedTopics.length,
    };

    // Save to analytics collection
    try {
      const searchText = `${analyticsRecord.date} ${ctx.channelName} ${ctx.authorTag} ${detectedTopics.join(" ")}`;
      await Data.create("analytics", analyticsRecord, searchText);
    } catch (error) {
      console.log("[Analytics] Failed to save:", error);
    }

    // Always proceed - analytics never blocks
    return { action: "proceed" };
  },
});

export default analyticsPreProcessor;
