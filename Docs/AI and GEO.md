# AI / GEO: Companion Markdown, `llms.txt`, and Discovery Transformer

xStatic includes built-in support for making generated static sites natively **agent-ready** for LLMs and Generative Engine Optimization (GEO) at inference time. All components are opt-in per site or per export type and require no changes to existing `StaticHtmlSiteGenerator` sites.

---

## 1. Companion Markdown Output (`.md` Twins)

AI agents and edge content-negotiation layers (`Accept: text/markdown`) work best with clean Markdown stripped of navigation chrome, scripts, styles, and layout boilerplate.

xStatic provides two ways to emit a companion `.md` file alongside every generated `.html` page (for example, `about/index.html` -> `about/index.md`):

### Option A: Per Export Type (`StaticHtmlWithMarkdownSiteGenerator`)
Create or update an Export Type in the xStatic backoffice dashboard and select:
- **Generator**: `StaticHtmlWithMarkdownSiteGenerator`
- **Transformer Factory**: `GeoHtmlTransformerListFactory` (recommended, see section 3)
- **File Name Generator**: `EverythingIsIndexHtmlFileNameGenerator`

During generation, each page is fetched, transformed, saved as `.html`, and simultaneously converted to clean Markdown via `IHtmlToMarkdownConverter` (`HtmlToMarkdownConverter`) and saved as its `.md` twin.

### Option B: Per Site (`GenerateCompanionMarkdownAction`)
If you prefer to keep the standard `StaticHtmlSiteGenerator`, add a **Post-Generation Action** using `GenerateCompanionMarkdownAction`:
- **`ContentSelector`** *(optional)*: Comma-separated tag names, `#id`, `.class`, or XPath selectors (default automatically prefers `<main>`, `[role="main"]`, or `<article>`, falling back to `<body>`).
- **`ExcludePaths`** *(optional)*: Comma-separated URL prefixes to skip (e.g. `/404, /search`).

---

## 2. `/llms.txt` and `/llms-full.txt` (`GenerateLlmsTxtAction`)

`GenerateLlmsTxtAction` is a built-in `IPostGenerationAction` that scans the generated static site output and compiles:
- **`/llms.txt`**: A curated Markdown site map following the [llms.txt](https://llmstxt.org/) specification with site title, summary, and grouped section links.
- **`/llms-full.txt`** *(optional, enabled by default)*: A single bundled Markdown document containing the full clean Markdown content of every included page.

### Configurable Fields
Configure these in the xStatic **Actions** dashboard and attach the action to any static site:

| Field | Editor | Default | Description |
| --- | --- | --- | --- |
| `SiteTitle` | Text | Site name / root `<title>` | Top-level `# Title` in `/llms.txt` and `/llms-full.txt`. |
| `SiteDescription` | TextArea | Root `<meta name="description">` | Concise `> Summary` blockquote under the title. |
| `GenerateFullFile` | Toggle | `true` | When enabled, also generates `/llms-full.txt`. |
| `GenerateCompanionMarkdown` | Toggle | `false` | When enabled, generates missing companion `.md` twins for HTML pages that don't already have one. |
| `UseMarkdownLinks` | Toggle | `true` | Links to companion `.md` URLs when they exist; falls back to the HTML page URL otherwise. |
| `ExcludePaths` | Text | *(none)* | Comma-separated path prefixes to exclude (e.g. `/404, /search`). |

### Example `/llms.txt` Output

```markdown
# Acme Docs

> Fast static sites built with Umbraco.

## Pages

- [Acme Static](https://acme.example.com/index.md): Fast static sites built with Umbraco.
- [About Us](https://acme.example.com/about/index.md): Our mission.

## Docs

- [Getting Started](https://acme.example.com/docs/getting-started/index.md): Quickstart guide.
```

---

## 3. Markdown Discovery / GEO Transformer

`MarkdownDiscoveryTransformer` is an `ITransformer` that injects a Markdown discovery `<link>` tag into each generated HTML page's `<head>`:

```html
<link rel="alternate" type="text/markdown" href="https://example.com/about/index.md" />
```

### Behavior
- Derives the companion Markdown URL from `<link rel="canonical">`, `<meta property="og:url">`, or falls back to `index.md` for directory-based static sites.
- Resolves root-relative URLs against the site's `TargetHostname` when configured.
- Idempotent: skips injection if `<link rel="alternate" type="text/markdown" ...>` is already present.
- Preserves existing `<link rel="canonical">` and `<script type="application/ld+json">` blocks untouched, and exposes `MarkdownDiscoveryTransformer.ValidateJsonLd(html)` for validating JSON-LD payloads.

### Using `GeoHtmlTransformerListFactory`
Select `GeoHtmlTransformerListFactory` as the **Transformer Factory** on an Export Type. It inherits `DefaultHtmlTransformerListFactory` (`CachedByTransformer`, `CroppedImageUrlTransformer`, `HostnameTransformer`) and appends `MarkdownDiscoveryTransformer` at the end so rewritten hostnames are reflected in the injected Markdown link.

---

## 4. Customizing HTML-to-Markdown Conversion

`HtmlToMarkdownConverter` is registered in DI as `IHtmlToMarkdownConverter` via `GeneratorServiceBuilder.AddDefaultHtmlGeneratorServices()`. You can replace it with your own implementation in `Program.cs` / `Startup`:

```csharp
services.AddSingleton<IHtmlToMarkdownConverter, MyCustomHtmlToMarkdownConverter>();
```
