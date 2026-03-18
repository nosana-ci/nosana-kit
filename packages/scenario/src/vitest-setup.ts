import { getScenarioClient } from './setup.js';

/**
 * Vitest setup file — auto-runs getScenarioClient() when loaded.
 *
 * Use as a vitest setupFile:
 * ```ts
 * // vitest.scenario.config.ts
 * import { defineScenarioVitestConfig } from '@nosana/scenario';
 * export default defineScenarioVitestConfig();
 * ```
 *
 * Or reference directly:
 * ```ts
 * setupFiles: ['@nosana/scenario/dist/vitest-setup.js']
 * ```
 */
export { scenarioVitestSetup } from './vitest-setup-fn.js';

// Auto-run when used as a setup file
await getScenarioClient();
