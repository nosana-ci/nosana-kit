/**
 * Exports the built node OpenAPI document to `openapi/node.openapi.json`, the
 * form api-docs, redocly and other tooling consume, and generates
 * `src/Schemas/node.ts` from it. In the generated types `JobDefinition` and
 * `FlowState` are the package's own TypeScript types rather than a re-derivation
 * of their JSON schema, so consumers see one definition of each.
 *
 * Needs `pnpm build` first: the job definition schemas inside the document
 * only exist after typia has run.
 */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import openapiTS, { COMMENT_HEADER, astToString } from "openapi-typescript";
import ts from "typescript";

const dist = resolve(import.meta.dirname, "../dist/Schemas/nodeOpenApi.js");
const { nodeOpenApiDocument } = await import(dist).catch(() => {
  throw new Error(`Cannot read ${dist}: run \`pnpm build\` before \`pnpm generate:node\`.`);
});
const document = nodeOpenApiDocument();

const json = resolve(import.meta.dirname, "../openapi/node.openapi.json");
await writeFile(json, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Wrote ${json}`);

/** Components that already exist as TypeScript types; the generated file points at those. */
const OWN_TYPES = ["JobDefinition", "FlowState"];

const ast = await openapiTS(document, {
  inject: `import type { ${OWN_TYPES.join(", ")} } from "../Jobs/index.js";\n`,
  transform(_schema, { path }) {
    const name = OWN_TYPES.find((type) => path === `#/components/schemas/${type}`);
    return name ? ts.factory.createTypeReferenceNode(name) : undefined;
  },
});

const types = resolve(import.meta.dirname, "../src/Schemas/node.ts");
await writeFile(types, COMMENT_HEADER + astToString(ast));
console.log(`Wrote ${types}`);
