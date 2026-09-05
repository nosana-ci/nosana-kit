import { deploymentGetSshKeys } from './deploymentGetSshKeys.js';
import { deploymentUpdateSshKeys } from './deploymentUpdateSshKeys.js';
import { sshKeyIdentity } from '../../../../utils/sshKeyIdentity.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type {
  DeploymentState,
  DeploymentUpdateSshKeysResult,
} from '../../types.js';

/**
 * Revokes one or more SSH public keys from a deployment's jobs.
 * A removed key stops working on a running job only when that job restarts.
 */
export async function deploymentRemoveSshKeys(
  publicKeys: string | string[],
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentUpdateSshKeysResult> {
  const { public_keys } = await deploymentGetSshKeys(client, state);
  const revoked = new Set(
    (Array.isArray(publicKeys) ? publicKeys : [publicKeys]).map(sshKeyIdentity),
  );

  return await deploymentUpdateSshKeys(
    public_keys.filter((key) => !revoked.has(sshKeyIdentity(key))),
    client,
    state,
  );
}
