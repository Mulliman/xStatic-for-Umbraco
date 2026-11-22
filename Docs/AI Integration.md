# xStatic AI Integration (`XStatic.AI`)

`XStatic.AI` is an **optional** add-on NuGet package (`xStatic.AI`) for xStatic on Umbraco 17 LTS (`.NET 10`) built on `Microsoft.Extensions.AI` (`IChatClient` and `AIFunction` / `AITool`).

`XStatic.Core` remains completely free of AI dependencies—you only install `xStatic.AI` when you want:

1. **Agent Tools (`Umbraco.AI.Agent` / `Microsoft.Extensions.AI`)**: Expose xStatic operations (`xstatic_list_sites`, `xstatic_get_site_status`, `xstatic_generate_site`, `xstatic_deploy_site`) to in-backoffice copilots or custom AI agents while enforcing Umbraco backoffice authentication and `XStaticRoles`.
2. **AI Pre-Deploy GEO/SEO Audit (`IPostGenerationAction`)**: Run an automated post-generation audit over generated static HTML pages for SEO & Generative Engine Optimization (GEO) readiness before deployment.

---

## Installation

Install the optional NuGet package in your Umbraco 17 web project:

```bash
dotnet add package xStatic.AI
```

`XStaticAIComposer` automatically registers all `XStatic.AI` services, tools, and the `AiPreDeployAuditAction` post-generation action.

To customize options explicitly in `Program.cs`:

```csharp
builder.Services.AddXStaticAI(options =>
{
    options.DefaultMaxPagesToAudit = 15;
    options.FailOnCriticalIssues = false;
    options.WriteJsonReport = true;
});
```

Or configure via `appsettings.json`:

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

---

## Provider-Agnostic Setup

### Option A: Standalone `Microsoft.Extensions.AI`

Register any singleton `IChatClient` implementation in DI (OpenAI, Anthropic, Google Gemini, Azure AI Foundry, Ollama, etc.):

```csharp
using Microsoft.Extensions.AI;

// Example: register any provider's IChatClient (or keyed client per profile alias)
builder.Services.AddChatClient(sp =>
{
    // Replace with OpenAI, Azure OpenAI, Anthropic, Gemini, or Ollama IChatClient
    return yourProviderChatClient;
});
```

`XStatic.AI` automatically resolves the registered `IChatClient` (or a keyed `IChatClient` matching `ProfileAlias`) through `IXStaticChatClientResolver`. Note: register `IChatClient` as a singleton (or use `AddXStaticAIChatClient` to resolve from a custom factory).

### Option B: Integrating with `Umbraco.AI` & `Umbraco.AI.Agent`

`XStatic.AI` intentionally has no hard package dependency on `Umbraco.AI`, so it stays decoupled from `Umbraco.AI` release cadence and works standalone. When `Umbraco.AI` is installed in your Umbraco 17 site, wire the two together in your host startup:

```csharp
using XStatic.AI.Composition;
using XStatic.AI.Tools;

// 1. Bridge your Umbraco.AI profile-resolved IChatClient into XStatic.AI
builder.Services.AddXStaticAI(options =>
{
    options.ProfileAlias = "xstatic-audit";
});

builder.Services.AddXStaticAIChatClient((serviceProvider, profileAlias) =>
{
    // Resolve a profile-specific IChatClient from your Umbraco.AI setup
    // (for example via Umbraco.AI's chat client factory or keyed IChatClient registrations).
    return !string.IsNullOrWhiteSpace(profileAlias)
        ? serviceProvider.GetKeyedService<IChatClient>(profileAlias)
        : serviceProvider.GetService<IChatClient>();
});
```

#### Exposing xStatic Tools to `Umbraco.AI.Agent` or any `IChatClient`

Inject `IXStaticAIToolProvider` and register its `AIFunction` / `AITool` definitions in your `Umbraco.AI.Agent` setup or pass them into `ChatOptions.Tools`:

```csharp
var toolProvider = serviceProvider.GetRequiredService<IXStaticAIToolProvider>();

// Pass directly into Umbraco.AI.Agent tool registration or ChatOptions.Tools:
var chatOptions = toolProvider.ConfigureChatOptions(new ChatOptions());
```

The exposed tools are:

| Tool Name | Description | Required Backoffice Role (when `UseXStaticUserRoles` is enabled) |
| --- | --- | --- |
| `xstatic_list_sites` | Lists configured xStatic sites (IDs, names, hostnames, last build/deploy times). Secrets are never returned. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_get_site_status` | Inspects generation status, HTML page count, `.xstatic-metadata`, and latest deterministic AI audit metrics. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_generate_site` | Triggers static site generation for a site ID. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_deploy_site` | Deploys the generated static output for a site ID. | `xStaticNormalUser` or `xStaticAdmin` |

All tool calls verify that the caller is an authenticated **Umbraco backoffice user** (rejecting front-end Umbraco Members even if a member group shares a role name) and check `XStaticRoles`.

---

## AI Pre-Deploy GEO/SEO Audit (`AiPreDeployAuditAction`)

`AiPreDeployAuditAction` implements `IPostGenerationAction` and is automatically discovered in the Umbraco xStatic **Actions** dashboard.

### Configurable Fields in the xStatic Dashboard

- **`MaxPages`**: Maximum number of HTML pages to audit per generation run (numeric text, e.g., `10`).
- **`ReportPath`**: Relative file name inside the site's private report folder (defaults to `xstatic-ai-audit.md`). Path traversal outside the report directory is rejected.
- **`FailOnCritical`**: Set to `true` to mark the post-generation action as failed when critical issues (such as missing `<title>` or broken internal links) are detected, after saving the report.
- **`ProfileAlias`**: Optional `Umbraco.AI` / keyed `IChatClient` profile alias override.
- **`IncludePaths`**: Optional comma-separated path prefix filter (for example `/blog,/docs`) to audit only specific sections.

### Report Storage & Deployment Behavior

- Reports are written to **`umbraco/Data/xStatic/reports/{siteId}/`** (configurable via `XStatic:AI:AuditReportDirectory`), **outside** the generated static site folder so internal SEO/GEO findings are never deployed to your public CDN.
- If no `IChatClient` is configured or the upstream LLM returns an error (such as a rate limit or outage), the action degrades gracefully: deterministic checks still run, the report is written with an `"AI summary unavailable"` note, and the build is not failed unless `FailOnCritical` is enabled and critical issues are found.
- Note that `FailOnCritical` flags the generation result as failed in xStatic; it does not hard-block manual or auto-publish deployments unless your deployment workflow checks the generation result first.

### What the Audit Checks

1. **Deterministic HTML Inspection** (fast, zero-token local pass):
   - Missing or overly long `<title>` tags
   - Missing `<meta name="description">`
   - Missing or duplicate `<h1>` headings
   - `<img>` tags missing descriptive `alt` text
   - Broken internal links verified against the generated static output folder
   - Thin content (below `ThinContentWordThreshold` visible words)
   - GEO readiness signals (JSON-LD structured data & OpenGraph tags)
2. **LLM Synthesis (`IChatClient`)**:
   - Reviews the extracted page signals and truncated plain-text excerpts to produce an executive summary, prioritized fixes, and GEO recommendations.
   - Writes `xstatic-ai-audit.md` (and optionally `xstatic-ai-audit.json`) into `umbraco/Data/xStatic/reports/{siteId}/`.
