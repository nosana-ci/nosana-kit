import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type {
  DeploymentState,
  DeploymentUpdateSshKeysResult,
} from '../../types.js';

/**
 * Replaces the SSH public keys configured for a deployment.
 * An empty list revokes access for future jobs. Removed keys remain active on
 * already-running jobs until those jobs restart.
 */
export async function deploymentUpdateSshKeys(
  publicKeys: string[],
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentUpdateSshKeysResult> {
  const { data, error } = await client.PATCH(
    '/deployments/{deployment}/update-ssh-keys',
    {
      params: { path: { deployment: state.id } },
      body: { public_keys: publicKeys },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error updating deployment SSH keys', error);
  }

  return data;
}
