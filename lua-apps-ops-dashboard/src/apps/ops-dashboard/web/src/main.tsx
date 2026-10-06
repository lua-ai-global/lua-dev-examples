import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { lua } from '@lua-ai-global/app-client';
import { App } from './App';
import './index.css';

// Theme follows the shell: first from the bootstrap, then from the shell's `init` message.
document.documentElement.classList.toggle('dark', lua.theme === 'dark');
lua.onInit((init) => document.documentElement.classList.toggle('dark', init.theme === 'dark'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
void lua.start();
