import { OPERATION_ID_VALIDATE } from "../index.js";

const validateOperationId = new Function(
  "$input",
  `return ${OPERATION_ID_VALIDATE}`
) as (input: unknown) => boolean;

describe("OperationId", () => {
  it.each([
    "abc",
    "ID-123",
    "foo_bar",
    "UPPERCASE"
  ])("accepts IDs without spaces: %s", (id) => {
    expect(validateOperationId(id)).toBe(true);
  });

  it.each([
    "my id",
    " leading",
    "trailing ",
    "two words here"
  ])("rejects IDs with spaces: %s", (id) => {
    expect(validateOperationId(id)).toBe(false);
  });
});
