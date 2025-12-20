# Troubleshooting Guide

This guide is created to aid users in resolving issues with their GPU-equipped Nosana Node configuration on Linux operating systems.

## Error Messages

### Nvidia

::: warning nvidia-smi: command not found
::: details Solution
It means that you do not have NVIDIA drivers installed. To install them, download and install the correct drivers from the NVIDIA website: https://www.nvidia.com/download/index.aspx
:::

::: warning Error: setting up CDI devices: unresolvable CDI devices nvidia.com/gpu=all
::: details Solution
It means that you did not install and configure the Nvidia Container Toolkit correctly:

- [Nvidia instructions for Ubuntu](/hosts/grid-ubuntu.html#guide-to-install-nvidia-container-toolkit)
  :::

### Docker

::: warning The command 'docker' could not be found.
::: details Solution
Ensure that you have Docker installed and that it is running. Follow the [Docker installation guide for Linux](https://docs.docker.com/desktop/linux/install/) to install Docker on your system.
:::

### Podman

::: warning Error: Could not connect to Podman
::: details Solution
When you see this error, check your Docker daemon configuration. Ensure Docker is properly installed and running on your Linux system.
:::

::: warning Error: container create failed (no logs from conmon): conmon bytes "": readObjectStart: expect { or n, but found , error found in #0 byte of ...||..., bigger context ...||...
::: details Solution
This error is caused by the latest version of `conmon` having known issues, downgrade `conmon` to resolve this, like this:

```
wget https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/xUbuntu_22.04/amd64/conmon_2.1.2~0_amd64.deb -O /tmp/conmon_2.1.2.deb
sudo apt install /tmp/conmon_2.1.2.deb
```

Then you can rerun the podman command

```
podman run --rm --device nvidia.com/gpu=all --security-opt=label=disable ubuntu nvidia-smi -L
```
