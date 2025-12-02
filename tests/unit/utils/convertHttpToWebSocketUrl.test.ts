import { describe, it, expect } from 'vitest';
import { convertHttpToWebSocketUrl } from '../../../src/utils/convertHttpToWebSocketUrl.js';

describe('convertHttpToWebSocketUrl', () => {
  const baseHost = 'api.mainnet-beta.solana.com';
  const port = 8899;

  it('converts HTTPS URL to WSS', () => {
    const httpsUrl = `https://${baseHost}`;
    const result = convertHttpToWebSocketUrl(httpsUrl);

    expect(result).toBe(`wss://${baseHost}/`);
  });

  it('converts HTTP URL to WS', () => {
    const httpUrl = `http://${baseHost}`;
    const result = convertHttpToWebSocketUrl(httpUrl);

    expect(result).toBe(`ws://${baseHost}/`);
  });

  it('preserves port numbers', () => {
    const httpsUrlWithPort = `https://${baseHost}:${port}`;
    const result = convertHttpToWebSocketUrl(httpsUrlWithPort);

    expect(result).toBe(`wss://${baseHost}:${port}/`);
  });

  it('preserves path and query parameters', () => {
    const pathAndQuery = '/rpc?key=value';
    const httpsUrlWithPath = `https://${baseHost}${pathAndQuery}`;
    const result = convertHttpToWebSocketUrl(httpsUrlWithPath);

    expect(result).toBe(`wss://${baseHost}${pathAndQuery}`);
  });

  it('preserves hash fragments', () => {
    const hashFragment = '#fragment';
    const httpsUrlWithHash = `https://${baseHost}${hashFragment}`;
    const result = convertHttpToWebSocketUrl(httpsUrlWithHash);

    expect(result).toBe(`wss://${baseHost}/${hashFragment}`);
  });

  it('handles URLs with authentication', () => {
    const auth = 'user:pass@';
    const httpsUrlWithAuth = `https://${auth}${baseHost}`;
    const result = convertHttpToWebSocketUrl(httpsUrlWithAuth);

    expect(result).toBe(`wss://${auth}${baseHost}/`);
  });

  it('throws error for non-HTTP/HTTPS protocols', () => {
    const wsUrl = `ws://${baseHost}:${port}`;
    expect(() => convertHttpToWebSocketUrl(wsUrl)).toThrow();
  });

  it('throws error for invalid URL', () => {
    const invalidUrl = 'not-a-valid-url';

    expect(() => convertHttpToWebSocketUrl(invalidUrl)).toThrow();
  });

  it('handles case-insensitive protocol matching', () => {
    const httpUrlUpperCase = `HTTP://${baseHost}`;
    const result = convertHttpToWebSocketUrl(httpUrlUpperCase);

    expect(result).toBe(`ws://${baseHost}/`);
  });
});
