import typia from "typia";

import { SOLANA_ADDRESS_PATTERN } from "../Common/index.js";

import type { FlowState, JobDefinition } from "../Jobs/index.js";

/**
 * The OpenAPI 3.1 document for the HTTP API every node serves for its jobs.
 * This module is the source of truth: `JobDefinition`, `FlowState` and every
 * type they reach are taken from the TypeScript types through typia at build
 * time, so the document cannot drift from them. `pnpm generate:node` exports it
 * to `openapi/node.openapi.json` and regenerates `node.ts` from that file.
 *
 * The document is built on first use rather than at import, so consumers of
 * the package's other exports never pay for it.
 *
 * It mirrors the express routes registered in `NodeManager/node/api/ApiHandler.ts`
 * of the node repository, and the two have to be kept in step.
 */

type Schema = Record<string, unknown>;
type Parameter = { name: string; in: "path" | "query"; required?: boolean; description: string; schema: Schema };
type Response = { description: string; content?: Record<string, { schema: Schema }> };
type Operation = {
  operationId: string;
  tags: string[];
  summary: string;
  description: string;
  parameters: Parameter[];
  requestBody?: { required: true; content: { "application/json": { schema: Schema } } };
  responses: Record<string, Response>;
  security?: Array<Record<string, string[]>>;
};

export interface NodeOpenApiDocument {
  openapi: "3.1.0";
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string; description: string; variables: Record<string, Schema> }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, Partial<Record<"get" | "post" | "put" | "delete", Operation>>>;
  components: { schemas: Record<string, Schema>; securitySchemes: Record<string, Schema> };
  "x-websocket": Schema;
}

const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });
const json = (description: string, schema: Schema): Response => ({ description, content: { "application/json": { schema } } });
const text = (description: string): Response => ({ description, content: { "text/plain": { schema: { type: "string" } } } });
const sse = (description: string): Response => ({ description, content: { "text/event-stream": { schema: { type: "string" } } } });
const err = (description: string): Response => json(description, ref("NodeError"));
const nullable = (type: string): Schema => ({ oneOf: [{ type }, { type: "null" }] });

const job: Parameter = { name: "job", in: "path", required: true, description: "The job's address.", schema: ref("Address") };
const group: Parameter = { name: "group", in: "path", required: true, description: "A group of the job definition.", schema: { type: "string" } };
const op: Parameter = { name: "op", in: "path", required: true, description: "An operation id within the job definition.", schema: { type: "string" } };
const interval: Parameter = { name: "interval", in: "query", description: "Seconds between samples.", schema: { type: "integer", minimum: 1 } };
const millis = (name: string, description: string): Parameter => ({ name, in: "query", description, schema: { type: "integer" } });

const OWNER = [{ NosanaAuthorization: [] }];
const NOT_FOUND = err("No running job with that address, or the id is not part of it.");
const UNAUTHORIZED = err("The authorization header is missing, invalid, or not signed by the job's owner.");
const NO_SSH_JOB = err("No active job with SSH access.");
const NOT_APPLIED = err("The node could not apply the change.");
const jobErrors = { "400": NOT_FOUND, "401": UNAUTHORIZED };

function operation(
  operationId: string,
  tag: "Node" | "Job" | "SSH",
  summary: string,
  description: string,
  responses: Record<string, Response>,
  extra: { params?: Parameter[]; body?: Schema; public?: boolean } = {},
): Operation {
  return {
    operationId,
    tags: [tag],
    summary,
    description,
    parameters: extra.params ?? [],
    ...(extra.body ? { requestBody: { required: true, content: { "application/json": { schema: extra.body } } } } : {}),
    responses,
    security: extra.public ? [] : OWNER,
  };
}

/** What the node itself defines; everything a job definition or flow contains comes from typia below. */
const ownSchemas: Record<string, Schema> = {
  Address: { type: "string", pattern: SOLANA_ADDRESS_PATTERN, description: "A Solana address in base58." },
  NodeError: {
    description: "The node answers failures with a sentence or with `{ error }`.",
    oneOf: [{ type: "string" }, { type: "object", required: ["error"], properties: { error: { type: "string" } } }],
  },
  NodeInfo: {
    type: "object",
    required: ["state", "info", "resources"],
    additionalProperties: true,
    properties: {
      state: { type: "string", description: "What the node is doing right now, as classified by its monitor." },
      info: {
        type: "object",
        additionalProperties: true,
        properties: {
          gpus: {
            type: "object",
            additionalProperties: true,
            properties: {
              devices: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true,
                  properties: { index: { type: "integer" }, name: { type: "string" }, uuid: { type: "string" }, memory: {}, network_architecture: {} },
                },
              },
            },
          },
          network: { type: "object", additionalProperties: true, description: "Network details with the IP address redacted." },
        },
      },
      resources: {
        type: "object",
        required: ["images", "volumes"],
        properties: { images: { type: "array", items: { type: "string" } }, volumes: { type: "array", items: { type: "string" } } },
      },
    },
  },
  OpStateSummary: {
    type: "object",
    description: "An operation's state as the info stream sends it: `OpState` without its logs and provider handle.",
    properties: {
      operationId: nullable("string"),
      group: nullable("string"),
      status: nullable("string"),
      startTime: nullable("integer"),
      endTime: nullable("integer"),
      exitCode: nullable("integer"),
      results: { type: "object", additionalProperties: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] } },
      error: { type: "object", required: ["event", "message"], properties: { event: { type: "string" }, message: { type: "string" }, code: { type: "integer" } } },
      diagnostics: { type: "object", required: ["reason"], properties: { reason: ref("DiagnosticsReason"), state: ref("DiagnosticsState") } },
    },
  },
  OperationStatuses: { type: "object", description: "Status per operation, keyed by operation id.", additionalProperties: nullable("string") },
  JobInfo: {
    type: "object",
    description: "One frame of the job info stream: the flow without logs, plus task status.",
    required: ["status", "startTime", "endTime", "errors", "opStates", "operations"],
    properties: {
      status: { type: "string" },
      startTime: { type: "integer" },
      endTime: nullable("integer"),
      errors: { type: "array", items: {} },
      opStates: { type: "array", items: ref("OpStateSummary") },
      secrets: ref("FlowSecrets"),
      operations: {
        oneOf: [
          {
            type: "object",
            required: ["all", "currentGroupStatus"],
            properties: {
              all: { oneOf: [ref("OperationStatuses"), { type: "null" }] },
              currentGroup: { type: "string" },
              currentGroupStatus: { oneOf: [ref("OperationStatuses"), { type: "null" }] },
            },
          },
          { type: "null" },
        ],
      },
    },
  },
  JobEndpoints: {
    type: "object",
    required: ["urls", "status"],
    properties: { urls: ref("JobExposeSecrets"), status: { type: "string", enum: ["ONLINE", "OFFLINE"] } },
  },
  TaskStat: {
    type: "object",
    required: ["opId", "timestamp", "cpu", "memory", "disk", "network"],
    properties: {
      opId: { type: "string" },
      timestamp: { type: "integer", description: "Unix milliseconds." },
      cpu: { type: "object", required: ["cpu_percent"], properties: { cpu_percent: { type: "number" } } },
      memory: {
        type: "object",
        required: ["memory_usage", "memory_limit", "memory_percent"],
        properties: { memory_usage: { type: "number" }, memory_limit: { type: "number" }, memory_percent: { type: "number" } },
      },
      disk: { type: "object", required: ["read", "write"], properties: { read: { type: "number" }, write: { type: "number" } } },
      network: { type: "object", required: ["received", "sent"], properties: { received: { type: "number" }, sent: { type: "number" } } },
    },
  },
  TaskLog: {
    type: "object",
    required: ["opId", "group", "type", "timestamp", "message"],
    properties: { opId: { type: "string" }, group: { type: "string" }, type: { type: "string" }, timestamp: { type: "integer" }, message: {} },
  },
  ActionResult: { type: "object", required: ["message"], properties: { message: { type: "string" } } },
  SshPublicKey: {
    type: "string",
    maxLength: 8192,
    description: "One OpenSSH `authorized_keys` line: algorithm, base64 key material and an optional comment.",
  },
  SshAuthorizationRequest: {
    type: "object",
    required: ["sshPublicKey"],
    properties: {
      sshPublicKey: ref("SshPublicKey"),
      expiresAt: { type: "string", format: "date-time", description: "Omit for access until the key is revoked or the job ends." },
    },
  },
  SshAuthorization: {
    type: "object",
    required: ["job", "sshUser", "authorized"],
    properties: {
      job: ref("Address"),
      sshUser: { type: "string", description: "Always `nosana`; the hostname identifies the job and operation." },
      authorized: { type: "boolean", const: true },
      expiresAt: { type: "string", format: "date-time" },
    },
  },
  SshAuthorizedKey: {
    type: "object",
    required: ["sshPublicKey"],
    properties: { sshPublicKey: ref("SshPublicKey"), expiresAt: { type: "string", format: "date-time", description: "Absent for permanent keys." } },
  },
  SshKeys: {
    type: "object",
    required: ["job", "sshUser", "keys"],
    properties: { job: ref("Address"), sshUser: { type: "string" }, keys: { type: "array", items: ref("SshAuthorizedKey") } },
  },
  SshRevocationRequest: { type: "object", required: ["sshPublicKey"], properties: { sshPublicKey: ref("SshPublicKey") } },
  SshRevocation: {
    type: "object",
    required: ["job", "sshUser", "revoked"],
    properties: { job: ref("Address"), sshUser: { type: "string" }, revoked: { type: "boolean", const: true } },
  },
};

/** OpenAPI component names may only use letters, digits, `.`, `-` and `_`; typia names generic records with more. */
const componentName = (name: string): string => name.replace(/[^a-zA-Z0-9._-]/g, "_");

/** Renames the components in place; the collection is freshly built by typia, so nothing else holds it. */
function withSafeNames(schemas: Record<string, Schema>): Record<string, Schema> {
  rewriteRefs(schemas);
  return Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [componentName(name), schema]));
}

function rewriteRefs(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(rewriteRefs);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  const record = value as Record<string, unknown>;
  for (const [key, entry] of Object.entries(record)) {
    if (key === "$ref" && typeof entry === "string") {
      record[key] = entry.replace(/^#\/components\/schemas\/(.+)$/, (_, name: string) => `#/components/schemas/${componentName(name)}`);
    } else {
      rewriteRefs(entry);
    }
  }
}

let document: NodeOpenApiDocument | undefined;

/** The document, built on first use and then reused. */
export function nodeOpenApiDocument(): NodeOpenApiDocument {
  return (document ??= buildDocument());
}

function buildDocument(): NodeOpenApiDocument {
  /** `JobDefinition`, `FlowState` and everything they reach, straight from the TypeScript types. */
  const jobSchemas = typia.json.schemas<[JobDefinition, FlowState], "3.1">();

  return {
  openapi: "3.1.0",
  info: {
    title: "Nosana Node API",
    version: "1.0.0",
    description:
      "The HTTP API every Nosana node serves on its own host for the jobs it runs. Job routes are authorized with the standard Nosana authorization header signed by the job's owner; nodes never accept API keys. The node also multiplexes WebSocket routes over one socket, described under `x-websocket`.",
  },
  servers: [
    {
      url: "https://{node}.{domain}",
      description: "One node, addressed by its Solana address.",
      variables: {
        node: { default: "NODE_ADDRESS", description: "The node's address." },
        domain: { default: "node.k8s.prd.nos.ci", enum: ["node.k8s.prd.nos.ci", "node.k8s.dev.nos.ci"], description: "Mainnet or devnet nodes." },
      },
    },
  ],
  tags: [
    { name: "Node", description: "About the node itself. Public." },
    { name: "Job", description: "A job the node runs, as the node sees it." },
    { name: "SSH", description: "Which SSH keys may reach a job." },
  ],
  paths: {
    "/": { get: operation("getNodeAddress", "Node", "The node's address", "Answers with the node's own address, as a liveness check.", { "200": text("The node's address.") }, { public: true }) },
    "/node/info": {
      get: operation("getNodeInfo", "Node", "Node info", "What the node is, what it runs on and which images and volumes it holds. Public.", { "200": json("The node's info.", ref("NodeInfo")) }, { public: true }),
    },
    "/job/{job}/info": {
      get: operation(
        "streamJobInfo",
        "Job",
        "Stream job info",
        "Server-sent events: the job's flow without logs plus its task status, sent on open and whenever it changes, until the job ends.",
        { "200": sse("A stream of `JobInfo` frames as unnamed `message` events."), "401": UNAUTHORIZED, "404": NOT_FOUND },
        { params: [job] },
      ),
    },
    "/job/{job}/job-definition": {
      get: operation("getJobDefinition", "Job", "Get the job definition", "The job definition. Fails while the job still waits for one. The node labels the body as text, but it is JSON.", { "200": json("The job definition.", ref("JobDefinition")), ...jobErrors }, { params: [job] }),
      post: operation("setJobDefinition", "Job", "Send the job definition", "Accepted only while the job waits for its definition.", { "200": text("Acknowledged."), ...jobErrors }, { params: [job], body: ref("JobDefinition") }),
    },
    "/job/{job}/results": {
      get: operation(
        "getJobResults",
        "Job",
        "Collect the job results",
        "The finished flow state. Available once the job waits for its result to be collected; collecting it lets the node finish the job. The node labels the body as text, but it is JSON.",
        { "200": json("The flow state.", ref("FlowState")), ...jobErrors },
        { params: [job] },
      ),
    },
    "/job/{job}/ops": { get: operation("getJobOperations", "Job", "Operation statuses", "Status of every operation of the job.", { "200": json("Statuses by operation id.", ref("OperationStatuses")), ...jobErrors }, { params: [job] }) },
    "/job/{job}/ops/{op}": {
      get: operation("getJobOperation", "Job", "Operation status", "Status of one operation.", { "200": json("The operation's status.", { type: "string" }), ...jobErrors, "404": NOT_FOUND }, { params: [job, op] }),
    },
    "/job/{job}/group/current": {
      get: operation("getJobCurrentGroup", "Job", "Current group statuses", "Status of the operations in the group currently running.", { "200": json("Statuses by operation id.", ref("OperationStatuses")), ...jobErrors }, { params: [job] }),
    },
    "/job/{job}/group/{group}": {
      get: operation("getJobGroup", "Job", "Group statuses", "Status of the operations in one group.", { "200": json("Statuses by operation id.", ref("OperationStatuses")), ...jobErrors, "404": NOT_FOUND }, { params: [job, group] }),
    },
    "/job/{job}/group/{group}/restart": {
      post: operation("restartJobGroup", "Job", "Restart a group", "Restarts every operation of the group.", { "202": json("Restart initiated.", ref("ActionResult")), ...jobErrors, "500": err("The restart failed.") }, { params: [job, group] }),
    },
    "/job/{job}/group/{group}/stop": {
      post: operation("stopJobGroup", "Job", "Stop a group", "Stops every operation of the group.", { "200": json("Stopped.", ref("ActionResult")), ...jobErrors, "500": err("The stop failed.") }, { params: [job, group] }),
    },
    "/job/{job}/group/{group}/operation/{op}/restart": {
      post: operation("restartJobOperation", "Job", "Restart an operation", "Restarts one operation of a group.", { "202": json("Restart initiated.", ref("ActionResult")), ...jobErrors, "500": err("The restart failed.") }, { params: [job, group, op] }),
    },
    "/job/{job}/group/{group}/operation/{op}/stop": {
      post: operation("stopJobOperation", "Job", "Stop an operation", "Stops one operation of a group.", { "200": json("Stopped.", ref("ActionResult")), ...jobErrors, "500": err("The stop failed.") }, { params: [job, group, op] }),
    },
    "/job/{job}/endpoints": {
      get: operation(
        "getJobEndpoints",
        "Job",
        "Exposed endpoints",
        "The URLs the job exposes and whether they answer yet.",
        { "200": json("Endpoints and their status.", ref("JobEndpoints")), "400": err("The job exposes no endpoint."), "401": UNAUTHORIZED, "500": err("The node could not read the endpoints.") },
        { params: [job] },
      ),
    },
    "/job/{job}/stats": {
      get: operation(
        "getJobStats",
        "Job",
        "Resource stats",
        "CPU, memory, disk and network samples per operation within a time window.",
        { "200": json("Samples, oldest first.", { type: "array", items: ref("TaskStat") }), "400": err("`start` and `end` must be timestamps in milliseconds."), "401": UNAUTHORIZED, "404": NOT_FOUND },
        { params: [job, interval, millis("start", "Start of the window, Unix milliseconds."), millis("end", "End of the window, Unix milliseconds.")] },
      ),
    },
    "/job/{job}/stats/stream": {
      get: operation(
        "streamJobStats",
        "Job",
        "Stream resource stats",
        "Server-sent events: the latest sample per operation, every `interval` seconds, until the job ends.",
        { "200": sse("A stream of `TaskStat[]` frames as unnamed `message` events."), "401": UNAUTHORIZED, "404": NOT_FOUND },
        { params: [job, interval] },
      ),
    },
    "/job/{job}/stop": { post: operation("stopJob", "Job", "Stop the job", "Asks the node to stop the job.", { "200": text("Stopped."), ...jobErrors, "500": err("The stop failed.") }, { params: [job] }) },
    "/job/{job}/ssh/authorize": {
      post: operation(
        "authorizeJobSshKey",
        "SSH",
        "Grant an SSH key",
        "Lets the key reach the job, permanently or until `expiresAt`. The signature must be the job owner's.",
        {
          "201": json("The key is authorized.", ref("SshAuthorization")),
          "400": err("The key is not a valid OpenSSH public key, or the expiry is invalid."),
          "401": UNAUTHORIZED,
          "404": NO_SSH_JOB,
          "502": NOT_APPLIED,
          "503": err("The SSH provider is not available."),
        },
        { params: [job], body: ref("SshAuthorizationRequest") },
      ),
    },
    "/job/{job}/ssh/keys": {
      get: operation(
        "getJobSshKeys",
        "SSH",
        "List SSH keys",
        "The keys currently allowed to reach the job, with their expiry when temporary.",
        { "200": json("The job's keys.", ref("SshKeys")), "401": UNAUTHORIZED, "404": NO_SSH_JOB, "502": err("The node could not read its keys.") },
        { params: [job] },
      ),
      delete: operation(
        "revokeJobSshKey",
        "SSH",
        "Revoke an SSH key",
        "Removes the key whatever its expiry. Open sessions stay until they disconnect.",
        { "200": json("The key is revoked.", ref("SshRevocation")), "400": err("The key is not a valid OpenSSH public key."), "401": UNAUTHORIZED, "404": NO_SSH_JOB, "502": NOT_APPLIED },
        { params: [job], body: ref("SshRevocationRequest") },
      ),
    },
  },
  components: {
    schemas: { ...withSafeNames(jobSchemas.components.schemas as Record<string, Schema>), ...ownSchemas },
    securitySchemes: {
      NosanaAuthorization: {
        type: "apiKey",
        in: "header",
        name: "authorization",
        description:
          "`message:base58-signature[:timestamp]` as produced by `@nosana/authorization`, signed by the wallet that owns the job. Any message is accepted; a timestamp, when present, must be within the job's timeout.",
      },
    },
  },
  "x-websocket": {
    description:
      "One WebSocket endpoint at the node's origin. The first frame is a JSON handshake `{ path, header, body }` where `header` is the same authorization string the HTTP routes take and `body` names the job; every later frame is `{ path, data }`. Only the terminal takes over the socket for raw frames.",
    routes: {
      "/log": { body: { jobAddress: "Address" }, frames: { path: "log", data: "a log message" }, description: "Node and container logs for basic job posters." },
      "/flog": {
        body: { jobAddress: "Address", "group?": "string", "opId?": "string", "type?": "string" },
        frames: { path: "flog", data: "TaskLog, JSON-encoded" },
        description: "Task manager logs: history first, then live.",
      },
      "/status": { body: { jobAddress: "Address" }, frames: { path: "state", data: "a state message" }, description: "State updates for the job. The node's own signature is accepted as well as the owner's." },
      "/terminal": {
        body: { jobAddress: "Address", message: "the signed grant text", signature: "base64 of the raw 64-byte signature", "op?": "string", "cols?": "integer", "rows?": "integer" },
        frames: {
          client: [{ type: "stdin", data: "string" }, { type: "resize", cols: "integer", rows: "integer" }],
          node: ["binary frames: raw stdout and stderr", { type: "exit", code: "integer or null" }, { type: "error", message: "string" }],
        },
        description:
          "An interactive shell or one operation's tty. The grant is `Nosana Terminal Authorization v1` followed by `job`, `node`, `expiresAt`, optional `op`, `network` and `audience: nosana-web-terminal` lines, valid for at most five minutes, signed by the job's owner.",
      },
    },
  },
  };
}
