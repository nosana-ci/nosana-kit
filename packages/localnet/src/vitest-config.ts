/**
 * Create a Vitest config for localnet scenario tests.
 *
 * @example
 * ```ts
 * // vitest.localnet.config.ts
 * import { defineLocalnetVitestConfig } from '@nosana/localnet';
 *
 * export default defineLocalnetVitestConfig({
 *   test: {
 *     include: ['tests/scenarios/**\/*.test.ts'],
 *   },
 * });
 * ```
 */
export function defineLocalnetVitestConfig(overrides?: Record<string, unknown>) {
  const testOverrides = (overrides?.test ?? {}) as Record<string, unknown>;
  const existingSetupFiles = (testOverrides.setupFiles ?? []) as string[];

  return {
    ...overrides,
    test: {
      environment: 'node',
      globals: true,
      ...testOverrides,
      setupFiles: ['@nosana/localnet/dist/vitest-setup.js', ...existingSetupFiles],
    },
  };
}
