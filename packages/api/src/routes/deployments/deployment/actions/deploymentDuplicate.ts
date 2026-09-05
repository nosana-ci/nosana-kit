import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { components } from '../../../../client/deployment-manager/schema.js';
import type { DeploymentDuplicateOptions, DeploymentState } from '../../types.js';

type DeploymentSchema = components['schemas']['Deployment'];

/**
 * @param options Name for the new deployment and whether to start it right away
 * @throws Error if there is an error duplicating the deployment
 * @returns Promise<DeploymentSchema> The newly created deployment
 * @description Duplicates the deployment.
 * Creates a new DRAFT deployment (or starts it right away with `autostart`) with
 * the same vault, market, replicas, timeout, strategy, confidentiality and SSH
 * keys, and the source's active revision as its first revision. The source is
 * left untouched.
 */
export async function deploymentDuplicate(
  options: DeploymentDuplicateOptions,
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentSchema> {
  const { data, error } = await client.POST(
    '/deployments/{deployment}/duplicate',
    {
      params: { path: { deployment: state.id } },
      body: options,
    },
  );

  if (error || !data) {
    throw errorFormatter('Error duplicating deployment', error);
  }

  return data;
}
