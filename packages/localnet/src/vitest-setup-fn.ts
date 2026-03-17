import { getLocalnetClient } from './setup.js';

/**
 * Vitest setup function that initializes the localnet client.
 * Exported for programmatic use. For vitest setupFiles, use
 * `@nosana/localnet/dist/vitest-setup.js` which auto-runs this.
 */
export async function localnetVitestSetup() {
  await getLocalnetClient();
}
