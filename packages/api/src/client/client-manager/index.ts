import createClient, { type Middleware } from 'openapi-fetch';

import { defaultConfig } from '../../defaults/index.js';

import type { paths } from './schema.js';
import type { AuthenticatedClient } from '../type.utils.js';
import type {
  NosanaNetwork,
  ApiKeyAuth,
  SignerAuth,
  CreateNosanaApiOptions,
} from '../../types.js';

export type ClientManagerClient = AuthenticatedClient<paths>;

export function createNosanaClientManagerApiClient(
  environment: NosanaNetwork,
  authParams: ApiKeyAuth | SignerAuth | undefined,
  options: CreateNosanaApiOptions | undefined,
): ClientManagerClient {
  const baseUrl =
    options?.client_manager_url ||
    defaultConfig[environment].client_manager_url;

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      if (!authParams || typeof authParams !== 'string') {
        throw new Error(
          'Authentication parameters are required to create a client manager API client',
        );
      }

      request.headers.set('Authorization', `Bearer ${authParams}`);
    },
  };

  const client = createClient<paths>({
    baseUrl,
    ...(options?.include_credentials ? { credentials: 'include' } : {}),
  });

  if (!options?.include_credentials) {
    client.use(authMiddleware);
  }

  return client;
}
