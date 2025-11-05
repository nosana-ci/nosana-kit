import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IPFS } from '../src/ipfs/IPFS.js';
import bs58 from 'bs58';

vi.mock('axios', async (importOriginal) => {
  const actual: any = await importOriginal();
  const get = vi.fn().mockResolvedValue({ data: { ok: true } });
  const create = vi.fn(() => ({ post: vi.fn().mockResolvedValue({ data: { IpfsHash: 'QmPinnedHash' } }) }));
  const axios = { ...actual.default, get, create };
  return { ...actual, default: axios, get, create } as any;
});

const axiosModule = await import('axios');

describe('IPFS utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('solHashToIpfsHash prefixes 32-byte arrays and encodes to base58', () => {
    const bytes = Array.from({ length: 32 }, (_, i) => i);
    const hash = IPFS.solHashToIpfsHash(bytes)!;
    // expected: bs58([0x12, 0x20, ...bytes])
    const expected = bs58.encode(Buffer.from([0x12, 0x20, ...bytes]));
    expect(hash).toBe(expected);
  });

  it('IpfsHashToByteArray decodes hash (including prefix) back to bytes', () => {
    const original = Array.from({ length: 32 }, (_, i) => (i * 3) % 256);
    const b58 = IPFS.solHashToIpfsHash(original)!;
    const roundTrip = IPFS.IpfsHashToByteArray(b58);
    expect(roundTrip).toEqual([0x12, 0x20, ...original]);
  });
});

describe('IPFS API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Note: retrieve uses axios.get directly; keep it simple to avoid long-running I/O flakiness

  it('pin posts JSON to pinJSONToIPFS and returns IpfsHash', async () => {
    const ipfs = new IPFS({ api: 'https://api.pinata.cloud', jwt: 't', gateway: 'https://gw/' });
    const hash = await ipfs.pin({ a: 1 });
    expect(hash).toBe('QmPinnedHash');
    expect((axiosModule as any).default.create).toHaveBeenCalled();
    const api = (axiosModule as any).default.create.mock.results[0].value;
    expect(api.post).toHaveBeenCalledWith('/pinning/pinJSONToIPFS', { a: 1 });
  });
});


