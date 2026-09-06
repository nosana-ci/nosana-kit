import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentSshKeysResult, DeploymentState } from '../../types.js';

/**
 * Grants one or more SSH public keys access to a deployment's jobs. Keys already
 * present (same type and material) are left as they are; the node authorizes the
 * new keys on every job currently running.
 */
export async function deploymentAddSshKeys(
  publicKeys: string | string[],
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentSshKeysResult> {
  const { data, error } = await client.POST('/deployments/{deployment}/ssh-keys', {
    params: { path: { deployment: state.id } },
    body: { public_keys: Array.isArray(publicKeys) ? publicKeys : [publicKeys] },
  });

  if (error || !data) {
    throw errorFormatter('Error adding deployment SSH keys', error);
  }

  return data;
}
