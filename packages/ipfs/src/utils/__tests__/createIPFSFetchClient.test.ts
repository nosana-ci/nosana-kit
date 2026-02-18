import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createIPFSFetchClient } from '../createIPFSFetchClient.js';

import type { FetchClient } from '../../types.js';

const baseFetchResponse = {
  ok: true,
  body: {},
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => ({}),
  text: async () => '{}'
}

const TEST_PATH = '/test-path';
const TEST_BODY = { body: 'test' };

describe('createIPFSFetchClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  let client: FetchClient;
  let clientNoJwt: FetchClient;

  it('should create a client with GET and POST methods', () => {
    client = createIPFSFetchClient(global.TEST_IPFS_CONFIG);
    clientNoJwt = createIPFSFetchClient(global.TEST_IPFS_CONFIG_NO_JWT);
    expect(client).toHaveProperty('GET');
    expect(client).toHaveProperty('POST');
  });

  describe('GET', () => {
    it('should make GET request to gateway URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ...baseFetchResponse,
        json: async () => global.TEST_IPFS_RESPONSE,
        text: async () => JSON.stringify(global.TEST_IPFS_RESPONSE)
      } as Response);

      const [data, error] = await client.GET(TEST_PATH);

      expect(error).toBeUndefined();
      expect(data).toEqual(global.TEST_IPFS_RESPONSE);

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.url).toBe(`${global.TEST_IPFS_CONFIG.gateway}${TEST_PATH}`);
    });

    it('should include JWT token in Authorization header', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(baseFetchResponse as Response);

      await client.GET(TEST_PATH);

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    });

    it('should not include Authorization header when JWT is not provided', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(baseFetchResponse as Response);

      await clientNoJwt.GET(TEST_PATH);

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.headers.get('Authorization')).toBeNull();
    });

    it('should return error when response is not ok and has no body', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ...baseFetchResponse,
        ok: false,
        body: null,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found'
      } as Response);

      const [data, error] = await client.GET(TEST_PATH);

      expect(data).toBeUndefined();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('Failed to fetch data from IPFS: 404 Not Found');
    });

    it('should handle fetch errors', async () => {
      const fetchError = new Error('Network error');
      vi.mocked(fetch).mockRejectedValueOnce(fetchError);

      const [data, error] = await client.GET(TEST_PATH);

      expect(data).toBeUndefined();
      expect(error).toBe(fetchError);
    });

    it('should handle text responses when content-type is not JSON', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ...baseFetchResponse, headers: new Headers({ 'content-type': 'text/plain' }), text: async () => 'plain text response' } as Response);

      const [data, error] = await client.GET(TEST_PATH);

      expect(error).toBeUndefined();
      expect(data).toBe('plain text response');
    });
  });

  describe('POST', () => {
    it('should make POST request to API URL with path', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ...baseFetchResponse, json: async () => global.TEST_IPFS_RESPONSE } as Response);

      const [data, error] = await client.POST(TEST_PATH, TEST_BODY);

      expect(error).toBeUndefined();
      expect(data).toEqual(global.TEST_IPFS_RESPONSE);

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.url).toBe(`${global.TEST_IPFS_CONFIG.api}${TEST_PATH}`);
    });

    it('should include request body in POST request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(baseFetchResponse as Response);

      await client.POST(TEST_PATH, TEST_BODY);

      const request = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(request.method).toBe('POST');
    });

    it('should return error on failed POST request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ...baseFetchResponse,
        ok: false,
        body: null,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server Error'
      } as Response);

      const [data, error] = await client.POST(TEST_PATH, TEST_BODY);

      expect(data).toBeUndefined();
      expect(error?.message).toContain('Failed to fetch data from IPFS: 500 Internal Server Error');
    });
  });
});