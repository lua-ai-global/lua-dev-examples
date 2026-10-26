import { defineBrowser } from 'lua-cli';

export const shop = defineBrowser({
  name: 'shop',
  description: 'Works a demo shop and holds anything that submits until a person approves it',
  engine: 'agent-browser',
  fallback: 'none',
  allowedDomains: ['books.toscrape.com', 'the-internet.herokuapp.com'],
  confirmActions: ['submit'],
  maxSessionMinutes: 10,
  idleTimeoutSeconds: 120,
  maxConcurrentSessions: 1,
  screenshots: 'always',
});
