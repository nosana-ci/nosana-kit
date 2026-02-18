import { errorFormatter } from '../../utils/errorFormatter.js';

import type { QueryClient } from '../../client/index.js';
import type { Balance, NosanaCreditsApi } from './types.js';

export * from "./types.js";

export function createNosanaCreditsApi(client: QueryClient): NosanaCreditsApi {
  return {
    async balance(): Promise<Balance> {
      const { data, error } = await client.GET('/api/credits/balance', {});
      if (error || !data) {
        throw errorFormatter('Failed to fetch balance', error);
      }
      return data;
    }
  };
}

