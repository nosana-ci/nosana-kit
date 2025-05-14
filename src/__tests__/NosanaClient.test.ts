import { DEFAULT_CONFIGS, NosanaClient } from '../index';
import { NosanaNetwork, PartialClientConfig } from '../config/types';

jest.mock('../programs/JobsProgram');
jest.mock('../solana/SolanaUtils');

describe('NosanaClient', () => {
  let sdk: NosanaClient;

  beforeEach(() => {
    sdk = new NosanaClient(NosanaNetwork.MAINNET);
  });

  it('should initialize with default config', () => {

    expect(sdk.config).toMatchObject(DEFAULT_CONFIGS[NosanaNetwork.MAINNET]);
  });

  it('should provide access to Jobs program', () => {
    const jobs = sdk.jobs;
    expect(jobs).toBeDefined();
  });

  it('should provide access to Solana utilities', () => {
    const solana = sdk.solana;
    expect(solana).toBeDefined();
  });

  it('should merge default config with custom config when provided', () => {
    const customConfig: PartialClientConfig = {
      solana: {
        rpcEndpoint: 'https://test-rpc.com',
      },
    }
    const sdkWithCustomConfig = new NosanaClient(NosanaNetwork.MAINNET, customConfig);
    const expectedConfig = DEFAULT_CONFIGS[NosanaNetwork.MAINNET];
    expectedConfig.solana.rpcEndpoint = customConfig.solana!.rpcEndpoint!;
    expect(sdkWithCustomConfig.config).toMatchObject(expectedConfig);
  });
}); 