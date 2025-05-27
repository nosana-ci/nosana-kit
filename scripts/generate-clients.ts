import { createFromRoot } from "codama";
import { rootNodeFromAnchor, AnchorIdl } from "@codama/nodes-from-anchor";
import { renderVisitor as renderJavaScriptVisitor } from "@codama/renderers-js";
import anchorIdl from "../../spl/target/idl/nosana_jobs.json";
import path from "path";

const codama = createFromRoot(rootNodeFromAnchor(anchorIdl as AnchorIdl));

codama.accept(renderJavaScriptVisitor(path.join(__dirname, "..", "src", "generated_clients", "jobs")));
