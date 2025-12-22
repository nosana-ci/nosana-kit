# Tiny Llama

[TinyLlama](https://github.com/jzhang38/TinyLlama) is a compact model with only 1.1B parameters. This compactness allows it to cater to a multitude of applications demanding a restricted computation and memory footprint.

## JSON Job Schema

::: info
Create a file named `tiny_llama.json`, copy and paste the following into it:

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
      "id": "tinyllama",
      "args": {
        "cmd": ["'Write me a story about Tony the tiny hawk'"],
        "image": "docker.io/jeisses/tinyllama:v4",
        "gpu": true
      }
    }
  ]
}
```

## Command

Run the following command to post the job to the Nosana network.
```sh:no-line-numbers
nosana job post --file tiny_llama.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
```

## Output

```sh:no-line-numbers
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Reading keypair from /home/user/.nosana/nosana_key.json

Network:	mainnet
Wallet:		4WtG17Vn3SSoTAVvXxpopQTG3Qo9NUK28Zotv4rL1ccv
SOL balance:	0.06854152 SOL
NOS balance:	70.045108 NOS
ipfs uploaded:	https://nosana.mypinata.cloud/ipfs/QmZ9Zyt91LcDbbzHLSntAacr4UckYHy64UAxMtfpN3UWte
posting job to market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf for price 0.000115 NOS/s (total: 0.8280 NOS)
job posted with tx 66tKJ5HcRxFqKf98Z4t41qmHs3gyKCJGFwf1UkogiLT2TGgyudA9aFXhVNY2aVS71o4Safgt7UeocT4jRfMxRsDW!
Service will be exposed at https://BVDim8herHjb4yMPXRN2DdpxxbVw1nb9bu1oPhLFZgJc.node.k8s.prd.nos.ci
Job:		https://dashboard.nosana.com/jobs/8qQeqpQBhZ1WitsKxQwSRyTNH1PF7cNAsFAmr66Nkrx1
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmZ9Zyt91LcDbbzHLSntAacr4UckYHy64UAxMtfpN3UWte
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		RUNNING

run nosana job get 8qQeqpQBhZ1WitsKxQwSRyTNH1PF7cNAsFAmr66Nkrx1 --network mainnet to retrieve job and result
```

## Example

You should get something similar to the following output, the output of the job will be printed after the job information logs:

```sh:no-line-numbers
nosana job get 8qQeqpQBhZ1WitsKxQwSRyTNH1PF7cNAsFAmr66Nkrx1 --network mainnet
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Network:	mainnet
Job:		https://dashboard.nosana.com/jobs/8qQeqpQBhZ1WitsKxQwSRyTNH1PF7cNAsFAmr66Nkrx1
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmZ9Zyt91LcDbbzHLSntAacr4UckYHy64UAxMtfpN3UWte
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		COMPLETED
Node:		https://dashboard.nosana.com/nodes/HH57dEarbNVuFGyAmbs56HtKBekyaZAPVQ4KiLVRrZzy
Start Time:	Mon Jul 29 2024 08:22:40 GMT-0400 (Atlantic Standard Time)
Duration:	17 seconds
Total Costs:	0.001955 NOS
Status:		COMPLETED
Result:		https://nosana.mypinata.cloud/ipfs/QmbAAQfthnSvfAj1edVd6cxWAVko3S9J6nQaU1AdPQeaBK
Logs:

- Executed step ollama in 10.03s
Tony was a tiny hawk who lived in the ocean. One day, Tony decided to go for a swim, so he swam to a new place. When he arrived, he saw a small plane with a hook on the top. It was wet and quite ugly. Tony was very curious, so he peeked inside.
He saw it had many different buttons and looked really exciting. Tony smiled, excited to explore. He decided to fly around and explore. He began to sing and dance. Suddenly, Tony heard a loud ringing noise and the plane started to slide down the pole. Tony was scared, but then he saw a group of people jumping in the air like the plane.
The people started laughing, and Tony got a bit embarrassed. But he had a lot of fun and decided to explore another part of the airport. He kept singing and dancing, and eventually he made it safely to the right floor. The passengers cheered when they saw Tony fly in the air.
Tony was proud of himself for seeing something so amazing! He knew that from now on he was never going to go exploring again.achieved tok/s: 129.610116

Exited with status success with code 0
```
