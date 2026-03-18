/**
 * Create a Vitest config for scenario tests.
 *
 * @example
 * ```ts
 * // vitest.scenario.config.ts
 * import { defineScenarioVitestConfig } from '@nosana/scenario';
 *
 * export default defineScenarioVitestConfig({
 *   test: {
 *     include: ['tests/scenarios/**\/*.test.ts'],
 *   },
 * });
 * ```
 */
export function defineScenarioVitestConfig(overrides?: Record<string, unknown>) {
  const testOverrides = (overrides?.test ?? {}) as Record<string, unknown>;
  const existingSetupFiles = (testOverrides.setupFiles ?? []) as string[];

  return {
    ...overrides,
    test: {
      environment: 'node',
      globals: true,
      ...testOverrides,
      setupFiles: ['@nosana/scenario/dist/vitest-setup.js', ...existingSetupFiles],
    },
  };
}
