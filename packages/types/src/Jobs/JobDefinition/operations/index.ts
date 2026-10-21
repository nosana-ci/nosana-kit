import typia, { type IValidation, tags } from "typia";
import type { ContainerCreateVolume, ContainerRun, VmRunArgs } from "../args/index.js";
import type { Execution } from "../execution/index.js";
import type { OperationResults } from "../results/index.js";
import { GPU_TEE_CONFLICT_VALIDATE, OPERATION_ID_VALIDATE, OPS_UNIQUE_BY_ID_VALIDATE } from "./rules.js";

export * from "./rules.js";

export type OperationArgsMap = {
  'container/run': ContainerRun;
  'container/create-volume': ContainerCreateVolume;
  'vm/run': VmRunArgs;
  'cvm/run': VmRunArgs;
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

/**
 * An op's args cannot set both `gpu` and `trusted_execution_env`.
 *
 * Checked across the ops array because typia does not apply `target: 'object'`
 * tags to an object type, so the rule cannot sit on `ContainerRun` itself.
 */
export type GpuTeeConflict = tags.TagBase<{
  kind: 'gpuTeeConflict';
  target: 'array';
  value: 'gpuTeeConflict';
  validate: typeof GPU_TEE_CONFLICT_VALIDATE;
  message: 'Cannot set both gpu and trusted_execution_env at the same time';
}>;

export type OpsWithRule = Ops & UniqueById & GpuTeeConflict;

export type OperationId = string &
  tags.TagBase<{
    kind: 'operationId';
    target: 'string';
    value: 'operationId';
    validate: typeof OPERATION_ID_VALIDATE;
    message: 'ops[*].id must be a string and not contain spaces or full stops';
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
