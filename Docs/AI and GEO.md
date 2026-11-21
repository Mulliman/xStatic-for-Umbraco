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
- **`ContentSelector`** *(optional)*: Comma-separated simple selectors (`tag`, `#id`, `.class`) or raw XPath expressions starting with `//` (CSS combinators like `main > article` are not supported; invalid selectors safely fall back to auto-detection). By default, auto-detection prefers `<main>`, `[role="main"]`, or a single `<article>`, falling back to `<body>`.
- **`ExcludePaths`** *(optional)*: Comma-separated URL prefixes to skip (e.g. `/404, /search`).

---

## 2. `/llms.txt` and `/llms-full.txt` (`GenerateLlmsTxtAction`)

`GenerateLlmsTxtAction` is a built-in `IPostGenerationAction` that scans the generated static site output (`.html` and `.htm` files) and compiles:
- **`/llms.txt`**: A curated Markdown site map following the [llms.txt](https://llmstxt.org/) specification with site title, summary, and grouped section links.
- **`/llms-full.txt`** *(optional, enabled by default)*: A single bundled Markdown document containing the full clean Markdown content of every included page.

### Configurable Fields
Configure these in the xStatic **Actions** dashboard and attach the action to any static site:

| Field | Editor | Default | Description |
| --- | --- | --- | --- |
| `SiteTitle` | Text | xStatic site config name (or root `<title>`) | Top-level `# Title` in `/llms.txt` and `/llms-full.txt`. |
| `SiteDescription` | TextArea | Root `<meta name="description">` | Concise `> Summary` blockquote under the title. |
| `GenerateFullFile` | Text (`true`/`false`) | `true` | When `true`, also generates `/llms-full.txt`. |
| `GenerateCompanionMarkdown` | Text (`true`/`false`) | `false` | When `true`, generates or refreshes companion `.md` twins for HTML pages. |
| `UseMarkdownLinks` | Text (`true`/`false`) | `true` | Links to companion `.md` URLs when they exist; falls back to the HTML page URL otherwise. |
| `ExcludePaths` | Text | *(none)* | Comma-separated path prefixes to exclude (e.g. `/404, /search`, or static verification HTML files). |

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
- When used with `StaticHtmlWithMarkdownSiteGenerator`, `MarkdownDiscoveryTransformer` implements `IPageContextTransformer` and receives each page's exact relative URL automatically, combining it with `TargetHostname` when configured.
- When used with the standard `StaticHtmlSiteGenerator`, it derives the companion Markdown URL from `<link rel="canonical">` or `<meta property="og:url">` (resolving root-relative URLs against `TargetHostname`), or falls back to relative `index.md` (which assumes directory-style trailing-slash URLs such as `/about/`).
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
