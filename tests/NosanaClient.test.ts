import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyPairSigner, NosanaClient, NosanaNetwork } from '../src/index.js';
import { DEFAULT_CONFIGS } from '../src/config/defaultConfigs.js';
import { ErrorCodes, NosanaError } from '../src/errors/NosanaError.js';
import { NosanaLogLevel } from '../src/config/types.js';
import * as fs from 'fs';
import * as path from 'path';

const keyFile = path.join(__dirname, 'example_solana_key.json');
const expectedAddress = 'TESTtyGRrm5JnuDb1vQs3Jr8GqmSWoiD1iKtsry5C5o';
const keyArray: number[] = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

describe('NosanaClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  describe('components', () => {
    it('exposes jobs and solana utilities', () => {
      const sdk = new NosanaClient(NosanaNetwork.MAINNET);
      expect(sdk.jobs).toBeDefined();
      expect(sdk.solana).toBeDefined();
      expect(sdk.logger).toBeDefined();
      expect(sdk.ipfs).toBeDefined();
    });
  });
  describe('network', () => {
    it('initializes with default mainnet config', () => {
      const sdk = new NosanaClient(NosanaNetwork.MAINNET);
      expect(sdk.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
    });

    it('initializes with default devnet config', () => {
      const sdk = new NosanaClient(NosanaNetwork.DEVNET);
      expect(sdk.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.DEVNET]);
    });

    it('throws for unsupported network', () => {
      expect(() => new NosanaClient('invalid-network' as any)).toThrowError(NosanaError);
      try {
        new NosanaClient('invalid-network' as any);
      } catch (e) {
        expect((e as any).code).toBe(ErrorCodes.INVALID_NETWORK);
      }
    });
  });

  describe('config', () => {
    it('merges custom config overrides', () => {
      const rpcEndpoint = 'https://test-rpc.example';
      const sdk = new NosanaClient(NosanaNetwork.MAINNET, {
        solana: { rpcEndpoint }
      });
      expect(sdk.config.solana.rpcEndpoint).toBe(rpcEndpoint);
      expect(sdk.config.solana.cluster).toBe(DEFAULT_CONFIGS[NosanaNetwork.MAINNET].solana.cluster);
    });

    it('merges IPFS overrides', () => {
      const sdk = new NosanaClient(NosanaNetwork.MAINNET, {
        ipfs: { api: 'https://ipfs.example', gateway: 'https://gw.example/ipfs/' }
      });
      expect(sdk.config.ipfs.api).toBe('https://ipfs.example');
      expect(sdk.config.ipfs.gateway).toBe('https://gw.example/ipfs/');
      // jwt should remain from defaults
      expect(sdk.config.ipfs.jwt).toBe(DEFAULT_CONFIGS[NosanaNetwork.MAINNET].ipfs.jwt);
    });

    it('respects log level override', () => {
      const sdk = new NosanaClient(NosanaNetwork.DEVNET, { logLevel: NosanaLogLevel.ERROR });
      expect(sdk.config.logLevel).toBe(NosanaLogLevel.ERROR);
    });
  });

  describe('wallet', () => {
    it('setWallet accepts a number array keypair and stores expected address', async () => {
      const sdk = new NosanaClient(NosanaNetwork.MAINNET);

      const wallet = await sdk.setWallet(keyArray);

      expect(wallet).toBeDefined();
      expect(wallet?.address).toBe(expectedAddress);
      expect(sdk.wallet).toBe(wallet);
    });

    it('constructor triggers setWallet when wallet is provided in config', async () => {
      const setWalletSpy = vi.spyOn(NosanaClient.prototype, 'setWallet');

      const sdk = new NosanaClient(NosanaNetwork.MAINNET, { wallet: JSON.stringify(keyArray) });

      expect(setWalletSpy).toHaveBeenCalledWith(JSON.stringify(keyArray));
      expect(sdk.jobs).toBeDefined();

      setWalletSpy.mockRestore();
    });

    it('setWallet rejects on invalid keypair data with proper error code', async () => {
      const sdk = new NosanaClient(NosanaNetwork.MAINNET);

      await expect(sdk.setWallet([1, 2, 3] as any)).rejects.toMatchObject({ code: ErrorCodes.WALLET_CONVERSION_ERROR });
      expect(sdk.wallet).toBeUndefined();
    });
  });
});


