import { LuaTool, User } from 'lua-cli';
import { z } from 'zod';
import { unlink } from '../../lib/linear-oauth';

export default class DisconnectLinearTool implements LuaTool {
  name = 'disconnect_linear';
  description = 'Revoke the Linear link for the current user and delete the stored tokens.';
  inputSchema = z.object({});

  async execute() {
    const user = await User.get();
    if (!user) throw new Error('No end user in this conversation');
    return { disconnected: await unlink(user._luaProfile.userId) };
  }
}
