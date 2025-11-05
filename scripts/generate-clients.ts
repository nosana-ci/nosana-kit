import { createFromRoot } from "codama";
import { rootNodeFromAnchor, AnchorIdl } from "@codama/nodes-from-anchor";
import { renderVisitor as renderJavaScriptVisitor } from "@codama/renderers-js";
import anchorJobsIdl from "../../spl/target/idl/nosana_jobs.json";
import anchorStakingIdl from "../../spl/target/idl/nosana_staking.json";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const codamaJobs = createFromRoot(rootNodeFromAnchor(anchorJobsIdl as AnchorIdl));

codamaJobs.accept(renderJavaScriptVisitor(path.join(__dirname, "..", "src", "generated_clients", "jobs")));

const codamaStaking = createFromRoot(rootNodeFromAnchor(anchorStakingIdl as AnchorIdl));

codamaStaking.accept(renderJavaScriptVisitor(path.join(__dirname, "..", "src", "generated_clients", "staking")));
