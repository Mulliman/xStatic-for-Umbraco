#!/usr/bin/env node
// Builds the Wiki/ folder into a static HTML website for GitHub Pages.
//
//   node Tools/Wiki/build-pages-site.mjs <outDir> [--base-url https://owner.github.io/repo]
//
// It reuses compile-client-docs.mjs (the same Markdown and Mermaid rendering as the backoffice Documentation
// dashboard), so run `npm ci` in Source/XStaticCore/XStatic14/XStatic14.Client/assets first.
//
// Output: one HTML file per page (Home.md becomes index.html) with its CSS inline, plus the images, the logo and
// favicon (from Brand/), a 404 page and, when --base-url is given, sitemap.xml and robots.txt. Links between pages
// become `Page-Name.html`, and links to source files point at the repository on GitHub.
// Published by .github/workflows/pages.yml.
//
// Styling: sam.css (the sammullins.co.uk look, kept unchanged so it can be replaced with a newer copy) followed by
// the CSS below, which sets the xStatic brand colours from the logo and lays out the docs.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wikiDir, imageDirName, listImages, stripTags } from './wiki.mjs';
import { compileClientDocs } from './compile-client-docs.mjs';

const SITE_NAME = 'xStatic for Umbraco';
const NUGET_URL = 'https://www.nuget.org/packages/xstatic/';
const toolDir = dirname(fileURLToPath(import.meta.url));
const brandDir = join(toolDir, '..', '..', 'Brand');
const SAM_CSS = readFileSync(join(toolDir, 'sam.css'), 'utf8');

// Brand files copied into the site's assets/ folder. Only the upper-case logo is used.
const ASSETS = {
  'logo.png': 'logo-transparent.png',
  'icon.png': 'icon-transparent.png',
};

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
  return slug === 'Home' ? 'index.html' : `${slug}.html`;
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
  // Plain text for the meta description. It is also HTML-escaped when written into the attribute.
  const text = stripTags(m[1])
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

function sectionTitleFor(sections, slug) {
  return sections.find(s => s.items.some(item => item.slug === slug))?.title ?? '';
}

function renderPage({ title, eyebrow = '', description, bodyHtml, nav, toc = '', editUrl, repoUrl, canonical }) {
  const pageTitle = title === SITE_NAME ? `${SITE_NAME} documentation` : `${title} | ${SITE_NAME}`;
  const edit = editUrl ? `<p class="edit-link"><a href="${escapeHtml(editUrl)}">Edit this page on GitHub</a></p>` : '';
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pageTitle)}</title>
${description ? `<meta name="description" content="${escapeHtml(description)}">\n` : ''}${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">\n` : ''}<link rel="icon" type="image/png" href="assets/icon.png">
<meta name="theme-color" content="#140223">
<script>try { var t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}</script>
<style>
${SAM_CSS}
${CSS}</style>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="index.html"><img src="assets/logo.png" alt="xStatic" width="56" height="56"><span>Documentation</span></a>
    <nav aria-label="Project">
      <a href="${escapeHtml(repoUrl)}">GitHub</a>
      <a href="${NUGET_URL}">NuGet</a>
      <button class="theme-toggle" type="button" aria-label="Toggle dark mode" data-theme-toggle>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><path d="M12 7a5 5 0 0 0 0 10z" fill="currentColor"></path></svg>
      </button>
    </nav>
  </div>
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
      ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>\n      ` : ''}<h1>${escapeHtml(title)}</h1>
${bodyHtml}
    </article>
    ${edit}
  </main>
  ${toc ? `<aside class="toc-col">${toc}</aside>` : ''}
</div>
<footer class="site-footer">
  <div class="footer-inner">
    <p>${SITE_NAME} is open source under the MIT licence.</p>
    <p><a href="${escapeHtml(repoUrl)}">GitHub</a> · <a href="${NUGET_URL}">NuGet</a> · <a href="https://sammullins.co.uk">sammullins.co.uk</a></p>
  </div>
</footer>
<script>
  (function () {
    document.querySelector('[data-theme-toggle]').addEventListener('click', function () {
      var root = document.documentElement;
      var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    });
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

const CSS = `/* xStatic brand, taken from the logo:
   night #140223, plum #6c3673, rose #b55c76, coral #e58578, peach #faab7b, cream #fff8ef */
:root {
  --brand-night: #140223;
  --brand-plum: #6c3673;
  --brand-rose: #b55c76;
  --brand-coral: #e58578;
  --brand-peach: #faab7b;
  --brand-cream: #fff8ef;
  --brand-gradient: linear-gradient(90deg, var(--brand-plum), var(--brand-rose) 45%, var(--brand-coral) 70%, var(--brand-peach));

  --color-accent: var(--brand-coral);
  --color-link: light-dark(var(--brand-plum), var(--brand-peach));
  --color-link-hover: light-dark(#4a1f50, #ffcaa3);
  --color-on-accent: var(--brand-night);
  --color-bg: light-dark(#ffffff, #120b18);
  --color-bg-muted: light-dark(#faf6f4, #1a1221);
  --color-bg-inverse: var(--brand-night);
  --color-surface: light-dark(#ffffff, #1d1424);
  --color-heading: light-dark(#26112f, #f6eef2);
  --color-border: light-dark(#e6dde3, #34283c);
  --color-code-bg: light-dark(#f8f3f5, #1b1322);
  --color-focus: light-dark(var(--brand-plum), var(--brand-peach));
  --color-diagram-line: light-dark(#8e8292, #8e8292);
  --nav-current-bg: color-mix(in oklab, var(--brand-coral) 16%, transparent);
}

/* Layout: header and footer full width; sidebar, article and "On this page" in a centred grid */
.skip { position: absolute; left: -999px; }
.skip:focus { left: 16px; top: 8px; z-index: 10; padding: 4px 8px; background: var(--color-bg); }
.site-header { position: relative; background: var(--brand-night); border-bottom: 0; color: var(--brand-cream); }
.site-header::after { content: ''; position: absolute; inset: auto 0 0; height: 3px; background: var(--brand-gradient); }
.header-inner, .footer-inner { width: min(100% - 2 * var(--gutter), 1400px); margin-inline: auto; }
.header-inner { display: flex; align-items: center; justify-content: space-between; gap: var(--space-s); min-height: 4.75rem; padding-block: 0.5rem; }
.site-header a, .site-header .theme-toggle { color: var(--brand-cream); text-decoration: none; }
.site-header .brand { display: inline-flex; align-items: center; gap: 0.75rem; font-family: var(--font-display); font-weight: 600; font-size: var(--step-0); }
.site-header .brand img { display: block; width: 56px; height: 56px; }
.site-header .brand span { padding-left: 0.75rem; border-left: 1px solid rgb(255 248 239 / 0.3); }
.site-header nav { display: flex; flex-wrap: nowrap; align-items: center; gap: var(--space-s); }
@media (max-width: 480px) {
  .site-header .brand span { display: none; }
  .site-header nav { gap: 0.75rem; }
  .site-header .theme-toggle { min-width: 2.25rem; }
}
.site-header nav a { font-weight: 500; color: rgb(255 248 239 / 0.8); }
.site-header nav a:hover, .site-header .theme-toggle:hover { color: var(--brand-peach); }
.site-header :focus-visible, .site-footer :focus-visible { outline-color: var(--brand-peach); }

.layout { display: grid; grid-template-columns: minmax(0, 1fr); width: 100%; max-width: 1400px; margin: 0 auto; }
.sidebar { padding: var(--space-2xs) var(--gutter); border-bottom: 1px solid var(--color-border); font-size: var(--step--1); }
.sidebar summary { cursor: pointer; padding: 6px 0; font-family: var(--font-display); font-weight: 600; color: var(--color-heading); }
.sidebar ul, .toc ul { list-style: none; margin: 0; padding: 0; }
.sidebar li a, .toc li a { display: block; padding: 4px 10px; border-radius: var(--radius); color: var(--color-text); text-decoration: none; line-height: 1.4; }
.sidebar li a:hover, .toc li a:hover { color: var(--color-heading); background: var(--color-bg-muted); }
.sidebar li a[aria-current="page"] { background: var(--nav-current-bg); color: var(--color-heading); font-weight: 600; box-shadow: inset 3px 0 0 var(--color-accent); }
.nav-title { margin: 1.4rem 0 0.3rem; padding: 0 10px; font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-muted); }
.nav-section:first-child .nav-title { margin-top: 0.5rem; }
main { min-width: 0; padding: var(--space-m) var(--gutter) var(--space-section); }
.toc-col { display: none; }
.toc { font-size: var(--step--1); }
.toc li a { padding-block: 3px; border-left: 2px solid var(--color-border); border-radius: 0; }
@media (min-width: 900px) {
  .layout { grid-template-columns: 270px minmax(0, 1fr); }
  .sidebar { position: sticky; top: 0; align-self: start; max-height: 100vh; overflow-y: auto; padding: var(--space-s) var(--space-s) var(--space-l); border-bottom: 0; border-right: 1px solid var(--color-border); }
  .sidebar summary { display: none; }
  main { padding-inline: clamp(2rem, 4vw, 4rem); }
}
@media (min-width: 1240px) {
  .layout { grid-template-columns: 270px minmax(0, 1fr) 230px; }
  .toc-col { display: block; position: sticky; top: 0; align-self: start; padding: var(--space-l) var(--space-s); }
}

/* The page: sam.css type with the docs' own spacing */
.wiki-prose { max-width: 50rem; }
.wiki-prose > * { margin-block: 0; }
.wiki-prose > * + * { margin-top: 1em; }
.wiki-prose .eyebrow { margin-bottom: 0.4rem; }
.wiki-prose .eyebrow + h1 { margin-top: 0; }
.wiki-prose h1 { font-size: var(--step-4); line-height: 1.1; margin-bottom: var(--space-s); }
.wiki-prose h1::after { content: ''; display: block; width: 4rem; height: 4px; margin-top: var(--space-s); border-radius: 2px; background: var(--brand-gradient); }
.wiki-prose h2 { font-size: var(--step-3); margin-top: 2em; }
.wiki-prose h3 { font-size: var(--step-1); margin-top: 1.75em; }
.wiki-prose h4 { font-size: var(--step-0); margin-top: 1.5em; }
.wiki-prose :is(h2, h3, h4) { scroll-margin-top: 16px; }
.wiki-prose :is(h2, h3, h4) + * { margin-top: 0.6em; }
.wiki-prose :is(ul, ol) { padding-left: 1.4em; }
.wiki-prose li + li { margin-top: 0.35em; }
.wiki-prose li > :is(ul, ol) { margin-top: 0.35em; }
.wiki-prose img { border-radius: var(--radius); }
.wiki-prose blockquote { padding: var(--space-2xs) var(--space-s); background: var(--color-bg-muted); border-radius: 0 var(--radius) var(--radius) 0; }
.wiki-prose blockquote > * { margin: 0; }
.wiki-prose blockquote > * + * { margin-top: 0.6em; }

.wiki-code-block { border: 1px solid var(--color-border); border-radius: var(--radius-l); overflow: hidden; background: var(--color-code-bg); }
.wiki-code-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 4px 14px; border-bottom: 1px solid var(--color-border); font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-muted); }
.wiki-copy-btn { font: 600 0.75rem var(--font-sans); padding: 3px 12px; border: 1px solid var(--color-border); border-radius: var(--radius); background: var(--color-surface); color: var(--color-heading); cursor: pointer; }
.wiki-copy-btn:hover { border-color: var(--color-accent); }
.wiki-prose .wiki-code-block pre { margin: 0; border: 0; border-radius: 0; }
.wiki-prose pre code { font-size: 0.85rem; }

.wiki-table-wrap { overflow-x: auto; }
.wiki-prose table { display: table; width: auto; font-size: var(--step--1); }
.wiki-prose th, .wiki-prose td { vertical-align: top; }
.wiki-prose th { background: var(--color-bg-muted); font-family: var(--font-display); color: var(--color-heading); }

.wiki-diagram { overflow-x: auto; }
.wiki-diagram-svg svg {
  max-width: none; height: auto;
  --surface: var(--color-bg); --border: var(--color-diagram-line);
  --_text: var(--color-heading); --_text-sec: var(--color-text-muted); --_text-muted: var(--color-text-muted);
  --_text-faint: color-mix(in srgb, var(--color-text) 25%, var(--color-bg));
  --_line: var(--color-diagram-line); --_arrow: var(--brand-rose);
  --_node-fill: var(--color-surface); --_node-stroke: var(--color-diagram-line);
  --_group-fill: var(--color-bg); --_group-hdr: var(--color-bg-muted);
  --_inner-stroke: color-mix(in srgb, var(--color-text) 12%, var(--color-bg));
  --_key-badge: color-mix(in srgb, var(--color-text) 10%, var(--color-bg));
}
.wiki-diagram-svg svg text { font-family: var(--font-sans); }

a.wiki-video-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-l); background: var(--color-surface); text-decoration: none; color: var(--color-heading); }
a.wiki-video-card:hover { border-color: var(--color-accent); }
.wiki-video-icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--brand-coral), var(--brand-plum)); color: var(--brand-cream); }
.wiki-video-body { display: flex; flex-direction: column; gap: 2px; }
.wiki-video-title { font-weight: 600; }
.wiki-video-cta { font-size: var(--step--1); color: var(--color-link); }

.edit-link { max-width: 50rem; margin: var(--space-l) 0 0; padding-top: var(--space-s); border-top: 1px solid var(--color-border); font-size: var(--step--1); }
.site-footer { border-top: 3px solid transparent; border-image: var(--brand-gradient) 1; }
.footer-inner { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-2xs) var(--space-m); }
.footer-inner p { margin: 0; }
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
      eyebrow: isHome ? 'Documentation' : sectionTitleFor(bundle.sections, page.slug),
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
      bodyHtml: '<p>There\'s no page at this address. Try the contents, or start from the <a href="index.html">home page</a>.</p>',
      nav: renderNav(bundle.sections, ''),
      repoUrl: bundle.repoUrl,
    }).replace(/(href|src)="(?!https?:|#|\/)([^"]*)"/g, (_, attr, path) => `${attr}="${base ? new URL(path, base).pathname : path}"`)
  );

  mkdirSync(join(out, 'assets'), { recursive: true });
  for (const [name, source] of Object.entries(ASSETS)) copyFileSync(join(brandDir, source), join(out, 'assets', name));

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
