import {
  Data,
  DecisionError,
  Decisions,
  LuaAgent,
  LuaDecision,
  LuaSkill,
  LuaTool,
  LuaWebhook,
  PreProcessor,
} from 'lua-cli';
import type { DecisionAnswer } from 'lua-cli';
import { z } from 'zod';

const TEAMS = {
  billing: 'Charges, invoices, refunds and payment problems.',
  tech: 'Bugs, errors, login trouble and anything on the site that does not work.',
  sales: 'Prices, discounts, stock and help choosing a product.',
  legal: 'Contracts, data requests and complaints that mention a lawyer.',
};

const REFUND_FLOOR = 0.9;

type Routing = {
  team: string;
  refundOdds: number | null;
  urgent: boolean;
  needsPerson: boolean;
  refused: string[];
};

function route(answers: Partial<Record<string, DecisionAnswer>>): Routing {
  const { refund, team, frustration } = answers;
  const refused = Object.entries(answers)
    .filter(([, answer]) => answer?.type === 'refused')
    .map(([name]) => name);
  const refundOdds = refund?.type === 'odds' ? refund.odds : null;
  const confidentTeam = team?.type === 'choice' && !team.uncertain ? team.choice : null;
  const urgent = frustration?.type === 'score' && !frustration.uncertain && frustration.level === 'angry';
  const missing = [refund, team, frustration].some((answer) => answer === undefined);
  return {
    team: confidentTeam ?? 'general',
    refundOdds,
    urgent,
    needsPerson: confidentTeam === null || urgent || refused.length > 0 || missing,
    refused,
  };
}

function textOf(messages: { type: string; text?: string }[]): string {
  return messages
    .flatMap((message) => (message.type === 'text' && message.text ? [message.text] : []))
    .join('\n')
    .trim();
}

export const triage = new LuaDecision({
  name: 'triage',
  description: 'Route a customer message to the team that should handle it',
  questions: {
    refund: Decisions.odds('Is the customer asking for a refund?'),
    team: Decisions.choice('Which team should handle this message?', TEAMS),
    frustration: Decisions.score('How frustrated is the customer?', ['calm', 'annoyed', 'angry']),
  },
  minConfidence: 0.7,
});

class TriageMessageTool implements LuaTool {
  name = 'triage_message';
  description = 'Decide which team handles a customer message, whether it is a refund request and how upset the customer is';

  inputSchema = z.object({
    text: z.string().min(1).describe("The customer's message, word for word"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const result = await Decisions.ask({
        state: { message: input.text },
        questions: {
          refund: Decisions.odds('Is the customer asking for a refund?'),
          team: Decisions.choice('Which team should handle this message?', TEAMS),
          frustration: Decisions.score('How frustrated is the customer?', ['calm', 'annoyed', 'angry']),
        },
        minConfidence: 0.7,
      });
      return { ok: true, ...route(result.answers) };
    } catch (err) {
      if (!(err instanceof DecisionError)) throw err;
      console.error('triage_message failed', err.code, 'decisionId' in err ? err.decisionId : undefined);
      switch (err.code) {
        case 'decision_invalid':
          return { ok: false, reason: 'The message was empty or too long to read.' };
        case 'decision_timeout':
        case 'decision_unavailable':
          return { ok: false, reason: 'Routing is busy right now. Tell the customer a person will reply soon.', needsPerson: true };
        default:
          throw err;
      }
    }
  }
}

const supportSkill = new LuaSkill({
  name: 'shop-support',
  description: 'Routes customer messages for a small online shop',
  context: `
    Call triage_message with the customer's own words whenever they raise a new issue.
    Tell the customer which team will help, in plain words, never the raw result.
    When needsPerson is true, say a person from the shop will reply here soon.
    When urgent is true, apologise first and keep the reply short.
    When ok is false, use the reason it returns and do not guess a team.
  `,
  tools: [new TriageMessageTool()],
});

const inboundBody = z.object({ text: z.string().min(1) });

export const inboundMessage = new LuaWebhook({
  name: 'inbound-message',
  description: 'Takes a message from another channel and returns which team should handle it',
  bodySchema: inboundBody,
  enforceSchemas: true,
  execute: async (event) => {
    const { text } = inboundBody.parse(event.body);
    const result = await Decisions.run('triage', { message: text });
    return { decisionId: result.decisionId, provider: result.provider, ...route(result.answers) };
  },
});

export const refundGate = new PreProcessor({
  name: 'refund-gate',
  description: 'Hands clear refund requests to a person before the agent replies',
  priority: 10,
  execute: async (_user, messages, channel) => {
    const text = textOf(messages);
    if (!text) return { action: 'proceed' };
    try {
      const refund = await Decisions.ask({ message: text }, Decisions.odds('Is the customer asking for a refund?'));
      if (refund.type === 'refused') return { action: 'proceed', metadata: { refundOdds: null } };
      if (refund.odds >= REFUND_FLOOR) {
        await Data.create('refund_requests', { text, odds: refund.odds, channel, status: 'open' });
        return {
          action: 'block',
          response: 'Thanks for letting us know. A person from our billing team will look at your refund and reply here.',
          metadata: { refundOdds: refund.odds },
        };
      }
      return { action: 'proceed', metadata: { refundOdds: refund.odds } };
    } catch (err) {
      if (!(err instanceof DecisionError)) throw err;
      return { action: 'proceed', metadata: { refundOdds: null } };
    }
  },
});

export const agent = new LuaAgent({
  name: 'Sam',
  persona: `You are Sam, the support assistant for a small online shop.
You are warm, brief and honest.
You never promise a refund, a discount or a delivery date yourself.
You route each new issue with triage_message and tell the customer who will help.`,
  skills: [supportSkill],
  webhooks: [inboundMessage],
  preProcessors: [refundGate],
  decisions: [triage],
});
