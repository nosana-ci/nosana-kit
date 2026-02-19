import { createNosanaApiClient } from './client/index.js';
import {
  createNosanaJobsApi, type NosanaJobsApi,
  createNosanaCreditsApi, type NosanaCreditsApi,
  createNosanaMarketsApi, type NosanaMarketsApi,
  createDeploymentsApi, type DeploymentsApi, type ApiDeploymentsApi
} from './routes/index.js';

import { NosanaNetwork } from './types.js';
import type { ApiKeyAuth, CreateNosanaApiOptions, SignerAuth, NosanaNetwork as NosanaNetworkType } from './types.js';

export interface NosanaApi {
  jobs: NosanaJobsApi;
  credits: NosanaCreditsApi;
  markets: NosanaMarketsApi;
  deployments: DeploymentsApi;
}

export interface NosanaApiWithApiKey {
  jobs: NosanaJobsApi;
  credits: NosanaCreditsApi;
  markets: NosanaMarketsApi;
  deployments: ApiDeploymentsApi;
}

export type NosanaApiClient = NosanaApi | NosanaApiWithApiKey;

// Overloads for different auth modes
export function createNosanaApi(environment: NosanaNetworkType, noAuth: undefined, options?: CreateNosanaApiOptions): NosanaApi;
export function createNosanaApi(environment: NosanaNetworkType, signerAuth: SignerAuth, options?: CreateNosanaApiOptions): NosanaApi;
export function createNosanaApi(environment: NosanaNetworkType, apiKeyAuth: ApiKeyAuth, options?: CreateNosanaApiOptions): NosanaApiWithApiKey;

export function createNosanaApi(
  environment: NosanaNetworkType = NosanaNetwork.MAINNET,
  signerOrApiKey: SignerAuth | ApiKeyAuth | undefined,
  options?: CreateNosanaApiOptions,
): NosanaApiClient {
  const client = createNosanaApiClient(environment, signerOrApiKey, options);
  const hasApiKey = typeof signerOrApiKey === 'string';

  return {
    jobs: createNosanaJobsApi(client),
    credits: createNosanaCreditsApi(client),
    markets: createNosanaMarketsApi(client),
    deployments: !hasApiKey && signerOrApiKey
      ? createDeploymentsApi({ client, solana: signerOrApiKey.solana }, false)
      : createDeploymentsApi({ client }, true)
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
