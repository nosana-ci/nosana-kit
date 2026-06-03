import typia, { type IValidation } from 'typia';

export type SSH = {
  public_keys?: Array<string>;
};

export const validateSSH: (input: unknown) => IValidation<SSH> =
  typia.createValidateEquals<SSH>();
