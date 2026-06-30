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

export type DeploymentManagerClient = AuthenticatedClient<paths>;

export function createDeploymentManagerClient(
  environment: NosanaNetwork,
  authParams: ApiKeyAuth | SignerAuth | undefined,
  options?: CreateNosanaApiOptions,
): DeploymentManagerClient {
  const baseUrl =
    options?.deployment_manager_url ||
    defaultConfig[environment].deployment_manager_url;
  return createAuthenticatedClient<paths>(baseUrl, authParams, options);
}
