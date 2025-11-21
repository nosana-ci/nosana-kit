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
  type Wallet,
} from '../../../src/index.js';
import * as programClient from '../../../src/generated_clients/jobs/index.js';
import * as stakingClient from '../../../src/generated_clients/staking/index.js';
import * as merkleDistributorClient from '../../../src/generated_clients/merkle_distributor/index.js';
import { JobState, MarketQueueType } from '../../../src/services/programs/JobsProgram.js';

/**
 * Signer Factory
 * Creates wallets (signers) for testing
 *
 * Prefer real wallets over mocks when possible - creating a KeypairSigner from bytes
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
   * Create a test wallet (signer) from the example key file
   * This creates a deterministic wallet for consistent testing.
   * Use this when you need a predictable wallet with a known address.
   */
  static async createTestSigner(): Promise<Wallet> {
    const keyArray = SignerFactory.getKeyArray();
    return await createKeyPairSignerFromBytes(new Uint8Array(keyArray));
  }

  /**
   * Create a real wallet (signer) with a randomly generated keypair
   * Use this when you need a wallet with a different address than the test wallet,
   * or when you need multiple distinct wallets in a test.
   *
   * This creates a real KeypairSigner (not a mock), so it will actually sign messages/transactions.
   */
  static async createRandomSigner(): Promise<Wallet> {
    return await generateKeyPairSigner();
  }

  /**
   * Get the expected address for the test signer
   */
  static getExpectedAddress(): Address {
    return address(SignerFactory.expectedAddress);
  }

  /**
   * Create a mock wallet (signer) with a specific address
   *
   * Use this only when you need to:
   * - Verify that signMessages/signTransactions were called
   * - Test error cases where signing fails
   * - Control the return value of signing methods
   *
   * For most cases, prefer createTestSigner() or createRandomSigner() which create real wallets.
   */
  static createMockSigner(addressOverride?: Address): Wallet {
    const addr = addressOverride ?? SignerFactory.getExpectedAddress();
    return {
      address: addr,
      signMessages: vi.fn(),
      signTransactions: vi.fn(),
    } as Wallet;
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
   * Create a client with a test wallet already configured
   */
  static async createWithSigner(
    network: NosanaNetwork = NosanaNetwork.MAINNET,
    overrides?: PartialClientConfig
  ): Promise<NosanaClient> {
    const wallet = await SignerFactory.createTestSigner();
    return createNosanaClient(network, { ...overrides, wallet });
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
      get wallet() {
        return wallet;
      },
      set wallet(value: any) {
        wallet = value;
      },
      getWallet: () => wallet,
      ...overrides,
    } as unknown as NosanaClient;
    return sdk;
  }

  /**
   * Create a mock SDK with RPC mocking capabilities for testing program methods
   * that use getProgramAccounts (like all(), runs(), markets(), etc.)
   *
   * Returns both the SDK and sentArgs array to inspect RPC call arguments in tests.
   */
  static createMockWithRpc(): { sdk: NosanaClient; sentArgs: any[] } {
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
      },
    } as any);
    return { sdk, sentArgs };
  }

  /**
   * Create a mock SDK with WebSocket subscription support for testing
   * program monitoring functionality (like jobs.monitor())
   */
  static createMockWithSubscriptions(): NosanaClient {
    const sdk = MockClientFactory.createBasic();
    (sdk as any).solana.rpcSubscriptions = {
      programNotifications: vi.fn(),
    };
    return sdk;
  }

  /**
   * Create a mock SDK with a wallet (mock signer) for testing program methods
   * that require a wallet (like claim(), post(), etc.)
   *
   * Note: This uses a mock signer because MockClientFactory creates mock clients.
   * For real client instances, use ClientFactory.createWithSigner() instead.
   */
  static createMockWithWallet(walletAddress?: Address): NosanaClient {
    const sdk = MockClientFactory.createBasic();
    (sdk as any).wallet = SignerFactory.createMockSigner(walletAddress);
    return sdk;
  }
}

/**
 * Helper function to convert NosanaClient mock to ProgramDeps
 */
export function sdkToProgramDeps(sdk: NosanaClient): import('../../../src/types.js').ProgramDeps {
  return {
    logger: sdk.logger,
    solana: sdk.solana,
    getWallet: () => sdk.wallet,
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
   * Create multiple markets
   */
  static createMany(count: number): Account<programClient.MarketAccount>[] {
    return Array.from({ length: count }, () => MarketAccountFactory.create());
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
