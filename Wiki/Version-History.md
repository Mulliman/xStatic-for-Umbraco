The story of xStatic from a 2020 Umbraco 8 plugin to the Umbraco 18 package, with every tagged release, the features
each era added and who contributed. For what to do when you move between versions, see [Upgrading](Upgrading.md).

## Where it came from

xStatic started as an idea in 2013: a proof of concept for a high-traffic, high-security site, published for a UK
public inquiry, where the public site had to survive heavy load and could not be a live CMS. The idea stayed in a
drawer until I wanted to host a photography site on Netlify cheaply, but still edit it in Umbraco. I wrote it up
properly, as an Umbraco 8 plugin, in December 2020. I tell more of that story in the
[umbraCoffee interview](Videos-and-Talks.md#umbracoffee-160-the-origin-story).

The idea hasn't changed: editors keep using the Umbraco backoffice, and xStatic turns the published site into static
files that you can host almost anywhere. See [What is xStatic?](What-is-xStatic.md).

## Eras at a glance

| Era | Umbraco | .NET | When | Theme |
|-----|---------|------|------|-------|
| v1 | 8 | Framework 4.7.2 | Dec 2020 to mid 2021 | The first plugin: Netlify, Git and FTP, image crops, auto publish |
| v2 | 9 | 5 | Jul 2021 to Sep 2022 | Rewrite, first NuGet packages, export types and actions stored in the database |
| v3 | 10 | 6 | Oct 2022 to 2023 | Marketplace listing, CI publishing, file system deployer |
| v13 | 13 (LTS) | 8 | Jul 2024 onwards | Last AngularJS-era backoffice; kept alive as `lts/13` |
| v14 | 14 | 8 | Jul to Sep 2024 | Rebuilt for the new Lit backoffice, multi-language, user groups, Netlify site creator |
| v15 | 15 | 9 | Nov 2024 to Jul 2025 | Remote operations, single-site output |
| v16 | 16 | 9 | Jul 2025 | Alphas only, never released as stable |
| v17 | 17 (LTS) | 10 | Jan 2026 onwards | Test suite, async file access, v13 upgrade |
| v18 | 18 | 10 | Oct 2026 onwards | Failures are reported, not hidden; broad hardening |
| v19 | 19 | 11 | Nov 2026 onwards | Pre-release for Umbraco 19 |

There are no tags for v1, v2 or v12. Numbering jumped to 13 in 2024 to match Umbraco's version numbers.

## Era notes

### v1: Umbraco 8 (2020 to 2021)

The first commit is dated 5 December 2020. Within weeks it had a custom tree showing sites, a Netlify deployer, JSON
generation, download as zip and **auto publish** (11 December 2020). January 2021 added **image crops**, target
hostname rewriting, pluggable generators and transformers, and the **Git** and **FTP** deployers (both on
30 January 2021). Wildcard asset paths followed in February. This version was a .NET Framework solution with an
AngularJS dashboard.

### v2: Umbraco 9 (2021 to 2022)

A rewrite for Umbraco 9 and .NET 5. The configuration moved from code and a JSON file into the database (export
types, deployers, then actions). The **first NuGet packages** were published on 21 October 2021, followed days later
by **post-generation actions**, the better JSON generator (`BasicJsonApiGenerator`) and the plugin and information
dashboards. The v2 work merged into the main branch in June 2022.

### v3: Umbraco 10 (2022 to 2023)

Umbraco 10 and .NET 6. GitHub Actions began publishing the NuGet packages, image quality reduction was added to save
bandwidth, and the **file system deployer** appeared for easy testing. v3.0.0 (December 2022) was the Umbraco
Marketplace listing and v3.1.0 brought a new logo. The first documentation pages were written in December 2022.

### v13: Umbraco 13 (2024)

A v13 build for the Umbraco 13 LTS was released in July 2024. It continues as the `lts/13` branch, where **Heather
Floyd** added the "trust SSL" setting, document type exclusion and copying static files from outside `wwwroot`
(13.1.0, August 2025).

### v14: the Lit rebuild (2024)

Work began on 21 July 2024 and v14.0.0 shipped on 28 August 2024. The backoffice was rebuilt with Lit and Vite, as a
Razor Class Library (`xStatic.Client`). New in 14:

- Sections for Sites, Export Types, Actions, Deployment Targets, Config and Documentation
- **Multi-language** sites (August 2024)
- The `xStaticAdmin` and `xStaticNormalUser` **user groups**
- Deployment targets as their own entities

v14.1.0 (September 2024) added the **Netlify site creator**, the automatic `XStaticComposer` registration (no more
code in `Program.cs`) and the plugin listing in the Umbraco Marketplace. v14.2.0 lower-cased file names for
Linux and macOS and made SSL trust opt-in.

### v15 and v16 (2024 to 2025)

v15.0.0 (26 November 2024) moved to Umbraco 15 and .NET 9, and introduced **xStatic.RemoteOperations**, a client for
triggering xStatic from elsewhere with Umbraco API users. v15.1.0 (July 2025) added a **custom output folder name**
and single-site output, contributed by **Szabolcs Deme**. Version 16 only reached alphas; the branch was merged into
the main line in January 2026.

### v17: the .NET 10 LTS (2026)

v17.0.0 (1 February 2026) was the move to Umbraco 17 and .NET 10, plus the first **Playwright** end-to-end tests. v17.1.0
(June 2026) used parameterised SQL and async file I/O, allowed actions without parameters, let you set xStatic options in
`appsettings.json`, and fixed the backoffice for Umbraco 17.4.2. (Parallel page generation was added during this cycle and
removed again before the release.) v17.2.0 (November 2026) brought Heather Floyd's document type exclusion to 17. 17.2.1 was a build fix, and
the 17.3.0 beta added the **v13 site upgrade** and missing asset path reporting, which are part of 18.0.0 as well.
The long-term support line continues on the `lts/17` branch.

### v18: Umbraco 18 (2026)

The upgrade to Umbraco 18 landed on 2 October 2026 (18.0.0-alpha), with a beta on 17 November and the 18.0.0 release
on 23 November. See [What's new in 18.0.0](#whats-new-in-1800).

### v19: Umbraco 19 (pre-release)

Work on Umbraco 19 happens on the `feature/19` branch. The first beta, 19.0.0-beta, was published on
23 November 2026 for Umbraco 19.0.0-rc1 on .NET 11. It isn't meant for production sites yet.

## Releases

Dates are the date of the tagged commit (`git log -1 --format=%ad --date=short <tag>`). Pre-release tags are
grouped. The newest are first.

| Release | Date | Notes |
|---------|------|-------|
| v19.0.0-beta | 2026-11-23 | Beta for Umbraco 19.0.0-rc1 on .NET 11 |
| v18.0.0 | 2026-11-23 | Umbraco 18.3.2 and .NET 10, everything in 17.3.0 and 17.3.1 |
| v17.3.1 | 2026-11-23 | Media generated on a new site's first boot |
| v17.3.0 | 2026-11-23 | Cloudflare deployer, MCP server, AI/GEO output, RAG and WebMCP export, `xStatic.AI`, docs in the backoffice |
| v18.0.0-beta | 2026-11-17 | Beta of the 18 line |
| v17.3.0-beta | 2026-11-17 | v13 site upgrade, missing asset path reporting |
| v17.2.1 | 2026-11-17 | Build fix |
| v17.2.0 | 2026-11-17 | Exclude document types from generation (Heather Floyd) |
| v18.0.0-alpha | 2026-10-02 | Umbraco 18 |
| v17.1.0 | 2026-06-11 | Async file access, `appsettings.json` options, Umbraco 17.4.2 fix |
| v17.0.0 | 2026-02-01 | Umbraco 17, .NET 10, Playwright tests (betas 1 to 6 from 2026-01-29) |
| v13.1.0 | 2025-08-19 | `lts/13`: trust SSL, document type exclusion, assets outside `wwwroot` |
| v16.0.0-alpha1, alpha2 | 2025-07-22 | Umbraco 16 alphas, no stable release |
| v15.1.0 | 2025-07-08 | Custom output folder name, single-site output (Szabolcs Deme) |
| v15.0.4 | 2025-07-01 | Git deployer help: the password field means a personal access token |
| v15.0.3 | 2025-03-03 | WebP resizing fix |
| v15.0.2 | 2025-03-01 | Auto publish fix after Umbraco changed site ids from int to Guid |
| v15.0.1 | 2025-02-07 | Asset paths help text |
| v15.0.0 | 2024-11-26 | Umbraco 15, .NET 9, xStatic.RemoteOperations |
| v14.2.0 | 2024-09-08 | Lower-case file names, SSL trust only when enabled |
| v14.1.1 | 2024-09-07 | Fix for Data Types broken by xStatic |
| v14.1.0 | 2024-09-05 | Netlify site creator, automatic registration, Marketplace listing |
| v14.0.0 | 2024-08-28 | Rebuilt backoffice for Umbraco 14 |
| v13.0.1 | 2024-07-18 | Git deployer build fix |
| v13.0.0 | 2024-07-17 | Umbraco 13 |
| v3.1.1 | 2023-04-16 | Performance and template fixes (Rachel Breeze) |
| v3.1.0 | 2022-12-04 | New logo |
| v3.0.0 | 2022-12-03 | Umbraco 10, Marketplace listing |

The other tags (alphas and betas for 13.1.0, 14.0.0, 14.1.0, 14.2.0, 15.0.0, 15.1.0, 17.0.0 and 17.1.0, and
the 3.0.x tags) are in `git tag`. Tags are for pre-releases and releases only; the `Version` in each csproj is just
a local default, and the packages take their version from the tag. See
[RELEASING.md](../RELEASING.md).

## What's new in 18.0.0

18.0.0 requires **Umbraco 18.3.2 or later** and .NET 10. The theme is that xStatic now tells you when something went
wrong, where before it could report success. The [GitHub release](https://github.com/Mulliman/xStatic-for-Umbraco/releases/tag/v18.0.0)
has the same notes.

Most of the fixes below were also made on the `lts/17` branch, so they ship in **17.3.0 and 18.0.0**. They are not in the
17.3.0-beta or 18.0.0-beta pre-releases, apart from missing asset path reporting and the v13 site upgrade.

**New in 17.3.0 and 18.0.0**

- [Cloudflare Pages and R2 deployers](Deploying-to-Cloudflare.md), in the new `xStatic.Cloudflare` package.
- Companion Markdown pages, `/llms.txt` and `/llms-full.txt` ([AI and GEO](AI-and-GEO.md)).
- RAG chunk export and a WebMCP index ([RAG and WebMCP](RAG-and-WebMCP.md)).
- The `xstatic-mcp` MCP server and an agent skill ([MCP server and agent skill](MCP-Server-and-Agent-Skill.md)).
- The optional `xStatic.AI` package with a pre-deploy GEO/SEO audit ([AI integration](AI-Integration.md)).
- Relation-based auto publish for shared content ([Auto publish](Auto-Publish.md)).
- This wiki is built into the backoffice **Documentation** tab.

**Reporting and reliability**

- Pages that fail to download are reported with their URL, and no empty file is stored.
- Failed post-generation actions show as warnings and mark the run unsuccessful, under the name you gave them.
- Missing asset paths are reported instead of stopping generation.
- FTP deploys that upload nothing now fail, and existing files are overwritten.
- The Git deployer keeps your site if the first clone fails.
- Deploying before generating tells you to generate first.

**Fixes**

- Image crops work again on new installs, by signing crop URLs with Umbraco's HMAC key.
- JSON export no longer starts with a byte order mark.
- `DoNotDeletePaths` takes effect, from `appsettings.json`.
- Sites upgraded from xStatic 13 load, and are migrated automatically.
- Document types can be excluded from generation (`XStatic:ExcludeGeneratingDocTypes`).
- Media under a site's media roots is listed from the database, so it is generated on a new site's first boot (17.3.1).

**Housekeeping**

- `xStatic.UmbracoContentApi` is retired.
- Dependencies refreshed, with no known vulnerabilities (FluentFTP 55, LibGit2Sharp 0.32).
- Many more tests: around 200 unit tests, integration tests for the database and the v13 upgrade, over 30
  Playwright tests, and an FTP deployer tested against real FTP servers.
- Every pull request is tested and publishes a preview package to GitHub Packages, and a `v*` tag publishes to
  nuget.org. See [Developing xStatic](Developing-xStatic.md).

How to deal with each change is on [Upgrading](Upgrading.md#behaviour-changes-in-1800).

## Contributors

xStatic is maintained by **Sam Mullins**. Thank you to everyone who has contributed code:

- **Szabolcs Deme**: the custom output folder name and single-site output (15.1.0).
- **Heather Floyd**: the trust SSL setting, document type exclusion, copying static files from outside `wwwroot`, and
  asset path help text, on the 13 and 17 lines.
- **Adam Werner**: Linux pathing and name casing fixes (Umbraco 10), and the third-party
  [`xStatic.AWSS3`](https://github.com/adam-werner/xStatic.AWSS3) deployer for Amazon S3.
- **Rachel Breeze**: performance and template fixes (3.1.1).
- **Phil Whittaker**: serving media through Umbraco's file system provider (2021).

Some 2026 changes (performance, async I/O and parameterised SQL) were prepared by automated assistants and reviewed
before they were merged, and some recent commits are credited to Claude as co-author.

## Next steps

- [Upgrading](Upgrading.md) to move between versions
- [Videos and talks](Videos-and-Talks.md) for the walkthroughs, including the 2021 interview about the origin
- [Developing xStatic](Developing-xStatic.md) to contribute
