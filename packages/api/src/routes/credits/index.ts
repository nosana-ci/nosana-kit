import { errorFormatter } from '../../utils/errorFormatter.js';

import type { ClientManagerClient } from '../../client/client-manager/index.js';
import type { Balance, NosanaCreditsApi } from './types.js';

export * from './types.js';

export function createNosanaCreditsApi(clients: {
  clientManager: ClientManagerClient;
}): NosanaCreditsApi {
  const { clientManager: client } = clients;
  return {
    async balance(): Promise<Balance> {
      const { data, error } = await client.GET('/credits/balance', {});

      if (error || !data) {
        throw errorFormatter('Failed to fetch balance', error);
      }

      return data;
    },
    async claim(code: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/credits/claim', {
        body: { code },
      });

      if (error || !data) {
        throw errorFormatter('Failed to claim credits', error);
      }

      return data;
    },
    async request(): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/credits/request', {
        body: undefined,
      });

      if (error || !data) {
        throw errorFormatter('Failed to request credits', error);
      }

      return data;
    },
    async checkEligibility(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/credits/request/eligibility', {});

      if (error || !data) {
        throw errorFormatter('Failed to check eligibility', error);
      }

      return data;
    },
    invitations: {
      async get(token: string): Promise<Record<string, unknown>> {
        const { data, error } = await client.GET('/credits/invitations/{token}', {
          params: {
            path: { token },
          },
        });

        if (error || !data) {
          throw errorFormatter('Failed to get invitation', error);
        }

        return data;
      },
      async claim(token: string): Promise<Record<string, unknown>> {
        const { data, error } = await client.POST('/credits/invitations/{token}/claim', {
          params: {
            path: { token },
          },
          body: undefined,
        });

        if (error || !data) {
          throw errorFormatter('Failed to claim invitation', error);
        }

        return data;
      },
    },
  };
}
