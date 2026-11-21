# xStatic AI Integration (`XStatic.AI`)

`XStatic.AI` is an **optional** add-on package for xStatic on Umbraco 17 LTS (`.NET 10`) built on `Microsoft.Extensions.AI` (`IChatClient` and `AIFunction` / `AITool`).

`XStatic.Core` remains completely free of AI dependencies—you only install `XStatic.AI` when you want:

1. **Agent Tools (`Umbraco.AI.Agent` / `Microsoft.Extensions.AI`)**: Expose xStatic operations (`xstatic_list_sites`, `xstatic_get_site_status`, `xstatic_generate_site`, `xstatic_deploy_site`) to in-backoffice copilots or custom AI agents while enforcing `XStaticRoles`.
2. **AI Pre-Deploy GEO/SEO Audit (`IPostGenerationAction`)**: Run an automated post-generation audit over generated static HTML pages for SEO & Generative Engine Optimization (GEO) readiness before deployment.

---

## Installation

Add a reference to `XStatic.AI` in your Umbraco 17 web project. `XStaticAIComposer` automatically registers all `XStatic.AI` services, tools, and the `AiPreDeployAuditAction` post-generation action.

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
      "DefaultReportFileName": ".xstatic-ai-audit.md",
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

Register any `IChatClient` implementation in DI (OpenAI, Anthropic, Google Gemini, Azure AI Foundry, Ollama, etc.):

```csharp
using Microsoft.Extensions.AI;

// Example: register any provider's IChatClient (or keyed client per profile alias)
builder.Services.AddChatClient(sp =>
{
    // Replace with OpenAI, Azure OpenAI, Anthropic, Gemini, or Ollama IChatClient
    return yourProviderChatClient;
});
```

`XStatic.AI` automatically resolves the registered `IChatClient` (or a keyed `IChatClient` matching `ProfileAlias`) through `IXStaticChatClientResolver`.

### Option B: Integrating with `Umbraco.AI` & `Umbraco.AI.Agent`

When `Umbraco.AI` is installed in your Umbraco 17 site, you can bridge your configured `Umbraco.AI` profile into `XStatic.AI` without hard-coding provider credentials:

```csharp
using XStatic.AI.Composition;
using XStatic.AI.Tools;

// 1. Bridge Umbraco.AI's profile-resolved IChatClient into XStatic.AI
builder.Services.AddXStaticAI(options =>
{
    options.ProfileAlias = "xstatic-audit";
});

builder.Services.AddXStaticAIChatClient((serviceProvider, profileAlias) =>
{
    // Resolve an IChatClient from Umbraco.AI using the configured profile alias
    // (or fall back to the default IChatClient in DI).
    var chatClientFactory = serviceProvider.GetService<IChatClient>();
    return chatClientFactory;
});
```

#### Exposing xStatic Tools to `Umbraco.AI.Agent` or any `IChatClient`

Inject `IXStaticAIToolProvider` to retrieve standard `Microsoft.Extensions.AI` `AIFunction` / `AITool` definitions:

```csharp
var toolProvider = serviceProvider.GetRequiredService<IXStaticAIToolProvider>();

// Pass directly into Umbraco.AI.Agent tool registration or ChatOptions.Tools:
var chatOptions = toolProvider.ConfigureChatOptions(new ChatOptions());
```

The exposed tools are:

| Tool Name | Description | Required Role (when `UseXStaticUserRoles` is enabled) |
| --- | --- | --- |
| `xstatic_list_sites` | Lists configured xStatic sites (IDs, names, hostnames, last build/deploy times). Secrets are never returned. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_get_site_status` | Inspects generation status, HTML page count, `.xstatic-metadata`, and latest AI audit report. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_generate_site` | Triggers static site generation for a site ID. | `xStaticNormalUser` or `xStaticAdmin` |
| `xstatic_deploy_site` | Deploys the generated static output for a site ID. | `xStaticNormalUser` or `xStaticAdmin` |

---

## AI Pre-Deploy GEO/SEO Audit (`AiPreDeployAuditAction`)

`AiPreDeployAuditAction` implements `IPostGenerationAction` and is automatically discovered in the Umbraco xStatic **Actions** dashboard.

### Configurable Fields in the xStatic Dashboard

- **`MaxPages`**: Maximum number of HTML pages to audit per generation run.
- **`ReportPath`**: Output path inside the generated site folder (defaults to `.xstatic-ai-audit.md`).
- **`FailOnCritical`**: When enabled, returns an error result if critical issues (e.g., missing `<title>` or broken internal links) are detected, after writing the report.
- **`ProfileAlias`**: Optional `Umbraco.AI` / keyed `IChatClient` profile alias override.
- **`IncludePaths`**: Optional comma-separated path prefix filter (for example `/blog,/docs`) to audit only specific sections.

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
   - Writes `.xstatic-ai-audit.md` (and optionally `.xstatic-ai-audit.json`) into the generated site folder before deployment.
