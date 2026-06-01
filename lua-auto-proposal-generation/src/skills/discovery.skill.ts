import { LuaSkill } from 'lua-cli';
import { CreateClientProfileTool } from './tools/CreateClientProfileTool.js';
import { SearchClientsTool } from './tools/SearchClientsTool.js';
import { GetClientProfileTool } from './tools/GetClientProfileTool.js';
import { UpdateClientProfileTool } from './tools/UpdateClientProfileTool.js';

export const discoverySkill = new LuaSkill({
  name: 'client-discovery-skill',
  description: 'Client intake and discovery — capture, search, retrieve, and update client profiles.',
  context: `Use these tools during the client discovery phase:

- Use create_client_profile when the user provides new client information (company name, industry, contacts, pain points). Always ask for key details before creating: company name, industry, contact info, and at least one pain point.
- Use search_clients to check if a client already exists before creating a new profile. Also use it to find clients by industry or pain points.
- Use get_client_profile to retrieve full details of a specific client by their ID.
- Use update_client_profile to modify existing client information — add contacts, update pain points, budget, timeline, or notes.

Discovery workflow:
1. Ask the user about the prospective client
2. Search for existing clients first to avoid duplicates
3. Gather: company name, industry, size, primary contact, pain points, budget range, and timeline
4. Create the client profile once you have sufficient information
5. Confirm the profile was created and suggest next steps (scope of work)`,
  tools: [
    new CreateClientProfileTool(),
    new SearchClientsTool(),
    new GetClientProfileTool(),
    new UpdateClientProfileTool(),
  ],
});
