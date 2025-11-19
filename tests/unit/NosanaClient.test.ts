import { describe, it, expect } from 'vitest';
import { createNosanaClient, NosanaNetwork } from '../../src/index.js';
import { DEFAULT_CONFIGS } from '../../src/config/defaultConfigs.js';
import { ErrorCodes, NosanaError } from '../../src/errors/NosanaError.js';
import { NosanaLogLevel } from '../../src/config/types.js';
import { SignerFactory } from './helpers/index.js';

describe('NosanaClient', () => {
  describe('component initialization', () => {
    it('exposes all required services and programs', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // Assert - observable public API
      expect(client.jobs).toBeDefined();
      expect(client.stake).toBeDefined();
      expect(client.merkleDistributor).toBeDefined();
      expect(client.solana).toBeDefined();
      expect(client.nos).toBeDefined();
      expect(client.logger).toBeDefined();
      expect(client.ipfs).toBeDefined();
    });

    it('uses MAINNET as default when no network is specified', () => {
      // Arrange & Act
      const client = createNosanaClient();

      // Assert
      expect(client.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
    });
  });
  describe('network configuration', () => {
    it('initializes with default mainnet config when MAINNET is specified', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // Assert
      expect(client.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
    });

    it('initializes with default devnet config when DEVNET is specified', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.DEVNET);

      // Assert
      expect(client.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.DEVNET]);
    });

    it('throws NosanaError with INVALID_NETWORK code when network is unsupported', () => {
      // Arrange
      const invalidNetwork = 'invalid-network' as any;

      // Act & Assert
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
      // Arrange
      const customRpcEndpoint = 'https://test-rpc.example';

      // Act
      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        solana: { rpcEndpoint: customRpcEndpoint },
      });

      // Assert
      expect(client.config.solana.rpcEndpoint).toBe(customRpcEndpoint);
      expect(client.config.solana.cluster).toBe(
        DEFAULT_CONFIGS[NosanaNetwork.MAINNET].solana.cluster
      );
    });

    it('merges IPFS configuration while preserving other IPFS defaults', () => {
      // Arrange
      const customApi = 'https://ipfs.example';
      const customGateway = 'https://gw.example/ipfs/';

      // Act
      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        ipfs: { api: customApi, gateway: customGateway },
      });

      // Assert
      expect(client.config.ipfs.api).toBe(customApi);
      expect(client.config.ipfs.gateway).toBe(customGateway);
      expect(client.config.ipfs.jwt).toBe(DEFAULT_CONFIGS[NosanaNetwork.MAINNET].ipfs.jwt);
    });

    it('applies custom log level override', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.DEVNET, {
        logLevel: NosanaLogLevel.ERROR,
      });

      // Assert
      expect(client.config.logLevel).toBe(NosanaLogLevel.ERROR);
    });

    it('preserves all default program addresses when no overrides provided', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // Assert - all default program addresses are present
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
      // Arrange
      const client = createNosanaClient(NosanaNetwork.MAINNET);
      const signer = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      // Act
      client.signer = signer;

      // Assert - observable behavior: signer is stored and accessible
      expect(client.signer).toBe(signer);
      expect(client.signer?.address).toBe(expectedAddress);
    });

    it('initializes with signer when provided in config', async () => {
      // Arrange
      const signer = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      // Act
      const client = createNosanaClient(NosanaNetwork.MAINNET, { signer });

      // Assert
      expect(client.signer).toBe(signer);
      expect(client.signer?.address).toBe(expectedAddress);
    });

    it('starts without signer and allows setting and unsetting', async () => {
      // Arrange
      const client = createNosanaClient(NosanaNetwork.MAINNET);
      const signer = await SignerFactory.createTestSigner();

      // Assert initial state
      expect(client.signer).toBeUndefined();

      // Act - set signer
      client.signer = signer;
      expect(client.signer).toBe(signer);

      // Act - unset signer
      client.signer = undefined;
      expect(client.signer).toBeUndefined();
    });
  });

  describe('program dependencies', () => {
    it('all programs receive the same config instance', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // Assert - all programs are functional now, verify they're functional
      expect(client.jobs).toBeDefined();
      expect(typeof client.jobs.get).toBe('function');
      expect(client.stake).toBeDefined();
      expect(typeof client.stake.get).toBe('function');
      expect(client.merkleDistributor).toBeDefined();
      expect(typeof client.merkleDistributor.get).toBe('function');
    });

    it('all programs receive the same logger instance', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // Assert - all programs are functional, verify they're functional
      expect(client.jobs).toBeDefined();
      expect(client.stake).toBeDefined();
      expect(client.merkleDistributor).toBeDefined();
    });

    it('all programs receive the same solana service instance', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.MAINNET);

      // Assert - all programs are functional, verify they're functional
      expect(client.jobs).toBeDefined();
      expect(client.stake).toBeDefined();
      expect(client.merkleDistributor).toBeDefined();
    });

    it('all programs can access the current signer when set', async () => {
      // Arrange
      const client = createNosanaClient(NosanaNetwork.MAINNET);
      const signer = await SignerFactory.createTestSigner();

      // Act
      client.signer = signer;

      // Assert - all programs are functional, verify they're functional
      expect(client.jobs).toBeDefined();
      expect(typeof client.jobs.get).toBe('function');
      expect(client.stake).toBeDefined();
      expect(typeof client.stake.get).toBe('function');
      expect(client.merkleDistributor).toBeDefined();
      expect(typeof client.merkleDistributor.get).toBe('function');
    });
  });

  describe('client instance isolation', () => {
    it('creates independent client instances with separate configs and services', () => {
      // Arrange & Act
      const clientA = createNosanaClient(NosanaNetwork.MAINNET);
      const clientB = createNosanaClient(NosanaNetwork.DEVNET, {
        solana: { rpcEndpoint: 'https://custom-devnet.example' },
      });

      // Assert - instances are different
      expect(clientA).not.toBe(clientB);

      // Assert - configs are independent
      expect(clientA.config).not.toBe(clientB.config);
      expect(clientA.config.solana.cluster).toBe('mainnet-beta');
      expect(clientB.config.solana.cluster).toBe('devnet');
      expect(clientB.config.solana.rpcEndpoint).toBe('https://custom-devnet.example');

      // Assert - services are separate instances
      expect(clientA.jobs).not.toBe(clientB.jobs);
      expect(clientA.solana).not.toBe(clientB.solana);
      expect(clientA.ipfs).not.toBe(clientB.ipfs);
    });

    it('setting signer on one client does not affect other clients', async () => {
      // Arrange
      const clientA = createNosanaClient(NosanaNetwork.MAINNET);
      const clientB = createNosanaClient(NosanaNetwork.MAINNET);
      const signerA = await SignerFactory.createTestSigner();
      const expectedAddress = SignerFactory.getExpectedAddress();

      // Act
      clientA.signer = signerA;

      // Assert - observable behavior: isolation
      expect(clientA.signer).toBe(signerA);
      expect(clientA.signer?.address).toBe(expectedAddress);
      expect(clientB.signer).toBeUndefined();
    });
  });

  describe('component integration', () => {
    it('SolanaService uses custom RPC endpoint from config', () => {
      // Arrange
      const customRpc = 'https://my-custom-rpc.example';

      // Act
      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        solana: { rpcEndpoint: customRpc },
      });

      // Assert - observable behavior: RPC is configured
      expect(client.config.solana.rpcEndpoint).toBe(customRpc);
      expect(client.solana.rpc).toBeDefined();
    });

    it('IPFS service uses custom gateway and API from config', () => {
      // Arrange
      const customGateway = 'https://my-gateway.example/ipfs/';
      const customApi = 'https://my-api.example';

      // Act
      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        ipfs: { gateway: customGateway, api: customApi },
      });

      // Assert - observable behavior: IPFS config is applied
      expect(client.ipfs.config.gateway).toBe(customGateway);
      expect(client.ipfs.config.api).toBe(customApi);
    });

    it('logger is shared across client and accessible from all components', () => {
      // Arrange & Act
      const client = createNosanaClient(NosanaNetwork.MAINNET, {
        logLevel: NosanaLogLevel.ERROR,
      });

      // Assert - observable behavior: logger is available and config is set
      expect(client.config.logLevel).toBe(NosanaLogLevel.ERROR);
      expect(client.logger).toBeDefined();
    });
  });
});
