import { LuaTool } from 'lua-cli';
import { z } from 'zod';

interface FaqEntry {
  keywords: string[];
  answer: string;
}

const FAQ: Record<string, FaqEntry> = {
  'pet policy': {
    keywords: ['pet', 'pets', 'dog', 'cat', 'animal', 'breed', 'pet-friendly'],
    answer: 'Pet policies vary by property. Pet-friendly units require an additional pet deposit ($350-$750). Allowed pets: cats and dogs under 50 lbs. Breed restrictions apply for certain dog breeds. No exotic animals.',
  },
  'lease term': {
    keywords: ['lease', 'term', 'length', 'duration', 'how long', 'month-to-month', 'short-term'],
    answer: 'Standard lease terms are 12 months. We also offer 6-month leases at a 5% premium. Month-to-month is available after the initial lease period at a 10% premium.',
  },
  'security deposit': {
    keywords: ['deposit', 'security', 'refund', 'refundable', 'get back', 'return deposit'],
    answer: 'Security deposits are equal to one month\'s rent. Deposits are refundable within 30 days of move-out, minus any deductions for damages beyond normal wear and tear.',
  },
  'subletting': {
    keywords: ['sublet', 'subletting', 'sublease', 'someone else', 'transfer lease'],
    answer: 'Subletting requires written landlord approval. The subtenant must pass our standard application screening. A $200 subletting administrative fee applies.',
  },
  'breaking lease': {
    keywords: ['break', 'early', 'terminate', 'termination', 'cancel', 'leave early', 'move out early', 'penalty'],
    answer: 'Early lease termination requires 60 days written notice and a penalty of 2 months\' rent. If you find a qualified replacement tenant, the penalty is reduced to 1 month.',
  },
  'rent increase': {
    keywords: ['increase', 'raise', 'rent going up', 'renewal price', 'higher rent'],
    answer: 'Rent increases occur at lease renewal with 60 days notice. Increases are capped at 5% per year for renewing tenants. Market rate applies for new leases.',
  },
  'utilities': {
    keywords: ['utilities', 'electric', 'electricity', 'water', 'gas', 'internet', 'wifi', 'trash', 'included'],
    answer: 'Tenants are responsible for electricity and internet. Water, trash, and common area maintenance are included in rent. Gas (if applicable) varies by unit.',
  },
  'parking': {
    keywords: ['parking', 'car', 'garage', 'spot', 'guest parking', 'visitor parking'],
    answer: 'One parking spot is included for units that offer parking. Additional spots are $150/month subject to availability. Guest parking is free for up to 4 hours.',
  },
  'maintenance': {
    keywords: ['maintenance', 'repair', 'fix', 'broken', 'issue', 'emergency', 'plumber', 'plumbing', 'leak', 'faucet'],
    answer: 'Submit maintenance requests through our system. Emergency requests (flooding, no heat, safety hazards) get 1-2 hour response. Non-emergency requests are handled within 2-7 business days.',
  },
  'move in': {
    keywords: ['move in', 'moving', 'checklist', 'keys', 'first day', 'move-in', 'what to bring'],
    answer: 'Move-in requires first month\'s rent + security deposit. Keys are available after lease signing and payment processing (1-2 business days). Elevator booking required for buildings with elevators.',
  },
  'renters insurance': {
    keywords: ['insurance', 'renters insurance', 'renter', 'coverage', 'liability', 'required insurance'],
    answer: 'Renters insurance is required for all tenants. Minimum coverage: $100,000 liability, $30,000 personal property. Proof must be provided before move-in.',
  },
  'guest policy': {
    keywords: ['guest', 'guests', 'visitor', 'overnight', 'friend', 'family staying'],
    answer: 'Guests may stay up to 14 consecutive days. Longer stays require written notice to management. Overnight guests exceeding 3 nights per week may be considered occupants.',
  },
};

export class AskLeaseQuestionTool implements LuaTool {
  name = 'ask_lease_question';
  description = 'Answer common questions about lease terms, policies, and property rules. Covers: pet policy, lease terms, deposits, subletting, breaking lease, rent increases, utilities, parking, maintenance, move-in, renters insurance, guest policy.';

  inputSchema = z.object({
    question: z.string().describe('The tenant\'s question about lease terms or policies'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const query = input.question.toLowerCase();

      // Score each FAQ entry by keyword matches
      let bestMatch: { topic: string; answer: string } | null = null;
      let bestScore = 0;

      for (const [topic, entry] of Object.entries(FAQ)) {
        const score = entry.keywords.filter(kw => query.includes(kw)).length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { topic, answer: entry.answer };
        }
      }

      if (bestMatch && bestScore > 0) {
        return {
          success: true,
          topic: bestMatch.topic,
          answer: bestMatch.answer,
          relatedTopics: Object.keys(FAQ).filter(k => k !== bestMatch!.topic).slice(0, 3),
        };
      }

      return {
        success: true,
        answer: 'I don\'t have a specific FAQ entry for that question. Here are topics I can help with: ' + Object.keys(FAQ).join(', ') + '. You can also contact our leasing office at (555) 123-4567 for specific questions.',
        availableTopics: Object.keys(FAQ),
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
