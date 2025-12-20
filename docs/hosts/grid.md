# Getting Started

## Welcome to the Nosana GPU Marketplace

The Nosana Network connects GPU Hosts with Clients who need scalable, cost-effective GPU compute. As a GPU Host, you’ll contribute to a decentralized ecosystem by listing your NVIDIA GPUs on the Nosana Marketplace for AI inference and other compute workloads.

## GPU Hosts

GPU Hosts run the Nosana Node software, which connects your hardware to the marketplace. To register your device, it must include a compatible NVIDIA GPU.

::: warning
We recommend running the Nosana Node software in a sandboxed environment and using a Solana wallet with only a minimal amount of SOL.
:::

::: info
For clarity we would also like to inform you that Nosana supports
**1 private key per GPU, 1 GPU per PC**
:::

## Hardware Requirements

::: warning Platform Support
As of this release, Windows (including WSL2) is being deprecated as a supported platform for Nosana GPU Hosts. Going forward, only native Linux installations are officially supported. We recommend using Ubuntu 20.04 or newer for the best experience and compatibility with the Nosana Node software.
:::

To participate as a GPU Host, ensure your setup meets the following criteria:

- **RAM**: 12GB+
- **Storage**: 256GB+ NVMe (SSD)

  Large language models storage requirements can be high, especially models geared towards higher end GPU’s. It is recommended that ancillary storage up to 1TB be provided for your host to handle client model requirements.

- **Bandwidth**: Minimum 100 Mb/s download, 50 Mb/s upload.

  High speed internet speed is required. To increase your chances of your host being hired by a client, we recommend 500 Mb/s download, 250 Mb/s upload, with ping below 100ms.

- **Supported NVIDIA GPUs**:

  | RTX 30 Series | RTX 40 Series | RTX 50 Series | RTX A Series (Professional) | RTX A100 & H100 (Data Center) |
  | ------------- | ------------- | ------------- | --------------------------- | ----------------------------- |
  | RTX 3090Ti     | RTX 4090       | RTX 5090       | RTX A6500                   | RTX A100 40GB                 |
  | RTX 3090       | RTX 4080       | RTX 5080       | RTX A5500                   | RTX A100 80GB                 |
  | RTX 3080Ti     | RTX 4070Ti     | RTX 5070       | RTX A5000                   | RTX H100                      |
  | RTX 3080       | RTX 4070       |                | RTX A4500                   |                               |
  | RTX 3070Ti     | RTX 4060Ti     |                | RTX A4000                   |                               |
  | RTX 3070       | RTX 4060       |                | RTX A40                     |                               |
  | RTX 3060Ti     |                |                |                             |                               |
  | RTX 3060       |                |                |                             |                               |

<!-- ## Software Requirements
You will need to install the following to get started as a GPU Host:

- [Ubuntu (>20.04) or Windows (with Ubuntu 22.04 on WSL2)](https://ubuntu.com/tutorials/install-ubuntu-on-wsl2-on-windows-11-with-gui-support#3-download-ubuntu)
- [Docker (Required)](https://docs.docker.com/desktop/linux/install/)
  - [Podman (Optional - Required for WSL2)](https://software.opensuse.org//download.html?project=devel%3Akubic%3Alibcontainers%3Aunstable&package=podman)
- [NVIDIA Drivers (Required)](https://www.linuxbabe.com/ubuntu/install-nvidia-driver-ubuntu)
- [NVIDIA Container Toolkit (Required)](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
- [Solana Tool Suite (Optional)](https://docs.solana.com/cli/install-solana-cli-tools) -->

## Installation Guides

Follow these guides to become a GPU Host or list your hardware on the Nosana Network:

[Ubuntu](/hosts/grid-ubuntu): Follow this guide if you're using Ubuntu, a widely used Linux distribution.

## Host Your GPU

After listing your hardware on the Nosana Network, you’re ready to start hosting! Launch your GPU Host to begin contributing compute power and earning rewards.

👉 Get started today: [**Nosana Docs**](/hosts/grid-run)
