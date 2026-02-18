import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { QueryClient } from '../../../../client/index.js';
import type { DeploymentState, PaginationParams, RevisionListResult } from '../../types.js';

/**
 * @returns Promise<RevisionListResult>
 * @throws Error if there is an error fetching the revisions
 * @throws Error if the deployment is not found
 * @description Fetches the revisions for the deployment.
 * This will return all revisions associated with the deployment.
 * It is useful for viewing the deployment history.
 */
export async function deploymentGetRevisions(
  client: QueryClient,
  state: DeploymentState,
  params?: PaginationParams,
): Promise<RevisionListResult> {
  const { data, error} = await client.GET(
    '/api/deployments/{deployment}/revisions',
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
    throw errorFormatter('Error getting deployment revisions', error);
  }

  const nextPage = data.pagination.cursor_next
    ? async () => deploymentGetRevisions(client, state, { ...params, cursor: data.pagination.cursor_next! })
    : null;

  const previousPage = data.pagination.cursor_prev
    ? async () => deploymentGetRevisions(client, state, { ...params, cursor: data.pagination.cursor_prev! })
    : null;

  return {
    items: data.revisions,
    total_items: data.pagination.total_items,
    nextPage,
    previousPage,
  };
}
