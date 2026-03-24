import { errorFormatter } from '../../../../utils/errorFormatter.js';
import { withPagination } from '../../../../utils/withPagination.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState, DeploymentEventsSearchParams, EventListResult } from '../../types.js';

export async function deploymentGetEvents(
  client: DeploymentManagerClient,
  state: DeploymentState,
  searchParams?: DeploymentEventsSearchParams,
): Promise<EventListResult> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/events',
    {
      params: {
        path: { deployment: state.id },
        query: {
          ...searchParams,
        },
      },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment events', error);
  }

  return withPagination(
    data,
    (cursor) => deploymentGetEvents(client, state, { ...searchParams, cursor })
  );
}
