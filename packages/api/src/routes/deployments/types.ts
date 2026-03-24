import type { JobDefinition } from '@nosana/types';
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

// Response types for paginated endpoints
export type DeploymentJobs = paths['/api/deployments/{deployment}/jobs']['get']['responses']['200']['content']['application/json'];
export type DeploymentRevisions = paths['/api/deployments/{deployment}/revisions']['get']['responses']['200']['content']['application/json'];
export type DeploymentEvents = paths['/api/deployments/{deployment}/events']['get']['responses']['200']['content']['application/json'];
export type DeploymentTasks = paths['/api/deployments/{deployment}/tasks']['get']['responses']['200']['content']['application/json'];

// Item types extracted from paginated responses
export type DeploymentJobItem = DeploymentJobs['jobs'][number];
export type DeploymentRevisionItem = DeploymentRevisions['revisions'][number];
export type DeploymentEventItem = DeploymentEvents['events'][number];
export type DeploymentTaskItem = DeploymentTasks['tasks'][number];

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

// Search params types from OpenAPI schema
export type DeploymentsSearchParams = paths['/api/deployments']['get']['parameters']['query'];
export type DeploymentJobsSearchParams = paths['/api/deployments/{deployment}/jobs']['get']['parameters']['query'];
export type DeploymentEventsSearchParams = paths['/api/deployments/{deployment}/events']['get']['parameters']['query'];
export type DeploymentRevisionsSearchParams = paths['/api/deployments/{deployment}/revisions']['get']['parameters']['query'];

// Single job detail (richer type than list item)
export type DeploymentJob = paths['/api/deployments/{deployment}/jobs/{job}']['get']['responses']['200']['content']['application/json'];

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
  generateAuthHeader: () => Promise<string>;
  createRevision: (jobDefinition: JobDefinition) => Promise<void>;
  updateActiveRevision: (revision: number) => Promise<void>;
  updateReplicaCount: (replicas: number) => Promise<void>;
  updateTimeout: (timeout: number) => Promise<void>;
  updateSchedule: (schedule: string) => Promise<void>;
};

// Full deployment (with signer auth) - includes vault
export type Deployment = ApiDeployment & {
  vault: Vault;
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
