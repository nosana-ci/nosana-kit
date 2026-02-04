import { ipfsHashToSolBytesArray } from '@nosana/ipfs';
import { type Address, type TransactionSigner, generateKeyPairSigner } from '@solana/kit';
import type { getAssignInstruction } from '@nosana/jobs-program';
import type { InstructionsHelperParams } from './types.js';

export type AssignParams = {
  market: Address;
  timeout: number | bigint;
  ipfsHash: string;
  node: Address;
  payer?: TransactionSigner;
};

export type AssignInstruction = ReturnType<typeof getAssignInstruction>;

export type Assign = (params: AssignParams) => Promise<AssignInstruction>;

export async function assign(
  { market, timeout, ipfsHash, node, payer }: AssignParams,
  {
    config,
    deps,
    client,
    getRequiredWallet,
    getStaticAccounts,
    getNosATA,
  }: InstructionsHelperParams
): Promise<AssignInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Use provided payer or fall back to wallet
    const nosPayer = payer ?? wallet;

    // Generate new keypairs for job and run
    const [jobKey, runKey, associatedTokenAddress, { jobsProgram, ...staticAccounts }] =
      await Promise.all([
        generateKeyPairSigner(),
        generateKeyPairSigner(),
        getNosATA(nosPayer.address),
        getStaticAccounts(),
      ]);
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    // Convert IPFS hash to Solana bytes array
    const ipfsJobBytes = ipfsHashToSolBytesArray(ipfsHash);

    return client.getAssignInstruction(
      {
        job: jobKey,
        run: runKey,
        node,
        market,
        ipfsJob: new Uint8Array(ipfsJobBytes),
        timeout,
        user: associatedTokenAddress,
        vault: vault,
        payer: nosPayer,
        authority: wallet,
        ...staticAccounts,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create assign instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
