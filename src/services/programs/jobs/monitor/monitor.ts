import { parseBase64RpcAccount } from '@solana/kit';
import type {
  Address,
  EncodedAccount,
  Account,
  AccountInfoWithBase64EncodedData,
  AccountInfoBase,
  SolanaRpcResponse,
  AccountInfoWithPubkey,
} from '@solana/kit';
import type { ProgramDeps } from '../../../../types.js';
import type { ProgramConfig } from '../../../../config/types.js';
import type { JobsProgram, Job, Market, Run } from '../JobsProgram.js';
import { JobState } from '../JobsProgram.js';
import * as programClient from '../../../../generated_clients/jobs/index.js';
import { MonitorEventType, type MonitorEvent, type SimpleMonitorEvent } from './types.js';

export interface MonitorDeps {
  deps: ProgramDeps;
  config: ProgramConfig;
  client: typeof programClient;
  transformJobAccount: (jobAccount: Account<programClient.JobAccount>) => Job;
  transformRunAccount: (runAccount: Account<programClient.RunAccount>) => Run;
  transformMarketAccount: (marketAccount: Account<programClient.MarketAccount>) => Market;
  mergeRunIntoJob: (job: Job, run: Run) => Job;
}

/**
 * Set up WebSocket subscription for program notifications
 */
async function setupSubscription(
  deps: ProgramDeps,
  programId: Address,
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
 * Create an async generator that yields monitor events from subscription notifications
 */
async function* createEventStream(
  subscriptionIterable: AsyncIterable<
    SolanaRpcResponse<AccountInfoWithPubkey<AccountInfoBase & AccountInfoWithBase64EncodedData>>
  >,
  isMonitoring: () => boolean,
  autoMerge: boolean,
  get: JobsProgram['get'],
  runs: JobsProgram['runs'],
  monitorDeps: MonitorDeps
): AsyncGenerator<MonitorEvent, void, unknown> {
  const {
    deps,
    client,
    transformJobAccount,
    transformRunAccount,
    transformMarketAccount,
    mergeRunIntoJob,
  } = monitorDeps;

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

/**
 * Internal helper to create a monitor stream
 */
async function createMonitorStream(
  get: JobsProgram['get'],
  runs: JobsProgram['runs'],
  autoMerge: true,
  monitorDeps: MonitorDeps
): Promise<[AsyncIterable<SimpleMonitorEvent>, () => void]>;
async function createMonitorStream(
  get: JobsProgram['get'],
  runs: JobsProgram['runs'],
  autoMerge: false,
  monitorDeps: MonitorDeps
): Promise<[AsyncIterable<MonitorEvent>, () => void]>;
async function createMonitorStream(
  get: JobsProgram['get'],
  runs: JobsProgram['runs'],
  autoMerge: boolean,
  monitorDeps: MonitorDeps
): Promise<[AsyncIterable<SimpleMonitorEvent | MonitorEvent>, () => void]> {
  const { deps, config } = monitorDeps;
  const programId = config.jobsAddress;
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
        const subscriptionIterable = await setupSubscription(deps, programId, abortController);

        deps.logger.info('Successfully established WebSocket subscription');

        // Yield events from the subscription
        yield* createEventStream(
          subscriptionIterable,
          () => isMonitoring,
          autoMerge,
          get,
          runs,
          monitorDeps
        );
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
 * Factory function to create monitor functions
 */
export function createMonitorFunctions(
  get: JobsProgram['get'],
  runs: JobsProgram['runs'],
  monitorDeps: MonitorDeps
) {
  return {
    async monitor(): Promise<[AsyncIterable<SimpleMonitorEvent>, () => void]> {
      return createMonitorStream(get, runs, true, monitorDeps);
    },
    async monitorDetailed(): Promise<[AsyncIterable<MonitorEvent>, () => void]> {
      return createMonitorStream(get, runs, false, monitorDeps);
    },
  };
}
