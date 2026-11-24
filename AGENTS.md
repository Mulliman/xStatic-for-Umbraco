# AGENTS.md — xStatic for Umbraco

xStatic is a static site generator package for Umbraco CMS. Editors keep using the Umbraco backoffice; xStatic
renders the published site (HTML, or JSON via export types), runs transformers over the output, stores it in a
staging folder, deploys it (Netlify, Git, FTP, …) and runs post-generation actions.

This file is the source of truth for agents. Keep it short, accurate and verified — if you change a command,
path or convention below, update this file in the same change.

## Versions and branches

| Branch       | Umbraco | .NET   | Package version | Status                                |
|--------------|---------|--------|-----------------|---------------------------------------|
| `master`     | 18      | net10.0| 18.x            | Latest major                          |
| `feature/19` | 19 (RC) | net11.0| 19.0.0-beta     | Beta (this branch), Umbraco 19 is short-term support |
| `feature/18` | 18      | net10.0| 18.x            | Merged into `master` at 18.0.0        |
| `lts/17`     | 17 (LTS)| net10.0| 17.x            | Long-term support                     |
| `lts/13`     | 13 (LTS)| net8.0 | 13.x            | Long-term support                     |
| `feature/NN` | NN      |        |                 | Older majors, historical              |

- One branch per Umbraco major. Put fixes on the branch for the version they target and say which in the PR.
  A fix that applies to 17 and 18 goes on `lts/17` and is cherry-picked forward (or the other way round).
- All Umbraco package references in a branch use the same version (currently `19.0.0-rc1` on `feature/19`, also
  the minimum Umbraco version consumers need). Bump them together, along with `@umbraco-cms/backoffice` in the
  client's `package.json`.
- Check dependencies with `dotnet list Source/XStaticCore/XStaticCore.sln package --vulnerable --include-transitive`
  (it should report none) and `npm audit` in the client folder.

## Repository map

All .NET code lives under `Source/XStaticCore/` (solution: `XStaticCore.sln`).

| Path | What it is |
|------|------------|
| `XStatic.Core/` | Engine and **public extension API**: generators, transformers, storers, deployers, actions, repositories, DI builders (`App/`). NuGet: `XStatic.Core`. |
| `XStatic/` | Umbraco integration: `XStaticComposer`, Management API controllers (`Controllers/`), DB migrations (`Db/`), user-group setup (`Security/`). NuGet: `XStatic`. |
| `XStatic14/XStatic14.Client/` | Backoffice UI (Razor Class Library). TypeScript/Lit source in `assets/src`, built by Vite into `wwwroot/App_Plugins/xstatic14`. NuGet: `XStatic.Client`. |
| `XStatic14/XStatic14/` | Empty shim project that only references the client. No code — don't add any. |
| `XStatic.Netlify/`, `XStatic.Git/`, `XStatic.Ftp/`, `XStatic.Cloudflare/` | Deployer plugins, each a separate NuGet package. |
| `XStatic.RemoteOperations/` | Client library for triggering xStatic remotely (JWT auth). |
| `XStatic.Core.Tests/` | xUnit + Moq unit tests. Fast, no Umbraco instance needed. |
| `XStatic.IntegrationTests/` | NUnit tests on `Umbraco.Cms.Tests.Integration` against a real DB (SQLite by default). |
| `Testing/Playwright/` | End-to-end backoffice tests. Need a running Umbraco instance. |
| `Testing/Scripts/`, `Testing/Instances/AddNew.bat` | Spin up local Umbraco test sites (`Testing/Instances/*` is gitignored). |
| `Testing/Ftp/` | Docker Compose FTP server (vsftpd) for checking the FTP deployer by hand or with Playwright spec 13. |
| `Wiki/` | The user and developer documentation, published from `master` as an HTML docs site on GitHub Pages (https://mulliman.github.io/xStatic-for-Umbraco/). Flat Markdown pages plus `_Sidebar.md`; style guide, content plan and checker in `Tools/Wiki/`. `Docs/` only points to it now. |
| `.github/workflows/` | `ci.yml`: every PR and branch push is tested, packed at a preview version and pushed to GitHub Packages. `release.yml`: a `v*` tag is tested, packed and pushed to nuget.org. Both use the reusable `test.yml` and `pack.yml`. Details: `Testing.md`; release steps: `RELEASING.md`. |

## Commands

Run from the repository root unless stated. They're Windows/PowerShell-first, but the `dotnet` and `npm` commands
also work in bash.

```powershell
# Build everything (expect 0 errors and about 8 existing warnings — see Known issues). Needs the .NET 11 SDK.
dotnet build Source/XStaticCore/XStaticCore.sln

# Unit tests — fast, run these on every change
dotnet test Source/XStaticCore/XStatic.Core.Tests/XStatic.Core.Tests.csproj

# Unit + integration tests (integration uses SQLite by default; -Database LocalDb|SqlServer also supported)
./Source/XStaticCore/run-tests.ps1
./Source/XStaticCore/run-tests.ps1 -IntegrationOnly -Filter "FullyQualifiedName~V13Upgrade"

# Frontend (from Source/XStaticCore/XStatic14/XStatic14.Client/assets)
npm ci
npm run check         # tsc --noEmit + eslint + vitest, run on every UI change
npm test              # Vitest unit & Lit component tests
npm run build         # tsc + vite build into ../wwwroot/App_Plugins/xstatic14
npm run watch         # dev loop against a local test instance
```

Playwright E2E (`Testing/Playwright`, `npx playwright test`) needs a local Umbraco instance on
`https://localhost:5000` with the credentials in `tests/00-auth.setup.ts`; see `Testing.md`. Don't try to run it
unless such an instance is running — say so instead.

### Definition of done

1. `dotnet build` of the solution has 0 errors and no new warnings in the files you touched.
2. Unit tests pass. Add or update tests for any logic you changed in `XStatic.Core` (most of it is untested;
   transformers, file-name generators and path helpers are pure and easy to cover).
3. If you touched `XStatic/Db/` or V13 upgrade code, run the integration tests too.
4. If you touched the UI, `npm run check` passes with no new ESLint warnings in the files you touched.
5. Say which checks you ran and which you couldn't (for example, Playwright without an instance).

## Do not edit / generated code

- `XStatic.RemoteOperations/Client.cs` — NSwag-generated (about 4,700 lines). Regenerate it; don't hand-edit it.
- `XStatic14.Client/assets/src/api/` — the API client the backoffice uses. **Don't run `npm run generate`.**
  The installed hey-api version can't produce the layout the code imports (`V1Service`, `core/OpenAPI.ts`), so
  it would delete and rewrite the folder and break the build. When you change a controller, update the matching
  methods and types here by hand. (Background: `CONTRIBUTING.md`, "Known limitation".)
- `XStatic14.Client/wwwroot/App_Plugins/xstatic14/` — Vite build output.
- `bin/`, `obj/`, `node_modules/`, `Testing/Instances/`, Playwright `test-results/` and `playwright-report/`.

## Architecture

### Pipeline
1. **Generate** — `IGenerator` (`XStatic.Core/Generator`). `GeneratorBase` fetches each published page over HTTP
   from the running site, so xStatic needs a server-rendered (Razor) site. `BasicJsonApiGenerator` produces JSON.
2. **Transform** — `ITransformer.Transform(string, IUmbracoContext)`, built per site by an `ITransformerListFactory`
   (`DefaultHtmlTransformerListFactory`, `DefaultJsonTransformerListFactory`).
3. **Name and store** — `IFileNameGenerator`, `IImageCropNameGenerator`, `IStaticSiteStorer` (`Generator/Storage`).
4. **Deploy** — `IDeployer.DeployWholeSite(folderPath)`. Each deployer has an `IDeployerDefinition` (id, name and
   fields shown in the UI) and is discovered through `IDeployerAutoInstaller`, by reflection over loaded assemblies.
5. **Post-generation actions** — `IPostGenerationAction` (`XStatic.Core/Actions`), created by `IActionFactory`.

The whole run is coordinated by `Generator/Processes/RebuildProcess.cs` and `Generator/Jobs/JobBuilder.cs`.
`AutoPublish/` regenerates the site when content is published.

### Registration
- `XStaticComposer` calls `services.AddXStatic().Automatic().UseSecureUserGroups().Build()` **unless the host app
  has already registered `ISitesRepository`**. That check is how consumers opt out and configure xStatic
  themselves through the builders in `XStatic.Core/App` (`XStaticApp`, `GeneratorServiceBuilder`,
  `DeployServiceBuilder`). Keep that behaviour.

### Backoffice API
- Controllers live in `XStatic/Controllers` and follow this pattern: `[ApiController]`, `[ApiVersion("1.0")]`,
  `[MapToApi("xstatic-v1")]`, `[JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]`, a route of
  `api/v{version:apiVersion}/xstatic/<area>`, and either `[AuthorizeAdmin]` (deployment targets, actions) or
  `[AuthorizeNormalUser]` (sites, generate, deploy, download). `XStaticConfigController` uses the equivalent
  `[Authorize(XStaticRoles.XStaticNormalUserGroup)]`, which means its export-type create, update and delete
  endpoints are open to normal users. That's intended (confirmed by the maintainer); don't tighten it. Every new
  endpoint needs one of the two attributes.
- OpenAPI document: `/umbraco/openapi/xstatic-v1.json`.
- Authentication (Umbraco 19): the backoffice signs users in with a cookie (`Constants.Security.BackOfficeAuthenticationType`)
  and no longer gives the UI a bearer token; API users (client credentials, used by `XStatic.RemoteOperations`)
  still use OpenIddict bearer tokens. The xStatic policies in `Controllers/Attributes` accept both schemes, and the
  client (`src/index.ts`) sends credentials instead of a token. Keep both when changing auth.
- Backoffice dropdowns use `Umb.PropertyEditorUi.Dropdown.Single`. In Umbraco 19 `Umb.PropertyEditorUi.Dropdown` is
  a multi-select list.

### Database
- Settings are stored in Umbraco's database. Migrations are defined in `XStatic/Db/XStaticDatabaseMigrationPlan.cs`.
  **Append-only:** add a new `.To<YourMigration>("UniqueState")` step at the end, and never edit or reorder
  steps that have shipped. Keep SQLite and SQL Server both working (see `XStaticMigrationBase`).

## Rules

- **Everything public in `XStatic.Core` is public API** used by third-party plugins and consumers' own code.
  Don't change or remove public interface members, constructor signatures or virtual methods in a minor release.
  To add something, add a new interface, an overload, a default interface method, or a new constructor that keeps
  the old one (`[Obsolete]` is fine).
- New deployers, generators, transformers or actions follow the existing plugin pattern (see the `Writing-a-*` wiki pages and the
  Netlify, Git and FTP projects). Don't special-case them inside the core.
- Backoffice UI: Lit web components using `@umbraco-cms/backoffice` and the `uui-*` component library. Don't
  add other UI frameworks.
- Don't add NuGet or npm dependencies without saying why in the PR. Prefer what Umbraco already ships.
- **Keep the wiki true.** When you change behaviour, a setting, a UI label, an endpoint or an extension interface,
  update the wiki pages that describe it in the same change (`Tools/Wiki/CONTENT-PLAN.md` says which page owns
  which topic). Follow `Tools/Wiki/STYLE.md`, keep C# samples compiling, and run `node Tools/Wiki/wiki.mjs check`.
- Global settings live in `XStaticGlobalSettings`, bound from the `XStatic` section of appsettings and read through
  `IOptions<XStaticGlobalSettings>`. A new setting gets a property there, a builder method in `XStaticApp.cs`, and a
  row in `Wiki/Configuration.md`. Don't read `ConfigurationManager.AppSettings`; Umbraco sites have no `app.config`.
- Don't commit secrets, test-instance folders or logs.
- New NuGet package? Add its csproj to the project list in the Pack step of `.github/workflows/pack.yml`.
  The `<Version>` in each csproj is only the local default; releases take their version from the tag.
- Don't tag releases or push to NuGet yourself. Releasing is the maintainer's decision; `RELEASING.md` has the checklist you can prepare for.

## Known issues (don't treat these as regressions)

- About 8 build warnings already exist. Don't fix them as a side effect of an unrelated change:
  - `CS0618 IPublishedContent.UrlSegment` is obsolete (in `StaticHtmlSiteGenerator` and `BasicJsonApiGenerator`).
    It must move to `GetUrlSegment()` on `IDocumentUrlService` before Umbraco 20, which removes it.
  - `SYSLIB0014` / `SYSLIB0021` in `NetlifyDeployerLegacy.cs`.
  - `CS0108` in `DeploymentTargetEditorModel`.
- `package.json` `overrides` pin patched `dompurify` and `js-yaml` (pulled in by dev tooling); remove them once
  upstream catches up.

- Unit test coverage is low. Improving it is welcome, but keep it in separate commits from behaviour changes.
- `Testing.md` and `CONTRIBUTING.md` examples mention older Umbraco versions; the steps still apply.
