/**
 * Test Data Factories
 *
 * Centralized factories for creating test data with sensible defaults.
 * Makes tests more maintainable and easier to read.
 */

import { vi } from 'vitest';
import {
  address,
  type Address,
  type Account,
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
  type ReadonlyUint8Array,
} from '@solana/kit';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';
import {
  createNosanaClient,
  type NosanaClient,
  NosanaNetwork,
  type PartialClientConfig,
  type Signer,
} from '../../../src/index.js';
import * as programClient from '../../../src/generated_clients/jobs/index.js';
import * as stakingClient from '../../../src/generated_clients/staking/index.js';
import * as merkleDistributorClient from '../../../src/generated_clients/merkle_distributor/index.js';
import { JobState, MarketQueueType } from '../../../src/services/programs/JobsProgram.js';

/**
 * Signer Factory
 * Creates signers for testing
 *
 * Prefer real signers over mocks when possible - creating a KeypairSigner from bytes
 * is fast, deterministic, and tests actual signing behavior.
 *
 * Use mocks only when you need to:
 * - Verify that signMessages/signTransactions were called
 * - Test error cases where signing fails
 * - Control the return value of signing methods
 */
export class SignerFactory {
  private static readonly keyFile = path.join(__dirname, 'example_solana_key.json');
  private static readonly expectedAddress = 'TESTtyGRrm5JnuDb1vQs3Jr8GqmSWoiD1iKtsry5C5o';
  private static keyArray: number[] | null = null;

  /**
   * Get the test key array (lazy loaded)
   */
  private static getKeyArray(): number[] {
    if (SignerFactory.keyArray === null) {
      SignerFactory.keyArray = JSON.parse(fs.readFileSync(SignerFactory.keyFile, 'utf8'));
    }
    return SignerFactory.keyArray!;
  }

  /**
   * Create a test signer from the example key file
   * This creates a deterministic signer for consistent testing.
   * Use this when you need a predictable signer with a known address.
   */
  static async createTestSigner(): Promise<Signer> {
    const keyArray = SignerFactory.getKeyArray();
    return await createKeyPairSignerFromBytes(new Uint8Array(keyArray));
  }

  /**
   * Create a real signer with a randomly generated keypair
   * Use this when you need a signer with a different address than the test signer,
   * or when you need multiple distinct signers in a test.
   *
   * This creates a real KeypairSigner (not a mock), so it will actually sign messages/transactions.
   */
  static async createRandomSigner(): Promise<Signer> {
    return await generateKeyPairSigner();
  }

  /**
   * Get the expected address for the test signer
   */
  static getExpectedAddress(): Address {
    return address(SignerFactory.expectedAddress);
  }

  /**
   * Create a mock signer with a specific address
   *
   * Use this only when you need to:
   * - Verify that signMessages/signTransactions were called
   * - Test error cases where signing fails
   * - Control the return value of signing methods
   *
   * For most cases, prefer createTestSigner() or createRandomSigner() which create real signers.
   */
  static createMockSigner(addressOverride?: Address): Signer {
    const addr = addressOverride ?? SignerFactory.getExpectedAddress();
    return {
      address: addr,
      signMessages: vi.fn(),
      signTransactions: vi.fn(),
    } as Signer;
  }
}

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
 * Client Factory
 * Creates real NosanaClient instances for integration-style unit tests
 */
export class ClientFactory {
  /**
   * Create a client with default mainnet configuration
   */
  static createMainnet(overrides?: PartialClientConfig): NosanaClient {
    return createNosanaClient(NosanaNetwork.MAINNET, overrides);
  }

  /**
   * Create a client with default devnet configuration
   */
  static createDevnet(overrides?: PartialClientConfig): NosanaClient {
    return createNosanaClient(NosanaNetwork.DEVNET, overrides);
  }

  /**
   * Create a client with a test signer already configured
   */
  static async createWithSigner(
    network: NosanaNetwork = NosanaNetwork.MAINNET,
    overrides?: PartialClientConfig
  ): Promise<NosanaClient> {
    const signer = await SignerFactory.createTestSigner();
    return createNosanaClient(network, { ...overrides, signer });
  }

  /**
   * Create a client with custom RPC endpoint
   */
  static createWithCustomRpc(
    rpcEndpoint: string,
    network: NosanaNetwork = NosanaNetwork.MAINNET
  ): NosanaClient {
    return createNosanaClient(network, {
      solana: { rpcEndpoint },
    });
  }
}

/**
 * Mock Client Factory
 * Creates mock NosanaClient instances for testing
 * Use ClientFactory for real client instances
 */
export class MockClientFactory {
  /**
   * Create a basic SDK with minimal configuration
   * Returns a mock that can be used as both NosanaClient and ProgramDeps
   */
  static createBasic(overrides?: Partial<NosanaClient>): NosanaClient {
    const validAddr = AddressFactory.createValid();
    let wallet: any = undefined;
    const sdk = {
      config: {
        solana: { rpcEndpoint: 'https://rpc.example', cluster: 'devnet' },
        logLevel: 0,
        ipfs: { api: '', jwt: '', gateway: '' },
        programs: {
          jobsAddress: validAddr,
          nosTokenAddress: validAddr,
          rewardsAddress: validAddr,
          stakeAddress: validAddr,
          poolsAddress: validAddr,
          merkleDistributorAddress: validAddr,
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
        pda: vi.fn().mockResolvedValue(validAddr),
      },
      get signer() {
        return wallet;
      },
      set signer(value: any) {
        wallet = value;
      },
      getSigner: () => wallet,
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
    const validAddr = AddressFactory.createValid();
    const sdk = MockClientFactory.createBasic({
      solana: {
        rpc,
        rpcSubscriptions: {},
        sendAndConfirmTransaction: vi.fn(),
        pda: vi.fn().mockResolvedValue(validAddr),
        getBalance: vi.fn(),
        getLatestBlockhash: vi.fn(),
        send: vi.fn(),
      },
    } as any);
    return { sdk, sentArgs };
  }

  /**
   * Create an SDK with WebSocket subscription support
   */
  static createWithSubscriptions(): NosanaClient {
    const sdk = MockClientFactory.createBasic();
    (sdk as any).solana.rpcSubscriptions = {
      programNotifications: vi.fn(),
    };
    return sdk;
  }

  /**
   * Create an SDK with a wallet
   *
   * Note: This uses a mock signer because MockClientFactory creates mock clients.
   * For real client instances, use ClientFactory.createWithSigner() instead.
   */
  static createWithWallet(walletAddress?: Address): NosanaClient {
    const sdk = MockClientFactory.createBasic();
    (sdk as any).signer = SignerFactory.createMockSigner(walletAddress);
    return sdk;
  }

  /**
   * Create an SDK for SolanaService tests with RPC client and optional wallet
   * @deprecated Use createSolanaService directly in tests instead
   */
  static createForSolana(overrides?: { signer?: Signer }): NosanaClient {
    return {
      config: {
        solana: { rpcEndpoint: 'https://rpc.example', cluster: 'devnet' },
      },
      logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
      signer: overrides?.signer,
    } as unknown as NosanaClient;
  }

  /**
   * Create an SDK for program tests with PDA mocking
   */
  static createWithMockPda(): NosanaClient {
    const valid = AddressFactory.createValid();
    const pda = vi.fn().mockResolvedValueOnce(valid).mockResolvedValueOnce(valid);
    const sdk = {
      solana: { pda },
      config: {
        programs: {
          rewardsAddress: valid,
          jobsAddress: valid,
          nosTokenAddress: valid,
          stakeAddress: valid,
          poolsAddress: valid,
          merkleDistributorAddress: valid,
        },
      },
      logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    } as unknown as NosanaClient;
    return sdk;
  }
}

/**
 * Helper function to convert NosanaClient mock to ProgramDeps
 */
export function sdkToProgramDeps(sdk: NosanaClient): import('../../../src/types.js').ProgramDeps {
  return {
    config: sdk.config,
    logger: sdk.logger,
    solana: sdk.solana,
    getSigner: () => sdk.signer,
  };
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
  static createQueued(
    overrides?: Parameters<typeof JobAccountFactory.create>[0]
  ): Account<programClient.JobAccount> {
    return JobAccountFactory.create({ ...overrides, state: JobState.QUEUED });
  }

  /**
   * Create a running job
   */
  static createRunning(
    overrides?: Parameters<typeof JobAccountFactory.create>[0]
  ): Account<programClient.JobAccount> {
    return JobAccountFactory.create({
      ...overrides,
      state: JobState.RUNNING,
      timeStart: BigInt(Date.now() / 1000),
    });
  }

  /**
   * Create a completed job
   */
  static createCompleted(
    overrides?: Parameters<typeof JobAccountFactory.create>[0]
  ): Account<programClient.JobAccount> {
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
    return Array.from({ length: count }, () => JobAccountFactory.create({ state }));
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
  static createForJob(
    jobAddress: Address,
    overrides?: Parameters<typeof RunAccountFactory.create>[0]
  ): Account<programClient.RunAccount> {
    return RunAccountFactory.create({ ...overrides, job: jobAddress });
  }

  /**
   * Create multiple runs
   */
  static createMany(count: number, jobAddress?: Address): Account<programClient.RunAccount>[] {
    return Array.from({ length: count }, () => RunAccountFactory.create({ job: jobAddress }));
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
  static createJobQueue(
    overrides?: Parameters<typeof MarketAccountFactory.create>[0]
  ): Account<programClient.MarketAccount> {
    return MarketAccountFactory.create({ ...overrides, queueType: MarketQueueType.JOB_QUEUE });
  }

  /**
   * Create a node queue market
   */
  static createNodeQueue(
    overrides?: Parameters<typeof MarketAccountFactory.create>[0]
  ): Account<programClient.MarketAccount> {
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
  static createIpfsConfig(overrides?: { api?: string; jwt?: string; gateway?: string }) {
    return {
      api: overrides?.api ?? 'https://api.pinata.cloud',
      jwt: overrides?.jwt ?? 'test-jwt-token',
      gateway: overrides?.gateway ?? 'https://gateway.pinata.cloud/ipfs/',
    };
  }

  /**
   * Create Solana config
   */
  static createSolanaConfig(overrides?: { rpcEndpoint?: string; cluster?: string }) {
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

/**
 * Stake Account Factory
 * Creates stake account test data
 */
export class StakeAccountFactory {
  /**
   * Create a stake account with defaults
   */
  static create(overrides?: {
    address?: Address;
    amount?: bigint;
    authority?: Address;
    duration?: bigint;
    timeUnstake?: bigint;
    vault?: Address;
    vaultBump?: number;
    xnos?: bigint;
  }): Account<stakingClient.StakeAccount> {
    return {
      address: overrides?.address ?? AddressFactory.create(),
      data: {
        discriminator: new Uint8Array(8),
        amount: overrides?.amount ?? BigInt(1000),
        authority: overrides?.authority ?? AddressFactory.create(),
        duration: overrides?.duration ?? BigInt(2592000), // 30 days in seconds
        timeUnstake: overrides?.timeUnstake ?? BigInt(0),
        vault: overrides?.vault ?? AddressFactory.create(),
        vaultBump: overrides?.vaultBump ?? 255,
        xnos: overrides?.xnos ?? BigInt(1000),
      },
    } as any;
  }

  /**
   * Create a stake account with specific amount
   */
  static createWithAmount(
    amount: bigint | number,
    overrides?: Parameters<typeof StakeAccountFactory.create>[0]
  ): Account<stakingClient.StakeAccount> {
    return StakeAccountFactory.create({
      ...overrides,
      amount: typeof amount === 'bigint' ? amount : BigInt(amount),
    });
  }

  /**
   * Create a stake account with unstaking time set
   */
  static createUnstaking(
    overrides?: Parameters<typeof StakeAccountFactory.create>[0]
  ): Account<stakingClient.StakeAccount> {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return StakeAccountFactory.create({
      ...overrides,
      timeUnstake: now + BigInt(86400), // Unstaking in 24 hours
    });
  }

  /**
   * Create multiple stake accounts
   */
  static createMany(count: number, authority?: Address): Account<stakingClient.StakeAccount>[] {
    return Array.from({ length: count }, (_, i) =>
      StakeAccountFactory.create({
        authority,
        amount: BigInt((i + 1) * 1000),
      })
    );
  }
}

/**
 * Merkle Distributor Account Factory
 * Creates merkle distributor account test data
 */
export class MerkleDistributorAccountFactory {
  /**
   * Create a merkle distributor account with defaults
   */
  static create(overrides?: {
    address?: Address;
    bump?: number;
    version?: bigint;
    root?: ReadonlyUint8Array;
    mint?: Address;
    tokenVault?: Address;
    maxTotalClaim?: bigint;
    maxNumNodes?: bigint;
    totalAmountClaimed?: bigint;
    totalAmountForgone?: bigint;
    numNodesClaimed?: bigint;
    startTs?: bigint;
    endTs?: bigint;
    clawbackStartTs?: bigint;
    clawbackReceiver?: Address;
    admin?: Address;
    clawedBack?: boolean;
    enableSlot?: bigint;
    closable?: boolean;
    buffer0?: ReadonlyUint8Array;
    buffer1?: ReadonlyUint8Array;
    buffer2?: ReadonlyUint8Array;
  }): Account<merkleDistributorClient.MerkleDistributor> {
    const rootBytes = new Uint8Array(32).fill(1);
    const bufferBytes = new Uint8Array(32).fill(0);

    return {
      address: overrides?.address ?? AddressFactory.create(),
      data: {
        discriminator: new Uint8Array(8),
        bump: overrides?.bump ?? 255,
        version: overrides?.version ?? BigInt(1),
        root: overrides?.root ?? rootBytes,
        mint: overrides?.mint ?? AddressFactory.create(),
        tokenVault: overrides?.tokenVault ?? AddressFactory.create(),
        maxTotalClaim: overrides?.maxTotalClaim ?? BigInt(1000000),
        maxNumNodes: overrides?.maxNumNodes ?? BigInt(1000),
        totalAmountClaimed: overrides?.totalAmountClaimed ?? BigInt(0),
        totalAmountForgone: overrides?.totalAmountForgone ?? BigInt(0),
        numNodesClaimed: overrides?.numNodesClaimed ?? BigInt(0),
        startTs: overrides?.startTs ?? BigInt(0),
        endTs: overrides?.endTs ?? BigInt(0),
        clawbackStartTs: overrides?.clawbackStartTs ?? BigInt(0),
        clawbackReceiver: overrides?.clawbackReceiver ?? AddressFactory.create(),
        admin: overrides?.admin ?? AddressFactory.create(),
        clawedBack: overrides?.clawedBack ?? false,
        enableSlot: overrides?.enableSlot ?? BigInt(0),
        closable: overrides?.closable ?? false,
        buffer0: overrides?.buffer0 ?? bufferBytes,
        buffer1: overrides?.buffer1 ?? bufferBytes,
        buffer2: overrides?.buffer2 ?? bufferBytes,
      },
    } as any;
  }

  /**
   * Create multiple merkle distributor accounts
   */
  static createMany(count: number): Account<merkleDistributorClient.MerkleDistributor>[] {
    return Array.from({ length: count }, (_, i) =>
      MerkleDistributorAccountFactory.create({
        maxTotalClaim: BigInt((i + 1) * 1000000),
      })
    );
  }
}

/**
 * Claim Status Account Factory
 * Creates claim status account test data
 */
export class ClaimStatusAccountFactory {
  /**
   * Create a claim status account with defaults
   */
  static create(overrides?: {
    address?: Address;
    claimant?: Address;
    lockedAmount?: bigint;
    lockedAmountWithdrawn?: bigint;
    unlockedAmount?: bigint;
    unlockedAmountClaimed?: bigint;
    closable?: boolean;
    distributor?: Address;
  }): Account<merkleDistributorClient.ClaimStatus> {
    return {
      address: overrides?.address ?? AddressFactory.create(),
      data: {
        discriminator: new Uint8Array(8),
        claimant: overrides?.claimant ?? AddressFactory.create(),
        lockedAmount: overrides?.lockedAmount ?? BigInt(5000),
        lockedAmountWithdrawn: overrides?.lockedAmountWithdrawn ?? BigInt(0),
        unlockedAmount: overrides?.unlockedAmount ?? BigInt(10000),
        unlockedAmountClaimed: overrides?.unlockedAmountClaimed ?? BigInt(0),
        closable: overrides?.closable ?? false,
        distributor: overrides?.distributor ?? AddressFactory.create(),
      },
    } as any;
  }

  /**
   * Create a claim status with specific amounts
   */
  static createWithAmounts(
    unlockedAmount: bigint | number,
    lockedAmount: bigint | number,
    overrides?: Parameters<typeof ClaimStatusAccountFactory.create>[0]
  ): Account<merkleDistributorClient.ClaimStatus> {
    return ClaimStatusAccountFactory.create({
      ...overrides,
      unlockedAmount: typeof unlockedAmount === 'bigint' ? unlockedAmount : BigInt(unlockedAmount),
      lockedAmount: typeof lockedAmount === 'bigint' ? lockedAmount : BigInt(lockedAmount),
    });
  }

  /**
   * Create multiple claim status accounts
   */
  static createMany(
    count: number,
    distributor?: Address
  ): Account<merkleDistributorClient.ClaimStatus>[] {
    return Array.from({ length: count }, (_, i) =>
      ClaimStatusAccountFactory.create({
        distributor,
        unlockedAmount: BigInt((i + 1) * 10000),
        lockedAmount: BigInt((i + 1) * 5000),
      })
    );
  }
}
