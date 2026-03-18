import { getScenarioClient } from './setup.js';

/**
 * Vitest setup function that initializes the scenario test client.
 * Exported for programmatic use. For vitest setupFiles, use
 * `@nosana/scenario/dist/vitest-setup.js` which auto-runs this.
 */
export async function scenarioVitestSetup() {
  await getScenarioClient();
}
