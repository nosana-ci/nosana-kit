import * as fs from 'fs';
import * as os from 'os';
import { createKeyPairSignerFromPrivateKeyBytes } from '@solana/kit';
import { createNosanaClient, NosanaNetwork } from '../../../src/index.js';
import { OPEN_INSTRUCTION_ACCOUNTS } from '../../../src/generated_clients/jobs/index.js';

// Load wallet from key file
const keyData = JSON.parse(
  fs.readFileSync(os.homedir() + '/.nosana/nosana_key.json', 'utf8')
);

// Create client and set wallet
const client = createNosanaClient(NosanaNetwork.DEVNET);
client.wallet = await createKeyPairSignerFromPrivateKeyBytes(
  new Uint8Array(keyData).slice(0, 32)
);

// Helper function to sleep
const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

async function marketExample() {
  try {
    if (!client.wallet) {
      throw new Error('Wallet is not set');
    }

    console.log(`Wallet address: ${client.wallet.address.toString()}\n`);

    // Step 1: Open a market with default values
    console.log('Step 1: Opening a new market with default values...');
    console.log('  Default values:');
    console.log('    - jobExpiration: 86400 seconds (24 hours)');
    console.log('    - jobTimeout: 7200 seconds (120 minutes)');
    console.log('    - nodeStakeMinimum: 0');
    console.log('    - nodeAccessKey: system program\n');

    const openInstruction = await client.jobs.open({});

    // Get market address from instruction
    const marketAddress = openInstruction.accounts[OPEN_INSTRUCTION_ACCOUNTS.market].address;
    console.log(`Market address: ${marketAddress.toString()}`);

    // Submit the open instruction
    const openSignature = await client.solana.buildSignAndSend(openInstruction);
    console.log(`Market opened! Transaction signature: ${openSignature}\n`);

    // Wait a bit for the market to be created
    await sleep(3);

    // Step 2: Verify the market was created
    console.log('Step 2: Verifying market was created...');
    const market = await client.jobs.market(marketAddress);
    console.log(`Market verified!`);
    console.log(`  Address: ${market.address.toString()}`);
    console.log(`  Queue Type: ${market.queueType}`);
    console.log(`  Job Price: ${market.jobPrice}`);
    console.log(`  Job Timeout: ${market.jobTimeout} seconds`);
    console.log(`  Node Stake Minimum: ${market.nodeXnosMinimum}\n`);

    // Step 3: Close the market
    console.log('Step 3: Closing the market...');
    const closeInstruction = await client.jobs.close({
      market: marketAddress,
    });

    // Submit the close instruction
    const closeSignature = await client.solana.buildSignAndSend(closeInstruction);
    console.log(`Market closed! Transaction signature: ${closeSignature}\n`);

    console.log('Example completed successfully!');
  } catch (error) {
    console.error('Error in market example:', error);
    throw error;
  }
}

// Run the example
marketExample();

