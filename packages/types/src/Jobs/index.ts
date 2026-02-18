import typia, { tags } from "typia";
import { JobDefinition } from "./JobDefinition/index.js";

export * from "./Diagnostics/index.js"
export * from "./Flows/index.js"
export * from "./JobDefinition/index.js"
export * from "./Logs/index.js"

type UniqueById = tags.TagBase<{
  kind: 'uniqueBy';
  target: 'array';
  value: 'id';
  validate: `
    Array.isArray($input) && (()=>{
      const seen = new Set();
      for (const it of $input) {
        if (typeof it?.id !== "string") return false;
        if (seen.has(it.id)) return false;
        seen.add(it.id);
      }
      return true;
    })()
  `;
  message: 'ops[*].id must be unique';
}>;

type JobDefinitionWithRule = Omit<JobDefinition, 'ops'> & {
  ops: JobDefinition['ops'] & UniqueById;
};

export const validateJobDefinition = typia.createValidateEquals<JobDefinitionWithRule>();