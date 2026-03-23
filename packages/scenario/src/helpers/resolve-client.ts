import type { NosanaClient } from '@nosana/kit';

import { getScenarioClient } from '../setup.js';

export async function resolveClient(clientOverride?: NosanaClient): Promise<NosanaClient> {
  return clientOverride ?? (await getScenarioClient());
}
