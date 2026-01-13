---
title: Strategies
---

# Deployment Strategies

Deployment strategies are a mechanism to control the lifecycle of the underlying jobs. Below are the deployment strategies currently supported.

- **SIMPLE**: Runs the specified number of job replicas once. Considers the deployment **STOPPED** when all replicas have stopped either because timeout was reached or the job containers terminated.
- **SIMPLE-EXTEND**: Similar to **SIMPLE** strategy in that it runs the specified number of job replicas, but instead of terminating the jobs at the end of the timeout period, it extends them for another period equal to the timeout. The jobs of the deployment keep getting extended until there are no more funds available to run it.
- **SCHEDULED**: Similar to **SIMPLE** strategy in that it runs the specified number of job replicas, but instead of scheduling them immediately, only schedules them at the specified instants.
- **INFINITE**: **(COMING SOON)** Continuously maintains the specified number of replicas, scheduling new jobs right before the running jobs reach the specified timeout.

## Scheduled startegy configuration

When you choose the `SCHEDULED` strategy, you need to provide the schedule in cron format:

```json
{
  "schedule": "0 0 * * *", // daily at midnight
  "strategy": "SCHEDULED",
  ...
}
```

The cron expression has five space‑separated fields:  

- **minute** (0–59)  
- **hour** (0–23)  
- **day of month** (1–31)  
- **month** (1–12)  
- **day of week** (0–6, where 0 is Sunday)

Some common examples for `schedule` are:

- `"*/5 * * * *"` – run every 5 minutes
- `"0 * * * *"` – run at the start of every hour
- `"0 9 * * 1-5"` – run at 09:00 on weekdays (Monday–Friday)

You can experiment with and validate your cron expressions using tools like [`crontab.guru`](https://crontab.guru/).
