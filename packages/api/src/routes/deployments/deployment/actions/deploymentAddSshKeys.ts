import { deploymentGetSshKeys } from './deploymentGetSshKeys.js';
import { deploymentUpdateSshKeys } from './deploymentUpdateSshKeys.js';
import { sshKeyIdentity } from '../../../../utils/sshKeyIdentity.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type {
  DeploymentState,
  DeploymentUpdateSshKeysResult,
} from '../../types.js';

/**
 * Grants one or more SSH public keys access to a deployment's jobs.
 * Keys already present are left as they are.
 */
export async function deploymentAddSshKeys(
  publicKeys: string | string[],
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentUpdateSshKeysResult> {
  const { public_keys } = await deploymentGetSshKeys(client, state);
  const known = new Set(public_keys.map(sshKeyIdentity));
  const additions: string[] = [];

  for (const key of Array.isArray(publicKeys) ? publicKeys : [publicKeys]) {
    const identity = sshKeyIdentity(key);
    if (known.has(identity)) continue;
    known.add(identity);
    additions.push(key);
  }

  return await deploymentUpdateSshKeys(
    [...public_keys, ...additions],
    client,
    state,
  );
}
