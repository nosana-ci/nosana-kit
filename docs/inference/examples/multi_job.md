# Multi Operation Job

The Nosana job specification allows you to define multiple chunks of operations to be defined in one job.
Each chunk of operations can happen in it's own predetermined container, making for any number of customization that your needs require.
Example: You could start off your Nosana job in an Alpine container, and then hand off the results to a container that has an LLM, then over to an Ubuntu container for post processing.

## JSON Job Schema

Here below we can see how with the `ops` array, we can define multiple JSON objects each containing it's own job.
Each job has a `type`, `id`, and an `args` object containing:
- `cmd`: An array of shell commands that need to be executed
- `image`: The container image used to run the shell commands
- `volumes`: Docker volumes that need to be attached to this operation
- `work_dir`: The working directory within which the shell commands will run.

::: info
Create a file named `multi_job.json`, copy and paste the following into it:

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "cli"
  },
  "global": {
    "work_dir": "/home/",
    "env": {
      "DEBUG": "1"
    }
  },
  "ops": [
    {
      "type": "container/create-volume",
      "id": "create-volume",
      "args": {
        "name": "random-id-volume"
      }
    },
    {
      "type": "container/run",
      "id": "run-from-cli",
      "args": {
        "cmd": [
          "/bin/bash -c ",
          "echo Hello World > /nosana/outputs/test.txt;",
          "ls /nosana/outputs;",
          "pwd;"
        ],
        "image": "ubuntu",
        "volumes": [
          {
            "name": "random-id-volume",
            "dest": "/nosana/outputs"
          }
        ],
        "work_dir": "/home/podman"
      }
    },
    {
      "type": "container/run",
      "id": "run-from-cli-2",
      "args": {
        "cmd": "/bin/bash -c 'echo Hello World; ls; pwd;'",
        "image": "ubuntu"
      }
    }
  ]
}
```

## Command

Run the following command to post the job to the network.

```sh:no-line-numbers
nosana job post --file multi_job.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
```

## Output

When the Nosana job is posted successfully you should see something similar to the following:

```sh:no-line-numbers
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Reading keypair from /home/user/.nosana/nosana_key.json

Network:	mainnet
Wallet:		4WtG17Vn3SSoTAVvXxpopQTG3Qo9NUK28Zotv4rL1ccv
SOL balance:	0.03551372 SOL
NOS balance:	54.52498 NOS
ipfs uploaded:	https://nosana.mypinata.cloud/ipfs/QmRSLxBU9iemsmjmHMmmqkwEkqujuYSrtPeNYqoNRGmmxT
posting job to market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf for price 0.000115 NOS/s (total: 0.8280 NOS)
job posted with tx 4tc9Ys9bGQSUKugVsgXKTa2GqVQkjTk99JvsiRVpchxW9fupsTyCeUiHN3fXqq7y9g2CsJbSkx6gZjtDiPEY2gs2!
Service will be exposed at https://FiYK3EKgFRbD1yfcPMUMhxNEPz3bkpYduCmWt7hJKRtp.node.k8s.prd.nos.ci
Job:		https://dashboard.nosana.com/jobs/3YBLQ1LAQyjsUyBBN3G8oNRc7fBSGU3qDhWc9VtMTtDA
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmRSLxBU9iemsmjmHMmmqkwEkqujuYSrtPeNYqoNRGmmxT
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		RUNNING

run nosana job get 3YBLQ1LAQyjsUyBBN3G8oNRc7fBSGU3qDhWc9VtMTtDA --network mainnet to retrieve job and result
```

Let's run the `nosana job get` command to retrieve the results.

```sh:no-line-numbers
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Network:	mainnet
Job:		https://dashboard.nosana.com/jobs/3YBLQ1LAQyjsUyBBN3G8oNRc7fBSGU3qDhWc9VtMTtDA
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmRSLxBU9iemsmjmHMmmqkwEkqujuYSrtPeNYqoNRGmmxT
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		COMPLETED
Node:		https://dashboard.nosana.com/nodes/DKUo8PCKcrfunRiCHWFNjeVLQieVYWr8izauPCFm8BVv
Start Time:	Tue Jul 30 2024 09:30:50 GMT-0400 (Atlantic Standard Time)
Duration:	41 seconds
Total Costs:	0.004715 NOS
Status:		COMPLETED
Result:		https://nosana.mypinata.cloud/ipfs/QmPutzR15brP5kFKeySRRYRp1PUj2Dz91xhZS9dkP7yjGo
Logs:

- Executed step create-volume in 0.244s

Exited with status success with code 0

- Executed step run-from-cli in 3.196s
test.txt
/home/podman

Exited with status success with code 0

- Executed step run-from-cli-2 in 0.306s
Hello World
ubuntu
/home

Exited with status success with code 0
```
As we can see the output of the commands we specified in the job are logged to the standard output, and displayed back to us in the logs of the results.
