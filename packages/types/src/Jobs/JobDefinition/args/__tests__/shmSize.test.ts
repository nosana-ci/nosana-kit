import { parseShmSize, SHM_SIZE_JSON_PATTERN, SHM_SIZE_VALIDATE } from "../shm_size.js";

const validateShmSize = new Function(
  "$input",
  `return ${SHM_SIZE_VALIDATE}`,
) as (input: unknown) => boolean;

const KiB = 1024;
const MiB = 1024 * KiB;
const GiB = 1024 * MiB;

// Same results as Docker's `--shm-size` (docker/go-units RAMInBytes).
const valid: Array<[string, number]> = [
  ["67108864", 67108864],
  ["1b", 1],
  ["512k", 512 * KiB],
  ["512m", 512 * MiB],
  ["512M", 512 * MiB],
  ["8g", 8 * GiB],
  ["1gb", GiB],
  ["1GB", GiB],
  ["2GiB", 2 * GiB],
  ["2gi", 2 * GiB],
  ["1 g", GiB],
  ["1.5g", 1.5 * GiB],
  ["0.5k", 512],
  ["1t", 1024 * GiB],
];

const invalid: unknown[] = [
  "",
  "0",
  "0g",
  "0.0001",
  "-1g",
  "1x",
  "g",
  "1.g",
  "1,5g",
  "1  g",
  " 1g",
  "1g ",
  "1gbb",
  "1e3",
  "%%global.variables.SHM%%",
  "99999999p",
  2147483648,
  null,
  undefined,
];

describe("shm_size", () => {
  it.each(valid)("accepts %s as %d bytes", (input, bytes) => {
    expect(validateShmSize(input)).toBe(true);
    expect(parseShmSize(input)).toBe(bytes);
    expect(new RegExp(SHM_SIZE_JSON_PATTERN).test(input)).toBe(true);
  });

  it.each(invalid)("rejects %s", (input) => {
    expect(validateShmSize(input)).toBe(false);
    if (typeof input === "string") expect(() => parseShmSize(input)).toThrow(/Invalid shm_size/);
  });

  // The JSON schema pattern checks syntax only; zero and overflow are left to the validator.
  it.each(["", "-1g", "1x", "g", "1.g", "1  g", " 1g", "1gbb", "1e3", "%%global.variables.SHM%%"])(
    "the JSON schema pattern rejects %s",
    (input) => {
      expect(new RegExp(SHM_SIZE_JSON_PATTERN).test(input)).toBe(false);
    },
  );
});
