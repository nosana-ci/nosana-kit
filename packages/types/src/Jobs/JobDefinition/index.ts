import type { DeploymentId } from "../../Deployments/index.js";
import type { Global } from "./global/index.js";
import type { Logistics } from "./logistics/index.js";
import type { Meta } from "./meta/index.js";
import type { Ops } from "./operations/index.js";

export * from "./args/index.js";
export * from "./execution/index.js";
export * from "./global/index.js";
export * from "./logistics/index.js";
export * from "./meta/index.js";
export * from "./operations/index.js";
export * from "./results/index.js";

type Version = "0.1"
type JobType = "container";

export type JobDefinition = {
  version: Version;
  type: JobType;
  logistics?: Logistics;
  deployment_id?: DeploymentId;
  meta?: Meta;
  global?: Global;
  ops: Ops;
};