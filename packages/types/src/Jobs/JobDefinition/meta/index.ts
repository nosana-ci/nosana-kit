import typia, { type IValidation } from "typia";

export type Meta = {
  trigger?: string;
  system_resources?: Record<string, string | number>;
  [key: string]: string | number | Record<string, string | number | Array<string | number>> | Array<string | number> | undefined;
}

export const validateMeta: (input: unknown) => IValidation<Meta> =
  typia.createValidateEquals<Meta>();
