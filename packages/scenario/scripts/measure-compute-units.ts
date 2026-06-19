/**
 * Measure the real compute-unit (CU) cost of each Nosana jobs instruction against
 * a local validator and (re)generate the static table consumed at runtime by
 * `getJobsInstructionComputeUnits` / `jobs.sendBatch`.
 *
 * Usage (from the repo root):
 *
 *     pnpm build                                    # build workspace packages
 *     pnpm --filter @nosana/scenario localnet:up    # start the localnet validator
 *     pnpm gen:cu                                    # run this script
 *     pnpm --filter @nosana/scenario localnet:down  # stop it when done
 *
 * Each instruction is simulated (no signature verification, blockhash replaced) a
 * few times; we take the maximum observed `unitsConsumed` and add a 20% safety
 * margin so the stored value is a conservative upper bound — too-low would fail a
 * transaction, too-high only overpays priority fees.
 *
 * The job lifecycle is driven on-chain to reach each instruction's required state
 * (e.g. assigning a job to the wallet-as-node yields a running job to measure
 * end/quit/finish against). A few instructions still need a staked node (work,
 * stop) or a completed job (complete); those keep their previous value and are
 * reported at the end.
 */
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Base64EncodedWireTransaction, Instruction } from '@solana/kit';
import {
  JobsClient,
  JobState,
  JOBS_COMPUTE_UNITS,
  type JobsInstructionName,
  type NosanaClient,
  type Address,
} from '@nosana/kit';

import { getScenarioClient } from '../src/setup.js';

const SAMPLES = 3;
const SAFETY_MARGIN = 1.2; // +20%
const DEFAULT_TIMEOUT = 3600;
const DEFAULT_IPFS_HASH = 'QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p';

const OUTPUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../kit/src/services/programs/jobs/computeUnits.generated.ts'
);

/** Round a measured cost up to a conservative, stable stored value. */
function withMargin(units: number): number {
  return Math.ceil((units * SAFETY_MARGIN) / 1000) * 1000;
}

/**
 * Simulate one or more instructions and return the compute units consumed.
 * Disables signature verification and replaces the recent blockhash so an
 * unsigned, just-built transaction can be simulated as-is.
 */
async function simulate(client: NosanaClient, instructions: Instruction[]): Promise<number> {
  const message = await client.solana.buildTransaction(instructions);
  const signed = await client.solana.signTransaction(message);
  const wire = client.solana.serializeTransaction(signed) as Base64EncodedWireTransaction;

  const result = await client.solana.rpc
    .simulateTransaction(wire, {
      encoding: 'base64',
      replaceRecentBlockhash: true,
      sigVerify: false,
    })
    .send();

  if (result.value.err) {
    // Solana sim errors can contain BigInt fields, so stringify them safely. The
    // trailing program logs usually carry the actual on-chain reason.
    const err = JSON.stringify(result.value.err, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v
    );
    const logs = (result.value.logs ?? []).slice(-4).join(' | ');
    throw new Error(`simulation failed: ${err}${logs ? ` — ${logs}` : ''}`);
  }
  if (result.value.unitsConsumed == null) {
    throw new Error('simulation returned no unitsConsumed');
  }
  return Number(result.value.unitsConsumed);
}

/** Measure an instruction `SAMPLES` times and return max(samples) + margin. */
async function measure(
  client: NosanaClient,
  build: () => Promise<Instruction | Instruction[]>
): Promise<number> {
  let max = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const built = await build();
    const ixs = Array.isArray(built) ? built : [built];
    max = Math.max(max, await simulate(client, ixs));
  }
  return withMargin(max);
}

async function main(): Promise<void> {
  console.log('Connecting to localnet…');
  const client = await getScenarioClient({ network: 'localnet' });

  // Start from the existing table so any op we do not measure keeps its value.
  const results: Record<JobsInstructionName, number> = { ...JOBS_COMPUTE_UNITS };
  const measured: JobsInstructionName[] = [];
  const skipped: { name: JobsInstructionName; reason: string }[] = [];

  const record = async (
    name: JobsInstructionName,
    build: () => Promise<Instruction | Instruction[]>
  ): Promise<void> => {
    try {
      results[name] = await measure(client, build);
      measured.push(name);
      console.log(`  ✓ ${name}: ${results[name]} CU`);
    } catch (err) {
      skipped.push({ name, reason: err instanceof Error ? err.message : String(err) });
      console.warn(`  ⚠ ${name}: skipped (${err instanceof Error ? err.message : err})`);
    }
  };

  // --- Set up minimal on-chain state, measuring as we go ---------------------

  // open: no prerequisites.
  await record('open', () => client.jobs.createMarket());

  // Create a real market to measure the job instructions against.
  console.log('Creating a market…');
  const openIx = await client.jobs.createMarket();
  const market: Address = JobsClient.parseOpenInstruction(openIx).accounts.market.address;
  await client.solana.buildSignAndSend(openIx);

  const listParams = { market, timeout: DEFAULT_TIMEOUT, ipfsHash: DEFAULT_IPFS_HASH };

  // list: needs only an open market. (work needs a staked node — measured below.)
  await record('list', () => client.jobs.list(listParams));

  // Create a real queued job to measure job-scoped instructions against.
  console.log('Listing a job…');
  const listIx = await client.jobs.list(listParams);
  const job: Address = JobsClient.parseListInstruction(listIx).accounts.job.address;
  await client.solana.buildSignAndSend(listIx);

  // extend / delist: operate on a queued job (simulation only — state unchanged).
  await record('extend', () => client.jobs.extend({ job, timeout: DEFAULT_TIMEOUT }));
  await record('delist', () => client.jobs.delist({ job }));

  // close: measure on a fresh, empty market.
  console.log('Creating an empty market for close…');
  const emptyOpenIx = await client.jobs.createMarket();
  const emptyMarket: Address = JobsClient.parseOpenInstruction(emptyOpenIx).accounts.market.address;
  await client.solana.buildSignAndSend(emptyOpenIx);
  await record('close', () => client.jobs.closeMarket({ market: emptyMarket }));

  // --- Node lifecycle: stake → work → assign → end / quit / finish -----------
  // The running-job instructions all require a staked node queued in a market.
  // Stake (amount 0 is enough on a default market), join a fresh market's node
  // queue, then assign a job to the queued node to reach a RUNNING job. The wallet
  // acts as both project and node, so every ATA already exists.
  try {
    const node = client.wallet?.address;
    if (!node) throw new Error('wallet address unavailable');

    // Ensure the node has a stake account.
    try {
      await client.stake.getByOwner();
    } catch {
      console.log('Creating stake account…');
      await client.solana.buildSignAndSend(await client.stake.stake({ amount: 0, days: 14 }));
    }

    // Fresh market with no queued jobs, so the node enters the NODE queue.
    console.log('Creating a market and joining the node queue…');
    const nodeMarketIx = await client.jobs.createMarket();
    const nodeMarket: Address =
      JobsClient.parseOpenInstruction(nodeMarketIx).accounts.market.address;
    await client.solana.buildSignAndSend(nodeMarketIx);

    // work: node enters the node queue.
    await record('work', () => client.jobs.work({ market: nodeMarket }));
    await client.solana.buildSignAndSend(await client.jobs.work({ market: nodeMarket }));

    // stop: exit the node queue (simulation only — the node stays queued).
    await record('stop', () => client.jobs.stop({ market: nodeMarket }));

    // assign: the market now has a queued node, so a job can be assigned to it.
    const assignParams = {
      market: nodeMarket,
      node,
      timeout: DEFAULT_TIMEOUT,
      ipfsHash: DEFAULT_IPFS_HASH,
    };
    await record('assign', () => client.jobs.assign(assignParams));

    // Send one assign to create a RUNNING job + run for the rest of the lifecycle.
    console.log('Assigning a job to measure running-state ops…');
    const assignIx = await client.jobs.assign(assignParams);
    const parsed = JobsClient.parseAssignInstruction(assignIx);
    const runningJob: Address = parsed.accounts.job.address;
    const runAddress: Address = parsed.accounts.run.address;
    await client.solana.buildSignAndSend(assignIx);

    // end / quit / finish: all measured by simulation against the RUNNING job while
    // its run account still exists (simulation does not change state). We do NOT
    // send `end` here — that would close the run account and break finish. finish:
    // jobs instruction only — drop any ATA-creation instructions the helper prepends.
    await record('end', () => client.jobs.end({ job: runningJob }));
    await record('quit', () => client.jobs.quit({ run: runAddress }));
    await record('finish', () =>
      client.jobs
        .finish({ job: runningJob, ipfsResultsHash: DEFAULT_IPFS_HASH })
        .then((ixs) => ixs[ixs.length - 1])
    );

    // complete needs a terminated job. Send `end` to move it out of RUNNING (this
    // closes the run, so it must come after the finish simulation above), then
    // measure complete against the resulting state.
    console.log('Ending the job to measure complete…');
    await client.solana.buildSignAndSend(await client.jobs.end({ job: runningJob }));
    const ended = await client.jobs.get(runningJob);
    console.log(`  job state after end: ${JobState[ended.state]}`);
    await record('complete', () =>
      client.jobs.complete({ job: runningJob, ipfsResultsHash: DEFAULT_IPFS_HASH })
    );
  } catch (err) {
    console.warn(`⚠ node lifecycle setup failed: ${err instanceof Error ? err.message : err}`);
  }

  // --- Still unmeasured ------------------------------------------------------
  // `complete` needs a fully completed job, which the script does not orchestrate.
  const accountedFor = new Set<JobsInstructionName>([...measured, ...skipped.map((s) => s.name)]);
  for (const name of ['complete'] as const) {
    if (!accountedFor.has(name)) {
      skipped.push({ name, reason: 'requires a completed job — not yet implemented' });
    }
  }

  writeTable(results, measured);

  console.log(`\nMeasured ${measured.length}: ${measured.join(', ')}`);
  if (skipped.length) {
    console.log(
      `Kept existing values for ${skipped.length}: ` +
        skipped.map((s) => s.name).join(', ') +
        '\n(extend measure-compute-units.ts to cover these)'
    );
  }
  console.log(`\nWrote ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

/** Render and write the generated table file. */
function writeTable(results: Record<JobsInstructionName, number>, measured: string[]): void {
  if (!existsSync(OUTPUT_PATH)) {
    throw new Error(`Output file not found: ${OUTPUT_PATH}`);
  }
  const measuredAt = new Date().toISOString();
  const entries = (Object.keys(results) as JobsInstructionName[])
    .map((name) => {
      const tag = measured.includes(name) ? 'measured' : 'unmeasured — kept previous value';
      return `  ${name}: ${results[name]}, // ${tag}`;
    })
    .join('\n');

  const content = `/**
 * AUTO-GENERATED compute-unit costs for the Nosana jobs program instructions.
 *
 * Please DO NOT EDIT THIS FILE by hand. Regenerate it with:
 *
 *     pnpm gen:cu
 *
 * which measures each instruction's real \`unitsConsumed\` against a local validator
 * (see packages/scenario/scripts/measure-compute-units.ts) and applies a margin.
 *
 * measuredAt: ${measuredAt}
 * margin: max of ${SAMPLES} samples + ${Math.round((SAFETY_MARGIN - 1) * 100)}%, rounded up to 1,000 CU
 */

/**
 * Measured compute-unit cost per jobs instruction, keyed by the operation name.
 * Each value is a conservative upper bound that includes the safety margin,
 * suitable for use directly as a \`SetComputeUnitLimit\`.
 * @group @nosana/kit
 */
export const JOBS_COMPUTE_UNITS = {
${entries}
} as const;

/**
 * Name of a jobs instruction with a known compute-unit cost.
 * @group @nosana/kit
 */
export type JobsInstructionName = keyof typeof JOBS_COMPUTE_UNITS;
`;

  writeFileSync(OUTPUT_PATH, content, 'utf8');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
