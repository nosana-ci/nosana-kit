import type { CMDArray, CMDString, Env, GPU, Image, Variables, WorkDir } from "../args/index.js";

export interface Global {
  image?: Image;
  gpu?: GPU;
  entrypoint?: CMDString | CMDArray;
  env?: Env;
  work_dir?: WorkDir;
  variables?: Variables
}