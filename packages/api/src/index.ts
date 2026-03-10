import {
  createNosanaClientManagerApiClient,
  createBlockchainIndexerClient,
  createHostManagerClient,
  createDeploymentManagerClient,
} from './client/index.js';
import { NosanaAuthApi } from './routes/auth/types.js';
import {
  createNosanaJobsApi, type NosanaJobsApi,
  createNosanaCreditsApi, type NosanaCreditsApi,
  createNosanaMarketsApi, type NosanaMarketsApi,
  createDeploymentsApi, type DeploymentsApi, type ApiDeploymentsApi,
  createNosanaAuthApi
} from './routes/index.js';

import { NosanaNetwork } from './types.js';
import type { ApiKeyAuth, CreateNosanaApiOptions, SignerAuth, NosanaNetwork as NosanaNetworkType, NosanaClients } from './types.js';

export interface NosanaApi {
  auth: NosanaAuthApi;
  jobs: NosanaJobsApi;
  credits: NosanaCreditsApi;
  markets: NosanaMarketsApi;
  deployments: DeploymentsApi;
}

export interface NosanaApiWithApiKey {
  auth: NosanaAuthApi;
  jobs: NosanaJobsApi;
  credits: NosanaCreditsApi;
  markets: NosanaMarketsApi;
  deployments: ApiDeploymentsApi;
}

export type NosanaApiClient = NosanaApi | NosanaApiWithApiKey;

function createClients(
  environment: NosanaNetworkType,
  authParams: SignerAuth | ApiKeyAuth | undefined,
  options?: CreateNosanaApiOptions,
): NosanaClients {
  return {
    clientManager: createNosanaClientManagerApiClient(environment, authParams, options),
    hostManager: createHostManagerClient(environment, authParams, options),
    blockchainIndexer: createBlockchainIndexerClient(environment, authParams, options),
    deploymentManager: createDeploymentManagerClient(environment, authParams, options),
  };
}

// Overloads for different auth modes
export function createNosanaApi(environment: NosanaNetworkType, noAuth: undefined, options?: CreateNosanaApiOptions): NosanaApi;
export function createNosanaApi(environment: NosanaNetworkType, signerAuth: SignerAuth, options?: CreateNosanaApiOptions): NosanaApi;
export function createNosanaApi(environment: NosanaNetworkType, apiKeyAuth: ApiKeyAuth, options?: CreateNosanaApiOptions): NosanaApiWithApiKey;

export function createNosanaApi(
  environment: NosanaNetworkType = NosanaNetwork.MAINNET,
  signerOrApiKey: SignerAuth | ApiKeyAuth | undefined,
  options?: CreateNosanaApiOptions,
): NosanaApiClient {
  const hasApiKey = typeof signerOrApiKey === 'string';
  const clients = createClients(environment, signerOrApiKey, options);

  return {
    auth: createNosanaAuthApi(clients.clientManager),
    jobs: createNosanaJobsApi({ blockchainIndexer: clients.blockchainIndexer }),
    credits: createNosanaCreditsApi({ blockchainIndexer: clients.blockchainIndexer }),
    markets: createNosanaMarketsApi({ blockchainIndexer: clients.blockchainIndexer }),
    deployments: !hasApiKey && signerOrApiKey
      ? createDeploymentsApi({ deploymentManager: clients.deploymentManager, solana: signerOrApiKey.solana }, false)
      : createDeploymentsApi({ deploymentManager: clients.deploymentManager }, true)
  };
}

// Export types
export * from './types.js';
export type { CreateNosanaApiOptions as ApiConfig, CreateNosanaApiOptions } from './types.js';

// Export request/response types
export type * from './routes/jobs/types.js';
export type * from './routes/credits/types.js';
export type * from './routes/markets/types.js';
export type * from './routes/deployments/types.js';
