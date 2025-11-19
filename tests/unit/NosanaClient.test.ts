import { describe, it, expect } from 'vitest';
import { createNosanaClient, NosanaNetwork } from '../../src/index.js';
import { DEFAULT_CONFIGS } from '../../src/config/defaultConfigs.js';
import { ErrorCodes, NosanaError } from '../../src/errors/NosanaError.js';
import { SignerFactory } from './helpers/index.js';

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

  describe('signer management', () => {
    it('allows setting signer after client creation', async () => {
      const client = createNosanaClient(NosanaNetwork.MAINNET);
      const signer = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      client.signer = signer;

      // observable behavior: signer is stored and accessible
      expect(client.signer).toBe(signer);
      expect(client.signer?.address).toBe(expectedAddress);
    });

    it('initializes with signer when provided in config', async () => {
      const signer = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      const client = createNosanaClient(NosanaNetwork.MAINNET, { signer });

      expect(client.signer).toBe(signer);
      expect(client.signer?.address).toBe(expectedAddress);
    });

    it('starts without signer and allows setting and unsetting', async () => {
      const client = createNosanaClient(NosanaNetwork.MAINNET);
      const signer = await SignerFactory.createTestSigner();

      // initial state
      expect(client.signer).toBeUndefined();

      // set signer
      client.signer = signer;
      expect(client.signer).toBe(signer);

      // unset signer
      client.signer = undefined;
      expect(client.signer).toBeUndefined();
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

    it('setting signer on one client does not affect other clients', async () => {
      const clientA = createNosanaClient(NosanaNetwork.MAINNET);
      const clientB = createNosanaClient(NosanaNetwork.MAINNET);
      const signerA = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      clientA.signer = signerA;

      // observable behavior: isolation
      expect(clientA.signer).toBe(signerA);
      expect(clientA.signer?.address).toBe(expectedAddress);
      expect(clientB.signer).toBeUndefined();
    });
  });

  describe('service configuration', () => {
    it('applies custom IPFS configuration to client config', () => {
      const customGateway = 'https://my-gateway.example/ipfs/';
      const customApi = 'https://my-api.example';

      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        ipfs: { gateway: customGateway, api: customApi },
      });

      // Custom IPFS config is applied to ipfs service
      expect(client.ipfs.config.gateway).toBe(customGateway);
      expect(client.ipfs.config.api).toBe(customApi);
    });

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
});
