/** `JSON.parse` that answers `undefined` instead of throwing for text that is not JSON. */
export function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
