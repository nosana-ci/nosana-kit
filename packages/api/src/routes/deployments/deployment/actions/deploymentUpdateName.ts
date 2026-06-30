import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState } from '../../types.js';

/**
 * @param name New name for the deployment
 * @throws Error if there is an error updating the name
 * @returns Promise<void>
 * @description Updates the name of the deployment.
 */
export async function deploymentUpdateName(
  name: string,
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<void> {
  const { data, error } = await client.PATCH(
    '/deployments/{deployment}/update-name',
    {
      params: { path: { deployment: state.id } },
      body: { name },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error updating deployment name', error);
  }

  Object.assign(state, {
    name: data.name,
    updated_at: new Date(data.updated_at),
  });
}
