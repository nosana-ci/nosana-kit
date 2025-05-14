import { jest } from '@jest/globals';
import { SolanaUtils } from '../SolanaUtils';
import { NosanaClient, NosanaNetwork } from '../../index';
import { NosanaError, ErrorCodes } from '../../errors/NosanaError';

jest.mock('gill', () => {
  const mockRpc = {
    getBalance: jest.fn().mockReturnValue({
      // @ts-expect-error
      send: jest.fn().mockResolvedValue({ value: BigInt(1000) }),
    }),
    getLatestBlockhash: jest.fn().mockReturnValue({
      // @ts-expect-error
      send: jest.fn().mockResolvedValue({ value: 'test-blockhash' }),
    }),
  };
  return {
    createSolanaClient: jest.fn().mockReturnValue({
      rpc: mockRpc,
    }),
    address: jest.fn().mockReturnValue('test-address'),
  };
});

describe('SolanaUtils', () => {
  let client: NosanaClient;
  let utils: SolanaUtils;

  beforeEach(() => {
    client = new NosanaClient(NosanaNetwork.MAINNET, {
      solana: {
        cluster: 'mainnet-beta',
        rpcEndpoint: 'https://test-rpc.com',
        commitment: 'confirmed'
      }
    });
    utils = new SolanaUtils(client);
    jest.clearAllMocks();
  });

  it('should get balance', async () => {
    const balance = await utils.getBalance('test-address');
    expect(balance).toBe(BigInt(1000));
  });

  it('should get latest blockhash', async () => {
    const blockhash = await utils.getLatestBlockhash();
    expect(blockhash).toBe('test-blockhash');
  });
}); 