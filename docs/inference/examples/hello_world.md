
# Hello World

The Nosana job specification allows you to define and run any shell command to run inside a container.
In this example we will run an Ubuntu container to use the `echo` command to print "hello world"

## JSON Job Schema

Here below we can see how with the `ops` array.
Each job has a `type`, `id`, and an `args` object containing:
- `cmd`: An array of shell commands that need to be executed, in this case the command `echo hello world`
- `image`: The container image used to run the shell commands, in this case an Ubuntu container.

::: info
Create a file named `hello_world.json`, copy and paste the following into it:

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
      "id": "hello-world",
      "args": {
        "cmd": ["echo hello world"],
        "image": "ubuntu"
      }
    }
  ]
}
```

## Command

Run the following command to post the job to the network, we'll use the `--wait` flag to wait for the results.

```sh:no-line-numbers
nosana job post --file hello_world.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf --wait
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
SOL balance:	0.02789192 SOL
NOS balance:	54.511837 NOS
ipfs uploaded:	https://nosana.mypinata.cloud/ipfs/QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p
posting job to market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf for price 0.000115 NOS/s (total: 0.8280 NOS)
job posted with tx o52uZn3beCQAXe4rcvcsyRshCjGrFsFSJvRRUZZLpXNWxNArN7WzVjfZYNn6Sn15akqpM4fc4c45s7vxd49SAzK!
Service will be exposed at https://5L4SLcpXFiR5Fw3UvGzbSsZfXn66UMjgieTmmJj3kdwM.node.k8s.prd.nos.ci
Job:		https://dashboard.nosana.com/jobs/58QFVuyJo6xuuUwtjSW4JvkJogNmt8zhec9SXsWW3mLr
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		RUNNING
Node:		https://dashboard.nosana.com/nodes/9ZNv6iqU1GbHjitG1QLpBU92Tc8wnQo2bMNLSZcDwkXA
Start Time:	Tue Jul 30 2024 14:44:53 GMT-0400 (Atlantic Standard Time)
Duration:	8 seconds
Total Costs:	0.00092 NOS
Status:		COMPLETED
Result:		https://nosana.mypinata.cloud/ipfs/QmPvpBfknTZVoWA3tNLk1VBoNksqAaFNvgogDAhkccPchS
Logs:

- Executed step hello-world in 0.111s
hello world

Exited with status success with code 0
```

As we can see the output of the commands we specified in the job are logged to the standard output, and displayed back to us in the logs of the results.
