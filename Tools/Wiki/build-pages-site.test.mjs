import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildPagesSite, rewriteForSite, fileNameFor } from './build-pages-site.mjs';
import { listPages, specialPages } from './wiki.mjs';

test('rewriteForSite turns dashboard links into static page links', () => {
  const site = { repoUrl: 'https://github.com/o/r', gitRef: 'master' };
  assert.equal(
    rewriteForSite('<a href="#wiki/FAQ" data-wiki-page="FAQ">', site),
    '<a href="FAQ.html" data-wiki-page="FAQ">'
  );
  assert.equal(
    rewriteForSite('<a href="#wiki/Home#versions" data-wiki-page="Home">', site),
    '<a href="index.html#versions" data-wiki-page="Home">'
  );
  assert.equal(
    rewriteForSite('<img src="https://github.com/o/r/raw/master/Wiki/images/a.png" />', site),
    '<img src="images/a.png" />'
  );
  assert.equal(rewriteForSite('<a href="#same-page">', site), '<a href="#same-page">');
});

test('fileNameFor makes Home the index page', () => {
  assert.equal(fileNameFor('Home'), 'index.html');
  assert.equal(fileNameFor('FAQ'), 'FAQ.html');
});

test('buildPagesSite writes every wiki page with working links', async () => {
  const out = mkdtempSync(join(tmpdir(), 'xstatic-pages-'));
  try {
    const result = await buildPagesSite(out, { baseUrl: 'https://example.github.io/repo' });
    const expected = listPages()
      .filter(p => !specialPages.includes(p))
      .map(p => fileNameFor(p.slice(0, -3)));
    assert.deepEqual([...result.pages].sort(), [...expected].sort());

    const files = new Set(readdirSync(out));
    for (const f of ['index.html', '404.html', 'sitemap.xml', 'robots.txt']) {
      assert.ok(files.has(f), `${f} must be written`);
    }

    for (const page of result.pages) {
      const html = readFileSync(join(out, page), 'utf8');
      assert.ok(!html.includes('href="#wiki/'), `${page} still has a dashboard link`);
      for (const [, target] of html.matchAll(/href="([A-Za-z0-9-]+\.html)(?:#[^"]*)?"/g)) {
        assert.ok(files.has(target), `${page} links to missing ${target}`);
      }
      for (const [, src] of html.matchAll(/src="((?:images|assets)\/[^"]+)"/g)) {
        assert.ok(existsSync(join(out, src)), `${page} shows missing ${src}`);
      }
    }

    const notFound = readFileSync(join(out, '404.html'), 'utf8');
    assert.ok(notFound.includes('href="/repo/index.html"'), '404 page must use root-relative links');
    assert.ok(notFound.includes('src="/repo/assets/logo.png"'), '404 page must load the logo from the site root');
    assert.ok(readFileSync(join(out, 'index.html'), 'utf8').includes('src="assets/logo.png"'), 'the header must show the logo');
    assert.match(readFileSync(join(out, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/example\.github\.io\/repo\/FAQ\.html<\/loc>/);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
