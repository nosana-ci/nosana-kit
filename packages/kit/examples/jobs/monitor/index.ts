import fs from 'fs';
import os from 'os';
import { createKeyPairSignerFromPrivateKeyBytes, address } from '@solana/kit';
import { createNosanaClient, NosanaNetwork } from '../../../src/index.js';
import { MonitorEventType } from '../../../src/services/programs/jobs/index.js';
import { LIST_INSTRUCTION_ACCOUNTS } from '@nosana/jobs-program';

const keyData = JSON.parse(
  fs.readFileSync(os.homedir() + '/.nosana/nosana_key.json', 'utf8')
);

const client = createNosanaClient(NosanaNetwork.DEVNET);
client.wallet = await createKeyPairSignerFromPrivateKeyBytes(
  new Uint8Array(keyData).slice(0, 32)
);

const MARKET_ADDRESS = address('J4HMc9haEdWUcXEpRrR31w6nrqR8oApEVSD7SYcE8Yr9');
const DELIST_DELAY_SECONDS = 10; // Wait 30 seconds before delisting

// Helper function to sleep
const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

console.log('Starting to monitor jobs program updates...\n');

// Start monitoring first - this automatically merges run account data into job events
const [eventStream, stop] = await client.jobs.monitor();

// Function to handle posting and delisting jobs
async function postAndDelistJob() {
  try {
    // Wait a bit for monitoring to be ready
    await sleep(5);

    // Post a job
    console.log('Posting job to market...');
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
    console.log(`Job definition pinned to IPFS: ${ipfsHash}\n`);

    // Create post instruction
    const postInstruction = await client.jobs.post({
      market: MARKET_ADDRESS,
      timeout: 3600, // 1 hour timeout
      ipfsHash: ipfsHash,
    });

    // Get job address from instruction
    const jobAddress = postInstruction.accounts[LIST_INSTRUCTION_ACCOUNTS.job].address;
    console.log(`Job address: ${jobAddress.toString()}\n`);

    // Submit the job
    const signature = await client.solana.buildSignAndSend(postInstruction);
    console.log(`Job posted! Transaction signature: ${signature}\n`);

    // Wait before delisting
    console.log(`Waiting ${DELIST_DELAY_SECONDS} seconds before delisting...\n`);
    await sleep(DELIST_DELAY_SECONDS);

    // Delist the job
    console.log(`Delisting job...`);
    const delistInstruction = await client.jobs.delist({
      job: jobAddress,
    });
    const delistSignature = await client.solana.buildSignAndSend(delistInstruction);
    console.log(`Job delisted! Transaction signature: ${delistSignature}\n`);
  } catch (error) {
    console.error('Error in postAndDelistJob:', error);
  }
}

// Start posting/delisting in parallel with monitoring
const postAndDelistPromise = postAndDelistJob();

// Process events from the stream (runs concurrently with posting/delisting)
try {
  for await (const event of eventStream) {
    if (event.type === MonitorEventType.JOB) {
      const job = event.data;
      console.log(`[JOB UPDATE] Address: ${job.address.toString()}`);
      console.log(`  State: ${job.state}`);
      if (job.node) {
        console.log(`  Node: ${job.node.toString()}`);
      }
      if (job.timeStart) {
        console.log(`  Time Start: ${job.timeStart}`);
      }
      console.log('');
    } else if (event.type === MonitorEventType.MARKET) {
      const market = event.data;
      console.log(`[MARKET UPDATE] Address: ${market.address.toString()}`);
      console.log(`  Queue Type: ${market.queueType}`);
      console.log('');
    }
  }
} catch (error) {
  console.error('Error while monitoring:', error);
  stop();
  // Wait for postAndDelist to finish if it's still running
  await postAndDelistPromise.catch(() => { });
  process.exit(1);
}

