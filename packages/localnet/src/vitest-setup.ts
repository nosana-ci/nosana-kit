import { getLocalnetClient } from './setup.js';

/**
 * Vitest setup file — auto-runs getLocalnetClient() when loaded.
 *
 * Use as a vitest setupFile:
 * ```ts
 * // vitest.config.ts
 * import { defineLocalnetVitestConfig } from '@nosana/localnet';
 * export default defineLocalnetVitestConfig();
 * ```
 *
 * Or reference directly:
 * ```ts
 * setupFiles: ['@nosana/localnet/dist/vitest-setup.js']
 * ```
 */
export { localnetVitestSetup } from './vitest-setup-fn.js';

// Auto-run when used as a setup file
await getLocalnetClient();
