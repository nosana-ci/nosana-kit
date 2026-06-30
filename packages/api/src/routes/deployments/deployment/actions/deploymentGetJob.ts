import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentJob } from '../../types.js';

export async function deploymentGetJob(
  client: DeploymentManagerClient,
  deployment: string,
  job: string,
): Promise<DeploymentJob> {
  const { data, error } = await client.GET(
    '/deployments/{deployment}/jobs/{job}',
    {
      params: { path: { deployment, job } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment job', error);
  }

  return data;
}
