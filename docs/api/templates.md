---
title: Templates
---

# Templates API

The Templates API exposes the catalog of ready-made deployment templates (the
same ones shown in the [Nosana Deploy dashboard](https://deploy.nosana.com)).
Each template ships a job definition you can use as a starting point for your
own deployments, and can have multiple variants (for example different model
sizes).

## Usage

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// List all templates
const templates = await client.api.templates.list();

// Or grouped by category
const grouped = await client.api.templates.getAllGrouped();

// Get one template, or a specific variant of it
const template = await client.api.templates.get('template-id');
const variant = await client.api.templates.getVariant('template-id', 'variant-id');
```

## Methods

| Method | HTTP | Path | Description |
|---|---|---|---|
| `templates.list()` | GET | `/templates/` | List all templates |
| `templates.getAllGrouped()` | GET | `/templates/grouped` | Templates grouped by category |
| `templates.get(id)` | GET | `/templates/{id}` | Get a template by ID |
| `templates.getVariant(id, variantId)` | GET | `/templates/{id}/{variantId}` | Get a template variant |

## Using a template in a deployment

A template's job definition can be passed straight into a deployment:

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
import type { JobDefinition } from '@nosana/kit';

const template = await client.api.templates.get('template-id');

const deployment = await client.api.deployments.create({
  name: 'my-deployment',
  market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
  job_definition: template.jobDefinition as JobDefinition,
  timeout: 3600,
  replicas: 1,
  strategy: 'SIMPLE',
});
```

See [Create Deployments](/api/create-deployments) for the full deployment
options.
