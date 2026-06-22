import { generateIdempotencyKey, IdempotencyCode } from '../idempotency.js';

describe('IdempotencyCode', () => {
  test('it exposes the three control codes by their wire values', () => {
    expect(IdempotencyCode).toEqual({
      IN_PROGRESS: 'IDEMPOTENCY_KEY_IN_PROGRESS',
      EXPIRED: 'IDEMPOTENCY_KEY_EXPIRED',
      PAYLOAD_MISMATCH: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
    });
  });
});

describe('generateIdempotencyKey', () => {
  test('it returns a string', () => {
    expect(typeof generateIdempotencyKey()).toBe('string');
  });

  test('it returns a v4 UUID', () => {
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(generateIdempotencyKey()).toMatch(uuidV4);
  });

  test('it returns a unique value on each call', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateIdempotencyKey()));
    expect(keys.size).toBe(100);
  });
});
