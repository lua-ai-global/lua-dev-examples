import { LuaSkill } from 'lua-cli';
import { CreateScopeOfWorkTool } from './tools/CreateScopeOfWorkTool.js';
import { EstimatePricingTool } from './tools/EstimatePricingTool.js';
import { SearchScopesTool } from './tools/SearchScopesTool.js';
import { ListScopesTool } from './tools/ListScopesTool.js';
import { UpdateScopeOfWorkTool } from './tools/UpdateScopeOfWorkTool.js';

export const scopePricingSkill = new LuaSkill({
  name: 'scope-pricing-skill',
  description: 'Define project scope, deliverables, and calculate pricing across multiple models. Search, list, and update scopes.',
  context: `Use these tools after client discovery is complete:

- Use create_scope_of_work to define phases, deliverables, roles, and hour estimates. You MUST have a client ID first. Standard roles with auto-filled rates (case-insensitive): Junior Consultant ($125/hr), Consultant ($175/hr), Senior Consultant ($225/hr), Principal Consultant ($300/hr), Managing Director ($400/hr), Subject Matter Expert ($350/hr), Project Manager ($200/hr), Technical Architect ($275/hr), Data Analyst ($150/hr), UX Designer ($175/hr), Developer ($200/hr), Senior Developer ($250/hr), QA Engineer ($150/hr).
- Use search_scopes to find existing scopes by title, overview, or deliverable names using semantic search.
- Use list_scopes to list scopes with optional client filter and pagination.
- Use update_scope_of_work to modify an existing scope — update title, overview, add/remove items, or change assumptions and exclusions.
- Use estimate_pricing to calculate costs. Supports: fixed, time_and_materials, retainer, milestone, value_based pricing models. This is a pure calculator — it does not save anything.

Scoping workflow:
1. Understand what the client needs from their pain points and discovery notes
2. Search for existing scopes that might be reusable (search_scopes or list_scopes by client)
3. Break the engagement into logical phases (e.g., Discovery, Design, Implementation, Testing)
4. Define specific deliverables within each phase
5. Assign appropriate roles and estimate hours realistically
6. Create the scope of work (or update an existing one)
7. Run pricing estimates — try multiple models if appropriate
8. Present options to the user before generating the proposal`,
  tools: [
    new CreateScopeOfWorkTool(),
    new SearchScopesTool(),
    new ListScopesTool(),
    new UpdateScopeOfWorkTool(),
    new EstimatePricingTool(),
  ],
});
