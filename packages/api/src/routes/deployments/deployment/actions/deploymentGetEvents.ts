import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState, DeploymentEventItem } from '../../types.js';

export async function deploymentGetEvents(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentEventItem[]> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/events',
    {
      params: {
        path: { deployment: state.id },
      },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment events', error);
  }

  return data;
}
