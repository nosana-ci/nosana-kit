import { describe, it, test, expect } from 'vitest';
import { NosanaNetwork } from '@nosana/types';

import { getNosanaConfig } from '../../../src/config/utils.js';
import { DEFAULT_CONFIGS } from '../../../src/config/defaultConfigs.js';
import { NosanaError, ErrorCodes } from '../../../src/errors/NosanaError.js';
import type { ClientConfig, PartialClientConfig } from '../../../src/config/types.js';

describe('config/utils', () => {
  describe('getNosanaConfig', () => {
    const base: ClientConfig = DEFAULT_CONFIGS[NosanaNetwork.MAINNET];

    test('when overrides are provided, it should override specified fields while preserving defaults', () => {
      const customRpcEndpoint = 'https://custom.example';
      const customGateway = 'https://custom-gw/ipfs/';
      const customLogLevel = 'debug';

      const custom: PartialClientConfig = {
        solana: { rpcEndpoint: customRpcEndpoint },
        ipfs: { gateway: customGateway },
        logLevel: customLogLevel,
      };

      const merged = getNosanaConfig(NosanaNetwork.MAINNET, custom);

      expect(merged.logLevel).toBe(customLogLevel);
      expect(merged.solana.rpcEndpoint).toBe(customRpcEndpoint);
      expect(merged.solana.cluster).toBe(base.solana.cluster);
      expect(merged.solana.commitment).toBe(base.solana.commitment);
      expect(merged.ipfs.gateway).toBe(customGateway);
      expect(merged.ipfs.api).toBe(base.ipfs.api);
      expect(merged.ipfs.jwt).toBe(base.ipfs.jwt);
    });
  });

  it('returns default MAINNET when not specified', () => {
    const cfg = getNosanaConfig();
    expect(cfg).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
  });

  it('returns DEVNET defaults when specified', () => {
    const cfg = getNosanaConfig(NosanaNetwork.DEVNET);
    expect(cfg).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.DEVNET]);
  });

  it('applies overrides via second argument', () => {
    const overrideRpcEndpoint = 'https://override';
    const cfg = getNosanaConfig(NosanaNetwork.MAINNET, {
      solana: { rpcEndpoint: overrideRpcEndpoint },
    });
    expect(cfg.solana.rpcEndpoint).toBe(overrideRpcEndpoint);
    expect(cfg.solana.cluster).toBe(DEFAULT_CONFIGS[NosanaNetwork.MAINNET].solana.cluster);
  });

  it('throws NosanaError for unsupported network', () => {
    const invalidNetwork = 'invalid' as NosanaNetwork;
    expect(() => getNosanaConfig(invalidNetwork)).toThrow(NosanaError);
    try {
      getNosanaConfig(invalidNetwork);
    } catch (e: any) {
      expect(e.code).toBe(ErrorCodes.INVALID_NETWORK);
    }
  });
});
