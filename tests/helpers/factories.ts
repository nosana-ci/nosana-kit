/**
 * Test Data Factories
 * 
 * Centralized factories for creating test data with sensible defaults.
 * Makes tests more maintainable and easier to read.
 */

import { vi } from 'vitest';
import { address, type Address, type Account } from 'gill';
import bs58 from 'bs58';
import type { NosanaClient } from '../../src/index.js';
import * as programClient from '../../src/generated_clients/jobs/index.js';
import { JobState, MarketQueueType } from '../../src/programs/JobsProgram.js';

/**
 * Address Factory
 * Creates deterministic addresses for testing
 */
export class AddressFactory {
  private static counter = 0;

  /**
   * Create an address from a seed number
   */
  static create(seed: number = AddressFactory.counter++): Address {
    const bytes = new Uint8Array(32);
    bytes[31] = seed % 256;
    bytes[30] = Math.floor(seed / 256) % 256;
    return address(bs58.encode(bytes));
  }

  /**
   * Reset the counter for consistent test runs
   */
  static reset(): void {
    AddressFactory.counter = 0;
  }

  /**
   * Create a valid base58 address (32 bytes encoded)
   */
  static createValid(): Address {
    // Create a valid 32-byte address
    const bytes = new Uint8Array(32).fill(1);
    return address(bs58.encode(bytes));
  }
}

/**
 * SDK Factory
 * Creates mock NosanaClient instances for testing
 */
export class SdkFactory {
  /**
   * Create a basic SDK with minimal configuration
   */
  static createBasic(overrides?: Partial<NosanaClient>): NosanaClient {
    const validAddr = AddressFactory.createValid();
    const sdk = {
      config: {
        programs: {
          jobsAddress: validAddr,
          nosTokenAddress: validAddr,
          rewardsAddress: validAddr,
        },
      },
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
      },
      solana: {
        rpc: {},
      },
      ...overrides,
    } as unknown as NosanaClient;
    return sdk;
  }

  /**
   * Create an SDK with RPC mocking
   */
  static createWithRpc(): { sdk: NosanaClient; sentArgs: any[] } {
    const sentArgs: any[] = [];
    const rpc = {
      getProgramAccounts: vi.fn((_pid: Address, args: any) => ({
        send: vi.fn(async () => {
          sentArgs.push(args);
          return [];
        }),
      })),
    };
    const sdk = SdkFactory.createBasic({ solana: { rpc } } as any);
    return { sdk, sentArgs };
  }

  /**
   * Create an SDK with WebSocket subscription support
   */
  static createWithSubscriptions(): NosanaClient {
    const sdk = SdkFactory.createBasic();
    (sdk as any).solana.rpcSubscriptions = {
      programNotifications: vi.fn(),
    };
    return sdk;
  }

  /**
   * Create an SDK with a wallet
   */
  static createWithWallet(walletAddress?: Address): NosanaClient {
    const sdk = SdkFactory.createBasic();
    (sdk as any).wallet = {
      address: walletAddress ?? AddressFactory.create(),
      signMessages: vi.fn(),
      signTransactions: vi.fn(),
    };
    return sdk;
  }

  /**
   * Create an SDK for SolanaService tests with RPC client and optional wallet
   */
  static createForSolana(overrides?: { wallet?: any }): NosanaClient {
    return {
      config: {
        solana: { rpcEndpoint: 'https://rpc.example', cluster: 'devnet' },
      },
      logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      wallet: overrides?.wallet,
    } as unknown as NosanaClient;
  }

  /**
   * Create an SDK for BaseProgram tests with PDA mocking
   */
  static createWithMockPda(): NosanaClient {
    const valid = AddressFactory.createValid();
    const pda = vi.fn()
      .mockResolvedValueOnce(valid)
      .mockResolvedValueOnce(valid);
    const sdk = {
      solana: { pda },
      config: {
        programs: {
          rewardsAddress: valid,
          jobsAddress: valid,
          nosTokenAddress: valid,
          stakeAddress: valid,
          poolsAddress: valid,
        },
      },
      logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    } as unknown as NosanaClient;
    return sdk;
  }
}

/**
 * Job Account Factory
 * Creates job account test data
 */
export class JobAccountFactory {
  /**
   * Create a job account with defaults
   */
  static create(overrides?: {
    state?: JobState;
    address?: Address;
    market?: Address;
    node?: Address;
    payer?: Address;
    project?: Address;
    price?: bigint;
    timeStart?: bigint;
    timeEnd?: bigint;
    timeout?: bigint;
    ipfsJob?: Uint8Array;
    ipfsResult?: Uint8Array;
  }): Account<programClient.JobAccount> {
    const ipfsBytes = new Uint8Array(32).map((_, i) => i);

    return {
      address: overrides?.address ?? AddressFactory.create(),
      data: {
        discriminator: new Uint8Array(8),
        ipfsJob: overrides?.ipfsJob ?? ipfsBytes,
        ipfsResult: overrides?.ipfsResult ?? ipfsBytes,
        market: overrides?.market ?? AddressFactory.create(),
        node: overrides?.node ?? AddressFactory.create(),
        payer: overrides?.payer ?? AddressFactory.create(),
        project: overrides?.project ?? AddressFactory.create(),
        price: overrides?.price ?? BigInt(1),
        state: overrides?.state ?? JobState.QUEUED,
        timeEnd: overrides?.timeEnd ?? BigInt(0),
        timeStart: overrides?.timeStart ?? BigInt(0),
        timeout: overrides?.timeout ?? BigInt(0),
      },
    } as any;
  }

  /**
   * Create a queued job
   */
  static createQueued(overrides?: Parameters<typeof JobAccountFactory.create>[0]): Account<programClient.JobAccount> {
    return JobAccountFactory.create({ ...overrides, state: JobState.QUEUED });
  }

  /**
   * Create a running job
   */
  static createRunning(overrides?: Parameters<typeof JobAccountFactory.create>[0]): Account<programClient.JobAccount> {
    return JobAccountFactory.create({
      ...overrides,
      state: JobState.RUNNING,
      timeStart: BigInt(Date.now() / 1000),
    });
  }

  /**
   * Create a completed job
   */
  static createCompleted(overrides?: Parameters<typeof JobAccountFactory.create>[0]): Account<programClient.JobAccount> {
    const now = BigInt(Date.now() / 1000);
    return JobAccountFactory.create({
      ...overrides,
      state: JobState.COMPLETED,
      timeStart: now - BigInt(300), // Started 5 minutes ago
      timeEnd: now,
    });
  }

  /**
   * Create multiple jobs
   */
  static createMany(count: number, state?: JobState): Account<programClient.JobAccount>[] {
    return Array.from({ length: count }, () =>
      JobAccountFactory.create({ state })
    );
  }
}

/**
 * Run Account Factory
 * Creates run account test data
 */
export class RunAccountFactory {
  /**
   * Create a run account with defaults
   */
  static create(overrides?: {
    address?: Address;
    job?: Address;
    node?: Address;
    payer?: Address;
    state?: number;
    time?: bigint;
  }): Account<programClient.RunAccount> {
    return {
      address: overrides?.address ?? AddressFactory.create(),
      data: {
        discriminator: new Uint8Array(8),
        job: overrides?.job ?? AddressFactory.create(),
        node: overrides?.node ?? AddressFactory.create(),
        payer: overrides?.payer ?? AddressFactory.create(),
        state: overrides?.state ?? 0,
        time: overrides?.time ?? BigInt(Date.now() / 1000),
      },
    } as any;
  }

  /**
   * Create a run for a specific job
   */
  static createForJob(jobAddress: Address, overrides?: Parameters<typeof RunAccountFactory.create>[0]): Account<programClient.RunAccount> {
    return RunAccountFactory.create({ ...overrides, job: jobAddress });
  }

  /**
   * Create multiple runs
   */
  static createMany(count: number, jobAddress?: Address): Account<programClient.RunAccount>[] {
    return Array.from({ length: count }, () =>
      RunAccountFactory.create({ job: jobAddress })
    );
  }
}

/**
 * Market Account Factory
 * Creates market account test data
 */
export class MarketAccountFactory {
  /**
   * Create a market account with defaults
   */
  static create(overrides?: {
    address?: Address;
    project?: Address;
    nodeAccessKey?: Address;
    vault?: Address;
    nodeXnosMinimum?: bigint;
    jobPrice?: bigint;
    jobTimeout?: bigint;
    jobType?: bigint;
    queueType?: MarketQueueType;
  }): Account<programClient.MarketAccount> {
    const addr = overrides?.address ?? AddressFactory.create();

    return {
      address: addr,
      data: {
        discriminator: new Uint8Array(8),
        project: overrides?.project ?? addr,
        nodeAccessKey: overrides?.nodeAccessKey ?? addr,
        vault: overrides?.vault ?? addr,
        nodeXnosMinimum: overrides?.nodeXnosMinimum ?? BigInt(5),
        jobPrice: overrides?.jobPrice ?? BigInt(10),
        jobTimeout: overrides?.jobTimeout ?? BigInt(200),
        jobType: overrides?.jobType ?? BigInt(1),
        queueType: overrides?.queueType ?? MarketQueueType.NODE_QUEUE,
      },
    } as any;
  }

  /**
   * Create a job queue market
   */
  static createJobQueue(overrides?: Parameters<typeof MarketAccountFactory.create>[0]): Account<programClient.MarketAccount> {
    return MarketAccountFactory.create({ ...overrides, queueType: MarketQueueType.JOB_QUEUE });
  }

  /**
   * Create a node queue market
   */
  static createNodeQueue(overrides?: Parameters<typeof MarketAccountFactory.create>[0]): Account<programClient.MarketAccount> {
    return MarketAccountFactory.create({ ...overrides, queueType: MarketQueueType.NODE_QUEUE });
  }

  /**
   * Create multiple markets
   */
  static createMany(count: number): Account<programClient.MarketAccount>[] {
    return Array.from({ length: count }, () => MarketAccountFactory.create());
  }
}

/**
 * IPFS Data Factory
 * Creates IPFS-related test data
 */
export class IpfsFactory {
  /**
   * Create a valid IPFS hash byte array (32 bytes)
   */
  static createHashBytes(seed: number = 0): Uint8Array {
    return new Uint8Array(32).map((_, i) => (seed + i) % 256);
  }

  /**
   * Create an empty/null hash
   */
  static createEmptyHash(): Uint8Array {
    return new Uint8Array(32).fill(0);
  }

  /**
   * Create a CID string
   */
  static createCid(): string {
    return 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
  }

  /**
   * Create test file buffer
   */
  static createFileBuffer(content: string = 'test file content'): Buffer {
    return Buffer.from(content);
  }
}

/**
 * Configuration Factory
 * Creates configuration objects for testing
 */
export class ConfigFactory {
  /**
   * Create IPFS config
   */
  static createIpfsConfig(overrides?: {
    api?: string;
    jwt?: string;
    gateway?: string;
  }) {
    return {
      api: overrides?.api ?? 'https://api.pinata.cloud',
      jwt: overrides?.jwt ?? 'test-jwt-token',
      gateway: overrides?.gateway ?? 'https://gateway.pinata.cloud/ipfs/',
    };
  }

  /**
   * Create Solana config
   */
  static createSolanaConfig(overrides?: {
    rpcEndpoint?: string;
    cluster?: string;
  }) {
    return {
      rpcEndpoint: overrides?.rpcEndpoint ?? 'https://api.mainnet-beta.solana.com',
      cluster: overrides?.cluster ?? 'mainnet-beta',
    };
  }
}

/**
 * Mock Builder
 * Fluent interface for building complex mocks
 */
export class MockBuilder {
  /**
   * Create an axios mock with default responses
   */
  static createAxiosMock() {
    return {
      get: vi.fn().mockResolvedValue({ data: { success: true } }),
      post: vi.fn().mockResolvedValue({ data: { success: true } }),
      create: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: { success: true } }),
        post: vi.fn().mockResolvedValue({ data: { IpfsHash: 'QmMockHash' } }),
      })),
    };
  }

  /**
   * Create a WebSocket subscription mock
   */
  static createSubscriptionMock(notifications: any[] = []) {
    const mockIterable = {
      [Symbol.asyncIterator]() {
        let index = 0;
        return {
          next: vi.fn().mockImplementation(async () => {
            if (index < notifications.length) {
              return { done: false, value: notifications[index++] };
            }
            return { done: true, value: undefined };
          }),
          return: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        };
      },
    };

    return {
      subscribe: vi.fn().mockResolvedValue(mockIterable),
      programNotifications: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockResolvedValue(mockIterable),
      }),
    };
  }
}

/**
 * Test Scenario Builder
 * Creates common test scenarios
 */
export class ScenarioBuilder {
  /**
   * Create a job lifecycle scenario (queued -> running -> completed)
   */
  static createJobLifecycle(jobAddress: Address) {
    const queued = JobAccountFactory.createQueued({ address: jobAddress });
    const running = JobAccountFactory.createRunning({ address: jobAddress });
    const completed = JobAccountFactory.createCompleted({ address: jobAddress });

    return { queued, running, completed };
  }

  /**
   * Create a market with multiple jobs
   */
  static createMarketWithJobs(jobCount: number = 3) {
    const market = MarketAccountFactory.create();
    const jobs = Array.from({ length: jobCount }, () =>
      JobAccountFactory.create({ market: market.address })
    );

    return { market, jobs };
  }

  /**
   * Create a job with runs
   */
  static createJobWithRuns(runCount: number = 2) {
    const job = JobAccountFactory.createQueued();
    const runs = RunAccountFactory.createMany(runCount, job.address);

    return { job, runs };
  }
}

