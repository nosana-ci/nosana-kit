---
title: Options
---

# Deployment Options

Each deployment consists of:

- **name**: A descriptive name for your deployment
- **market**: The Solana address of the GPU market where your deployment will run
- **timeout**: Maximum execution time in minutes (60 = 60 minutes)
- **replicas**: Number of instances to run simultaneously
- **strategy**: Deployment strategy (`SIMPLE` for one-time execution, see [strategies](./strategies.md) for more info)
- **job_definition**: The container job definition specifying what to run (see the [Job Definition](/deployments/jobs/job-definition/intro))

```json
{
  "name": "Pytorch Jupyter Notebook",
  "market": "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ", // NVIDIA 3090 
  "replicas": 1,
  "timeout": 60, // minutes
  "strategy": "SIMPLE",
  "job_definition": {...}
}
```

## Full Example

Below is a full example of deployment that will spin up a Pytorch Jupyter Notebook daily at midnight.
```json
{
  "name": "Pytorch Jupyter Notebook",
  "market": "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ",
  "replicas": 1,
  "timeout": 60, // minutes
  "strategy": "SCHEDULED",
  "schedule": "0 0 * * *", // daily at midnight
  "job_definition": {
    "ops": [
      {
        "id": "Pytorch",
        "args": {
          "cmd": [
            "jupyter",
            "lab",
            "--ip=0.0.0.0",
            "--port=8888",
            "--no-browser",
            "--allow-root",
            "--ServerApp.token=''",
            "--ServerApp.password=''"
          ],
          "gpu": true,
          "image": "docker.io/nosana/pytorch-jupyter:2.0.0",
          "expose": 8888
        },
        "type": "container/run"
      }
    ],
    "meta": {
      "trigger": "dashboard",
      "system_requirements": {
        "required_vram": 4
      }
    },
    "type": "container",
    "version": "0.1"
  }
}
```