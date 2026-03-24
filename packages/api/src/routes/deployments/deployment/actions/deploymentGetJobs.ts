import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState, DeploymentJobItem } from '../../types.js';

export async function deploymentGetJobs(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentJobItem[]> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/jobs',
    {
      params: {
        path: { deployment: state.id },
      },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment jobs', error);
  }

  return data;
}
