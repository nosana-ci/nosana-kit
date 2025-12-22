---
title: Cached Resources
---

# Cached Resources

Every Nosana Node will cache the resources they need to run a job.
These can either be Docker images or the inference models needed.
This is useful, because the main bottle neck to spinning up a Nosana Job is a downloading the assets to start the job.

By splitting apart the docker image and the inference model into separate parts, it becomes possible to make the docker image really small.
This helps us achieve a couple of things:

1. Reduce Docker pull speed bottlenecks
2. Use one Docker image to run multiple models
3. Share inference models across Docker images, reducing disk space requirements and increasing time to first token.

## Cache availability

The cache lifetime is currently set to 24 hours from the moment it is downloaded to a Nosana Node.
The downloaded Docker image and inference models will be available on the Node for 24 hours.

Note this does not mean the cached asset is cached to all other nodes in that specific market.
That means if a job gets picked up by Nosana Node `XXX` in the `97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf` market, and a second job is posted in the same market and is picked up by Nosana Node `YYY`, those resources will need to be downloaded again.
It's only if Nosana Node `XXX` picks up the job again, will the cached resources be available.

## Available resources per market

All nodes will have certain Docker images and inference models always available, called required resources.
These are available on a per market basis.

It's possible to retrieve a list of these required resources such as Docker images on a Nosana Node, by going to the following URL:
`https://dashboard.k8s.prd.nos.ci/api/markets/<Market-Address>/required-resources`

By replacing `<Market-Address>` with the address of a market, you will be able to retrieve the cached resources for that specific Nosana Market.

An example of the `97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf` market would be the following.
<https://dashboard.k8s.prd.nos.ci/api/markets/97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf/required-resources>

When we go to this url, we will see the following JSON.

```json
{
  "required_images": [
    "registry.hub.docker.com/nosana/frpc:0.1.0",
    "registry.hub.docker.com/nosana/stats:v1.0.4",
    "registry.hub.docker.com/nosana/llm_benchmark:1.0.0",
    "registry.hub.docker.com/nosana/remote-resource-helper:0.1.0",
    "docker.io/openmmlab/lmdeploy:v0.5.3-cu12",
    "docker.io/vllm/vllm-openai:v0.5.4",
    "docker.io/saladtechnologies/a1111:ipv6-v1.9.4"
  ],
  "required_remote_resources": [
    {
      "type": "S3",
      "url": "https://models.nosana.io/stable-diffusion/dreamshaper/8"
    }
  ]
}
```

Here we can see the list of cached Docker images, and cached models that is always available for this particular Nosana Market.
All Nosana Nodes operating in this market will have these resources available.
That means that as soon as the job is posted to the market and picked up a Nosana Node, it will be almost instantly available.

Otherwise the resources need to be downloaded, and then can take a while.

