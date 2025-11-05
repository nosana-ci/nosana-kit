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

  describe('multiple instances', () => {
    it('two clients have independent configs and services', () => {
      const sdkA = new NosanaClient(NosanaNetwork.MAINNET);
      const sdkB = new NosanaClient(NosanaNetwork.DEVNET, { solana: { rpcEndpoint: 'https://custom-devnet.example' } });

      // different instances
      expect(sdkA).not.toBe(sdkB);

      // configs are independent objects
      expect(sdkA.config).not.toBe(sdkB.config);
      expect(sdkA.config.solana.cluster).toBe('mainnet-beta');
      expect(sdkB.config.solana.cluster).toBe('devnet');
      expect(sdkB.config.solana.rpcEndpoint).toBe('https://custom-devnet.example');

      // sub-services are separate
      expect(sdkA.jobs).not.toBe(sdkB.jobs);
      expect(sdkA.solana).not.toBe(sdkB.solana);
      expect(sdkA.ipfs).not.toBe(sdkB.ipfs);
    });

    it('setting wallet on one client does not affect the other', async () => {
      const sdkA = new NosanaClient(NosanaNetwork.MAINNET);
      const sdkB = new NosanaClient(NosanaNetwork.MAINNET);

      const walletA = await sdkA.setWallet(keyArray);

      expect(walletA).toBeDefined();
      expect(sdkA.wallet).toBeDefined();
      expect(sdkB.wallet).toBeUndefined();
    });

    // Note: Logger is a singleton; configs may share references if mutated post-construction.
    // We verify independence via constructor overrides and wallet state in other tests.
  });

  describe('component integration', () => {
    it('jobs program has access to parent SDK config and services', () => {
      const sdk = new NosanaClient(NosanaNetwork.MAINNET);

      // jobs program should be able to access SDK config
      expect(sdk.jobs['sdk']).toBe(sdk);
      expect(sdk.jobs['sdk'].config).toBe(sdk.config);
    });

    it('solana service uses SDK config for RPC endpoint', () => {
      const customRpc = 'https://my-custom-rpc.example';
      const sdk = new NosanaClient(NosanaNetwork.MAINNET, {
        solana: { rpcEndpoint: customRpc }
      });

      expect(sdk.config.solana.rpcEndpoint).toBe(customRpc);
      // SolanaService should use this config
      expect(sdk.solana['sdk'].config.solana.rpcEndpoint).toBe(customRpc);
    });

    it('IPFS service uses SDK config for gateway and API', () => {
      const customGateway = 'https://my-gateway.example/ipfs/';
      const customApi = 'https://my-api.example';
      const sdk = new NosanaClient(NosanaNetwork.MAINNET, {
        ipfs: { gateway: customGateway, api: customApi }
      });

      expect(sdk.ipfs.config.gateway).toBe(customGateway);
      expect(sdk.ipfs.config.api).toBe(customApi);
    });

    it('logger configuration is respected across all components', () => {
      const sdk = new NosanaClient(NosanaNetwork.MAINNET, {
        logLevel: NosanaLogLevel.ERROR
      });

      expect(sdk.config.logLevel).toBe(NosanaLogLevel.ERROR);
      // Logger is singleton, so this affects all instances
      expect(sdk.logger).toBe(sdk.jobs['sdk'].logger);
      expect(sdk.logger).toBe(sdk.solana['sdk'].logger);
    });

    it('wallet set on SDK is accessible to jobs program', async () => {
      const sdk = new NosanaClient(NosanaNetwork.MAINNET);
      const wallet = await sdk.setWallet(keyArray);

      expect(sdk.wallet).toBe(wallet);
      // jobs program should see the same wallet
      expect(sdk.jobs['sdk'].wallet).toBe(wallet);
      expect(sdk.solana['sdk'].wallet).toBe(wallet);
    });
  });
});


