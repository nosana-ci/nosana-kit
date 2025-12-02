import bs58 from 'bs58';
import { solBytesArrayToIpfsHash } from '@nosana/ipfs';
import { parseBase64RpcAccount } from '@solana/kit';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { ErrorCodes, NosanaError } from '../../../errors/NosanaError.js';
import { convertBigIntToNumber, type ConvertTypesForDb } from '../../../utils/index.js';

import type {
  Address,
  EncodedAccount,
  Account,
  Base58EncodedBytes,
  GetProgramAccountsMemcmpFilter,
  ReadonlyUint8Array,
  AccountInfoWithBase64EncodedData,
  AccountInfoBase,
  SolanaRpcResponse,
  AccountInfoWithPubkey,
} from '@solana/kit';
import type { ProgramDeps, Wallet } from '../../../types.js';
import {
  getStaticAccounts as getStaticAccountsFn,
  type StaticAccounts,
} from '../../../utils/getStaticAccounts.js';
import type { ProgramConfig } from '../../../config/types.js';
import type { InstructionsHelperParams } from './instructions/types.js';

import * as Instructions from './instructions/index.js';
import * as programClient from '../../../generated_clients/jobs/index.js';

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

/**
 * Monitor event type constants
 */
export const MonitorEventType = {
  JOB: 'job',
  MARKET: 'market',
  RUN: 'run',
} as const;

export type MonitorEventType = typeof MonitorEventType[keyof typeof MonitorEventType];

/**
 * Simple monitor event (run accounts are auto-merged into job events)
 */
export type SimpleMonitorEvent =
  | { type: typeof MonitorEventType.JOB; data: Job }
  | { type: typeof MonitorEventType.MARKET; data: Market };

/**
 * Event types for monitoring (extends SimpleMonitorEvent with run events)
 */
export type MonitorEvent = SimpleMonitorEvent | { type: typeof MonitorEventType.RUN; data: Run };

/**
 * Jobs program interface
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
   * Post a new job to the marketplace
   */
  post: Instructions.Post;

  /**
   *  Extend an existing job's timeout
   */
  extend: Instructions.Extend;
  /**
   * Delist a job from the marketplace
   */
  delist: Instructions.Delist;
  /**
   * Stop a running job
   */
  end(params: { job: Address }): Promise<ReturnType<typeof programClient.getEndInstruction>>;

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
   * Set up WebSocket subscription for program notifications
   */
  async function setupSubscription(
    abortController: AbortController
  ): Promise<
    AsyncIterable<
      SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>>
    >
  > {
    try {
      // Set up the subscription using the correct API pattern
      const subscriptionIterable = await deps.solana.rpcSubscriptions
        .programNotifications(programId, { encoding: 'base64' })
        .subscribe({ abortSignal: abortController.signal });

      return subscriptionIterable;
    } catch (error) {
      throw new Error(`Failed to setup subscription: ${error}`);
    }
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

  async function getNosATA(owner: Address) {
    const [ata] = await findAssociatedTokenPda({
      mint: config.nosTokenAddress,
      owner,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    return ata;
  }

  /**
   * Internal helper to create a monitor stream
   */
  async function createMonitorStream(
    get: JobsProgram['get'],
    runs: JobsProgram['runs'],
    autoMerge: true
  ): Promise<[AsyncIterable<SimpleMonitorEvent>, () => void]>;
  async function createMonitorStream(
    get: JobsProgram['get'],
    runs: JobsProgram['runs'],
    autoMerge: false
  ): Promise<[AsyncIterable<MonitorEvent>, () => void]>;
  async function createMonitorStream(
    get: JobsProgram['get'],
    runs: JobsProgram['runs'],
    autoMerge: boolean
  ): Promise<[AsyncIterable<SimpleMonitorEvent | MonitorEvent>, () => void]> {
    let abortController: AbortController | null = null;
    let isMonitoring = true;

    // Function to stop all monitoring
    const stopMonitoring = () => {
      isMonitoring = false;
      if (abortController) {
        abortController.abort();
      }
      deps.logger.info(`Stopped monitoring job program account updates`);
    };

    // Create async generator that handles reconnection
    const eventStream = (async function* () {
      while (isMonitoring) {
        try {
          deps.logger.info('Attempting to establish WebSocket subscription...');

          abortController = new AbortController();
          const subscriptionIterable = await setupSubscription(abortController);

          deps.logger.info('Successfully established WebSocket subscription');

          // Yield events from the subscription
          yield* createEventStream(subscriptionIterable, () => isMonitoring, autoMerge, get, runs);
        } catch (error) {
          if (!isMonitoring) {
            // Monitoring was stopped, exit gracefully
            return;
          }

          deps.logger.warn(`WebSocket subscription failed: ${error}`);

          // Clean up current subscription
          if (abortController) {
            abortController.abort();
            abortController = null;
          }

          if (isMonitoring) {
            deps.logger.info('Retrying WebSocket subscription in 5 seconds...');
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      }
    })();

    deps.logger.info(`Successfully started monitoring job program account updates`);

    return [eventStream, stopMonitoring];
  }

  /**
   * Create an async generator that yields monitor events from subscription notifications
   */
  async function* createEventStream(
    subscriptionIterable: AsyncIterable<
      SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>>
    >,
    isMonitoring: () => boolean,
    autoMerge: boolean,
    get: JobsProgram['get'],
    runs: JobsProgram['runs']
  ): AsyncGenerator<MonitorEvent, void, unknown> {
    try {
      for await (const notification of subscriptionIterable) {
        // Check if monitoring should continue
        if (!isMonitoring()) {
          deps.logger.info('Monitoring stopped, exiting subscription processing');
          break;
        }

        try {
          const { value } = notification;
          const { account, pubkey } = value;
          const encodedAccount: EncodedAccount = parseBase64RpcAccount(pubkey, account);
          const accountType = client.identifyNosanaJobsAccount(encodedAccount);

          switch (accountType) {
            case client.NosanaJobsAccount.JobAccount: {
              const jobAccount = client.decodeJobAccount(encodedAccount);
              let job = transformJobAccount(jobAccount);

              // If auto-merge is enabled, check for run accounts
              if (autoMerge && job.state === JobState.QUEUED) {
                try {
                  const runAccounts = await runs({ job: job.address });
                  if (runAccounts.length > 0) {
                    job = mergeRunIntoJob(job, runAccounts[0]);
                  }
                } catch (error) {
                  deps.logger.error(`Error checking run account for job ${job.address}: ${error}`);
                }
              }

              yield { type: MonitorEventType.JOB, data: job };
              break;
            }
            case client.NosanaJobsAccount.MarketAccount: {
              const marketAccount = client.decodeMarketAccount(encodedAccount);
              const market = transformMarketAccount(marketAccount);
              yield { type: MonitorEventType.MARKET, data: market };
              break;
            }
            case client.NosanaJobsAccount.RunAccount: {
              const runAccount = client.decodeRunAccount(encodedAccount);
              const run = transformRunAccount(runAccount);

              if (autoMerge) {
                // For auto-merge, fetch the job and merge run data, then yield as job event
                try {
                  const job = await get(run.job, false);
                  const mergedJob = mergeRunIntoJob(job, run);
                  yield { type: MonitorEventType.JOB, data: mergedJob };
                } catch (error) {
                  deps.logger.error(
                    `Error fetching job ${run.job} for run account ${runAccount.address}: ${error}`
                  );
                  // Skip this event if we can't fetch the job
                }
              } else {
                // For detailed monitoring, yield run event as-is
                yield { type: MonitorEventType.RUN, data: run };
              }
              break;
            }
            default:
              deps.logger.error(`No support yet for account type: ${accountType}`);
              break;
          }
        } catch (error) {
          deps.logger.error(`Error handling account update notification: ${error}`);
          // Continue processing other events
        }
      }
    } catch (error) {
      deps.logger.error(`Subscription error: ${error}`);
      // Throw the error so the calling function can restart the subscription
      throw error;
    }
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
      getNosATA,
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
     * Post a new job to the marketplace
     */
    async post(params) {
      return Instructions.post(params, createInstructionsHelper(this.get, this.runs));
    },
    async extend(params) {
      return Instructions.extend(params, createInstructionsHelper(this.get, this.runs));
    },
    async delist(params) {
      return Instructions.delist(params, createInstructionsHelper(this.get, this.runs));
    },
    async end(params) {
      return Instructions.end(params, createInstructionsHelper(this.get, this.runs));
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
      return createMonitorStream(this.get, this.runs, true);
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
      return createMonitorStream(this.get, this.runs, false);
    },
  };
}
