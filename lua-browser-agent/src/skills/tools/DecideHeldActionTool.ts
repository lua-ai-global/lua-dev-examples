import { Browser, LuaTool } from 'lua-cli';
import { z } from 'zod';
import { explain, failedCommand, thrown } from '../../lib/browser';

export default class DecideHeldActionTool implements LuaTool {
  name = 'decide_held_action';
  description =
    'Approve or reject the action a browser run is holding. Use it only after the user has said yes or no in a later message, with the ids run_web_task returned.';

  inputSchema = z.object({
    confirmationId: z.string().min(1).describe('The confirmationId run_web_task returned'),
    sessionKey: z.string().min(1).describe('The sessionKey run_web_task returned'),
    browser: z.enum(['research', 'shop']).describe('The browser run_web_task returned'),
    decision: z.enum(['approve', 'reject']).describe('What the user said'),
    task: z
      .string()
      .max(2000)
      .optional()
      .describe('The rest of the task to carry on with after an approval, in plain words'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const session = { sessionKey: input.sessionKey, browser: input.browser };

    if (input.decision === 'reject') {
      const denied = await Browser.deny({ ...session, id: input.confirmationId });
      if (denied.error) return failedCommand('deny', denied);
      await Browser.close(session).catch(() => undefined);
      return { ok: true, decision: 'rejected', reason: 'Nothing was submitted and the session is closed.' };
    }

    const approved = await Browser.confirm({ ...session, id: input.confirmationId });
    if (approved.error) {
      return {
        ...failedCommand('confirm', approved),
        reason:
          explain(approved.code) ??
          'The held action could not be approved. A hold is dropped after 60 seconds, so the run has to start again.',
      };
    }

    if (!input.task) {
      return { ok: true, decision: 'approved', reason: 'The held action ran. The session is still open.' };
    }

    try {
      const run = await Browser.execute({
        task: input.task,
        sessionKey: input.sessionKey,
        browser: input.browser,
        maxSteps: 8,
        maxCostUsd: 0.25,
      });
      return {
        ok: run.status === 'completed',
        decision: 'approved',
        status: run.status,
        stopReason: run.stopReason,
        output: run.output,
        steps: run.steps,
        costUsd: run.costUsd,
        finalUrl: run.finalUrl,
      };
    } catch (error) {
      return { ...thrown(error), decision: 'approved' };
    }
  }
}
