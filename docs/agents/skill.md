---
title: Nosana Agent Skill
description: Install the Nosana Agent Skill so coding agents can deploy and monitor GPU workloads correctly with the TypeScript SDK.
---

# Nosana Agent Skill

The Nosana Agent Skill teaches coding agents how to deploy and monitor GPU
workloads with [`@nosana/kit`](https://www.npmjs.com/package/@nosana/kit). It
contains the deployment workflow, job-definition rules, endpoint readiness,
logs, GPU market selection, funding and error handling that an agent needs to
write correct Nosana code.

## Skill, MCP, API or SDK?

| Use | Best fit |
| --- | --- |
| Let an assistant operate Nosana through authenticated tools | [MCP server](/mcp/intro) |
| Help a coding agent write and run Nosana integrations | **Agent Skill** |
| Make HTTP calls from your own application | [REST API](/api/intro) |
| Build a TypeScript application with typed clients | [`@nosana/kit`](/kit/) |

MCP gives an assistant tools it can call. The skill gives a coding agent
procedural knowledge; it does not make network requests, hold credentials or
run a server.

## Install in Claude Code

Run these slash commands inside a Claude Code session:

```text
/plugin marketplace add nosana-ci/nosana-kit
/plugin install nosana@nosana
```

The first command registers the Nosana repository as a plugin marketplace on
your machine. The second installs the `nosana` plugin from it. Claude Code loads
the skill automatically when a request matches it, or you can invoke it with
`/nosana`.

## Install in other Agent Skills clients

Copy the
[`skills/nosana`](https://github.com/nosana-ci/nosana-kit/tree/main/packages/skills/skills/nosana)
directory into the skills directory supported by your client. The directory's
`SKILL.md` is the entry point; its `reference/` files load only when the task
needs their detail.

The machine-readable discovery index is published at
[`https://nosana.com/.well-known/agent-skills/index.json`](https://nosana.com/.well-known/agent-skills/index.json).

## Requirements

Code produced through the skill uses Node.js 20.18 or newer and `@nosana/kit`.
Deploying requires either a Nosana API key or a Solana wallet. Read credentials
from the environment; never place them in source code or prompts.

## Source

The skill is open source in
[`packages/skills`](https://github.com/nosana-ci/nosana-kit/tree/main/packages/skills).
Its TypeScript and JSON examples are compiled and validated in CI against the
current kit.
