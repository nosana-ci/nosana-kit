import { defineConfig } from 'vite';

// Port 3000 so the OAuth redirect + token exchange come from an origin the dev
// gateway's CORS allowlist already permits (http://localhost:3000).
export default defineConfig({
  // strictPort: the OAuth redirect is registered for :3000, so fail rather than
  // silently fall back to another port.
  server: { port: 3000, strictPort: true },
});
