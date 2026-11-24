#!/usr/bin/env node
// Checks the xStatic wiki (the Wiki/ folder), which is published as the GitHub Pages docs site.
//
//   node Tools/Wiki/wiki.mjs check
//
// Source pages link to each other as `Page-Name.md` so they also work when browsing the repo.
// No dependencies: plain Node 20+.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '..', '..');
export const wikiDir = join(repoRoot, 'Wiki');
export const imageDirName = 'images';
export const specialPages = ['_Sidebar.md', '_Footer.md'];

export function listPages() {
  return readdirSync(wikiDir).filter(f => f.endsWith('.md')).sort();
}

export function listImages() {
  const dir = join(wikiDir, imageDirName);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => statSync(join(dir, f)).isFile());
}

// Remove HTML tags, repeating until none are left so input like "<scr<b>ipt>" can't leave one behind.
function stripTags(text) {
  let previous;
  do {
    previous = text;
    text = text.replace(/<[^>]+>/g, '');
  } while (text !== previous);
  return text;
}

// GitHub heading anchor rules: lower-case, drop punctuation except - and _, spaces become -,
// duplicates get -1, -2, ...
export function slugify(text) {
  return stripTags(text.trim().toLowerCase())
    .replace(/`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

export function stripCode(markdown) {
  // Remove fenced code blocks and inline code so links/headings inside them are ignored.
  return markdown
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1\s*$/gm, '')
    .replace(/`[^`\n]*`/g, '');
}

export function anchorsFor(markdown) {
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

export function parseSidebar(sidebarMarkdown) {
  const sections = [];
  let current = null;

  for (const rawLine of sidebarMarkdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Top-level standalone linked entry like `**[Home](Home.md)**`
    const standalone = /^\*\*\[([^\]]+)\]\(([^)]+\.md)(?:#[^)]+)?\)\*\*$/.exec(line);
    if (standalone) {
      const slug = standalone[2].slice(0, -3);
      sections.push({
        title: '',
        items: [{ slug, label: standalone[1] }],
      });
      current = null;
      continue;
    }

    // Section heading like `**Getting started**`
    const heading = /^\*\*([^*]+)\*\*$/.exec(line);
    if (heading) {
      current = { title: heading[1].trim(), items: [] };
      sections.push(current);
      continue;
    }

    // Bullet item like `- [What is xStatic?](What-is-xStatic.md)`
    const item = /^-\s+\[([^\]]+)\]\(([^)]+\.md)(?:#[^)]+)?\)$/.exec(line);
    if (item) {
      const slug = item[2].slice(0, -3);
      if (!current) {
        current = { title: '', items: [] };
        sections.push(current);
      }
      current.items.push({ slug, label: item[1] });
    }
  }

  return sections;
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

export function check() {
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

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const command = process.argv[2];
  if (command === 'check') {
    process.exit(check() ? 0 : 1);
  } else {
    console.log('Usage: node Tools/Wiki/wiki.mjs check');
    process.exit(command ? 1 : 0);
  }
}
