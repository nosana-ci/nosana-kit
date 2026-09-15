---
title: LLM Inference
---

# LLM Inference API

Run open models on Nosana GPUs with the API key you already have. The API is
OpenAI-compatible, so an existing client works once you change the base URL and the key.

| | |
|---|---|
| Base URL | `https://inference.nosana.com/v1` |
| Authentication | `Authorization: Bearer nos_...` — the same key you use for deployments |
| Billing | Per token, against your credits |

## List models

A model appears here only while a GPU is actually serving it, so this is the list you can
call right now.

:::tabs

== HTTP API

```bash
curl https://inference.nosana.com/v1/models \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "<model-id>",
      "object": "model",
      "created": 1789399587,
      "owned_by": "nosana",
      "name": "…",
      "description": "…",
      "context_length": 16384,
      "max_output_tokens": 4096,
      "pricing": { "prompt": "0.000000100", "completion": "0.000000300" },
      "available": true
    }
  ]
}
```

:::

`pricing` is in dollars per token. Multiply by a million for the usual per-million figure:
the values above are $0.10 per million prompt tokens and $0.30 per million completion
tokens.

Which models are served changes over time, so read the id from this list rather than
hardcoding one. The examples below use `<model-id>` for whichever you pick.

## Chat completions

:::tabs

== Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://inference.nosana.com/v1",
    api_key="nos_xxx_your_api_key",
)

MODEL = next(m.id for m in client.models.list().data)

reply = client.chat.completions.create(
    model=MODEL,
    messages=[{"role": "user", "content": "Say OK"}],
)

print(reply.choices[0].message.content)
print(reply.usage)
```

== TypeScript

```ts
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://inference.nosana.com/v1',
  apiKey: process.env.NOSANA_API_KEY,
});

const [first] = (await client.models.list()).data;

const reply = await client.chat.completions.create({
  model: first.id,
  messages: [{ role: 'user', content: 'Say OK' }],
});

console.log(reply.choices[0].message.content);
```

== HTTP API

```bash
curl https://inference.nosana.com/v1/chat/completions \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-id>",
    "messages": [{ "role": "user", "content": "Say OK" }]
  }'
```

:::

`/v1/completions` works the same way for the older text-completion shape.

## Streaming

Set `stream: true` for server-sent events. Ask for `stream_options.include_usage` and the
final frame carries the token counts, which is what you are billed on.

```bash
curl https://inference.nosana.com/v1/chat/completions \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model-id>",
    "messages": [{ "role": "user", "content": "Count to three" }],
    "stream": true,
    "stream_options": { "include_usage": true }
  }'
```

## Reasoning models

Some models think before answering. The thinking is returned in `message.reasoning`, apart
from the answer in `message.content`, so you can show it, log it, or drop it.

Those tokens are generated and therefore billed, which is worth knowing if a short answer
costs more than its length suggests.

## Usage and cost

Every request is recorded. Ask for your own history and lifetime totals:

```bash
curl "https://api.nosana.com/credits/llm/usage?limit=20" \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

**Response:**
```json
{
  "usage": [
    {
      "requestId": "d757881a-c690-4c3f-a6bf-0c61835ed867",
      "model": "<model-id>",
      "promptTokens": 17,
      "completionTokens": 4096,
      "costNano": 1230500,
      "unmetered": false,
      "estimated": false,
      "streamed": true,
      "status": 200,
      "createdAt": "2026-09-15T07:54:19.585Z"
    }
  ],
  "total": 6,
  "totals": { "promptTokens": 102, "completionTokens": 9828, "costNano": 2958600 }
}
```

Costs are in nano-dollars: 1,000,000 nano-dollars is one credit. A request costing less
than a whole credit is carried forward rather than rounded up, so small requests are not
overcharged.

## Errors

Errors use the OpenAI shape, so a client that already handles them needs no changes.

| Status | `code` | Meaning |
|---|---|---|
| `401` | `invalid_api_key` | The key is missing, malformed, or belongs to another environment |
| `402` | `insufficient_credits` | Not enough credits to cover the request |
| `404` | `model_not_found` | That model is not currently being served |
| `404` | `not_found` | No such route — only the endpoints above are proxied |
| `502` | `upstream_unreachable` | The gateway could not reach the model |
| `504` | `upstream_timeout` | The model did not answer in time |

```json
{
  "error": {
    "message": "The model 'nope/nope' does not exist.",
    "type": "invalid_request_error",
    "param": null,
    "code": "model_not_found"
  }
}
```

A `model_not_found` usually means no GPU is serving that model at the moment rather than
that it was removed. Call `/v1/models` to see what is available.

The header must be `Authorization: Bearer nos_...`. A bare token without the `Bearer`
prefix is rejected as `invalid_api_key`.
