import type { LogTypeTuple } from "../../Logs/index.js";

export type OperationResult = {
  regex: string;
  logType: LogTypeTuple
}
export type OperationResults = Record<string, string | OperationResult>;