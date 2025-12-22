# Whisper

[Whisper](https://github.com/openai/whisper) is a general-purpose speech recognition model.
It is trained on a large dataset of diverse audio and is also a multitasking model that can perform multilingual speech recognition, speech translation, and language identification.
In this example we will use whisper to analyze a file that has the audio of someone saying "hello", and it will transcribe the audio for us.

## JSON Job Schema

::: info
Create a file named `jupyter.json`, copy and paste the following into it:

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
      "id": "run-whisper",
      "args": {
        "cmd": ["python openai-whisper.py -p hello.mp3"],
        "image": "docker.io/nosana/whisper:latest",
        "gpu": true
      }
    }
  ]
}
```

## Command

Run the following command to post the job to the Nosana network.

```sh:no-line-numbers
nosana job post --file whisper.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
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
SOL balance:	0.03786024 SOL
NOS balance:	64.297466 NOS
ipfs uploaded:	https://nosana.mypinata.cloud/ipfs/QmSPZj2WxyxUJyMxqrn6iKUrHezKcnjNKdWbi4VLDSGQBB
posting job to market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf for price 0.000115 NOS/s (total: 0.8280 NOS)
job posted with tx 4j23fa4pNpggoexbP47Cw6oqRor2BJdH9PRAHNKbo396gttASv2KqZmfBDQN4MPs7L9oWeNJesfrekx2qP7Yf1ys!
Service will be exposed at https://7TsqMbiD6HPhJzHpMGB45fCPMwS5fZzCCgFHfhQZt5c7.node.k8s.prd.nos.ci
Job:		https://dashboard.nosana.com/jobs/FKcGZH5xAfDycNi8F4KqYvPW6QA4Azu5AYsEDjT7UEus
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmSPZj2WxyxUJyMxqrn6iKUrHezKcnjNKdWbi4VLDSGQBB
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		RUNNING

run nosana job get FKcGZH5xAfDycNi8F4KqYvPW6QA4Azu5AYsEDjT7UEus --network mainnet to retrieve job and result
```

## Example

At the end of the output logs we will see the transcription.

```sh:no-line-numbers
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Network:	mainnet
Job:		https://dashboard.nosana.com/jobs/FKcGZH5xAfDycNi8F4KqYvPW6QA4Azu5AYsEDjT7UEus
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmSPZj2WxyxUJyMxqrn6iKUrHezKcnjNKdWbi4VLDSGQBB
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		COMPLETED
Node:		https://dashboard.nosana.com/nodes/EQbm8WokowUrZ1aV1wDLB8TutPoYSphVrnrP7ig4C1z8
Start Time:	Mon Jul 29 2024 10:37:29 GMT-0400 (Atlantic Standard Time)
Duration:	127 seconds
Total Costs:	0.014605 NOS
Status:		COMPLETED
Result:		https://nosana.mypinata.cloud/ipfs/QmWVT554VBZ5UAa8uDgHKrcHEqtqCccCoESMnAWKwYLac4
Logs:

- Executed step run-whisper in 118.415s
Using device: cuda:0
[00:00.000 --> 00:00.500]  Hello!

Exited with status success with code 0
```
