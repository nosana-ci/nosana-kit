---
title: Schema
---

# Job Definition Schema

Nosana job definitions outline how tasks execute on Nosana's decentralized GPU network. Jobs are defined via structured JSON objects detailing commands, images, environment, resources, and container configurations.

## Field Definitions

### 🔹 **Top-Level Fields**

| Field     | Type            | Required? | Description                                       |
| --------- | --------------- | --------- | ------------------------------------------------- |
| `version` | `string`        | ✅        | Job definition schema version (currently `"0.1"`) |
| `type`    | `"container"`   | ✅        | Specifies the execution type                      |
| `meta`    | `object`        | ❌        | Job metadata like trigger type and resources      |
| `global`  | `object`        | ❌        | Defaults applied globally across all operations   |
| `ops`     | `Ops` (`Array`) | ✅        | Ordered operations/tasks for execution            |

---

### 🔹 **Meta**

Specifies execution triggers and system resources:

```json
"meta": {
  "trigger": "api",
  "system_resources": { "required_vram": 18 }
}
```

| Field              | Type                             | Description                               |
| ------------------ | -------------------------------- | ----------------------------------------- |
| `trigger`          | `"cli"` or `"dashboard"`         | Job origin trigger type                   |
| `system_resources` | `Record<string, string\|number>` | System-level constraints (e.g., GPU VRAM) |

---

### 🔹 **Global Defaults**

Defaults applied across all operations unless explicitly overridden:

```json
"global": {
  "image": "ubuntu",
  "gpu": true,
  "entrypoint": "/bin/bash",
  "env": { "KEY": "value" },
  "work_dir": "/workspace"
}
```

| Field        | Type                 | Description                   |
| ------------ | -------------------- | ----------------------------- |
| `image`      | `string`             | Default Docker image          |
| `gpu`        | `boolean`            | Default GPU requirement       |
| `entrypoint` | `string \| string[]` | Default Docker entrypoint     |
| `env`        | `object`             | Default environment variables |
| `work_dir`   | `string`             | Default working directory     |

---

### 🔹 **Operations (`ops`)**

Defines tasks within the job:

```json
"ops": [{
  "id": "unique-id",
  "type": "container/run",
  "args": {
    "cmd": ["command", "arg1"],
    "resources": [],
    "authentication": {}
  }
}]
```

| Field  | Required? | Description                                      |
| ------ | --------- | ------------------------------------------------ |
| `id`   | ✅        | Unique identifier per operation                  |
| `type` | ✅        | `"container/run"` or `"container/create-volume"` |
| `args` | ✅        | Operation-specific arguments                     |

---

### 🔹 **Operation Args**

`container/run` type arguments:

| Field            | Type                      | Required? | Description                                                         |
| ---------------- | ------------------------- | --------- | ------------------------------------------------------------------- |
| `image`          | `string`                  | ✅        | Docker image, It is recommended to put the URL to the Docker Image. |
| `cmd`            | `string \| string[]`      | ❌        | Commands to execute                                                 |
| `gpu`            | `boolean`                 | ❌        | GPU requirement                                                     |
| `expose`         | `number \| ExposedPort[]` | ❌        | Ports exposed                                                       |
| `resources`      | `Resource[]`              | ❌        | External data sources                                               |
| `authentication` | `{docker: DockerAuth}`    | ❌        | Docker registry authentication                                      |

#### cmd

The `cmd` array is important to illustrate, because there are is nuance in how to use it.
If you are familiar with how to use the `cmd` property in Docker, you should already have an idea of how this property works.

##### String based CMD

When the first element of the array is the whole command, such as:
`"gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app"`
Bash will be used as the shell to interpret this command.

##### Array based CMD

Another option is to put each command and every flag as it's own element in an array:
`["/bin/sh", "-c", gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app"]`

With the array based notation, we are able to specify the shell we want to use.
Note that most often you will need to append `-c` flag after `/bin/sh`

You can read more about how to use the `cmd` property by going to the [Docker Documentation](https://docs.docker.com/reference/dockerfile/#cmd).

---

### 🔹 **Resources**

External sources loaded into the container:

**S3 resource example:**

```json
{
  "type": "S3",
  "url": "https://storage.example.com/models",
  "target": "/data/",
  "files": ["model.bin"],
  "IAM": {
    "ACCESS_KEY_ID": "key",
    "SECRET_ACCESS_KEY": "secret"
  }
}
```

**Hugging Face resource example:**


```json
{
  "type": "HF",
  "repo": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
  "target": "/data-models/"
}
```

You can read more about how resources at [Resources](./resources.md)

---

### 🔹 **Docker Authentication**

Authenticate to private Docker registries:

```json
"authentication": {
  "docker": {
    "username": "user",
    "password": "pass",
    "email": "optional",
    "server": "optional registry URL"
  }
}
```

## Example

Here is a simple example Job Definition of an Pytorch Jupyter Notebook:

```json
{
  "version": "0.1",
  "type": "container",
  "ops": [
    {
      "type": "container/run",
      "id": "Pytorch",
      "args": {
        "image": "docker.io/nosana/pytorch-jupyter:2.0.0",
        "cmd": [
          "jupyter",
          "lab",
          "--ip=0.0.0.0",
          "--port=8888",
          "--no-browser",
          "--allow-root",
          "--ServerApp.token=''",
          "--ServerApp.password=''"
        ],
        "expose": 8888,
        "gpu": true
      }
    }
  ],
  "meta": {
    "trigger": "deployment-manager",
    "system_requirements": {
      "required_vram": 4
    }
  }
}
```


## Validating a Job Definition

The SDK exports a strict validator (`validateJobDefinition`) plus JSON Schemas (`jobSchemas`) so you can check a job definition against this schema before posting it. See [Validation](./validation.md).
