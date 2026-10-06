import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `lua push webapp` builds with this config and pins only what the Lua gateway
// needs on top of it (base '/', assets under assets/, the CSP nonce).
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
