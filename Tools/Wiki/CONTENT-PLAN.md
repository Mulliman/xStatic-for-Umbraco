# Wiki content plan

This is the plan the wiki was first built from (November 2026). It records what existed before, what the videos
add, and which page owns which topic, so later changes have a clear home. Update the page table when you add
or rename a page.

## What existed before

**sammullins.co.uk/software/xstatic-for-umbraco** has 17 pages: a landing page ("Is xStatic for you?"), five
how-tos (first site, Netlify, Git, FTP, image crops), troubleshooting, "Extending xStatic v1" and the "Extending
xStatic v2+" index with eight sub-pages (build process, deploy process, actions, deployers, file name generation,
generators, site storers, transformers). The style is friendly, practical and written to "you". Short intros lead
into numbered steps, with honest limitation lists and British spelling. It carries no version numbers, and much of
it predates Umbraco 14:

- `Startup.cs` / `ConfigureServices` registration (no code has been needed since 14.1; `XStaticComposer` does it).
- `web.config` app settings (`xStatic.TrustSsl`, `xStatic.DoNotDeletePaths`), now `XStatic:*` in `appsettings.json`.
- An `App_Data` output folder (now `umbraco/Data/xStatic/output`).
- The v1 JSON config file and the AngularJS dashboard wording.
- Deployer samples with `IEnumerable<string>` fields (now `DeployerField`).

**`Docs/` in the repo** held nine short extension pages (one of them empty) and `Configuration.md`. Their content
has moved into the wiki pages below, and the folder has been removed.

**The backoffice Documentation dashboard** reads `Meta/help.json` (hosted on xstaticplugins.netlify.app), which
links to the docs site (https://mulliman.github.io/xStatic-for-Umbraco/).

## What the videos add

All seven videos are public and can be embedded or linked (checked through YouTube oEmbed, November 2026).

| Video | Still accurate? | Context the code doesn't give |
|-------|-----------------|------------------------------|
| xStatic 14 - Get Started (2024) | Mostly. Registering in `Program.cs` is no longer needed, and the sections still match | Best walkthrough of the UI; user group setup |
| xStatic 14 - What's new? (2024) | Yes, as a trailer | None |
| Multi-language sites (2024) | Yes | Umbraco-side setup (languages, vary by culture, culture and hostnames), root `index.html` copy trick |
| 14.1 Speedrun (2024) | Yes | Package Script Writer install; Netlify site creator end to end |
| Umbraco 15 static failover (2024) | Concept yes; code lives outside this repo | Aspire + YARP failover architecture, Azure Function with RemoteOperations, form-stripping transformer |
| Netlify in 5 minutes (2020, v1) | No, Umbraco 8 beta | History only |
| umbraCoffee #160 (2021) | Historical | Origin story (2013 proof of concept for a high-traffic public inquiry site), the reasons behind the design |

The videos are linked from the page they illustrate and collected on [Videos-and-Talks](../../Wiki/Videos-and-Talks.md).

## Audience paths

1. **Evaluator**: Home, What-is-xStatic, Videos-and-Talks, FAQ.
2. **Site builder / admin**: Installation, Your-First-Static-Site, then the "Using xStatic" pages and a deployer page.
3. **Editor**: Generating-and-Deploying, Auto-Publish.
4. **Developer extending xStatic**: Architecture, then the Extending pages and Management-API.
5. **Contributor**: Developing-xStatic, and the repo's CONTRIBUTING, Testing and RELEASING files.

## Pages

| Page | Owns |
|------|------|
| Home | Welcome, pick-your-path links, versions table |
| What-is-xStatic | What it does, who it's for, how it works (diagram), what it won't do |
| Installation | Requirements, packages, NuGet install, what happens on first start, manual registration pointer |
| Your-First-Static-Site | Tutorial: create a site, generate, look at the output, deploy to a folder |
| Backoffice-Tour | Every section, dashboard and button, with who sees it |
| Sites | Every site field and what it does |
| Export-Types | Generator + transformer list + file namer, the built-in HTML type, making a JSON type |
| Deployment-Targets | What a target is, creating, editing, the Netlify creator, secrets |
| Post-Generation-Actions | Built-in actions, fields, order, failures |
| Generating-and-Deploying | Generate, deploy, download, clean up, results and warnings, where files go |
| Auto-Publish | When it runs, what it does, caveats |
| Asset-Paths | Folders, files, wildcards, outside wwwroot, missing path reporting |
| Image-Crops | Crop syntax, file names, HMAC signing, the transformer |
| Multi-Language-Sites | Cultures, folder layout, root index copy |
| User-Groups-and-Security | xStaticAdmin / xStaticNormalUser, what each can do, the root user, API auth |
| Configuration | `XStatic` appsettings section and builder methods |
| Deploying-to-a-Folder | File system deployer |
| Deploying-to-Netlify | Netlify deployer, site creator, 404 action |
| Deploying-with-Git | Git deployer, GitHub Pages, tokens, limitations |
| Deploying-to-FTP | FTP deployer, mirror behaviour, passive mode, test server |
| Deploying-to-Cloudflare | Cloudflare Pages Direct Upload, Project Creator, R2 deployer, `_headers` and `_redirects` actions |
| Remote-Operations | API users, the client package, scheduled builds |
| AI-and-GEO | Companion `.md` twins, `/llms.txt`, `/llms-full.txt`, `MarkdownDiscoveryTransformer`, `GeoHtmlTransformerListFactory` |
| RAG-and-WebMCP | Static RAG chunk exporter (`Jsonl`, `Json`, `Markdown`), `webmcp-index.json`, `IVectorStorePusher` |
| MCP-Server-and-Agent-Skill | Official `xstatic-mcp` MCP server, API user setup, client configs, xStatic v17+ Agent Skill |
| AI-Integration | Optional `xStatic.AI` package, `AiPreDeployAuditAction`, `IXStaticAIToolProvider` for `Umbraco.AI.Agent` |
| Static-Failover-Site | Recipe from the Umbraco 15 video |
| JSON-Export | Headless JSON output |
| Architecture | Pipeline in depth, jobs, discovery, registration |
| Extending-xStatic | Extension points overview, manual registration with the builders |
| Writing-a-Transformer | ITransformer, transformer list factories |
| Writing-a-Deployer | IDeployer, definition, fields, auto installer, packaging |
| Writing-a-Post-Generation-Action | IPostGenerationAction, editable fields, registration |
| Writing-a-Generator | IGenerator, GeneratorBase |
| File-Name-Generators | IFileNameGenerator, IImageCropNameGenerator |
| Site-Storers | IStaticSiteStorer, single-site output |
| Deployment-Target-Creators | IDeploymentTargetCreator |
| Management-API | Every endpoint, auth, OpenAPI |
| Upgrading | Upgrade notes per major, v13 to 17/18 data upgrade |
| Version-History | Eras, releases, recent changes |
| Troubleshooting | Symptoms to fixes |
| FAQ | Short answers |
| Videos-and-Talks | All videos with notes on what is current |
| Glossary | Terms |
| Developing-xStatic | Contributor overview: build, tests, CI, release |
