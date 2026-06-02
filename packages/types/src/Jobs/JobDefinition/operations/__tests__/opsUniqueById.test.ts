import { OPS_UNIQUE_BY_ID_VALIDATE } from "../rules.js";

const validateUniqueById = new Function(
  "$input",
  `return ${OPS_UNIQUE_BY_ID_VALIDATE}`
) as (input: unknown) => boolean;

describe("OPS_UNIQUE_BY_ID_VALIDATE", () => {
  it("accepts an array of ops with unique ids", () => {
    expect(validateUniqueById([{ id: "a" }, { id: "b" }, { id: "c" }])).toBe(true);
  });

  it("accepts an empty array", () => {
    expect(validateUniqueById([])).toBe(true);
  });

  it("rejects duplicate ids", () => {
    expect(validateUniqueById([{ id: "a" }, { id: "a" }])).toBe(false);
  });

  it("rejects an op whose id is not a string", () => {
    expect(validateUniqueById([{ id: 1 }])).toBe(false);
  });

  it("rejects a non-array input", () => {
    expect(validateUniqueById({ id: "a" })).toBe(false);
  });
});
