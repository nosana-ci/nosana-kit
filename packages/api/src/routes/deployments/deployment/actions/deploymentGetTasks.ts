import { errorFormatter } from '../../../../utils/errorFormatter.js';
import { withPagination } from '../../../../utils/withPagination.js';

import type { QueryClient } from '../../../../client/index.js';
import type { DeploymentState, PaginationParams, TaskListResult } from '../../types.js';

/**
 * @returns Promise<TaskListResult>
 * @throws Error if there is an error fetching the tasks
 * @throws Error if the deployment is not found
 * @description Fetches the tasks for the deployment.
 * This will return the current tasks associated with the deployment.
 * It is useful for monitoring the deployment's progress and status.
 */
export async function deploymentGetTasks(
  client: QueryClient,
  state: DeploymentState,
  params?: PaginationParams,
): Promise<TaskListResult> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/tasks',
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
    throw errorFormatter('Error getting deployment tasks', error);
  }

  return withPagination(
    data,
    (cursor) => deploymentGetTasks(client, state, { ...params, cursor })
  );
}
