import { errorFormatter } from '../../utils/errorFormatter.js';
import { createVault as createVaultFn } from './deployment/createVault.js';
import { createDeployment as createDeploymentFn } from './deployment/createDeployment.js';

import type { RouteOptions, RouteOptionsWithSigner } from '../../types.js';
import type { CreateDeployment, DeploymentCreateBody, Deployment, DeploymentsApi, ApiDeploymentsApi, ApiDeployment, } from './types.js';
import type { components } from '@nosana/types';

type DeploymentSchema = components['schemas']['Deployment'];

export type { DeploymentsApi, ApiDeploymentsApi } from './types.js';

export function createDeploymentsApi(options: RouteOptions, hasApiKey: true): ApiDeploymentsApi;
export function createDeploymentsApi(options: RouteOptionsWithSigner, hasApiKey: false): DeploymentsApi;

export function createDeploymentsApi(options: RouteOptions | RouteOptionsWithSigner, hasApiKey: true | false): DeploymentsApi | ApiDeploymentsApi {
  const createDeployment = (data: DeploymentSchema) => !hasApiKey && "solana" in options
    ? createDeploymentFn(data, options, false)
    : createDeploymentFn(data, options, true);

  const create = async (deploymentBody: CreateDeployment) => {
    const { data, error } = await options.client.POST('/api/deployments/create', {
      body: deploymentBody as DeploymentCreateBody,
    });

    if (error || !data) {
      throw errorFormatter('Error creating deployment', error);
    }

    return createDeployment(data);
  };

  const get = async (deployment: string) => {
    const { data, error } = await options.client.GET('/api/deployments/{deployment}', {
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

  const list = async () => {
    const { data, error } = await options.client.GET('/api/deployments', {});

    if (error || !data) {
      throw errorFormatter('Error listing deployments', error);
    }

    return data.map((deployment) =>
      createDeployment(deployment)
    );
  };

  const pipe = async (
    deploymentIDorCreateObject: string | CreateDeployment,
    ...actions: Array<(deployment: Deployment | ApiDeployment) => Promise<void> | void>
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
    if (hasApiKey || !('solana' in options)) {
      throw errorFormatter('Creating a vault requires signer authentication');
    }

    const { data, error } = await options.client.POST('/api/deployments/vaults/create', {});

    if (error || !data) {
      throw errorFormatter('Error creating vault', error);
    }

    return createVaultFn(
      data.vault,
      options,
      new Date(data.created_at)
    );
  };

  const listVaults = async () => {
    if (hasApiKey || !('solana' in options)) {
      throw errorFormatter('Creating a vault requires signer authentication');
    }

    const { data, error } = await options.client.GET('/api/deployments/vaults', {});

    if (error || !data) {
      throw errorFormatter('Error listing vaults', error);
    }

    return data.map(({ vault, created_at }) => createVaultFn(
      vault,
      options,
      new Date(created_at),
    ));
  };

  return {
    create,
    get,
    list,
    pipe,
    ...(!hasApiKey ? {
      vaults: {
        create: createVault,
        list: listVaults
      }
    } : {}),
  };
}
