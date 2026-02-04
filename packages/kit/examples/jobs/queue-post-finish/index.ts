import fs from 'fs';
import os from 'os';
import { createKeyPairSignerFromPrivateKeyBytes, address } from '@solana/kit';
import { createNosanaClient, NosanaNetwork } from '../../../src/index.js';
import { LIST_INSTRUCTION_ACCOUNTS } from '@nosana/jobs-program';

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

// Helper function to sleep
const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

async function queuePostFinishExample() {
  try {
    if (!client.wallet) {
      throw new Error('Wallet is not set');
    }
    const nodeAddress = client.wallet.address;
    console.log(`Node address: ${nodeAddress.toString()}\n`);

    // Step 1: Queue the node into the market
    console.log('Step 1: Queuing node into market...');
    const workInstruction = await client.jobs.work({
      market: MARKET_ADDRESS,
    });
    const workSignature = await client.solana.buildSignAndSend(workInstruction);
    console.log(`Node queued! Transaction signature: ${workSignature}\n`);

    // Wait a bit for the node to be queued
    await sleep(3);

    // Step 2: Post a job to the market
    console.log('Step 2: Posting job to market...');
    const jobDefinition = {
      version: '0.1',
      type: 'container',
      ops: [
        {
          type: 'container/run',
          id: 'hello-world',
          args: {
            cmd: 'echo Hello from Nosana!',
            image: 'ubuntu:latest',
          },
        },
      ],
    };

    // Pin job definition to IPFS
    const ipfsHash = await client.ipfs.pin(jobDefinition);
    console.log(`Job definition pinned to IPFS: ${ipfsHash}`);

    // Create post instruction
    const postInstruction = await client.jobs.post({
      market: MARKET_ADDRESS,
      timeout: 3600, // 1 hour timeout
      ipfsHash: ipfsHash,
    });

    // Get job address from instruction
    const jobAddress = postInstruction.accounts[LIST_INSTRUCTION_ACCOUNTS.job].address;
    console.log(`Job address: ${jobAddress.toString()}`);

    // Submit the job
    const postSignature = await client.solana.buildSignAndSend(postInstruction);
    console.log(`Job posted! Transaction signature: ${postSignature}\n`);

    // Step 3: Wait and check if the job is assigned to our node
    console.log('Step 3: Waiting for job to be assigned to node...');
    let job = await client.jobs.get(jobAddress);
    let attempts = 0;
    const maxAttempts = 6; // Wait up to 6 attempts (1 minutes if 10s intervals)

    while (job.node?.toString() !== nodeAddress.toString() && attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts}: Job state: ${job.state}, Node: ${job.node?.toString() || 'not assigned'}`);
      await sleep(10); // Wait 10 seconds between checks
      job = await client.jobs.get(jobAddress);
    }

    if (job.node?.toString() !== nodeAddress.toString()) {
      throw new Error(`Job was not assigned to our node after ${maxAttempts} attempts. Current node: ${job.node?.toString() || 'not assigned'}`);
    }

    console.log(`Job assigned to our node! Node: ${job.node.toString()}\n`);

    // Step 4: Finish the job
    console.log('Step 4: Finishing the job...');

    // Create a simple result (in a real scenario, this would be the actual job results)
    const jobResult = {
      success: true,
      output: 'Hello from Nosana!',
      timestamp: new Date().toISOString(),
    };

    // Pin job result to IPFS
    const ipfsResultsHash = await client.ipfs.pin(jobResult);
    console.log(`Job result pinned to IPFS: ${ipfsResultsHash}`);

    // Create finish instruction
    const finishInstruction = await client.jobs.finish({
      job: jobAddress,
      ipfsResultsHash: ipfsResultsHash,
    });

    // Submit the finish transaction
    const finishSignature = await client.solana.buildSignAndSend(finishInstruction);
    console.log(`Job finished! Transaction signature: ${finishSignature}\n`);

    // Verify the job is completed
    const finalJob = await client.jobs.get(jobAddress);
    console.log(`Final job state: ${finalJob.state}`);
    if (finalJob.ipfsResult) {
      console.log(`Job result IPFS hash: ${finalJob.ipfsResult}`);
    }

    console.log('\nExample completed successfully!');
  } catch (error) {
    console.error('Error in queue-post-finish example:', error);
    throw error;
  }
}

// Run the example
queuePostFinishExample();

