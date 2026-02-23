import { ClientManagerClient } from '../../client/clientManagerClient.js';
import { errorFormatter } from '../../utils/errorFormatter.js';

import type { NosanaAuthApi } from './types.js';

export function createNosanaAuthApi(client: ClientManagerClient): NosanaAuthApi {
  return {
    async signMessage(message: string, { includeTime }: { includeTime?: boolean } = {}): Promise<string> {
      const { data, error } = await client.POST('/auth/sign-message/external', {
        body: {
          message,
          includeTime
        }
      });

      if (error || !data) {
        throw errorFormatter('Failed to sign message', error);
      }

      return data.signature;
    },
  }
}

