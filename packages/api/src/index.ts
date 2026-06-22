import { createNosanaClientManagerApiClient, createNosanaDashboardApiClient } from './client/index.js';
import { NosanaAuthApi } from './routes/auth/types.js';
import {
  createNosanaJobsApi, type NosanaJobsApi,
  createNosanaCreditsApi, type NosanaCreditsApi,
  createNosanaMarketsApi, type NosanaMarketsApi,
  createDeploymentsApi, type DeploymentsApi, type ApiDeploymentsApi,
  createNosanaAuthApi
} from './routes/index.js';

import { NosanaNetwork } from './types.js';
import type { ApiKeyAuth, CreateNosanaApiOptions, SignerAuth, NosanaNetwork as NosanaNetworkType } from './types.js';

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

  const clientManagerClient = createNosanaClientManagerApiClient(environment, signerOrApiKey, options);
  const dashboardClient = createNosanaDashboardApiClient(environment, signerOrApiKey, options);

  return {
    auth: createNosanaAuthApi(clientManagerClient),
    jobs: createNosanaJobsApi(dashboardClient),
    credits: createNosanaCreditsApi(dashboardClient),
    markets: createNosanaMarketsApi(dashboardClient),
    deployments: !hasApiKey && signerOrApiKey
      ? createDeploymentsApi({ client: dashboardClient, solana: signerOrApiKey.solana }, false)
      : createDeploymentsApi({ client: dashboardClient }, true)
  };
}

// Export helpers
export { generateIdempotencyKey, IdempotencyCode } from './utils/idempotency.js';
export { isNosanaApiError } from './utils/errorFormatter.js';

// Export types
export * from './types.js';
export type { CreateNosanaApiOptions as ApiConfig, CreateNosanaApiOptions } from './types.js';
export type { NosanaApiError } from './utils/errorFormatter.js';

// Export request/response types
export type * from './routes/jobs/types.js';
export type * from './routes/credits/types.js';
export type * from './routes/markets/types.js';
export type * from './routes/deployments/types.js';
