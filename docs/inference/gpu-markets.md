---
title: GPU Markets
---

# GPU Markets

Nosana offers a variety of GPU markets tailored to different needs. Below is a comprehensive list of available NVIDIA GPU markets.

- **Market Name**: Type of NVIDIA GPU available.
- **Address of Market**: Address to use with the `--market` flag in the `nosana job post` command.

For real-time updates on prices, job timeouts, queue lengths, and more, visit the [Nosana explorer](https://dashboard.nosana.com/markets).

## CLI commands

Or it is also possible to retrieve market information through the `nosana` CLI

### List Markets

```sh:no-line-numbers
nosana market list
```

### Market Info

```sh:no-line-numbers
nosana market get nvidia-3060
```

#### Output

```sh:no-line-numbers
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Network:                mainnet
Name:                   Market 3060
Slug:                   nvidia-3060
Address:                7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq
SFT collection:         EriVoySzVWF4NtNxQFCFASR4632N9sh9YumTjkhGkkgL
Job price:              0.000043 NOS/s
Job timeout:            120 minutes
Job expiration:         24 hours
Queue type:             Node Queue
Nodes in queue:         23
GPU Types:
┌──────────────────────────────┐
│            Values            │
├──────────────────────────────┤
│   NVIDIA GeForce RTX 3060    │
│  NVIDIA GeForce RTX 3060 Ti  │
└──────────────────────────────┘

Required Docker Images:
┌───────────────────────────────────────────────┐
│                    Values                     │
├───────────────────────────────────────────────┤
│        docker.io/laurensv/nosana-frpc         │
│  registry.hub.docker.com/nosana/stats:v1.0.4  │
└───────────────────────────────────────────────┘

Required Remote Resources
[]
```

### Using the `--market` Flag

To post a job on Nosana, use the following command format:

```sh:no-line-numbers
nosana job post --market <Market_Address | Market_Slug>
```

Example:

```sh:no-line-numbers
nosana job post --market 3XGECQon74HQwPJuZjgCwqdQ5Nt3wktZ9fcavcDN9qB2

# OR

nosana job post --market nvidia-3060
```

