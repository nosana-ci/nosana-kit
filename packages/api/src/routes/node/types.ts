import type { FlowState, JobDefinition, NodeApiSchema } from '@nosana/types';
import type { SshCommandOptions, SshConnectionDescriptor } from '@nosana/ssh';
import type { NodeClient } from '../../client/node/index.js';
import type {
  CreateNosanaApiOptions,
  NosanaNetwork,
  SignedHeaderAuth,
  StreamLifecycleHandlers,
  StreamSubscription,
} from '../../types.js';

type Schemas = NodeApiSchema.components['schemas'];

export type NodeInfo = Schemas['NodeInfo'];
export type NodeJobInfo = Schemas['JobInfo'];
export type NodeOperationStatuses = Schemas['OperationStatuses'];
export type NodeJobEndpoints = Schemas['JobEndpoints'];
export type NodeTaskStat = Schemas['TaskStat'];
/** One log line from the job's task manager, as streamed over `/flog`. */
export type NodeTaskLog = Schemas['TaskLog'];
export type NodeSshAuthorization = Schemas['SshAuthorization'];
export type NodeSshAuthorizedKey = Schemas['SshAuthorizedKey'];
export type NodeSshRevocation = Schemas['SshRevocation'];

export interface NodeStatsQuery {
  /** Seconds between samples. */
  interval?: number;
  /** Unix milliseconds. */
  start?: number;
  end?: number;
}

export interface NodeLogsFilter {
  group?: string;
  opId?: string;
  type?: string;
}

export type NodeStreamSubscription = StreamSubscription;

export interface NodeStreamHandlers<T> extends StreamLifecycleHandlers {
  onData: (data: T) => void;
}

/**
 * Signs a message the way the API's signer does, answering with the standard
 * `message:base58-signature` authorization string. Lets a deployment's wallet
 * sign for its jobs, through the deployment manager, instead of the client's.
 */
export type NodeAuthorizationProvider = (message: string) => Promise<string>;

export interface NodeSshKeyOptions {
  signal?: AbortSignal;
}

export interface NodeSshAddKeyOptions extends NodeSshKeyOptions {
  /** Omit for access until the key is removed or the job ends. */
  expiresAt?: Date;
}

/** SSH access to one job, mirroring `deployment.ssh`. */
export interface NodeJobSsh {
  /** The keys currently allowed to reach the job, with their expiry when temporary. */
  keys(options?: NodeSshKeyOptions): Promise<NodeSshAuthorizedKey[]>;
  add(publicKey: string, options?: NodeSshAddKeyOptions): Promise<NodeSshAuthorization>;
  remove(publicKey: string, options?: NodeSshKeyOptions): Promise<NodeSshRevocation>;
  /** The `ssh` command that reaches the job; `identityFile` picks the private key to connect with. */
  command(options?: SshCommandOptions): SshConnectionDescriptor;
}

export type TerminalStatus = 'authorizing' | 'connecting' | 'connected' | 'closed' | 'error';

/** A signed, short-lived permission the node checks before opening a terminal. */
export interface TerminalAuthorizationGrant {
  message: string;
  /** Base64 of the raw 64-byte signature over `message`. */
  signature: string;
  expiresAt: string;
}

export interface TerminalSession {
  readonly authorization: TerminalAuthorizationGrant;
  readonly socket: WebSocket;
  sendInput(data: string): void;
  resize(cols: number, rows: number): void;
  close(): void;
}

export interface NodeSocketOptions {
  authorizationProvider?: NodeAuthorizationProvider;
  webSocketFactory?: (url: string) => WebSocket;
}

export interface NodeTerminalOptions extends NodeSocketOptions {
  cols: number;
  rows: number;
  /** Attach to one operation of the job instead of opening a shell. */
  op?: string;
  /** Lifetime of the signed grant; defaults to four minutes and is capped at five. */
  ttlMs?: number;
  /** How long to wait for the node's first frame; defaults to ten seconds. */
  timeoutMs?: number;
  signal?: AbortSignal;
  onData: (data: Uint8Array) => void;
  onStatus?: (status: TerminalStatus, detail?: string) => void;
  onExit?: (code: number | null) => void;
}

/** Everything the node knows about one job it runs. */
export interface NodeJobApi {
  readonly address: string;
  readonly node: string;
  definition(): Promise<JobDefinition>;
  /** Accepted only while the job waits for its definition. */
  setDefinition(definition: JobDefinition): Promise<void>;
  /** The finished flow; the node hands it over once and marks it collected. */
  results(): Promise<FlowState>;
  operations(): Promise<NodeOperationStatuses>;
  operation(op: string): Promise<string>;
  /** Status of one group's operations; the current group when none is named. */
  group(group?: string): Promise<NodeOperationStatuses>;
  restartGroup(group: string): Promise<void>;
  restartOperation(group: string, op: string): Promise<void>;
  stopGroup(group: string): Promise<void>;
  stopOperation(group: string, op: string): Promise<void>;
  stop(): Promise<void>;
  endpoints(): Promise<NodeJobEndpoints>;
  stats(query?: NodeStatsQuery): Promise<NodeTaskStat[]>;
  /** Server-sent events: the flow and task status, whenever they change. */
  streamInfo(handlers: NodeStreamHandlers<NodeJobInfo>): NodeStreamSubscription;
  streamStats(
    handlers: NodeStreamHandlers<NodeTaskStat[]>,
    query?: Pick<NodeStatsQuery, 'interval'>,
  ): NodeStreamSubscription;
  /** Task manager logs over WebSocket: history first, then live. */
  logs(
    handlers: NodeStreamHandlers<NodeTaskLog>,
    filter?: NodeLogsFilter,
    options?: NodeSocketOptions,
  ): NodeStreamSubscription;
  /** The node's state updates for this job over WebSocket. */
  status(handlers: NodeStreamHandlers<unknown>, options?: NodeSocketOptions): NodeStreamSubscription;
  ssh: NodeJobSsh;
  /** Opens a web terminal into the job; progress arrives through `onStatus`. */
  terminal(options: NodeTerminalOptions): Promise<TerminalSession>;
}

export interface NodeApi {
  readonly address: string;
  readonly url: string;
  /** Public: what the node is, what it runs on and what it holds. */
  info(): Promise<NodeInfo>;
  job(address: string): NodeJobApi;
}

/** Addresses one node. Nothing is fetched until a method is called. */
export type NosanaNodeApi = (address: string) => NodeApi;

export interface NodeRouteDeps {
  environment: NosanaNetwork;
  /**
   * Signs the `authorization` header a node verifies against the job owner. A
   * wallet signs directly; an API-key caller uses a client-manager-backed signer.
   */
  authParams: SignedHeaderAuth | undefined;
  options?: CreateNosanaApiOptions;
}

/** What every action on one job needs, resolved once when the node is addressed. */
export interface NodeJobContext {
  client: NodeClient;
  environment: NosanaNetwork;
  /** The domain the node answers under; also where its SSH proxy lives. */
  domain: string;
  /** Signs on behalf of the API's wallet; absent when none is configured. */
  authorize: NodeAuthorizationProvider | undefined;
  node: string;
  job: string;
}
