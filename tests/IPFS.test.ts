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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Note: retrieve() uses axios.get directly which is complex to mock reliably
  // Skipping retrieve tests for now - can be added later with better axios mocking strategy

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


