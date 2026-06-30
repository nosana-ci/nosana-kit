# Running the Host

This guide is for GPU Hosts who have successfully registered their GPUs on the Nosana GPU Marketplace. Congratulations on reaching this milestone! Now it's time to launch your Node and start earning $NOS by contributing GPU power to the Nosana Network.

# Setup for Ubuntu

Greetings! This is your comprehensive guide to setting up the GPU Host on an Ubuntu system. Whether you are a seasoned developer or new to the Linux world, this easy-to-follow tutorial will assist you in getting your GPU Host operational on your Ubuntu setup. Let's dive in and start the process.

1. [Install Docker](#docker)
2. [Install NVIDIA drivers and container toolkit](#nvidia)
3. [Run the GPU Host and register for Nosana Grid](#join-the-grid)

Make sure you have Ubuntu version **20.04** or higher. You can check your Ubuntu version with:

```sh:no-line-numbers
lsb_release -a
```

## Docker

Before proceeding with the installation and configuration of Docker, it is important to ensure that the appropriate privileges have been assigned. To do so, please refer to the following links for detailed instructions on properly installing and configuring Docker:

- [Install Docker Engine](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-22-04)
- [Manage Docker as a non-root user](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user)

By following these steps, you will be able to run the GPU Host without the need for root privileges.

## NVIDIA

To fully utilize the GPU on the grid, we will need to install both the NVIDIA drivers and NVIDIA's CUDA Toolkit.

## NVIDIA Driver Installation Guide

Follow these steps to install the NVIDIA drivers on your system:

1. Visit the official NVIDIA website or the link provided (https://www.linuxbabe.com/ubuntu/install-nvidia-driver-ubuntu) to download the correct driver.
2. Once the download is complete, run the installer and follow the instructions provided.
3. After installation, check that the correct driver is installed by using the command `nvidia-smi` in the terminal.
4. If the command displays the correct driver information, the installation was successful. If not, try reinstalling the driver or seeking further assistance.

Example output:

```
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 525.54       Driver Version: 526.56       CUDA Version: 12.0     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                               |                      |               MIG M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce ...  On   | 00000000:01:00.0 Off |                  N/A |
| N/A   43C    P5     9W /  N/A |      0MiB /  4096MiB |      0%      Default |
|                               |                      |                  N/A |
+-------------------------------+----------------------+----------------------+

+-----------------------------------------------------------------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|        ID   ID                                                   Usage      |
|=============================================================================|
|  No running processes found                                                 |
+-----------------------------------------------------------------------------+
```

### Guide to Install NVIDIA Container Toolkit

To install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) (`nvidia-ctk`), run the following commands:

```sh:no-line-numbers
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list \
  && \
    sudo apt-get update
```

Then we can install the NVIDIA Container Toolkit package:

```sh:no-line-numbers
sudo apt-get install -y nvidia-container-toolkit
```

#### Configuring the NVIDIA Container Toolkit on Linux

As we aim to run Podman within Docker, adhere to the Docker configuration instructions detailed here: [Configuring Docker](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#configuring-docker).

Execute the following commands in your terminal:

```sh:no-line-numbers
sudo nvidia-ctk runtime configure --runtime=docker
```

Subsequently, restart Docker with:

```sh:no-line-numbers
sudo systemctl restart docker
```

## Join the Grid

With just a single command in your command line, you can easily set up a GPU Host on your machine. Simply run the following command:

```sh:no-line-numbers
bash <(wget -qO- https://nosana.com/start.sh)
```

Please note that this script has certain requirements and is specifically designed to run without the need for sudo privileges. It's crucial to exercise caution when running any script from the internet with sudo privileges. Even in this case, it's advisable to thoroughly review the script before executing it on your system. You can review the script here: [https://nosana.com/start.sh](https://nosana.com/start.sh)

The script performs a series of tests to verify the successful completion of the previous steps outlined in the guide.

You will see your node's information displayed in the following format.

```
  _   _
 | \ | | ___  ___  __ _ _ __   __ _
 |  \| |/ _ \/ __|/ _` | '_ \ / _` |
 | |\  | (_) \__ \ (_| | | | | (_| |
 |_| \_|\___/|___/\__,_|_| |_|\__,_|

Reading keypair from ~/.nosana/nosana_key.json

Network:	    mainnet
Wallet:		    <NODE_ADDRESS>
SOL balance:	0E-9 SOL
NOS balance:	0 NOS
Provider:	    podman
```

### Nosana Grid Registration Instructions

When running the script it'll ask for some information: email, Discord & Twitter/X handle (optional). After filling in the information and agreeing to the terms & conditions, a benchmark will start. In this benchmark we will check the hardware of your node.

::: warning

To find your Node's Solana key, navigate to `~/.nosana/nosana_key.json`. It is **essential** to back up this file to ensure its safety.
:::

## Running the Host

If everything is successful, your GPU Host is now running in a Docker container.

::: info Backup your Solana Key

Your Node's Solana key is critical for operations and must be securely backed up.
To locate your Node's Solana key file, navigate to: `~/.nosana/nosana_key.json`.
It is essential to back up this file to ensure its safety.
You can print your private key to the terminal and then copy it and store it in your password manager for example.

```sh:no-line-numbers
sudo cat ~/.nosana/nosana_key.json
```

:::

### Check Your Host's Status

After you have registered and your GPU Host is running:

1. Open [host.nosana.com](https://host.nosana.com) and connect your wallet to:
   - See its statistics and $NOS earnings
2. Visit [explore.nosana.com](https://explore.nosana.com/markets) to:
   - Check the current market queue and activity

## Advanced (optional)

### Run Podman in Docker

You can use Docker to initiate your Podman instance. The `start.sh` script accomplishes this in the final step, making this a non-mandatory step:

```sh:no-line-numbers
docker volume create podman-cache
docker volume create podman-socket

docker run -d \
    --pull=always \
    --gpus=all \
    --name podman \
    --device /dev/fuse \
    --mount source=podman-cache,target=/var/lib/containers \
    --mount type=bind,source=$HOME/.nosana/,target=/root/.nosana \
    --privileged \
    -e ENABLE_GPU=true \
    -e NVIDIA_DRIVER_CAPABILITIES=all \
    nosana/podman:v1.1.0 unix:/podman.sock
```

To confirm GPU support within Podman containers, execute:

```
docker exec -it podman bash
podman run --rm --device nvidia.com/gpu=all --security-opt=label=disable ubuntu nvidia-smi -L
```

If unsuccessful, ensure NVIDIA drivers and the nvidia-ctk are [installed](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) and [configured](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html#configuring-docker)

If you see `Error: container create failed (no logs from conmon)...` when running the command, follow the steps [here](/hosts/troubleshoot#podman) to resolve issue

### Launching the GPU Host with Custom Parameters

You can manually launch the Nosana Node inside the Podman container. First, create the bridge network if it doesn't exist:

```sh:no-line-numbers
docker exec podman podman network create \
    --driver bridge \
    --subnet=192.168.101.0/24 \
    --gateway=192.168.101.1 \
    NOSANA_GATEWAY
```

Then launch the node:

```sh:no-line-numbers
docker exec -it podman podman run \
    --pull=always \
    --name nosana-node \
    --network NOSANA_GATEWAY \
    --interactive -t \
    --volume /root/.nosana/:/root/.nosana/ \
    --mount type=bind,source=/root/../podman.sock,target=/root/.nosana/podman/podman.sock \
    docker.io/nosana/nosana-node:latest \
        start --network mainnet
```

You can add the following flags to the `start` command:
* Use `--network devnet` to connect to the devnet instead of mainnet.
* Use `--log trace` to enable verbose logging.

## FAQ

::: details Do I need to keep my host running at all times?
You don't have to keep your host running at all times. However, the more your host is running, the more jobs it'll be able to pick up, which equals more $NOS rewards.
:::

::: details Where can I see the status of my host?
You can see the status of your host by having a look in the logs. To view the logs run:

```sh:no-line-numbers
docker logs -f nosana-node
```

:::

::: details Where can I view my host's statistics?
To view detailed statistics for your host, visit [Nosana Host](https://host.nosana.com/) and connect your wallet.
:::

::: details Where can I see how much $NOS I've earned so far?
You can see how much you've earned by checking your $NOS balance. If you imported your private key in a wallet you can see the $NOS balance in the wallet. Or go to [Nosana Host](https://host.nosana.com/) and connect your wallet.
:::

::: details Why is my host queued?
Not at all times will there be enough jobs for all the hosts in a market. In that case a queue will form. When there's a new job available the first host in the queue will automatically pick it up.
:::

::: details Which position in the queue is my host?
To see the market queue, go to the markets page on [Nosana Explore](https://explore.nosana.com/markets). Choose the market you are assigned to, on the market page it'll show you the queue.
:::

## Troubleshoot

If you have questions or when you have error messages, please take a look at our [Troubleshoot Guide](/hosts/troubleshoot) or join our [Discord](https://discord.gg/nosana-ai) for help.
