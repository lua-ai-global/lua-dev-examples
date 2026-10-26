import { defineBrowser } from 'lua-cli';

export const files = defineBrowser({
  name: 'files',
  description: 'Saves a page as a PDF and moves small files to and from one demo site',
  engine: 'agent-browser',
  fallback: 'none',
  allowedDomains: ['the-internet.herokuapp.com'],
  maxDownloadMb: 5,
  allowedMimeTypes: ['application/pdf', 'text/plain', 'image/png', 'image/jpeg'],
  maxSessionMinutes: 10,
  idleTimeoutSeconds: 120,
  maxConcurrentSessions: 1,
});
