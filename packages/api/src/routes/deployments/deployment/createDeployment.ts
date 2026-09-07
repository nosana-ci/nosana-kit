import {
  deploymentStop,
  deploymentStart,
  deploymentGetEvents,
  deploymentStream,
  deploymentGetJob,
  deploymentGetJobs,
  deploymentGetRevisions,
  deploymentGetSshKeys,
  deploymentArchive,
  deploymentUpdateReplicaCount,
  deploymentGetTasks,
  deploymentUpdateTimeout,
  deploymentCreateNewRevision,
  deploymentUpdateActiveRevision,
  deploymentUpdateSchedule,
  deploymentAddSshKeys,
  deploymentRemoveSshKeys,
  deploymentUpdateName,
  deploymentGenerateAuthHeader,
  deploymentDelete,
  deploymentUpdateMarket,
  deploymentDuplicate,
} from './actions/index.js';
import { createVault } from './createVault.js';
import { createNosanaNodeApi } from '../../node/index.js';

import type {
  JobDefinition,
  Deployment,
  DeploymentState,
  ApiDeployment,
  PaginationParams,
  TaskListResult,
  JobListResult,
  DeploymentNodeJob,
  NodeJobListResult,
  RevisionListResult,
  EventListResult,
  DeploymentJobsSearchParams,
  DeploymentRevisionsSearchParams,
  DeploymentEventsSearchParams,
  DeploymentAuthHeaderParams,
  DeploymentDuplicateOptions,
  DeploymentStreamHandlers,
  DeploymentStreamSubscription,
  DeploymentSshKeysResult,
} from '../types.js';
import type {
  DeploymentRouteClients,
  DeploymentRouteClientsWithSigner,
} from '../../../types.js';
import type { NodeJobApi } from '../../node/types.js';
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

  /**
   * @description SSH key management for the deployment's jobs.
   * Keys are stored on the deployment (no new revision or restart) and injected
   * into every job posted from then on. Running jobs are updated in place where
   * their node allows it; check the returned `jobs` for nodes that did not.
   */
  const ssh = {
    /**
     * @throws Error if there is an error fetching the keys
     * @returns Promise<string[]> The SSH public keys currently granted access
     */
    keys: async (): Promise<string[]> => {
      const { public_keys } = await deploymentGetSshKeys(client, state);
      return public_keys;
    },

    /**
     * @param publicKeys One or more OpenSSH public keys to grant access
     * @throws Error if there is an error updating the keys
     * @returns Promise<DeploymentSshKeysResult> The stored set and per-job node results
     * @description Grants the keys access. Keys already present are left as they are.
     */
    add: async (publicKeys: string | string[]): Promise<DeploymentSshKeysResult> => {
      return await deploymentAddSshKeys(publicKeys, client, state);
    },

    /**
     * @param publicKeys One or more OpenSSH public keys to revoke
     * @throws Error if there is an error updating the keys
     * @returns Promise<DeploymentSshKeysResult> The stored set and per-job node results
     * @description Revokes the keys. A removed key stops working on a running job only when that job restarts.
     */
    remove: async (publicKeys: string | string[]): Promise<DeploymentSshKeysResult> => {
      return await deploymentRemoveSshKeys(publicKeys, client, state);
    },
  };

  // Built lazily on first node access and reused. Every node call is authorized
  // by the deployment manager signing on the deployment's behalf (no local
  // wallet; works under API-key auth).
  let nodeFactory: ReturnType<typeof createNosanaNodeApi> | undefined;
  const nodeJob = (node: string, jobAddress: string) => {
    nodeFactory ??= createNosanaNodeApi({
      environment: clients.environment,
      authParams: { generate: (message) => generateAuthHeader({ message, includeTime: 'true' }) },
      options: clients.options,
    });
    return nodeFactory(node).job(jobAddress);
  };

  /** Attaches a job's node job API once it has been scheduled onto a node. */
  const attachNode = <T extends { node: string | null; job: string }>(
    item: T,
  ): T & Partial<NodeJobApi> =>
    (item.node ? Object.assign({}, item, nodeJob(item.node, item.job)) : item) as T &
      Partial<NodeJobApi>;

  const attachJobList = (list: JobListResult): NodeJobListResult => ({
    ...list,
    jobs: list.jobs.map(attachNode),
    nextPage: list.nextPage ? async () => attachJobList(await list.nextPage!()) : null,
    previousPage: list.previousPage ? async () => attachJobList(await list.previousPage!()) : null,
  });

  /**
   * One of the deployment's jobs, with its node job API (`ssh`, `terminal`,
   * `definition`, `logs`, …) attached: `(await getJob(id)).ssh.add(key)`.
   */
  const getJob = async (jobId: string): Promise<DeploymentNodeJob> => {
    const data = await deploymentGetJob(client, state.id, jobId);
    if (!data.node) throw new Error(`Job ${jobId} has no assigned node.`);
    return Object.assign({}, data, nodeJob(data.node, jobId)) as DeploymentNodeJob;
  };

  /**
   * The deployment's jobs. Each job that has been scheduled onto a node carries
   * its node job API (`ssh`, `terminal`, …); queued jobs are returned as-is.
   */
  const getJobs = async (searchParams?: DeploymentJobsSearchParams): Promise<NodeJobListResult> =>
    attachJobList(await deploymentGetJobs(client, state, searchParams));

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
    ssh,
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
