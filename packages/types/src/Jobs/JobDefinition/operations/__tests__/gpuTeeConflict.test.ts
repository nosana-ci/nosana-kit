import { GPU_TEE_CONFLICT_VALIDATE } from "../rules.js";

const validateGpuTeeConflict = new Function(
  "$input",
  `return ${GPU_TEE_CONFLICT_VALIDATE}`
) as (input: unknown) => boolean;

describe("GPU_TEE_CONFLICT_VALIDATE", () => {
  it("accepts ops with gpu or trusted_execution_env, but not both", () => {
    expect(
      validateGpuTeeConflict([
        { id: "a", args: { gpu: true } },
        { id: "b", args: { trusted_execution_env: "SEV-SNP" } },
        { id: "c", args: { gpu: false, trusted_execution_env: "SEV-GUEST" } },
        { id: "d", args: { name: "volume" } },
      ]),
    ).toBe(true);
  });

  it("accepts an empty array", () => {
    expect(validateGpuTeeConflict([])).toBe(true);
  });

  it("rejects an op that sets both gpu and trusted_execution_env", () => {
    expect(
      validateGpuTeeConflict([
        { id: "a", args: { gpu: true } },
        { id: "b", args: { gpu: true, trusted_execution_env: "SEV-SNP" } },
      ]),
    ).toBe(false);
  });

  it("rejects a non-array input", () => {
    expect(validateGpuTeeConflict({ args: { gpu: true } })).toBe(false);
  });
});
