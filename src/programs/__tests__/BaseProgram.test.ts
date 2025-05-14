import { BaseProgram } from '../BaseProgram';
import { NosanaClient, NosanaNetwork } from '../../index';
import { NosanaError, ErrorCodes } from '../../errors/NosanaError';
import { SolanaUtils } from '../../solana/SolanaUtils';

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
}));

class TestProgram extends BaseProgram {
  protected getProgramId(): string {
    return 'test-program-id';
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
}); 