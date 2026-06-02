import typia, { type IValidation } from "typia";
import type { CMDArray, CMDString, Env, GPU, Image, Variables, WorkDir } from "../args/index.js";

export interface Global {
  image?: Image;
  gpu?: GPU;
  entrypoint?: CMDString | CMDArray;
  env?: Env;
  work_dir?: WorkDir;
  variables?: Variables
}

export const validateGlobal: (input: unknown) => IValidation<Global> =
  typia.createValidateEquals<Global>();
