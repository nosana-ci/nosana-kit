// Mock gill first before any imports
jest.mock('gill', () => ({
  address: jest.fn((addr: string) => addr),
  createSolanaClient: jest.fn(),
  generateKeyPairSigner: jest.fn(),
}));

import { jest } from '@jest/globals';

// Mock all external dependencies
jest.mock('../../generated_clients/jobs/index.js');
jest.mock('../../config/index.js');
jest.mock('../../logger/Logger.js');
jest.mock('../../solana/SolanaUtils.js');
jest.mock('bs58', () => ({
  encode: jest.fn().mockReturnValue('mock-base58'),
  decode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
}));
jest.mock('../../ipfs/IPFS.js', () => ({
  IPFS: {
    solHashToIpfsHash: jest.fn().mockReturnValue('mock-ipfs-hash'),
  },
}));

import { JobsProgram, MarketQueueType } from '../JobsProgram';
import { Address } from 'gill';


describe('JobsProgram', () => {
  let jobs: JobsProgram;
  let mockClient: any;
  let mockWallet: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      config: {
        programs: {
          jobsAddress: 'test-jobs-address' as Address,
          nosTokenAddress: 'test-token-address' as Address,
          rewardsAddress: 'test-rewards-address' as Address,
        },
        wallet: undefined, // No wallet by default
        solana: {
          cluster: 'mainnet-beta',
        },
      },
      logger: {
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
      },
      solana: {
        rpc: {},
        pda: jest.fn(),
        getLatestBlockhash: jest.fn(),
        sendAndConfirmTransaction: jest.fn(),
        rpcSubscriptions: {}
      },
    };
    jobs = new JobsProgram(mockClient);

    mockWallet = {
      address: 'mock-wallet-address',
      signTransaction: jest.fn()
    };
    mockClient.wallet = mockWallet;

    // Mock static accounts by spying on the protected method
    jest.spyOn(jobs as any, 'getStaticAccounts').mockResolvedValue({
      jobsProgram: 'mock-jobs-program',
      rewardsReflection: 'mock-rewards-reflection',
      rewardsVault: 'mock-rewards-vault',
      rewardsProgram: 'mock-rewards-program'
    });

    // Mock the client methods
    jest.spyOn(jobs.client, 'getListInstruction').mockReturnValue({
      programAddress: 'mock-program' as any,
      accounts: [] as any,
      data: new Uint8Array([1, 2, 3])
    } as any);

  });

  describe('Basic functionality', () => {
    it('should initialize with client', () => {
      expect(jobs).toBeDefined();
      expect(jobs.client).toBeDefined();
    });

    it('should have getProgramId method', () => {
      expect(jobs['getProgramId']()).toBe('test-jobs-address');
    });
  });

  describe('Transform methods', () => {
    describe('transformJobAccount()', () => {
      it('should transform job account correctly', () => {
        const mockJobAccount = {
          address: 'mock-job-address' as Address,
          data: {
            discriminator: [1, 2, 3],
            market: 'mock-market',
            project: 'mock-project',
            ipfsJob: new Uint8Array([1, 2, 3, 4]),
            ipfsResult: new Uint8Array([5, 6, 7, 8]),
            price: BigInt(1000),
            timeStart: BigInt(123456789),
            timeEnd: BigInt(123456790),
            state: BigInt(1),
            node: 'mock-node',
            stake: BigInt(500),
            payout: BigInt(100),
          }
        };

        const result = jobs.transformJobAccount(mockJobAccount as any);

        expect(result).toEqual({
          address: 'mock-job-address',
          market: 'mock-market',
          project: 'mock-project',
          ipfsJob: 'mock-ipfs-hash',
          ipfsResult: 'mock-ipfs-hash',
          price: 1000,
          timeStart: 123456789,
          timeEnd: 123456790,
          state: 1,
          node: 'mock-node',
          stake: 500,
          payout: 100,
        });
      });
    });

    describe('transformRunAccount()', () => {
      it('should transform run account correctly', () => {
        const mockRunAccount = {
          address: 'mock-run-address' as Address,
          data: {
            discriminator: [1, 2, 3],
            job: 'mock-job',
            node: 'mock-node',
            time: BigInt(123456789),
            version: BigInt(1),
          }
        };

        const result = jobs.transformRunAccount(mockRunAccount as any);

        expect(result).toEqual({
          address: 'mock-run-address',
          job: 'mock-job',
          node: 'mock-node',
          time: 123456789,
          version: 1,
        });
      });
    });

    describe('transformMarketAccount()', () => {
      it('should transform market account correctly', () => {
        const mockMarketAccount = {
          address: 'mock-market-address' as Address,
          data: {
            discriminator: [1, 2, 3],
            project: 'mock-project',
            nodeAccessKey: 'mock-access-key',
            nodeXnosMinimum: BigInt(1000),
            jobPrice: BigInt(500),
            jobTimeout: BigInt(3600),
            jobType: BigInt(1),
            vault: 'mock-vault',
            queueType: MarketQueueType.NODE_QUEUE, // NODE_QUEUE
          }
        };

        const result = jobs.transformMarketAccount(mockMarketAccount as any);

        expect(result).toEqual({
          address: 'mock-market-address',
          project: 'mock-project',
          nodeAccessKey: 'mock-access-key',
          nodeXnosMinimum: 1000,
          jobPrice: 500,
          jobTimeout: 3600,
          jobType: 1,
          vault: 'mock-vault',
          queueType: MarketQueueType.NODE_QUEUE,
        });
      });
    });
  });

  describe('Method availability', () => {
    it('should have all required public methods', () => {
      expect(typeof jobs.get).toBe('function');
      expect(typeof jobs.run).toBe('function');
      expect(typeof jobs.market).toBe('function');
      expect(typeof jobs.multiple).toBe('function');
      expect(typeof jobs.all).toBe('function');
      expect(typeof jobs.runs).toBe('function');
      expect(typeof jobs.markets).toBe('function');
      expect(typeof jobs.post).toBe('function');
      expect(typeof jobs.monitor).toBe('function');
    });

    it('should have transform methods', () => {
      expect(typeof jobs.transformJobAccount).toBe('function');
      expect(typeof jobs.transformRunAccount).toBe('function');
      expect(typeof jobs.transformMarketAccount).toBe('function');
    });
  });
}); 