import type {
  JobDefinition,
} from '@nosana/types';
import type { components, paths } from '../../client/deployment-manager/schema.js';

// Re-export types from @nosana/types for reuse
export type { JobDefinition } from '@nosana/types';

export type JobResults = components['schemas']['JobResults'];

// Deployment state with Date objects instead of strings
export type DeploymentState = Omit<components['schemas']['Deployment'], "updated_at" | "created_at"> & {
  updated_at: Date;
  created_at: Date;
}

// Type alias for creating deployments (from OpenAPI schema)
export type DeploymentCreateBody = components['schemas']['DeploymentCreateBody'];

export type CreateDeployment = Omit<DeploymentCreateBody, 'job_definition'> & {
  job_definition: JobDefinition;
};

// Pagination type from API (internal use)
export type PaginationMeta = {
  cursor_next: string | null;
  cursor_prev: string | null;
  total_items: number;
};

// Generic paginated result with navigation methods
export type PaginatedResult<T> = T & {
  total_items: number;
  nextPage: (() => Promise<PaginatedResult<T>>) | null;
  previousPage: (() => Promise<PaginatedResult<T>>) | null;
}

// Specific paginated result types
export type DeploymentListResult = PaginatedResult<{ deployments: Deployment[] }>;
export type ApiDeploymentListResult = PaginatedResult<{ deployments: ApiDeployment[] }>;
export type JobListResult = PaginatedResult<{ jobs: DeploymentJobItem[] }>;
export type EventListResult = PaginatedResult<{ events: DeploymentEventItem[] }>;
export type RevisionListResult = PaginatedResult<{ revisions: DeploymentRevisionItem[] }>;
export type TaskListResult = PaginatedResult<{ tasks: DeploymentTaskItem[] }>;

// Pagination query parameters
export type PaginationParams = {
  cursor?: string;
  limit?: 10 | 20 | 50 | 100;
  sort_order?: 'asc' | 'desc';
};

// Response types for the new endpoints
export type DeploymentJobs = paths['/deployments/{deployment}/jobs']['get']['responses']['200']['content']['application/json'];
export type DeploymentRevisions = paths['/deployments/{deployment}/revisions']['get']['responses']['200']['content']['application/json'];
export type DeploymentEvents = paths['/deployments/{deployment}/events']['get']['responses']['200']['content']['application/json'];
export type DeploymentTasks = paths['/deployments/{deployment}/tasks']['get']['responses']['200']['content']['application/json'];

export interface TopupVaultOptions {
  SOL?: number;
  NOS?: number;
  lamports?: boolean;
}

/**
 * Vault interface for managing deployment funding.
 * NOTE: Implementation will be provided by @nosana/kit
 */
export interface Vault {
  address: string;
  created_at?: Date;
  getBalance: () => Promise<{ SOL: number; NOS: number }>;
  topup: (options: TopupVaultOptions) => Promise<void>;
  withdraw: () => Promise<void>;
}

// Type for deployment job response
export type DeploymentJob = paths['/deployments/{deployment}/jobs/{job}']['get']['responses']['200']['content']['application/json'];

export type DeploymentsSearchParams = paths['/deployments']['get']['parameters']['query'];
export type DeploymentJobsSearchParams = paths['/deployments/{deployment}/jobs']['get']['parameters']['query'];
export type DeploymentEventsSearchParams = paths['/deployments/{deployment}/events']['get']['parameters']['query'];
export type DeploymentRevisionsSearchParams = paths['/deployments/{deployment}/revisions']['get']['parameters']['query'];
export type DeploymentAuthHeaderParams = paths['/deployments/{deployment}/header']['get']['parameters']['query'];
export type DeploymentDuplicateOptions = paths['/deployments/{deployment}/duplicate']['post']['requestBody']['content']['application/json'];

// Item types extracted from paginated responses
export type DeploymentJobItem = DeploymentJobs['jobs'][number];
export type DeploymentRevisionItem = DeploymentRevisions['revisions'][number];
export type DeploymentEventItem = DeploymentEvents['events'][number];
export type DeploymentTaskItem = DeploymentTasks['tasks'][number];

/**
 * One frame of `GET /deployments/{deployment}/stream`, discriminated by `type`.
 *
 * The stream opens with the deployment, its active jobs and its outstanding
 * tasks, then emits changes as they happen.
 */
export type DeploymentStreamEvent =
  components['schemas']['DeploymentStreamEvent'];

/** One kind of frame, selected from the union by its `type`. */
export type DeploymentStreamEventOf<T extends DeploymentStreamEvent['type']> =
  Extract<DeploymentStreamEvent, { type: T }>;

/** An open stream, for as long as the caller wants it. */
export type DeploymentStreamSubscription = { close: () => void };

/** What a caller wants to hear about while streaming a deployment. */
export type DeploymentStreamHandlers = {
  onDeployment?: (event: DeploymentStreamEventOf<'deployment'>) => void;
  onJob?: (event: DeploymentStreamEventOf<'job'>) => void;
  /** A new entry in the deployment's event log. */
  onEvent?: (event: DeploymentStreamEventOf<'event'>) => void;
  onTask?: (event: DeploymentStreamEventOf<'task'>) => void;
  /**
   * One of the deployment's endpoints and whether it currently answers. Sent for
   * every endpoint on open, then whenever reachability changes — several ports of
   * one op share a tunnel and so are restated together.
   */
  onEndpoint?: (event: DeploymentStreamEventOf<'endpoint'>) => void;
  /**
   * The authoritative set of the deployment's active jobs, by id, sent once when
   * the stream opens (ahead of the per-job frames). Prune any active job still
   * shown whose id is absent here: a completion missed while disconnected is not
   * replayed as a `job` frame, so this is the only signal that it is gone.
   */
  onJobs?: (event: DeploymentStreamEventOf<'jobs'>) => void;
  /** The stream opened, or reopened after dropping: resynchronise from here. */
  onOpen?: () => void;
  onError?: (error: unknown) => void;
};

// API deployment (with API key auth) - no vault
export type ApiDeployment = DeploymentState & {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  archive: () => Promise<void>;
  delete: () => Promise<void>;
  getTasks: (searchParams?: PaginationParams) => Promise<TaskListResult>;
  getJob: (job: string) => Promise<DeploymentJob>;
  getJobs: (searchParams?: DeploymentJobsSearchParams) => Promise<JobListResult>;
  getRevisions: (searchParams?: DeploymentRevisionsSearchParams) => Promise<RevisionListResult>;
  getEvents: (searchParams?: DeploymentEventsSearchParams) => Promise<EventListResult>;
  /** Stream changes over server-sent events; close it to stop. */
  stream: (handlers: DeploymentStreamHandlers) => DeploymentStreamSubscription;
  generateAuthHeader: (query?: DeploymentAuthHeaderParams) => Promise<string>;
  createRevision: (jobDefinition: JobDefinition) => Promise<void>;
  updateActiveRevision: (revision: number) => Promise<void>;
  updateReplicaCount: (replicas: number) => Promise<void>;
  updateTimeout: (timeout: number) => Promise<void>;
  updateSchedule: (schedule: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateMarket: (market: string) => Promise<void>;
  /** Copy this deployment into a new one; the source is left untouched. */
  duplicate: (options: DeploymentDuplicateOptions) => Promise<ApiDeployment>;
};

// Full deployment (with signer auth) - includes vault
export type Deployment = Omit<ApiDeployment, 'duplicate'> & {
  vault: Vault;
  /** Copy this deployment into a new one; the source is left untouched. */
  duplicate: (options: DeploymentDuplicateOptions) => Promise<Deployment>;
};

// Deployments API interface (with signer auth - includes vault)
export interface DeploymentsApi {
  create: (deploymentBody: CreateDeployment) => Promise<Deployment>;
  get: (deployment: string) => Promise<Deployment>;
  list: (searchParams?: DeploymentsSearchParams) => Promise<DeploymentListResult>;
  pipe: (
    deploymentIDorCreateObject: string | CreateDeployment,
    ...actions: Array<(deployment: Deployment) => Promise<void> | void>
  ) => Promise<Deployment>;
  getJobDefinition: (job: string) => Promise<JobDefinition>;
  submitJobResults: (job: string, results: JobResults) => Promise<void>;
  vaults: {
    create: () => Promise<Vault>;
    list: () => Promise<Vault[]>;
  }
}

// API-only Deployments interface (with API key auth - no vault)
export interface ApiDeploymentsApi {
  create: (deploymentBody: CreateDeployment) => Promise<ApiDeployment>;
  get: (deployment: string) => Promise<ApiDeployment>;
  list: (searchParams?: DeploymentsSearchParams) => Promise<ApiDeploymentListResult>;
  pipe: (
    deploymentIDorCreateObject: string | CreateDeployment,
    ...actions: Array<(deployment: ApiDeployment) => Promise<void> | void>
  ) => Promise<ApiDeployment>;
  getJobDefinition: (job: string) => Promise<JobDefinition>;
  submitJobResults: (job: string, results: JobResults) => Promise<void>;
}
