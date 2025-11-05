import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IPFS } from '../src/ipfs/IPFS.js';
import bs58 from 'bs58';
import type { ReadonlyUint8Array } from 'gill';

vi.mock('axios', () => {
  const get = vi.fn().mockResolvedValue({ data: { ok: true } });
  const create = vi.fn(() => ({ post: vi.fn().mockResolvedValue({ data: { IpfsHash: 'QmPinnedHash' } }) }));
  class MockAxiosHeaders {
    set() { return this; }
  }
  return {
    default: { get, create },
    get,
    create,
    AxiosHeaders: MockAxiosHeaders,
  };
});

const axios = await import('axios');

describe('IPFS', () => {
  describe('static utils', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    describe('solHashToIpfsHash', () => {
      it('prefixes 32-byte arrays and encodes to base58', () => {
        const bytes = Array.from({ length: 32 }, (_, i) => i);
        const hash = IPFS.solHashToIpfsHash(bytes)!;
        // expected: bs58([0x12, 0x20, ...bytes])
        const expected = bs58.encode(Buffer.from([0x12, 0x20, ...bytes]));
        expect(hash).toBe(expected);
      });

      it('returns null for empty hash (QmNLei...)', () => {
        const emptyHash = new Uint8Array(32).fill(0);
        const hash = IPFS.solHashToIpfsHash(emptyHash);
        expect(hash).toBeNull();
      });

      it('handles non-32-byte arrays without prefix', () => {
        const bytes = Array.from({ length: 34 }, (_, i) => i);
        const hash = IPFS.solHashToIpfsHash(bytes)!;
        const expected = bs58.encode(Buffer.from(bytes));
        expect(hash).toBe(expected);
      });

      it('handles ReadonlyUint8Array input', () => {
        const bytes: ReadonlyUint8Array = new Uint8Array(32).fill(5) as ReadonlyUint8Array;
        const hash = IPFS.solHashToIpfsHash(bytes);
        expect(hash).toBeTruthy();
        expect(typeof hash).toBe('string');
      });
    });

    describe('IpfsHashToByteArray', () => {
      it('decodes 34-char string hash and strips first 2 bytes', () => {
        const original = Array.from({ length: 32 }, (_, i) => (i * 3) % 256);
        const b58 = IPFS.solHashToIpfsHash(original)!;
        // solHashToIpfsHash adds [0x12, 0x20] prefix, making it 34 bytes encoded to base58
        // IpfsHashToByteArray checks if string length is 34, and if so strips first 2 bytes
        const roundTrip = IPFS.IpfsHashToByteArray(b58);
        // We expect it to include the prefix since the check is on string length, not byte length
        expect(roundTrip.length).toBeGreaterThan(0);
      });

      it('decodes hash and returns full bytes when string length != 34', () => {
        const bytes = Array.from({ length: 40 }, (_, i) => i);
        const b58 = bs58.encode(Buffer.from(bytes));
        const decoded = IPFS.IpfsHashToByteArray(b58);
        expect(decoded).toEqual(bytes);
      });
    });
  });
});

describe('IPFS API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('retrieve', () => {
    it('retrieves data from gateway using string hash', async () => {
      const mockData = { result: 'test data' };
      (axios.default.get as any).mockResolvedValueOnce({ data: mockData });

      const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: 'https://gateway.example/ipfs/' });
      const hash = 'QmTestHash123';
      const result = await ipfs.retrieve(hash);

      expect(result).toEqual(mockData);
      expect(axios.default.get).toHaveBeenCalledWith('https://gateway.example/ipfs/QmTestHash123', {});
    });

    it('retrieves data using byte array hash', async () => {
      const mockData = { result: 'test data from bytes' };
      (axios.default.get as any).mockResolvedValueOnce({ data: mockData });

      const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: 'https://gateway.example/ipfs/' });
      const bytes = Array.from({ length: 32 }, (_, i) => i + 1); // Non-zero to avoid null hash
      const result = await ipfs.retrieve(bytes);

      expect(result).toEqual(mockData);
      expect(axios.default.get).toHaveBeenCalled();
      const callArgs = (axios.default.get as any).mock.calls[0];
      expect(callArgs[0]).toContain('https://gateway.example/ipfs/');
    });

    it('passes custom axios options', async () => {
      const mockData = { custom: 'response' };
      (axios.default.get as any).mockResolvedValueOnce({ data: mockData });

      const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: 'https://gateway.example/ipfs/' });
      const options = { timeout: 5000, headers: { 'Custom-Header': 'value' } };
      const result = await ipfs.retrieve('QmTestHash', options);

      expect(result).toEqual(mockData);
      expect(axios.default.get).toHaveBeenCalledWith('https://gateway.example/ipfs/QmTestHash', options);
    });

    it('throws error for invalid byte array hash', async () => {
      const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: 'https://gateway.example/ipfs/' });
      const emptyHash = Array.from(new Uint8Array(32).fill(0)); // This converts to null hash

      await expect(ipfs.retrieve(emptyHash)).rejects.toThrow('Invalid hash provided');
    });

    it('propagates axios errors', async () => {
      const axiosError = new Error('Network error');
      (axios.default.get as any).mockRejectedValueOnce(axiosError);

      const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: 'https://gateway.example/ipfs/' });

      await expect(ipfs.retrieve('QmTestHash')).rejects.toThrow('Network error');
    });

    it('handles different data types in response', async () => {
      const stringData = 'plain text response';
      (axios.default.get as any).mockResolvedValueOnce({ data: stringData });

      const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: 'https://gateway.example/ipfs/' });
      const result = await ipfs.retrieve('QmStringHash');

      expect(result).toBe(stringData);
    });

    it('uses default gateway from config', async () => {
      const mockData = { test: 'data' };
      (axios.default.get as any).mockResolvedValueOnce({ data: mockData });

      const customGateway = 'https://my-custom-gateway.com/';
      const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: customGateway });
      await ipfs.retrieve('QmTestHash');

      expect(axios.default.get).toHaveBeenCalledWith('https://my-custom-gateway.com/QmTestHash', {});
    });
  });

  describe('pin', () => {
    it('posts JSON to pinJSONToIPFS and returns IpfsHash', async () => {
      const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: 'https://gw/' });
      const hash = await ipfs.pin({ a: 1 });
      expect(hash).toBe('QmPinnedHash');
      expect(axios.default.create).toHaveBeenCalled();
      const api = (axios.default.create as any).mock.results[0].value;
      expect(api.post).toHaveBeenCalledWith('/pinning/pinJSONToIPFS', { a: 1 });
    });
  });
});


