import {
  createNosanaClientManagerApiClient,
  createBlockchainIndexerClient,
  createHostManagerClient,
  createDeploymentManagerClient,
} from './client/index.js';
import { NosanaAuthApi } from './routes/auth/types.js';
import {
  createNosanaJobsApi,
  type NosanaJobsApi,
  type NosanaApiKeyJobsApi,
  createNosanaCreditsApi,
  type NosanaCreditsApi,
  createNosanaMarketsApi,
  type NosanaMarketsApi,
  createDeploymentsApi,
  type DeploymentsApi,
  type ApiDeploymentsApi,
  createNosanaAuthApi,
  createNosanaUserApi,
  type NosanaUserApi,
  createNosanaTemplatesApi,
  type NosanaTemplatesApi,
  createNosanaHostsApi,
  type NosanaHostsApi,
  createNosanaStatsApi,
  type NosanaStatsApi,
  createNosanaPaymentsApi,
  type NosanaPaymentsApi,
  createNosanaNewsletterApi,
  type NosanaNewsletterApi,
  createNosanaBenchmarksApi,
  type NosanaBenchmarksApi,
  createNosanaNodeApi,
  type NodeInfo,
} from './routes/index.js';

import { NosanaNetwork } from './types.js';
import type {
  ApiKeyAuth,
  CreateNosanaApiOptions,
  SignerAuth,
  SignedHeaderAuth,
  NosanaNetwork as NosanaNetworkType,
  NosanaClients,
} from './types.js';

export interface NosanaApi {
  auth: NosanaAuthApi;
  jobs: NosanaJobsApi;
  credits: NosanaCreditsApi;
  markets: NosanaMarketsApi;
  deployments: DeploymentsApi;
  user: NosanaUserApi;
  templates: NosanaTemplatesApi;
  hosts: NosanaHostsApi;
  stats: NosanaStatsApi;
  payments: NosanaPaymentsApi;
  newsletter: NosanaNewsletterApi;
  benchmarks: NosanaBenchmarksApi;
  /** A node's public info, addressed by node address. */
  node: (address: string) => Promise<NodeInfo>;
  /**
   * The raw, fully-typed per-service OpenAPI clients. Use these to call any
   * endpoint not covered by the curated groups above — every route of each
   * service is available with path autocompletion and typed params/responses,
   * e.g. `api.clients.hostManager.POST('/nodes/ban', { body })`.
   */
  clients: NosanaClients;
}

/**
 * API-key auth: a node still verifies the job owner's signature, but the client
 * manager signs on the caller's behalf — so node access (`jobs(id)`, `node`) is
 * available, without a local wallet. No vault (that needs a signer).
 */
export interface NosanaApiWithApiKey {
  auth: NosanaAuthApi;
  jobs: NosanaJobsApi;
  credits: NosanaCreditsApi;
  markets: NosanaMarketsApi;
  deployments: ApiDeploymentsApi;
  user: NosanaUserApi;
  templates: NosanaTemplatesApi;
  hosts: NosanaHostsApi;
  stats: NosanaStatsApi;
  payments: NosanaPaymentsApi;
  newsletter: NosanaNewsletterApi;
  benchmarks: NosanaBenchmarksApi;
  /** A node's public info, addressed by node address. */
  node: (address: string) => Promise<NodeInfo>;
  clients: NosanaClients;
}

/**
 * Unauthenticated: only the public, indexer-backed reads. There is no signer, so
 * a job's node cannot be reached — `jobs` is the query methods only, and there
 * is no `node`.
 */
export interface NosanaPublicApi {
  auth: NosanaAuthApi;
  jobs: NosanaApiKeyJobsApi;
  credits: NosanaCreditsApi;
  markets: NosanaMarketsApi;
  deployments: ApiDeploymentsApi;
  user: NosanaUserApi;
  templates: NosanaTemplatesApi;
  hosts: NosanaHostsApi;
  stats: NosanaStatsApi;
  payments: NosanaPaymentsApi;
  newsletter: NosanaNewsletterApi;
  benchmarks: NosanaBenchmarksApi;
  clients: NosanaClients;
}

export type NosanaApiClient = NosanaApi | NosanaApiWithApiKey | NosanaPublicApi;

function createClients(
  environment: NosanaNetworkType,
  authParams: SignerAuth | ApiKeyAuth | undefined,
  options?: CreateNosanaApiOptions,
): NosanaClients {
  return {
    clientManager: createNosanaClientManagerApiClient(
      environment,
      authParams,
      options,
    ),
    hostManager: createHostManagerClient(environment, authParams, options),
    blockchainIndexer: createBlockchainIndexerClient(
      environment,
      authParams,
      options,
    ),
    deploymentManager: createDeploymentManagerClient(
      environment,
      authParams,
      options,
    ),
  };
}

// Overloads for different auth modes
export function createNosanaApi(
  environment: NosanaNetworkType,
  noAuth: undefined,
  options?: CreateNosanaApiOptions,
): NosanaApi;
export function createNosanaApi(
  environment: NosanaNetworkType,
  signerAuth: SignerAuth,
  options?: CreateNosanaApiOptions,
): NosanaApi;
export function createNosanaApi(
  environment: NosanaNetworkType,
  apiKeyAuth: ApiKeyAuth,
  options?: CreateNosanaApiOptions,
): NosanaApiWithApiKey;

export function createNosanaApi(
  environment: NosanaNetworkType = NosanaNetwork.MAINNET,
  signerOrApiKey: SignerAuth | ApiKeyAuth | undefined,
  options?: CreateNosanaApiOptions,
): NosanaApiClient {
  const hasApiKey = typeof signerOrApiKey === 'string';
  const clients = createClients(environment, signerOrApiKey, options);
  const auth = createNosanaAuthApi(clients.clientManager);
  // A node verifies a signed header against the job owner, so an API-key caller
  // reaches it through the client manager's signing service (custodial key) —
  // signed lazily, per request, so headers stay fresh and cost nothing until used.
  const nodeAuth: SignedHeaderAuth | undefined =
    typeof signerOrApiKey === 'string'
      ? { generate: (message) => auth.signHeader(message) }
      : signerOrApiKey;
  const node = nodeAuth
    ? createNosanaNodeApi({ environment, authParams: nodeAuth, options })
    : undefined;

  return {
    auth,
    jobs: node
      ? createNosanaJobsApi({
          blockchainIndexer: clients.blockchainIndexer,
          clientManager: clients.clientManager,
          node,
        })
      : createNosanaJobsApi({
          blockchainIndexer: clients.blockchainIndexer,
          clientManager: clients.clientManager,
        }),
    credits: createNosanaCreditsApi({ clientManager: clients.clientManager }),
    markets: createNosanaMarketsApi({ hostManager: clients.hostManager }),
    deployments:
      !hasApiKey && signerOrApiKey
        ? createDeploymentsApi(
            {
              deploymentManager: clients.deploymentManager,
              environment,
              options,
              solana: signerOrApiKey.solana,
            },
            false,
          )
        : createDeploymentsApi(
            { deploymentManager: clients.deploymentManager, environment, options },
            true,
          ),
    user: createNosanaUserApi({ clientManager: clients.clientManager }),
    templates: createNosanaTemplatesApi({
      clientManager: clients.clientManager,
    }),
    hosts: createNosanaHostsApi({ hostManager: clients.hostManager }),
    stats: createNosanaStatsApi({
      blockchainIndexer: clients.blockchainIndexer,
    }),
    payments: createNosanaPaymentsApi({ clientManager: clients.clientManager }),
    newsletter: createNosanaNewsletterApi({
      clientManager: clients.clientManager,
    }),
    benchmarks: createNosanaBenchmarksApi({ hostManager: clients.hostManager }),
    ...(node ? { node: (address: string) => node(address).info() } : {}),
    clients,
  };
}

// Export helpers
export { generateIdempotencyKey, IdempotencyCode } from './utils/idempotency.js';
export { isNosanaApiError, isIdempotencyControlSignal } from './utils/errorFormatter.js';

// Export types
export * from './types.js';
export type {
  CreateNosanaApiOptions as ApiConfig,
  CreateNosanaApiOptions,
} from './types.js';
export type { NosanaApiError } from './utils/errorFormatter.js';

// Export request/response types
export type * from './routes/jobs/types.js';
export type * from './routes/credits/types.js';
export type * from './routes/markets/types.js';
export type * from './routes/deployments/types.js';
export type * from './routes/node/types.js';
