import { errorFormatter } from '../../../../utils/errorFormatter.js';
import { withPagination } from '../../../../utils/withPagination.js';

import type { QueryClient } from '../../../../client/index.js';
import type { DeploymentState, PaginationParams, JobListResult } from '../../types.js';

/**
 * @returns Promise<JobListResult>
 * @throws Error if there is an error fetching the jobs
 * @throws Error if the deployment is not found
 * @description Fetches the jobs for the deployment.
 * This will return the current jobs associated with the deployment.
 * It is useful for monitoring the deployment's job status.
 */
export async function deploymentGetJobs(
  client: QueryClient,
  state: DeploymentState,
  params?: PaginationParams,
): Promise<JobListResult> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/jobs',
    {
      params: {
        path: { deployment: state.id },
        query: {
          cursor: params?.cursor,
          limit: params?.limit,
          sort_order: params?.sort_order,
        },
      },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment jobs', error);
  }

  return withPagination(
    data,
    (cursor) => deploymentGetJobs(client, state, { ...params, cursor })
  );
}