---
title: HuggingFace Resources
---

# HuggingFace Resources

Loading resources into your Nosana job is essential to making sure the job is ready to go as fast as possible.

To facilitate this you can use the `resources` property of the Nosana Job Definition.
At the moment there are two primary built in providers that you can use to load in an external resource.

1. HuggingFace
2. S3

HuggingFace is the gold standard for hosting Machine Learning Models, providing a vast repository of open-source models. S3, on the other hand, is the gold standard for storing and retrieving any kind of data, offering robust and scalable storage solutions.

With the combination of these two storage services, you can create Nosana jobs efficiently, and with tools you know and love.

## HuggingFace

Most open source models that you know and love are hosted and tracked on HuggingFace.
That's why downloading HuggingFace models has first class support in the Nosana Ecosystem.

As an example, let's say you want to use the following LLM: [TinyLlama/TinyLlama-1.1B-Chat-v1.0](https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0).

In order to load this model into the Docker Runtime of your Nosana job you will need to specify a `resources` array. This array will take objects with the following properties:

- `repo` - This is the name of the repo you want to download, `<username>/<repo-name>`
- `type` - Here the type of the resource needs to be specified, for HuggingFace resources it's `HF`
- `target` - Lastly we need to define the path where the resources will be downloaded to

## Example

Create a file on your filesystem called `hf.json` with the following contents.

```json
{
  "version": "0.1",
  "meta": {
    "trigger": "cli"
  },
  "type": "container",
  "ops": [
    {
      "id": "huggingface",
      "args": {
        "cmd": ["ls", "/data-models"],
        "gpu": true,
        "image": "ubuntu",
        "resources": [
          {
            "type": "HF",
            "repo": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            "target": "/data-models/"
          }
        ]
      },
      "type": "container/run"
    }
  ]
}
```

## Deploying the Job

Now, deploy the Nosana Job Definition with the following command:

```sh
nosana job post --file hf.json --market nvidia-3090 --timeout 10
```

In this command, we specify that we want to deploy our job to the [NVIDIA-3090 market](https://dashboard.nosana.com/markets/CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ), and that we want it to run for 10 minutes.

## Conclusion

By following these steps, you can efficiently load resources into your Nosana job, leveraging the power of HuggingFace and S3. For more information, explore additional resources on [Nosana documentation](https://docs.nosana.com) and [HuggingFace](https://huggingface.co/).

