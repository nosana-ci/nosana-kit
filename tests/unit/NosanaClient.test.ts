import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NosanaNetwork } from '@nosana/types';

import { SignerFactory } from '../setup/index.js';
import { createNosanaClient } from '../../src/index.js';
import { DEFAULT_CONFIGS } from '../../src/config/defaultConfigs.js';
import { ErrorCodes, NosanaError } from '../../src/errors/NosanaError.js';
import { NosanaAuthorization } from '@nosana/authorization';

// Mock the @nosana/api module to verify createNosanaApi calls
const mockCreateNosanaApi = vi.fn();
vi.mock('@nosana/api', async () => {
  const actual = await vi.importActual('@nosana/api');
  return {
    ...actual,
    createNosanaApi: (...args: any[]) => {
      mockCreateNosanaApi(...args);
      // Return a mock API object
      return {
        jobs: {},
        credits: {},
        markets: {},
      };
    },
  };
});

describe('NosanaClient', () => {
  describe('component initialization', () => {
    it('provides access to all required services and programs', () => {
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // observable public API: all services and programs are accessible
      expect(client.jobs).toBeDefined();
      expect(client.stake).toBeDefined();
      expect(client.merkleDistributor).toBeDefined();
      expect(client.solana).toBeDefined();
      expect(client.nos).toBeDefined();
      expect(client.logger).toBeDefined();
      expect(client.ipfs).toBeDefined();
    });

    it('uses MAINNET as default when no network is specified', () => {
      const client = createNosanaClient();

      expect(client.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
    });
  });
  describe('network configuration', () => {
    it('initializes with default mainnet config when MAINNET is specified', () => {
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      expect(client.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
    });

    it('initializes with default devnet config when DEVNET is specified', () => {
      const client = createNosanaClient(NosanaNetwork.DEVNET);

      expect(client.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.DEVNET]);
    });

    it('throws NosanaError with INVALID_NETWORK code when network is unsupported', () => {
      const invalidNetwork = 'invalid-network' as any;

      expect(() => createNosanaClient(invalidNetwork)).toThrow(NosanaError);

      // Verify error code
      try {
        createNosanaClient(invalidNetwork);
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as NosanaError).code).toBe(ErrorCodes.INVALID_NETWORK);
      }
    });
  });

  describe('custom configuration', () => {
    it('merges custom Solana RPC endpoint while preserving other defaults', () => {
      const customRpcEndpoint = 'https://test-rpc.example';

      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        solana: { rpcEndpoint: customRpcEndpoint },
      });

      expect(client.config.solana.rpcEndpoint).toBe(customRpcEndpoint);
      expect(client.config.solana.cluster).toBe(
        DEFAULT_CONFIGS[NosanaNetwork.MAINNET].solana.cluster
      );
    });

    it('merges IPFS configuration while preserving other IPFS defaults', () => {
      const customApi = 'https://ipfs.example';
      const customGateway = 'https://gw.example/ipfs/';

      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        ipfs: { api: customApi, gateway: customGateway },
      });

      expect(client.config.ipfs.api).toBe(customApi);
      expect(client.config.ipfs.gateway).toBe(customGateway);
      expect(client.config.ipfs.jwt).toBe(DEFAULT_CONFIGS[NosanaNetwork.MAINNET].ipfs.jwt);
    });

    it('applies custom log level override', () => {
      const customLogLevel = 'error';
      const client = createNosanaClient(NosanaNetwork.DEVNET, {
        logLevel: customLogLevel,
      });

      expect(client.config.logLevel).toBe(customLogLevel);
    });

    it('preserves all default program addresses when no overrides provided', () => {
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // all default program addresses are present
      expect(client.config.programs.jobsAddress).toBe(
        DEFAULT_CONFIGS[NosanaNetwork.MAINNET].programs.jobsAddress
      );
      expect(client.config.programs.nosTokenAddress).toBe(
        DEFAULT_CONFIGS[NosanaNetwork.MAINNET].programs.nosTokenAddress
      );
      expect(client.config.programs.stakeAddress).toBe(
        DEFAULT_CONFIGS[NosanaNetwork.MAINNET].programs.stakeAddress
      );
    });
  });

  describe('wallet management', () => {
    it('allows setting wallet after client creation', async () => {
      const client = createNosanaClient(NosanaNetwork.MAINNET);
      const wallet = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      client.wallet = wallet;

      // observable behavior: wallet is stored and accessible
      expect(client.wallet).toBe(wallet);
      expect(client.wallet?.address).toBe(expectedAddress);
    });

    it('initializes with wallet when provided in config', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      const client = createNosanaClient(NosanaNetwork.MAINNET, { wallet });

      expect(client.wallet).toBe(wallet);
      expect(client.wallet?.address).toBe(expectedAddress);
    });

    it('starts without wallet and allows setting and unsetting', async () => {
      const client = createNosanaClient(NosanaNetwork.MAINNET);
      const wallet = await SignerFactory.createTestSigner();

      // initial state
      expect(client.wallet).toBeUndefined();

      // set wallet
      client.wallet = wallet;
      expect(client.wallet).toBe(wallet);

      // unset wallet
      client.wallet = undefined;
      expect(client.wallet).toBeUndefined();
    });
  });

  describe('client instance isolation', () => {
    it('creates independent client instances with separate configs and services', () => {
      const customDevnetRpc = 'https://custom-devnet.example';
      const mainnetCluster = 'mainnet-beta';
      const devnetCluster = 'devnet';

      const clientA = createNosanaClient(NosanaNetwork.MAINNET);
      const clientB = createNosanaClient(NosanaNetwork.DEVNET, {
        solana: { rpcEndpoint: customDevnetRpc },
      });

      // instances are different
      expect(clientA).not.toBe(clientB);

      // configs are independent
      expect(clientA.config).not.toBe(clientB.config);
      expect(clientA.config.solana.cluster).toBe(mainnetCluster);
      expect(clientB.config.solana.cluster).toBe(devnetCluster);
      expect(clientB.config.solana.rpcEndpoint).toBe(customDevnetRpc);

      // services are separate instances
      expect(clientA.jobs).not.toBe(clientB.jobs);
      expect(clientA.solana).not.toBe(clientB.solana);
      expect(clientA.ipfs).not.toBe(clientB.ipfs);
    });

    it('setting wallet on one client does not affect other clients', async () => {
      const clientA = createNosanaClient(NosanaNetwork.MAINNET);
      const clientB = createNosanaClient(NosanaNetwork.MAINNET);
      const walletA = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      clientA.wallet = walletA;

      // observable behavior: isolation
      expect(clientA.wallet).toBe(walletA);
      expect(clientA.wallet?.address).toBe(expectedAddress);
      expect(clientB.wallet).toBeUndefined();
    });
  });

  describe('service configuration', () => {
    it('applies custom log level to logger', () => {
      const customLogLevel = 'error';
      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        logLevel: customLogLevel,
      });

      // observable behavior: config reflects the log level
      expect(client.config.logLevel).toBe(customLogLevel);
      // Logger level is set to the corresponding string level
      expect(client.logger.level).toBe(customLogLevel);
    });
  });

  describe('API configuration', () => {
    beforeEach(() => {
      mockCreateNosanaApi.mockClear();
    });

    afterEach(() => {
      mockCreateNosanaApi.mockClear();
    });

    it('creates API with API key when provided in config', () => {
      const apiKey = 'test-api-key-123';
      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        api: { apiKey },
      });

      // Verify createNosanaApi was called with API key
      expect(mockCreateNosanaApi).toHaveBeenCalledTimes(1);
      expect(mockCreateNosanaApi).toHaveBeenCalledWith(NosanaNetwork.MAINNET, apiKey);

      // API should be created and accessible
      expect(client.api).toBeDefined();
    });

    it('creates API with wallet-based auth when wallet is provided and no API key', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      const client = createNosanaClient(NosanaNetwork.MAINNET, { wallet });

      // Verify createNosanaApi was called with signer auth (wallet-based)
      expect(mockCreateNosanaApi).toHaveBeenCalledTimes(1);
      expect(mockCreateNosanaApi).toHaveBeenCalledWith(
        NosanaNetwork.MAINNET,
        expect.objectContaining({
          identifier: expectedAddress.toString(),
          generate: (client.authorization as NosanaAuthorization).generate,
        })
      );

      // API should be created and accessible
      expect(client.api).toBeDefined();
    });

    it('creates API with wallet-based auth when wallet is set after client creation', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      const client = createNosanaClient(NosanaNetwork.MAINNET);
      expect(client.api).toBeUndefined();
      expect(mockCreateNosanaApi).not.toHaveBeenCalled();

      client.wallet = wallet;

      // Verify createNosanaApi was called with signer auth (wallet-based)
      expect(mockCreateNosanaApi).toHaveBeenCalledTimes(1);
      expect(mockCreateNosanaApi).toHaveBeenCalledWith(
        NosanaNetwork.MAINNET,
        expect.objectContaining({
          identifier: expectedAddress.toString(),
          generate: (client.authorization as NosanaAuthorization).generate,
        })
      );

      // API should now be created and accessible
      expect(client.api).toBeDefined();
    });

    it('prioritizes API key over wallet when both are provided', async () => {
      const apiKey = 'test-api-key-456';
      const wallet = await SignerFactory.createTestSigner();

      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        api: { apiKey },
        wallet,
      });

      // Verify createNosanaApi was called with API key, not wallet
      expect(mockCreateNosanaApi).toHaveBeenCalledTimes(1);
      expect(mockCreateNosanaApi).toHaveBeenCalledWith(NosanaNetwork.MAINNET, apiKey);

      // API should be created (using API key, not wallet)
      expect(client.api).toBeDefined();
    });

    it('does not create API when neither API key nor wallet is provided', () => {
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // Verify createNosanaApi was not called
      expect(mockCreateNosanaApi).not.toHaveBeenCalled();

      // API should not be created
      expect(client.api).toBeUndefined();
    });

    it('removes API when wallet is unset after being set', async () => {
      const wallet = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      const client = createNosanaClient(NosanaNetwork.MAINNET);
      client.wallet = wallet;

      // Verify createNosanaApi was called when wallet was set
      expect(mockCreateNosanaApi).toHaveBeenCalledTimes(1);
      expect(mockCreateNosanaApi).toHaveBeenCalledWith(
        NosanaNetwork.MAINNET,
        expect.objectContaining({
          identifier: expectedAddress.toString(),
          generate: expect.any(Function),
        })
      );

      // API should exist
      expect(client.api).toBeDefined();

      // Unset wallet
      client.wallet = undefined;

      // Verify createNosanaApi was not called again (API is removed, not recreated)
      expect(mockCreateNosanaApi).toHaveBeenCalledTimes(1);

      // API should be removed
      expect(client.api).toBeUndefined();
    });
  });
});
