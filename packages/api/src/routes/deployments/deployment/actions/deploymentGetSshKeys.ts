import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentSshKeys, DeploymentState } from '../../types.js';

/**
 * Gets the SSH public keys configured for a deployment.
 */
export async function deploymentGetSshKeys(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentSshKeys> {
  const { data, error } = await client.GET(
    '/deployments/{deployment}/ssh-keys',
    {
      params: { path: { deployment: state.id } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment SSH keys', error);
  }

  return data;
}
