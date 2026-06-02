import typia, { type IValidation, tags } from "typia";
import type { ContainerCreateVolume, ContainerRun } from "../args/index.js";
import type { Execution } from "../execution/index.js";
import type { OperationResults } from "../results/index.js";
import { OPERATION_ID_VALIDATE, OPS_UNIQUE_BY_ID_VALIDATE } from "./rules.js";

export * from "./rules.js";

export type OperationArgsMap = {
  'container/run': ContainerRun;
  'container/create-volume': ContainerCreateVolume;
}

export type OperationType = keyof OperationArgsMap;

export type Ops = Array<Operation<OperationType>>;

export type UniqueById = tags.TagBase<{
  kind: 'uniqueBy';
  target: 'array';
  value: 'id';
  validate: typeof OPS_UNIQUE_BY_ID_VALIDATE;
  message: 'ops[*].id must be unique';
}>;

export type OpsWithRule = Ops & UniqueById;

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

export const validateOperation: (
  input: unknown,
) => IValidation<Operation<OperationType>> =
  typia.createValidateEquals<Operation<OperationType>>();

export const validateOps: (
  input: unknown,
) => IValidation<OpsWithRule> =
  typia.createValidateEquals<OpsWithRule>();
