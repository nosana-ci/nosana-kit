---
title: Intro
next: strategies.md
---

# Deployments

<p>Deployments are the best way to run workloads on the Nosana Network because they offer a single entrypoint to defining the workload (ie. the job definition) with additional controls over how it is scheduled, stopped or extended.</p>

## Elements of a deployment

The central element of a deployment is the job definition, that is, the description of the operations that need to be executed. Additionally, deployments also define in what kind of host should the job be scheduled on (ie. in which markets should it be listed on), how many instances of the job should be executed in parallel (ie. how many job replicas should the deployment stand up), for how long should the job be executed and what kind of strategy should be used to schedule the job.

- **Job Definition**: Specified in JSON, describing the different operations with the respective containers. For a complete reference see [job definition](/deployments/jobs/job-definition/intro).
- **Market**: The Solana public key of the compute [market](gpu-markets.md) where the deployment runs.
- **Replicas**: The number of instances of the job to run.
- **Strategy**: The [deployment strategy](./strategies.md) (SIMPLE, SIMPLE-EXTEND, SCHEDULED, INFINITE), defining how to manage the job lifecycle.
- **Timeout**: The maximum execution time per job instance.

For a complete reference of deployments, see the [deployment options](./options.md) documentation.

## Executing deployments

When a deployment is created in the Nosana Network, it is assigned an initial status. Then as the underlying jobs are scheduled the status is continuously updated, moving the deployment through it's entire lifecycle. 

Deployment statuses:

- **DRAFT**: Initial state, not yet started
- **STARTING**: Deployment is initializing
- **RUNNING**: Active and processing jobs
- **STOPPING**: Gracefully shutting down
- **STOPPED**: Stopped but can be restarted
- **ARCHIVED**: Permanently archived (cannot be restarted)
- **ERROR**: Encountered an error
- **INSUFFICIENT_FUNDS**: Not enough funds in vault to continue
