import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import { type DeploymentState } from '../../types.js';

export async function deploymentGenerateAuthHeader(
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<string> {
  const { data, error } = await client.GET(
    '/deployments/{deployment}/header',
    {
      params: { path: { deployment: state.id } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error generating deployment header', error);
  }

  return data.header;
}
