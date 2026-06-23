import createClient, { type Middleware } from 'openapi-fetch';

import { defaultConfig } from '../defaults/index.js';

import type { paths } from './schema.js';
import type { JobsBatchPaths } from './jobsBatch.js';
import type { AuthenticatedClient, AuthenticatedPaths } from './type.utils.js';
import type { NosanaNetwork, ApiKeyAuth, SignerAuth, CreateNosanaApiOptions } from '../types.js';

export type * from './schema.js';
export type * from './jobsBatch.js';

// The dashboard proxies the client-manager batch endpoints, which the generated
// dashboard `schema` does not (yet) describe — merge them in so they are typed.
type DashboardPaths = paths & JobsBatchPaths;

export type QueryClient = AuthenticatedClient<DashboardPaths>;

export function createNosanaDashboardApiClient(
  environment: NosanaNetwork,
  authParams: ApiKeyAuth | SignerAuth | undefined,
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

  const client = createClient<AuthenticatedPaths<DashboardPaths>>({
    baseUrl: backend_url,
    ...(options?.include_credentials ? { credentials: 'include' } : {}),
  });

  if (!options?.include_credentials) {
    client.use(authMiddleware);
  }

  return client;
}


