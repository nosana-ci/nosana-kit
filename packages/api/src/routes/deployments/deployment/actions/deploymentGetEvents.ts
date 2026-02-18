import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { QueryClient } from '../../../../client/index.js';
import type { paths } from '@nosana/types';
import type { DeploymentState } from '../../types.js';

export type DeploymentEvents = paths['/api/deployments/{deployment}/events']['get']['responses']['200']['content']['application/json'];

/**
 * @returns Promise<DeploymentEvents>
 * @throws Error if there is an error fetching the events
 * @throws Error if the deployment is not found
 * @description Fetches the events for the deployment.
 * This will return all events associated with the deployment.
 * It is useful for monitoring deployment activity and debugging.
 */
export async function deploymentGetEvents(
  client: QueryClient,
  state: DeploymentState,
): Promise<DeploymentEvents> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/events',
    {
      params: { path: { deployment: state.id } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment events', error);
  }

  return data;
}
