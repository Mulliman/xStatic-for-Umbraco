# xstatic-mcp

Official [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for **xStatic for Umbraco 17+**.

`xstatic-mcp` wraps xStatic's Management API (`/api/v1/xstatic/*`) using Umbraco's OAuth2 client-credentials API User flow, allowing AI assistants and coding agents to inspect static sites, trigger generation, deploy to targets, and chain with Umbraco's official Developer/Editor MCP servers (e.g., *"Create campaign page in Umbraco -> rebuild static site -> deploy"*).

---

## Available Tools

| Tool | Description | Required xStatic Role* |
| --- | --- | --- |
| `list_sites` | List all configured static sites with IDs, root paths, export types, build/deploy timestamps, and folder sizes. | `xStaticNormalUser` |
| `get_site` | Get full configuration and status for a single static site by `staticSiteId`. | `xStaticNormalUser` |
| `generate_site` | Run `RebuildProcess` for a site (crawl content/media/assets, run transformers, execute post-generation actions). | `xStaticNormalUser` |
| `deploy_site` | Deploy a site's locally generated output to its configured deployment target. | `xStaticNormalUser` |
| `generate_and_deploy_site` | Generate a site and immediately deploy it if generation succeeds. | `xStaticNormalUser` |
| `list_actions` | List configured post-generation actions (password/secret values are redacted). | `xStaticAdmin` |
| `list_deployment_targets` | List configured deployment targets (password/secret values are redacted). | `xStaticAdmin` |
| `get_xstatic_config` | Inspect registered generators, transformer factories, file name generators, deployers, export types, and role settings. | `xStaticNormalUser` |

*\*Role requirements apply when `XStatic:UseXStaticUserRoles` / `.UseSecureUserGroups()` is enabled (enabled by default in xStatic v17+).*

---

## Prerequisites: Create an Umbraco API User

1. In the Umbraco Backoffice, go to **Users -> Create -> API User**.
2. Assign the API User to:
   - **xStatic Normal User** (`xStaticNormalUser`) for `list_sites`, `get_site`, `generate_site`, `deploy_site`, `generate_and_deploy_site`, and `get_xstatic_config`.
   - **xStatic Admin** (`xStaticAdmin`) as well if you want to use `list_actions` and `list_deployment_targets`.
3. Create an API Client on that user and note its **Client ID** and **Client Secret**.

---

## Build Locally

```bash
cd Source/xstatic-mcp
npm install
npm run build
npm test
```

---

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `UMBRACO_BASE_URL` | Yes | — | Base URL of your Umbraco instance (e.g. `https://localhost:44391`). |
| `UMBRACO_CLIENT_ID` | Yes | — | Umbraco API User client ID. |
| `UMBRACO_CLIENT_SECRET` | Yes | — | Umbraco API User client secret. |
| `XSTATIC_REQUEST_TIMEOUT_MS` | No | `300000` | HTTP request timeout in milliseconds (default 5 minutes for large static builds). |
| `XSTATIC_ALLOW_INSECURE_TLS` | No | `false` | Set to `true` **only for local development** with self-signed HTTPS certificates. |

---

## Client Setup

### Claude Code

Add to your project `.mcp.json`:

```json
{
  "mcpServers": {
    "xstatic": {
      "command": "node",
      "args": ["/absolute/path/to/Source/xstatic-mcp/dist/index.js"],
      "env": {
        "UMBRACO_BASE_URL": "https://localhost:44391",
        "UMBRACO_CLIENT_ID": "umbraco-back-office-xstatic",
        "UMBRACO_CLIENT_SECRET": "your-client-secret",
        "XSTATIC_ALLOW_INSECURE_TLS": "true"
      }
    }
  }
}
```

Or via CLI:

```bash
claude mcp add xstatic \
  -e UMBRACO_BASE_URL=https://localhost:44391 \
  -e UMBRACO_CLIENT_ID=umbraco-back-office-xstatic \
  -e UMBRACO_CLIENT_SECRET=your-client-secret \
  -- node /absolute/path/to/Source/xstatic-mcp/dist/index.js
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "xstatic": {
      "command": "node",
      "args": ["/absolute/path/to/Source/xstatic-mcp/dist/index.js"],
      "env": {
        "UMBRACO_BASE_URL": "https://localhost:44391",
        "UMBRACO_CLIENT_ID": "umbraco-back-office-xstatic",
        "UMBRACO_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

### VS Code (GitHub Copilot / MCP)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "xstatic": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/Source/xstatic-mcp/dist/index.js"],
      "env": {
        "UMBRACO_BASE_URL": "https://localhost:44391",
        "UMBRACO_CLIENT_ID": "${input:umbracoClientId}",
        "UMBRACO_CLIENT_SECRET": "${input:umbracoClientSecret}"
      }
    }
  },
  "inputs": [
    {
      "id": "umbracoClientId",
      "type": "promptString",
      "description": "Umbraco API User Client ID"
    },
    {
      "id": "umbracoClientSecret",
      "type": "promptString",
      "description": "Umbraco API User Client Secret",
      "password": true
    }
  ]
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "xstatic": {
      "command": "node",
      "args": ["/absolute/path/to/Source/xstatic-mcp/dist/index.js"],
      "env": {
        "UMBRACO_BASE_URL": "https://localhost:44391",
        "UMBRACO_CLIENT_ID": "umbraco-back-office-xstatic",
        "UMBRACO_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

---

## Chaining with Umbraco Official MCP Servers

When configured alongside Umbraco's official Developer or Editor MCP server, agents can orchestrate end-to-end publishing workflows:

> *"Create and publish the Autumn Campaign landing page under Home in Umbraco, then rebuild and deploy the Marketing static site in xStatic."*

1. Umbraco MCP creates and publishes the content node.
2. `xstatic-mcp` calls `list_sites` to find the **Marketing** site ID.
3. `xstatic-mcp` calls `generate_and_deploy_site` to rebuild static output and deploy to the configured target.

---

## Security Notes

- **Secret Redaction**: `list_deployment_targets` and `list_actions` automatically redact fields using `xstatic.propertyEditorUi.password` or secret-like field aliases (`password`, `secret`, `token`, `pat`, `apiKey`) before returning JSON to the model.
- **Least Privilege**: Grant `xStaticNormalUser` only if the agent does not need to inspect admin-level actions or deployment targets.
- **TLS**: Never set `XSTATIC_ALLOW_INSECURE_TLS=true` against staging or production instances.
