import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState } from '../../types.js';
import { DeploymentStatus } from '@nosana/types';

/**
 * @throws Error if the deployment is not stopped
 * @throws Error if there is an error deleting the deployment
 * @returns Promise<void>
 * @description Deletes the deployment permanently.
 * This will remove the deployment and all associated data (jobs, results, revisions, events).
 * The deployment must be in STOPPED state before it can be deleted.
 * The vault associated with the deployment is NOT deleted.
 * After successful deletion, the clearState callback is invoked to prevent further interaction.
 */
export async function deploymentDelete(
  client: DeploymentManagerClient,
  state: DeploymentState,
  clearState: () => void,
): Promise<void> {
  if (state.status !== DeploymentStatus.STOPPED) {
    throw new Error('Deployment must be stopped before it can be deleted');
  }

  const { error } = await client.DELETE(
    '/api/deployments/{deployment}',
    {
      params: { path: { deployment: state.id } },
    },
  );

  if (error) {
    throw errorFormatter('Error deleting deployment', error);
  }

  // Clear the state to prevent further interaction
  clearState();
}
