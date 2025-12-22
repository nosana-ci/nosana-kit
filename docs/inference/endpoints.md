---
title: Endpoints
---

# Endpoints

Setting Up and Communicating with Endpoints on the Nosana Network

When posting a job to the Nosana network, it is possible to specify the duration for which you want your compute job to be available. This means an instance will be accessible via an endpoint with which you can communicate.

This guide will walk you through setting up an Nginx server and interacting with its endpoint. Afterwards, we will set up a Llama instance and start communicating with it.

## Proof of concept: Nginx

Nginx is a high-performance web server and reverse proxy server that is widely used for serving static content, load balancing, and handling HTTP and HTTPS traffic.
It'll be a good proof of concept to showcase how to use a Nosana endpoint.

### Setting Up an Nginx Server

#### Step 1: Define the Job Definition

Create a file called `nginx.json` and copy the following [job definition](/jobs/job-definition/intro) into it:

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "cli"
  },
  "ops": [
    {
      "type": "container/run",
      "id": "nginx",
      "args": {
        "cmd": [],
        "image": "nginx",
        "expose": 80
      }
    }
  ]
}
```

This job definition specifies the use of the Nginx image and exposes port 80.

#### Step 2: Post the Job

::: code-group

```bash [CLI]
nosana job post --file nginx.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
```

```ts [TypeScript SDK]
import { createNosanaClient } from '@nosana/kit';
import { address } from '@nosana/kit';

const client = createNosanaClient();

// Pin job definition to IPFS
const ipfsHash = await client.ipfs.pin({
  version: '0.1',
  type: 'container',
  meta: {
    trigger: 'cli',
  },
  ops: [
    {
      type: 'container/run',
      id: 'nginx',
      args: {
        cmd: [],
        image: 'nginx',
        expose: 80,
      },
    },
  ],
});

// Post the job
const instruction = await client.jobs.post({
  market: address('97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf'),
  timeout: 7200, // 2 hours
  ipfsHash: ipfsHash,
});

const signature = await client.solana.buildSignAndSend(instruction);
console.log('Job posted:', signature);
```

:::

Once the job is running, you will see output similar to this:

```sh:no-line-numbers
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Reading keypair from /home/user/.nosana/nosana_key.json

Network: mainnet
Wallet:  4WtG17Vn3SSoTAVvXxpopQTG3Qo9NUK28Zotv4rL1ccv
SOL balance: 0.05066028 SOL
NOS balance: 66.781499 NOS
ipfs uploaded: https://nosana.mypinata.cloud/ipfs/QmTcNQ4dGq8veeg8v5cQyGoaJEPSYQnVTd1TvfckVFVzRu
posting job to market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf for price 0.000115 NOS/s (total: 0.8280 NOS)
job posted with tx 4UJ7Ad84PkaxDvx7VQWwNfNia7M7E4WJQeAomjEuA8xn5V4T9QWbQtusJgsQUV9Dj9o8bs1FL6hJhhAPUrYeLVpF!
Service will be exposed at https://FhkRunC6dAtPaEWGJwRK16Vctzv1KmHBhpSyUmMsYyMS.node.k8s.prd.nos.ci
Job:  https://dashboard.nosana.com/jobs/B3MmwHz7sovudYwMxZFwjS2E6eMRaEEqNgWao5RYUkLi
JSON flow: https://nosana.mypinata.cloud/ipfs/QmTcNQ4dGq8veeg8v5cQyGoaJEPSYQnVTd1TvfckVFVzRu
Market:  https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:  0.000115 NOS/s
Status:  RUNNING
run nosana job get B3MmwHz7sovudYwMxZFwjS2E6eMRaEEqNgWao5RYUkLi --network mainnet to retrieve job and result
```

::: info
Take note of the following line in the output:

**Service will be exposed at**
`https://FhkRunC6dAtPaEWGJwRK16Vctzv1KmHBhpSyUmMsYyMS.node.k8s.prd.nos.ci`
:::

#### Step 3: Access the Endpoint

Navigate to the service URL to find your Nginx service. You can also retrieve the job to get the endpoint URL:

::: code-group

```bash [CLI]
nosana job get B3MmwHz7sovudYwMxZFwjS2E6eMRaEEqNgWao5RYUkLi
```

```ts [TypeScript SDK]
import { createNosanaClient } from '@nosana/kit';
import { address } from '@nosana/kit';

const client = createNosanaClient();

// Get the job to retrieve endpoint information
const job = await client.jobs.get(address('B3MmwHz7sovudYwMxZFwjS2E6eMRaEEqNgWao5RYUkLi'));

// The endpoint URL is available in the job's run information
// For endpoints, you'll need to check the job status and node information
console.log('Job status:', job.state);
console.log('Job node:', job.node);
```

:::

Success! Your Nginx instance is running on the Nosana Network.

## Ollama Inference Endpoint

Now we will delve into how to setup an inference endpoint, where we will run an Ollama service and communicate with it.

### Step 1: Define the Job Definition

Create a file named `ollama.json` and paste the following [job definition](/jobs/job-definition/intro) into it:

Below we can see an example Nosana Job Definition that is used to post jobs to Nosana.

Note there is one `ops` (short for operations) happening in this job. For this `ops` we use the [Ollama Docker Image](https://hub.docker.com/r/ollama/ollama).

Here we use [Ollama](https://github.com/ollama/ollama) to run [Gemma3](https://ollama.com/library/gemma3:4b).

```json
{
  "version": "0.1",
  "type": "container",
  "ops": [
    {
      "type": "container/run",
      "id": "ollama-service",
      "args": {
        "image": "docker.io/ollama/ollama:0.6.6",
        "entrypoint": ["/bin/sh"],
        "cmd": ["-c", "ollama serve & sleep 5 && ollama pull $MODEL && tail -f /dev/null"],
        "env": {
          "MODEL": "gemma3:4b-it-qat"
        },
        "gpu": true,
        "expose": 11434
      }
    }
  ]
}
```

### Step 2: Post the Job

::: code-group

```bash [CLI]
nosana job post --file ollama.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
```

```ts [TypeScript SDK]
import { createNosanaClient } from '@nosana/kit';
import { address } from '@nosana/kit';

const client = createNosanaClient();

// Pin job definition to IPFS
const ipfsHash = await client.ipfs.pin({
  version: '0.1',
  type: 'container',
  ops: [
    {
      type: 'container/run',
      id: 'ollama-service',
      args: {
        image: 'docker.io/ollama/ollama:0.6.6',
        entrypoint: ['/bin/sh'],
        cmd: ['-c', 'ollama serve & sleep 5 && ollama pull $MODEL && tail -f /dev/null'],
        env: {
          MODEL: 'gemma3:4b-it-qat',
        },
        gpu: true,
        expose: 11434,
      },
    },
  ],
});

// Post the job
const instruction = await client.jobs.post({
  market: address('97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf'),
  timeout: 7200, // 2 hours
  ipfsHash: ipfsHash,
});

const signature = await client.solana.buildSignAndSend(instruction);
console.log('Job posted:', signature);
```

:::

Please note that it can take up to 5 minutes for your endpoint to be available. The Nosana team is working on reducing startup time to a few seconds.

Once the job is running, you will see output similar to this:

```sh:no-line-numbers
$ nosana job post --file ollama.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf

  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Reading keypair from /home/user/.nosana/nosana_key.json

Network:        mainnet
Wallet:         CTYw7JqNeh92BLFCJ5pR9HbpZHCsQPxtV2mZdD7WY2bD
SOL balance:    0.115372223 SOL
NOS balance:    49.046325 NOS
Service URL:    https://tzrYei3AxEa13vc1qY1VLoNniRKX7jF5dNJVq93HPPb5.node.k8s.prd.nos.ci
Job:            https://dashboard.nosana.com/jobs/H3fhW6p9qQ2anKERK85LCVd3TJu2DVPdX2FhzWLMUyqg
Market:         https://dashboard.nosana.com/markets/7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq
Status:         RUNNING
run nosana job get H3fhW6p9qQ2anKERK85LCVd3TJu2DVPdX2FhzWLMUyqg --network mainnet to retrieve job and result
```

You can visit the service URL to check the status.

Initially, you might see a "Page not found" message. After 10 minutes, the Ollama service should be up and running, and you can start making requests to the endpoint.

::: info
Note the endpoint service URL:

`https://tzrYei3AxEa13vc1qY1VLoNniRKX7jF5dNJVq93HPPb5.node.k8s.prd.nos.ci`
:::

The Ollama service will run a server that is available at `/api/generate`.

Append `/api/generate` to the URL to communicate with the Ollama service.

## Client Example

Try these client examples to talk to your endpoint, remember to fill in the endpoint with your own endpoint.

::: code-group

```bash [cURL]
curl -X POST https://tzrYei3AxEa13vc1qY1VLoNniRKX7jF5dNJVq93HPPb5.node.k8s.prd.nos.ci/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"model\": \"gemma3:4b-it-qat\", \"stream\": false, \"prompt\": \"What is water made of?\"}"
```

```js [JavaScript]
import https from 'https';

const data = JSON.stringify({
  model: 'gemma3:4b-it-qat',
  stream: false,
  prompt: 'What is water made of?',
});

const options = {
  hostname: 'tzrYei3AxEa13vc1qY1VLoNniRKX7jF5dNJVq93HPPb5.node.k8s.prd.nos.ci',
  port: 443,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.write(data);
req.end();
```

:::

## Response

The endpoint should return a response like this:

```json
{
  "model": "gemma3:4b-it-qat",
  "created_at": "2025-05-20T18:59:55.853156018Z",
  "response": "Water, chemically speaking, is incredibly simple! It's made up of just **two elements**:\n\n* **Hydrogen (H)** - There are always **two** atoms of hydrogen per water molecule.\n* **Oxygen (O)** - There is always **one** atom of oxygen per water molecule.\n\nSo, the chemical formula for water is **H₂O**.",
  "done": true,
  "done_reason": "stop"
}
```

The service will be available for the duration specified in your job timeout. Ensure you have enough NOS balance to cover this period; otherwise, you will be notified immediately.

Next up, we will go through the ins and outs of how to write a job, and the specifications you can customize for each job.
