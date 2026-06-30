import type { operations } from '../../client/host-manager/schema.js';

export type NodeListRequest = NonNullable<
  operations['getNodes']['parameters']['query']
>;
export type NodeQueuedRequest = NonNullable<
  operations['getNodesQueued-nodes']['parameters']['query']
>;
export type NodeUptimeRequest = NonNullable<
  operations['getNodesHeartbeatsUptimeByNode']['parameters']['query']
>;
export type NodeWithAccessRequest = NonNullable<
  operations['getNodesWith-access']['parameters']['query']
>;
export type NodeRequestMarketRequest = NonNullable<
  operations['getNodesRequest-market']['parameters']['query']
>;
export type NodeMarketRelationRequest = NonNullable<
  operations['getNodesMarket-relation']['parameters']['query']
>;
export type NodeMinimumVersionRequest = NonNullable<
  operations['getNodesMinimum-required-version']['parameters']['query']
>;
export type NodeMetricsQuery = NonNullable<
  operations['getNodesByIdMetrics']['parameters']['query']
>;
export type NodeRegisterRequest = NonNullable<
  operations['postNodesRegister']['requestBody']
>['content']['application/json'];
export type NodeSyncRequest = NonNullable<
  operations['postNodesSync-node']['requestBody']
>['content']['application/json'];
export type NodeMetricsBody = NonNullable<
  operations['postNodesByIdMetrics']['requestBody']
>['content']['application/json'];
export type NodeAddressRequest = NonNullable<
  operations['patchNodesByIdAddress']['requestBody']
>['content']['application/json'];
export type NodeContactRequest = NonNullable<
  operations['patchNodesByIdContact']['requestBody']
>['content']['application/json'];

export interface NosanaHostsApi {
  list: (request?: NodeListRequest) => Promise<Record<string, unknown>>;
  get: (id: string) => Promise<Record<string, unknown>>;
  getAvailableGpus: () => Promise<Record<string, unknown>>;
  getQueuedNodes: (
    request?: NodeQueuedRequest,
  ) => Promise<Record<string, unknown>>;
  getUptime: (
    node: string,
    request?: NodeUptimeRequest,
  ) => Promise<Record<string, unknown>>;
  getByCountry: () => Promise<Record<string, unknown>>;
  getWithAccess: (
    request?: NodeWithAccessRequest,
  ) => Promise<Record<string, unknown>>;
  getRewards: () => Promise<Record<string, unknown>>;
  getRequestMarket: (
    request?: NodeRequestMarketRequest,
  ) => Promise<Record<string, unknown>>;
  getMarketRelation: (
    request?: NodeMarketRelationRequest,
  ) => Promise<Record<string, unknown>>;
  getMinimumRequiredVersion: (
    request?: NodeMinimumVersionRequest,
  ) => Promise<Record<string, unknown>>;
  getFull: (id: string) => Promise<Record<string, unknown>>;
  getInfo: (id: string) => Promise<Record<string, unknown>>;
  getMetrics: (
    id: string,
    request?: NodeMetricsQuery,
  ) => Promise<Record<string, unknown>>;
  getRewardsById: (id: string) => Promise<Record<string, unknown>>;
  getRecentBenchmarks: (id: string) => Promise<Record<string, unknown>>;
  register: (request: NodeRegisterRequest) => Promise<Record<string, unknown>>;
  syncNode: (request: NodeSyncRequest) => Promise<Record<string, unknown>>;
  heartbeat: () => Promise<Record<string, unknown>>;
  payment: () => Promise<Record<string, unknown>>;
  postMetrics: (
    id: string,
    request: NodeMetricsBody,
  ) => Promise<Record<string, unknown>>;
  updateAddress: (
    id: string,
    request: NodeAddressRequest,
  ) => Promise<Record<string, unknown>>;
  updateContact: (
    id: string,
    request: NodeContactRequest,
  ) => Promise<Record<string, unknown>>;
}
