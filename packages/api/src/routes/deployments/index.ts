import type { components } from '../../client/deployment-manager/schema.js';

import { errorFormatter } from '../../utils/errorFormatter.js';
import { withPagination } from '../../utils/withPagination.js';
import { createVault as createVaultFn } from './deployment/createVault.js';
import { createDeployment as createDeploymentFn } from './deployment/createDeployment.js';

import type {
  DeploymentRouteClients,
  DeploymentRouteClientsWithSigner,
} from '../../types.js';
import type {
  CreateDeployment,
  DeploymentCreateBody,
  Deployment,
  DeploymentsApi,
  ApiDeploymentsApi,
  ApiDeployment,
  JobResults,
  DeploymentListResult,
  ApiDeploymentListResult,
  DeploymentsSearchParams,
} from './types.js';

type DeploymentSchema = components['schemas']['Deployment'];

export type { DeploymentsApi, ApiDeploymentsApi } from './types.js';

export function createDeploymentsApi(
  clients: DeploymentRouteClients,
  hasApiKey: true,
): ApiDeploymentsApi;
export function createDeploymentsApi(
  clients: DeploymentRouteClientsWithSigner,
  hasApiKey: false,
): DeploymentsApi;

export function createDeploymentsApi(
  clients: DeploymentRouteClients | DeploymentRouteClientsWithSigner,
  hasApiKey: true | false,
): DeploymentsApi | ApiDeploymentsApi {
  const client = clients.deploymentManager;

  const createDeployment = (data: DeploymentSchema) =>
    !hasApiKey && 'solana' in clients
      ? createDeploymentFn(data, clients, false)
      : createDeploymentFn(data, clients, true);

  const create = async (deploymentBody: CreateDeployment) => {
    const { data, error } = await client.POST('/deployments/create', {
      body: deploymentBody as DeploymentCreateBody,
    });

    if (error || !data) {
      throw errorFormatter('Error creating deployment', error);
    }

    return createDeployment(data);
  };

  const get = async (deployment: string) => {
    const { data, error } = await client.GET('/deployments/{deployment}', {
      params: {
        path: {
          deployment,
        },
      },
    });

    if (error || !data) {
      throw errorFormatter('Error getting deployment', error);
    }

    return createDeployment(data);
  };

  const list = async (searchParams?: DeploymentsSearchParams): Promise<DeploymentListResult | ApiDeploymentListResult> => {
    const { data, error } = await client.GET('/deployments', {
      params: {
        query: {
          ...searchParams,
        },
      },
    });

    if (error || !data) {
      throw errorFormatter('Error listing deployments', error);
    }

    return withPagination(
      {
        ...data,
        deployments: data.deployments.map((deployment) => createDeployment(deployment)),
      },
      (cursor) => list({ ...searchParams, cursor })
    );
  };

  const pipe = async (
    deploymentIDorCreateObject: string | CreateDeployment,
    ...actions: Array<
      (deployment: Deployment | ApiDeployment) => Promise<void> | void
    >
  ) => {
    let deployment: Deployment | ApiDeployment;

    if (typeof deploymentIDorCreateObject === 'string') {
      deployment = await get(deploymentIDorCreateObject);
    } else {
      deployment = await create(deploymentIDorCreateObject);
    }

    for (const action of actions) {
      await action(deployment);
    }

    return deployment;
  };

  const createVault = async () => {
    if (hasApiKey || !('solana' in clients)) {
      throw errorFormatter('Creating a vault requires signer authentication');
    }

    const { data, error } = await client.POST(
      '/deployments/vaults/create',
      {},
    );

    if (error || !data) {
      throw errorFormatter('Error creating vault', error);
    }

    return createVaultFn(data.vault, clients, new Date(data.created_at));
  };

  const listVaults = async () => {
    if (hasApiKey || !('solana' in clients)) {
      throw errorFormatter('Creating a vault requires signer authentication');
    }

    const { data, error } = await client.GET('/deployments/vaults', {});

    if (error || !data) {
      throw errorFormatter('Error listing vaults', error);
    }

    return data.map(({ vault, created_at }) =>
      createVaultFn(vault, clients, new Date(created_at)),
    );
  };

  const getJobDefinition = async (job: string) => {
    const { data, error } = await client.GET(
      '/deployments/jobs/{job}/job-definition',
      {
        params: { path: { job } },
      },
    );

    if (error || !data) {
      throw errorFormatter('Error getting job definition', error);
    }

    return data;
  };

  const submitJobResults = async (job: string, results: JobResults) => {
    const { error } = await client.POST(
      '/deployments/jobs/{job}/results',
      {
        params: { path: { job } },
        body: results,
      },
    );

    if (error) {
      throw errorFormatter('Error submitting job results', error);
    }
  };

  return {
    create,
    get,
    list,
    pipe,
    getJobDefinition,
    submitJobResults,
    ...(!hasApiKey
      ? {
          vaults: {
            create: createVault,
            list: listVaults,
          },
        }
      : {}),
  };
}
