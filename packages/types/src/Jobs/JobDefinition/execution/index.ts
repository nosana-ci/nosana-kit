import typia, { type IValidation } from "typia";

export type Execution = {
  group?: string;
  timeout?: number;
  depends_on?: string[];
  stop_if_dependent_stops?: boolean;
};

export const validateExecution: (input: unknown) => IValidation<Execution> =
  typia.createValidateEquals<Execution>();
