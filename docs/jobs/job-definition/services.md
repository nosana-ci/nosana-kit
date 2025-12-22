---
title: Services
---

A **service** is any long‑running process that listens on a network port and responds to requests.

## Single Service

To run a single service on Nosana, define a `container/run` operation with the `expose` argument specifying which port(s) to expose:

```json
{
  "version": "0.1",
  "type": "container",
  "ops": [
    {
      "type": "container/run",
      "id": "my-service",
      "args": {
        "image": "nginx:latest",
        "expose": 80
      }
    }
  ]
}
```

The `expose` argument accepts either a single port number or an array of ports:

```json
"expose": 8080
```

```json
"expose": [8000, 9000]
```

## Multiple Services

Most Docker tutorials preach **one process per container**—and that _is_ the general best‑practice. But there are legitimate reasons to bundle services: co‑locating GPU workloads, avoiding cross‑container latency, or keeping costs and deployment complexity low.

Modern applications usually orchestrate several such services working together.

Nosana supports two approaches for running multiple services:

| Approach | Description | Best For |
|----------|-------------|----------|
| **Multi-Service Container** | Bundle services into a single container image | Shared resources (GPU/memory), minimal latency |
| **Multi-Operations** | Run separate operations in parallel | Independent scaling, fault isolation |

See Docker's [_Run multiple processes in a container_](https://docs.docker.com/engine/containers/multi-service_container/) guide for alternative supervisors.

### Multi-Service Container

**Building Your Own Image**

To create a multi-service container, you'll need:

1. **A Dockerfile** that installs your services and exposes ports
2. **A wrapper script** (e.g., `start.sh`) that starts all services and keeps the container alive

Here's an example Dockerfile for running vLLM and Open-WebUI together:

```Dockerfile
FROM ghcr.io/astral-sh/uv:debian

ENV PATH="$PATH:/root/.local/bin"

# Create & activate virtual‑env
RUN uv venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python deps
RUN uv pip install open-webui jupyterlab

EXPOSE 8000 9000

# Wrapper script starts both services
COPY start.sh /start.sh
RUN chmod +x /start.sh
ENTRYPOINT ["/start.sh"]
```

And a wrapper script (`start.sh`) that keeps both services running:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Start the LLM server (background)
vllm serve deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B \
  --served-model-name R1-Qwen-1.5B \
  --port 9000 &

# Start WebUI and point it at the local LLM endpoint (background)
OPENAI_API_BASE_URL=http://127.0.0.1:9000/v1 open-webui serve --port 8000 &

# Wait for the *first* child to exit and mirror its status
wait -n
exit $?
```

:::warning
`wait -n` **is required**, it blocks until either child process exits, preventing Docker from killing your still‑running service. `exit $?` forwards the failing service's status code.
:::

**Job Definition**

When exposing multiple ports from a single container, use an array:

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "dashboard",
    "system_requirements": {
      "required_vram": 6
    }
  },
  "ops": [
    {
      "type": "container/run",
      "id": "multi-service",
      "args": {
        "image": "docker.io/username/multi-service:latest",
        "gpu": true,
        "expose": [8000, 9000]
      }
    }
  ]
}
```

### Multi-Operations

Run multiple separate operations that execute in parallel with dependency control. Operations communicate via container networking using their operation ID as hostname.

**Execution Groups and Dependencies**

Operations are organized using the `execution` block:

```json
"execution": {
  "group": "string",
  "depends_on": ["op-id-1", "op-id-2"]
}
```

| Field | Description |
|-------|-------------|
| `group` | Execution stage name. The manager runs one stage at a time, but operations within a stage run in parallel |
| `depends_on` | List of operation IDs this operation must wait for before starting |

**Inter-Service Communication**

Operations reference each other by their operation ID. For example, if `vllm-server` exposes port 9000, another operation can reach it at `http://vllm-server:9000`:

```json
{
  "type": "container/run",
  "id": "open-webui",
  "args": {
    "image": "ghcr.io/open-webui/open-webui:main",
    "env": {
      "OPENAI_API_BASE_URL": "http://vllm-server:9000/v1"
    },
    "expose": [8080]
  },
  "execution": {
    "group": "inference",
    "depends_on": ["vllm-server"]
  }
}
```

**Health Checks**

Use health checks to ensure dependent services are ready before starting:

```json
{
  "type": "container/run",
  "id": "vllm-server",
  "args": {
    "image": "vllm/vllm-openai:latest",
    "cmd": ["--model", "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B", "--port", "9000"],
    "gpu": true,
    "expose": [
      {
        "port": 9000,
        "health_checks": [
          {
            "type": "http",
            "path": "/v1/models",
            "method": "GET",
            "expected_status": 200,
            "continuous": true
          }
        ]
      }
    ]
  },
  "execution": {
    "group": "inference"
  }
}
```

## Operation States

Operations progress through the following states:

`pending` → `running` → `completed` | `failed`

## Controlling Operations

Control running operations via the Node API:

| Action | Endpoint |
|--------|----------|
| Check operation status | `GET /job/{{job}}/ops` |
| Stop operation | `POST /job/{{job}}/group/{{group}}/operation/{{opid}}/stop` |
| Restart operation | `POST /job/{{job}}/group/{{group}}/operation/{{opid}}/restart` |
| Stop group | `POST /job/{{job}}/group/{{group}}/stop` |
| Restart group | `POST /job/{{job}}/group/{{group}}/restart` |

Base URL: `https://{{node}}.node.k8s.prd.nos.ci`

## Examples

### vLLM + Open-WebUI (Multi-Service Container)

A wrapper script that runs vLLM and Open-WebUI in a single container:

**start.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

vllm serve deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B \
  --served-model-name R1-Qwen-1.5B \
  --port 9000 &

OPENAI_API_BASE_URL=http://127.0.0.1:9000/v1 open-webui serve --port 8000 &

wait -n
exit $?
```

**Job Definition**

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "dashboard",
    "system_requirements": {
      "required_vram": 6
    }
  },
  "ops": [
    {
      "type": "container/run",
      "id": "webui-deepseek",
      "args": {
        "image": "docker.io/username/vllm-openwebui:latest",
        "gpu": true,
        "expose": [8000, 9000]
      }
    }
  ]
}
```

### vLLM + Open-WebUI (Multi-Operations)

The same setup using separate operations with dependency control:

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "dashboard",
    "system_requirements": {
      "required_vram": 6
    }
  },
  "ops": [
    {
      "type": "container/run",
      "id": "vllm-server",
      "args": {
        "image": "vllm/vllm-openai:latest",
        "cmd": [
          "--model", "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
          "--served-model-name", "R1-Qwen-1.5B",
          "--port", "9000"
        ],
        "gpu": true,
        "expose": [
          {
            "port": 9000,
            "health_checks": [
              {
                "type": "http",
                "path": "/v1/models",
                "method": "GET",
                "expected_status": 200,
                "continuous": true
              }
            ]
          }
        ]
      },
      "execution": {
        "group": "inference"
      }
    },
    {
      "type": "container/run",
      "id": "open-webui",
      "args": {
        "image": "ghcr.io/open-webui/open-webui:main",
        "env": {
          "OPENAI_API_BASE_URL": "http://vllm-server:9000/v1"
        },
        "expose": [8080]
      },
      "execution": {
        "group": "inference",
        "depends_on": ["vllm-server"]
      }
    }
  ]
}
```

### Multi-Stage Pipeline

A two-stage deployment with infrastructure services starting before application services:

```json
{
  "version": "0.1",
  "type": "container",
  "ops": [
    {
      "type": "container/run",
      "id": "database",
      "args": {
        "image": "postgres:15",
        "env": { "POSTGRES_DB": "app" },
        "expose": [5432]
      },
      "execution": {
        "group": "infrastructure"
      }
    },
    {
      "type": "container/run",
      "id": "redis",
      "args": {
        "image": "redis:7",
        "expose": [6379]
      },
      "execution": {
        "group": "infrastructure"
      }
    },
    {
      "type": "container/run",
      "id": "api-server",
      "args": {
        "image": "myapp/api:latest",
        "env": {
          "DATABASE_URL": "postgres://database:5432/app",
          "REDIS_URL": "redis://redis:6379"
        },
        "expose": [3000]
      },
      "execution": {
        "group": "application"
      }
    },
    {
      "type": "container/run",
      "id": "web-frontend",
      "args": {
        "image": "myapp/frontend:latest",
        "env": {
          "API_URL": "http://api-server:3000"
        },
        "expose": [80]
      },
      "execution": {
        "group": "application"
      }
    }
  ]
}
```

Execution flow:
1. **Infrastructure stage**: `database` and `redis` start in parallel
2. **Application stage**: `api-server` and `web-frontend` start after infrastructure completes

## When to Choose Which Approach

| Factor | Multi-Service Container | Multi-Operations |
|--------|------------------------|------------------|
| **Resource Sharing** | ✅ Shared GPU/memory | ❌ Separate resources |
| **Network Latency** | ✅ Localhost communication | ⚠️ Container-to-container |
| **Fault Isolation** | ❌ One failure stops all | ✅ Independent failures |
| **Complexity** | ✅ Simple single image | ⚠️ More orchestration |
| **Development** | ⚠️ Rebuild for any change | ✅ Update services independently |
| **Monitoring** | ⚠️ Combined logs/metrics | ✅ Per-service observability |

**Choose Multi-Service when**:
- Services are tightly coupled (e.g., model + UI)
- You need maximum performance (shared GPU/memory)
- Simple deployment is priority

**Choose Multi-Operations when**:
- Services can run independently  
- You need complex orchestration
- Better fault tolerance needed

## Troubleshooting

| Symptom                   | Likely Cause                                 | Fix                                                        |
| ------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Container exits instantly | `start.sh` finished before services started  | Ensure `wait -n` is the last foreground command            |
| Port already in use       | Host or other process bound to `8000`/`9000` | Change ports in `EXPOSE`, `start.sh`, and job spec         |
| GPU unavailable           | `"gpu": true` omitted or market mismatch     | Use a GPU market (e.g., `nvidia-3090`) and set `gpu: true` |

## Next Steps

**For Multi-Service Containers**:
- Swap in your own model weights: change the `vllm serve …` line.
- Add more services—update `start.sh` and `EXPOSE` as needed.

**For Multi-Operations**:
- Experiment with different execution groups and dependencies
- Add health checks to ensure proper startup ordering
- Use the Node API to monitor and control your operations

