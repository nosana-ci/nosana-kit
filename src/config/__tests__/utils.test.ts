import { mergeConfigs, getNosanaConfig } from '../utils';
import { NosanaNetwork, ClientConfig, PartialClientConfig } from '../types';
import { DEFAULT_CONFIGS } from '../defaultConfigs';
import { NosanaError, ErrorCodes } from '../../errors/NosanaError';

// Mock the address function for testing
jest.mock('gill', () => ({
  address: jest.fn((addr: string) => addr),
}));

describe('Config Utils', () => {
  describe('mergeConfigs', () => {
    const defaultConfig: ClientConfig = {
      solana: {
        cluster: 'mainnet-beta',
        rpcEndpoint: 'https://default-rpc.com',
        commitment: 'confirmed',
      },
      ipfs: {
        api: 'https://default-api.com',
        jwt: 'default-jwt',
        gateway: 'https://default-gateway.com',
      },
      programs: {
        nosTokenAddress: 'default-token' as any,
        jobsAddress: 'default-jobs' as any,
        rewardsAddress: 'default-rewards' as any,
        stakeAddress: 'default-stake' as any,
        poolsAddress: 'default-pools' as any,
      },
      logLevel: 'ERROR' as any,
    };

    it('should return default config when no custom config provided', () => {
      const result = mergeConfigs(defaultConfig);
      expect(result).toEqual(defaultConfig);
    });

    it('should return default config when custom config is undefined', () => {
      const result = mergeConfigs(defaultConfig, undefined);
      expect(result).toEqual(defaultConfig);
    });

    it('should merge custom solana config with default', () => {
      const customConfig: PartialClientConfig = {
        solana: {
          rpcEndpoint: 'https://custom-rpc.com',
        },
      };

      const result = mergeConfigs(defaultConfig, customConfig);

      expect(result.solana.rpcEndpoint).toBe('https://custom-rpc.com');
      expect(result.solana.cluster).toBe('mainnet-beta'); // Should keep default
      expect(result.solana.commitment).toBe('confirmed'); // Should keep default
      expect(result.ipfs).toEqual(defaultConfig.ipfs); // Should keep default
    });

    it('should merge partial solana config', () => {
      const customConfig: PartialClientConfig = {
        solana: {
          commitment: 'finalized',
        },
      };

      const result = mergeConfigs(defaultConfig, customConfig);

      expect(result.solana.commitment).toBe('finalized');
      expect(result.solana.rpcEndpoint).toBe('https://default-rpc.com'); // Should keep default
      expect(result.solana.cluster).toBe('mainnet-beta'); // Should keep default
    });

    it('should merge all solana properties', () => {
      const customConfig: PartialClientConfig = {
        solana: {
          cluster: 'devnet',
          rpcEndpoint: 'https://custom-rpc.com',
          commitment: 'finalized',
        },
      };

      const result = mergeConfigs(defaultConfig, customConfig);

      expect(result.solana).toEqual({
        cluster: 'devnet',
        rpcEndpoint: 'https://custom-rpc.com',
        commitment: 'finalized',
      });
    });

    it('should merge top-level properties', () => {
      const customConfig: PartialClientConfig = {
        wallet: {
          signer: 'test-signer' as any,
        },
      };

      const result = mergeConfigs(defaultConfig, customConfig);

      expect(result.wallet).toEqual({ signer: 'test-signer' });
      expect(result.solana).toEqual(defaultConfig.solana); // Should keep default
    });

    it('should handle empty custom config object', () => {
      const customConfig: PartialClientConfig = {};

      const result = mergeConfigs(defaultConfig, customConfig);

      expect(result).toEqual(defaultConfig);
    });
  });

  describe('getNosanaConfig', () => {
    it('should return mainnet config by default', () => {
      const result = getNosanaConfig();
      expect(result).toEqual(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
    });

    it('should return mainnet config when explicitly specified', () => {
      const result = getNosanaConfig(NosanaNetwork.MAINNET);
      expect(result).toEqual(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
    });

    it('should return devnet config when specified', () => {
      const result = getNosanaConfig(NosanaNetwork.DEVNET);
      expect(result).toEqual(DEFAULT_CONFIGS[NosanaNetwork.DEVNET]);
    });

    it('should merge custom config with default network config', () => {
      const customConfig: PartialClientConfig = {
        solana: {
          rpcEndpoint: 'https://custom-mainnet-rpc.com',
        },
      };

      const result = getNosanaConfig(NosanaNetwork.MAINNET, customConfig);

      expect(result.solana.rpcEndpoint).toBe('https://custom-mainnet-rpc.com');
      expect(result.solana.cluster).toBe(DEFAULT_CONFIGS[NosanaNetwork.MAINNET].solana.cluster);
    });

    it('should throw error for unsupported network', () => {
      const invalidNetwork = 'invalid-network' as NosanaNetwork;

      expect(() => {
        getNosanaConfig(invalidNetwork);
      }).toThrow(new NosanaError(`Unsupported Nosana network: ${invalidNetwork}`, ErrorCodes.INVALID_NETWORK));
    });

    it('should handle undefined custom config', () => {
      const result = getNosanaConfig(NosanaNetwork.DEVNET, undefined);
      expect(result).toEqual(DEFAULT_CONFIGS[NosanaNetwork.DEVNET]);
    });
  });
}); 