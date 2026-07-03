---
title: Validation
---

# Validating a Job Definition

The SDK ships a validator for job definitions, so you can catch mistakes locally before uploading anything to IPFS or spending credits on a job or deployment.

`validateJobDefinition` is exported from `@nosana/kit` (and from the standalone `@nosana/types` package). It checks an unknown value against the full job definition schema:

- **Strict**: unknown or misspelled properties are rejected, not silently ignored
- **Complete**: every field is checked against the schema, including nested `ops` arguments
- **Unique op ids**: duplicate `id` values across operations are reported as errors

## Usage

```ts twoslash
import { validateJobDefinition } from '@nosana/kit';

const result = validateJobDefinition({
  version: '0.1',
  type: 'container',
  ops: [
    {
      type: 'container/run',
      id: 'hello-world',
      args: {
        cmd: 'echo hello world',
        image: 'ubuntu',
      },
    },
  ],
});

if (result.success) {
  // result.data is a fully-typed JobDefinition
  console.log('Valid job definition with', result.data.ops.length, 'op(s)');
} else {
  // Each error tells you where it is, what was expected, and what was found
  for (const error of result.errors) {
    console.error(`${error.path}: expected ${error.expected}`);
  }
}
```

On failure, each entry in `errors` contains:

| Field | Description |
|---|---|
| `path` | Where in the document the error is (e.g. `$input.ops[0].args.image`) |
| `expected` | The type or value the schema expects at that path |
| `value` | The value that was actually found |

## Validate before posting

Validation is most useful right before you spend credits — as a gate in front of [posting a job](/api/jobs) or [creating a deployment](/api/create-deployments):

```ts twoslash
import { createNosanaClient, NosanaNetwork, validateJobDefinition } from '@nosana/kit';
declare const process: { env: Record<string, string> };
declare const jobDefinitionJson: unknown;
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const result = validateJobDefinition(jobDefinitionJson);

if (!result.success) {
  throw new Error(
    `Invalid job definition:\n` +
      result.errors.map((e) => `  ${e.path}: expected ${e.expected}`).join('\n'),
  );
}

// Safe to upload and post — result.data is a valid JobDefinition
const ipfsHash = await client.ipfs.pin(result.data);

const job = await client.api.jobs.list({
  ipfsHash,
  market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
});
```

This is especially valuable when the job definition comes from outside your code — a JSON file, a template, user input, or an API — where TypeScript can't check it at compile time.

## JSON Schemas (`jobSchemas`)

If you want to validate outside TypeScript — in CI pipelines, other languages, or editors — the SDK also exports the job definition as OpenAPI 3.0 JSON Schemas:

```ts twoslash
import { jobSchemas } from '@nosana/kit';

// OpenAPI 3.0 JSON Schemas for JobDefinition and FlowState
console.log(JSON.stringify(jobSchemas, null, 2));
```

You can feed these schemas to any JSON Schema validator (Ajv, jsonschema, an IDE's YAML/JSON language server, and so on) to get the same structural checks without running TypeScript.
