import { errorFormatter } from '../../../../utils/errorFormatter.js';
import { withPagination } from '../../../../utils/withPagination.js';

import type { QueryClient } from '../../../../client/index.js';
import type { DeploymentState, PaginationParams, EventListResult } from '../../types.js';

/**
 * @returns Promise<EventListResult>
 * @throws Error if there is an error fetching the events
 * @throws Error if the deployment is not found
 * @description Fetches the events for the deployment.
 * This will return all events associated with the deployment.
 * It is useful for monitoring deployment activity and debugging.
 */
export async function deploymentGetEvents(
  client: QueryClient,
  state: DeploymentState,
  params?: PaginationParams,
): Promise<EventListResult> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/events',
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
    throw errorFormatter('Error getting deployment events', error);
  }

  return withPagination(
    data,
    (cursor) => deploymentGetEvents(client, state, { ...params, cursor })
  );
}
