import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { convertWalletConfigToKeyPairSigner } from '../src/utils/walletConverter.js';
import { KeyPairSigner } from '../src/index.js';
import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';

const keyFile = path.join(__dirname, 'example_solana_key.json');
const expectedAddress = 'TESTtyGRrm5JnuDb1vQs3Jr8GqmSWoiD1iKtsry5C5o';
const keyArray: number[] = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

describe('walletConverter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('passthrough and browser adapter', () => {
    it('passes through an existing KeyPairSigner object unchanged', async () => {
      const existingSigner: any = {
        address: 'EXISTING_SIGNER_ADDRESS',
        signMessages: async (messages: Uint8Array[]) => messages.map(() => new Uint8Array([1])),
        signTransactions: async (txs: any[]) => txs,
      };

      const result = await convertWalletConfigToKeyPairSigner(existingSigner);
      expect(result).toBe(existingSigner);
    });

    it('converts a browser adapter (publicKey + signMessage + signTransaction) to a signer', async () => {
      let signMessageCalls = 0;
      let signTransactionCalls = 0;

      const browserWallet: any = {
        publicKey: { toString: () => expectedAddress },
        signMessage: async (msg: Uint8Array) => { signMessageCalls += 1; return msg; },
        signTransaction: async (tx: any) => { signTransactionCalls += 1; return tx; },
      };

      const signer = await convertWalletConfigToKeyPairSigner(browserWallet);
      expect(signer.address).toBe(expectedAddress);

      await (signer as KeyPairSigner).signMessages([new Uint8Array([1]), new Uint8Array([2]) as any] as any);
      await (signer as KeyPairSigner).signTransactions([{ a: 1 }, { b: 2 }] as any);
      expect(signMessageCalls).toBe(2);
      expect(signTransactionCalls).toBe(2);
    });

    it('browser adapter without signTransaction throws when calling signTransactions', async () => {
      const browserWallet: any = {
        publicKey: { toString: () => expectedAddress },
        signMessage: async (msg: Uint8Array) => msg,
        // no signTransaction
      };

      const signer = await convertWalletConfigToKeyPairSigner(browserWallet);
      expect(signer.address).toBe(expectedAddress);

      await expect((signer as KeyPairSigner).signTransactions([{ a: 1 }] as any))
        .rejects.toThrow('Browser wallet does not support transaction signing');
    });

    it('browser-like object without signMessage/signTransaction is rejected', async () => {
      const badBrowserWallet: any = { publicKey: { toString: () => expectedAddress } };

      await expect(convertWalletConfigToKeyPairSigner(badBrowserWallet))
        .rejects.toMatchObject({ code: 'WALLET_CONVERSION_ERROR' });
    });
  });

  describe('array/JSON/base58 inputs', () => {
    it('accepts a number array keypair', async () => {
      const signer = await convertWalletConfigToKeyPairSigner(keyArray);
      expect(signer.address).toBe(expectedAddress);
    });

    it('accepts a JSON array string keypair', async () => {
      const jsonArrayString = JSON.stringify(keyArray);
      const signer = await convertWalletConfigToKeyPairSigner(jsonArrayString);
      expect(signer.address).toBe(expectedAddress);
    });

    it('accepts a base58 string keypair', async () => {
      const b58 = bs58.encode(new Uint8Array(keyArray));
      const signer = await convertWalletConfigToKeyPairSigner(b58);
      expect(signer.address).toBe(expectedAddress);
    });
  });

  describe('file and environment loaders (Node)', () => {
    const jsonEnvName = 'NOSANA_CONVERTER_JSON';
    const b58EnvName = 'NOSANA_CONVERTER_B58';

    afterEach(() => {
      delete process.env[jsonEnvName];
      delete process.env[b58EnvName];
    });

    it('loads from file path (JSON array)', async () => {
      const signer = await convertWalletConfigToKeyPairSigner(keyFile);
      expect(signer.address).toBe(expectedAddress);
    });

    it('loads from environment variable (JSON array)', async () => {
      process.env[jsonEnvName] = JSON.stringify(keyArray);
      const signer = await convertWalletConfigToKeyPairSigner(jsonEnvName);
      expect(signer.address).toBe(expectedAddress);
    });

    it('loads from environment variable (base58)', async () => {
      process.env[b58EnvName] = bs58.encode(new Uint8Array(keyArray));
      const signer = await convertWalletConfigToKeyPairSigner(b58EnvName);
      expect(signer.address).toBe(expectedAddress);
    });
  });

  describe('invalid inputs', () => {
    it('rejects too-short number array', async () => {
      await expect(convertWalletConfigToKeyPairSigner([1, 2, 3] as any))
        .rejects.toMatchObject({ code: 'WALLET_CONVERSION_ERROR' });
    });

    it('rejects malformed JSON array string', async () => {
      await expect(convertWalletConfigToKeyPairSigner('[1, 2, invalid]'))
        .rejects.toMatchObject({ code: 'WALLET_CONVERSION_ERROR' });
    });

    it('rejects an arbitrary string that is not JSON or base58', async () => {
      await expect(convertWalletConfigToKeyPairSigner('not-a-valid-key-format'))
        .rejects.toMatchObject({ code: 'WALLET_CONVERSION_ERROR' });
    });
  });
});