import { describe, expect, it } from 'vitest';

import { requireFutureSshExpiry } from '../expiry.js';

const now = Date.UTC(2025, 0, 1, 0, 0, 0);

describe('requireFutureSshExpiry', () => {
  it('returns the canonical ISO string for a future UTC timestamp', () => {
    expect(requireFutureSshExpiry('2025-06-01T12:00:00Z', now)).toBe('2025-06-01T12:00:00.000Z');
    expect(requireFutureSshExpiry('2025-06-01T12:00:00.500Z', now)).toBe(
      '2025-06-01T12:00:00.500Z'
    );
  });

  it.each([
    ['a non-string', 42],
    ['a non-UTC offset', '2025-06-01T12:00:00+02:00'],
    ['a date without a time', '2025-06-01'],
  ])('rejects %s as not an ISO 8601 UTC timestamp', (_label, value) => {
    expect(() => requireFutureSshExpiry(value, now)).toThrow('ISO 8601 UTC timestamp');
  });

  it('rejects a timestamp in the past or exactly now', () => {
    expect(() => requireFutureSshExpiry('2024-12-31T23:59:59Z', now)).toThrow('in the future');
    expect(() => requireFutureSshExpiry('2025-01-01T00:00:00Z', now)).toThrow('in the future');
  });

  it('rejects a date JavaScript would normalize', () => {
    expect(() => requireFutureSshExpiry('2025-02-30T00:00:00Z', now)).toThrow('not a valid date');
  });
});
