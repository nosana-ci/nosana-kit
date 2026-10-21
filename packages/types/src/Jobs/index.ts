import typia, { type IValidation } from "typia";
import { JobDefinition } from "./JobDefinition/index.js";
import type { GpuTeeConflict, UniqueById as OpsUniqueById } from "./JobDefinition/operations/index.js";

export * from "./Diagnostics/index.js"
export * from "./Flows/index.js"
export * from "./JobDefinition/index.js"
export * from "./Logs/index.js"

type JobDefinitionWithRule = Omit<JobDefinition, 'ops'> & {
  ops: JobDefinition['ops'] & OpsUniqueById & GpuTeeConflict;
};

export const validateJobDefinition: (
  input: unknown,
) => IValidation<JobDefinitionWithRule> =
  typia.createValidateEquals<JobDefinitionWithRule>();
