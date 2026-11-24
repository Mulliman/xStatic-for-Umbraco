#!/usr/bin/env node
// Builds the Wiki/ folder into a static HTML website for GitHub Pages.
//
//   node Tools/Wiki/build-pages-site.mjs <outDir> [--base-url https://owner.github.io/repo]
//
// It reuses compile-client-docs.mjs (the same Markdown and Mermaid rendering as the backoffice Documentation
// dashboard), so run `npm ci` in Source/XStaticCore/XStatic14/XStatic14.Client/assets first.
//
// Output: one HTML file per page (Home.md becomes index.html) with its CSS inline, so each page works on its own
// even in a viewer that doesn't load neighbouring files, plus the images, a 404 page and, when
// --base-url is given, sitemap.xml and robots.txt. Links between pages become `Page-Name.html`, and links to source
// files point at the repository on GitHub. Published by .github/workflows/pages.yml.

import { writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wikiDir, imageDirName, listImages } from './wiki.mjs';
import { compileClientDocs } from './compile-client-docs.mjs';

const SITE_NAME = 'xStatic for Umbraco';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fileNameFor(slug) {
  return slug === 'Home' ? 'index.html' : `${slug}.html`;
}

function hrefFor(slug) {
  return slug === 'Home' ? './' : `${slug}.html`;
}

/**
 * Turns the dashboard's in-app links and remote image URLs into links that work on a static site.
 */
export function rewriteForSite(html, { repoUrl, gitRef }) {
  const rawImages = `${repoUrl}/raw/${gitRef.split('/').map(encodeURIComponent).join('/')}/Wiki/${imageDirName}/`;
  return html
    .replace(/href="#wiki\/([^"#]+)(#[^"]*)?"/g, (_, slug, anchor) => `href="${hrefFor(slug)}${anchor ?? ''}"`)
    .split(`src="${rawImages}`)
    .join(`src="${imageDirName}/`);
}

function firstParagraphText(html) {
  const m = html.match(/<p>([\s\S]*?)<\/p>/);
  if (!m) return '';
  const text = m[1]
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, '')}...` : text;
}

function renderNav(sections, currentSlug) {
  return sections
    .map(section => {
      const items = section.items
        .map(item => {
          const current = item.slug === currentSlug ? ' aria-current="page"' : '';
          return `<li><a href="${hrefFor(item.slug)}"${current}>${escapeHtml(item.label)}</a></li>`;
        })
        .join('');
      const title = section.title ? `<p class="nav-title">${escapeHtml(section.title)}</p>` : '';
      return `<div class="nav-section">${title}<ul>${items}</ul></div>`;
    })
    .join('\n');
}

function renderToc(headings) {
  const h2s = headings.filter(h => h.level === 2);
  if (h2s.length < 3) return '';
  const items = h2s.map(h => `<li><a href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a></li>`).join('');
  return `<nav class="toc" aria-label="On this page"><p class="nav-title">On this page</p><ul>${items}</ul></nav>`;
}

function renderPage({ title, description, bodyHtml, nav, toc = '', editUrl, repoUrl, canonical }) {
  const pageTitle = title === SITE_NAME ? `${SITE_NAME} documentation` : `${title} | ${SITE_NAME}`;
  const edit = editUrl
    ? ` <a href="${escapeHtml(editUrl)}">Edit this page on GitHub</a>.`
    : '';
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pageTitle)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">\n` : ''}${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">\n` : ''}<style>
${CSS}</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="site-header">
  <a class="brand" href="./">${SITE_NAME}</a>
  <a class="repo" href="${escapeHtml(repoUrl)}">GitHub</a>
</header>
<div class="layout">
  <aside class="sidebar">
    <details id="nav">
      <summary>Contents</summary>
      <nav aria-label="Documentation">
${nav}
      </nav>
    </details>
  </aside>
  <main id="content">
    <article class="wiki-prose">
      <h1>${escapeHtml(title)}</h1>
${bodyHtml}
    </article>
    <footer class="page-footer">
      <p>${SITE_NAME} is open source under the MIT licence.${edit}</p>
    </footer>
  </main>
  ${toc ? `<aside class="toc-col">${toc}</aside>` : ''}
</div>
<script>
  (function () {
    var nav = document.getElementById('nav');
    var wide = window.matchMedia('(min-width: 900px)');
    function sync() { if (wide.matches) nav.open = true; }
    sync();
    wide.addEventListener('change', sync);
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy-code]');
      if (!btn) return;
      var code = btn.closest('.wiki-code-block').querySelector('code');
      navigator.clipboard.writeText(code.textContent).then(function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
      });
    });
  })();
</script>
</body>
</html>
`;
}

const CSS = `:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --fg: #1b264f;
  --muted: #5c6370;
  --line: #d8d7d9;
  --surface-alt: #f6f6f9;
  --accent: #3544b1;
  --code-bg: #f4f4f7;
  --diagram-line: #8b8b96;
  --font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, "Cascadia Code", Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #15161a;
    --fg: #e6e6ea;
    --muted: #a3a6ad;
    --line: #34363d;
    --surface-alt: #1d1f24;
    --accent: #9aa6ff;
    --code-bg: #1f2127;
    --diagram-line: #8b8e98;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.6 var(--font); }
a { color: var(--accent); }
.skip { position: absolute; left: -999px; }
.skip:focus { left: 16px; top: 8px; background: var(--bg); padding: 4px 8px; z-index: 10; }
.site-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
.brand { font-weight: 700; font-size: 18px; color: var(--fg); text-decoration: none; }
.repo { font-size: 14px; }
.layout { display: grid; grid-template-columns: minmax(0, 1fr); max-width: 1400px; margin: 0 auto; }
.sidebar { padding: 8px 16px; border-bottom: 1px solid var(--line); }
.sidebar summary { cursor: pointer; font-weight: 600; padding: 6px 0; }
.sidebar ul, .toc ul { list-style: none; margin: 0; padding: 0; }
.sidebar li a, .toc li a { display: block; padding: 3px 8px; border-radius: 4px; color: var(--fg); text-decoration: none; font-size: 14px; }
.sidebar li a:hover, .toc li a:hover { background: var(--surface-alt); }
.sidebar li a[aria-current="page"] { background: var(--surface-alt); color: var(--accent); font-weight: 600; }
.nav-title { margin: 16px 0 4px; padding: 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
.nav-section:first-child .nav-title { margin-top: 4px; }
main { min-width: 0; padding: 8px 16px 48px; }
.toc-col { display: none; }
@media (min-width: 900px) {
  .layout { grid-template-columns: 260px minmax(0, 1fr); }
  .sidebar { border-bottom: 0; border-right: 1px solid var(--line); position: sticky; top: 0; align-self: start; max-height: 100vh; overflow-y: auto; padding-bottom: 32px; }
  .sidebar summary { display: none; }
  main { padding: 8px 40px 64px; }
}
@media (min-width: 1240px) {
  .layout { grid-template-columns: 260px minmax(0, 1fr) 220px; }
  .toc-col { display: block; position: sticky; top: 0; align-self: start; padding: 24px 16px; }
}
.wiki-prose { max-width: 820px; }
.wiki-prose h1 { font-size: 2.1em; line-height: 1.2; margin: 24px 0 16px; }
.wiki-prose h2 { margin-top: 2em; padding-bottom: 4px; border-bottom: 1px solid var(--line); }
.wiki-prose h2, .wiki-prose h3, .wiki-prose h4 { line-height: 1.3; scroll-margin-top: 16px; }
.wiki-prose img { max-width: 100%; height: auto; }
.wiki-prose code { font-family: var(--mono); font-size: 0.9em; background: var(--code-bg); padding: 1px 5px; border-radius: 4px; }
.wiki-prose pre { margin: 0; padding: 12px 16px; overflow-x: auto; background: var(--code-bg); }
.wiki-prose pre code { padding: 0; background: none; font-size: 13.5px; }
.wiki-prose blockquote { margin: 1em 0; padding: 4px 16px; border-left: 4px solid var(--accent); background: var(--surface-alt); }
.wiki-code-block { margin: 1em 0; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.wiki-code-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 4px 12px; border-bottom: 1px solid var(--line); font-size: 12px; color: var(--muted); }
.wiki-copy-btn { font: inherit; font-size: 12px; padding: 2px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg); color: var(--fg); cursor: pointer; }
.wiki-table-wrap { overflow-x: auto; margin: 1em 0; }
.wiki-prose table { border-collapse: collapse; font-size: 14.5px; }
.wiki-prose th, .wiki-prose td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; vertical-align: top; }
.wiki-prose th { background: var(--surface-alt); }
.wiki-diagram { margin: 1.25em 0; overflow-x: auto; }
.wiki-diagram-svg svg {
  max-width: none; height: auto;
  --surface: var(--bg); --border: var(--diagram-line);
  --_text: var(--fg); --_text-sec: var(--muted); --_text-muted: var(--muted);
  --_text-faint: color-mix(in srgb, var(--fg) 25%, var(--bg));
  --_line: var(--diagram-line); --_arrow: var(--accent);
  --_node-fill: var(--bg); --_node-stroke: var(--diagram-line);
  --_group-fill: var(--bg); --_group-hdr: color-mix(in srgb, var(--fg) 5%, var(--bg));
  --_inner-stroke: color-mix(in srgb, var(--fg) 12%, var(--bg));
  --_key-badge: color-mix(in srgb, var(--fg) 10%, var(--bg));
}
.wiki-diagram-svg svg text { font-family: var(--font); }
a.wiki-video-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; margin: 0.75em 0 1.25em; border: 1px solid var(--line); border-radius: 6px; background: var(--surface-alt); text-decoration: none; color: var(--fg); }
a.wiki-video-card:hover { border-color: var(--accent); }
.wiki-video-icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background: var(--accent); color: var(--bg); flex-shrink: 0; }
.wiki-video-body { display: flex; flex-direction: column; gap: 2px; }
.wiki-video-title { font-weight: 600; font-size: 14px; }
.wiki-video-cta { font-size: 12.5px; color: var(--accent); }
.page-footer { max-width: 820px; margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 14px; color: var(--muted); }
`;

/**
 * Builds the site into outDir and returns what it wrote.
 */
export async function buildPagesSite(outDir, { baseUrl, ...compileOptions } = {}) {
  const out = resolve(outDir);
  if (existsSync(out)) rmSync(out, { recursive: true });
  mkdirSync(out, { recursive: true });

  const { bundle } = await compileClientDocs({ gitRef: 'master', ...compileOptions });
  const base = baseUrl ? baseUrl.replace(/\/?$/, '/') : '';
  const files = [];

  for (const page of Object.values(bundle.pages)) {
    const bodyHtml = rewriteForSite(page.html, bundle);
    const isHome = page.slug === 'Home';
    const html = renderPage({
      title: isHome ? SITE_NAME : page.title,
      description: firstParagraphText(bodyHtml),
      bodyHtml,
      nav: renderNav(bundle.sections, page.slug),
      toc: renderToc(page.headings),
      editUrl: page.githubUrl,
      repoUrl: bundle.repoUrl,
      canonical: base ? base + (isHome ? '' : fileNameFor(page.slug)) : '',
    });
    const file = fileNameFor(page.slug);
    writeFileSync(join(out, file), html);
    files.push(file);
  }

  writeFileSync(
    join(out, '404.html'),
    renderPage({
      title: 'Page not found',
      bodyHtml: '<p>There\'s no page at this address. Try the contents, or start from the <a href="./">home page</a>.</p>',
      nav: renderNav(bundle.sections, ''),
      repoUrl: bundle.repoUrl,
    }).replace(/(href|src)="(?!https?:|#|\/)([^"]*)"/g, (_, attr, path) => `${attr}="${base ? new URL(path, base).pathname : path}"`)
  );

  // Only copy the images a page still shows (the dashboard renderer drops the banner and turns video thumbnails into cards).
  const written = Object.values(bundle.pages).map(p => p.html).join('\n');
  const images = listImages().filter(img => written.includes(`/Wiki/${imageDirName}/${encodeURIComponent(img)}"`));
  if (images.length) {
    mkdirSync(join(out, imageDirName), { recursive: true });
    for (const img of images) copyFileSync(join(wikiDir, imageDirName, img), join(out, imageDirName, img));
  }

  if (base) {
    const urls = files.map(f => `  <url><loc>${escapeHtml(base + (f === 'index.html' ? '' : f))}</loc></url>`).join('\n');
    writeFileSync(
      join(out, 'sitemap.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
    );
    writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`);
  }

  return { outDir: out, pages: files, images };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--base-url');
  const baseUrl = i >= 0 ? args[i + 1] : undefined;
  const outDir = args.find((a, j) => !a.startsWith('--') && args[j - 1] !== '--base-url');
  if (!outDir) {
    console.log('Usage: node Tools/Wiki/build-pages-site.mjs <outDir> [--base-url https://owner.github.io/repo]');
    process.exit(1);
  }
  const result = await buildPagesSite(outDir, { baseUrl });
  console.log(`Built ${result.pages.length} pages and ${result.images.length} images into ${result.outDir}`);
}
