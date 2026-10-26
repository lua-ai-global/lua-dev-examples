import { Browser, LuaTool } from 'lua-cli';
import { z } from 'zod';
import { explain, thrown } from '../../lib/browser';
import { DEMO_LOGIN } from './AddDemoLoginTool';

const SECURE_AREA = 'https://the-internet.herokuapp.com/secure';

const MESSAGE_SCHEMA = {
  type: 'object',
  properties: { message: { type: 'string' } },
  required: ['message'],
};

export default class ReadAsMeTool implements LuaTool {
  name = 'read_as_me';
  description =
    'Read the page behind the demo sign-in as the user, with the login they saved. Use it when they ask what the signed-in page says.';

  inputSchema = z.object({
    task: z
      .string()
      .min(1)
      .max(500)
      .default('Report the message at the top of the secure area, word for word.')
      .describe('What to read once the browser is signed in'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    let run;
    try {
      run = await Browser.execute({
        task: input.task,
        startUrl: SECURE_AREA,
        credentials: [DEMO_LOGIN],
        maxSteps: 6,
        maxCostUsd: 0.2,
        schema: MESSAGE_SCHEMA,
      });
    } catch (error) {
      return thrown(error);
    }

    if (run.status === 'completed' && run.stopReason === 'done') {
      const output = run.output as { message?: string } | null;
      return { ok: true, message: output?.message ?? run.output, steps: run.steps, costUsd: run.costUsd };
    }

    if (run.stopReason === 'needs_verification') {
      return {
        ok: false,
        waitingForUser: true,
        reason:
          'The site asked for a verification code. A private link is on its way to the user, and the run waits until they finish there. Say so and stop; never ask for the code here.',
      };
    }

    if (run.code === 'browser_login_not_found') {
      return {
        ok: false,
        code: run.code,
        reason: 'There is no saved login yet. Offer to send the link with add_demo_login.',
      };
    }

    return {
      ok: false,
      stopReason: run.stopReason,
      code: run.code,
      error: run.error,
      reason: explain(run.code) ?? 'The signed-in read did not finish. Do not try the sign-in again.',
    };
  }
}
