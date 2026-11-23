import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { redactActions, redactDeploymentTargets, XStaticClient } from './client.js';
import type { RebuildProcessResult } from './types.js';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version?: string };
const PACKAGE_VERSION = packageJson.version ?? '1.0.0';

export interface CreateServerOptions {
  client: XStaticClient;
  version?: string;
}

export function createXStaticMcpServer(options: CreateServerOptions): McpServer {
  const { client, version = PACKAGE_VERSION } = options;

  const server = new McpServer({
    name: 'xstatic-mcp',
    version,
  });

  server.registerTool(
    'list_sites',
    {
      title: 'List xStatic Sites',
      description:
        'List all configured xStatic static sites in Umbraco, including their IDs, names, root paths, export types, last build/deploy times, folder sizes, and deployment target IDs.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const sites = await client.listSites();
        return okJson({ count: sites.length, sites });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    'get_site',
    {
      title: 'Get xStatic Site',
      description:
        'Get detailed configuration and build/deploy status for a single xStatic static site by its numeric staticSiteId.',
      inputSchema: {
        staticSiteId: z.number().int().positive().describe('Numeric ID of the xStatic static site.'),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ staticSiteId }) => {
      try {
        const site = await client.getSite(staticSiteId);
        if (!site) {
          return {
            isError: true,
            content: [{ type: 'text', text: `No xStatic site found with ID ${staticSiteId}.` }],
          };
        }
        return okJson(site);
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    'generate_site',
    {
      title: 'Generate Static Site',
      description:
        'Trigger static site generation (RebuildProcess) for an xStatic site by staticSiteId. Crawls Umbraco content, media, and assets, runs transformers, writes output files, and executes post-generation actions.',
      inputSchema: {
        staticSiteId: z.number().int().positive().describe('Numeric ID of the xStatic static site to generate.'),
        includeAllItemResults: z
          .boolean()
          .optional()
          .default(false)
          .describe('When true, includes every individual generated item result. Defaults to false (returns counts and warnings/errors only).'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ staticSiteId, includeAllItemResults }) => {
      try {
        const result = await client.generateSite(staticSiteId);
        return okJson(summarizeBuildResult(result, includeAllItemResults));
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    'deploy_site',
    {
      title: 'Deploy Static Site',
      description:
        'Deploy the locally generated static files for an xStatic site to its configured deployment target (e.g., Netlify, Git, FTP, FileSystem).',
      inputSchema: {
        staticSiteId: z.number().int().positive().describe('Numeric ID of the xStatic static site to deploy.'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ staticSiteId }) => {
      try {
        const result = await client.deploySite(staticSiteId);
        return okJson({
          siteId: staticSiteId,
          wasSuccessful: result.wasSuccessful,
          message: result.message ?? null,
        });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    'generate_and_deploy_site',
    {
      title: 'Generate and Deploy Static Site',
      description:
        'Generate an xStatic static site and, if generation succeeds, immediately deploy it to its configured deployment target. Ideal for chaining after Umbraco content edits.',
      inputSchema: {
        staticSiteId: z.number().int().positive().describe('Numeric ID of the xStatic static site to generate and deploy.'),
        deployOnWarnings: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            'When true, still deploys if individual items reported warnings/errors during generation. Fatal build crashes (exception set or no generated items) always skip deployment.'
          ),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ staticSiteId, deployOnWarnings }) => {
      try {
        const buildResult = await client.generateSite(staticSiteId);
        const buildSummary = summarizeBuildResult(buildResult, false);

        const isFatalBuildFailure =
          Boolean(buildResult.exception) || (!buildResult.wasSuccessful && (buildResult.results?.length ?? 0) === 0);

        if (isFatalBuildFailure) {
          return okJson({
            siteId: staticSiteId,
            build: buildSummary,
            deploy: null,
            deployed: false,
            reason: 'Skipped deployment because static site generation failed with a fatal error.',
          });
        }

        if (!buildResult.wasSuccessful && !deployOnWarnings) {
          return okJson({
            siteId: staticSiteId,
            build: buildSummary,
            deploy: null,
            deployed: false,
            reason: 'Skipped deployment because static site generation reported errors or warnings.',
          });
        }

        const deployResult = await client.deploySite(staticSiteId);
        return okJson({
          siteId: staticSiteId,
          build: buildSummary,
          deploy: {
            wasSuccessful: deployResult.wasSuccessful,
            message: deployResult.message ?? null,
          },
          deployed: deployResult.wasSuccessful,
        });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    'list_actions',
    {
      title: 'List Post-Generation Actions',
      description:
        'List all configured xStatic post-generation actions (with secret/password field values redacted). Requires the xStaticAdmin user group when xStatic roles are enabled.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const actions = redactActions(await client.listActions());
        return okJson({ count: actions.length, actions });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    'list_deployment_targets',
    {
      title: 'List Deployment Targets',
      description:
        'List all configured xStatic deployment targets and their definitions (with secret/password field values redacted). Requires the xStaticAdmin user group when xStatic roles are enabled.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const deploymentTargets = redactDeploymentTargets(await client.listDeploymentTargets());
        return okJson({ count: deploymentTargets.length, deploymentTargets });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  server.registerTool(
    'get_xstatic_config',
    {
      title: 'Get xStatic Configuration',
      description:
        'Inspect registered xStatic deployers, export types, generators, transformer factories, file name generators, post-generation action types, and runtime role settings.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const [config, settings] = await Promise.all([client.getConfig(), client.getSettings()]);
        return okJson({ settings, config });
      } catch (error) {
        return errorResult(error);
      }
    }
  );

  return server;
}

function summarizeBuildResult(result: RebuildProcessResult, includeAllItemResults: boolean) {
  const items = result.results ?? [];
  const warnings = result.warnings ?? items.filter((item) => !item.wasSuccessful);
  const succeededCount = items.filter((item) => item.wasSuccessful).length;

  return {
    siteId: result.siteId,
    wasSuccessful: result.wasSuccessful,
    buildTimeMs: result.buildTime,
    totalItems: items.length,
    succeededItems: succeededCount,
    failedItems: warnings.length,
    warnings,
    exception: result.exception ?? null,
    ...(includeAllItemResults ? { results: items } : {}),
  };
}

function okJson(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}
