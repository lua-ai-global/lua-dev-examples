"use strict";var a=Object.defineProperty;var i=Object.getOwnPropertyDescriptor;var r=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var u=(s,e)=>{for(var o in e)a(s,o,{get:e[o],enumerable:!0})},m=(s,e,o,t)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of r(e))!l.call(s,n)&&n!==o&&a(s,n,{get:()=>e[n],enumerable:!(t=i(e,n))||t.enumerable});return s};var d=s=>m(a({},"__esModule",{value:!0}),s);var f={};u(f,{default:()=>c});module.exports=d(f);var h={version:"2.0.0",kind:"skill",name:"community-skill",description:"Community assistance tools for the Lua Discord server",exportName:"communitySkill",context:`## Tool Usage

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
- Combine with search_posts for best answers`,tools:["SavePostTool","SearchPostsTool","SetReminderTool","MarkResolvedTool"]},c={__lua_primitive__:h};
