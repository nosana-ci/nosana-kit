import type { tags } from "typia";

export type UniqueLogTypeTag = tags.TagBase<{
  kind: 'uniqueTuple';
  target: 'array';
  value: 'uniqueTuple';
  validate: `
    Array.isArray($input)
    && $input.length >= 1
    && $input.length <= 4
    && (() => {
      const seen = new Set();
      for (const v of $input) {
        if (seen.has(v)) return false;
        seen.add(v);
      }
      return true;
    })()
  `;
  message: 'logType values must be unique and length 1-4';
}>;

export const StdOptions = {
  stdIn: 'stdin',
  stdOut: 'stdout',
  stdErr: 'stderr',
  nodeErr: 'nodeerr',
} as const;

export type StdOption = typeof StdOptions[keyof typeof StdOptions];

export type LogTypeTuple = StdOption[] & UniqueLogTypeTag;

export type Log = {
  type: StdOption;
  log: string | undefined;
  timestamp: string;
};