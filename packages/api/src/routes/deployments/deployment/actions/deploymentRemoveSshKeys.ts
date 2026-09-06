import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentSshKeysResult, DeploymentState } from '../../types.js';

/**
 * Revokes one or more SSH public keys from a deployment's jobs. A key is matched
 * by its type and material, so a differing comment still revokes it; the node
 * revokes it on every job currently running.
 */
export async function deploymentRemoveSshKeys(
  publicKeys: string | string[],
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentSshKeysResult> {
  const { data, error } = await client.DELETE('/deployments/{deployment}/ssh-keys', {
    params: { path: { deployment: state.id } },
    body: { public_keys: Array.isArray(publicKeys) ? publicKeys : [publicKeys] },
  });

  if (error || !data) {
    throw errorFormatter('Error revoking deployment SSH keys', error);
  }

  return data;
}
