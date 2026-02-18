import type { tags } from "typia";

export type RemoveIfEmptyMarker = '__remove-if-empty__';

// Placeholder string for dynamic literals like %%ops.template.results.expose%%
export type LiteralString = string &
  tags.TagBase<{
    kind: 'literalString';
    target: 'string';
    value: 'literalString';
    validate: `
      typeof $input === "string" &&
      /^%%(ops|global).[^%]+%%$/.test($input)
    `;
    message: 'Must be a literal string like %%ops.template.results.expose%%';
  }>;

// Spread marker to inject JSON (array/object) resolved from a placeholder at runtime
export type SpreadMarker = {
  __spread__: LiteralString;
  chunked?: boolean;
} &
  tags.TagBase<{
    kind: 'spreadMarker';
    target: 'object';
    value: 'spreadMarker';
    validate: `
      typeof $input === "object" &&
      $input !== null &&
      !Array.isArray($input) &&
      typeof $input.__spread__ === "string" &&
      /^%%(ops|global).[^%]+%%$/.test($input.__spread__)
    `;
    message: '__spread__ must be a placeholder string';
  }>;