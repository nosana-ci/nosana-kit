import {
  type Address,
  type Blockhash,
  type Instruction,
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createTransactionMessage,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import { ErrorCodes, NosanaError } from '../errors/NosanaError.js';

/**
 * Maximum size, in bytes, of a serialized Solana transaction (the packet MTU limit).
 * @group @nosana/kit
 */
export const TRANSACTION_SIZE_LIMIT = 1232;

/**
 * Maximum compute units a single Solana transaction may consume.
 * @group @nosana/kit
 */
export const MAX_COMPUTE_UNITS = 1_400_000;

// Placeholder fee payer and blockhash used purely to measure a transaction's
// serialized size locally (no RPC). Neither value affects the byte length: a fee
// payer is always one 32-byte account and a blockhash is always 32 bytes, so the
// measurement is size-accurate. Using a placeholder fee payer that does not appear
// in any instruction is the conservative choice — it can only ever over-count by a
// single account, never under-count.
const PLACEHOLDER_FEE_PAYER = address('11111111111111111111111111111112');
const PLACEHOLDER_BLOCKHASH = {
  blockhash: '11111111111111111111111111111111' as Blockhash,
  lastValidBlockHeight: 0n,
};

const transactionEncoder = getTransactionEncoder();

/**
 * Measure the serialized byte size of a transaction built from the given
 * instructions. Compiles the message in-memory using placeholder fee payer and
 * blockhash values — no network access and no signing required.
 */
function measureTransactionSize(instructions: Instruction[], feePayer: Address): number {
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(PLACEHOLDER_BLOCKHASH, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx)
  );
  return transactionEncoder.encode(compileTransaction(message)).length;
}

/**
 * Options for {@link packInstructions}.
 * @group @nosana/kit
 */
export interface PackInstructionsOptions {
  /**
   * The fee payer address for the resulting transactions. Provided so that size
   * measurement accounts for account deduplication accurately (the fee payer is
   * shared across every instruction). Defaults to a placeholder address, which is
   * slightly conservative.
   */
  feePayer?: Address;
  /**
   * Instructions that will be prepended to every transaction at send time (for
   * example compute-budget or priority-fee instructions). They are charged against
   * the size budget of each bucket but are NOT included in the returned buckets —
   * the transaction builder adds the real ones when sending.
   */
  reservedInstructions?: Instruction[];
  /**
   * Maximum serialized transaction size in bytes. Defaults to
   * {@link TRANSACTION_SIZE_LIMIT} (1232).
   */
  maxTransactionSize?: number;
  /**
   * Optional per-instruction compute-unit estimator. When provided, a bucket is
   * also split whenever its cumulative estimated compute units would exceed
   * {@link PackInstructionsOptions.maxComputeUnits}. When omitted, compute units
   * are not considered and only transaction size bounds the packing.
   */
  computeUnits?: (instruction: Instruction) => number;
  /**
   * Maximum compute units per transaction. Only enforced when
   * {@link PackInstructionsOptions.computeUnits} is provided. Defaults to
   * {@link MAX_COMPUTE_UNITS} (1,400,000).
   */
  maxComputeUnits?: number;
}

/**
 * Greedily pack instruction groups into the fewest transactions that each stay
 * within Solana's transaction size limit.
 *
 * Each entry of `groups` is an *atomic group*: a single instruction, or an array
 * of instructions that must land together in the same transaction (e.g. a
 * create-account + initialize pair). A group is never split across transactions;
 * groups are filled into a bucket in order until the next group would overflow the
 * size limit, at which point a new bucket is started.
 *
 * A bucket is bounded by two constraints, and is split whenever the next group
 * would exceed either one:
 * - Transaction size: determined by compiling each candidate transaction
 *   in-memory and measuring its serialized length, so shared accounts (program
 *   ids, fee payer, sysvars) are correctly deduplicated — no static estimate and
 *   no RPC call.
 * - Compute units (optional): when a `computeUnits` estimator is provided, the
 *   cumulative estimated compute units of a bucket may not exceed
 *   `maxComputeUnits`.
 *
 * @param groups Atomic instruction groups to pack, in order.
 * @param options Packing options (fee payer, reserved instructions, limits).
 * @returns An array of buckets; each bucket is a flat array of instructions for
 *          one transaction.
 * @throws {NosanaError} If a single group cannot fit in one transaction (by size
 *         or compute units), since it cannot be split.
 * @group @nosana/kit
 */
export function packInstructions(
  groups: Array<Instruction | Instruction[]>,
  options: PackInstructionsOptions = {}
): Instruction[][] {
  const feePayer = options.feePayer ?? PLACEHOLDER_FEE_PAYER;
  const reserved = options.reservedInstructions ?? [];
  const maxSize = options.maxTransactionSize ?? TRANSACTION_SIZE_LIMIT;
  const computeUnitsOf = options.computeUnits;
  const maxCU = options.maxComputeUnits ?? MAX_COMPUTE_UNITS;

  const groupComputeUnits = (ixs: Instruction[]): number =>
    computeUnitsOf ? ixs.reduce((sum, ix) => sum + computeUnitsOf(ix), 0) : 0;

  const buckets: Instruction[][] = [];
  let current: Instruction[] = [];
  let currentCU = 0;

  const tooLargeToSplit = (groupSize: number, constraint: 'size' | 'compute units'): never => {
    const limit = constraint === 'size' ? `${maxSize} bytes` : `${maxCU} compute units`;
    throw new NosanaError(
      `An atomic group of ${groupSize} instruction(s) exceeds the maximum transaction ` +
        `${constraint} (${limit}) and cannot be split across transactions`,
      ErrorCodes.TRANSACTION_ERROR
    );
  };

  for (const group of groups) {
    const groupIxs = Array.isArray(group) ? group : [group];
    if (groupIxs.length === 0) continue;

    const groupCU = groupComputeUnits(groupIxs);
    const withGroup = [...current, ...groupIxs];
    const sizeFits = measureTransactionSize([...reserved, ...withGroup], feePayer) <= maxSize;
    const computeFits = !computeUnitsOf || currentCU + groupCU <= maxCU;

    if (sizeFits && computeFits) {
      current = withGroup;
      currentCU += groupCU;
      continue;
    }

    // The group does not fit alongside the current bucket's contents.
    if (current.length === 0) {
      // Nothing to flush — the group cannot fit even on its own.
      tooLargeToSplit(groupIxs.length, sizeFits ? 'compute units' : 'size');
    }

    // Flush the current bucket and place the group into a fresh one.
    buckets.push(current);
    if (measureTransactionSize([...reserved, ...groupIxs], feePayer) > maxSize) {
      tooLargeToSplit(groupIxs.length, 'size');
    }
    if (computeUnitsOf && groupCU > maxCU) {
      tooLargeToSplit(groupIxs.length, 'compute units');
    }
    current = [...groupIxs];
    currentCU = groupCU;
  }

  if (current.length > 0) buckets.push(current);
  return buckets;
}
