# LMDeploy

Create an Open-AI API endpoint using LMDeploy engine and cached resources on the Nosana network.

To view each markets cached resources you can use the Nosana CLI

```
// To list all markets
nosana market list

// Retrive market required resources
nosana market get 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf
```

### Llama3.1 70B 4x

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "cli"
  },
  "ops": [
    {
      "type": "container/run",
      "id": "lmdeploy-llama3.1-turbomind",
      "args": {
        "cmd": [
          "lmdeploy",
          "serve",
          "api_server",
          "../../root/models/snapshots/2123003760781134cfc31124aa6560a45b491fdf",
          "--model-name",
          "llama3.1",
          "--chat-template",
          "../../root/templates/chat_template.json",
          "--model-format",
          "awq"
        ],
        "image": "docker.io/openmmlab/lmdeploy:v0.5.3-cu12",
        "gpu": true,
        "expose": 23333,
        "resources": [
          {
            "type": "S3",
            "url": "https://models.nosana.io/hugging-face/llama3.1/70b/4x/models--hugging-quants--Meta-Llama-3.1-70B-Instruct-AWQ-INT4",
            "target": "/root/models/"
          },
          {
            "type": "S3",
            "url": "https://models.nosana.io/templates/lmdeploy/chat",
            "target": "/root/templates/"
          }
        ]
      }
    }
  ]
}
```

### Post to the A100 market

```
nosana job post --market GLJHzqRN9fKGBsvsFzmGnaQGknUtLN1dqaFR8n3YdM22 --file lmdeploy-70b.json
```

### Llama3.1 8B

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "cli"
  },
  "ops": [
    {
      "type": "container/run",
      "id": "lmdeploy-llama3.1-turbomind",
      "args": {
        "cmd": [
          "lmdeploy",
          "serve",
          "api_server",
          "../../root/models/snapshots/069adfb3ab0ceba60b9af8f11fa51558b9f9d396",
          "--model-name",
          "llama3.1",
          "--chat-template",
          "../../root/templates/chat_template.json"
        ],
        "image": "docker.io/openmmlab/lmdeploy:v0.5.3-cu12",
        "gpu": true,
        "expose": 23333,
        "resources": [
          {
            "type": "S3",
            "url": "https://models.nosana.io/hugging-face/llama3.1/8b/models--unsloth--Meta-Llama-3.1-8B",
            "target": "/root/models/"
          },
          {
            "type": "S3",
            "url": "https://models.nosana.io/templates/lmdeploy/chat",
            "target": "/root/templates/"
          }
        ]
      }
    }
  ]
}
```

### Post to the 4090 market

```
nosana job post --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf --file lmdeploy-8b.json
```

### Llama3.1 8B AWQ 4

```json
{
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "cli"
  },
  "ops": [
    {
      "type": "container/run",
      "id": "lmdeploy-llama3.1-turbomind",
      "args": {
        "cmd": [
          "lmdeploy",
          "serve",
          "api_server",
          "../../root/models/snapshots/db1f81ad4b8c7e39777509fac66c652eb0a52f91",
          "--model-name",
          "llama3.1",
          "--chat-template",
          "../../root/templates/chat_template.json",
          "--model-format",
          "awq"
        ],
        "image": "docker.io/openmmlab/lmdeploy:v0.5.3-cu12",
        "gpu": true,
        "expose": 23333,
        "resources": [
          {
            "type": "S3",
            "url": "https://models.nosana.io/hugging-face/llama3.1/8b/4x/models--hugging-quants--Meta-Llama-3.1-8B-Instruct-AWQ-INT4",
            "target": "/root/models/"
          },
          {
            "type": "S3",
            "url": "https://models.nosana.io/templates/lmdeploy/chat",
            "target": "/root/templates/"
          }
        ]
      }
    }
  ]
}
```

### Post to the 4070 market

```
nosana job post --market EzuHhkrhmV98HWzREsgLenKj2iHdJgrKmzfL8psP8Aso --file lmdeploy-8b-4x.json
```
