import type { Address } from '@solana/kit';
import { getCreateAssociatedTokenIdempotentInstructionAsync } from '@solana-program/token';
import { ipfsHashToSolBytesArray } from '@nosana/ipfs';

import { type getFinishInstruction } from '../../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

type CreateATAInstruction = Awaited<
  ReturnType<typeof getCreateAssociatedTokenIdempotentInstructionAsync>
>;

export type FinishParams = {
  job: Address;
  ipfsResultsHash: string;
};

export type FinishInstruction = ReturnType<typeof getFinishInstruction>;

// Tuple type: last instruction is always FinishInstruction, preceded by 0-2 ATA creation instructions
export type FinishInstructions =
  | [FinishInstruction]
  | [CreateATAInstruction, FinishInstruction]
  | [CreateATAInstruction, CreateATAInstruction, FinishInstruction];

export type Finish = (params: FinishParams) => Promise<FinishInstructions>;

export async function finish(
  { job, ipfsResultsHash }: FinishParams,
  {
    config,
    deps,
    client,
    get,
    getRuns,
    getRequiredWallet,
    getStaticAccounts,
    getNosATA,
  }: InstructionsHelperParams
): Promise<FinishInstructions> {
  try {
    const wallet = getRequiredWallet();

    // Get required accounts in parallel
    const [jobAccount, [run], { jobsProgram, ...staticAccounts }] = await Promise.all([
      get(job, false),
      getRuns({ job }),
      getStaticAccounts(),
    ]);

    if (!run) {
      throw new Error('No job run account found for the specified job');
    }

    // Derive vault PDA and get user ATA in parallel
    const [vault, nodeATA] = await Promise.all([
      deps.solana.pda([jobAccount.market, config.nosTokenAddress], jobsProgram),
      getNosATA(run.node), // ATA for the node (user)
    ]);

    // Determine deposit account: if job.price > 0, use job payer's ATA, otherwise use vault
    const deposit = jobAccount.price > 0 ? await getNosATA(jobAccount.payer) : vault;

    // Convert IPFS result hash to Solana bytes array
    const ipfsResult = new Uint8Array(ipfsHashToSolBytesArray(ipfsResultsHash));

    // Create the finish instruction
    const finishInstruction = client.getFinishInstruction(
      {
        job,
        run: run.address,
        market: jobAccount.market,
        vault,
        deposit,
        user: nodeATA,
        payerJob: jobAccount.payer,
        payerRun: run.payer,
        authority: wallet,
        ipfsResult,
        ...staticAccounts,
      },
      {
        programAddress: jobsProgram,
      }
    );
    // Check if ATA accounts exist and create instructions if needed
    const preInstructions: CreateATAInstruction[] = [];

    // Check if node ATA exists, if not create it
    const createNodeATAInstruction = await deps.solana.getCreateATAInstructionIfNeeded(
      nodeATA,
      config.nosTokenAddress,
      run.node,
      wallet
    );
    if (createNodeATAInstruction) {
      preInstructions.push(createNodeATAInstruction);
    }

    // Check if deposit ATA exists (only if job.price > 0)
    if (jobAccount.price > 0) {
      const createDepositATAInstruction = await deps.solana.getCreateATAInstructionIfNeeded(
        deposit,
        config.nosTokenAddress,
        jobAccount.payer,
        wallet
      );
      if (createDepositATAInstruction) {
        preInstructions.push(createDepositATAInstruction);
      }
    }

    // Return tuple with pre-instructions (if any) followed by finish instruction
    return [...preInstructions, finishInstruction] as FinishInstructions;
  } catch (err) {
    const errorMessage = `Failed to create finish instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
