# Running the Host

This guide is for GPU Hosts who have successfully registered their GPUs on the Nosana GPU Marketplace. Congratulations on reaching this milestone! Now it's time to launch your Node and start earning $NOS by contributing GPU power to the Nosana Network.

::: info Backup your Solana Key

Your Node's Solana key is critical for operations and must be securely backed up.
To locate your Node's Solana key file, navigate to: `~/.nosana/nosana_key.json`.
It is essential to back up this file to ensure its safety.
You can print your private key to the terminal and then copy it and store it in your password manager for example.
```sh:no-line-numbers
sudo cat ~/.nosana/nosana_key.json
```
:::

## Nosana Start GPU Hosts Script

With just a single command in your command line, you can easily run your GPU Host on your machine. Simply run the following command:

```sh:no-line-numbers
bash <(wget -qO- https://nosana.com/start.sh)
```
If everything is successful, your GPU Hosts is now running in a docker container.

## Register as a GPU Host

These guides are instructing you on how to establish your GPU Host and partake in the Nosana GPU Markets:

[Ubuntu](/hosts/grid-ubuntu): If you're running Ubuntu, a popular distribution of Linux, you should follow this guide.


## Advanced (optional)
## Launching the GPU Host with Custom Parameters

You can manually launch the GPU Host to modify certain parameters:
* Use the `--podman` parameter to direct to your Podman service socket file if it's located elsewhere.
* Use `--volume` to map your solana key to `/root/.nosana/nosana_key.json` within the Docker container if you wish to use your own key.

```sh:no-line-numbers
docker run \
      --pull=always \
      --network host  \
      --interactive -t \
      --volume ~/.config/solana/id.json:/root/.nosana/nosana_key.json \
      --volume path-to-your-podman-socket:/root/.nosana/podman/podman.sock:ro \
      nosana/nosana-cli nosana node start \
         --network mainnet \
         --rpc your-rpc-here \
         --podman /root/.nosana/podman/podman.sock
```

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

::: details Where can I see how much $NOS I’ve earned so far?
You can see how much you've earned by checking your $NOS balance. If you imported your private key in a wallet you can see the $NOS balance in the wallet. Else go to a [Solscan](https://solscan.io/) or [Solana Explorer](https://explorer.solana.com/) and fill in your hosts' address to see your token balances.
:::

::: details Why is my host queued?
Not at all times will there be enough jobs for all the hosts in a market. In that case a queue will form. When there's a new job available the first host in the queue will automatically pick it up.
:::

::: details Which position in the queue is my host?
To see the market queue, go to the markets page on the [Nosana Dashboard](https://dashboard.nosana.com/markets). Choose the market you are assigned to, on the market page it'll show you the queue.
:::
