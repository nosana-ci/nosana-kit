import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState } from '../../types.js';

/**
 * @param market New market address for the deployment
 * @throws Error if there is an error updating the market
 * @returns Promise<void>
 * @description Updates the market of the deployment.
 * A RUNNING deployment's current jobs are stopped and relisted on the new market:
 * SIMPLE and SIMPLE-EXTEND relist the stopped count immediately, INFINITE refills
 * each stopped replica, and SCHEDULED lists on its next scheduled run.
 */
export async function deploymentUpdateMarket(
  market: string,
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<void> {
  const { data, error } = await client.PATCH(
    '/deployments/{deployment}/update-market',
    {
      params: { path: { deployment: state.id } },
      body: { market },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error updating deployment market', error);
  }

  Object.assign(state, {
    market: data.market,
    updated_at: new Date(data.updated_at),
  });
}
