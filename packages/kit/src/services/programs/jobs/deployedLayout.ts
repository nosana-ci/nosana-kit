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

/**
 * Finds the deployed layout by simulating the `legacy` rewrite of each instruction being built,
 * so callers keep working across the program upgrade without a coordinated release. Only the
 * `fee` program rejects it on `authority`; any other outcome builds the `legacy` layout. The
 * `fee` answer is kept, since the program is not downgraded.
 */
export function createMatchDeployedLayout(
  solana: Pick<SolanaService, 'rpc' | 'feePayer'>,
  getRewardsAccounts: () => Promise<RewardsAccounts>
): MatchDeployedLayout {
  let isFeeLayout = false;

  return async (name, instruction, nosPayer) => {
    if (isFeeLayout) return instruction;
    const legacy = toLegacyLayout(name, instruction, await getRewardsAccounts());
    const feePayer = solana.feePayer?.address ?? nosPayer;
    if (!(await rejectsLegacyLayout(solana.rpc, legacy, feePayer))) return legacy;
    isFeeLayout = true;
    return instruction;
  };
}

async function rejectsLegacyLayout(
  rpc: Rpc<SimulateTransactionApi>,
  legacy: Instruction,
  feePayer: Address
): Promise<boolean> {
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
  return value.err !== null && isAccountNotSigner(value.err);
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
