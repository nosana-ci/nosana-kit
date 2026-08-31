# Job definition

The JSON describing what runs in the container. Passed as `job_definition` on
create, or pinned to IPFS for one-shot jobs.

## Shape

```json
{
  "version": "0.1",
  "type": "container",
  "meta": { "trigger": "api", "system_resources": { "required_vram": 24 } },
  "global": { "image": "ubuntu", "gpu": true, "env": { "KEY": "value" } },
  "ops": [
    {
      "type": "container/run",
      "id": "server",
      "args": { "image": "nginx", "cmd": [], "expose": 80, "gpu": true }
    }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `version` | ✅ | `"0.1"` |
| `type` | ✅ | `"container"` |
| `ops` | ✅ | Ordered operations. `id` must be unique across the array |
| `meta` | ❌ | `trigger` (any string), `system_resources` (e.g. `required_vram` in GB) — see the caveat below |
| `global` | ❌ | Defaults for all ops: `image`, `gpu`, `entrypoint`, `env`, `work_dir` |

### `meta` resource hints are advisory

`meta.system_resources` (the field declared on `Meta` and in the OpenAPI
schemas) and `meta.system_requirements` (what the docs, examples and tests use,
accepted through `Meta`'s index signature) both serve the same purpose: they
*indicate* what a workload needs — e.g. an LLM that won't fit under a given
VRAM — so a template isn't offered where it can't run.

Neither is a scheduling constraint. Nothing rejects a job for declaring more
VRAM than the market provides. **Choosing the right market is what actually
determines the hardware**; treat these fields as documentation for humans and
template UIs.

Prefer `system_resources`, since that is the declared field.

## Operations

`type` is `container/run` or `container/create-volume`. `container/run` args:

| Arg | Type | Notes |
|---|---|---|
| `image` | `string` | Required. Prefer a fully qualified ref: `docker.io/org/image:tag` |
| `cmd` | `string \| string[]` | See below |
| `entrypoint` | `string \| string[]` | Overrides the image entrypoint |
| `gpu` | `boolean` | Request GPU access |
| `expose` | `number \| ExposedPort[]` | Ports to publish — see endpoints.md |
| `env` | `object` | Environment variables |
| `work_dir` | `string` | Working directory |
| `resources` | `Resource[]` | HF/S3 mounts — see resources.md |
| `authentication` | `{ docker: DockerAuth }` | Private registry credentials |
| `private` | `boolean` | Suppress public endpoint exposure |
| `results` | `object` | Regexes that extract values from logs |

### `cmd` — the two forms

**String form** — the whole command in one element, interpreted by bash:
```json
"cmd": "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app"
```

**Array form** — each token separate, and you pick the shell:
```json
"cmd": ["/bin/sh", "-c", "ollama serve & sleep 5 && ollama pull $MODEL && tail -f /dev/null"]
```

With the array form you almost always need `-c` after the shell. Mixing the two
— an array whose first element is a full command line with spaces — is the most
common authoring mistake.

The container must **stay alive**. A command that returns ends the job. For a
background service, finish with `tail -f /dev/null` or `wait -n`.

## Validation

Validate before you spend anything. The validator is strict: unknown keys are
rejected, not ignored, and duplicate op `id`s are errors.

```ts
import { validateJobDefinition } from '@nosana/kit';

const result = validateJobDefinition(input);
if (result.success) {
  result.data;   // typed JobDefinition
} else {
  result.errors; // [{ path, expected, value }]
}
```

`path` looks like `$input.ops[0].args.image`. For non-TypeScript validation, the
same schema ships as OpenAPI 3.0 JSON Schema via `import { jobSchemas } from '@nosana/kit'`.

## Results extraction

An op can pull values out of its own logs, keyed by name:

```json
"results": {
  "gpu": { "regex": "Device [0-9].*", "logType": ["stderr"] },
  "any-device": "Device [0-9].*"
}
```

Extracted values land in `opState.results` and can be referenced by later ops.

## Literal interpolation

Any string inside `args` may reference runtime values via `%%…%%`. Interpolation
happens when the op is hydrated, just before scheduling; unresolved literals
throw.

| Literal | Resolves to |
|---|---|
| `%%globals.job%%` | Job ID |
| `%%globals.host%%` | Host ID |
| `%%globals.project%%` | Project ID |
| `%%ops.OP_ID.host%%` | Another op's container hostname |
| `%%ops.OP_ID.endpoint.PORT%%` | Another op's endpoint for a port |
| `%%ops.OP_ID.deployment_endpoint%%` | Another op's deployment endpoint |
| `%%ops.OP_ID.results.KEY%%` | A value extracted by that op's `results` |

A literal only resolves if the producing op is in the same group and has
completed — list it in `depends_on`.

Operators: `__spread__` (spread an array/object into existing values),
`__remove-if-empty__` (drop the property when empty), `__pairs__` (turn
`{key,value}[]` into object properties).

```json
"image": "%%ops.resolver.results.image%%",
"cmd": ["run", "%%ops.seed.results.task_id%%"]
```

## Worked examples

**GPU inference service (Ollama):**
```json
{
  "version": "0.1",
  "type": "container",
  "ops": [{
    "type": "container/run",
    "id": "ollama",
    "args": {
      "image": "docker.io/ollama/ollama:0.6.6",
      "entrypoint": ["/bin/sh"],
      "cmd": ["-c", "ollama serve & sleep 5 && ollama pull $MODEL && tail -f /dev/null"],
      "env": { "MODEL": "gemma3:4b-it-qat" },
      "gpu": true,
      "expose": 11434
    }
  }],
  "meta": { "trigger": "api", "system_resources": { "required_vram": 8 } }
}
```

**Batch job (runs, prints, exits):**
```json
{
  "version": "0.1",
  "type": "container",
  "meta": { "trigger": "api" },
  "ops": [{
    "type": "container/run",
    "id": "train",
    "args": { "image": "ubuntu", "cmd": "echo hello && nvidia-smi", "gpu": true }
  }]
}
```
