import { BaseProgram } from '../BaseProgram';
import { NosanaClient, NosanaNetwork } from '../../index';
import { NosanaError, ErrorCodes } from '../../errors/NosanaError';
import { Address } from 'gill';

jest.mock('gill', () => ({
  createSolanaClient: jest.fn().mockReturnValue({
    rpc: {
      getLatestBlockhash: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({ value: 'test-blockhash' }),
      }),
    },
    rpcSubscriptions: {},
    sendAndConfirmTransaction: jest.fn(),
  }),
  address: jest.fn((addr: string) => addr as Address),
}));

class TestProgram extends BaseProgram {
  protected getProgramId(): Address {
    return 'test-program-id' as Address;
  }

  // Expose protected method for testing
  public async testGetStaticAccounts() {
    return this.getStaticAccounts();
  }
}

describe('BaseProgram', () => {
  let client: NosanaClient;
  let program: TestProgram;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new NosanaClient(NosanaNetwork.MAINNET, {
      solana: {
        cluster: 'mainnet-beta',
        rpcEndpoint: 'https://test-rpc.com',
        commitment: 'confirmed'
      }
    });
    program = new TestProgram(client);
  });

  it('should initialize with client', () => {
    expect(program).toBeDefined();
    expect(program['sdk']).toBe(client);
  });

  it('should have getProgramId method', () => {
    expect(program['getProgramId']()).toBe('test-program-id');
  });

  it('should throw error when RPC endpoint is not provided', () => {
    expect(() => {
      new NosanaClient(NosanaNetwork.MAINNET, {
        solana: {
          cluster: 'mainnet-beta',
          rpcEndpoint: '',
          commitment: 'confirmed'
        }
      });
    }).toThrow(new NosanaError('RPC URL is required', ErrorCodes.INVALID_CONFIG));
  });

  describe('getStaticAccounts', () => {
    beforeEach(() => {
      // Mock the solana.pda method
      client.solana.pda = jest.fn()
        .mockResolvedValueOnce('mock-rewards-reflection' as Address)
        .mockResolvedValueOnce('mock-rewards-vault' as Address);
    });

    it('should initialize static accounts on first call', async () => {
      const staticAccounts = await program.testGetStaticAccounts();

      expect(staticAccounts).toEqual({
        rewardsReflection: 'mock-rewards-reflection',
        rewardsVault: 'mock-rewards-vault',
        rewardsProgram: client.config.programs.rewardsAddress,
        jobsProgram: client.config.programs.jobsAddress,
      });

      expect(client.solana.pda).toHaveBeenCalledTimes(2);
      expect(client.solana.pda).toHaveBeenCalledWith(
        ['reflection'],
        client.config.programs.rewardsAddress
      );
      expect(client.solana.pda).toHaveBeenCalledWith(
        [client.config.programs.nosTokenAddress],
        client.config.programs.rewardsAddress
      );
    });

    it('should return cached static accounts on subsequent calls', async () => {
      // First call
      const staticAccounts1 = await program.testGetStaticAccounts();

      // Second call should return cached result
      const staticAccounts2 = await program.testGetStaticAccounts();

      expect(staticAccounts1).toEqual(staticAccounts2);
      expect(client.solana.pda).toHaveBeenCalledTimes(2); // Should not be called again
    });

    it('should handle concurrent calls correctly', async () => {
      // Make multiple concurrent calls
      const promises = [
        program.testGetStaticAccounts(),
        program.testGetStaticAccounts(),
        program.testGetStaticAccounts(),
      ];

      const results = await Promise.all(promises);

      // All results should be the same
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);

      // PDA should only be called once per account type
      expect(client.solana.pda).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during initialization', async () => {
      const mockError = new Error('PDA generation failed');
      client.solana.pda = jest.fn().mockRejectedValue(mockError);

      await expect(program.testGetStaticAccounts()).rejects.toThrow('PDA generation failed');
    });
  });

  describe('SDK access', () => {
    it('should provide access to SDK instance', () => {
      expect(program['sdk']).toBe(client);
      expect(program['sdk'].config).toBeDefined();
      expect(program['sdk'].solana).toBeDefined();
      expect(program['sdk'].logger).toBeDefined();
    });
  });

  describe('Abstract method implementation', () => {
    it('should require getProgramId implementation', () => {
      // This test ensures the abstract method is properly implemented
      expect(typeof program['getProgramId']).toBe('function');
      expect(program['getProgramId']()).toBe('test-program-id');
    });
  });
}); 