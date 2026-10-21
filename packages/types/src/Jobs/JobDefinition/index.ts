import type { DeploymentId } from "../../Deployments/index.js";
import type { Global } from "./global/index.js";
import type { Logistics } from "./logistics/index.js";
import type { Meta } from "./meta/index.js";
import type { Ops } from "./operations/index.js";
import type { SSH } from "./ssh/index.js";

export * from "./args/index.js";
export * from "./execution/index.js";
export * from "./global/index.js";
export * from "./logistics/index.js";
export * from "./meta/index.js";
export * from "./operations/index.js";
export * from "./results/index.js";
export * from "./ssh/index.js";

export type JobDefinition = {
  version: string;
  /**
   * @deprecated The execution environment is no longer derived from the job
   * definition — it is the node operator's `--vm`/`--cvm` choice. Retained as
   * an optional, unvalidated field so type-less jobs and legacy jobs still
   * carrying `'container' | 'vm' | 'cvm'` continue to validate. Do not read it.
   */
  type?: string;
  logistics?: Logistics;
  deployment_id?: DeploymentId;
  ssh?: SSH,
  meta?: Meta;
  global?: Global;
  ops: Ops;
};