import type { ContainerCreateVolume, ContainerRun } from "../args/index.js";
import type { Execution } from "../execution/index.js";
import type { OperationResults } from "../results/index.js";
import type { tags } from "typia";

export type OperationArgsMap = {
  'container/run': ContainerRun;
  'container/create-volume': ContainerCreateVolume;
}

export type OperationType = keyof OperationArgsMap;

export type Ops = Array<Operation<OperationType>>;

// Operation ID – mirrors @nosana/sdk/src/types/job.ts
export const OPERATION_ID_VALIDATE = `typeof $input === "string" && !$input.includes(" ")` as const;

export type OperationId = string &
  tags.TagBase<{
    kind: 'operationId';
    target: 'string';
    value: 'operationId';
    validate: typeof OPERATION_ID_VALIDATE;
    message: 'ops[*].id must be a string and not contain spaces';
  }>;

export type Operation<T extends OperationType> = {
  type: OperationType;
  id: OperationId;
  args: OperationArgsMap[T];
  results?: OperationResults;
  execution?: Execution;
};
