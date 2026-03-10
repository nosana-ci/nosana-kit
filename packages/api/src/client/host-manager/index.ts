import { createAuthenticatedClient } from '../createClient.js';
import { defaultConfig } from '../../defaults/index.js';

import type { paths } from './schema.js';
import type { AuthenticatedClient } from '../type.utils.js';
import type { NosanaNetwork, ApiKeyAuth, SignerAuth, CreateNosanaApiOptions } from '../../types.js';

export type HostManagerClient = AuthenticatedClient<paths>;

export function createHostManagerClient(
  environment: NosanaNetwork,
  authParams: ApiKeyAuth | SignerAuth | undefined,
  options?: CreateNosanaApiOptions,
): HostManagerClient {
  const baseUrl = options?.host_manager_url || defaultConfig[environment].host_manager_url;
  return createAuthenticatedClient<paths>(baseUrl, authParams, options);
}
