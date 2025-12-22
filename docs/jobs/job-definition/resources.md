---
title: Resources
---

Nosana Nodes can cache resources they need to run a job. This is useful, because the main bottle neck to spinning up a job is downloading the assets to start the job like docker images and model files.

You can use the `resources` property of the Nosana Job Definition to load external resources into your jobs. Nosana supports several resource types:

- **[HuggingFace Resources](./huggingface.md)** - Download models and datasets from HuggingFace
- **[S3 Resources](./s3.md)** - Load files from S3-compatible storage (AWS S3, Cloudflare R2, MinIO, etc.)
- **[Cached Resources](./cached-resources.md)** - Understand how resources are cached and what's available per market

For jobs that require sensitive credentials, see **[Confidential Jobs](./confidential.md)**.

## Basic Resource Properties

Resources in a job definition have the following common properties:

- `type` - The type of the resource. This can either be `HF` or `S3`
- `target` - The path within the container where the resources will be downloaded to

For HuggingFace resources, you also need:
- `repo` - The name of the repo you want to download, `<username>/<repo-name>`

For S3 resources, you also need:
- `url` - The HTTPS link to the object or folder prefix
- `bucket` (optional) - Bucket name for some providers
- `IAM` (optional) - Credentials for private buckets
- `files` (optional) - Array of specific files to download

Here is a basic example:

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

## Learn More

For detailed information about each resource type, see:

- **[HuggingFace Resources](./huggingface.md)** - Complete guide to loading HuggingFace models
- **[S3 Resources](./s3.md)** - Comprehensive guide to S3-compatible storage with examples
- **[Cached Resources](./cached-resources.md)** - Understanding resource caching and required resources per market

