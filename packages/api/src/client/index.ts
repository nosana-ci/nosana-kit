import createClient, { type Middleware } from 'openapi-fetch';

import { defaultConfig } from '../defaults/index.js';

import type { paths } from './schema.js';
import type { AuthenticatedClient, AuthenticatedPaths } from './type.utils.js';
import type { NosanaNetwork, ApiKeyAuth, SignerAuth, CreateNosanaApiOptions, IncludeCookiesAuth } from '../types.js';

export type * from './schema.js';

export type QueryClient = AuthenticatedClient<paths>;

export interface ApiConfig {
  backend_url?: string;
}

export function createNosanaClient(
  environment: NosanaNetwork,
  authParams: ApiKeyAuth | SignerAuth | IncludeCookiesAuth | undefined,
  options: CreateNosanaApiOptions | undefined
): QueryClient {
  const backend_url = options?.backend_url || defaultConfig[environment].backend_url;

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      if (authParams) {
        if (typeof authParams === 'string') {
          request.headers.set('Authorization', `Bearer ${authParams}`);
        } else {
          const authHeader = await authParams.generate('NosanaApiAuthentication');
          request.headers.set('x-user-id', authParams.identifier);
          request.headers.set('Authorization', authHeader);
        }
      }
    }
  };

  const client = createClient<AuthenticatedPaths<paths>>({
    baseUrl: backend_url,
    ...(authParams === 'include' ? { credentials: 'include' } : {}),
  });
  client.use(authMiddleware);

  if (authParams !== 'include') {
    client.use(authMiddleware);
  }

  return client;
}


