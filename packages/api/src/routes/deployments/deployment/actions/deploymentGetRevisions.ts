import { errorFormatter } from '../../../../utils/errorFormatter.js';
import { withPagination } from '../../../../utils/withPagination.js';

import type { DeploymentManagerClient } from '../../../../client/deployment-manager/index.js';
import type { DeploymentRevisionsSearchParams, DeploymentState, RevisionListResult } from '../../types.js';

export async function deploymentGetRevisions(
  client: DeploymentManagerClient,
  state: DeploymentState,
  searchParams?: DeploymentRevisionsSearchParams,
): Promise<RevisionListResult> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/revisions',
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
    throw errorFormatter('Error getting deployment revisions', error);
  }

  return withPagination(
    data,
    (cursor) => deploymentGetRevisions(client, state, { ...searchParams, cursor })
  );
}
