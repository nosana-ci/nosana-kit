import type { components } from "../Schemas";

export type DeploymentId = string;

export type Deployment = components["schemas"]["DeploymentManagerDeployment"];
export type Revision = components["schemas"]["DeploymentManagerRevision"];
export type Task = components["schemas"]["DeploymentManagerTask"];
export type Event = components["schemas"]["DeploymentManagerEvent"];
export type DeploymentJob = components["schemas"]["DeploymentManagerJob"];
export type Vault = components["schemas"]["DeploymentManagerVault"];

// Array types for deployment endpoints
export type DeploymentJobs = components["schemas"]["DeploymentManagerJob"][];
export type DeploymentEvents = components["schemas"]["DeploymentManagerEvent"][];
export type DeploymentRevisions = components["schemas"]["DeploymentManagerRevision"][];

export const DeploymentStatus: {
  [key in components['schemas']['DeploymentManagerDeploymentStatus']]: components['schemas']['DeploymentManagerDeploymentStatus'];
} = {
  DRAFT: 'DRAFT',
  ERROR: 'ERROR',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  ARCHIVED: 'ARCHIVED',
} as const;

export const DeploymentStrategy: {
  [key in components['schemas']['DeploymentManagerDeploymentStrategy']]: components['schemas']['DeploymentManagerDeploymentStrategy'];
} = {
  SIMPLE: 'SIMPLE',
  'SIMPLE-EXTEND': 'SIMPLE-EXTEND',
  SCHEDULED: 'SCHEDULED',
  INFINITE: 'INFINITE',
} as const;

export type DeploymentStatus = components['schemas']['DeploymentManagerDeploymentStatus'];
export type DeploymentStrategy = components['schemas']['DeploymentManagerDeploymentStrategy'];
