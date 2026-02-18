import {
  deploymentStop,
  deploymentStart,
  deploymentGetEvents,
  deploymentGetJob,
  deploymentGetJobs,
  deploymentGetRevisions,
  deploymentArchive,
  deploymentUpdateReplicaCount,
  deploymentGetTasks,
  deploymentUpdateTimeout,
  deploymentCreateNewRevision,
  deploymentUpdateActiveRevision,
  deploymentUpdateSchedule,
  deploymentGenerateAuthHeader,
  deploymentDelete
} from './actions/index.js';
import { createVault } from './createVault.js';

import type {
  JobDefinition,
  Task,
  Deployment,
  DeploymentState,
  ApiDeployment,
  DeploymentJobs,
  DeploymentRevisions,
  DeploymentEvents,
} from '../types.js';
import type { RouteOptions, RouteOptionsWithSigner } from '../../../types.js';
import type { components } from '@nosana/types';

type DeploymentSchema = components['schemas']['Deployment'];

export function createDeployment(deployment: DeploymentSchema, options: RouteOptions, hasApiKey: true): ApiDeployment;
export function createDeployment(deployment: DeploymentSchema, options: RouteOptionsWithSigner, hasApiKey: false): Deployment;

export function createDeployment(
  deployment: DeploymentSchema,
  options: RouteOptions | RouteOptionsWithSigner,
  hasApiKey: true | false,
): Deployment | ApiDeployment {
  let state: DeploymentState = {
    ...deployment,
    updated_at: new Date(deployment.updated_at),
    created_at: new Date(deployment.created_at),
  };

  /**
   * @throws Error if the deployment is already running or starting
   * @throws Error if there is an error starting the deployment
   * @returns Promise<void>
   * @description Starts the deployment.
   */
  const start = async (): Promise<void> => {
    await deploymentStart(options.client, state);
  };

  /**
   * @throws Error if the deployment is already stopped
   * @throws Error if there is an error stopping the deployment
   * @returns Promise<void>
   * @description Stops the deployment.
   * This will halt the deployment and prevent further actions until it is started again.
   * It is useful for pausing deployments without archiving them.
   */
  const stop = async (): Promise<void> => {
    await deploymentStop(options.client, state);
  };

  /**
   * @throws Error if the deployment is not stopped
   * @throws Error if there is an error archiving the deployment
   * @returns Promise<void>
   * @description Archives the deployment.
   * This will mark the deployment as archived and prevent further modifications.
   * It is useful for cleaning up deployments that are no longer needed.
   */
  const archive = async () => {
    await deploymentArchive(options.client, state);
  };

  /**
   * @returns Promise<Task[]>
   * @throws Error if there is an error fetching the tasks
   * @throws Error if the deployment is not found
   * @description Fetches the tasks for the deployment.
   * This will return the current tasks associated with the deployment.
   * It is useful for monitoring the deployment's progress and status.
   */
  const getTasks = async (): Promise<Task[]> => {
    return await deploymentGetTasks(options.client, state);
  };

  /**
   * @param jobDefinition Job definition for the new revision
   * @throws Error if there is an error creating the new revision
   * @returns Promise<void>
   * @description Creates a new revision for the deployment.
   * This will create a new version of the deployment based on the provided job definition.
   * It is useful for updating the deployment with new configurations or code.
   */
  const createRevision = async (jobDefinition: JobDefinition) => {
    await deploymentCreateNewRevision(jobDefinition, options.client, state);
  };

  /**
   * @param replicas Number of replicas to set for the deployment
   * @throws Error if replicas is less than 1
   * @throws Error if there is an error updating the replica count
   * @returns Promise<void>
   * @description Updates the number of replicas for the deployment.
   * This will change the number of instances running for the deployment.
   */
  const updateReplicaCount = async (replicas: number) => {
    await deploymentUpdateReplicaCount(replicas, options.client, state);
  };

  /**
   * @param timeout Timeout in seconds
   * @throws Error if timeout is less than 60 seconds
   * @throws Error if there is an error updating the timeout
   * @returns Promise<void>
   * @description Updates the timeout for the deployment.
   * This will change the maximum time the deployment can run before it is stopped.
   */
  const updateTimeout = async (timeout: number) => {
    await deploymentUpdateTimeout(timeout, options.client, state);
  };

  /**
   * @param active_revision 
   * @throws Error if there is an error updating the active revision
   * @returns Promise<void>
   * @description Updates the active revision for the deployment.
   * This will change which revision of the deployment is currently active and serving traffic.
   */
  const updateActiveRevision = async (active_revision: number) => {
    await deploymentUpdateActiveRevision(active_revision, options.client, state);
  };

  /**
   * @param schedule Schedule string for the deployment
   * @throws Error if there is an error updating the schedule
   * @returns Promise<void>
   * @description Updates the schedule for the deployment.
   * This will change when the deployment runs based on the provided schedule.
   */
  const updateSchedule = async (schedule: string) => {
    await deploymentUpdateSchedule(schedule, options.client, state);
  };

  /**
   * @throws Error if there is an error generating the auth header
   * @returns Promise<void>
   * @description Generates a new authentication header for the deployment.
   * This is used for securing access to the deployment's resources.
   */
  const generateAuthHeader = async () => {
    return await deploymentGenerateAuthHeader(options.client, state);
  };

  const getJob = async (job: string) => {
    return await deploymentGetJob(options.client, state.id, job);
  };

  /**
   * @returns Promise<DeploymentJobs>
   * @throws Error if there is an error fetching the jobs
   * @throws Error if the deployment is not found
   * @description Fetches all jobs for the deployment.
   * This will return the current jobs associated with the deployment.
   * It is useful for monitoring the deployment's job status.
   */
  const getJobs = async (): Promise<DeploymentJobs> => {
    return await deploymentGetJobs(options.client, state);
  };

  /**
   * @returns Promise<DeploymentRevisions>
   * @throws Error if there is an error fetching the revisions
   * @throws Error if the deployment is not found
   * @description Fetches all revisions for the deployment.
   * This will return all revisions associated with the deployment.
   * It is useful for viewing the deployment history.
   */
  const getRevisions = async (): Promise<DeploymentRevisions> => {
    return await deploymentGetRevisions(options.client, state);
  };

  /**
   * @returns Promise<DeploymentEvents>
   * @throws Error if there is an error fetching the events
   * @throws Error if the deployment is not found
   * @description Fetches all events for the deployment.
   * This will return all events associated with the deployment.
   * It is useful for monitoring deployment activity and debugging.
   */
  const getEvents = async (): Promise<DeploymentEvents> => {
    return await deploymentGetEvents(options.client, state);
  };

  /**
    * @throws Error if the deployment is not stopped
    * @throws Error if there is an error deleting the deployment
    * @returns Promise<void>
    * @description Deletes the deployment permanently.
    * This will remove the deployment and all associated data (jobs, results, revisions, events).
    * The deployment must be in STOPPED state before it can be deleted.
    * The vault associated with the deployment is NOT deleted.
    * After successful deletion, the deployment object becomes unusable.
    */
  const deleteDeployment = async () => {
    return await deploymentDelete(options.client, state, () => {
      // @ts-expect-error Clear the state to prevent further interaction
      state = undefined;
    });
  };

  return Object.assign(state, {
    ...(!hasApiKey && "solana" in options ? {
      vault: createVault(state.vault, options, state.created_at)
    } : {}),
    start,
    stop,
    archive,
    delete: deleteDeployment,
    getTasks,
    getJob,
    getJobs,
    getRevisions,
    getEvents,
    generateAuthHeader,
    createRevision,
    updateReplicaCount,
    updateActiveRevision,
    updateTimeout,
    updateSchedule,
  });
}
