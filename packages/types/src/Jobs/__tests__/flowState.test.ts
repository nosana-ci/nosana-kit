/**
 * Runs against the built schemas (typia only runs in the `tsc` build): build the
 * package before testing (`pnpm --filter @nosana/types build`, as CI does).
 */
import { jobSchemas } from "../../../dist/Schemas/job.js";

const schemas = jobSchemas.components.schemas as Record<string, { required?: string[]; properties?: Record<string, unknown> }>;

describe("FlowState schema", () => {
  // Results the node pins use @nosana/sdk 0.4.87's shape: a required `errors` list per op.
  it("requires OpState.errors as a list of OpStateError", () => {
    expect(schemas.OpState?.required).toContain("errors");
    expect(schemas.OpState?.properties?.errors).toEqual(
      expect.objectContaining({ type: "array", items: { $ref: "#/components/schemas/OpStateError" } }),
    );
    expect(schemas.OpStateError?.required).toEqual(expect.arrayContaining(["event", "message"]));
  });

  it("keeps OpState.error optional", () => {
    expect(schemas.OpState?.properties).toHaveProperty("error");
    expect(schemas.OpState?.required).not.toContain("error");
  });
});
