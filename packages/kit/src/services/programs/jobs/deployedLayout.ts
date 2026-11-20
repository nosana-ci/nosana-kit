import {
  type Address,
  type Instruction,
  type Rpc,
  type SimulateTransactionApi,
  type TransactionError,
  appendTransactionMessageInstruction,
  blockhash,
  compileTransaction,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';

import type { SolanaService } from '../../solana/index.js';
import {
  type JobsLayout,
  type LayoutDependentInstructionName,
  type LegacyLayout,
  type RewardsAccounts,
  toLegacyLayout,
} from './legacyLayout.js';

/**
 * Anchor's AccountNotSigner. The `fee` program reads a legacy instruction's rewards reflection
 * where it expects the `authority` signer, so this is how it rejects the `legacy` layout.
 */
const ACCOUNT_NOT_SIGNER = 3010;

/** How long a `legacy` answer is reused before the program is asked again. */
const LEGACY_RECHECK_MS = 30_000;

/** Never checked: the simulation replaces it with a recent blockhash. */
const PLACEHOLDER_BLOCKHASH = blockhash('11111111111111111111111111111111');

/**
 * Returns the instruction in the layout of the deployed jobs program: `instruction` itself
 * when that is the `fee` program, its `legacy` rewrite otherwise. `nosPayer` pays for the
 * simulation unless the client has a fee payer of its own.
 */
export type MatchDeployedLayout = <T extends Instruction>(
  name: LayoutDependentInstructionName,
  instruction: T,
  nosPayer: Address
) => Promise<T | LegacyLayout<T>>;

/** What one simulation of a `legacy` instruction says about the deployed program. */
type Verdict = JobsLayout | 'unknown';

/**
 * Finds the deployed layout by simulating the `legacy` rewrite of the instruction being built,
 * so callers keep working across the program upgrade without a coordinated release. Only a
 * rejection on `authority` means `fee`, and only a successful simulation means `legacy`: an
 * instruction that fails for its own reasons says nothing about the program, so it is built as
 * `legacy` without the answer being kept. A `fee` answer is kept, since the program is not
 * downgraded. A `legacy` answer is kept for {@link LEGACY_RECHECK_MS}: an instruction built just
 * before the upgrade fails like any transaction that straddles it.
 *
 * Builds running at the same time wait for the simulation in flight; when it settles nothing,
 * each simulates its own instruction.
 */
export function createMatchDeployedLayout(
  solana: Pick<SolanaService, 'rpc' | 'feePayer'>,
  getRewardsAccounts: () => Promise<RewardsAccounts>
): MatchDeployedLayout {
  let isFeeLayout = false;
  let legacyCheckedAt = -Infinity;
  let inFlight: Promise<Verdict> | undefined;

  async function deployedLayout(legacy: Instruction, feePayer: Address): Promise<JobsLayout> {
    if (Date.now() - legacyCheckedAt < LEGACY_RECHECK_MS) return 'legacy';

    // Checked without awaiting, so builds starting together join one simulation.
    const shared = inFlight ? await inFlight : undefined;
    const verdict =
      shared === 'fee' || shared === 'legacy' ? shared : await simulate(legacy, feePayer);
    return verdict === 'fee' ? 'fee' : 'legacy';
  }

  /** Simulates for this build; a failed RPC call fails this build only. */
  function simulate(legacy: Instruction, feePayer: Address): Promise<Verdict> {
    const verdict = simulateLegacy(solana.rpc, legacy, feePayer).then(remember);
    const shared = verdict.catch((): Verdict => 'unknown');
    inFlight = shared;
    void shared.finally(() => {
      if (inFlight === shared) inFlight = undefined;
    });
    return verdict;
  }

  function remember(verdict: Verdict): Verdict {
    if (verdict === 'fee') isFeeLayout = true;
    if (verdict === 'legacy') legacyCheckedAt = Date.now();
    return verdict;
  }

  return async (name, instruction, nosPayer) => {
    if (isFeeLayout) return instruction;
    const legacy = toLegacyLayout(name, instruction, await getRewardsAccounts());
    const feePayer = solana.feePayer?.address ?? nosPayer;
    return (await deployedLayout(legacy, feePayer)) === 'fee' ? instruction : legacy;
  };
}

async function simulateLegacy(
  rpc: Rpc<SimulateTransactionApi>,
  legacy: Instruction,
  feePayer: Address
): Promise<Verdict> {
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayer(feePayer, m),
    (m) =>
      setTransactionMessageLifetimeUsingBlockhash(
        { blockhash: PLACEHOLDER_BLOCKHASH, lastValidBlockHeight: 0n },
        m
      ),
    (m) => appendTransactionMessageInstruction(legacy, m)
  );
  const { value } = await rpc
    .simulateTransaction(getBase64EncodedWireTransaction(compileTransaction(message)), {
      encoding: 'base64',
      sigVerify: false,
      replaceRecentBlockhash: true,
    })
    .send();
  if (value.err === null) return 'legacy';
  return isAccountNotSigner(value.err) ? 'fee' : 'unknown';
}

function isAccountNotSigner(error: TransactionError): boolean {
  if (typeof error !== 'object' || !('InstructionError' in error)) return false;
  const [, instructionError] = error.InstructionError;
  return (
    typeof instructionError === 'object' &&
    'Custom' in instructionError &&
    // typed as a number, but the RPC delivers it as a bigint
    Number(instructionError.Custom) === ACCOUNT_NOT_SIGNER
  );
}
