import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { compileClientDocs, resolveDocGitRef } from './compile-client-docs.mjs';

test('resolveDocGitRef only allows lts/*, master, and v* tags', () => {
  assert.equal(resolveDocGitRef('lts/17', '17.3.0'), 'lts/17');
  assert.equal(resolveDocGitRef('master', '18.0.0'), 'master');
  assert.equal(resolveDocGitRef('v17.3.0', '17.3.0'), 'v17.3.0');
  assert.equal(resolveDocGitRef('t3/integrate-wiki-docs-dashboard', '17.3.0'), 'lts/17');
  assert.equal(resolveDocGitRef('feature/something', '18.0.0'), 'master');
});

test('compileClientDocs builds all v17 wiki pages, Mermaid SVGs, safe links, and local plugins', async () => {
  const { bundle, stats } = await compileClientDocs({
    version: '17.3.0-test',
    gitRef: 'lts/17',
  });

  assert.equal(bundle.version, '17.3.0-test');
  assert.equal(bundle.gitRef, 'lts/17');
  assert.ok(stats.pageCount >= 45, `Expected >= 45 pages, got ${stats.pageCount}`);
  assert.ok(stats.mermaidCount >= 16, `Expected >= 16 Mermaid diagrams, got ${stats.mermaidCount}`);
  assert.ok(bundle.pages['Home'], 'Home page must exist');
  assert.ok(bundle.pages['Deploying-to-Cloudflare'], 'Cloudflare page must exist');
  assert.ok(bundle.pages['AI-Integration'], 'AI-Integration page must exist');
  assert.ok(bundle.pages['AI-and-GEO'], 'AI-and-GEO page must exist');
  assert.ok(bundle.pages['RAG-and-WebMCP'], 'RAG-and-WebMCP page must exist');
  assert.ok(bundle.pages['MCP-Server-and-Agent-Skill'], 'MCP-Server-and-Agent-Skill page must exist');
  assert.ok(bundle.sections.length >= 7, 'Sidebar sections must be parsed');

  // Every sidebar item must point to a compiled page
  for (const section of bundle.sections) {
    for (const item of section.items) {
      assert.ok(bundle.pages[item.slug], `Sidebar item ${item.slug} missing from compiled pages`);
    }
  }

  for (const [slug, page] of Object.entries(bundle.pages)) {
    // Slash in lts/17 must NOT be percent-encoded as lts%2F17
    assert.ok(page.githubUrl.includes('/blob/lts/17/Wiki/'), `${slug} githubUrl should preserve / in lts/17`);
    assert.ok(!page.githubUrl.includes('lts%2F17'), `${slug} githubUrl must not encode / in gitRef`);
    assert.ok(!page.html.includes('<script'), `${slug} must not contain raw <script>`);
    assert.ok(!page.html.includes('fonts.googleapis.com'), `${slug} must not include external Google Fonts imports`);
    assert.ok(!page.html.includes('images/banner.png'), `${slug} must not reference local banner.png`);
    assert.ok(!page.html.includes('images/video-'), `${slug} must convert video thumbnails into video cards`);

    // Every internal data-wiki-page link must resolve to an existing page
    for (const m of page.html.matchAll(/data-wiki-page="([^"]+)"/g)) {
      assert.ok(bundle.pages[m[1]], `${slug} links to missing wiki page ${m[1]}`);
    }
  }

  // Verify local official packages were derived from the codebase
  const pluginIds = bundle.plugins.map(p => p.id);
  for (const expected of ['xStatic.Cloudflare', 'xStatic.AI', 'xStatic.Netlify', 'xStatic.Git', 'xStatic.Ftp', 'xStatic.RemoteOperations', 'xstatic-mcp']) {
    assert.ok(pluginIds.includes(expected), `Expected local plugin ${expected}, got ${pluginIds.join(', ')}`);
  }
  for (const plugin of bundle.plugins) {
    assert.ok(plugin.description.length > 0, `${plugin.id} should have a description`);
    assert.ok(plugin.gitUrl.includes('/tree/lts/17/'), `${plugin.id} gitUrl should preserve / in lts/17`);
    if (plugin.docSlug) {
      assert.ok(bundle.pages[plugin.docSlug], `${plugin.id} docSlug ${plugin.docSlug} must exist in pages`);
    }
  }

  // Verify Mermaid SVGs are embedded inline
  assert.match(bundle.pages['What-is-xStatic'].html, /<figure class="wiki-diagram" data-diagram="mermaid"><div class="wiki-diagram-svg"><svg\b/);

  // Verify YouTube thumbnails became video cards
  assert.match(bundle.pages['Videos-and-Talks'].html, /class="wiki-video-card"/);

  // Verify compressed size budget (deflate/nupkg) stays well under 250 KB
  const jsonBytes = Buffer.from(JSON.stringify(bundle), 'utf8');
  const deflatedKb = deflateRawSync(jsonBytes, { level: 9 }).length / 1024;
  assert.ok(deflatedKb < 250, `Expected compressed bundle < 250 KB, got ${deflatedKb.toFixed(1)} KB`);
});
