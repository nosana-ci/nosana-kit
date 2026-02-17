import fs from 'fs';
import os from 'os';
import { createKeyPairSignerFromPrivateKeyBytes, address } from '@solana/kit';
import { createNosanaClient, NosanaNetwork } from '../../../src/index.js';

// Load wallet from key file
const keyData = JSON.parse(
  fs.readFileSync(os.homedir() + '/.nosana/nosana_key.json', 'utf8')
);

// Create client and set wallet
const client = createNosanaClient(NosanaNetwork.DEVNET);
client.wallet = await createKeyPairSignerFromPrivateKeyBytes(
  new Uint8Array(keyData).slice(0, 32)
);

// Market address to work on
const MARKET_ADDRESS = address('J4HMc9haEdWUcXEpRrR31w6nrqR8oApEVSD7SYcE8Yr9');

async function workExample() {
  try {
    console.log('Creating work instruction...\n');

    // Example 1: Work instruction without NFT (uses NOS token)
    const workInstruction = await client.jobs.work({
      market: MARKET_ADDRESS,
    });

    console.log('Work instruction created successfully!');
    console.log(`Program address: ${workInstruction.programAddress.toString()}\n`);

    // Send the transaction
    console.log('Sending transaction...');
    const signature = await client.solana.buildSignAndSend(workInstruction);
    console.log(`Transaction sent! Signature: ${signature}\n`);

    // Example 2: Work instruction with NFT (optional)
    // Uncomment to use NFT instead of NOS token:
    /*
    const NFT_MINT = address('YourNFTMintAddressHere');
    const workInstructionWithNFT = await client.jobs.work({
      market: MARKET_ADDRESS,
      nft: NFT_MINT,
    });
    
    const signatureWithNFT = await client.solana.buildSignAndSend(workInstructionWithNFT);
    console.log(`Transaction with NFT sent! Signature: ${signatureWithNFT}\n`);
    */
  } catch (error) {
    console.error('Error calling work instruction:', error);
    throw error;
  }
}

// Run the example
workExample();


