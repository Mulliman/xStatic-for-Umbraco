A guide for people who want to change xStatic itself: where the code lives, how to build and test it, how CI and
releases work, and how to edit this wiki. If you want to extend xStatic from your own project instead, start at
[Extending xStatic](Extending-xStatic.md).

The detailed, maintained instructions live in the repository. This page is the map, and links to them rather than
copying them:

- [CONTRIBUTING.md](../CONTRIBUTING.md): test instances, front-end workflow, Playwright, submitting changes
- [Testing.md](../Testing.md): test layers, Playwright specs, the FTP test server, CI
- [RELEASING.md](../RELEASING.md): the maintainer's release checklist
- [AGENTS.md](../AGENTS.md): rules for AI coding agents, and a good summary for people too

## Requirements

- The .NET 10 SDK
- Node.js 24 (the version CI uses) and npm, for the backoffice client
- PowerShell for the helper scripts. The `dotnet` and `npm` commands work in any shell
- Google Chrome, for the Playwright tests
- Docker, only if you want to run the FTP test server

## Repository layout

All .NET code is under `Source/XStaticCore/`, in the solution
[XStaticCore.sln](../Source/XStaticCore/XStaticCore.sln).

| Path | What it is |
|------|------------|
| `XStatic.Core/` | The engine and the **public extension API**: generators, transformers, storers, deployers, actions, repositories and the DI builders. NuGet package `xStatic.Core` |
| `XStatic/` | The Umbraco integration: `XStaticComposer`, the Management API controllers, database migrations, user group setup. NuGet package `xStatic` |
| `XStatic14/XStatic14.Client/` | The backoffice UI. TypeScript and Lit in `assets/src`, built by Vite into `wwwroot/App_Plugins/xstatic14`. NuGet package `xStatic.Client` |
| `XStatic14/XStatic14/` | An empty project that only references the client. Don't add code to it |
| `XStatic.Netlify/`, `XStatic.Git/`, `XStatic.Ftp/` | The deployers, each a separate NuGet package |
| `XStatic.RemoteOperations/` | The client library for [Remote operations](Remote-Operations.md) |
| `XStatic.Core.Tests/` | Unit tests (xUnit and Moq) |
| `XStatic.IntegrationTests/` | Integration tests (NUnit) against a real database |

Elsewhere in the repository:

| Path | What it is |
|------|------------|
| `Testing/Playwright/` | End-to-end backoffice tests |
| `Testing/Instances/`, `Testing/Scripts/` | Scripts that create local Umbraco test sites. The `Instances` folders are git-ignored |
| `Testing/Ftp/` | A Docker Compose FTP server for checking the [FTP deployer](Deploying-to-FTP.md) |
| `Wiki/` and `Tools/Wiki/` | This wiki and its checker and publisher |
| `.github/workflows/` | CI, release and wiki workflows |
| `Docs/` | A short pointer from the old documentation to this wiki |
| `Brand/`, `Meta/` | Logos and the plugin lists the backoffice reads |

For how the pieces fit together at run time, see [Architecture](Architecture.md).

## Branches

There is one branch per Umbraco major version.

| Branch | Umbraco | Status |
|--------|---------|--------|
| `master` | 18 | The latest major |
| `feature/18` | 18 | Merged into `master` at 18.0.0 |
| `lts/17` | 17 (LTS) | Long-term support |
| `lts/13` | 13 (LTS) | Long-term support |

Put a fix on the branch for the version it targets, and say which in your pull request. A fix that applies to two
versions goes on one and is cherry-picked to the other. The table in [AGENTS.md](../AGENTS.md) is kept current, so
check it before you branch.

## Build

From the repository root:

```powershell
dotnet build Source/XStaticCore/XStaticCore.sln
```

Expect no errors and a small number of existing warnings (obsolete `UrlSegment` use, legacy Netlify deployer APIs).
Don't fix those as a side effect of an unrelated change; [AGENTS.md](../AGENTS.md) lists them.

## Unit and integration tests

Unit tests are fast and need no Umbraco instance. Run them on every change:

```powershell
dotnet test Source/XStaticCore/XStatic.Core.Tests/XStatic.Core.Tests.csproj
```

Integration tests start Umbraco against a real database (SQLite by default) and replay the xStatic 13 schema to check
the [automatic v13 upgrade](Upgrading.md#v13-to-14-and-later). The script runs both suites:

```powershell
./Source/XStaticCore/run-tests.ps1
./Source/XStaticCore/run-tests.ps1 -IntegrationOnly -Filter "FullyQualifiedName~V13Upgrade"
./Source/XStaticCore/run-tests.ps1 -Database LocalDb
```

[run-tests.ps1](../Source/XStaticCore/run-tests.ps1) also accepts `-Database SqlServer` with a master connection
string. SQLite doesn't exercise the SQL Server-only widening of the `MediaRootNodes` column, so use LocalDb or
SQL Server if you change migrations. If you touch `XStatic/Db/` or the v13 upgrade, run the integration tests.

When you change logic in `XStatic.Core`, add or update unit tests. Transformers, file name generators and path
helpers are pure and easy to cover.

## Front-end

The backoffice is Lit web components using `@umbraco-cms/backoffice` and the `uui-*` components. Work in
`Source/XStaticCore/XStatic14/XStatic14.Client/assets`:

```powershell
npm ci
npx tsc --noEmit
npm run build
npm run watch
```

- `npx tsc --noEmit` type-checks. Run it on every UI change.
- `npm run build` runs `tsc` then Vite and writes into `wwwroot/App_Plugins/xstatic14`. That folder is build output, so
  don't edit it.
- `npm run watch` rebuilds on save. Pair it with a local test instance and press Ctrl+F5 in the browser.

**Don't run `npm run generate`.** It regenerates the API client in `src/api`, but the installed hey-api version can't
produce the layout the code imports, so it deletes the folder and breaks the build. When you change a controller,
update the matching methods and types in `src/api` by hand. The background is in the "Known limitation" note in
[CONTRIBUTING.md](../CONTRIBUTING.md). The same goes for `XStatic.RemoteOperations/Client.cs`, which is NSwag
generated: regenerate it, don't hand-edit it.

## Local test instances and Playwright

To run xStatic in a real Umbraco site, run `Testing/Instances/AddNew.bat`. It asks whether to use local project
references (answer **Y** when developing xStatic itself), then which Umbraco version and instance name to use, and
whether to include all extensions (the Netlify, Git, FTP and remote operations projects), then creates the site. Details are in
[CONTRIBUTING.md](../CONTRIBUTING.md).

The Playwright tests in `Testing/Playwright` need a running instance on `https://localhost:5000`, with the
credentials in `tests/00-auth.setup.ts`:

```powershell
cd Testing/Playwright
npx playwright test
```

CI doesn't run Playwright, so run it yourself before a release. The specs, their order and the FTP spec are described in
[Testing.md](../Testing.md). If you don't have an instance running, say so in your pull request instead of skipping it
silently.

## Continuous integration and releases

| Workflow | When it runs | What it does |
|----------|--------------|--------------|
| `ci.yml` | Every pull request, and pushes to `master`, `feature/**` and `lts/**` | Runs the tests, packs all packages at a preview version, and pushes them to GitHub Packages. Pull requests get a comment with install instructions |
| `release.yml` | A tag matching `v*` is pushed | Runs the tests, packs all packages at the tag's version (without the `v`) and pushes them to nuget.org using Trusted Publishing |
| `test.yml`, `pack.yml` | Called by the two above | The reusable test and pack steps |
| `wiki.yml` | Changes to `Wiki/` | Checks the wiki, and publishes it when `master` changes |
| `codeql.yml` | Every pull request, pushes to `master`, `feature/**` and `lts/**`, and weekly | Scans the C#, TypeScript and workflow files for security problems. Findings show under **Security** then **Code scanning**, and on the pull request |
| `scorecard.yml` | Pushes to `master`, and weekly | Rates the repository's security practices with the OpenSSF Scorecard, and publishes the score shown on the README |
| `dependabot-automerge.yml` | Dependabot pull requests | Turns on auto-merge for minor and patch updates, so they merge once the required checks pass. Major updates wait for a person |

Dependabot (`.github/dependabot.yml`) opens grouped update pull requests once a month for `master`, `lts/17` and
`feature/19`. It leaves Umbraco packages alone, because they are bumped together by hand. Minor and patch updates merge
themselves once the required checks pass; major updates wait for review. To report a security problem, see
[SECURITY.md](../SECURITY.md).

All seven packages are released together at one version. Releasing is the maintainer's decision, so don't tag or push
to NuGet yourself. The checklist is in [RELEASING.md](../RELEASING.md), and the history of the tags is on
[Version history](Version-History.md).

## Definition of done

1. The solution builds with no errors, and no new warnings in files you touched.
2. The unit tests pass, and you added tests for logic you changed.
3. If you touched `XStatic/Db/` or the v13 upgrade, the integration tests pass.
4. If you touched the UI, `npx tsc --noEmit` passes.
5. Say in your pull request which checks you ran and which you couldn't.

## Rules worth knowing

- **Everything public in `XStatic.Core` is public API.** Third-party plugins use it. Don't change or remove public
  members, constructor signatures or virtual methods in a minor release. Add an overload, a new interface or a new
  constructor that keeps the old one.
- **Database migrations are append-only.** Add a new step at the end of the plan in
  [XStaticDatabaseMigrationPlan.cs](../Source/XStaticCore/XStatic/Db/XStaticDatabaseMigrationPlan.cs). Never edit or
  reorder steps that have shipped, and keep SQLite and SQL Server both working.
- **New deployers, generators, transformers and actions follow the plugin pattern.** Don't special-case them in the core.
- **Every new Management API endpoint needs an authorisation attribute.** See [Management API](Management-API.md).
- **Don't add dependencies without saying why.** Prefer what Umbraco already ships.
- **A new setting** gets a property on `XStaticGlobalSettings`, a builder method in `XStaticApp.cs` and a row in
  [Configuration](Configuration.md).
- Don't commit secrets, test instance folders or logs.

## Editing this wiki

The wiki is written in the `Wiki/` folder as plain Markdown, and published to the GitHub wiki by a workflow. **Don't
edit pages on github.com**, because the next publish overwrites them.

1. Edit or add a page in `Wiki/`. File names use `Page-Name.md`.
2. Follow `Tools/Wiki/STYLE.md` for voice and page shape. In short: write to "you", no `#` title, British English, a
   language on every code fence.
3. Add new pages to `Wiki/_Sidebar.md`.
4. Link other pages as `Page-Name.md` or `Page-Name.md#anchor`, and source files as `../Source/...` paths. The
   build turns both into the right GitHub links.
5. Put images in `Wiki/images/`.
6. Run the check from the repository root:

   ```powershell
   node Tools/Wiki/wiki.mjs check
   ```

   It fails on broken page links and anchors, missing images, links to files that don't exist, pages missing from the
   sidebar and code fences without a language.
7. Open a pull request. The `wiki.yml` workflow runs the same check on every pull request that touches `Wiki/` or
   `Tools/Wiki/`, and publishes to the wiki repository when `master` changes.

`Tools/Wiki/CONTENT-PLAN.md` records which page owns which topic, so check it before you add something that may
already have a home.

The wiki repository has to exist before the first publish: enable Wikis in the repository settings and save any first
page on github.com.

## Next steps

- [Architecture](Architecture.md) to understand the pipeline you are changing
- [Extending xStatic](Extending-xStatic.md) for the public extension points
- [Glossary](Glossary.md) for the terms used in the code and the UI
