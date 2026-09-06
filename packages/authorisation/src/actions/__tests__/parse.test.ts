import base58 from 'bs58';
import nacl from 'tweetnacl';

import { generate } from '../generate.js';
import { parseAuthorization } from '../parse.js';

describe('parseAuthorization', () => {
  it('returns the message and the raw signature generate signed with', async () => {
    const value = await generate('hello', undefined, global.TEST_WALLET);

    const parsed = parseAuthorization(value);

    expect(parsed.message).toBe('hello');
    expect(parsed.timestamp).toBeUndefined();
    expect(
      nacl.sign.detached.verify(new TextEncoder().encode('hello'), parsed.signature, global.TEST_WALLET_PUBLIC_KEY),
    ).toBe(true);
  });

  it('reads the timestamp and honours a custom separator', async () => {
    const value = await generate('hello', { includeTime: true, separator: '+' }, global.TEST_WALLET);

    expect(parseAuthorization(value, { separator: '+' })).toMatchObject({
      message: 'hello',
      timestamp: new Date('2024-12-16').getTime(),
    });
  });

  it('accepts separators inside the message when the message is expected', async () => {
    const message = 'job: abc\nnode: def';
    const value = await generate(message, undefined, global.TEST_WALLET);

    expect(parseAuthorization(value, { expected_message: message }).message).toBe(message);
    expect(() => parseAuthorization(value, { expected_message: 'other' })).toThrow('Failed to authenticate message.');
  });

  it('rejects strings without a usable signature', () => {
    expect(() => parseAuthorization('hello')).toThrow('Invalid signature.');
    expect(() => parseAuthorization('hello:not-base58!')).toThrow('Invalid signature.');
    expect(() => parseAuthorization(`hello:${base58.encode(new Uint8Array(63))}`)).toThrow('Invalid signature.');
  });
});
