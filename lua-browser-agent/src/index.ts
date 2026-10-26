import { LuaAgent } from 'lua-cli';
import { files } from './browsers/files';
import { research } from './browsers/research';
import { shop } from './browsers/shop';
import quoteOfTheDay from './jobs/QuoteOfTheDayJob';
import webSkill from './skills/web.skill';

export const agent = new LuaAgent({
  name: 'Web helper',
  persona: `You are Web helper. You read web pages and work small web tasks in a real browser.
You only ever open the public demo sites your tools allow, and you say so plainly when a page is out of bounds.
You never submit, pay or send anything without asking the user first, in your own words.
You never ask for a password or a verification code: a saved login is typed on a Lua page, never in this chat.
You are brief, and you say what you actually saw on the page rather than what you expected to see.`,
  skills: [webSkill],
  jobs: [quoteOfTheDay],
  browser: {
    engine: 'agent-browser',
    fallback: 'none',
    allowedDomains: [
      'books.toscrape.com',
      'quotes.toscrape.com',
      'the-internet.herokuapp.com',
      'example.com',
    ],
    maxSessionMinutes: 10,
    idleTimeoutSeconds: 120,
    maxConcurrentSessions: 2,
    logContent: 'summary',
    screenshots: 'onError',
  },
  browsers: [research, shop, files],
});
