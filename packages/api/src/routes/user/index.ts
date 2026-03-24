import { errorFormatter } from '../../utils/errorFormatter.js';

import type { ClientManagerClient } from '../../client/client-manager/index.js';
import type {
  NosanaUserApi,
  UserProfile,
  ApiKey,
  ApiKeyCreated,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
} from './types.js';

export * from './types.js';

export function createNosanaUserApi(clients: {
  clientManager: ClientManagerClient;
}): NosanaUserApi {
  const { clientManager: client } = clients;
  return {
    async getProfile(): Promise<UserProfile> {
      const { data, error } = await client.GET('/user/profile', {});

      if (error || !data) {
        throw errorFormatter('Failed to get user profile', error);
      }

      return data;
    },
    apiKeys: {
      async create(request: CreateApiKeyRequest): Promise<ApiKeyCreated> {
        const { data, error } = await client.POST('/api-keys/', {
          body: request,
        });

        if (error || !data) {
          throw errorFormatter('Failed to create API key', error);
        }

        return data;
      },
      async list(): Promise<{ keys: ApiKey[]; total: number }> {
        const { data, error } = await client.GET('/api-keys/', {});

        if (error || !data) {
          throw errorFormatter('Failed to list API keys', error);
        }

        return data;
      },
      async get(id: string): Promise<ApiKey> {
        const { data, error } = await client.GET('/api-keys/{id}', {
          params: {
            path: { id },
          },
        });

        if (error || !data) {
          throw errorFormatter('Failed to get API key', error);
        }

        return data;
      },
      async update(id: string, request: UpdateApiKeyRequest): Promise<ApiKey> {
        const { data, error } = await client.POST('/api-keys/{id}/update', {
          params: {
            path: { id },
          },
          body: request,
        });

        if (error || !data) {
          throw errorFormatter('Failed to update API key', error);
        }

        return data;
      },
      async delete(id: string): Promise<{ success: boolean }> {
        const { data, error } = await client.POST('/api-keys/{id}/delete', {
          params: {
            path: { id },
          },
          body: undefined,
        });

        if (error || !data) {
          throw errorFormatter('Failed to delete API key', error);
        }

        return data;
      },
    },
  };
}
