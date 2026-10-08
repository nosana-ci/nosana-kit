import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState } from '../../types.js';

/** A timestamped authorization header for each of the deployment's running jobs, keyed by job address. */
export async function deploymentGetAllJobHeaders(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<Record<string, string>> {
  const { data, error } = await client.GET('/deployments/{deployment}/headers', {
    params: { path: { deployment: state.id } },
  });

  if (error || !data) {
    throw errorFormatter('Error generating deployment job headers', error);
  }

  return data.headers;
}
