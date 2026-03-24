import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState, DeploymentTaskItem } from '../../types.js';

export async function deploymentGetTasks(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentTaskItem[]> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/tasks',
    {
      params: {
        path: { deployment: state.id },
      },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment tasks', error);
  }

  return data;
}
