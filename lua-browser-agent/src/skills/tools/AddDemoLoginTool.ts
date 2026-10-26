import { LuaTool, Secrets } from 'lua-cli';
import { z } from 'zod';
import { codeOf, explain } from '../../lib/browser';

export const DEMO_LOGIN = 'internet-demo';

export default class AddDemoLoginTool implements LuaTool {
  name = 'add_demo_login';
  description =
    'Send the user a one-time link to save their login for the-internet.herokuapp.com. Use it when they ask to sign the browser in, or when read_as_me says there is no saved login.';

  inputSchema = z.object({});

  async execute() {
    try {
      const receipt = await Secrets.request({
        kind: 'browser-login',
        name: DEMO_LOGIN,
        origins: ['the-internet.herokuapp.com'],
        loginUrl: 'https://the-internet.herokuapp.com/login',
        access: 'read',
        reason: 'Read the page behind the demo sign-in as you',
      });

      return {
        ok: true,
        login: receipt.name,
        state: receipt.state,
        sent: receipt.delivery?.delivered === true,
        notSentBecause: receipt.delivery?.reason,
        reused: receipt.reused === true,
        reason:
          'The link works once and stops working after 15 minutes. The user types the username and password on the Lua page, never here.',
      };
    } catch (error) {
      const code = codeOf(error);
      return {
        ok: false,
        code,
        reason: explain(code) ?? 'The login request was refused.',
      };
    }
  }
}
