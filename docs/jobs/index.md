---
layout: doc
---

# Jobs

Jobs are the fundamental unit of work on the Nosana Network. A job defines what you want to run, how to run it, and what resources it needs. Jobs are executed on Nosana nodes, which provide GPU compute resources in a decentralized marketplace.

## What is a Job?

A **job** is a containerized workload that runs on the Nosana Network. Each job:

- Defines the Docker container image to use
- Specifies the commands to execute
- Declares resource requirements (GPU, memory, etc.)
- Can expose services via endpoints
- Can mount external resources (models, data, etc.)

Jobs are defined using a JSON format called the **Job Definition**, which provides a flexible and powerful way to describe your workloads.

## Getting Started

To get started with jobs on Nosana:

1. **[Job Execution Flow](/jobs/job_execution_flow)** - Learn how jobs are executed on the network
2. **[Job Definition](/jobs/job-definition/intro)** - Understand the structure and options available in job definitions

## Deployments

::: info Deployments vs Jobs
If you're looking for **deployments** (which manage your jobs and provide features like auto-scaling, health checks, and service management), please visit [learn.nosana.com](https://learn.nosana.com) for deployment documentation.

Deployments are a higher-level abstraction that manage one or more jobs, while jobs are the individual units of work that execute on the network.
:::

## Job Execution Flow

When you submit a job to the Nosana Network:

1. **Job Submission** - Your job definition is submitted to a market
2. **Node Selection** - A Nosana node picks up your job based on requirements
3. **Resource Preparation** - The node pulls Docker images and mounts resources
4. **Execution** - Your container runs with the specified commands
5. **Completion** - Results are returned and the node is rewarded

## Examples

Nosana is a fully permissionless network, which means you can run whatever model or workload you want! Check out the [Examples Catalog](/inference/examples/) or visit [Nosana Templates](https://github.com/nosana-ci/pipeline-templates/tree/main/templates) on GitHub for inspiration.

