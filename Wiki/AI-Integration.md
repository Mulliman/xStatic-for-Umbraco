`xStatic.AI` is an optional add-on package built on `Microsoft.Extensions.AI` (`IChatClient` and `AIFunction` / `AITool`). It adds a pre-deploy GEO/SEO audit post-generation action and role-authorised AI agent tools for `Umbraco.AI.Agent` or any custom `IChatClient`, while keeping `xStatic.Core` completely free of AI dependencies.

## At a glance

- **Package**: `xStatic.AI` (optional; install only when you want AI audits or in-process agent tools).
- **Pre-deploy audit**: `AiPreDeployAuditAction` inspects generated HTML pages for SEO and GEO issues, optionally asks an `IChatClient` to synthesise prioritized recommendations, and saves reports outside the deployable site folder at `umbraco/Data/xStatic/reports/{siteId}/`.
- **Agent tools**: `IXStaticAIToolProvider` exposes `xstatic_list_sites`, `xstatic_get_site_status`, `xstatic_generate_site`, and `xstatic_deploy_site` as `AIFunction` / `AITool` definitions enforcing Umbraco backoffice authentication and `XStaticRoles`.
- **Graceful fallback**: if no `IChatClient` is configured (or an LLM call fails), `AiPreDeployAuditAction` still runs all deterministic checks and writes the report with an "AI summary unavailable" note.

## Install the package

From your Umbraco project folder, run:

```powershell
dotnet add package xStatic.AI
```

`XStaticAIComposer` ([source](../Source/XStaticCore/XStatic.AI/Composition/XStaticAIComposer.cs)) automatically registers `XStatic.AI` services, `IXStaticAIToolProvider`, and `AiPreDeployAuditAction` on startup. No `Program.cs` changes are required to run deterministic pre-deploy audits.

## Pre-deploy GEO/SEO audit (`AiPreDeployAuditAction`)

### Set it up in the backoffice

1. Open **xStatic > Actions** and select **Create new Action**.
2. Enter an **Action Name**, such as `AI Pre-Deploy GEO/SEO Audit`.
3. Choose `AiPreDeployAuditAction` as the **Action Type**.
4. Configure any optional fields:

| Field | Default | Meaning |
|-------|---------|---------|
| **MaxPages** | `10` | Maximum number of HTML pages to audit per generation run. |
| **ReportPath** | `xstatic-ai-audit.md` | Relative file name inside `umbraco/Data/xStatic/reports/{siteId}/`. Path traversal outside the report folder is rejected. |
| **FailOnCritical** | `false` | Set to `true` to mark the generation result as failed when critical issues (such as missing `<title>` or broken internal links) are detected, after writing the report. |
| **ProfileAlias** | none | Optional `Umbraco.AI` or keyed `IChatClient` profile alias override. |
| **IncludePaths** | none | Optional comma-separated URL prefixes to audit (for example `/blog, /docs`). |

5. Select **Submit**, attach the action to your site under **Post Generation Actions**, and select **Generate**.

### Where reports are saved

Reports are written to `umbraco/Data/xStatic/reports/{siteId}/xstatic-ai-audit.md` (and `xstatic-ai-audit.json` when `WriteJsonReport` is enabled). Because this directory sits outside `umbraco/Data/xStatic/output/{siteId}/`, audit reports are never deployed to your public static host.

### What the audit checks

1. **Deterministic HTML checks** (fast, local, zero tokens):
   - Missing or overly long `<title>` tags.
   - Missing `<meta name="description">`.
   - Missing or duplicate `<h1>` headings.
   - `<img>` tags missing `alt` attributes.
   - Broken internal links checked against the generated static output folder.
   - Thin content (below `ThinContentWordThreshold`, default 150 words).
   - GEO signals (JSON-LD structured data and OpenGraph tags).
2. **Optional LLM synthesis**:
   - Sends extracted signals and truncated plain-text excerpts to the resolved `IChatClient` to produce an executive summary, prioritized fixes and GEO recommendations.

## Connecting an `IChatClient` (optional)

### Configuration in `appsettings.json`

```json
{
  "XStatic": {
    "AI": {
      "ProfileAlias": "default-chat",
      "DefaultMaxPagesToAudit": 10,
      "MaxCharactersPerPage": 4000,
      "ThinContentWordThreshold": 150,
      "AuditReportDirectory": "umbraco/Data/xStatic/reports",
      "DefaultReportFileName": "xstatic-ai-audit.md",
      "WriteJsonReport": true,
      "FailOnCriticalIssues": false,
      "RequireUserRoleAuthorization": true
    }
  }
}
```

### Option A: Standalone `Microsoft.Extensions.AI`

Register any singleton `IChatClient` (OpenAI, Anthropic, Google Gemini, Azure AI Foundry, Ollama, etc.) in `Program.cs`:

```csharp
using Microsoft.Extensions.AI;

builder.Services.AddSingleton<IChatClient>(sp => yourProviderChatClient);
```

`IXStaticChatClientResolver` automatically picks up the default `IChatClient` or a keyed `IChatClient` matching `ProfileAlias`.

### Option B: Bridging `Umbraco.AI`

`xStatic.AI` intentionally avoids a hard package reference to `Umbraco.AI`. When `Umbraco.AI` is installed in your Umbraco site, register a custom resolver delegate in `Program.cs`:

```csharp
using Microsoft.Extensions.AI;
using XStatic.AI.Composition;

builder.Services.AddXStaticAI(options =>
{
    options.ProfileAlias = "xstatic-audit";
});

builder.Services.AddXStaticAIChatClient((serviceProvider, profileAlias) =>
{
    return !string.IsNullOrWhiteSpace(profileAlias)
        ? serviceProvider.GetKeyedService<IChatClient>(profileAlias)
        : serviceProvider.GetService<IChatClient>();
});
```

## Exposing agent tools to `Umbraco.AI.Agent` or an `IChatClient`

Inject `IXStaticAIToolProvider` ([source](../Source/XStaticCore/XStatic.AI/Tools/XStaticAIToolProvider.cs)) and attach its tools to `ChatOptions` or your `Umbraco.AI.Agent` setup:

```csharp
using Microsoft.Extensions.AI;
using XStatic.AI.Tools;

var toolProvider = serviceProvider.GetRequiredService<IXStaticAIToolProvider>();
var chatOptions = toolProvider.ConfigureChatOptions(new ChatOptions());
```

| Tool name | What it does | Required backoffice role |
|-----------|--------------|--------------------------|
| `xstatic_list_sites` | Lists configured xStatic sites (IDs, names, hostnames, timestamps). Never returns secrets. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_get_site_status` | Returns generation status, HTML page count, `.xstatic-metadata` and latest deterministic audit summary. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_generate_site` | Triggers static site generation for a site ID. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_deploy_site` | Deploys the generated output for a site ID. | `xStaticNormalUser` or `xStaticAdmin` |

Every tool call checks `IBackOfficeSecurityAccessor` / backoffice authentication schemes (rejecting front-end Umbraco Members) and verifies `XStaticRoles` when `UseXStaticUserRoles` and `RequireUserRoleAuthorization` are enabled.

## Limitations

- `FailOnCritical` marks the generation result as failed in xStatic, but does not hard-block manual or auto-publish deployments unless your workflow inspects the generation result first.
- Audit reports are written to disk on the Umbraco server; there is currently no dedicated report viewer tab in the backoffice UI.

## Next steps

- Generate companion `.md` pages and `/llms.txt` with [AI and GEO](AI-and-GEO.md).
- Connect external AI coding assistants via [MCP server and agent skill](MCP-Server-and-Agent-Skill.md).
- Export structured chunks for search and RAG with [RAG and WebMCP](RAG-and-WebMCP.md).
