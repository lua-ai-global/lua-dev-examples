import { LuaTool, User } from 'lua-cli';
import { z } from 'zod';
import { startLink } from '../../lib/linear-oauth';

export default class ConnectLinearTool implements LuaTool {
  name = 'connect_linear';
  description =
    'Create the link the current user opens to authorize Linear. ' +
    'Use when they ask to connect Linear, or when another tool answers needsRelink.';
  inputSchema = z.object({});

  async execute() {
    const user = await User.get();
    if (!user) throw new Error('No end user in this conversation');
    const { url, reference } = await startLink(user._luaProfile.userId);
    return {
      url,
      reference,
      validForMinutes: 10,
      nextStep: 'Send the user the url. They approve in Linear, copy the code the page shows, and paste it here.',
    };
  }
}
