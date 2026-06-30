import { errorFormatter } from '../../../../utils/errorFormatter.js';

import { DeploymentState, type JobDefinition } from '../../types.js';
import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { components } from '../../../../client/deployment-manager/schema.js';

export async function deploymentCreateNewRevision(
  jobDefinition: JobDefinition,
  client: DeploymentManagerClient,
  state: DeploymentState,
): Promise<void> {
  const { data, error } = await client.POST(
    `/deployments/{deployment}/create-revision`,
    {
      params: { path: { deployment: state.id } },
      body: jobDefinition as components['schemas']['JobDefinition'],
    },
  );

  if (error || !data) {
    throw errorFormatter('Error creating new revision', error);
  }

  Object.assign(state, {
    active_revision: data.active_revision,
    endpoints: data.endpoints,
    updated_at: new Date(data.updated_at),
  });
}
