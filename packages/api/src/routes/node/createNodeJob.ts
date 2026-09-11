import { createSshCommand } from '@nosana/ssh';

import {
  nodeJobDefinition,
  nodeJobEndpoints,
  nodeJobGroup,
  nodeJobOperation,
  nodeJobOperations,
  nodeJobResults,
  nodeJobStats,
  restartNodeJobGroup,
  restartNodeJobOperation,
  setNodeJobDefinition,
  stopNodeJob,
  stopNodeJobGroup,
  stopNodeJobOperation,
} from './actions/nodeJob/index.js';
import { nodeJobSshAdd, nodeJobSshKeys, nodeJobSshRemove } from './actions/nodeJobSsh/index.js';
import { nodeJobInfoStream, nodeJobStatsStream } from './actions/nodeJobStreams/index.js';
import { nodeJobLogs, nodeJobStatus } from './actions/nodeSocket/index.js';
import { openNodeJobTerminal } from './actions/terminal/openTerminal.js';

import type { NodeJobApi, NodeJobContext } from './types.js';

export function createNodeJob(context: NodeJobContext): NodeJobApi {
  const { client, job, node } = context;
  const target = { job, node, nodeDomain: context.domain };

  return {
    address: job,
    node,
    definition: () => nodeJobDefinition(client, job),
    setDefinition: (definition) => setNodeJobDefinition(client, job, definition),
    results: () => nodeJobResults(client, job),
    operations: () => nodeJobOperations(client, job),
    operation: (op) => nodeJobOperation(client, job, op),
    group: (group) => nodeJobGroup(client, job, group),
    restartGroup: (group) => restartNodeJobGroup(client, job, group),
    restartOperation: (group, op) => restartNodeJobOperation(client, job, group, op),
    stopGroup: (group) => stopNodeJobGroup(client, job, group),
    stopOperation: (group, op) => stopNodeJobOperation(client, job, group, op),
    stop: () => stopNodeJob(client, job),
    endpoints: () => nodeJobEndpoints(client, job),
    stats: (query) => nodeJobStats(client, job, query),
    streamInfo: (handlers) => nodeJobInfoStream(client, job, handlers),
    streamStats: (handlers, query) => nodeJobStatsStream(client, job, handlers, query),
    logs: (handlers, filter, options) => nodeJobLogs(context, handlers, filter, options),
    status: (handlers, options) => nodeJobStatus(context, handlers, options),
    ssh: {
      keys: (options) => nodeJobSshKeys(client, job, options),
      add: (publicKey, options) => nodeJobSshAdd(client, job, publicKey, options),
      remove: (publicKey, options) => nodeJobSshRemove(client, job, publicKey, options),
      command: (options) => createSshCommand(target, options),
    },
    terminal: (options) => openNodeJobTerminal(context, options),
  };
}
