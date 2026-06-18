import bs58 from 'bs58';
import { solBytesArrayToIpfsHash } from '@nosana/ipfs';
import { parseBase64RpcAccount } from '@solana/kit';
import { ErrorCodes, NosanaError } from '../../../errors/NosanaError.js';
import { convertBigIntToNumber, type ConvertTypesForDb } from '../../../utils/index.js';

import type {
  Address,
  Account,
  Base58EncodedBytes,
  GetProgramAccountsMemcmpFilter,
  Instruction,
  ReadonlyUint8Array,
  TransactionSigner,
} from '@solana/kit';
import type { ProgramDeps, Wallet } from '../../../types.js';
import type { BatchTransactionResult } from '../../solana/SolanaService.js';
import { getJobsInstructionComputeUnits } from './computeUnits.js';
import { decodeJobsInstruction, type DecodedJobsInstruction } from './decode.js';
import {
  getStaticAccounts as getStaticAccountsFn,
  type StaticAccounts,
} from '../../../utils/getStaticAccounts.js';
import type { ProgramConfig } from '../../../config/types.js';
import type { InstructionsHelperParams } from './instructions/types.js';

import * as Instructions from './instructions/index.js';
import * as programClient from '@nosana/jobs-program';
import { createMonitorFunctions } from './monitor/index.js';
import type { SimpleMonitorEvent, MonitorEvent } from './monitor/index.js';

export enum JobState {
  QUEUED = 0,
  RUNNING = 1,
  COMPLETED = 2,
  STOPPED = 3,
}

export enum MarketQueueType {
  JOB_QUEUE = 0,
  NODE_QUEUE = 1,
}

export type Job = Omit<ConvertTypesForDb<programClient.JobAccountArgs>, 'state'> & {
  address: Address;
  state: JobState;
};

export type Market = Omit<ConvertTypesForDb<programClient.MarketAccountArgs>, 'queueType'> & {
  address: Address;
  queueType: MarketQueueType;
};

export type Run = ConvertTypesForDb<programClient.RunAccountArgs> & { address: Address };

// Re-export monitor types for convenience
export { MonitorEventType } from './monitor/index.js';
export type { SimpleMonitorEvent, MonitorEvent } from './monitor/index.js';

// Re-export post types (union of list and assign)
export type PostParams = Instructions.ListParams | Instructions.AssignParams;
export type PostInstruction = Instructions.ListInstruction | Instructions.AssignInstruction;

export type { DecodedJobsInstruction } from './decode.js';

/**
 * A {@link BatchTransactionResult} enriched with the decoded jobs instructions it
 * contained. `decoded[i]` corresponds to `instructions[i]` and is `undefined` for
 * any instruction that is not a recognised jobs instruction.
 *
 * Use it to recover accounts a transaction created or acted on — e.g. the `job`
 * and `run` addresses minted by each `list` — without a separate `*Many` helper.
 * @group @nosana/kit
 */
export interface JobsBatchTransactionResult extends BatchTransactionResult {
  /** Each instruction in the transaction, decoded to its name and labelled accounts. */
  decoded: Array<DecodedJobsInstruction | undefined>;
  /**
   * All accounts the transaction's instructions referenced, grouped by their
   * (pluralised) role name across every instruction in the transaction — e.g.
   * `accounts.jobs` is every `job` address, `accounts.runs` every `run`. This is
   * the quick "just give me the created jobs" view; use {@link decoded} together
   * with `groupIndices` when you need to tie an account back to a specific input.
   */
  accounts: Record<string, Address[]>;
}

export const JOB_POSTING_NETWORK_FEE = 0.1;

/**
 * Returns the current network fee ratio applied when posting jobs.
 * A value of 0.1 represents a 10% fee.
 * @group @nosana/kit
 */
export function getNetworkFee(): number {
  return JOB_POSTING_NETWORK_FEE;
}

/**
 * Jobs program interface
 * @group @nosana/kit
 */
export interface JobsProgram {
  /**
   * Fetch a job account by address
   */
  get(addr: Address, checkRun?: boolean): Promise<Job>;

  /**
   * Fetch a run account by address
   */
  run(addr: Address): Promise<Run>;

  /**
   * Fetch a market account by address
   */
  market(addr: Address): Promise<Market>;

  /**
   * Fetch multiple job accounts by address
   */
  multiple(addresses: Address[], checkRuns?: boolean): Promise<Job[]>;

  /**
   * Fetch all job accounts
   */
  all(
    filters?: {
      state?: JobState;
      market?: Address;
      node?: Address;
      project?: Address;
    },
    checkRuns?: boolean
  ): Promise<Job[]>;

  /**
   * Fetch all run accounts
   */
  runs(filters?: { node?: Address; job?: Address }): Promise<Run[]>;

  /**
   * Fetch all market accounts
   */
  markets(): Promise<Market[]>;

  /**
   * List a new job to the marketplace
   */
  list: Instructions.List;
  /**
   * Build many list instructions at once — the bulk-create counterpart to
   * {@link list}. Each instruction mints its own fresh job/run accounts. Returns
   * instructions only; pass them to {@link sendBatch} to send them in the fewest
   * transactions.
   *
   * Call it with the same params repeated `count` times, or with one entry per job
   * when the jobs differ.
   *
   * @example
   * ```typescript
   * const instructions = await client.jobs.listMany({ market, ipfsHash, timeout }, 7);
   * const results = await client.jobs.sendBatch(instructions);
   * ```
   */
  listMany(params: Instructions.ListParams, count: number): Promise<Instructions.ListInstruction[]>;
  listMany(params: Instructions.ListParams[]): Promise<Instructions.ListInstruction[]>;
  /**
   * Post a new job to the marketplace (can list or assign based on params)
   */
  post(
    params: Instructions.ListParams | Instructions.AssignParams
  ): Promise<Instructions.ListInstruction | Instructions.AssignInstruction>;
  /**
   * Assign a job directly to a host node
   */
  assign: Instructions.Assign;
  /**
   * Assign many jobs at once — the bulk counterpart to {@link assign}. Each
   * instruction mints its own fresh job/run accounts. Call with the same params
   * repeated `count` times, or with one entry per job when they differ. Returns
   * instructions only; pass them to {@link sendBatch}.
   */
  assignMany(
    params: Instructions.AssignParams,
    count: number
  ): Promise<Instructions.AssignInstruction[]>;
  assignMany(params: Instructions.AssignParams[]): Promise<Instructions.AssignInstruction[]>;
  /**
   *  Extend an existing job's timeout
   */
  extend: Instructions.Extend;
  /**
   * Extend many jobs at once — the bulk counterpart to {@link extend}. Takes one
   * params entry per job (each carries its own `timeout`); pass the result to
   * {@link sendBatch}.
   */
  extendMany(params: Instructions.ExtendParams[]): Promise<Instructions.ExtendInstruction[]>;
  /**
   * Delist a job from the marketplace
   */
  delist: Instructions.Delist;
  /**
   * Delist many jobs at once — the bulk counterpart to {@link delist}. Takes the
   * job addresses and returns one instruction each; pass them to {@link sendBatch}.
   */
  delistMany(jobs: Address[]): Promise<Instructions.DelistInstruction[]>;
  /**
   * Create a new market
   */
  open(params?: Instructions.OpenParams): Promise<Instructions.OpenInstruction>;
  /**
   * Create a new market (synonym for open)
   */
  createMarket(params?: Instructions.OpenParams): Promise<Instructions.OpenInstruction>;
  /**
   * Close a market
   */
  close: Instructions.Close;
  /**
   * Close many markets at once — the bulk counterpart to {@link close}. Takes the
   * market addresses and returns one instruction each; pass them to {@link sendBatch}.
   */
  closeMany(markets: Address[]): Promise<Instructions.CloseInstruction[]>;
  /**
   * Close a market (synonym for close)
   */
  closeMarket: Instructions.Close;
  /**
   * Stop a running job
   */
  end: Instructions.End;
  /**
   * End many running jobs at once — the bulk counterpart to {@link end}. Takes the
   * job addresses and returns one instruction each; pass them to {@link sendBatch}.
   */
  endMany(jobs: Address[]): Promise<Instructions.EndInstruction[]>;
  /**
   * Enters the MarketAccount queue, or create a RunAccount.
   */
  work: Instructions.Work;
  /**
   * Complete a job that has been stopped.
   */
  finish: Instructions.Finish;
  /**
   * Finish many jobs at once — the bulk counterpart to {@link finish}. Each entry
   * may expand to several instructions (token-account setup plus the finish), so
   * this returns one atomic group per job; pass the result to {@link sendBatch},
   * which keeps each group in a single transaction.
   */
  finishMany(params: Instructions.FinishParams[]): Promise<Instructions.FinishInstructions[]>;
  /**
   * Post the result for a JobAccount to finish it and get paid.
   */
  complete: Instructions.Complete;
  /**
   * Complete many jobs at once — the bulk counterpart to {@link complete}. Takes
   * one params entry per job (each carries its own result hash); pass the result
   * to {@link sendBatch}.
   */
  completeMany(params: Instructions.CompleteParams[]): Promise<Instructions.CompleteInstruction[]>;
  /**
   * Quit a JobAccount that you have started.
   */
  quit: Instructions.Quit;
  /**
   * Quit many runs at once — the bulk counterpart to {@link quit}. Takes the run
   * addresses and returns one instruction each; pass them to {@link sendBatch}.
   */
  quitMany(runs: Address[]): Promise<Instructions.QuitInstruction[]>;
  /**
   * Exit the node queue
   */
  stop: Instructions.Stop;
  /**
   * Exit the node queue for many markets at once — the bulk counterpart to
   * {@link stop}. Takes the market addresses and returns one instruction each;
   * pass them to {@link sendBatch}.
   */
  stopMany(markets: Address[]): Promise<Instructions.StopInstruction[]>;

  /**
   * Bulk-send many jobs instructions, automatically packing them into the fewest
   * transactions that each stay within Solana's size and compute-unit limits.
   *
   * Each entry of `groups` is a single instruction or an atomic group of
   * instructions that must stay in the same transaction. By default each
   * transaction's compute-unit limit is estimated by simulation, because jobs
   * instruction cost scales with the market queue size (a static estimate would
   * under-provision large batches). Pass `estimateComputeUnits: false` to use the
   * measured static table instead (no RPC, see `pnpm gen:cu`). All transactions are
   * attempted regardless of individual failures; the result reports each outcome.
   *
   * Each result carries `confirmed`, the `accounts` it touched (grouped by role,
   * e.g. `accounts.jobs`), the `decoded` instructions, and the `groupIndices` of
   * the inputs it packed — so created accounts can be collected directly, or tied
   * back to the exact input that produced them, without a bespoke `*Many` helper.
   *
   * @example
   * ```typescript
   * // Collect every created job from the confirmed transactions.
   * const instructions = await client.jobs.listMany({ market, ipfsHash, timeout }, 7);
   * const results = await client.jobs.sendBatch(instructions);
   *
   * const jobs = [];
   * for (const tx of results) {
   *   if (tx.confirmed) jobs.push(...tx.accounts.jobs);
   * }
   * ```
   * @example
   * ```typescript
   * // Or tie each created job back to its input (groupIndices bridges tx -> input;
   * // for single-instruction inputs decoded[k] lines up with groupIndices[k]).
   * for (const tx of results) {
   *   tx.groupIndices.forEach((inputIndex, k) => {
   *     console.log(inputIndex, tx.confirmed, tx.decoded[k]?.accounts.job);
   *   });
   * }
   * ```
   *
   * @param groups Atomic instruction groups to bulk together.
   * @param options Optional configuration (fee payer, commitment, limits, simulation).
   * @returns A per-transaction result array, in the order the buckets were packed.
   */
  sendBatch(
    groups: Array<Instruction | Instruction[]>,
    options?: {
      feePayer?: TransactionSigner;
      commitment?: 'processed' | 'confirmed' | 'finalized';
      maxComputeUnits?: number;
      estimateComputeUnits?: boolean;
      maxTransactionSize?: number;
      sequential?: boolean;
    }
  ): Promise<JobsBatchTransactionResult[]>;

  /**
   * Monitor program account updates using async iterators.
   * Automatically merges run account data into job account updates.
   * Returns a tuple of [eventStream, stopFunction].
   *
   * @example
   * ```typescript
   * const [eventStream, stop] = await jobsProgram.monitor();
   * for await (const event of eventStream) {
   *   if (event.type === MonitorEventType.JOB) {
   *     console.log('Job updated:', event.data.address);
   *   } else if (event.type === MonitorEventType.MARKET) {
   *     console.log('Market updated:', event.data.address);
   *   }
   * }
   * ```
   */
  monitor(): Promise<[AsyncIterable<SimpleMonitorEvent>, () => void]>;

  /**
   * Monitor program account updates with detailed events for each account type.
   * Provides separate events for job, market, and run accounts.
   * Returns a tuple of [eventStream, stopFunction].
   *
   * @example
   * ```typescript
   * const [eventStream, stop] = await jobsProgram.monitorDetailed();
   * for await (const event of eventStream) {
   *   switch (event.type) {
   *     case MonitorEventType.JOB:
   *       console.log('Job updated:', event.data.address);
   *       break;
   *     case MonitorEventType.MARKET:
   *       console.log('Market updated:', event.data.address);
   *       break;
   *     case MonitorEventType.RUN:
   *       console.log('Run updated:', event.data.address);
   *       break;
   *   }
   * }
   * ```
   */
  monitorDetailed(): Promise<[AsyncIterable<MonitorEvent>, () => void]>;
}

/**
 * Creates a new JobsProgram instance.
 *
 * @param deps - Program dependencies (config, logger, solana service, wallet getter)
 * @returns A JobsProgram instance with methods to interact with the jobs program
 *
 * @example
 * ```ts
 * import { createJobsProgram } from '@nosana/kit';
 *
 * const jobsProgram = createJobsProgram({
 *   config,
 *   logger,
 *   solana,
 *   getWallet,
 * });
 *
 * const job = await jobsProgram.get('job-address');
 * ```
 */

export function createJobsProgram(deps: ProgramDeps, config: ProgramConfig): JobsProgram {
  const programId = config.jobsAddress;
  const client = programClient;

  // Cache for static accounts (memoization)
  const staticAccountsCache: { value?: StaticAccounts; promise?: Promise<StaticAccounts> } = {};

  /**
   * Transform job account to include address and convert types
   */
  /**
   * Convert Solana bytes array to IPFS hash, returning null for empty/invalid hashes
   */
  function solBytesToIpfsHashOrNull(hashArray: ReadonlyUint8Array): string | null {
    const result = solBytesArrayToIpfsHash(Array.from(hashArray));
    // Return null for the empty hash value
    if (result === 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51') {
      return null;
    }
    return result;
  }

  function transformJobAccount(jobAccount: Account<programClient.JobAccount>): Job {
    const { discriminator: _, ...jobAccountData } = jobAccount.data;

    const converted = convertBigIntToNumber(jobAccountData);
    return {
      address: jobAccount.address,
      ...converted,
      ipfsJob: solBytesToIpfsHashOrNull(jobAccountData.ipfsJob),
      ipfsResult: solBytesToIpfsHashOrNull(jobAccountData.ipfsResult),
      state: converted.state as JobState,
    };
  }

  /**
   * Transform run account to include address and convert types
   */
  function transformRunAccount(runAccount: Account<programClient.RunAccount>): Run {
    const { discriminator: _, ...runAccountData } = runAccount.data;

    return {
      address: runAccount.address,
      ...convertBigIntToNumber(runAccountData),
    };
  }

  /**
   * Merge run account data into a job account.
   * Updates the job state to RUNNING and sets node and timeStart from the run account.
   */
  function mergeRunIntoJob(job: Job, run: Run): Job {
    return {
      ...job,
      state: JobState.RUNNING,
      node: run.node,
      timeStart: run.time,
    };
  }

  /**
   * Transform market account to include address and convert types
   */
  function transformMarketAccount(marketAccount: Account<programClient.MarketAccount>): Market {
    const { discriminator: _, ...marketAccountData } = marketAccount.data;

    const converted = convertBigIntToNumber(marketAccountData);
    return {
      address: marketAccount.address,
      ...converted,
      queueType: converted.queueType as MarketQueueType,
    };
  }

  /**
   * Get the required wallet or throw an error if not available
   */
  function getRequiredWallet(): Wallet {
    const wallet = deps.getWallet();
    if (!wallet) {
      throw new NosanaError('Wallet is required for this operation', ErrorCodes.NO_WALLET);
    }
    return wallet;
  }

  function getStaticAccounts() {
    return getStaticAccountsFn(config, deps.solana, staticAccountsCache);
  }

  function createInstructionsHelper(
    get: JobsProgram['get'],
    getRuns: JobsProgram['runs']
  ): InstructionsHelperParams {
    return {
      deps,
      config,
      client,
      get,
      getRuns,
      getRequiredWallet,
      getStaticAccounts,
      getNosATA: deps.nos.getATA,
    };
  }

  return {
    /**
     * Fetch a job account by address
     */
    async get(addr: Address, checkRun: boolean = true): Promise<Job> {
      try {
        const jobAccount = await client.fetchJobAccount(deps.solana.rpc, addr);
        const job = transformJobAccount(jobAccount);
        if (checkRun && job.state === JobState.QUEUED) {
          // If job is queued, check if there is a run account for the job
          const runs = await this.runs({ job: job.address });
          if (runs.length > 0) {
            const run = runs[0];
            job.state = JobState.RUNNING;
            job.timeStart = run.time;
            job.node = run.node;
          }
        }
        return job;
      } catch (err) {
        deps.logger.error(`Failed to fetch job ${err}`);
        throw err;
      }
    },

    /**
     * Fetch a run account by address
     */
    async run(addr: Address): Promise<Run> {
      try {
        const runAccount = await client.fetchRunAccount(deps.solana.rpc, addr);
        const run = transformRunAccount(runAccount);
        return run;
      } catch (err) {
        deps.logger.error(`Failed to fetch run ${err}`);
        throw err;
      }
    },

    /**
     * Fetch a market account by address
     */
    async market(addr: Address): Promise<Market> {
      try {
        const marketAccount = await client.fetchMarketAccount(deps.solana.rpc, addr);
        const market = transformMarketAccount(marketAccount);
        return market;
      } catch (err) {
        deps.logger.error(`Failed to fetch market ${err}`);
        throw err;
      }
    },

    /**
     * Fetch multiple job accounts by address
     */
    async multiple(addresses: Address[], checkRuns: boolean = false): Promise<Job[]> {
      try {
        const jobAccounts = await client.fetchAllJobAccount(deps.solana.rpc, addresses);
        const jobs = jobAccounts.map((jobAccount) => transformJobAccount(jobAccount));
        if (checkRuns) {
          const runs = await this.runs();
          jobs.forEach((job) => {
            if (job.state === JobState.QUEUED) {
              const run = runs.find((run) => run.job === job.address);
              if (run) {
                job.state = JobState.RUNNING;
                job.timeStart = run.time;
                job.node = run.node;
              }
            }
          });
        }
        return jobs;
      } catch (err) {
        deps.logger.error(`Failed to fetch job ${err}`);
        throw err;
      }
    },

    /**
     * Fetch all job accounts
     */
    async all(
      filters?: {
        state?: JobState;
        market?: Address;
        node?: Address;
        project?: Address;
      },
      checkRuns: boolean = false
    ): Promise<Job[]> {
      try {
        const extraGPAFilters: GetProgramAccountsMemcmpFilter[] = [];
        if (filters) {
          if (typeof filters.state === 'number') {
            extraGPAFilters.push({
              memcmp: {
                offset: BigInt(208),
                bytes: bs58.encode(Buffer.from([filters.state])) as Base58EncodedBytes,
                encoding: 'base58',
              },
            });
          }
          if (filters.project) {
            extraGPAFilters.push({
              memcmp: {
                offset: BigInt(176),
                bytes: filters.project.toString() as Base58EncodedBytes,
                encoding: 'base58',
              },
            });
          }
          if (filters.node) {
            extraGPAFilters.push({
              memcmp: {
                offset: BigInt(104),
                bytes: filters.node.toString() as Base58EncodedBytes,
                encoding: 'base58',
              },
            });
          }
          if (filters.market) {
            extraGPAFilters.push({
              memcmp: {
                offset: BigInt(72),
                bytes: filters.market.toString() as Base58EncodedBytes,
                encoding: 'base58',
              },
            });
          }
        }
        const getProgramAccountsResponse = await deps.solana.rpc
          .getProgramAccounts(programId, {
            encoding: 'base64',
            filters: [
              {
                memcmp: {
                  offset: BigInt(0),
                  bytes: bs58.encode(
                    Buffer.from(client.JOB_ACCOUNT_DISCRIMINATOR)
                  ) as Base58EncodedBytes,
                  encoding: 'base58',
                },
              },
              ...extraGPAFilters,
            ],
          })
          .send();

        const jobs: Job[] = getProgramAccountsResponse
          .map((result: (typeof getProgramAccountsResponse)[0]) => {
            try {
              const jobAccount = client.decodeJobAccount(
                parseBase64RpcAccount(result.pubkey, result.account)
              );
              return transformJobAccount(jobAccount);
            } catch (err) {
              deps.logger.error(`Failed to decode job ${err}`);
              return null;
            }
          })
          .filter((account: Job | null): account is Job => account !== null);
        if (checkRuns) {
          const runs = await this.runs();
          jobs.forEach((job) => {
            if (job.state === JobState.QUEUED) {
              const run = runs.find((run) => run.job === job.address);
              if (run) {
                job.state = JobState.RUNNING;
                job.timeStart = run.time;
                job.node = run.node;
              }
            }
          });
        }
        return jobs;
      } catch (err) {
        deps.logger.error(`Failed to fetch all jobs ${err}`);
        throw err;
      }
    },

    /**
     * Fetch all run accounts
     */
    async runs(filters?: { node?: Address; job?: Address }): Promise<Run[]> {
      try {
        const extraGPAFilters: GetProgramAccountsMemcmpFilter[] = [];
        if (filters) {
          if (filters.node) {
            extraGPAFilters.push({
              memcmp: {
                offset: BigInt(40),
                bytes: filters.node.toString() as Base58EncodedBytes,
                encoding: 'base58',
              },
            });
          }
          if (filters.job) {
            extraGPAFilters.push({
              memcmp: {
                offset: BigInt(8),
                bytes: filters.job.toString() as Base58EncodedBytes,
                encoding: 'base58',
              },
            });
          }
        }
        const getProgramAccountsResponse = await deps.solana.rpc
          .getProgramAccounts(programId, {
            encoding: 'base64',
            filters: [
              {
                memcmp: {
                  offset: BigInt(0),
                  bytes: bs58.encode(
                    Buffer.from(client.RUN_ACCOUNT_DISCRIMINATOR)
                  ) as Base58EncodedBytes,
                  encoding: 'base58',
                },
              },
              ...extraGPAFilters,
            ],
          })
          .send();

        const runAccounts: Run[] = getProgramAccountsResponse
          .map((result: (typeof getProgramAccountsResponse)[0]) => {
            try {
              const runAccount = client.decodeRunAccount(
                parseBase64RpcAccount(result.pubkey, result.account)
              );
              return transformRunAccount(runAccount);
            } catch (err) {
              deps.logger.error(`Failed to decode run ${err}`);
              return null;
            }
          })
          .filter((account: Run | null): account is Run => account !== null);
        return runAccounts;
      } catch (err) {
        deps.logger.error(`Failed to fetch all runs ${err}`);
        throw err;
      }
    },

    /**
     * Fetch all market accounts
     */
    async markets(): Promise<Market[]> {
      try {
        const getProgramAccountsResponse = await deps.solana.rpc
          .getProgramAccounts(programId, {
            encoding: 'base64',
            filters: [
              {
                memcmp: {
                  offset: BigInt(0),
                  bytes: bs58.encode(
                    Buffer.from(client.MARKET_ACCOUNT_DISCRIMINATOR)
                  ) as Base58EncodedBytes,
                  encoding: 'base58',
                },
              },
            ],
          })
          .send();

        const marketAccounts: Market[] = getProgramAccountsResponse
          .map((result: (typeof getProgramAccountsResponse)[0]) => {
            try {
              const marketAccount = client.decodeMarketAccount(
                parseBase64RpcAccount(result.pubkey, result.account)
              );
              return transformMarketAccount(marketAccount);
            } catch (err) {
              deps.logger.error(`Failed to decode market ${err}`);
              return null;
            }
          })
          .filter((account: Market | null): account is Market => account !== null);
        return marketAccounts;
      } catch (err) {
        deps.logger.error(`Failed to fetch all markets ${err}`);
        throw err;
      }
    },
    /**
     * List a new job to the marketplace
     */
    async list(params) {
      return Instructions.list(params, createInstructionsHelper(this.get, this.runs));
    },
    async listMany(
      params: Instructions.ListParams | Instructions.ListParams[],
      count?: number
    ): Promise<Instructions.ListInstruction[]> {
      const allParams = Array.isArray(params)
        ? params
        : Array.from({ length: count ?? 0 }, () => params);
      return Promise.all(allParams.map((p) => this.list(p)));
    },
    async delistMany(jobs: Address[]): Promise<Instructions.DelistInstruction[]> {
      return Promise.all(jobs.map((job) => this.delist({ job })));
    },
    async endMany(jobs: Address[]): Promise<Instructions.EndInstruction[]> {
      return Promise.all(jobs.map((job) => this.end({ job })));
    },
    async quitMany(runs: Address[]): Promise<Instructions.QuitInstruction[]> {
      return Promise.all(runs.map((run) => this.quit({ run })));
    },
    async closeMany(markets: Address[]): Promise<Instructions.CloseInstruction[]> {
      return Promise.all(markets.map((market) => this.close({ market })));
    },
    async stopMany(markets: Address[]): Promise<Instructions.StopInstruction[]> {
      return Promise.all(markets.map((market) => this.stop({ market })));
    },
    async assignMany(
      params: Instructions.AssignParams | Instructions.AssignParams[],
      count?: number
    ): Promise<Instructions.AssignInstruction[]> {
      const allParams = Array.isArray(params)
        ? params
        : Array.from({ length: count ?? 0 }, () => params);
      return Promise.all(allParams.map((p) => this.assign(p)));
    },
    async extendMany(
      params: Instructions.ExtendParams[]
    ): Promise<Instructions.ExtendInstruction[]> {
      return Promise.all(params.map((p) => this.extend(p)));
    },
    async finishMany(
      params: Instructions.FinishParams[]
    ): Promise<Instructions.FinishInstructions[]> {
      return Promise.all(params.map((p) => this.finish(p)));
    },
    async completeMany(
      params: Instructions.CompleteParams[]
    ): Promise<Instructions.CompleteInstruction[]> {
      return Promise.all(params.map((p) => this.complete(p)));
    },
    /**
     * Post a new job to the marketplace (can list or assign based on params)
     */
    async post(params: Instructions.ListParams | Instructions.AssignParams) {
      const helperParams = createInstructionsHelper(this.get, this.runs);
      // If node is provided, it's an assign operation
      if ('node' in params) {
        return Instructions.assign(params, helperParams);
      }
      // Otherwise, it's a list operation
      return Instructions.list(params, helperParams);
    },
    async assign(params) {
      return Instructions.assign(params, createInstructionsHelper(this.get, this.runs));
    },
    async extend(params) {
      return Instructions.extend(params, createInstructionsHelper(this.get, this.runs));
    },
    async delist(params) {
      return Instructions.delist(params, createInstructionsHelper(this.get, this.runs));
    },
    async open(params = {}) {
      return Instructions.open(params, createInstructionsHelper(this.get, this.runs));
    },
    async createMarket(params = {}) {
      return this.open(params);
    },
    async close(params) {
      return Instructions.close(params, createInstructionsHelper(this.get, this.runs));
    },
    async closeMarket(params) {
      return this.close(params);
    },
    async end(params) {
      return Instructions.end(params, createInstructionsHelper(this.get, this.runs));
    },
    async finish(params) {
      return Instructions.finish(params, createInstructionsHelper(this.get, this.runs));
    },
    async complete(params) {
      return Instructions.complete(params, createInstructionsHelper(this.get, this.runs));
    },
    async quit(params) {
      return Instructions.quit(params, createInstructionsHelper(this.get, this.runs));
    },
    async stop(params) {
      return Instructions.stop(params, createInstructionsHelper(this.get, this.runs));
    },
    async work(params) {
      return Instructions.work(params, createInstructionsHelper(this.get, this.runs));
    },
    async sendBatch(groups, options) {
      const results = await deps.solana.buildSignAndSendBatch(groups, {
        // Jobs instruction CU scales with the market queue size (e.g. delist scans
        // the queue) AND the queue changes across the batch (list grows it, delist
        // shrinks it). So estimate each transaction's limit by simulation, and send
        // sequentially so every simulation reflects the state left by the prior
        // transactions. Pass `estimateComputeUnits: false` for the static table
        // (no RPC, but may under-provision on a large queue) or `sequential: false`
        // to send concurrently.
        estimateComputeUnits: true,
        sequential: true,
        ...options,
        // Used for the packing ceiling and the static-table opt-out path.
        computeUnits: getJobsInstructionComputeUnits,
      });
      // Decode each transaction's instructions so callers can recover the accounts
      // they created or acted on (e.g. the job/run minted by a `list`), and group
      // those accounts by role for the quick "give me the created jobs" view.
      return results.map((result) => {
        const decoded = result.instructions.map((instruction) =>
          decodeJobsInstruction(instruction)
        );
        const accounts: Record<string, Address[]> = {};
        for (const instruction of decoded) {
          if (!instruction) continue;
          for (const [role, account] of Object.entries(instruction.accounts)) {
            (accounts[`${role}s`] ??= []).push(account);
          }
        }
        return { ...result, decoded, accounts };
      });
    },
    /**
     * Monitor program account updates using async iterators.
     * Automatically merges run account data into job account updates.
     * Uses WebSocket subscriptions with automatic restart on failure.
     *
     * @example
     * ```typescript
     * // Example: Simple monitoring - run accounts are automatically merged into job updates
     * const [eventStream, stop] = await jobsProgram.monitor();
     * for await (const event of eventStream) {
     *   if (event.type === MonitorEventType.JOB) {
     *     console.log('Job updated:', event.data.address.toString());
     *     // event.data will have state, node, and timeStart from run account if it exists
     *   } else if (event.type === MonitorEventType.MARKET) {
     *     console.log('Market updated:', event.data.address.toString());
     *   }
     * }
     * // Stop monitoring when done
     * stop();
     * ```
     *
     * @returns A tuple of [eventStream, stopFunction]
     */
    async monitor(): Promise<[AsyncIterable<SimpleMonitorEvent>, () => void]> {
      const monitorFunctions = createMonitorFunctions(this.get, this.runs, {
        deps,
        config,
        client,
        transformJobAccount,
        transformRunAccount,
        transformMarketAccount,
        mergeRunIntoJob,
      });
      return monitorFunctions.monitor();
    },
    /**
     * Monitor program account updates with detailed events for each account type.
     * Uses WebSocket subscriptions with automatic restart on failure.
     * Provides separate events for job, market, and run accounts.
     *
     * @example
     * ```typescript
     * // Example: Monitor job accounts and save to file
     * const [eventStream, stop] = await jobsProgram.monitorDetailed();
     * for await (const event of eventStream) {
     *   switch (event.type) {
     *     case MonitorEventType.JOB:
     *       console.log('Job updated:', event.data.address.toString());
     *       break;
     *     case MonitorEventType.MARKET:
     *       console.log('Market updated:', event.data.address.toString());
     *       break;
     *     case MonitorEventType.RUN:
     *       console.log('Run updated:', event.data.address.toString());
     *       break;
     *   }
     * }
     * // Stop monitoring when done
     * stop();
     * ```
     *
     * @returns A tuple of [eventStream, stopFunction]
     */
    async monitorDetailed(): Promise<[AsyncIterable<MonitorEvent>, () => void]> {
      const monitorFunctions = createMonitorFunctions(this.get, this.runs, {
        deps,
        config,
        client,
        transformJobAccount,
        transformRunAccount,
        transformMarketAccount,
        mergeRunIntoJob,
      });
      return monitorFunctions.monitorDetailed();
    },
  };
}
