import { describe, it, expect } from 'vitest';
import {
  convertHttpToWebSocketUrl,
  PROTOCOL,
} from '../../../src/utils/convertHttpToWebSocketUrl.js';
import { NosanaError, ErrorCodes } from '../../../src/errors/NosanaError.js';

describe('convertHttpToWebSocketUrl', () => {
  const baseHost = 'api.mainnet-beta.solana.com';
  const port = 8899;

  it('converts HTTPS URL to WSS', () => {
    const httpsUrl = `${PROTOCOL.HTTPS}://${baseHost}`;
    const result = convertHttpToWebSocketUrl(httpsUrl);

    expect(result).toBe(`${PROTOCOL.WSS}://${baseHost}/`);
  });

  it('converts HTTP URL to WS', () => {
    const httpUrl = `${PROTOCOL.HTTP}://${baseHost}`;
    const result = convertHttpToWebSocketUrl(httpUrl);

    expect(result).toBe(`${PROTOCOL.WS}://${baseHost}/`);
  });

  it('preserves port numbers', () => {
    const httpsUrlWithPort = `${PROTOCOL.HTTPS}://${baseHost}:${port}`;
    const result = convertHttpToWebSocketUrl(httpsUrlWithPort);

    expect(result).toBe(`${PROTOCOL.WSS}://${baseHost}:${port}/`);
  });

  it('preserves path and query parameters', () => {
    const pathAndQuery = '/rpc?key=value';
    const httpsUrlWithPath = `${PROTOCOL.HTTPS}://${baseHost}${pathAndQuery}`;
    const result = convertHttpToWebSocketUrl(httpsUrlWithPath);

    expect(result).toBe(`${PROTOCOL.WSS}://${baseHost}${pathAndQuery}`);
  });

  it('preserves hash fragments', () => {
    const hashFragment = '#fragment';
    const httpsUrlWithHash = `${PROTOCOL.HTTPS}://${baseHost}${hashFragment}`;
    const result = convertHttpToWebSocketUrl(httpsUrlWithHash);

    expect(result).toBe(`${PROTOCOL.WSS}://${baseHost}/${hashFragment}`);
  });

  it('handles URLs with authentication', () => {
    const auth = 'user:pass@';
    const httpsUrlWithAuth = `${PROTOCOL.HTTPS}://${auth}${baseHost}`;
    const result = convertHttpToWebSocketUrl(httpsUrlWithAuth);

    expect(result).toBe(`${PROTOCOL.WSS}://${auth}${baseHost}/`);
  });

  it('throws NosanaError for non-HTTP/HTTPS protocols', () => {
    const wsUrl = `${PROTOCOL.WS}://${baseHost}:${port}`;
    try {
      convertHttpToWebSocketUrl(wsUrl);
    } catch (error) {
      expect(error).toBeInstanceOf(NosanaError);
      expect((error as NosanaError).code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect((error as NosanaError).message).toBe(
        `Unsupported protocol: ${PROTOCOL.WS}:. Only HTTP and HTTPS are supported.`
      );
    }
  });

  it.each([
    { description: 'invalid URL', url: 'not-a-valid-url' },
    { description: 'empty string', url: '' },
    { description: 'null', url: null as unknown as string },
    { description: 'undefined', url: undefined as unknown as string },
  ])('throws TypeError for $description', ({ url }) => {
    expect(() => convertHttpToWebSocketUrl(url)).toThrow(TypeError);
    expect(() => convertHttpToWebSocketUrl(url)).toThrow('Invalid URL');
  });

  it('handles case-insensitive protocol matching', () => {
    const httpUrlUpperCase = `HTTP://${baseHost}`;
    const result = convertHttpToWebSocketUrl(httpUrlUpperCase);

    expect(result).toBe(`${PROTOCOL.WS}://${baseHost}/`);
  });
});
