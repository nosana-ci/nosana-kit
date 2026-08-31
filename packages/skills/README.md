# Nosana Agent Skill

A [Claude Code plugin](https://code.claude.com/docs/en/plugins) that teaches AI
coding agents to deploy and monitor GPU workloads on the
[Nosana Network](https://nosana.com) using
[`@nosana/kit`](https://www.npmjs.com/package/@nosana/kit).

Nosana is a decentralized GPU compute network on Solana. You describe a
container as a job definition, pick a GPU market, and create a deployment that
schedules it onto hosts. This plugin gives an agent the working knowledge to do
that correctly — including the parts the public documentation gets wrong.

## Install

Type these at the Claude Code prompt — they are slash commands inside a session,
not shell commands:

```
/plugin marketplace add nosana-ci/nosana-kit
/plugin install nosana@nosana
```

The first registers the catalog; the second installs the plugin from it.

Agents load the skill automatically when a request matches its description, or
you can invoke it directly with `/nosana`.

To use it without the plugin system, copy `skills/nosana/` into
`~/.claude/skills/` (personal) or `.claude/skills/` in a project.

## What it covers

Deploying and monitoring is the focus; everything else supports it.

- Creating, starting, stopping and archiving deployments; strategies, replicas,
  revisions and scheduling
- Monitoring: the SSE stream, the status machine, container logs, events and
  tasks — including why `RUNNING` does not mean your service is up
- Writing and validating job definitions
- Choosing a GPU market
- Reaching a deployed service's endpoint, with health checks
- Loading models and data via HuggingFace and S3 resources
- Paying with credits (API key) or a vault (wallet)
- Error handling, idempotency and safe retries

## Requirements

`@nosana/kit` (Node >= 20.18.0) in the target project, and either a Nosana API
key or a Solana wallet. The plugin ships documentation only — no scripts, no
hooks, no MCP servers, and no network access of its own.

## Layout

```
skills/nosana/
├── SKILL.md              # the spine: setup → define → deploy → monitor
└── reference/
    ├── monitoring.md     # stream frames, statuses, logs, events, pagination
    ├── job-definition.md # schema, ops, cmd forms, literal interpolation
    ├── markets.md        # choosing a GPU, live field names, addresses
    ├── endpoints.md      # exposing ports, health checks, service URLs
    ├── resources.md      # HuggingFace and S3 resources, caching, registries
    ├── funding.md        # credits (API key) and vaults (wallet)
    ├── errors.md         # error types, idempotency, retry policy
    └── one-shot-jobs.md  # jobs API, batch operations, on-chain posting
```

Only `SKILL.md` loads when the skill activates. Reference files load on demand,
when the spine points the agent at one — so depth costs nothing until it's
needed. This is why the package is one skill rather than several: setup, job
definitions, deploying and monitoring are a single workflow, and splitting them
would put several descriptions in context permanently and risk pieces being
dropped from context after compaction.

Keep `SKILL.md` under 500 lines. New depth goes in `reference/`.

## Maintenance

The skill documents behaviour the published docs don't cover or get wrong —
`timeout` units and the 60-minute credit-paid minimum, that `RUNNING` does not
mean a job is running, that `endpoints` is populated before anything is
scheduled, live market field names, the three encodings of job `state`, and
undocumented create options (`autostart`, `confidential`, `new_vault`). When
the API changes, check these against:

- `packages/api/API_ENDPOINTS.md` — generated from the live OpenAPI specs
- `packages/api/src/client/*/schema.ts` — the vendored schemas
- `packages/types/src/**` — the job definition types

This is a private workspace package — not published, and depending on
`@nosana/kit` with `workspace:*` so the CI orchestrator triggers its pipeline
whenever kit or anything kit depends on changes. `skills:validate` compiles
every TypeScript snippet against the built kit, parses the JSON blocks, resolves
internal links, checks nothing references outside the plugin directory, and
validates both manifests. Run it locally with:

```bash
pnpm --filter @nosana/kit run build:with-deps
pnpm --filter @nosana/skills run test
```
