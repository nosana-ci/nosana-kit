import { errorFormatter } from '../../../../utils/errorFormatter.js';
import { withPagination } from '../../../../utils/withPagination.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState, PaginationParams, TaskListResult } from '../../types.js';

export async function deploymentGetTasks(
  client: DeploymentManagerClient,
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
