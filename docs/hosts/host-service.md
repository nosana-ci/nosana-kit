# Install the Host Service

The host service runs your Nosana node as a system service. It keeps the node running across reboots,
updates it, and lets you watch and control the machine from [host-beta.nosana.com](https://host-beta.nosana.com).

## Requirements

- Ubuntu 22.04, 24.04 or 26.04, or Debian 12 or 13, on x86-64. WSL is not supported.
- An NVIDIA driver (R550 or newer) and the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).
- A CDI spec for your GPUs:

```sh:no-line-numbers
sudo nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml
```

You do not need Docker or Podman: the host service brings its own container runtime.

## Fresh install

1. Open [host-beta.nosana.com](https://host-beta.nosana.com), add a host and copy its install command. The
   token in it links the machine to your account and is valid for one hour.
2. Run it on the machine:

```sh:no-line-numbers
curl -fsSL https://host-beta.nosana.com/install.sh | sudo sh -s -- --token <token>
```

The host service creates a new node key at `/var/lib/nosana/node/nosana_key.json` and starts the node.
Back this key up: it holds your node's address and earnings.

## Move an existing node

If your node runs with `start.sh`, or in docker from the `nosana/nosana-node` image, the install
command above finds it and asks whether to move it to the host service. Answer yes: the node keeps its key,
and with it its address, registration and market. The install does not go on next to a node it does
not move, as both would use the GPU.

The host service downloads the node while your old node keeps running. A job that runs is finished first,
then the old node stops and the host service starts the node itself, so the node is offline only briefly.
The installer shows what the move waits for, and the host service finishes the move even if you close the
terminal. After the move the host service keeps the old node stopped, also if
something starts it again after a reboot, so stop and disable any service or script of your own that
runs `start.sh`.

Without a terminal, or to choose the key yourself, add it to the install command:

```sh:no-line-numbers
curl -fsSL https://host-beta.nosana.com/install.sh | sudo sh -s -- --token <token> --import-key ~/.nosana/nosana_key.json
```

On a machine that already runs the host service, `sudo nosana-host node import <key file>` does the same,
and also replaces its node key with another one; the key it had is backed up to your home
folder.

Check that it worked:

```sh:no-line-numbers
nosana-host status
```

The node address must be the one you had. Follow the node with `nosana-host logs node -f`.

::: tip Going back
The move copies your key and leaves `~/.nosana` and the old setup untouched. To go back, run
`sudo nosana-host uninstall` first, then start your node again as before.
:::

## Everyday use

```sh:no-line-numbers
nosana-host status                 # node, GPU, disk, wallet and health checks
nosana-host logs node -f           # the node's log
nosana-host node start|stop|restart
nosana-host doctor                 # what is missing on this machine, and how to fix it
```

The same controls are on your host's page at [host-beta.nosana.com](https://host-beta.nosana.com).
