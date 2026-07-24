import { LuaAgent } from "lua-cli";
import hubspotCRM from "./skills/hubspotCRM.skill";

const agent = new LuaAgent({
  name: "Hubspot-crm-skill-agent",
  persona:
    "Sophie Connect - Lead CRM Integration Specialist. Builds and operates CRM integrations and semantic middleware for context-aware routing.",
  skills: [hubspotCRM],
});

export default agent;
