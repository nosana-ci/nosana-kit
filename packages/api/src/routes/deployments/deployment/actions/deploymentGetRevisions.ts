import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { QueryClient } from '../../../../client/index.js';
import type { paths } from '@nosana/types';
import type { DeploymentState } from '../../types.js';

export type DeploymentRevisions = paths['/api/deployments/{deployment}/revisions']['get']['responses']['200']['content']['application/json'];

/**
 * @returns Promise<DeploymentRevisions>
 * @throws Error if there is an error fetching the revisions
 * @throws Error if the deployment is not found
 * @description Fetches the revisions for the deployment.
 * This will return all revisions associated with the deployment.
 * It is useful for viewing the deployment history.
 */
export async function deploymentGetRevisions(
  client: QueryClient,
  state: DeploymentState,
): Promise<DeploymentRevisions> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/revisions',
    {
      params: { path: { deployment: state.id } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment revisions', error);
  }

  return data;
}
