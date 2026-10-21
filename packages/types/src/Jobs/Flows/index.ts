import { DiagnosticsReason } from "../Diagnostics/reason.js";
import { DiagnosticsState } from "../Diagnostics/state.js";
import { JobDefinition } from "../JobDefinition/index.js";
import { Log } from "../Logs/index.js";

export type FlowState = {
  status: string;
  startTime: number;
  endTime: number | null;
  errors?: Array<unknown>;
  opStates: Array<OpState>;
  secrets?: FlowSecrets;
};

export type Flow = {
  id: string;
  jobDefinition: JobDefinition;
  project: string;
  state: FlowState;
};

export interface JobExposeSecrets {
  [exposeId: string]: EndpointSecret;
}

export type EndpointStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export type EndpointSecret = {
  opID: string;
  port: number | string;
  url: string;
  status: EndpointStatus;
};

export type FlowSecrets = {
  urlmode?: 'private' | 'public';
  [jobId: string]: JobExposeSecrets | 'private' | 'public' | undefined;
};

export type OpStateError = {
  event: string;
  message: string;
  code?: number;
};

export type OpState = {
  providerId: string | null;
  operationId: string | null;
  group: string | null;
  status: string | null;
  startTime: number | null;
  endTime: number | null;
  exitCode: number | null;
  logs: Array<Log>;
  results?: {
    [key: string]: string | string[];
  };
  /** Every error the operation hit, in order. */
  errors: Array<OpStateError>;
  /** Single-error form; the node records each error in `errors`. */
  error?: OpStateError;
  diagnostics: {
    reason: DiagnosticsReason;
    state?: DiagnosticsState;
  }
};