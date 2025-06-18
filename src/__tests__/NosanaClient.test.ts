import { DEFAULT_CONFIGS, NosanaClient } from '../index';
import { NosanaNetwork, PartialClientConfig } from '../config/types';
import * as path from 'path';

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

  describe('setWallet', () => {
    it('should set wallet from file path', async () => {
      const keypairPath = path.join(__dirname, 'example-keypair.json');

      const wallet = await sdk.setWallet(keypairPath);

      expect(wallet).toBeDefined();
      expect(wallet?.address).toBeDefined();
      expect(typeof wallet?.address).toBe('string');
    });

    it('should set wallet from JSON array string', async () => {
      const jsonArrayString = '[66,240,117,68,169,30,179,62,57,123,28,249,122,218,186,173,196,222,208,58,126,168,32,91,126,64,102,33,220,51,49,97,6,197,228,206,210,117,23,184,89,48,217,110,194,137,242,129,112,23,140,120,148,249,210,18,105,192,40,197,250,132,40,149]';

      const wallet = await sdk.setWallet(jsonArrayString);

      expect(wallet).toBeDefined();
      expect(wallet?.address).toBeDefined();
      expect(typeof wallet?.address).toBe('string');
    });

    it('should set wallet from number array', async () => {
      const numberArray = [66, 240, 117, 68, 169, 30, 179, 62, 57, 123, 28, 249, 122, 218, 186, 173, 196, 222, 208, 58, 126, 168, 32, 91, 126, 64, 102, 33, 220, 51, 49, 97, 6, 197, 228, 206, 210, 117, 23, 184, 89, 48, 217, 110, 194, 137, 242, 129, 112, 23, 140, 120, 148, 249, 210, 18, 105, 192, 40, 197, 250, 132, 40, 149];

      const wallet = await sdk.setWallet(numberArray);

      expect(wallet).toBeDefined();
      expect(wallet?.address).toBeDefined();
      expect(typeof wallet?.address).toBe('string');
    });

    it('should set wallet from base58 string', async () => {
      const base58String = '2Ld9Q8E9TxsSPf9Zkxn55u2EuuXBZUiV3XJf1duTnKmH1GgEfhW4tYoTRh5GKMWSd8j853YrtJMN74hixjLsnkRJ';

      const wallet = await sdk.setWallet(base58String);

      expect(wallet).toBeDefined();
      expect(wallet?.address).toBeDefined();
      expect(typeof wallet?.address).toBe('string');
    });

    it('should set wallet from environment variable', async () => {
      // Set up environment variable
      const originalEnvValue = process.env.TEST_WALLET_KEY;
      process.env.TEST_WALLET_KEY = '[66,240,117,68,169,30,179,62,57,123,28,249,122,218,186,173,196,222,208,58,126,168,32,91,126,64,102,33,220,51,49,97,6,197,228,206,210,117,23,184,89,48,217,110,194,137,242,129,112,23,140,120,148,249,210,18,105,192,40,197,250,132,40,149]';

      try {
        const wallet = await sdk.setWallet('TEST_WALLET_KEY');

        expect(wallet).toBeDefined();
        expect(wallet?.address).toBeDefined();
        expect(typeof wallet?.address).toBe('string');
      } finally {
        // Clean up environment variable
        if (originalEnvValue !== undefined) {
          process.env.TEST_WALLET_KEY = originalEnvValue;
        } else {
          delete process.env.TEST_WALLET_KEY;
        }
      }
    });

    it('should handle invalid wallet data with proper error', async () => {
      await expect(sdk.setWallet('invalid-wallet-data')).rejects.toThrow();
    });

    it('should handle non-existent file path with proper error', async () => {
      const nonExistentPath = path.join(__dirname, 'non-existent-keypair.json');

      await expect(sdk.setWallet(nonExistentPath)).rejects.toThrow();
    });

    it('should handle invalid JSON array string with proper error', async () => {
      const invalidJsonString = '[invalid,json,array]';

      await expect(sdk.setWallet(invalidJsonString)).rejects.toThrow();
    });

    it('should handle invalid number array with proper error', async () => {
      const invalidNumberArray = [1, 2, 3]; // Too short to be a valid keypair

      await expect(sdk.setWallet(invalidNumberArray)).rejects.toThrow();
    });

    it('should handle non-existent environment variable with proper error', async () => {
      await expect(sdk.setWallet('NON_EXISTENT_ENV_VAR')).rejects.toThrow();
    });

    it('should return same address for same keypair data in different formats', async () => {
      const jsonArrayString = '[66,240,117,68,169,30,179,62,57,123,28,249,122,218,186,173,196,222,208,58,126,168,32,91,126,64,102,33,220,51,49,97,6,197,228,206,210,117,23,184,89,48,217,110,194,137,242,129,112,23,140,120,148,249,210,18,105,192,40,197,250,132,40,149]';
      const numberArray = [66, 240, 117, 68, 169, 30, 179, 62, 57, 123, 28, 249, 122, 218, 186, 173, 196, 222, 208, 58, 126, 168, 32, 91, 126, 64, 102, 33, 220, 51, 49, 97, 6, 197, 228, 206, 210, 117, 23, 184, 89, 48, 217, 110, 194, 137, 242, 129, 112, 23, 140, 120, 148, 249, 210, 18, 105, 192, 40, 197, 250, 132, 40, 149];
      const base58String = '2Ld9Q8E9TxsSPf9Zkxn55u2EuuXBZUiV3XJf1duTnKmH1GgEfhW4tYoTRh5GKMWSd8j853YrtJMN74hixjLsnkRJ';

      const wallet1 = await sdk.setWallet(jsonArrayString);
      const wallet2 = await sdk.setWallet(numberArray);
      const wallet3 = await sdk.setWallet(base58String);

      expect(wallet1?.address).toBe(wallet2?.address);
      expect(wallet2?.address).toBe(wallet3?.address);
    });
  });
}); 