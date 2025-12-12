# Jobs Examples

## Create and Post a Job

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
import type { Instruction } from '@solana/kit';
import { generateKeyPairSigner } from '@solana/kit';

const client = createNosanaClient(NosanaNetwork.DEVNET);
client.wallet = await generateKeyPairSigner();

// First, pin job definition to IPFS
const ipfsHash: string = await client.ipfs.pin({
  version: '0.1',
  type: 'container',
  meta: {
    trigger: 'cli',
  },
  ops: [
    {
      type: 'container/run',
      id: 'run-1',
      args: {
        cmd: 'echo Hello from Nosana!',
        image: 'ubuntu:latest',
      },
    },
  ],
});

// Create job instruction
const instruction: Instruction = await client.jobs.post({
  market: 'market-address',
  timeout: 3600, // 1 hour
  ipfsHash: ipfsHash,
});

// Submit the job
const signature: string = await client.solana.buildSignAndSend(instruction);
console.log('Job posted:', signature);
```

## Monitor Job Updates

```ts twoslash
import { MonitorEventType, JobState } from '@nosana/kit';
import type { SimpleMonitorEvent } from '@nosana/kit';

// Start monitoring
const [eventStream, stop] = await client.jobs.monitor();

// Process events using async iteration
for await (const event: SimpleMonitorEvent of eventStream) {
  if (event.type === MonitorEventType.JOB) {
    console.log('Job update:', event.data.address, event.data.state);
    
    // Process updates - save to database, trigger workflows, etc.
    if (event.data.state === JobState.COMPLETED) {
      console.log('Job completed!');
      
      // Retrieve results from IPFS
      if (event.data.ipfsResult) {
        const results = await client.ipfs.retrieve(event.data.ipfsResult);
        console.log('Job results:', results);
      }
    }
  } else if (event.type === MonitorEventType.MARKET) {
    console.log('Market update:', event.data.address);
  }
}

// Stop monitoring when done
stop();
```

## Query Jobs by State

```ts twoslash
import { JobState } from '@nosana/kit';
import type { Job } from '@nosana/kit';

// Get all running jobs
const runningJobs: Job[] = await client.jobs.all({
  state: JobState.RUNNING,
});

// Get all jobs for a specific project
const projectJobs: Job[] = await client.jobs.all({
  project: 'project-address',
});

// Get all jobs in a market
const marketJobs: Job[] = await client.jobs.all({
  market: 'market-address',
});
```

## Get Job with Run Information

```ts twoslash
import type { Job } from '@nosana/kit';

// Get job and automatically check for associated run
const job: Job = await client.jobs.get('job-address', true);

if (job.state === JobState.RUNNING) {
  console.log('Job is running on node:', job.node);
  console.log('Started at:', new Date(job.timeStart * 1000));
}
```

