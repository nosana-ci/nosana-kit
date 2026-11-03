import type { tags } from "typia";

/**
 * Docker's size grammar for `--shm-size` (docker/go-units `RAMInBytes`): a
 * number, an optional space, then an optional unit `k`, `m`, `g`, `t` or `p`
 * with an optional `i` and `b`, case-insensitive. Units are binary (`1k` is
 * 1024 bytes) and a bare number is bytes.
 */
const SHM_SIZE_PATTERN = /^([0-9]+(?:[.][0-9]+)?) ?([kmgtp])?i?b?$/i;
const SHM_SIZE_UNITS = " kmgtp";

/**
 * The typia predicate for {@link ShmSize}. Kept free of any typia call, like
 * `operations/rules.ts`, so tests can evaluate it directly.
 */
export const SHM_SIZE_VALIDATE = `typeof $input === "string" && (() => {
    const match = /^([0-9]+(?:[.][0-9]+)?) ?([kmgtp])?i?b?$/i.exec($input);
    if (!match) return false;
    const exponent = " kmgtp".indexOf((match[2] || " ").toLowerCase());
    const bytes = Math.trunc(Number(match[1]) * Math.pow(1024, exponent));
    return bytes > 0 && Number.isSafeInteger(bytes);
  })()` as const;

/**
 * The same grammar for the JSON schema, which has no `i` flag. It only checks
 * the syntax; {@link SHM_SIZE_VALIDATE} also requires a positive size.
 */
export const SHM_SIZE_JSON_PATTERN = "^[0-9]+([.][0-9]+)? ?[kKmMgGtTpP]?[iI]?[bB]?$" as const;

/**
 * Size of the container's `/dev/shm`, in Docker's `--shm-size` format:
 * `"512m"`, `"8g"`, `"1gb"`, `"2GiB"`, or a bare byte count such as
 * `"67108864"`. Leave it out for the runtime's default (64 MiB).
 */
export type ShmSize = string &
  tags.TagBase<{
    kind: "shmSize";
    target: "string";
    value: "shmSize";
    validate: typeof SHM_SIZE_VALIDATE;
    message: "shm_size must be a positive size in Docker format, such as \"512m\" or \"8g\"";
    schema: { pattern: typeof SHM_SIZE_JSON_PATTERN };
  }>;

/**
 * Converts a {@link ShmSize} to bytes the way Docker does, for the runtime's
 * `ShmSize` / `shm_size` option. Throws on a value the validator would reject.
 */
export function parseShmSize(value: string): number {
  const match = SHM_SIZE_PATTERN.exec(value);
  if (match) {
    const exponent = SHM_SIZE_UNITS.indexOf((match[2] ?? " ").toLowerCase());
    const bytes = Math.trunc(Number(match[1]) * 1024 ** exponent);
    if (bytes > 0 && Number.isSafeInteger(bytes)) return bytes;
  }
  throw new Error(
    `Invalid shm_size "${value}": expected a positive size in Docker format, such as "512m" or "8g"`,
  );
}
