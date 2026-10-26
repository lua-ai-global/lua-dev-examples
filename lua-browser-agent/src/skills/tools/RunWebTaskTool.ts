import { Browser, LuaTool } from 'lua-cli';
import { z } from 'zod';
import { explain, thrown } from '../../lib/browser';

const ANSWER_SCHEMA = {
  type: 'object',
  properties: { answer: { type: 'string' } },
  required: ['answer'],
};

const STOPPED_BECAUSE: Record<string, string> = {
  max_steps: 'The run used every step it was allowed. Narrow the task, or ask for more steps.',
  cost_cap: 'The run reached its spending cap before it finished.',
  timeout: 'The run ran out of time.',
  repeated_action:
    'The browser tried the same action three times on a page that did not change. The page needs exact clicks, so browse_category is the better tool for it.',
  needs_verification:
    'The site asked for a verification code. A private link is on its way to the user, and the run waits until they finish there. Say so and stop.',
  invalid_action: 'The browser tried something the page does not support.',
  schema_mismatch: 'The answer did not come back in the shape the task asked for.',
  model_failed: 'The model driving the browser failed.',
  browser_error: 'The browser itself failed part way through the run.',
  cancelled: 'The run was cancelled.',
};

export default class RunWebTaskTool implements LuaTool {
  name = 'run_web_task';
  description =
    'Give the browser a task in plain words and let it work through the pages itself. Use it when the exact clicks are not known in advance.';

  inputSchema = z.object({
    task: z.string().min(1).max(2000).describe('What the browser should do, in plain words'),
    startUrl: z.string().url().describe('The page the run starts on'),
    browser: z
      .enum(['research', 'shop'])
      .default('research')
      .describe('research reads public pages; shop holds anything that submits until the user approves it'),
    maxSteps: z.number().int().min(1).max(20).default(8).describe('The most actions the run may take'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    let run;
    try {
      run = await Browser.execute({
        task: input.task,
        startUrl: input.startUrl,
        browser: input.browser,
        maxSteps: input.maxSteps,
        maxCostUsd: 0.25,
        schema: ANSWER_SCHEMA,
      });
    } catch (error) {
      return thrown(error);
    }

    const spent = { steps: run.steps, costUsd: run.costUsd, engine: run.engine, finalUrl: run.finalUrl };

    if (run.status === 'completed' && run.stopReason === 'done') {
      const output = run.output as { answer?: string } | null;
      return { ok: true, answer: output?.answer ?? run.output, ...spent };
    }

    if (run.stopReason === 'confirmation_required' && run.pendingAction) {
      return {
        ok: false,
        needsApproval: true,
        category: run.pendingAction.category,
        action: run.pendingAction.action,
        url: run.pendingAction.url,
        confirmationId: run.pendingAction.confirmationId,
        sessionKey: run.sessionKey,
        browser: input.browser,
        reason: run.pendingAction.confirmationId
          ? 'Tell the user exactly what is about to happen and ask them to approve it. Their next message can approve it with decide_held_action, and the held action is dropped after 60 seconds.'
          : 'The action could not be held, so nothing is waiting and nothing happened.',
        ...spent,
      };
    }

    if (run.code === 'BROWSER_BOT_WALL') {
      return {
        ok: false,
        botWall: true,
        reason: 'The site refused an automated browser, so the run never reached the page it wanted.',
        suggestion:
          'Read a public page instead, or run the task on a browser that has no allowedDomains and fallback: "browser-use", which retries the page on Browser-Use. The desktop browser of the user is a third way through.',
        ...spent,
      };
    }

    return {
      ok: false,
      stopReason: run.stopReason,
      code: run.code,
      error: run.error,
      detail: run.detail,
      reason: (run.stopReason && STOPPED_BECAUSE[run.stopReason]) ?? explain(run.code),
      ...spent,
    };
  }
}
