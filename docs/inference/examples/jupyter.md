# Jupyter

![Jupyter](./jupyter.gif)

Harness the power of Nosana Endpoint to seamlessly run Jupyter Notebooks and connect via a user-friendly web interface.
With access to GPU-backed nodes, you can conduct your experiments efficiently and cost-effectively, unlocking new possibilities for your research and data analysis.

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
      "id": "jupyter-notebook",
      "args": {
        "cmd": [
          "bash -c ",
          "source /etc/bash.bashrc && jupyter notebook --notebook-dir=/tf --ip 0.0.0.0 --no-browser --allow-root --NotebookApp.token='' --NotebookApp.password=''"
        ],
        "expose": 8888,
        "image": "tensorflow/tensorflow:latest-gpu-jupyter",
        "gpu": true
      }
    }
  ]
}
```

## Command

Run the following command to post the job to the Nosana network.

```sh:no-line-numbers
nosana job post --file jupyter.json --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
```

## Output

```sh:no-line-numbers{16}
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Reading keypair from /home/user/.nosana/nosana_key.json

Network:	mainnet
Wallet:		4WtG17Vn3SSoTAVvXxpopQTG3Qo9NUK28Zotv4rL1ccv
SOL balance:	0.0463936 SOL
NOS balance:	65.953488 NOS
ipfs uploaded:	https://nosana.mypinata.cloud/ipfs/QmVYzwTJscCrt79guw3LBncorxxCTiHvoaSSFTmfJZmDoW
posting job to market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf for price 0.000115 NOS/s (total: 0.8280 NOS)
job posted with tx 3yK9LqRvL3jqxsX7swBBLQZb1nFwmAws32JWXZ644kbNTeje7Jgegb2i6tJJbXJ4vKsX2J17g3rbgPBZfycsfSCG!
Service will be exposed at https://4HQhVcQPfiNBFUHjLjEZa2YXZrF7xPoqLt7upnojp3Y7.node.k8s.prd.nos.ci
Job:		https://dashboard.nosana.com/jobs/CZwK1SjaGuA6EVeChS8ZeiDztByjMjWyiCn37swcJthk
JSON flow:	https://nosana.mypinata.cloud/ipfs/QmVYzwTJscCrt79guw3LBncorxxCTiHvoaSSFTmfJZmDoW
Market:		https://dashboard.nosana.com/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
Price:		0.000115 NOS/s
Status:		RUNNING

run nosana job get CZwK1SjaGuA6EVeChS8ZeiDztByjMjWyiCn37swcJthk --network mainnet to retrieve job and result
```

## Example

![Jupyter Notebook](./jupyter.png)
