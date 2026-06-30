import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState } from '../../types.js';
import { DeploymentStatus } from '@nosana/types';

/**
 * @throws Error if the deployment is not stopped
 * @throws Error if there is an error archiving the deployment
 * @returns Promise<void>
 * @description Archives the deployment.
 * This will mark the deployment as archived and prevent further modifications.
 * It is useful for cleaning up deployments that are no longer needed.
 */
export async function deploymentArchive(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<void> {
  if (state.status !== DeploymentStatus.STOPPED) {
    throw new Error('Deployment must be stopped before archiving');
  }

  const { data, error } = await client.POST(
    '/deployments/{deployment}/archive',
    {
      params: { path: { deployment: state.id } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error archiving deployment', error);
  }
  Object.assign(state, {
    status: DeploymentStatus.ARCHIVED,
    updated_at: new Date(data.updated_at),
  });

  // Freeze the state to prevent further modifications
  Object.freeze(state);
}
