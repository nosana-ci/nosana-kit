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

/**
 * API keys can be revoked and regenerated, so the deployment manager never sees them.
 * The client manager proxies every `/deployments/*` route and swaps the key for the
 * user's non-rotatable system key. Wallet auth talks to the deployment manager directly.
 */
export function createDeploymentManagerClient(
  environment: NosanaNetwork,
  authParams: ApiKeyAuth | SignerAuth | undefined,
  options?: CreateNosanaApiOptions,
): DeploymentManagerClient {
  const viaClientManager = typeof authParams === 'string';

  if (!viaClientManager) {
    const baseUrl =
      options?.deployment_manager_url ||
      defaultConfig[environment].deployment_manager_url;
    return createAuthenticatedClient<paths>(baseUrl, authParams, options);
  }

  const baseUrl =
    options?.client_manager_url || defaultConfig[environment].client_manager_url;

  // Hand an explicit URL to the proxy as its forwarding target.
  const targetOverride = options?.deployment_manager_url
    ? { 'x-deployment-manager-url': options.deployment_manager_url }
    : undefined;

  return createAuthenticatedClient<paths>(
    baseUrl,
    authParams,
    options,
    targetOverride,
  );
}
