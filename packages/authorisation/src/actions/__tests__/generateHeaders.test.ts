import { generateHeaders } from '../generateHeaders.js';

describe('generateHeader', () => {
  it('should generate authorization header', async () => {
    const header = await generateHeaders('headerMessage', undefined, global.TEST_WALLET);

    expect(header.get('Authorization')).toBe(
      'headerMessage:2k4iSPKEdeKqWPuqhEt4miM17MjPxEDsjpqmE21EVuKM2oo8HwbrtX2UybLJv18FLYWyg9vumxwjzHx6p88Y5nRE',
    );
  });

  test('when setting options, should generate headers with key and value containers separator and time', async () => {
    const header = await generateHeaders(
      'headerMessageWithTime',
      {
        key: 'X-Session-Id',
        separator: '+',
        includeTime: true,
      },
      global.TEST_WALLET,
    );

    expect(header.get('X-Session-Id')).toBe(
      'headerMessageWithTime+4aEr7gDhNdbnpVYkGeiQLpmqCCqbJ2e41pvPSVWcZjTjMxyp4BzecwkchHp6iiHZjGr7Kn9aCawgQY7WFHQqDU9j+1734307200000',
    );
  });
});