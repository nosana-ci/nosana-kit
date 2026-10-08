import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState } from '../../types.js';

/**
 * @param requirements The node requirements to replace the deployment's with, or null to clear them
 * @param market The market that serves them; it follows the GPU, as on create
 * @throws Error if there is an error updating the requirements
 * @returns Promise<void>
 * @description Replaces the node requirements of the deployment together with
 * its market. Every job listed from now on is reserved on nodes that meet the new
 * requirements. On the same market running jobs keep their hosts; on a new one, a
 * RUNNING deployment's jobs are stopped and relisted on it.
 */
export async function deploymentUpdateRequirements(
  requirements: DeploymentState['requirements'],
  market: string,
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<void> {
  const { data, error } = await client.PATCH(
    '/deployments/{deployment}/update-requirements',
    {
      params: { path: { deployment: state.id } },
      body: { requirements, market },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error updating deployment requirements', error);
  }

  Object.assign(state, {
    requirements: data.requirements,
    market: data.market,
    updated_at: new Date(data.updated_at),
  });
}
