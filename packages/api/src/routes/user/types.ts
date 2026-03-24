import type { components, paths } from '../../client/client-manager/schema.js';

export type UserProfile = components['schemas']['UserProfile'];
export type ApiKey = components['schemas']['ApiKey'];
export type ApiKeyCreated = components['schemas']['ApiKeyCreated'];

export type CreateApiKeyRequest =
  paths['/api-keys/']['post']['requestBody']['content']['application/json'];
export type UpdateApiKeyRequest =
  paths['/api-keys/{id}/update']['post']['requestBody']['content']['application/json'];

export interface NosanaUserApi {
  getProfile: () => Promise<UserProfile>;
  apiKeys: {
    create: (request: CreateApiKeyRequest) => Promise<ApiKeyCreated>;
    list: () => Promise<{ keys: ApiKey[]; total: number }>;
    get: (id: string) => Promise<ApiKey>;
    update: (id: string, request: UpdateApiKeyRequest) => Promise<ApiKey>;
    delete: (id: string) => Promise<{ success: boolean }>;
  };
}
