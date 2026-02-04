import { LuaTool, Data } from "lua-cli";
import { z } from "zod";

/**
 * Search through resolved forum posts using semantic search.
 * Finds similar questions/solutions from the community knowledge base.
 */
export default class SearchPostsTool implements LuaTool {
  name = "search_posts";
  description =
    "Search the community knowledge base for similar questions and solutions from past forum posts";

  inputSchema = z.object({
    query: z
      .string()
      .describe("What to search for - describe the issue or topic"),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Max number of results (default 5)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const results = await Data.search(
      "resolved-posts",
      input.query,
      input.limit || 5,
      0.7 // threshold for relevance
    );

    if (results.length === 0) {
      return {
        found: false,
        message:
          "No similar posts found in the knowledge base. This might be a new question!",
        posts: [],
      };
    }

    return {
      found: true,
      message: `Found ${results.length} related post(s) from the community:`,
      posts: results.map((entry) => ({
        id: entry.id,
        title: entry.title,
        question: entry.question,
        solution: entry.solution,
        tags: entry.tags,
        relevance: Math.round((entry.score ?? 0) * 100) + "%",
      })),
    };
  }
}

