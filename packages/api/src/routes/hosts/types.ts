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
export type HostsFilterRequest = NonNullable<
  operations['getHosts']['parameters']['query']
>;
export type HostsFiltersOptionsRequest = NonNullable<
  operations['getHostsFilters']['parameters']['query']
>;
export type BenchmarkReportRequest = NonNullable<
  operations['getBenchmarksNode-report']['parameters']['query']
>;
export type BenchmarkSummaryRequest = NonNullable<
  operations['getBenchmarksMarketsBenchmark-summary']['parameters']['query']
>;

export interface NosanaHostsApi {
  list: (request?: NodeListRequest) => Promise<Record<string, unknown>>;
  get: (id: string) => Promise<Record<string, unknown>>;
  getSpecs: (id: string) => Promise<Record<string, unknown>>;
  getAvailableGpus: () => Promise<Record<string, unknown>>;
  getStats: () => Promise<Record<string, unknown>>;
  getQueuedNodes: (
    request?: NodeQueuedRequest,
  ) => Promise<Record<string, unknown>>;
  getUptime: (
    node: string,
    request?: NodeUptimeRequest,
  ) => Promise<Record<string, unknown>>;
  getByCountry: () => Promise<Record<string, unknown>>;
  getAvailableHosts: (
    request?: HostsFilterRequest,
  ) => Promise<Record<string, unknown>>;
  getFilters: (
    request?: HostsFiltersOptionsRequest,
  ) => Promise<Record<string, unknown>>;
  getBenchmarkReport: (
    request?: BenchmarkReportRequest,
  ) => Promise<Record<string, unknown>>;
  getTemplatePerformance: (
    nodeId: string,
  ) => Promise<Record<string, unknown>>;
  getBenchmarkSummary: (
    request?: BenchmarkSummaryRequest,
  ) => Promise<Record<string, unknown>>;
}
