# Getting Started

::: info
Are you looking for how to run inference using the API, SDK or Dashboard with Nosana Credits? The easiest place to start is [learn.nosana.com](https://learn.nosana.com).
:::

The Nosana Network is a platform for running [AI inference workloads](https://www.oracle.com/artificial-intelligence/ai-inference/#:~:text=AI%20inference%20is%20when%20an,way%20that%20mimics%20human%20abilities). In this tutorial we will show you how to post jobs directly on the blockchain using the Nosana CLI. For this you need a Solana wallet with a bit of NOS and SOL.

We'll start with a simple hello world program and afterwards build on these concepts to create a fully working endpoint.

## Installing The Nosana CLI

To begin, you need to install the Nosana CLI globally using NPM or your favorite JavaScript runtime.


::: code-group

```sh [npm]
npm install -g @nosana/cli
```

```sh [yarn]
yarn install -g @nosana/cli
```

```sh [pnpm]
pnpm install -g @nosana/cli
```

```sh [bun]
bun install -g @nosana/cli
```

:::



Verify the installation by running:

```sh:no-line-numbers
nosana --version
```

```sh:no-line-numbers
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

0.3.0
```

You should see the Nosana CLI usage information.

## Your Nosana Wallet

When you first run the Nosana CLI, a new keypair is generated for you in `~/.nosana/.nosana_key.json`, creating a new wallet. In order to run Nosana jobs, you need to have some NOS and SOL in this wallet. You can purchase NOS on Kraken or swap in your Solana wallet.

Next, run `nosana address`, and the terminal will print out your address (the public key). If you need access to your private keys, they can be found in the local folder on your machine. However, for security reasons, we strongly advise against replacing this file.

Once you have NOS/SOL, send some to the address logged from the `nosana address` command. Now you're ready to start running jobs on the Nosana network!

## First Nosana Job

Once your wallet is loaded with some SOL and NOS, you can post jobs to the Nosana Network.

First, we need to determine which market to post our job in. Navigate to [Nosana Explorer Markets](https://dashboard.nosana.com/markets) to see a list of available markets. Each market has certain parameters, such as NOS per second, type of GPU used, available nodes, etc.

For this first test, we will use the cheapest option, which at the time of writing is [Market 3060](https://dashboard.nosana.com/markets/7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq). Copy the market address, `7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq`, and use it in the `nosana job post` command.

The following parameters will be added to the command:

- `echo hello world` - the shell command to run
- `--wait` - waits for the job to finish and posts the result back immediately
- `--market` - specifies the market to use

```sh:no-line-numbers
nosana job post echo hello world --wait --market 7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq
```

You should see something similar to the following output in your console:

```sh:no-line-numbers
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Reading keypair from /home/user/.nosana/nosana_key.json

Network:        mainnet
Wallet:         4WtG17Vn3SSoTAVvXxpopQTG3Qo9NUK28Zotv4rL1ccv
SOL balance:    0.07016512 SOL
NOS balance:    6.924775 NOS
ipfs uploaded:  https://nosana.mypinata.cloud/ipfs/QmRm643NbpakeumLbXuuXJoHNpnz74MghhWtFNJNq9kN7W
posting job to market EzuHhkrhmV98HWzREsgLenKj2iHdJgrKmzfL8psP8Aso for price 0.000035 NOS/s (total: 0.2520 NOS)
job posted with tx 2r75ajjHdr5mPZV85NjFxtY28tKYK3UvNtdD7W7TfYCKvCXGgEdgJsia3jWdWaz5VES5sZWipEabnjwQkoE1dcwf!
Service will be exposed at https://F5yVhYmrWKVLNwkGnLgBtfXEkE5CygKqV7BTWzDziZUa.node.k8s.prd.nos.ci
Job:            https://dashboard.nosana.com/jobs/FQTP2F5hNP2rNGUtQm4Annrx462PgxPcSA6ND6ToPTxH
JSON flow:      https://nosana.mypinata.cloud/ipfs/QmRm643NbpakeumLbXuuXJoHNpnz74MghhWtFNJNq9kN7W
Market:         https://dashboard.nosana.com/markets/EzuHhkrhmV98HWzREsgLenKj2iHdJgrKmzfL8psP8Aso
Price:          0.000035 NOS/s
Status:         RUNNING
Node:           https://dashboard.nosana.com/nodes/HWAbUKhTSEXKarqXAjFB9EmaszsoB7dGEC7Gjxf7vNfk
Start Time:     Wed Jul 17 2024 07:15:47 GMT-0400 (Atlantic Standard Time)
Duration:       10 seconds
Total Costs:    0.00035 NOS
Status:         COMPLETED
Result:         https://nosana.mypinata.cloud/ipfs/QmeZkLktjyEqKkK8cP34ZtMJ8igzqKks5M8dFLStV4Q3t5
Logs:

- Executed step run-from-cli in 0.371s
hello world

Exited with status success with code 0
```

## Get Job from Job ID

Retrieving the results from the CLI is also possible. Use the job ID to retrieve the data, which can be found in the job URL posted above:
<https://dashboard.nosana.com/jobs/FQTP2F5hNP2rNGUtQm4Annrx462PgxPcSA6ND6ToPTxH>.

Run the following command to get the result of the job:

```sh:no-line-numbers
nosana job get FQTP2F5hNP2rNGUtQm4Annrx462PgxPcSA6ND6ToPTxH
```

Next, we will learn how to create a Nosana Job schema to access Nosana's powerful features, such as using GPUs and spinning up an instance to connect to an endpoint.
