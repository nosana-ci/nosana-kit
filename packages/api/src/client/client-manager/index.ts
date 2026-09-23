import { createAuthenticatedClient } from '../createClient.js';

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

  // Shared factory so client-manager accepts every auth mode the others do:
  // an API-key string, a wallet SignerAuth, or a dynamic token provider
  // (e.g. an OAuth session's getAccessToken), plus cookie auth.
  return createAuthenticatedClient<paths>(baseUrl, authParams, options);
}
