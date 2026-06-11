# Contributing to xStatic

Thank you for your interest in contributing to xStatic! This document provides guidelines for setting up your development environment and running tests.

## 🛠️ Development Environment Setup

To test changes or develop new features, you can easily create local Umbraco instances pre-configured with xStatic.

### Creating a Test Instance

We provide a batch file to automate the creation of Umbraco test instances:

1.  Navigate to the `Testing/Instances` directory.
2.  Run `AddNew.bat`.
3.  The script will ask: `Do you want to use local project references? (Y/N)`:
    *   **Y**: Uses the local source code from this repository (useful for developing xStatic itself).
    *   **N**: Installs xStatic from NuGet (useful for testing specific versions).
4.  Follow the interactive prompts to specify:
    *   **Umbraco Version** (default is the latest stable version).
    *   **xStatic Version** (if not using local references).
    *   **Instance Name** (a folder with this name will be created in `Testing/Instances`).
    *   **Include All Extensions** (whether to include Netlify, Git, Ftp, etc.).

Once the script finishes, it will automatically start the new Umbraco instance. You can also manually start it later by running `Start.bat` within the created instance folder.

> [!TIP]
> **Developing the UI?** Use a "Local" instance (**Y**). It created a `Start-Watcher.bat` file in the instance folder that runs the Vite watcher for you.

---

## 🎨 Front-end Development (Umbraco 14+)

The Umbraco 14+ backoffice UI is built with TypeScript, Lit, and Vite.

### Source Location
The source code and build configuration are located in:
`Source/XStaticCore/XStatic14/XStatic14.Client/assets`

### Optimized Workflow (No C# Rebuilds)
To develop the UI with instant feedback:

1.  **Setup**: Create a local test instance via `AddNew.bat` and select **Y** for local project references.
2.  **Start Umbraco**: Run `Start.bat` in your instance folder.
3.  **Start Watcher**: Run `npm run watch` in the `assets` directory (or run `Start-Watcher.bat` from your instance folder).
4.  **Refresh Browser**: When you save a `.ts` file, Vite rebuilds the assets in the library's `wwwroot`. Because you are using a "Local" project reference, Umbraco serves these files directly. Just press **Ctrl + F5** in the browser to see the changes.

### Key Scripts
Run these from the `assets` folder:
*   `npm run watch`: Builds and watches for changes (uses stable filenames for reliable browser refreshing).
*   `npm run build`: Production build.
*   `npm run generate`: Syncs the TypeScript API client with the backend Swagger schema (requires Umbraco to be running).

### Troubleshooting
*   **Changes not appearing?** Umbraco caches plugin assets heavily. Open DevTools and check "Disable cache" or use a hard refresh (Ctrl+F5).
*   **404 Errors?** Ensure that `assets.js` exists in the `wwwroot/App_Plugins/xstatic14` folder. If it's missing, run `npm run build` once to restore it.


---

## 🧪 Testing with Playwright

We use [Playwright](https://playwright.dev/) for end-to-end testing of the Umbraco backoffice integrations.

### Prerequisites

*   [Node.js](https://nodejs.org/) installed.
*   A running Umbraco instance (usually on `https://localhost:5000`).

### Running Tests

1.  Navigate to the `Testing/Playwright` directory.
2.  Install dependencies (first time only):
    ```bash
    npm install
    ```
3.  Run the tests:
    ```bash
    npx playwright test
    or
    npx playwright test --ui
    ```

### Test Structure

The tests are organized into sequential stages:
*   **00-auth.setup.ts**: Handles login and saves authentication state.
*   **01-configuration.spec.ts**: Tests global configuration settings.
*   **02-site-definition.spec.ts**: Tests creating and managing site definitions.
*   **03-operations.spec.ts**: Tests xStatic operations like Generate and Deploy.
*   **04-cleanup.spec.ts**: Cleans up test data created during the run.

### Configuration

If your test instance is running on a different port or URL, update the `baseURL` in `Testing/Playwright/playwright.config.ts`.

---

## 📬 Submitting Changes

1.  Create an issue on GitHub describing the change or bug fix.
2.  Fork the repository and create a feature branch.
3.  Ensure your changes are tested (manual or Playwright).
4.  Submit a Pull Request with a clear description of the changes.

Thank you for making xStatic better!
