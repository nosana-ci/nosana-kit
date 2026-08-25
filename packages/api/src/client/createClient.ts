import createClient from 'openapi-fetch';
import type { Middleware } from 'openapi-fetch';

import type {
  AuthenticatedClient,
  AuthenticatedPaths,
  ClientConnection,
} from './type.utils.js';
import type { ApiKeyAuth, SignerAuth, CreateNosanaApiOptions } from '../types.js';

/**
 * The headers the client sends on every request. Resolved per call: signer auth
 * signs a fresh message each time.
 */
export async function authHeaders(
  authParams: ApiKeyAuth | SignerAuth | undefined,
): Promise<Record<string, string>> {
  if (!authParams) return {};

  if (typeof authParams === 'string') {
    return { Authorization: `Bearer ${authParams}` };
  }

  return {
    'x-user-id': authParams.identifier,
    Authorization: await authParams.generate('NosanaApiAuthentication'),
  };
}

/**
 * Creates an authenticated OpenAPI client with shared auth middleware.
 * Used as the base factory for all service-specific API clients.
 *
 * `connection` carries the same addressing and auth for requests openapi-fetch
 * cannot make (server-sent events), so a stream can never authenticate
 * differently from an ordinary request. Services that never stream simply
 * leave it unexposed in their return types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuthenticatedClient<Paths extends Record<string, any>>(
  baseUrl: string,
  authParams: ApiKeyAuth | SignerAuth | undefined,
  options?: Pick<CreateNosanaApiOptions, 'include_credentials'>,
  defaultHeaders?: Record<string, string>,
): AuthenticatedClient<Paths> & { connection: ClientConnection } {
  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      for (const [name, value] of Object.entries(await authHeaders(authParams))) {
        request.headers.set(name, value);
      }
    }
  };

  const client = createClient<AuthenticatedPaths<Paths>>({
    baseUrl,
    ...(options?.include_credentials ? { credentials: 'include' } : {}),
    ...(defaultHeaders ? { headers: defaultHeaders } : {}),
  });

  if (!options?.include_credentials) {
    client.use(authMiddleware);
  }

  return Object.assign(client, {
    connection: {
      baseUrl,
      headers: async () => ({
        ...defaultHeaders,
        // Cookie auth is carried by the browser, so nothing is added by hand.
        ...(options?.include_credentials ? {} : await authHeaders(authParams)),
      }),
    },
  });
}
