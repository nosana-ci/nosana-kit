import { describe, it, expect } from 'vitest';
import { mergeConfigs, getNosanaConfig } from '../src/config/utils.js';
import { DEFAULT_CONFIGS } from '../src/config/defaultConfigs.js';
import { NosanaNetwork, NosanaLogLevel, type ClientConfig, type PartialClientConfig } from '../src/config/types.js';
import { NosanaError, ErrorCodes } from '../src/errors/NosanaError.js';

describe('config/utils', () => {
  describe('mergeConfigs', () => {
    const base: ClientConfig = DEFAULT_CONFIGS[NosanaNetwork.MAINNET];

    it('returns default when custom is undefined', () => {
      const merged = mergeConfigs(base);
      expect(merged).toBe(base); // same object as implementation returns default directly
    });

    it('merges solana/ipfs shallowly and overrides provided fields', () => {
      const custom: PartialClientConfig = {
        solana: { rpcEndpoint: 'https://custom.example' },
        ipfs: { gateway: 'https://custom-gw/ipfs/' },
        logLevel: NosanaLogLevel.DEBUG,
      };
      const merged = mergeConfigs(base, custom);

      // top-level
      expect(merged.logLevel).toBe(NosanaLogLevel.DEBUG);

      // solana merges: endpoint overridden, cluster/commitment remain
      expect(merged.solana.rpcEndpoint).toBe('https://custom.example');
      expect(merged.solana.cluster).toBe(base.solana.cluster);
      expect(merged.solana.commitment).toBe(base.solana.commitment);

      // ipfs merges: gateway overridden, jwt/api remain
      expect(merged.ipfs.gateway).toBe('https://custom-gw/ipfs/');
      expect(merged.ipfs.api).toBe(base.ipfs.api);
      expect(merged.ipfs.jwt).toBe(base.ipfs.jwt);
    });
  });

  describe('getNosanaConfig', () => {
    it('returns default MAINNET when not specified', () => {
      const cfg = getNosanaConfig();
      expect(cfg).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
    });

    it('returns DEVNET defaults when specified', () => {
      const cfg = getNosanaConfig(NosanaNetwork.DEVNET);
      expect(cfg).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.DEVNET]);
    });

    it('applies overrides via second argument', () => {
      const cfg = getNosanaConfig(NosanaNetwork.MAINNET, { solana: { rpcEndpoint: 'https://override' } });
      expect(cfg.solana.rpcEndpoint).toBe('https://override');
      expect(cfg.solana.cluster).toBe(DEFAULT_CONFIGS[NosanaNetwork.MAINNET].solana.cluster);
    });

    it('throws NosanaError for unsupported network', () => {
      expect(() => getNosanaConfig('invalid' as NosanaNetwork)).toThrowError(NosanaError);
      try {
        getNosanaConfig('invalid' as NosanaNetwork);
      } catch (e: any) {
        expect(e.code).toBe(ErrorCodes.INVALID_NETWORK);
      }
    });
  });
});


