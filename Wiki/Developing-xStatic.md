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
| `.github/workflows/` | CI, release and security workflows |
| `Brand/` | Logos |
| `Meta/` | Older hosted plugin and help lists. The backoffice no longer reads them: its Documentation dashboard uses `docs-bundle.json`, compiled from `Wiki/` and the official packages by `Tools/Wiki/compile-client-docs.mjs` |

For how the pieces fit together at run time, see [Architecture](Architecture.md).

## Branches

There is one branch per Umbraco major version.

| Branch | Umbraco | Status |
|--------|---------|--------|
| `feature/19` | 19 | Pre-release (19.0.0-beta, .NET 11) |
| `master` | 18 | The latest major |
| `feature/18` | 18 | Merged into `master` at 18.0.0 |
| `lts/17` | 17 (LTS) | Long-term support |
| `lts/13` | 13 (LTS) | Historical, no longer receiving security fixes |

Changes flow in one direction. Land your work on `master` first and say in your pull request which versions it
applies to. Bug and security fixes that also apply to 17 are cherry-picked down to `lts/17` (with `git cherry-pick -x`),
and `master` is merged up into `feature/19`. The table in [AGENTS.md](../AGENTS.md) is kept current, so
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
npm run check
npm run build
npm run watch
```

- `npm run check` type-checks, lints and runs the Vitest unit tests. Run it on every UI change. ESLint treats `var`,
  explicit `any` and unused variables as errors.
- `npm test` runs only the unit tests, and `npm run test:coverage` adds a coverage report.
- `npm run build` runs `tsc` then Vite and writes into `wwwroot/App_Plugins/xstatic14`. That folder is build output, so
  don't edit it.
- `npm run watch` rebuilds on save. Pair it with a local test instance and press Ctrl+F5 in the browser.

### How the client is organised

| Path in `assets/src` | What it is |
|----------------------|------------|
| `index.ts`, `manifests.ts` | The backoffice entry point. It registers every manifest and points the API client at Umbraco's auth settings |
| `sections/`, `dashboards/` | The **xStatic** section and its dashboards. Each dashboard is an `<umb-body-layout>` around one grid element |
| `areas/<area>/` | One folder per dashboard area: sites, export types, deployment targets, actions, config and docs |
| `areas/<area>/context.*.ts` | A global context that loads and saves that area's data through `src/api` |
| `areas/<area>/element.*.ts` | The grid, the cards and the "Create new" card |
| `areas/<area>/dialog.*.ts` | The create and edit sidebars (`UmbModalBaseElement`) |
| `areas/<area>/*-form.ts` | Pure functions for each dialog: the properties it shows, the mapping between the saved model and the form values, and validation. Unit-test these |
| `property-editors/` | Custom property editor UIs: password, Netlify subdomain and the dynamic forms that show a deployer's or action's fields |
| `conditions/` | The xStatic admin and normal user conditions that show or hide dashboards |
| `elements/` | Shared elements: the dashboard grid, the details table, the loader, the validation wrapper and the dialog layout |
| `code/` | Shared helpers: form value helpers, card styles, the config change notifier and date formatting |
| `api/` | The API client. Edit it by hand (see below) |

### Conventions

- **Elements extend `UmbLitElement`.** Import Lit from `@umbraco-cms/backoffice/external/lit`, never from `lit`
  directly, so the backoffice and xStatic share one copy.
- **Get a context once with `await this.getContext(TOKEN)`** in click handlers, for example to open a modal through
  `UMB_MODAL_MANAGER_CONTEXT`. Use `this.consumeContext(TOKEN, callback)` only in a constructor, where you want to
  keep receiving the context. Calling `consumeContext` in a handler adds a new consumer on every click.
- **Share state with observables, not `window` events.** Each area's context holds its data in `UmbArrayState` or
  `UmbObjectState`, and elements read it with `this.observe(...)`. When export types, deployment targets or actions
  change, their contexts call `notifyConfigChanged()` from `code/config-changes.ts`, and the site context reloads
  what the site dialog needs.
- **Keep dialogs thin.** Build the property list in the area's `*-form.ts` module, rebuild it in `willUpdate` only when
  what it depends on changes, and render it with `renderFormDialog` from `elements/form-dialog.ts`.
- **Use UUI design tokens for colours and sizes**, such as `--uui-color-surface-alt`, `--uui-color-danger` and
  `--uui-size-space-4`, so the UI works in the light, dark and high-contrast themes. Don't hard-code colours, don't use
  inline `style` attributes, and don't override UUI tokens such as `--uui-size-layout-1`. Card styles live in
  `code/styles.ts`.
- **Every `uui-button` has a `label`.** Put an icon inside it as `<uui-icon name="...">` with the visible text;
  `uui-button` has no `icon` attribute. Playwright finds buttons by their label, so keep labels stable.
- **Add `data-test-id`** to cards and buttons, and `data-test-alias` to form properties (`renderFormDialog` does that
  for you), so tests don't depend on layout.

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
| `release.yml` | A tag matching `v*` is pushed, or a manual dry run | Runs the tests and the Playwright E2E suite (`e2e.yml`), packs all packages at the tag's version (without the `v`) and pushes them to nuget.org using Trusted Publishing |
| `test.yml`, `pack.yml` | Called by the two above | The reusable test and pack steps |
| `e2e.yml` | Called by `release.yml` only | Creates a throwaway Umbraco site, starts it and runs the Playwright suite against it. A failure stops the release |

All nine packages are released together at one version. Releasing is the maintainer's decision, so don't tag or push
to NuGet yourself. The checklist is in [RELEASING.md](../RELEASING.md), and the history of the tags is on
[Version history](Version-History.md).

## Definition of done

1. The solution builds with no errors, and no new warnings in files you touched.
2. The unit tests pass, and you added tests for logic you changed.
3. If you touched `XStatic/Db/` or the v13 upgrade, the integration tests pass.
4. If you touched the UI, `npm run check` passes.
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

The wiki is written in the `Wiki/` folder as plain Markdown, and published from `master` as an HTML docs site on
GitHub Pages (https://mulliman.github.io/xStatic-for-Umbraco/).

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
7. Open a pull request. CI (`test.yml`) runs the same check on every pull request, and the docs site is republished
   from `master`.

`Tools/Wiki/CONTENT-PLAN.md` records which page owns which topic, so check it before you add something that may
already have a home.

The docs site needs one repository setting before the first publish: under **Settings** then **Pages**, set
**Source** to **GitHub Actions**.

## Next steps

- [Architecture](Architecture.md) to understand the pipeline you are changing
- [Extending xStatic](Extending-xStatic.md) for the public extension points
- [Glossary](Glossary.md) for the terms used in the code and the UI
