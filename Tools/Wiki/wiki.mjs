#!/usr/bin/env node
// Checks and builds the xStatic wiki (the Wiki/ folder) for the GitHub wiki.
//
//   node Tools/Wiki/wiki.mjs check
//   node Tools/Wiki/wiki.mjs build <outDir> [--repo-url https://github.com/owner/repo] [--branch master]
//
// Source pages link to each other as `Page-Name.md` so they also work when browsing the repo.
// `build` copies the pages and images into <outDir> (a clone of the wiki repo) and rewrites:
//   - `Page-Name.md` and `Page-Name.md#anchor` links into GitHub wiki links (`Page-Name`, `Page-Name#anchor`)
//   - links that leave the wiki folder (`../Source/...`) into absolute links to the main repo
// No dependencies: plain Node 20+.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative, extname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const wikiDir = join(repoRoot, 'Wiki');
const imageDirName = 'images';
const specialPages = ['_Sidebar.md', '_Footer.md'];

function listPages() {
  return readdirSync(wikiDir).filter(f => f.endsWith('.md')).sort();
}

function listImages() {
  const dir = join(wikiDir, imageDirName);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => statSync(join(dir, f)).isFile());
}

// GitHub heading anchor rules: lower-case, drop punctuation except - and _, spaces become -,
// duplicates get -1, -2, ...
function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

function stripCode(markdown) {
  // Remove fenced code blocks and inline code so links/headings inside them are ignored.
  return markdown
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

function anchorsFor(markdown) {
  const anchors = new Set();
  const counts = new Map();
  for (const line of stripCode(markdown).split('\n')) {
    const m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const base = slugify(m[2]);
    const n = counts.get(base) ?? 0;
    anchors.add(n === 0 ? base : `${base}-${n}`);
    counts.set(base, n + 1);
  }
  // Explicit HTML anchors: <a id="x"></a> or <a name="x"></a>
  for (const m of markdown.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) anchors.add(m[1]);
  return anchors;
}

function linksIn(markdown) {
  const links = [];
  const text = stripCode(markdown);
  for (const m of text.matchAll(/!?\[(?:[^\[\]]|\[[^\]]*\])*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    links.push({ target: m[1], image: m[0].startsWith('!') });
  }
  for (const m of text.matchAll(/<img[^>]+src="([^"]+)"/g)) links.push({ target: m[1], image: true });
  return links;
}

function check() {
  const errors = [];
  const warnings = [];
  const pages = listPages();
  const pageSet = new Set(pages);
  const images = new Set(listImages());
  const contents = new Map(pages.map(p => [p, readFileSync(join(wikiDir, p), 'utf8')]));
  const anchors = new Map(pages.map(p => [p, anchorsFor(contents.get(p))]));
  const linkedFrom = new Map(pages.map(p => [p, new Set()]));

  if (!pageSet.has('Home.md')) errors.push('Wiki/Home.md is missing (GitHub uses it as the wiki front page).');
  if (!pageSet.has('_Sidebar.md')) errors.push('Wiki/_Sidebar.md is missing.');

  const lower = new Map();
  for (const p of pages) {
    if (!/^[A-Za-z0-9_][A-Za-z0-9-]*\.md$/.test(p)) {
      errors.push(`${p}: page file names may only use letters, digits and hyphens (GitHub turns hyphens into spaces in the title).`);
    }
    const key = p.toLowerCase();
    if (lower.has(key)) errors.push(`${p}: clashes with ${lower.get(key)} (the wiki is case-insensitive).`);
    lower.set(key, p);
  }

  for (const [page, md] of contents) {
    const firstLine = md.split('\n').find(l => l.trim() !== '') ?? '';
    if (!specialPages.includes(page) && /^#\s/.test(firstLine)) {
      warnings.push(`${page}: starts with a level-1 heading; GitHub already shows the file name as the page title.`);
    }

    // Code fences must say which language they are.
    const fenceLines = md.split('\n').map((l, i) => [l, i + 1]).filter(([l]) => /^\s*```/.test(l));
    for (let i = 0; i < fenceLines.length; i += 2) {
      const [line, num] = fenceLines[i];
      if (/^\s*```\s*$/.test(line)) errors.push(`${page}:${num}: code fence has no language (use text if nothing fits).`);
    }
    if (fenceLines.length % 2 !== 0) errors.push(`${page}: unbalanced code fences.`);

    for (const { target, image } of linksIn(md)) {
      if (/^(https?:|mailto:)/i.test(target)) continue;
      if (target.startsWith('#')) {
        if (!anchors.get(page).has(decodeURIComponent(target.slice(1)))) errors.push(`${page}: anchor ${target} not found on this page.`);
        continue;
      }
      const [pathPart, anchor] = target.split('#');
      const decoded = decodeURIComponent(pathPart);
      if (decoded.startsWith('../')) {
        // Link into the main repository; check the file exists.
        const abs = resolve(wikiDir, decoded);
        if (!existsSync(abs)) errors.push(`${page}: repository link ${target} points at a path that doesn't exist.`);
        continue;
      }
      if (image || decoded.startsWith(`${imageDirName}/`)) {
        const name = decoded.replace(`${imageDirName}/`, '');
        if (!decoded.startsWith(`${imageDirName}/`)) errors.push(`${page}: image ${target} must live in Wiki/${imageDirName}/.`);
        else if (!images.has(name)) errors.push(`${page}: image ${target} not found.`);
        continue;
      }
      if (!decoded.endsWith('.md')) {
        errors.push(`${page}: link ${target} should point at a page file (Page-Name.md) so it works in the repo and the wiki.`);
        continue;
      }
      if (!pageSet.has(decoded)) {
        errors.push(`${page}: link to missing page ${decoded}.`);
        continue;
      }
      linkedFrom.get(decoded).add(page);
      if (anchor && !anchors.get(decoded).has(decodeURIComponent(anchor))) {
        errors.push(`${page}: anchor #${anchor} not found on ${decoded}.`);
      }
    }
  }

  const sidebar = contents.get('_Sidebar.md') ?? '';
  for (const page of pages) {
    if (specialPages.includes(page) || page === 'Home.md') continue;
    if (!sidebar.includes(`(${page})`) && !sidebar.includes(`(${page}#`)) {
      errors.push(`${page}: not listed in _Sidebar.md.`);
    }
  }

  for (const img of images) {
    if (![...contents.values()].some(md => md.includes(`${imageDirName}/${img}`))) warnings.push(`images/${img}: not used by any page.`);
  }

  for (const w of warnings) console.warn(`warning: ${w}`);
  for (const e of errors) console.error(`error: ${e}`);
  console.log(`${pages.length} pages, ${images.size} images, ${errors.length} errors, ${warnings.length} warnings.`);
  return errors.length === 0;
}

function build(outDir, repoUrl, branch) {
  if (!outDir) throw new Error('Usage: wiki.mjs build <outDir> [--repo-url URL] [--branch NAME]');
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });

  // Remove pages and images that no longer exist in the source, but leave .git alone.
  const sourcePages = new Set(listPages());
  for (const f of readdirSync(out)) {
    if (f.endsWith('.md') && !sourcePages.has(f)) rmSync(join(out, f));
  }
  const outImages = join(out, imageDirName);
  if (existsSync(outImages)) rmSync(outImages, { recursive: true });

  const repoBase = `${repoUrl.replace(/\/$/, '')}/blob/${branch}/`;
  for (const page of sourcePages) {
    let md = readFileSync(join(wikiDir, page), 'utf8');
    md = rewriteLinks(md, target => {
      if (/^(https?:|mailto:|#)/i.test(target)) return target;
      const [pathPart, anchor] = target.split('#');
      if (pathPart.startsWith('../')) {
        const repoPath = posix.normalize(relative(repoRoot, resolve(wikiDir, decodeURIComponent(pathPart))).split('\\').join('/'));
        const encoded = repoPath.split('/').map(encodeURIComponent).join('/');
        return repoBase + encoded + (anchor ? `#${anchor}` : '');
      }
      if (pathPart.endsWith('.md')) return pathPart.slice(0, -3) + (anchor ? `#${anchor}` : '');
      return target;
    });
    writeFileSync(join(out, page), md);
  }

  const images = listImages();
  if (images.length) {
    mkdirSync(outImages, { recursive: true });
    for (const img of images) copyFileSync(join(wikiDir, imageDirName, img), join(outImages, img));
  }
  console.log(`Built ${sourcePages.size} pages and ${images.length} images into ${out}`);
}

function rewriteLinks(markdown, fn) {
  // Rewrite links outside code blocks only.
  const parts = markdown.split(/(^(?:```|~~~)[^\n]*\n[\s\S]*?^(?:```|~~~)\s*$)/m);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // code block
      return part
        .split(/(`[^`\n]*`)/)
        .map((seg, j) => (j % 2 === 1 ? seg : seg.replace(/(\]\(\s*<?)([^)\s>]+)/g, (_, pre, t) => pre + fn(t))))
        .join('');
    })
    .join('');
}

const [, , command, ...rest] = process.argv;
const opt = name => {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
};

if (command === 'check') {
  process.exit(check() ? 0 : 1);
} else if (command === 'build') {
  if (!check()) process.exit(1);
  build(rest[0], opt('--repo-url') ?? 'https://github.com/Mulliman/xStatic-for-Umbraco', opt('--branch') ?? 'master');
} else {
  console.log('Usage: node Tools/Wiki/wiki.mjs check | build <outDir> [--repo-url URL] [--branch NAME]');
  process.exit(command ? 1 : 0);
}
