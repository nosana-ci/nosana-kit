/**
 * Runs against the built validator: typia only transforms `validateJobDefinition`
 * in the `tsc` build, not under vitest, so build the package before testing
 * (`pnpm --filter @nosana/types build`, as CI does).
 */
import { validateJobDefinition } from "../../../dist/Jobs/index.js";

const definition = (ops: unknown[]) => ({ version: "0.1", type: "container", ops });

const run = { type: "container/run", id: "run", args: { image: "ubuntu" } };
const runWith = (args: object) => definition([{ ...run, args: { ...run.args, ...args } }]);

describe("validateJobDefinition", () => {
  // Accepts everything @nosana/sdk 0.4.87 accepted.
  it("accepts a definition without the deprecated type", () => {
    expect(validateJobDefinition({ version: "0.1", ops: [run] }).success).toBe(true);
  });

  it.each(["container", "vm", "cvm", "anything"])("accepts the deprecated type %s", (type) => {
    expect(validateJobDefinition({ version: "0.1", type, ops: [run] }).success).toBe(true);
  });

  it("rejects a non-string type", () => {
    expect(validateJobDefinition({ version: "0.1", type: 1, ops: [run] }).success).toBe(false);
  });

  it.each(["0.1", "0.2", "1.0"])("accepts version %s", (version) => {
    expect(validateJobDefinition({ version, ops: [run] }).success).toBe(true);
  });

  it("rejects a definition without a version", () => {
    expect(validateJobDefinition({ ops: [run] }).success).toBe(false);
  });

  it.each([
    ["send only", { send: { type: "api", args: { endpoint: "https://example.com" } } }],
    ["receive only", { receive: { type: "api-listen", args: {} } }],
    ["neither", {}],
  ])("accepts logistics with %s", (_, logistics) => {
    expect(validateJobDefinition({ ...definition([run]), logistics }).success).toBe(true);
  });

  it("accepts meta with arbitrary values", () => {
    const meta = { trigger: "cli", flag: true, none: null, nested: { a: { b: [{ c: 1 }] } } };
    expect(validateJobDefinition({ ...definition([run]), meta }).success).toBe(true);
  });

  it("still checks meta.trigger and meta.system_resources", () => {
    expect(validateJobDefinition({ ...definition([run]), meta: { trigger: 1 } }).success).toBe(false);
    expect(
      validateJobDefinition({ ...definition([run]), meta: { system_resources: { a: true } } }).success,
    ).toBe(false);
  });

  it.each([
    ["a top-level range", "8000-8010"],
    ["a range in an array", ["8000-8010", 9090]],
    ["an ExposedPort with a range", [{ port: "8000-8010", type: "api" }]],
  ])("accepts expose with %s", (_, expose) => {
    expect(validateJobDefinition(runWith({ expose })).success).toBe(true);
  });

  it.each(["9000-8000", "8000-8000", "8000:8010"])("rejects the port range %s", (expose) => {
    expect(validateJobDefinition(runWith({ expose })).success).toBe(false);
  });

  it("rejects a number port inside an exposed range", () => {
    expect(validateJobDefinition(runWith({ expose: ["8000-8010", 8005] })).success).toBe(false);
  });

  it("accepts container/run with trusted_execution_env", () => {
    const result = validateJobDefinition(
      definition([
        { type: "container/run", id: "run", args: { image: "ubuntu", trusted_execution_env: "SEV-SNP" } },
      ]),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an unknown trusted_execution_env", () => {
    const result = validateJobDefinition(
      definition([
        { type: "container/run", id: "run", args: { image: "ubuntu", trusted_execution_env: "TDX" } },
      ]),
    );
    expect(result.success).toBe(false);
  });

  it("rejects container/run with both gpu and trusted_execution_env", () => {
    const result = validateJobDefinition(
      definition([
        { type: "container/run", id: "run", args: { image: "ubuntu", gpu: true, trusted_execution_env: "SEV-SNP" } },
      ]),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    // typia reports the failing tag by type name, not by the tag's `message`.
    expect(result.errors).toEqual([
      expect.objectContaining({ path: "$input.ops", expected: expect.stringContaining("GpuTeeConflict") }),
    ]);
  });

  it("accepts container/run with required_vram and output", () => {
    const result = validateJobDefinition(
      definition([
        { type: "container/run", id: "run", args: { image: "ubuntu", gpu: true, required_vram: 24, output: "/out" } },
      ]),
    );
    expect(result.success).toBe(true);
  });

  it.each(["vm/run", "cvm/run"])("accepts a %s op", (type) => {
    const result = validateJobDefinition(
      definition([
        {
          type,
          id: "vm",
          args: {
            image: "https://example.com/disk.qcow2",
            cpu: 4,
            memory: "16G",
            disk: 20480,
            gpu: true,
            cmd: ["python3", "serve.py"],
            env: { MODEL: "llama" },
            expose: 8000,
            private: true,
            restart_policy: "on-failure",
          },
        },
      ]),
    );
    expect(result.success).toBe(true);
  });
});
