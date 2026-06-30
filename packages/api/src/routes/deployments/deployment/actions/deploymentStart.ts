import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState } from '../../types.js';
import { DeploymentStatus } from '@nosana/types';

/**
 * @throws Error if the deployment is already running or starting
 * @throws Error if there is an error starting the deployment
 * @returns Promise<void>
 * @description Starts the deployment.
 */
export async function deploymentStart(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<void> {
  if (
    [DeploymentStatus.STARTING, DeploymentStatus.RUNNING].includes(state.status)
  ) {
    throw new Error('Cannot start a deployment that is already running');
  }

  const { data, error } = await client.POST(
    '/deployments/{deployment}/start',
    {
      params: { path: { deployment: state.id } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error starting deployment', error);
  }

  Object.assign(state, {
    status: data.status,
    updated_at: new Date(data.updated_at),
  });
}
