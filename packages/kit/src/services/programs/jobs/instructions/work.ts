import { type Address, generateKeyPairSigner } from '@solana/kit';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';

import { getWorkInstruction } from '@nosana/jobs-program';
import { InstructionsHelperParams } from './types.js';

// Metaplex Token Metadata Program ID
const METADATA_PROGRAM_ID =
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as Address<'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'>;

export type WorkParams = {
  market: Address;
  nft?: Address;
};

export type WorkInstruction = ReturnType<typeof getWorkInstruction>;

export type Work = (params: WorkParams) => Promise<WorkInstruction>;

export async function work(
  { market, nft }: WorkParams,
  {
    config,
    deps,
    client,
    getRequiredWallet,
    getStaticAccounts,
    getNosATA,
  }: InstructionsHelperParams
): Promise<WorkInstruction> {
  try {
    const wallet = getRequiredWallet();

    // Parallelize independent async operations
    const [runKey, { jobsProgram, ...staticAccounts }, stake, nosAta] = await Promise.all([
      generateKeyPairSigner(),
      getStaticAccounts(),
      // Derive stake PDA: ["stake", nosTokenAddress, wallet.address]
      deps.solana.pda(['stake', config.nosTokenAddress, wallet.address], config.stakeAddress),
      // Get NOS ATA (needed if no NFT provided)
      getNosATA(wallet.address),
    ]);

    // Handle NFT: if no NFT provided, use NOS token ATA; otherwise use NFT ATA
    let nftAta: Address;
    let metadata: Address;

    if (!nft) {
      // No NFT: use NOS token ATA for wallet
      nftAta = nosAta;
      // Use system program as placeholder for metadata
      metadata = SYSTEM_PROGRAM_ADDRESS;
    } else {
      // NFT provided: parallelize NFT ATA and metadata PDA derivation
      const [nftAtaPda, metadataPda] = await Promise.all([
        findAssociatedTokenPda({
          mint: nft,
          owner: wallet.address,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        }).then(([pda]) => pda),
        // Derive Metaplex metadata PDA: ["metadata", METADATA_PROGRAM_ID, MINT_ADDRESS]
        deps.solana.pda(['metadata', METADATA_PROGRAM_ID, nft], METADATA_PROGRAM_ID),
      ]);
      nftAta = nftAtaPda;
      metadata = metadataPda;
    }

    // Create the work instruction
    return client.getWorkInstruction(
      {
        run: runKey,
        market,
        payer: wallet,
        stake,
        nft: nftAta,
        metadata,
        authority: wallet,
        ...staticAccounts,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create work instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
