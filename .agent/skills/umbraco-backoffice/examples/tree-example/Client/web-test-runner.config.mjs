import { esbuildPlugin } from '@web/dev-server-esbuild';
import { importMapsPlugin } from '@web/dev-server-import-maps';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
  plugins: [
    esbuildPlugin({ ts: true }),
    importMapsPlugin({
      inject: {
        importMap: {
          imports: {
            // Map Umbraco imports to empty modules for unit tests
            // These are mocked since we're testing logic in isolation
            '@umbraco-cms/backoffice/external/lit': '/src/__mocks__/lit.js',
            '@umbraco-cms/backoffice/lit-element': '/src/__mocks__/lit-element.js',
            '@umbraco-cms/backoffice/observable-api': '/src/__mocks__/observable-api.js',
            '@umbraco-cms/backoffice/class-api': '/src/__mocks__/class-api.js',
            '@umbraco-cms/backoffice/workspace': '/src/__mocks__/workspace.js',
            '@umbraco-cms/backoffice/controller-api': '/src/__mocks__/controller-api.js',
            '@umbraco-cms/backoffice/style': '/src/__mocks__/style.js',
            '@umbraco-cms/backoffice/context-api': '/src/__mocks__/context-api.js',
          },
        },
      },
    }),
  ],
  testRunnerHtml: testFramework => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>
  `,
};
