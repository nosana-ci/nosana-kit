# Resources

Getting models, datasets and files into a container without baking them into the
image. Declared per op under `args.resources`.

Hosts cache resources, so a cached model is dramatically faster to start than one
downloaded at runtime — usually the single biggest lever on startup time.

## HuggingFace

```json
"resources": [
  { "type": "HF", "repo": "TinyLlama/TinyLlama-1.1B-Chat-v1.0", "target": "/data-models/" }
]
```

| Field | Notes |
|---|---|
| `type` | `"HF"` |
| `repo` | `<username>/<repo-name>` |
| `target` | Mount path inside the container |

## S3-compatible

Works with AWS S3, Cloudflare R2, MinIO, and any S3-compatible endpoint.

```json
"resources": [
  {
    "type": "S3",
    "url": "https://storage.example.com/models",
    "target": "/data/",
    "files": ["model.bin"],
    "IAM": { "ACCESS_KEY_ID": "…", "SECRET_ACCESS_KEY": "…" }
  }
]
```

| Field | Notes |
|---|---|
| `url` | HTTPS link to the object or folder prefix |
| `target` | Mount path |
| `bucket` | Required by some providers |
| `files` | Restrict to specific files; omit to take the whole prefix |
| `IAM` | Only for private buckets |

Public buckets need no `IAM`. Nosana's own model mirror is public, e.g.
`https://models.nosana.io/…`.

## Cached resources per market

`market.required_images` and `market.required_remote_resources` list what hosts
in that market already hold. Matching your image or model against them removes a
download from the critical path:

```ts
const m = await client.api.markets.get(marketAddress);
m.required_images;            // pre-pulled docker images
m.required_remote_resources;  // pre-fetched S3/HF resources
```

Network-wide catalogues: `markets.getDockerImages()`, `markets.getRemoteResources()`.

## Private registries

```json
"authentication": {
  "docker": { "username": "user", "password": "pass", "server": "registry.example.com" }
}
```

`email` and `server` are optional; omit `server` for Docker Hub.

## Dynamic resources

Resource fields accept literals, so an earlier op can decide what to fetch:

```json
"resources": [
  { "type": "S3", "url": "s3://nos-ai-models/%%ops.model-finder.results.bucket_path%%",
    "target": "/root/.ollama/models" }
]
```

See job-definition.md for literal syntax.

## Credentials

Anything in a job definition is visible to the host running it. For real secrets
use `confidential: true` on the deployment, which runs the workload in a
confidential-compute market (e.g. `nvidia-pro-6000-cc`, `nvidia-4090-sev-tee`).
Otherwise scope credentials tightly — read-only, single-bucket, short-lived.
