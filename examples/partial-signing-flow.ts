/**
 * Example: Partial Transaction Signing Flow
 *
 * This example demonstrates how to build transactions where:
 * - The backend partially signs a transaction
 * - The user (fee payer) signs later after receiving the serialized transaction
 *
 * Backend flow:
 * 1. Build a transaction with the user's address as fee payer (not their signer)
 * 2. Partially sign with backend's signer (embedded in instructions)
 * 3. Serialize and send to user
 *
 * User flow:
 * 4. Deserialize the transaction
 * 5. (Optional) Decompile to inspect/verify the transaction
 * 6. Sign with their signer using signTransactionWithSigners
 * 7. Send to RPC
 *
 * Run with: npx tsx examples/partial-signing-flow.ts
 */

import { generateKeyPairSigner, lamports, KeyPairSigner } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { createSolanaService, SolanaService } from '../src/services/solana/SolanaService.js';
import { Logger } from '../src/logger/Logger.js';

async function main() {
  // Create test signers
  const backendSigner: KeyPairSigner = await generateKeyPairSigner();
  const userSigner: KeyPairSigner = await generateKeyPairSigner();

  // Create SolanaService instance
  const logger = Logger.getInstance({ level: 'debug' });
  const solana: SolanaService = createSolanaService(
    {
      logger,
      getWallet: () => undefined,
    },
    {
      cluster: 'devnet',
      rpcEndpoint: 'https://api.devnet.solana.com',
    }
  );

  console.log('='.repeat(60));
  console.log('Example 1: Single Backend Signer');
  console.log('='.repeat(60));

  await singleSignerExample(solana, backendSigner, userSigner);

  console.log('\n' + '='.repeat(60));
  console.log('Example 2: Multiple Backend Signers');
  console.log('='.repeat(60));

  await multipleSignersExample(solana, backendSigner, userSigner);
}

async function singleSignerExample(
  solana: SolanaService,
  backendSigner: KeyPairSigner,
  userSigner: KeyPairSigner
) {
  // ============================================================
  // BACKEND SIDE: Create and partially sign a transaction
  // ============================================================

  console.log('\n--- Backend Side ---\n');

  // Create a simple transfer instruction with the backend as the source
  // The backend's signer is embedded in this instruction
  const transferInstruction = getTransferSolInstruction({
    source: backendSigner,
    destination: userSigner.address,
    amount: lamports(1000n),
  });

  // Build the transaction with the USER's address as fee payer (not their signer!)
  // This sets up the transaction so the user will pay fees but sign later
  const transactionMessage = await solana.buildTransaction([transferInstruction], {
    feePayer: userSigner.address, // Just the address, not the signer
  });

  console.log('Transaction built with:');
  console.log('  - Fee payer address:', userSigner.address);
  console.log('  - Backend signer:', backendSigner.address);

  // Partially sign the transaction with embedded signers (backend's signer)
  // The fee payer (user) has NOT signed yet
  const partiallySignedTx = await solana.partiallySignTransaction(transactionMessage);

  console.log('Transaction partially signed by backend');

  // Serialize for transmission to the user
  const serializedTx = solana.serializeTransaction(partiallySignedTx);

  console.log('Serialized transaction (base64):', serializedTx.slice(0, 50) + '...');

  // ============================================================
  // USER SIDE: Receive, verify, sign, and send
  // ============================================================

  console.log('\n--- User Side ---\n');

  // Deserialize the received transaction
  const receivedTx = solana.deserializeTransaction(serializedTx);

  console.log('User received and deserialized transaction');

  // (Optional) Decompile to inspect the transaction before signing
  const decompiled = solana.decompileTransaction(receivedTx);

  console.log('Decompiled transaction for inspection:');
  console.log('  - Fee payer:', decompiled.feePayer);
  console.log('  - Number of instructions:', decompiled.instructions.length);
  console.log('  - Lifetime constraint:', 'lifetimeConstraint' in decompiled ? 'present' : 'none');

  // Verify the fee payer is the user's address
  if (decompiled.feePayer.address !== userSigner.address) {
    throw new Error('Fee payer mismatch!');
  }

  // Sign with the user's signer (the fee payer)
  const fullySignedTx = await solana.signTransactionWithSigners(receivedTx, [userSigner]);

  console.log('Transaction fully signed by user (fee payer)');

  // At this point, the transaction is ready to be sent to the network
  // In a real scenario, you would call:
  // const signature = await solana.sendTransaction(fullySignedTx);

  console.log('Signatures present for addresses:', Object.keys(fullySignedTx.signatures));
}

async function multipleSignersExample(
  solana: SolanaService,
  backendSigner: KeyPairSigner,
  userSigner: KeyPairSigner
) {
  console.log('\n--- Backend Side ---\n');

  // Create additional backend signer
  const backendSigner2 = await generateKeyPairSigner();

  // Create instructions that require multiple backend signers
  const instruction1 = getTransferSolInstruction({
    source: backendSigner,
    destination: userSigner.address,
    amount: lamports(500n),
  });

  const instruction2 = getTransferSolInstruction({
    source: backendSigner2,
    destination: userSigner.address,
    amount: lamports(500n),
  });

  // Build with user as fee payer
  const transactionMessage = await solana.buildTransaction([instruction1, instruction2], {
    feePayer: userSigner.address,
  });

  console.log('Transaction built with multiple backend signers');
  console.log('  - Backend signer 1:', backendSigner.address);
  console.log('  - Backend signer 2:', backendSigner2.address);
  console.log('  - Fee payer (user):', userSigner.address);

  // Partially sign - both backend signers will sign
  const partiallySignedTx = await solana.partiallySignTransaction(transactionMessage);

  console.log('Transaction partially signed by both backend signers');

  // Serialize
  const serializedTx = solana.serializeTransaction(partiallySignedTx);

  console.log('\n--- User Side ---\n');

  // User deserializes and signs
  const receivedTx = solana.deserializeTransaction(serializedTx);
  const fullySignedTx = await solana.signTransactionWithSigners(receivedTx, [userSigner]);

  console.log('Transaction fully signed');
  console.log('Signatures from:', Object.keys(fullySignedTx.signatures));
}

main().catch(console.error);
