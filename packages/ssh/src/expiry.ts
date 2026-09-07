/** ISO 8601 UTC, seconds precision with optional milliseconds: `2025-01-02T03:04:05Z`. */
const ISO_8601_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/**
 * Validates one SSH grant expiry the way the node's sidecar contract needs it:
 * a strict ISO 8601 UTC timestamp, in the future, that JavaScript does not
 * silently normalize (so `2025-02-30` is rejected rather than rolled forward).
 * Returns the canonical ISO string, or throws.
 */
export function requireFutureSshExpiry(value: unknown, now: number = Date.now()): string {
  if (typeof value !== 'string' || !ISO_8601_UTC.test(value)) {
    throw new Error('SSH expiry must be an ISO 8601 UTC timestamp.');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= now) {
    throw new Error('SSH expiry must be in the future.');
  }
  // A real date round-trips; a normalized one (for example February 30) does not.
  if (date.toISOString().slice(0, 19) !== value.slice(0, 19)) {
    throw new Error('SSH expiry is not a valid date.');
  }
  return date.toISOString();
}
