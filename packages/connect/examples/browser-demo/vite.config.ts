import { createLogger, defineConfig } from 'vite';

// The linked @nosana/kit deps ship dist sourcemaps that point at src files not
// included in their published build, so Vite logs a "Sourcemap … points to
// missing source files" warning per file. Harmless, but it floods dev output —
// filter just that message out.
const logger = createLogger();
const ignore = (msg: string) => msg.includes('points to missing source files');
// Vite emits this one via warnOnce; keep warn wrapped too for safety.
for (const key of ['warn', 'warnOnce'] as const) {
  const original = logger[key];
  logger[key] = (msg, opts) => {
    if (ignore(msg)) return;
    original(msg, opts);
  };
}

// Port 3000 so the OAuth redirect + token exchange come from an origin the dev
// gateway's CORS allowlist already permits (http://localhost:3000).
export default defineConfig({
  customLogger: logger,
  // strictPort: the OAuth redirect is registered for :3000, so fail rather than
  // silently fall back to another port.
  server: { port: 3000, strictPort: true },
});
