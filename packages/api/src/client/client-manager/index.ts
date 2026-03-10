import createClient, { Client, type Middleware } from 'openapi-fetch';

import { defaultConfig } from '../../defaults/index.js';

import type {
  NosanaNetwork,
  ApiKeyAuth,
  SignerAuth,
  CreateNosanaApiOptions,
} from '../../types.js';

// Types for /auth/sign-message/external endpoint
export interface SignMessageExternalRequest {
  message: string;
}

export interface SignMessageExternalResponse {
  message: string;
  userAddress: string;
  signature: string;
}

export interface ClientManagerApi {
  '/auth/sign-message/external': {
    post: {
      requestBody: {
        content: {
          'application/json': SignMessageExternalRequest;
        };
      };
      responses: {
        200: {
          content: {
            'application/json': SignMessageExternalResponse;
          };
        };
      };
    };
  };
}

export type ClientManagerClient = Client<ClientManagerApi>;

export function createNosanaClientManagerApiClient(
  environment: NosanaNetwork,
  authParams: ApiKeyAuth | SignerAuth | undefined,
  options: CreateNosanaApiOptions | undefined,
) {
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

  const client = createClient<ClientManagerApi>({
    baseUrl,
    ...(options?.include_credentials ? { credentials: 'include' } : {}),
  });

  if (!options?.include_credentials) {
    client.use(authMiddleware);
  }

  return client;
}
