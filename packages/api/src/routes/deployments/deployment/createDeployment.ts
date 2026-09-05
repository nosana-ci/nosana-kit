import {
  deploymentStop,
  deploymentStart,
  deploymentGetEvents,
  deploymentStream,
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
  deploymentUpdateName,
  deploymentGenerateAuthHeader,
  deploymentDelete,
  deploymentUpdateMarket,
  deploymentDuplicate,
} from './actions/index.js';
import { createVault } from './createVault.js';

import type {
  JobDefinition,
  Deployment,
  DeploymentState,
  ApiDeployment,
  PaginationParams,
  TaskListResult,
  JobListResult,
  RevisionListResult,
  EventListResult,
  DeploymentJobsSearchParams,
  DeploymentRevisionsSearchParams,
  DeploymentEventsSearchParams,
  DeploymentAuthHeaderParams,
  DeploymentDuplicateOptions,
  DeploymentStreamHandlers,
  DeploymentStreamSubscription,
} from '../types.js';
import type {
  DeploymentRouteClients,
  DeploymentRouteClientsWithSigner,
} from '../../../types.js';
import type { components } from '../../../client/deployment-manager/schema.js';

type DeploymentSchema = components['schemas']['Deployment'];

export function createDeployment(
  deployment: DeploymentSchema,
  clients: DeploymentRouteClients,
  hasApiKey: true,
): ApiDeployment;
export function createDeployment(
  deployment: DeploymentSchema,
  clients: DeploymentRouteClientsWithSigner,
  hasApiKey: false,
): Deployment;

export function createDeployment(
  deployment: DeploymentSchema,
  clients: DeploymentRouteClients | DeploymentRouteClientsWithSigner,
  hasApiKey: true | false,
): Deployment | ApiDeployment {
  const client = clients.deploymentManager;
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
    await deploymentStart(client, state);
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
    await deploymentStop(client, state);
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
    await deploymentArchive(client, state);
  };

  /**
   * @param params Pagination parameters (optional: cursor, limit, sort_order)
   * @returns Promise<TaskListResult>
   * @throws Error if there is an error fetching the tasks
   * @throws Error if the deployment is not found
   * @description Fetches the tasks for the deployment.
   * This will return the current tasks associated with the deployment.
   * It is useful for monitoring the deployment's progress and status.
   */
  const getTasks = async (params?: PaginationParams): Promise<TaskListResult> => {
    return await deploymentGetTasks(client, state, params);
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
    await deploymentCreateNewRevision(jobDefinition, client, state);
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
    await deploymentUpdateReplicaCount(replicas, client, state);
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
    await deploymentUpdateTimeout(timeout, client, state);
  };

  /**
   * @param name New name for the deployment
   * @throws Error if there is an error updating the name
   * @returns Promise<void>
   * @description Updates the name of the deployment.
   */
  const updateName = async (name: string) => {
    await deploymentUpdateName(name, client, state);
  };

  /**
   * @param market New market address for the deployment
   * @throws Error if there is an error updating the market
   * @returns Promise<void>
   * @description Updates the market of the deployment.
   * A RUNNING deployment's current jobs are stopped and relisted on the new market.
   */
  const updateMarket = async (market: string) => {
    await deploymentUpdateMarket(market, client, state);
  };

  /**
   * @param options Name for the new deployment and whether to start it right away
   * @throws Error if there is an error duplicating the deployment
   * @returns Promise<Deployment | ApiDeployment> The newly created deployment
   * @description Duplicates the deployment.
   * The copy shares the vault, market, replicas, timeout, strategy, confidentiality
   * and SSH keys, and starts from this deployment's active revision. It is left as
   * a DRAFT unless `autostart` is set. This deployment is left untouched.
   */
  const duplicate = async (options: DeploymentDuplicateOptions) => {
    const copy = await deploymentDuplicate(options, client, state);

    return !hasApiKey && 'solana' in clients
      ? createDeployment(copy, clients, false)
      : createDeployment(copy, clients, true);
  };

  /**
   * @param active_revision
   * @throws Error if there is an error updating the active revision
   * @returns Promise<void>
   * @description Updates the active revision for the deployment.
   * This will change which revision of the deployment is currently active and serving traffic.
   */
  const updateActiveRevision = async (active_revision: number) => {
    await deploymentUpdateActiveRevision(active_revision, client, state);
  };

  /**
   * @param schedule Schedule string for the deployment
   * @throws Error if there is an error updating the schedule
   * @returns Promise<void>
   * @description Updates the schedule for the deployment.
   * This will change when the deployment runs based on the provided schedule.
   */
  const updateSchedule = async (schedule: string) => {
    await deploymentUpdateSchedule(schedule, client, state);
  };

  /**
   * @throws Error if there is an error generating the auth header
   * @returns Promise<void>
   * @description Generates a new authentication header for the deployment.
   * This is used for securing access to the deployment's resources.
   */
  const generateAuthHeader = async (query?: DeploymentAuthHeaderParams) => {
    return await deploymentGenerateAuthHeader(client, state, query);
  };

  const getJob = async (job: string) => {
    return await deploymentGetJob(client, state.id, job);
  };

  /**
   * @param params Pagination parameters (optional: cursor, limit, sort_order)
   * @returns Promise<JobListResult>
   * @throws Error if there is an error fetching the jobs
   * @throws Error if the deployment is not found
   * @description Fetches all jobs for the deployment.
   * This will return the current jobs associated with the deployment.
   * It is useful for monitoring the deployment's job status.
   */
  const getJobs = async (searchParams?: DeploymentJobsSearchParams): Promise<JobListResult> => {
    return await deploymentGetJobs(client, state, searchParams);
  };

  /**
   * @param params Pagination parameters (optional: cursor, limit, sort_order)
   * @returns Promise<RevisionListResult>
   * @throws Error if there is an error fetching the revisions
   * @throws Error if the deployment is not found
   * @description Fetches all revisions for the deployment.
   * This will return all revisions associated with the deployment.
   * It is useful for viewing the deployment history.
   */
  const getRevisions = async (searchParams?: DeploymentRevisionsSearchParams): Promise<RevisionListResult> => {
    return await deploymentGetRevisions(client, state, searchParams);
  };

  /**
   * @param params Pagination parameters (optional: cursor, limit, sort_order)
   * @returns Promise<EventListResult>
   * @throws Error if there is an error fetching the events
   * @throws Error if the deployment is not found
   * @description Fetches all events for the deployment.
   * This will return all events associated with the deployment.
   * It is useful for monitoring deployment activity and debugging.
   */
  const getEvents = async (searchParams?: DeploymentEventsSearchParams): Promise<EventListResult> => {
    return await deploymentGetEvents(client, state, searchParams);
  };

  /**
   * @returns A function that closes the stream.
   * @description Streams the deployment's changes over server-sent events.
   * The stream opens with the deployment, its active jobs and its outstanding
   * tasks, then emits changes as they happen. It reopens itself if the
   * connection drops, so `onOpen` may fire more than once.
   */
  const stream = (
    handlers: DeploymentStreamHandlers,
  ): DeploymentStreamSubscription => {
    return deploymentStream(client, state, handlers);
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
    return await deploymentDelete(client, state, () => {
      // @ts-expect-error Clear the state to prevent further interaction
      state = undefined;
    });
  };

  return Object.assign(state, {
    ...(!hasApiKey && 'solana' in clients
      ? {
        vault: createVault(state.vault, clients, state.created_at),
      }
      : {}),
    start,
    stop,
    archive,
    delete: deleteDeployment,
    getTasks,
    getJob,
    getJobs,
    getRevisions,
    getEvents,
    stream,
    generateAuthHeader,
    createRevision,
    updateReplicaCount,
    updateActiveRevision,
    updateTimeout,
    updateSchedule,
    updateName,
    updateMarket,
    duplicate,
  });
}
