import type { components } from "../Schemas";

export type DeploymentId = string;

export type Deployment = components["schemas"]["Deployment"];
export type Revision = components["schemas"]["Revision"];
export type Task = components["schemas"]["Task"];
export type Event = components["schemas"]["Event"];
export type DeploymentJob = components["schemas"]["Job"];
export type Vault = components["schemas"]["Vault"];

// Array types for deployment endpoints
export type DeploymentJobs = components["schemas"]["Job"][];
export type DeploymentEvents = components["schemas"]["Event"][];
export type DeploymentRevisions = components["schemas"]["Revision"][];

export const DeploymentStatus: {
  [key in components['schemas']['DeploymentStatus']]: components['schemas']['DeploymentStatus'];
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
  [key in components['schemas']['DeploymentStrategy']]: components['schemas']['DeploymentStrategy'];
} = {
  SIMPLE: 'SIMPLE',
  'SIMPLE-EXTEND': 'SIMPLE-EXTEND',
  SCHEDULED: 'SCHEDULED',
  INFINITE: 'INFINITE',
} as const;

export type DeploymentStatus = components['schemas']['DeploymentStatus'];
export type DeploymentStrategy = components['schemas']['DeploymentStrategy'];
