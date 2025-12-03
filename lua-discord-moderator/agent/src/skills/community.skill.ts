import { LuaSkill } from "lua-cli";
import SavePostTool from "../tools/SavePostTool";
import SearchPostsTool from "../tools/SearchPostsTool";
import SetReminderTool from "../tools/SetReminderTool";
import MarkResolvedTool from "../tools/MarkResolvedTool";

const communitySkill = new LuaSkill({
  name: "community-skill",
  description: "Community assistance tools for the Lua Discord server",
  context: `## Tool Usage

### search_posts
Search the knowledge base for similar questions.
- Use BEFORE answering lua-cli questions
- Use when you see [New Forum Post] - find similar issues
- If found: share solutions naturally ("I found a similar question...")
- If nothing found: just answer, don't mention the search

### save_post
Save resolved posts to help future users.
- ONLY available for [Forum Resolved] messages
- Extract the key question and solution
- Brief confirmation after saving

### mark_resolved
Mark a forum thread as resolved (adds "Resolved" tag).
- ONLY available in forum threads when @mentioned
- Use when user asks to mark their issue as resolved
- This will trigger automatic saving of the solution

### set_reminder
DM reminders for users.
- "remind me in 2h to push my changes"
- Supports: 30m, 2h, 1d, etc.

### SearchLuaCli (MCP)
Search official lua-cli documentation.
- Use for accurate, up-to-date information
- Combine with search_posts for best answers`,
  tools: [
    new SavePostTool(),
    new SearchPostsTool(),
    new SetReminderTool(),
    new MarkResolvedTool(),
  ],
});

export default communitySkill;
