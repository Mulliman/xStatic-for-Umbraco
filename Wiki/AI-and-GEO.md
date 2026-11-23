Make your static Umbraco site ready for AI agents and Generative Engine Optimisation (GEO) with companion Markdown files, `/llms.txt` and `/llms-full.txt`, and Markdown discovery `<link>` tags. Every component is built into `xStatic.Core` with no extra packages and is opt-in per export type or per site, so existing sites keep working unchanged.

## At a glance

| Feature | Component | Where you configure it |
|---------|-----------|------------------------|
| Companion `.md` twins per page | `StaticHtmlWithMarkdownSiteGenerator` or `GenerateCompanionMarkdownAction` | **Export Types** or **Actions** |
| `/llms.txt` and `/llms-full.txt` | `GenerateLlmsTxtAction` | **Actions** |
| `<link rel="alternate" type="text/markdown">` in `<head>` | `MarkdownDiscoveryTransformer` via `GeoHtmlTransformerListFactory` | **Export Types** |

All components are registered automatically by `XStaticComposer` when you use the default setup (`AddXStatic().Automatic()`). No `Program.cs` edits are needed.

## Companion Markdown output (.md twins)

AI agents and edge layers that negotiate `Accept: text/markdown` read clean Markdown more reliably than full HTML with navigation, scripts and layout chrome. xStatic can emit a `.md` twin next to every `.html` page (for example `about/index.html` produces `about/index.md`).

The built-in `HtmlToMarkdownConverter` ([source](../Source/XStaticCore/XStatic.Core/Generator/Markdown/HtmlToMarkdownConverter.cs)) strips `nav`, `header`, `footer`, `aside`, `script`, `style`, hidden elements and landmark boilerplate, prefers `<main>` or `<article>`, and converts headings, lists, tables, links and code blocks to Markdown.

You can enable `.md` twins in two ways.

### Option A: Per export type (recommended for full GEO setup)

1. Open the **xStatic** section and select the **Export Types** tab.
2. Select **Create new Export Type** (or edit an existing one).
3. Enter a **Name**, for example `HTML + Markdown (GEO)`.
4. Set **Generator** to `StaticHtmlWithMarkdownSiteGenerator`.
5. Set **Transformer Factory** to `GeoHtmlTransformerListFactory` (adds Markdown discovery tags as well as the standard HTML transformers).
6. Set **File Name Generator** to `EverythingIsIndexHtmlFileNameGenerator`.
7. Select **Submit**, then assign this export type to your site in the **xStatic Sites** tab.

Each generated page is transformed, written as `.html`, and simultaneously converted to its `.md` twin.

### Option B: Per site with a post-generation action

If you prefer to keep the standard **HTML Website** export type:

1. Open **xStatic > Actions** and select **Create new Action**.
2. Choose `GenerateCompanionMarkdownAction` as the **Action Type**.
3. Optionally configure:
   - **ContentSelector**: comma-separated simple selectors (`tag`, `#id`, `.class`) or XPath expressions starting with `//` (for example `main, #content`). Leave blank for automatic `<main>` / `<article>` / `<body>` detection. CSS combinators such as `main > article` are not supported; invalid selectors fall back to automatic detection.
   - **ExcludePaths**: comma-separated URL prefixes to skip, such as `/404, /search`.
4. Select **Submit**, tick the action under **Post Generation Actions** on your site, and generate.

## /llms.txt and /llms-full.txt

`GenerateLlmsTxtAction` ([source](../Source/XStaticCore/XStatic.Core/Actions/GenerateLlmsTxtAction.cs)) scans the generated `.html` and `.htm` files in your site's output folder and writes:

- `/llms.txt`: a structured Markdown site index following the [llms.txt](https://llmstxt.org/) convention, with a site title, summary blockquote and links grouped by top-level section.
- `/llms-full.txt`: a single Markdown file combining the clean Markdown content of every included page (enabled by default).

### Set it up

1. Open **xStatic > Actions** and select **Create new Action**.
2. Enter an **Action Name**, such as `Generate llms.txt`.
3. Choose `GenerateLlmsTxtAction` as the **Action Type**.
4. Configure any fields you want to customise (every field is optional):

| Field | Default | Meaning |
|-------|---------|---------|
| **SiteTitle** | Site name in xStatic (or root `<title>`) | Top-level `# Title` heading in `/llms.txt` and `/llms-full.txt`. |
| **SiteDescription** | Root `<meta name="description">` | Summary `>` blockquote shown under the title. |
| **GenerateFullFile** | `true` | Type `true` or `false`. When `true`, also writes `/llms-full.txt`. |
| **GenerateCompanionMarkdown** | `false` | Type `true` or `false`. When `true`, writes or refreshes `.md` twins if you are not already using `StaticHtmlWithMarkdownSiteGenerator`. |
| **UseMarkdownLinks** | `true` | Type `true` or `false`. Links to `.md` files when they exist and falls back to the HTML URL otherwise. |
| **ExcludePaths** | none | Comma-separated URL prefixes to omit, such as `/404, /search`. |

5. Select **Submit**, attach the action to your site under **Post Generation Actions**, and select **Generate**.

### Example output

```markdown
# Acme Docs

> Fast static sites built with Umbraco.

## Pages

- [Home](https://acme.example.com/index.md): Fast static sites built with Umbraco.
- [About](https://acme.example.com/about/index.md): Our mission.

## Blog

- [Launch Post](https://acme.example.com/blog/launch-post/index.md): Introducing Acme.
```

## Markdown discovery transformer

`MarkdownDiscoveryTransformer` ([source](../Source/XStaticCore/XStatic.Core/Generator/Transformers/MarkdownDiscoveryTransformer.cs)) inserts a Markdown discovery tag into each generated HTML page's `<head>`:

```html
<link rel="alternate" type="text/markdown" href="https://example.com/about/index.md" />
```

How it behaves:

- With `StaticHtmlWithMarkdownSiteGenerator`, it receives each page's exact relative URL via `IPageContextTransformer` and combines it with your site's **Target Hostname** when set.
- With the standard `StaticHtmlSiteGenerator`, it reads `<link rel="canonical">` or `<meta property="og:url">`, or falls back to relative `index.md`.
- It is idempotent: if `<link rel="alternate" type="text/markdown" ...>` already exists in `<head>`, it leaves it untouched.
- Existing `<link rel="canonical">` and `<script type="application/ld+json">` tags are preserved untouched. You can also call `MarkdownDiscoveryTransformer.ValidateJsonLd(html)` in your own code or tests to check JSON-LD blocks.

Select `GeoHtmlTransformerListFactory` on your export type to run `MarkdownDiscoveryTransformer` automatically after the standard HTML transformers (`CachedByTransformer`, `CroppedImageUrlTransformer` and `HostnameTransformer`).

## Customising HTML-to-Markdown conversion

`HtmlToMarkdownConverter` is registered in dependency injection as `IHtmlToMarkdownConverter`. To swap it for your own converter, register your implementation in `Program.cs`:

```csharp
using XStatic.Core.Generator.Markdown;

builder.Services.AddSingleton<IHtmlToMarkdownConverter, MyCustomHtmlToMarkdownConverter>();
```

## Next steps

- Export structured chunks and a static agent index with [RAG and WebMCP](RAG-and-WebMCP.md).
- Serve `.md` files with `Content-Type: text/markdown` and `Vary: Accept` headers using [Deploying to Cloudflare](Deploying-to-Cloudflare.md).
- Run automated pre-deploy GEO/SEO checks with [AI integration](AI-Integration.md).
