import { ClientManagerClient } from '../../client/client-manager/index.js';
import { errorFormatter } from '../../utils/errorFormatter.js';

import type { NosanaAuthApi, ValidateSessionResponse, ValidateApiKeyResponse } from './types.js';

export function createNosanaAuthApi(
  client: ClientManagerClient,
): NosanaAuthApi {
  return {
    async signMessage(
      message: string,
      { includeTime }: { includeTime?: boolean } = {},
    ): Promise<string> {
      const { data, error } = await client.POST('/auth/sign-message/external', {
        body: {
          message,
          includeTime,
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to sign message', error);
      }

      return data.signature;
    },
    async validateSession(cookieHeader?: string): Promise<ValidateSessionResponse> {
      const { data, error } = await client.POST('/auth/validate-session', {
        body: cookieHeader ? { cookieHeader } : undefined,
      });

      if (error || !data) {
        throw errorFormatter('Failed to validate session', error);
      }

      return data;
    },
    async validateApiKey(apiKey: string): Promise<ValidateApiKeyResponse> {
      const { data, error } = await client.POST('/auth/validate-api-key', {
        body: { apiKey },
      });

      if (error || !data) {
        throw errorFormatter('Failed to validate API key', error);
      }

      return data;
    },
  };
}
