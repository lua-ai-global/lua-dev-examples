import { LuaTool, User } from 'lua-cli';
import { z } from 'zod';
import { finishLink } from '../../lib/linear-oauth';

export default class FinishLinearConnectTool implements LuaTool {
  name = 'finish_linear_connect';
  description =
    'Finish linking Linear with the authorization code the user pasted after opening the connect link.';
  inputSchema = z.object({
    code: z.string().min(8).max(2048).describe('The authorization code, exactly as the user pasted it'),
    reference: z.string().optional().describe('The request reference from the code page, if the user gave it'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const user = await User.get();
    if (!user) throw new Error('No end user in this conversation');
    const { expiresAt } = await finishLink(user._luaProfile.userId, input.code.trim(), input.reference?.trim());
    // The tokens stay in storage; the model only learns that the link works.
    return { connected: true, tokenValidUntil: new Date(expiresAt).toISOString() };
  }
}
