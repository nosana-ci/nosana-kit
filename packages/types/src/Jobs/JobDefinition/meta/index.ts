import typia, { type IValidation } from "typia";

export type Meta = {
  trigger?: string;
  system_resources?: Record<string, string | number>;
  [key: string]: unknown;
}

export const validateMeta: (input: unknown) => IValidation<Meta> =
  typia.createValidateEquals<Meta>();
