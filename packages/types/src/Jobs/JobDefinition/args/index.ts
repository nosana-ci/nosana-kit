import type { Alias, Aliases } from "./aliases.js";
import type { Authentication } from "./authentication.js";
import type { CMDArray, CMDString } from "./cmd.js";
import type { Env } from "./env.js";
import type { Expose } from "./expose.js";
import type { GPU } from "./gpu.js";
import type { Image } from "./image.js";
import type { Private } from "./private.js";
import type { Resources } from "./resources.js";
import { RestartPolicy } from "./restart_policy.js";
import type { Volume } from "./volumes.js";
import type { WorkDir } from "./work_dir.js";

export * from "./aliases.js";
export * from "./authentication.js";
export * from "./cmd.js";
export * from "./env.js";
export * from "./expose.js";
export * from "./gpu.js";
export * from "./image.js";
export * from "./literals.js";
export * from "./private.js";
export * from "./resources.js";
export * from "./restart_policy.js";
export * from "./variables.js"
export * from "./volumes.js";
export * from "./work_dir.js";

export interface ContainerRun {
  image: Image;
  aliases?: Alias | Aliases;
  cmd?: CMDString | CMDArray;
  volumes?: Volume[];
  expose?: Expose
  gpu?: GPU;
  work_dir?: WorkDir;
  entrypoint?: CMDString | CMDArray;
  env?: Env;
  restart_policy?: RestartPolicy;
  private?: Private;
  resources?: Resources;
  authentication?: Authentication;
}

export interface ContainerCreateVolume {
  name: string
}