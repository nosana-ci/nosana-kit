import { jest } from '@jest/globals';
import { SolanaUtils } from '../SolanaUtils';
import { NosanaClient, NosanaNetwork } from '../../index';
import { NosanaError, ErrorCodes } from '../../errors/NosanaError';

// Mock gill
jest.mock('gill', () => ({
  createSolanaClient: jest.fn().mockReturnValue({
    rpc: {
      getLatestBlockhash: jest.fn(),
    },
    rpcSubscriptions: {},
    sendAndConfirmTransaction: jest.fn(),
  }),
  address: jest.fn((addr: string) => addr),
}));

describe('SolanaUtils', () => {
  let client: NosanaClient;
  let solana: SolanaUtils;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new NosanaClient(NosanaNetwork.MAINNET, {
      solana: {
        cluster: 'mainnet-beta',
        rpcEndpoint: 'https://test-rpc.com',
        commitment: 'confirmed'
      }
    });
    solana = new SolanaUtils(client);
  });

  it('should initialize with client', () => {
    expect(solana).toBeDefined();
    expect(solana.rpc).toBeDefined();
    expect(solana.rpcSubscriptions).toBeDefined();
    expect(solana.sendAndConfirmTransaction).toBeDefined();
  });

  describe('Client properties', () => {
    it('should expose rpc client', () => {
      expect(solana.rpc).toBeDefined();
      expect(typeof solana.rpc.getLatestBlockhash).toBe('function');
    });

    it('should expose rpcSubscriptions client', () => {
      expect(solana.rpcSubscriptions).toBeDefined();
    });

    it('should expose sendAndConfirmTransaction method', () => {
      expect(typeof solana.sendAndConfirmTransaction).toBe('function');
    });
  });
}); 