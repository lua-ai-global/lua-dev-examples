import { ZohoLeadTool } from './tools/ZohoLeadTool';
import { ZohoStatusTool } from './tools/ZohoStatusTool';
import { ZohoNoteTool } from './tools/ZohoNoteTool';

export interface LuaAgentConfig {
    persona: string;
}

export interface LuaSkillConfig {
    name: string;
    context: string;
    tools: any[];
}

export const agent: LuaAgentConfig = {
    persona: 'Senior CRM Strategist'
};

export const skill: LuaSkillConfig = {
    name: 'zoho-crm-connector',
    context: 'This skill connects to Zoho CRM to manage leads. It can fetch lead information, update lead statuses, and add notes to leads. Built with Lua v3 framework.',
    tools: [ZohoLeadTool, ZohoStatusTool, ZohoNoteTool]
};
