import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import { DeploymentState } from '../../types.js';

export async function deploymentUpdateSchedule(
  schedule: string,
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<void> {
  const { data, error } = await client.PATCH(
    `/deployments/{deployment}/update-schedule`,
    {
      params: { path: { deployment: state.id } },
      body: { schedule },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error updating schedule', error);
  }

  Object.assign(state, {
    schedule: data.schedule,
    updated_at: new Date(data.updated_at),
  });
}
