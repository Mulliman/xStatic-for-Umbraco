#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { UmbracoTokenProvider } from './auth.js';
import { XStaticClient } from './client.js';
import { loadConfig } from './config.js';
import { createXStaticMcpServer } from './server.js';

async function main(): Promise<void> {
  const config = loadConfig(process.env);

  if (config.allowInsecureTls) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const tokenProvider = new UmbracoTokenProvider({
    baseUrl: config.baseUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });

  const client = new XStaticClient({
    baseUrl: config.baseUrl,
    tokenProvider,
    requestTimeoutMs: config.requestTimeoutMs,
  });

  const server = createXStaticMcpServer({ client });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`xstatic-mcp failed to start: ${message}\n`);
  process.exit(1);
});
