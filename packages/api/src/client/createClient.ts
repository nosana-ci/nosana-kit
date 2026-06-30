import createClient from 'openapi-fetch';
import type { Middleware } from 'openapi-fetch';

import type { AuthenticatedClient, AuthenticatedPaths } from './type.utils.js';
import type { ApiKeyAuth, SignerAuth, CreateNosanaApiOptions } from '../types.js';

/**
 * Creates an authenticated OpenAPI client with shared auth middleware.
 * Used as the base factory for all service-specific API clients.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuthenticatedClient<Paths extends Record<string, any>>(
  baseUrl: string,
  authParams: ApiKeyAuth | SignerAuth | undefined,
  options?: Pick<CreateNosanaApiOptions, 'include_credentials'>,
): AuthenticatedClient<Paths> {
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

  const client = createClient<AuthenticatedPaths<Paths>>({
    baseUrl,
    ...(options?.include_credentials ? { credentials: 'include' } : {}),
  });

  if (!options?.include_credentials) {
    client.use(authMiddleware);
  }

  return client;
}
