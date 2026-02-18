import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { QueryClient } from '../../../../client/index.js';
import type { paths } from '@nosana/types';
import type { DeploymentState } from '../../types.js';

export type DeploymentJobs = paths['/api/deployments/{deployment}/jobs']['get']['responses']['200']['content']['application/json'];

/**
 * @returns Promise<DeploymentJobs>
 * @throws Error if there is an error fetching the jobs
 * @throws Error if the deployment is not found
 * @description Fetches the jobs for the deployment.
 * This will return the current jobs associated with the deployment.
 * It is useful for monitoring the deployment's job status.
 */
export async function deploymentGetJobs(
  client: QueryClient,
  state: DeploymentState,
): Promise<DeploymentJobs> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/jobs',
    {
      params: { path: { deployment: state.id } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment jobs', error);
  }

  return data;
}
