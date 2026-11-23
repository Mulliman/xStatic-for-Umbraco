Let AI assistants and coding agents inspect, generate and deploy your static Umbraco sites using the official `xstatic-mcp` Model Context Protocol (MCP) server, the `xstatic-v1` OpenAPI specification, and the repository's xStatic v17+ Agent Skill.

## At a glance

| Component | Location | What it does |
|-----------|----------|--------------|
| Official MCP server (`xstatic-mcp`) | [`Source/xstatic-mcp/`](../Source/xstatic-mcp/README.md) | Exposes 8 MCP tools over stdio, authenticating against Umbraco with an OAuth2 API user |
| OpenAPI document (`xstatic-v1`) | `/umbraco/swagger/xstatic-v1/swagger.json` (v17) or `/umbraco/openapi/xstatic-v1.json` (v18+) | Clean operation IDs, summaries, descriptions and `GET /api/v1/xstatic/sites/{staticSiteId}` |
| xStatic Agent Skill | [`.agents/skills/xstatic-umbraco/SKILL.md`](../.agents/skills/xstatic-umbraco/SKILL.md) | Teaches coding agents how to extend xStatic v17+ (`IGenerator`, `ITransformer`, `IPostGenerationAction`, `IDeployer`) without falling back to v13 patterns |

## Prerequisites: create an Umbraco API user

`xstatic-mcp` uses Umbraco's OAuth2 client-credentials flow — the same mechanism used by [Remote operations](Remote-Operations.md).

1. Sign in to the Umbraco backoffice and open **Users**.
2. Select **Create > API User** and give it a name, such as `xStatic MCP`.
3. Assign user groups:
   - Tick **xStatic Normal User** (`xStaticNormalUser`) for `list_sites`, `get_site`, `generate_site`, `deploy_site`, `generate_and_deploy_site`, and `get_xstatic_config`.
   - Also tick **xStatic Admin** (`xStaticAdmin`) if you want the agent to call `list_actions` and `list_deployment_targets`.
4. Open the user's **API Clients** section, create a client, and copy the **Client ID** (including the `umbraco-back-office-` prefix shown by Umbraco) and **Client Secret**.

## Build `xstatic-mcp` locally

Requires Node.js 20 or later. From the repository root:

```bash
cd Source/xstatic-mcp
npm install
npm run build
npm test
```

This compiles the server to `Source/xstatic-mcp/dist/index.js`.

## Environment variables

| Variable | Required | Default | Meaning |
|----------|----------|---------|---------|
| `UMBRACO_BASE_URL` | Yes | — | Base URL of your Umbraco instance, for example `https://localhost:5000`. |
| `UMBRACO_CLIENT_ID` | Yes | — | Umbraco API user Client ID. |
| `UMBRACO_CLIENT_SECRET` | Yes | — | Umbraco API user Client Secret. |
| `XSTATIC_REQUEST_TIMEOUT_MS` | No | `300000` | Request timeout in milliseconds (5 minutes by default for large builds). |
| `XSTATIC_ALLOW_INSECURE_TLS` | No | `false` | Set to `true` only for local development with a self-signed HTTPS certificate. Never enable in staging or production. |

## Configure your MCP client

Replace `/absolute/path/to/Source/xstatic-mcp/dist/index.js` and the credential placeholders with your own values.

### Claude Code

Add to `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "xstatic": {
      "command": "node",
      "args": ["/absolute/path/to/Source/xstatic-mcp/dist/index.js"],
      "env": {
        "UMBRACO_BASE_URL": "https://localhost:5000",
        "UMBRACO_CLIENT_ID": "umbraco-back-office-xstatic-mcp",
        "UMBRACO_CLIENT_SECRET": "YOUR-CLIENT-SECRET",
        "XSTATIC_ALLOW_INSECURE_TLS": "true"
      }
    }
  }
}
```

### Cursor

Add the same `mcpServers` block to `.cursor/mcp.json`.

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "xstatic": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/Source/xstatic-mcp/dist/index.js"],
      "env": {
        "UMBRACO_BASE_URL": "https://localhost:5000",
        "UMBRACO_CLIENT_ID": "${input:umbracoClientId}",
        "UMBRACO_CLIENT_SECRET": "${input:umbracoClientSecret}",
        "XSTATIC_ALLOW_INSECURE_TLS": "true"
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

Add the same `mcpServers` block as Claude Code to `claude_desktop_config.json`.

## Available MCP tools

| Tool | What it does | Required role |
|------|--------------|---------------|
| `list_sites` | Lists all configured static sites with IDs, root paths, export types, build/deploy timestamps and folder sizes. | `xStaticNormalUser` |
| `get_site` | Gets full configuration and status for one static site by `staticSiteId`. | `xStaticNormalUser` |
| `generate_site` | Runs `RebuildProcess` for a site and returns per-item results and warnings. | `xStaticNormalUser` |
| `deploy_site` | Deploys a site's generated output to its configured deployment target. | `xStaticNormalUser` |
| `generate_and_deploy_site` | Generates a site and deploys it immediately if generation succeeds. | `xStaticNormalUser` |
| `list_actions` | Lists configured post-generation actions with secrets redacted. | `xStaticAdmin` |
| `list_deployment_targets` | Lists configured deployment targets with passwords and tokens redacted. | `xStaticAdmin` |
| `get_xstatic_config` | Lists registered generators, transformer factories, file name generators, deployers, export types and role settings. | `xStaticNormalUser` |

### Secret redaction

`list_actions` and `list_deployment_targets` automatically redact fields using `xstatic.propertyEditorUi.password` or secret-like aliases (`password`, `secret`, `token`, `pat`, `apiKey`) before returning JSON to the model.

## Using the Agent Skill

The repository includes an Agent Skill at [`.agents/skills/xstatic-umbraco/SKILL.md`](../.agents/skills/xstatic-umbraco/SKILL.md) with compilable examples in [`references/extension-examples.md`](../.agents/skills/xstatic-umbraco/references/extension-examples.md). Coding agents that discover `.agents/skills/` automatically load it when you ask them to build custom generators, transformers, post-generation actions or deployers for xStatic v17+.

## Limitations

- `xstatic-mcp` is currently run from source (`Source/xstatic-mcp`); it is not yet published as a standalone npm package.
- Some MCP hosts enforce a shorter per-tool-call timeout than `XSTATIC_REQUEST_TIMEOUT_MS`; very large sites may time out in the host client while the build finishes on the server.

## Next steps

- Inspect every HTTP endpoint on [Management API](Management-API.md).
- Set up backoffice in-process AI tools and pre-deploy audits with [AI integration](AI-Integration.md).
- Review API user permissions on [User groups and security](User-Groups-and-Security.md).
