import { describe, it, expect } from 'vitest';
import { NosanaClient, NosanaNetwork } from '../src/index.js';
import { DEFAULT_CONFIGS } from '../src/config/defaultConfigs.js';

describe('NosanaClient', () => {
  it('initializes with default mainnet config', () => {
    const sdk = new NosanaClient(NosanaNetwork.MAINNET);
    expect(sdk.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
  });

  it('initializes with default devnet config', () => {
    const sdk = new NosanaClient(NosanaNetwork.DEVNET);
    expect(sdk.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.DEVNET]);
  });

  it('exposes jobs and solana utilities', () => {
    const sdk = new NosanaClient(NosanaNetwork.MAINNET);
    expect(sdk.jobs).toBeDefined();
    expect(sdk.solana).toBeDefined();
    expect(sdk.logger).toBeDefined();
    expect(sdk.ipfs).toBeDefined();
  });

  it('merges custom config overrides', () => {
    const rpcEndpoint = 'https://test-rpc.example';
    const sdk = new NosanaClient(NosanaNetwork.MAINNET, {
      solana: { rpcEndpoint }
    });
    expect(sdk.config.solana.rpcEndpoint).toBe(rpcEndpoint);
    expect(sdk.config.solana.cluster).toBe(DEFAULT_CONFIGS[NosanaNetwork.MAINNET].solana.cluster);
  });
});


