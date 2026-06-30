import type { operations, paths } from '../../client/client-manager/schema.js';

export type ApiKey =
  operations['getApi-keysById']['responses'][200]['content']['application/json'];
export type ApiKeyCreated =
  operations['postApi-keys']['responses'][200]['content']['application/json'];

export type CreateApiKeyRequest =
  paths['/api-keys/']['post']['requestBody']['content']['application/json'];
export type UpdateApiKeyRequest =
  paths['/api-keys/{id}/update']['post']['requestBody']['content']['application/json'];

export interface NosanaUserApi {
  apiKeys: {
    create: (request: CreateApiKeyRequest) => Promise<ApiKeyCreated>;
    list: () => Promise<{ keys: ApiKey[]; total: number }>;
    get: (id: string) => Promise<ApiKey>;
    update: (id: string, request: UpdateApiKeyRequest) => Promise<ApiKey>;
    delete: (id: string) => Promise<{ success: boolean }>;
  };
}
