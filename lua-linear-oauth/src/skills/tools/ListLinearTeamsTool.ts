import { LuaTool, User } from 'lua-cli';
import { z } from 'zod';
import { getAccessToken, RelinkRequiredError } from '../../lib/linear-oauth';

export default class ListLinearTeamsTool implements LuaTool {
  name = 'list_linear_teams';
  description = "List the teams in the user's Linear workspace. Needs Linear to be linked first.";
  inputSchema = z.object({});

  async execute() {
    const user = await User.get();
    if (!user) throw new Error('No end user in this conversation');

    let token: string;
    try {
      token = await getAccessToken(user._luaProfile.userId);
    } catch (error) {
      if (error instanceof RelinkRequiredError) {
        return { needsRelink: true, message: 'Linear is not linked. Call connect_linear and send the user the link.' };
      }
      throw error;
    }

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ teams(first: 20) { nodes { id key name } } }' }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 401) {
      return { needsRelink: true, message: 'Linear refused the token. Call connect_linear and send the user the link.' };
    }
    if (!res.ok) throw new Error(`Linear answered ${res.status}`);

    const body = (await res.json()) as { data?: { teams: { nodes: { id: string; key: string; name: string }[] } } };
    return { teams: body.data?.teams.nodes ?? [] };
  }
}
