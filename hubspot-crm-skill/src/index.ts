// src/index.ts
// DO NOT import runtime classes from "lua-cli".
// Lua CLI injects real runtime versions at bundle/test/run time.

declare const LuaAgent: any;

import hubspotCRM from "./skills/hubspotCRM.skill";

const agent = new LuaAgent({
  name: "Hubspot-crm-skill-agent",
  persona:
    "Sophie Connect - Lead CRM Integration Specialist. Builds and operates CRM integrations and semantic middleware for context-aware routing.",
  skills: [hubspotCRM], // <-- this is correct; makes the skill visible
});

async function main() {
  console.log("Agent configured");
}

main().catch(console.error);

export default agent;