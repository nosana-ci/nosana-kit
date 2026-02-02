import fs from 'fs';
import path from 'path';
import {
  address,
  createKeyPairSignerFromBytes,
  createTransactionMessage,
  createTransactionPlanner,
  getAllSingleTransactionPlans,
  InstructionPlan,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  unwrapOption,
  type Address,
  type TransactionSigner,
} from '@solana/kit';
import {
  fetchMint,
  fetchMaybeMint,
  getCreateMintInstructionPlan,
  getMintToATAInstructionPlanAsync,
} from '@solana-program/token';
import type { NosanaClient } from '../../../src/index.js';

const NOS_MINT_DECIMALS = 6;
const DEFAULT_NOS_MINT_KEYPAIR_PATH =
  'tests/scenarios/keys/devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP.json';
const DEFAULT_NOS_MINT_AUTHORITY_KEYPAIR_PATH =
  'tests/scenarios/keys/dumQVNHZ1KNcLmzjMaDPEA5vFCzwHEEcQmZ8JHmmCNH.json';
let cachedMintAuthority: TransactionSigner | null = null;
let cachedMintAddress: Address | null = null;

export async function loadMintKeypairSigner() {
  const keypairPath = process.env.LOCALNET_NOS_MINT_KEYPAIR ?? DEFAULT_NOS_MINT_KEYPAIR_PATH;
  const resolvedPath = path.isAbsolute(keypairPath)
    ? keypairPath
    : path.join(process.cwd(), keypairPath);
  const keypair = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  return createKeyPairSignerFromBytes(new Uint8Array(keypair));
}

export async function loadMintAuthoritySigner() {
  if (cachedMintAuthority) {
    return cachedMintAuthority;
  }
  const keypairPath =
    process.env.LOCALNET_NOS_MINT_AUTHORITY_KEYPAIR ?? DEFAULT_NOS_MINT_AUTHORITY_KEYPAIR_PATH;
  const resolvedPath = path.isAbsolute(keypairPath)
    ? keypairPath
    : path.join(process.cwd(), keypairPath);
  const keypair = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  cachedMintAuthority = await createKeyPairSignerFromBytes(new Uint8Array(keypair));
  return cachedMintAuthority;
}

export async function ensureLocalnetMint(client: NosanaClient) {
  if (cachedMintAuthority && cachedMintAddress) {
    return { mintAuthority: cachedMintAuthority, mintAddress: cachedMintAddress };
  }

  const mintKeypair = await loadMintKeypairSigner();
  const mintAuthority = await loadMintAuthoritySigner();
  const envMint = process.env.LOCALNET_NOS_MINT;
  if (envMint && address(envMint) !== mintKeypair.address) {
    throw new Error(
      `LOCALNET_NOS_MINT (${envMint}) does not match mint keypair address (${mintKeypair.address}).`
    );
  }
  const mintAddress = envMint ? address(envMint) : mintKeypair.address;

  const existingMint = await fetchMaybeMint(client.solana.rpc, mintAddress);
  if (!existingMint.exists) {
    const createMintPlan = getCreateMintInstructionPlan({
      payer: client.wallet!,
      newMint: mintKeypair,
      decimals: NOS_MINT_DECIMALS,
      mintAuthority: mintAuthority.address,
      freezeAuthority: null,
    });
    try {
      await executeInstructionPlan(client, createMintPlan);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already in use') || message.includes('custom program error: #0')) {
        const existingAfter = await fetchMaybeMint(client.solana.rpc, mintAddress);
        if (!existingAfter.exists) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  } else {
    const mintAuthorityOnChain = unwrapOption(existingMint.data.mintAuthority);
    if (mintAuthorityOnChain && mintAuthorityOnChain !== mintAuthority.address) {
      throw new Error(
        `Localnet NOS mint already exists with a different mint authority (${mintAuthorityOnChain}). ` +
          'Reset the validator or provide the matching authority keypair.'
      );
    }
  }

  cachedMintAuthority = mintAuthority;
  cachedMintAddress = mintAddress;
  return { mintAuthority: cachedMintAuthority!, mintAddress };
}

export async function executeInstructionPlan(client: NosanaClient, plan: InstructionPlan) {
  const planner = createTransactionPlanner({
    createTransactionMessage: async () => {
      const { value: latestBlockhash } = await client.solana.rpc.getLatestBlockhash().send();
      return pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(client.wallet!, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx)
      );
    },
  });

  const transactionPlan = await planner(plan);
  const messages = getAllSingleTransactionPlans(transactionPlan).map((p) => p.message);

  for (const message of messages) {
    const signed = await client.solana.signTransaction(message as any);
    await client.solana.sendTransaction(signed, { commitment: 'confirmed' });
  }
}

export async function mintNosTo(
  client: NosanaClient,
  recipient: string | ReturnType<typeof address>,
  amount: bigint
) {
  const { mintAuthority, mintAddress } = await ensureLocalnetMint(client);
  const owner = typeof recipient === 'string' ? address(recipient) : recipient;
  const mintAccount = await fetchMint(client.solana.rpc, mintAddress);

  const mintToPlan = await getMintToATAInstructionPlanAsync({
    payer: client.wallet!,
    owner,
    mint: mintAddress,
    mintAuthority,
    decimals: mintAccount.data.decimals,
    amount,
  });
  await executeInstructionPlan(client, mintToPlan);
}
