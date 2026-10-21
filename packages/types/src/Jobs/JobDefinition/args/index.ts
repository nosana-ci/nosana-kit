import typia, { type IValidation } from "typia";
import type { Alias, Aliases } from "./aliases.js";
import type { Authentication } from "./authentication.js";
import type { CMDArray, CMDString } from "./cmd.js";
import type { Env } from "./env.js";
import type { Expose } from "./expose.js";
import type { GPU } from "./gpu.js";
import type { Image } from "./image.js";
import type { Output } from "./output.js";
import type { Private } from "./private.js";
import type { RequiredVRAM } from "./required_vram.js";
import type { Resources } from "./resources.js";
import { RestartPolicy } from "./restart_policy.js";
import type { TrustedExecutionEnv } from "./trusted_execution_env.js";
import type { Variables } from "./variables.js";
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
export * from "./output.js";
export * from "./private.js";
export * from "./required_vram.js";
export * from "./resources.js";
export * from "./restart_policy.js";
export * from "./trusted_execution_env.js";
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
  output?: Output;
  entrypoint?: CMDString | CMDArray;
  env?: Env;
  restart_policy?: RestartPolicy;
  required_vram?: RequiredVRAM;
  private?: Private;
  resources?: Resources;
  authentication?: Authentication;
  trusted_execution_env?: TrustedExecutionEnv;
}

/**
 * Arguments for a `vm/run` / `cvm/run` hypervisor operation — a declarative
 * façade over the VM orchestrator that mirrors `container/run` (the QEMU knobs
 * are hidden). `cvm/run` is the confidential (SEV-SNP) variant and shares this
 * exact arg shape: the operation *key* selects confidentiality, not an argument.
 */
export interface VmRunArgs {
  /** Disk image to fetch and boot (OCI artifact, URL, or IPFS CID). Required. */
  image: Image;
  /** vCPU count. */
  cpu?: number;
  /** Memory — MiB as a number, or a human string like "4G". */
  memory?: number | string;
  /** Root disk size — MiB as a number, or a human string like "20G". */
  disk?: number | string;
  /** Pass a GPU through to the guest (VFIO). */
  gpu?: GPU;
  /** Command to run on boot (delivered via cloud-init / the guest agent). */
  cmd?: string | string[];
  /** Environment variables injected into the guest. */
  env?: Env;
  /** Ports to expose — same grammar as `container/run`. */
  expose?: Expose;
  /** Publish exposed URLs privately (auth-gated) rather than publicly. */
  private?: Private;
  /** Restart policy — same grammar as `container/run`. */
  restart_policy?: RestartPolicy;
}

export interface ContainerCreateVolume {
  name: string
}

export const validateImage: (input: unknown) => IValidation<Image> =
  typia.createValidateEquals<Image>();
export const validateAliases: (input: unknown) => IValidation<Alias | Aliases> =
  typia.createValidateEquals<Alias | Aliases>();
export const validateCmd: (input: unknown) => IValidation<CMDString | CMDArray> =
  typia.createValidateEquals<CMDString | CMDArray>();
export const validateVolumes: (input: unknown) => IValidation<Volume[]> =
  typia.createValidateEquals<Volume[]>();
export const validateExpose: (input: unknown) => IValidation<Expose> =
  typia.createValidateEquals<Expose>();
export const validateGPU: (input: unknown) => IValidation<GPU> =
  typia.createValidateEquals<GPU>();
export const validateWorkDir: (input: unknown) => IValidation<WorkDir> =
  typia.createValidateEquals<WorkDir>();
export const validateEnv: (input: unknown) => IValidation<Env> =
  typia.createValidateEquals<Env>();
export const validateRestartPolicy: (input: unknown) => IValidation<RestartPolicy> =
  typia.createValidateEquals<RestartPolicy>();
export const validatePrivate: (input: unknown) => IValidation<Private> =
  typia.createValidateEquals<Private>();
export const validateResources: (input: unknown) => IValidation<Resources> =
  typia.createValidateEquals<Resources>();
export const validateAuthentication: (input: unknown) => IValidation<Authentication> =
  typia.createValidateEquals<Authentication>();
export const validateVariables: (input: unknown) => IValidation<Variables> =
  typia.createValidateEquals<Variables>();
export const validateContainerRun: (input: unknown) => IValidation<ContainerRun> =
  typia.createValidateEquals<ContainerRun>();
export const validateVmRunArgs: (input: unknown) => IValidation<VmRunArgs> =
  typia.createValidateEquals<VmRunArgs>();
export const validateContainerCreateVolume: (input: unknown) => IValidation<ContainerCreateVolume> =
  typia.createValidateEquals<ContainerCreateVolume>();
