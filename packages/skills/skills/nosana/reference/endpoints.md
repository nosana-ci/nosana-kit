# Endpoints

Reaching a service running on Nosana.

## Getting the URL

The deployment already has it:

```ts
const d = await client.api.deployments.get(id);
d.endpoints; // [{ opId: 'server', port: 80, url: 'https://…', online: true }]
```

One entry per exposed port per op, populated **as soon as the deployment is
created** — before a job is scheduled, before the image is pulled. The URL is
derived from the job definition, so its presence says nothing; `online` is what
says whether it serves. Do not compute the URL yourself — older docs and CLI
output make it look like you must derive a hash, and you don't.

URLs are `https://<44-char-base58-hash>.node.k8s.prd.nos.ci` on mainnet. The hash
is `base58(nacl.hash("<opIndex>:<port>:<jobId>"))[0..44]`; `@nosana/endpoints`
exports `getJobExposedServices(jobDefinition, jobId)` and `getExposeIdHash()` if
you ever need it offline. TLS terminates at the gateway.

## Exposing a port

```json
{ "type": "container/run", "id": "server", "args": { "image": "nginx", "expose": 80 } }
```

`expose` accepts a number, an array of numbers, or an array of objects:

```json
"expose": 8080
"expose": [8000, 9000]
"expose": [{ "port": 80, "health_checks": [ /* see Health checks below */ ] }]
```

Your process must bind `0.0.0.0`, not `127.0.0.1`, or the gateway cannot reach it.

## Health checks

Per port, multiple allowed. The gateway uses them to decide when the service is
ready and whether it stays up.

```json
"expose": [{
  "port": 80,
  "health_checks": [
    {
      "type": "http",
      "path": "/health",
      "method": "GET",
      "expected_status": 200,
      "continuous": true
    }
  ]
}]
```

The `continuous` **field** is required — validation rejects a health check
without it, and the published docs omit it. Its **value** is your choice:
`false` probes only until the service first comes up, `true` keeps probing for
the life of the service.

| Type | Required fields |
|---|---|
| `http` | `type`, `path`, `method` (`GET`/`POST`/`PUT`/`DELETE`), `expected_status`, `continuous`. Optional: `headers`, `body` |
| `websocket` | `type`, `expected_response`, `continuous` |

Add one for anything slow to boot — without it, the endpoint is published
immediately and returns errors while your process is still starting, which is
indistinguishable from a broken deployment.

## Readiness

`online` is the readiness signal. It becomes true when the node's tunnel
registers with the gateway, and **when the op declares an http health check the
tunnel only registers once that check passes** — frpc starts such a proxy marked
unhealthy and withholds it until the first successful probe. So with a health
check declared, `online: true` means the service replied; without one it means
only that the port was reachable.

Read it, don't measure it:

```ts
const d = await client.api.deployments.get(id);
const ready = d.endpoints.every((e) => e.online);
```

Or wait on it without polling at all:

```ts
await new Promise<void>((resolve, reject) => {
  const sub = deployment.stream({
    onEndpoint: (e) => { if (e.online) { sub.close(); resolve(); } },
    onDeployment: (e) => {
      // Nothing will come online from here.
      if (['ERROR', 'STOPPED', 'INSUFFICIENT_FUNDS'].includes(e.status)) {
        sub.close();
        reject(new Error(`deployment entered ${e.status}`));
      }
    },
  });
});
```

Give it minutes: a bare `nginx` took 21s, 35s, 80s and 216s across four runs of the
same definition, and an image that pulls a model takes longer. `active_jobs > 0`
with `online: false` is the normal in-between state, not a failure — see the
`starting` derivation in SKILL.md.

## Private services

Set `private: true` alongside `expose` to suppress public exposure. The
deployment then reports a single `private` marker instead of URLs, and the
service is reachable only from inside the job.

## Multiple services

**One container, several ports** — bundle processes and expose an array. The
wrapper script must not exit:

```bash
#!/usr/bin/env bash
set -euo pipefail
vllm serve model --port 9000 &
OPENAI_API_BASE_URL=http://127.0.0.1:9000/v1 open-webui serve --port 8000 &
wait -n          # required: blocks until a child exits
exit $?
```

`wait -n` is not optional — without it the shell exits, Docker stops the
container, and the still-healthy service dies with it.

**Several ops** — separate containers, each with its own `expose`, wired together
with `%%ops.OP_ID.host%%` or `%%ops.OP_ID.endpoint.PORT%%`. Prefer this when the
services scale or fail independently; prefer one container when they must share
a GPU.

## Calling the service

```bash
curl -X POST https://<hash>.node.k8s.prd.nos.ci/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma3:4b-it-qat","stream":false,"prompt":"What is water made of?"}'
```

The endpoint lives as long as the deployment runs. When it stops, the URL dies.
