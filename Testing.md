# 🧪 Testing xStatic for Umbraco

This document outlines the testing strategy and procedures for the xStatic project.

## 🚀 Overview
We use a layered testing approach:
- **Unit Tests**: Fast tests for core logic and transformers.
- **E2E Integration Tests**: Full pipeline verification using Playwright against a real Umbraco instance.
- **Manual Verification**: Using automated setup scripts to spin up specific Umbraco versions.

---

## 🛠️ Unit Tests
Unit tests are located in:
`Source/XStaticCore/XStatic.Core.Tests`

### 🏃 How to Run
From the root directory or the project directory, run:
```powershell
dotnet test
```

---

## 🎭 Playwright E2E Tests
Playwright tests reside in `Testing/Playwright`. These verify the entire flow from the Umbraco Backoffice to static file generation.

### 📋 Prerequisites
1.  **A running Umbraco instance** on port 5000 (see [Setup Scripts](#-setup-scripts)).
2.  **Node.js** installed on your machine.
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
.\setup-instance.ps1 -UmbracoVersion "15.0.0" -XStaticVersion "15.1.0"
```

### `setup-local-instance.ps1`
Creates a fresh Umbraco instance and adds **project references** to your local xStatic source. Best for active development.
```powershell
.\setup-local-instance.ps1 -UmbracoVersion "15.0.0"
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
