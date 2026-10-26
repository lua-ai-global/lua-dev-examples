import { defineBrowser } from 'lua-cli';

export const research = defineBrowser({
  name: 'research',
  description: 'Reads public demo pages and nothing else: no writes, no files, no page scripts',
  engine: 'agent-browser',
  fallback: 'none',
  allowedDomains: ['books.toscrape.com', 'quotes.toscrape.com', 'example.com'],
  maxSessionMinutes: 5,
  idleTimeoutSeconds: 60,
  maxConcurrentSessions: 2,
  logContent: 'summary',
});
