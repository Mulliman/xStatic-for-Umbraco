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
