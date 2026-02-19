import typia from "typia";

import { JobDefinition, FlowState } from "../Jobs/index.js";

export const jobSchemas = typia.json.schemas<[JobDefinition, FlowState], "3.0">();