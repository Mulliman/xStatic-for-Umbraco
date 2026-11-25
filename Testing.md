# 🧪 Testing xStatic for Umbraco

This document outlines the testing strategy and procedures for the xStatic project.

## 🚀 Overview
We use a layered testing approach:
- **Unit Tests**: Fast tests for core logic and transformers.
- **E2E Integration Tests**: Full pipeline verification using Playwright against a real Umbraco instance.
- **Manual Verification**: Using automated setup scripts to spin up specific Umbraco versions.

---

## 🛠️ Unit and integration tests
| Project | Framework | What it covers |
|---------|-----------|----------------|
| `Source/XStaticCore/XStatic.Core.Tests` | xUnit + Moq | Core logic, transformers, deployers. Fast, no Umbraco instance needed. |
| `Source/XStaticCore/XStatic.AI.Tests` | xUnit + Moq | The `XStatic.AI` add-on. |
| `Source/XStaticCore/XStatic.IntegrationTests` | NUnit on `Umbraco.Cms.Tests.Integration` | Migrations, repositories and the v13 upgrade against a real database (SQLite by default). |

### 🏃 How to Run
From the repository root:
```powershell
# Unit tests, on every change
dotnet test Source/XStaticCore/XStatic.Core.Tests/XStatic.Core.Tests.csproj
dotnet test Source/XStaticCore/XStatic.AI.Tests/XStatic.AI.Tests.csproj

# Unit and integration tests (-Database LocalDb|SqlServer is also supported)
./Source/XStaticCore/run-tests.ps1
```

The backoffice client has its own checks. From `Source/XStaticCore/XStatic14/XStatic14.Client/assets`, run
`npm ci` once and then `npm run check` (type-check, ESLint and Vitest) after every UI change.

---

## 🎭 Playwright E2E Tests
Playwright tests reside in `Testing/Playwright`. These verify the entire flow from the Umbraco Backoffice to static file generation.

### 📋 Prerequisites
1.  **A running Umbraco instance** on port 5000 (see [Setup Scripts](#-setup-scripts)).
2.  **Node.js** and **Google Chrome** installed on your machine. The tests run in the installed Chrome
    (`channel: 'chrome'`), so `npx playwright install` isn't needed.
3.  **Dependencies**: Run `npm install` in the `Testing/Playwright` directory.

### 🏃 Running Tests
Navigate to `Testing/Playwright` and run:
```powershell
npx playwright test
```
*Add `--ui` to see the tests running in the Playwright UI.*

### 📂 Test Sequence
Tests are numbered to run in a specific order to maintain state:
1.  `00-auth.setup.ts`: Logs into Umbraco and saves auth state to `user.json`.
2.  `01-configuration.spec.ts`: Configures xStatic (e.g., adding a deployer).
3.  `02-site-definition.spec.ts`: Creates a static site definition.
4.  `03-operations.spec.ts`: Triggers generation/deploy and verifies output.
5.  `04-issue70.spec.ts`: Regression tests for specific fixes.
6.  `05-cleanup.spec.ts`: Removes test data (sites, actions) from the instance.
7.  `06-issue77.spec.ts`: Regression test for issue #77.

These create and remove their own data, so they only depend on the login:

- `07-output.spec.ts`: checks what's generated (pages, assets, media, image crops, post-generation action output),
  what Deploy copies to a folder, and that Clean keeps the do-not-delete paths.
- `08-json-export.spec.ts`: a JSON export type produces valid JSON.
- `09-security.spec.ts`: every xStatic API endpoint rejects anonymous requests.
- `10-validation.spec.ts`: empty create forms aren't submitted.
- `11-dashboards.spec.ts`: the Config and Documentation dashboards load.
- `12-parameterless-action.spec.ts`: an action type with no parameters can be created, edited and deleted.
- `13-ftp-deploy.spec.ts`: deploys through the backoffice to the Docker FTP server. Skipped unless that server is
  running; see [FTP deployer](#-ftp-deployer).
- `14-typed-fields-and-ai-output.spec.ts`: checks Toggle/Integer editable field persistence on actions and verifies
  companion `.md`, `MarkdownDiscoveryTransformer`, `/llms.txt`, `/llms-full.txt`, RAG JSONL chunks and `webmcp-index.json`.
- `15-deploy-errors-and-secrets.spec.ts`: a failed deploy is reported as failed and doesn't update the last deploy;
  password fields recommend secret references and save only the reference; every field of a site's Edit dialog is
  saved.

## 📡 FTP deployer
The FTP deployer is tested in two ways.

**In the unit tests (runs in CI).** `XStatic.Core.Tests/Deploy/FtpDeployerServerTests.cs` runs the real deployer against
an FTP server inside the test process (FubarDev.FtpServer), so it needs nothing installed. It covers uploads, updating
and removing files, and a blocked passive data connection.

**Against a real FTP server in Docker (by hand).** `Testing/Ftp/docker-compose.yml` runs vsftpd:

```powershell
docker compose -f Testing/Ftp/docker-compose.yml up -d
```

Then either create an FTP deployment target in the backoffice (Hostname `127.0.0.1`, Port `2121`, Username `xstest`,
Password `xstestpw`, Folder `/home/xstest/site`) and deploy, or run the Playwright spec:

```powershell
npx playwright test --project=chromium-ftp
```

Uploaded files appear in `Testing/Ftp/data/site` (gitignored). The test site needs the FTP deployer installed: create it
with `setup-local-instance.ps1 -IncludeAllExtensions`, or add a reference to `XStatic.Ftp.csproj`. Stop the server with
`docker compose -f Testing/Ftp/docker-compose.yml down`.

FTP opens a separate connection for each file transfer, on a "passive" port the server picks. The compose file
publishes that port range (21100–21110) and sets the address the server announces. Without the ports, logging in and
creating folders work but no file can be transferred, which the deployer reports as a failed deploy.

## 🤖 Continuous Integration
| Workflow | When | What |
|----------|------|------|
| `ci.yml` | Every PR, and every push to `master` / `feature/**` / `lts/**` | Runs `test.yml`, packs a preview with `pack.yml`, and pushes it to the repo's GitHub Packages feed. On PRs it also comments with install instructions. |
| `release.yml` | A `v*` tag (create a GitHub Release with a new tag), or a manual dry run | Runs `test.yml`, packs at the tag's version, and pushes to nuget.org via Trusted Publishing. |
| `test.yml` | Reusable | Builds the solution, runs unit and integration tests (SQLite), and type-checks and builds the client. Playwright isn't run in CI because it needs a live Umbraco instance. |
| `codeql.yml` | Every PR, pushes to `master` / `feature/**` / `lts/**`, and weekly | CodeQL security scan of the C#, TypeScript and workflow files, without building. Results go to Security → Code scanning. Exclusions are in `.github/codeql/codeql-config.yml`. |
| `scorecard.yml` | Pushes to `master`, and weekly | OpenSSF Scorecard check of the repo's security practices. Publishes the score shown by the README badge. |
| `dependabot-automerge.yml` | Dependabot PRs | Turns on auto-merge for minor and patch updates, so they merge once the required checks pass. Major updates are left for review. |
| `pack.yml` | Reusable | Builds the client and packs all 9 packages at one version, uploaded as the `nuget-packages` artifact. |
| `pages.yml` | Pushes to `master` that change `Wiki/`, `Tools/Wiki/` or the brand logos, or a manual run | Builds the wiki into the HTML docs site with `Tools/Wiki/build-pages-site.mjs` and publishes it to GitHub Pages. |
| `xStatic.Mcp.yml` | PRs and pushes to `master` / `lts/**` / `feature/<number>` that change `Source/xstatic-mcp/` | Tests and builds the xStatic MCP server. |

**Preview versions** come from the nearest `v*` tag (`.github/scripts/Get-PreviewVersion.ps1`): PRs get
`18.0.0-pr.<PR>.<run>`, and branch pushes get `18.0.0-preview.<run>`. If the nearest tag is a full release such as
`v17.2.1`, previews target the next patch (`17.2.2-preview.<run>`). PRs from forks and Dependabot run the tests and pack,
but can't publish to the feed; their packages are in the run's artifact.

**Dependabot** (`.github/dependabot.yml`) opens monthly, grouped update PRs for NuGet, npm and Actions on `master`,
`lts/17` and `feature/19`. It never bumps Umbraco packages, which are bumped together by hand. Minor and patch updates
merge themselves once the required checks pass (`dependabot-automerge.yml`); major updates wait for review. Actions are
pinned to commit SHAs, and Dependabot keeps those up to date.

**Installing a preview:** GitHub Packages needs a personal access token (classic) with `read:packages`, even for public
packages:

```powershell
dotnet nuget add source "https://nuget.pkg.github.com/Mulliman/index.json" --name xstatic-preview --username <github-username> --password <token>
dotnet add package xStatic --version 18.0.0-preview.42 --source xstatic-preview
```

### ⚙️ Configuration
Settings are managed in `Testing/Playwright/playwright.config.ts`:
- **Base URL**: `https://localhost:5000`
- **Default Credentials**: `admin@admin.com` / `1234567890` (defined in `00-auth.setup.ts`)

---

## 📜 Setup Scripts
To test against different Umbraco versions, use the PowerShell scripts in `Testing/Scripts`.

### `setup-instance.ps1`
Creates a fresh Umbraco instance and installs xStatic via **NuGet**. Best for verifying published packages.
```powershell
.\setup-instance.ps1 -UmbracoVersion "18.3.2" -XStaticVersion "18.0.0"
```

### `setup-local-instance.ps1`
Creates a fresh Umbraco instance and adds **project references** to your local xStatic source. Best for active development.
```powershell
.\setup-local-instance.ps1 -UmbracoVersion "18.3.2"
```

### Running the instance
The scripts create a directory in `Testing/Instances/`. To start the site:
1.  Navigate to the instance folder.
2.  Run `.\Start.bat` (this runs `dotnet run` on port 5000).

### 🖥️ Frontend Development
If you use `setup-local-instance.ps1`, a `Start-Watcher.bat` file is also created.
Running this will launch a watcher for the **xStatic14.Client** assets (Vite/TS), automatically rebuilding the frontend files whenever you save changes in `Source/XStaticCore/XStatic14/XStatic14.Client`.

---

## 💡 Troubleshooting
- **Port 5000 Conflicts**: If port 5000 is occupied, use the `-Port` parameter in setup scripts and update `baseURL` in `playwright.config.ts`.
- **HTTPS Errors**: Playwright is set to `ignoreHTTPSErrors: true` to bypass local certificate warnings.
- **Login Failures**: If the `00-auth` setup fails, check that your instance's admin user matches the credentials in the script.
- **Unique IDs**: Tests use a `TEST_RUN_ID` (stored in `tests/test-data.ts`) to name sites and actions, preventing conflicts if tests are run repeatedly without cleanup.
