import { LuaTool, Data } from "lua-cli";
import { z } from "zod";
import { getDiscordContext } from "../utils/discord-context";

/**
 * Save a resolved forum post to the knowledge base.
 * Uses the Data API with vector indexing for semantic search.
 * 
 * Only available when a forum thread is marked as resolved.
 */
export default class SavePostTool implements LuaTool {
  name = "save_post";
  description =
    "Save a resolved forum post (question + solution) to the community knowledge base for future reference";

  inputSchema = z.object({
    title: z.string().describe("Brief title describing the issue/question"),
    question: z.string().describe("The original question or problem"),
    solution: z.string().describe("The solution or answer that resolved it"),
    tags: z
      .array(z.string())
      .optional()
      .describe("Optional tags like 'webhooks', 'tools', 'deployment'"),
  });

  /**
   * Only enable this tool when processing a resolved forum thread.
   * Prevents users from randomly saving posts via DMs or mentions.
   */
  condition = async () => {
    const ctx = getDiscordContext();
    return ctx?.trigger === "forum_resolved";
  };

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Create searchable text combining all relevant content
    const searchText = [
      input.title,
      input.question,
      input.solution,
      ...(input.tags || []),
    ].join(" ");

    const post = await Data.create(
      "resolved-posts",
      {
        title: input.title,
        question: input.question,
        solution: input.solution,
        tags: input.tags || [],
        savedAt: new Date().toISOString(),
      },
      searchText
    );

    return {
      success: true,
      postId: post.id,
      message: `Saved "${input.title}" to the knowledge base. This will help others with similar questions!`,
    };
  }
}

