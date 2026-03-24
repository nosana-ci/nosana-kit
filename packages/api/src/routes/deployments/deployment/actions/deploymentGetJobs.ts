import { errorFormatter } from '../../../../utils/errorFormatter.js';
import { withPagination } from '../../../../utils/withPagination.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentState, JobListResult, DeploymentJobsSearchParams } from '../../types.js';

export async function deploymentGetJobs(
  client: DeploymentManagerClient,
  state: DeploymentState,
  searchParams?: DeploymentJobsSearchParams,
): Promise<JobListResult> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/jobs',
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
    throw errorFormatter('Error getting deployment jobs', error);
  }

  return withPagination(
    data,
    (cursor) => deploymentGetJobs(client, state, { ...searchParams, cursor })
  );
}
