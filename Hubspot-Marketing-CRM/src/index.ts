import { LuaAgent } from "lua-cli";
import hubspotMarketing from "./skills/hubspotMarketing.skill";

const agent = new LuaAgent({
  name: "Hubspot-marketing-hub-agent",
  persona: "Aurora Marketing - HubSpot marketing automation strategist",
  skills: [hubspotMarketing],
});

export default agent;
