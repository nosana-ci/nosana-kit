import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState, DeploymentRevisionItem } from '../../types.js';

export async function deploymentGetRevisions(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<DeploymentRevisionItem[]> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/revisions',
    {
      params: {
        path: { deployment: state.id },
      },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment revisions', error);
  }

  return data;
}
