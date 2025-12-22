# Ollama

Get up and running with Llama 3.1, Mistral, Gemma 2, and other large language models.
This example will help you get setup with an Ollama instance running an inference model of your choice.
With which you can communicate via an API endpoint, learn more on how to use the API endpoint here: <https://github.com/ollama/ollama/blob/main/docs/api.md>

## JSON Job Schema

::: info
Create a file named `ollama.json`, copy and paste the following into it:

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
      "id": "ollama",
      "args": {
        "cmd": [
            "-c 'curl -s https://raw.githubusercontent.com/KeesGeerligs/nosana/main/benchmarking/images/command.sh -o /tmp/command.sh && chmod +x /tmp/command.sh && /tmp/command.sh'"
          ],
        "image": "docker.io/nosana/ollama-7b:0.0.1",
        "gpu": true,
        "expose": 11434
      }
    }
  ]
}
```

## Command

Run the following command to post the job to the Nosana network.

```sh:no-line-numbers
nosana job post --file ollama.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
```

## Output

You should be able to see something similar, here we need to take not of the *Service URL*.

```sh:no-line-numbers{16}
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Reading keypair from /home/user/.nosana/nosana_key.json

Network:	mainnet
Wallet:		4WtG17Vn3SSoTAVvXxpopQTG3Qo9NUK28Zotv4rL1ccv
SOL balance:	0.05492696 SOL
NOS balance:	67.60951 NOS
ipfs uploaded:	https://nosana.mypinata.cloud/ipfs/QmcbDBHGVhdyYbUQs9sLwNzPUx1NcCoCXRWS7dA5VqJteZ
posting job to market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf for price 0.000115 NOS/s (total: 0.8280 NOS)
job posted with tx 5q6FcG1pNP9JWpcXYud2zK6pvWcCSGNVoayPxTRHQkxQytpmJdVAqXa6E3xxunFS8iLXs6vBERhvfxFZQJcmDFyd!
Service will be exposed at https://B7hWYTyWHMLmYUH9sZFJL3TjgrHUAdDBi76xuEg9m9hX.node.k8s.prd.nos.ci
Job:		https://dashboard.nosana.com/jobs/3Rraj6gcv9YRcm1Euk6vnkNrh385woLLXQzetCnsFkTz
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmcbDBHGVhdyYbUQs9sLwNzPUx1NcCoCXRWS7dA5VqJteZ
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		RUNNING

run nosana job get 3Rraj6gcv9YRcm1Euk6vnkNrh385woLLXQzetCnsFkTz --network mainnet to retrieve job and result
```
## Example

It will take a while for this image to load up and be used, you might need to wait 15 minutes before the endpoint is up and running.
The end

::: info
Note the endpoint service url:
`https://B7hWYTyWHMLmYUH9sZFJL3TjgrHUAdDBi76xuEg9m9hX.node.k8s.prd.nos.ci`

### Client Example

To communicate with the endpoint you will need to make HTTP requests to it.
Here are a few examples to help you get started:

:::tabs

== cURL

Use the following curl command to post a JSON body to the endpoint:

```sh:no-line-numbers
curl -X POST https://B7hWYTyWHMLmYUH9sZFJL3TjgrHUAdDBi76xuEg9m9hX.node.k8s.prd.nos.ci/api/generate \
-H "Content-Type: application/json" \
-d "{\"model\": \"gemma:7b\", \"stream\": false, \"prompt\": \"What is water made of?\"}"
```

== JavaScript

Alternatively, you can use JavaScript:

```js
import https from "https";

const data = JSON.stringify({
  model: "gemma:7b",
  stream: false,
  prompt: "What is water made of?",
});

const options = {
  hostname: "https://B7hWYTyWHMLmYUH9sZFJL3TjgrHUAdDBi76xuEg9m9hX.node.k8s.prd.nos.ci",
  port: 443,
  path: "/api/generate",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = https.request(options, (res) => {
  let responseData = "";
  res.on("data", (chunk) => {
    responseData += chunk;
  });
  res.on("end", () => {
    console.log("Response:", responseData);
  });
});

req.on("error", (e) => {
  console.error("Error:", e);
});

req.write(data);
req.end();
```
:::

### Response

You should see the following response:

```json
{
  "model": "gemma:7b",
  "created_at": "2024-07-29T14:04:54.272390422Z",
  "response": "Water is composed of two hydrogen atoms and one oxygen atom together. Its chemical formula is H2O.",
  "done": true,
  "done_reason": "stop",
  "context": [
    968, 2997, 235298, 559, 235298, 15508, 235313, 1645, 108, 1841, 603, 2003, 1644, 576, 181537, 615, 235298, 559, 235298, 15508, 235313, 108, 235322, 2997, 235298, 559, 235298, 15508, 235313, 2516, 108, 11586, 603, 18588, 576, 1378, 20303, 25204, 578, 974, 16175, 24235, 74346, 3584, 235265, 9707, 9408, 10513, 603, 640, 235284, 235302, 35606, 615, 235298, 559, 235298, 15508, 235313, 108
  ],
  "total_duration": 11622510413,
  "load_duration": 11219650532,
  "prompt_eval_count": 32,
  "prompt_eval_duration": 74712000,
  "eval_count": 23,
  "eval_duration": 279790000
}
```
