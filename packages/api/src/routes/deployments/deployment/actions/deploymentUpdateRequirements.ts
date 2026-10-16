import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState } from '../../types.js';

/**
 * @param requirements The node requirements to replace the deployment's with, or null to clear them
 * @param market The market to post every job in; omit it (or pass null) to post across
 * markets: each job goes to the cheapest PREMIUM market with a node that meets the requirements
 * @throws Error if there is an error updating the requirements
 * @returns Promise<void>
 * @description Replaces the node requirements of the deployment together with
 * its market, as on create. Every job listed from now on is reserved on nodes that
 * meet the new requirements. Running jobs keep their hosts, unless the market changes
 * to another one: then a RUNNING deployment's jobs are stopped and relisted on it.
 */
export async function deploymentUpdateRequirements(
  requirements: DeploymentState['requirements'],
  market: string | null = null,
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
