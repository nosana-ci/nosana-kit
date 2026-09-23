---
title: Nosana MCP Server
---

# Nosana MCP Server

The Nosana API is available as an [MCP](https://modelcontextprotocol.io) (Model Context Protocol) server. Connect it to an AI assistant such as Claude, Cursor or VS Code and you can manage your deployments, check GPU markets and track your credits in plain language.

```
https://api.nosana.com/mcp
```

## What you can do

Once connected, you can ask things like:

- "List my Nosana deployments"
- "What GPU markets are available, and what do they cost per hour?"
- "Stop my Ollama deployment"
- "Scale my vLLM deployment to 3 replicas"
- "How many credits do I have left, and what did I spend this week?"
- "Show me the events for my last failed deployment"

The assistant picks the right tools, calls the Nosana API on your behalf, and summarises the result.

## How it works

The MCP server is generated from the same OpenAPI document as the [Nosana API](/api/intro). Each supported API endpoint is one tool. When endpoints are added to the API, they become tools automatically. Your client shows the current list of tools (for example, `/mcp` in Claude Code).

The server uses the [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http) transport. Your client sends JSON-RPC requests with `POST /mcp`. Server-to-client streaming is not supported, so endpoints that stream events are not available as tools.

## Authentication

The MCP server uses **OAuth**. You don't need an API key.

1. When your client first connects, the server responds with `401 Unauthorized` and points the client to its OAuth metadata at `/.well-known/oauth-protected-resource`.
2. Your client opens a browser window where you sign in with your Nosana account and approve access.
3. The client stores the resulting access token and sends it with every request.

Every tool call runs as **you**, with the same permissions and credit balance as your account on [Nosana Deploy](https://deploy.nosana.com). The MCP server never stores credentials of its own.

:::warning
Tools can create, start, stop and delete deployments, and running deployments spend your credits. Review what your assistant is about to do before you approve a tool call that changes your deployments, especially if your client auto-approves tool calls.
:::

## Connect your client

The Nosana MCP server works with any MCP client that supports remote (Streamable HTTP) servers with OAuth.

:::tabs

== Claude Code

Add the server from your terminal:

```bash
claude mcp add --transport http nosana https://api.nosana.com/mcp
```

Then start Claude Code, run `/mcp`, select `nosana` and choose **Authenticate** to sign in.

To make the server available in every project, add `--scope user`.

== Claude.ai / Claude Desktop

1. Open **Settings → Connectors**.
2. Click **Add custom connector**.
3. Enter `Nosana` as the name and `https://api.nosana.com/mcp` as the URL.
4. Click **Add**, then **Connect** to sign in with your Nosana account.

== Cursor

Add the server to `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project):

```json
{
  "mcpServers": {
    "nosana": {
      "url": "https://api.nosana.com/mcp"
    }
  }
}
```

Open **Settings → MCP** and click **Connect** next to `nosana` to sign in.

== VS Code

Add the server to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "nosana": {
      "type": "http",
      "url": "https://api.nosana.com/mcp"
    }
  }
}
```

Click **Start** above the server entry. VS Code prompts you to sign in.

== Other clients

If your client only supports local (stdio) servers, use [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) as a bridge:

```json
{
  "mcpServers": {
    "nosana": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.nosana.com/mcp"]
    }
  }
}
```

:::

## Check the connection

Ask your assistant:

> List my Nosana deployments

If the assistant returns your deployments, you're connected. If you haven't created any yet, see [My First Deployment](/deployments/my-first-deployment).

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `401 Unauthorized` | The client isn't signed in, or its token has expired | Re-authenticate from your client's MCP settings (for example, `/mcp` in Claude Code) |
| `503` with `Retry-After` | The server couldn't verify your token right now | Wait a few seconds and retry. You don't need to sign in again |
| `405 Method Not Allowed` on `GET /mcp` | The client is trying to open a server-to-client event stream | This is expected. Clients fall back to `POST`. If yours doesn't, use `mcp-remote` |
| A tool is missing | Not every API endpoint is exposed as a tool | Call the [API](/api/intro) directly |
