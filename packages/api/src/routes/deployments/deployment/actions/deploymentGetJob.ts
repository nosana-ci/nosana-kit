import { errorFormatter } from "../../../../utils/errorFormatter.js";

import type { QueryClient } from "../../../../client/index.js";
import type { paths } from '@nosana/types';

type DeploymentJob = paths["/api/deployments/{deployment}/jobs/{job}"]["get"]["responses"]["200"]["content"]["application/json"];

export async function deploymentGetJob(
  client: QueryClient,
  deployment: string,
  job: string
): Promise<DeploymentJob> {
  const { data, error } = await client.GET(
    '/api/deployments/{deployment}/jobs/{job}',
    {
      params: { path: { deployment, job } },
    },
  );

  if (error || !data) {
    throw errorFormatter('Error getting deployment job', error);
  }

  return data;
}