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

// Response item types from deployment-manager API (plain arrays, no pagination)
export type DeploymentJobItem = components['schemas']['Job'];
export type DeploymentRevisionItem = components['schemas']['Revision'];
export type DeploymentEventItem = components['schemas']['Event'];
export type DeploymentTaskItem = components['schemas']['Task'];

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
  getTasks: () => Promise<DeploymentTaskItem[]>;
  getJob: (job: string) => Promise<DeploymentJob>;
  getJobs: () => Promise<DeploymentJobItem[]>;
  getRevisions: () => Promise<DeploymentRevisionItem[]>;
  getEvents: () => Promise<DeploymentEventItem[]>;
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
  list: () => Promise<Deployment[]>;
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
  list: () => Promise<ApiDeployment[]>;
  pipe: (
    deploymentIDorCreateObject: string | CreateDeployment,
    ...actions: Array<(deployment: ApiDeployment) => Promise<void> | void>
  ) => Promise<ApiDeployment>;
  getJobDefinition: (job: string) => Promise<JobDefinition>;
  submitJobResults: (job: string, results: JobResults) => Promise<void>;
}
