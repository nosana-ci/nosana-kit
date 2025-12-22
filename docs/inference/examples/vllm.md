# VLLM

Create an Open-AI API endpoint using VLLM engine and cached resources on the Nosana network.

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
      "id": "VLLM-llama3.1",
      "args": {
        "cmd": [
          "--model",
          "/root/.cache/huggingface/hub/models--hugging-quants--Meta-Llama-3.1-8B-Instruct-AWQ-INT4/snapshots/2123003760781134cfc31124aa6560a45b491fdf",
          "--served-model-name",
          "llama3.1",
          "--quantization",
          "awq",
          "--max-model-len",
          "2176"
        ],
        "image": "docker.io/vllm/vllm-openai:v0.5.4",
        "gpu": true,
        "expose": 8000,
        "resources": [
          {
            "type": "S3",
            "url": "https://models.nosana.io/hugging-face/llama3.1/70b/4x/models--hugging-quants--Meta-Llama-3.1-70B-Instruct-AWQ-INT4",
            "target": "/root/.cache/huggingface/hub/models--hugging-quants--Meta-Llama-3.1-70B-Instruct-AWQ-INT4"
          }
        ]
      }
    }
  ]
}
```

### Post to the A100 market

```
nosana job post --market GLJHzqRN9fKGBsvsFzmGnaQGknUtLN1dqaFR8n3YdM22 --file vllm-70b.json
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
      "id": "VLLM-llama3.1",
      "args": {
        "cmd": [
          "--model",
          "/root/.cache/huggingface/hub/models--hugging-quants--Meta-Llama-3.1-8B-Instruct-AWQ-INT4/snapshots/069adfb3ab0ceba60b9af8f11fa51558b9f9d396",
          "--served-model-name",
          "llama3.1",
          "--quantization",
          "awq",
          "--max-model-len",
          "2176"
        ],
        "image": "docker.io/vllm/vllm-openai:v0.5.4",
        "gpu": true,
        "expose": 8000,
        "resources": [
          {
            "type": "S3",
            "url": "https://models.nosana.io/hugging-face/llama3.1/8b/models--unsloth--Meta-Llama-3.1-8B",
            "target": "/root/.cache/huggingface/hub/models--unsloth--Meta-Llama-3.1-8B"
          }
        ]
      }
    }
  ]
}
```

### Post to the 4090 market

```
nosana job post --market 97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf --file vllm-8b.json
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
      "id": "VLLM-llama3.1",
      "args": {
        "cmd": [
          "--model",
          "/root/.cache/huggingface/hub/models--hugging-quants--Meta-Llama-3.1-8B-Instruct-AWQ-INT4/snapshots/db1f81ad4b8c7e39777509fac66c652eb0a52f91",
          "--served-model-name",
          "llama3.1",
          "--quantization",
          "awq",
          "--max-model-len",
          "2176"
        ],
        "image": "docker.io/vllm/vllm-openai:v0.5.4",
        "gpu": true,
        "expose": 8000,
        "resources": [
          {
            "type": "S3",
            "url": "https://models.nosana.io/hugging-face/llama3.1/8b/4x/models--hugging-quants--Meta-Llama-3.1-8B-Instruct-AWQ-INT4",
            "target": "/root/.cache/huggingface/hub/models--hugging-quants--Meta-Llama-3.1-8B-Instruct-AWQ-INT4"
          }
        ]
      }
    }
  ]
}
```

### Post to the 4070 market

```
nosana job post --market EzuHhkrhmV98HWzREsgLenKj2iHdJgrKmzfL8psP8Aso --file vllm-8b-4x.json
```
