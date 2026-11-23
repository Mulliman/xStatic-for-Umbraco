#!/usr/bin/env node
// Compiles the Wiki/ Markdown files and local official plugin packages into a single
// self-contained JSON bundle for the xStatic backoffice Documentation dashboard.
//
//   node Tools/Wiki/compile-client-docs.mjs [outFile]
//
// Environment variables (optional):
//   PACKAGE_VERSION  Package version shown in the dashboard badge (defaults to XStatic.Client.csproj <Version>)
//   DOCS_GIT_REF     Git branch or tag used for GitHub links (must be lts/*, master, or a v* tag;
//                    unsupported refs fall back to lts/<major> or master)
//   DOCS_REPO_URL    GitHub repository URL (defaults to https://github.com/Mulliman/xStatic-for-Umbraco)

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, posix } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  repoRoot,
  wikiDir,
  specialPages,
  listPages,
  slugify,
  parseSidebar,
} from './wiki.mjs';

const DEFAULT_REPO_URL = 'https://github.com/Mulliman/xStatic-for-Umbraco';
const CLIENT_ASSETS_DIR = join(repoRoot, 'Source', 'XStaticCore', 'XStatic14', 'XStatic14.Client', 'assets');
const CLIENT_CSPROJ = join(repoRoot, 'Source', 'XStaticCore', 'XStatic14', 'XStatic14.Client', 'XStatic.Client.csproj');

const SUPPORTED_DOC_REF = /^(master|lts\/[A-Za-z0-9._-]+|v\d+[A-Za-z0-9._-]*)$/;

const CORE_PACKAGE_IDS = new Set([
  'xstatic',
  'xstatic.core',
  'xstatic.client',
  'xstatic14',
]);

const PLUGIN_DOC_SLUGS = {
  'xstatic.netlify': 'Deploying-to-Netlify',
  'xstatic.git': 'Deploying-with-Git',
  'xstatic.ftp': 'Deploying-to-FTP',
  'xstatic.cloudflare': 'Deploying-to-Cloudflare',
  'xstatic.ai': 'AI-Integration',
  'xstatic.remoteoperations': 'Remote-Operations',
  'xstatic-mcp': 'MCP-Server-and-Agent-Skill',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function isSafeExternalUrl(url) {
  return /^(https?:|mailto:)/i.test(url);
}

function isYouTubeUrl(url) {
  return /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(url);
}

function encodeGitRef(ref) {
  return ref.split('/').map(encodeURIComponent).join('/');
}

function isSupportedDocRef(ref) {
  return typeof ref === 'string' && SUPPORTED_DOC_REF.test(ref.trim());
}

function detectVersion() {
  if (process.env.PACKAGE_VERSION && process.env.PACKAGE_VERSION.trim()) {
    return process.env.PACKAGE_VERSION.trim();
  }
  if (existsSync(CLIENT_CSPROJ)) {
    const xml = readFileSync(CLIENT_CSPROJ, 'utf8');
    const m = /<Version>([^<]+)<\/Version>/i.exec(xml);
    if (m) return m[1].trim();
  }
  return '0.0.0';
}

function defaultFallbackRef(version) {
  const major = /^(\d+)\./.exec(version)?.[1];
  if (major === '17' || major === '13') {
    return `lts/${major}`;
  }
  return 'master';
}

export function resolveDocGitRef(requestedRef, version) {
  if (isSupportedDocRef(requestedRef)) {
    return requestedRef.trim();
  }

  if (isSupportedDocRef(process.env.DOCS_GIT_REF)) {
    return process.env.DOCS_GIT_REF.trim();
  }

  try {
    const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (isSupportedDocRef(branch)) {
      return branch;
    }
  } catch {
    // Ignore git lookup failures in non-git build environments
  }

  return defaultFallbackRef(version);
}

function readXmlTag(xml, tagName) {
  const m = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i').exec(xml);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function discoverLocalPlugins({ repoUrl, encodedGitRef, validSlugs }) {
  const plugins = [];
  const xstaticCoreDir = join(repoRoot, 'Source', 'XStaticCore');

  if (existsSync(xstaticCoreDir)) {
    for (const entry of readdirSync(xstaticCoreDir).sort()) {
      const dir = join(xstaticCoreDir, entry);
      if (!statSync(dir).isDirectory()) continue;
      if (entry.endsWith('.Tests') || entry.includes('IntegrationTests')) continue;

      const csprojFiles = readdirSync(dir).filter(f => f.endsWith('.csproj'));
      for (const csprojFile of csprojFiles) {
        const csprojPath = join(dir, csprojFile);
        const xml = readFileSync(csprojPath, 'utf8');
        const id = readXmlTag(xml, 'PackageId');
        if (!id || CORE_PACKAGE_IDS.has(id.toLowerCase())) continue;

        const description = readXmlTag(xml, 'Description');
        const author = readXmlTag(xml, 'Authors') || 'Sam Mullins';
        const relDir = posix.normalize(relative(repoRoot, dir).split('\\').join('/'));
        const docSlugCandidate = PLUGIN_DOC_SLUGS[id.toLowerCase()];
        const docSlug = docSlugCandidate && validSlugs.has(docSlugCandidate) ? docSlugCandidate : undefined;

        plugins.push({
          id,
          author,
          description,
          kind: 'nuget',
          packageUrl: `https://www.nuget.org/packages/${encodeURIComponent(id)}`,
          gitUrl: `${repoUrl}/tree/${encodedGitRef}/${relDir.split('/').map(encodeURIComponent).join('/')}`,
          ...(docSlug ? { docSlug } : {}),
        });
      }
    }
  }

  // Also include the official xstatic-mcp package if present on this branch
  const mcpPkgPath = join(repoRoot, 'Source', 'xstatic-mcp', 'package.json');
  if (existsSync(mcpPkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(mcpPkgPath, 'utf8'));
      const id = pkg.name || 'xstatic-mcp';
      const docSlugCandidate = PLUGIN_DOC_SLUGS[id.toLowerCase()];
      const docSlug = docSlugCandidate && validSlugs.has(docSlugCandidate) ? docSlugCandidate : undefined;
      plugins.push({
        id,
        author: typeof pkg.author === 'string' ? pkg.author : 'Sam Mullins',
        description: pkg.description || 'Official Model Context Protocol (MCP) server for xStatic.',
        kind: 'npm',
        gitUrl: `${repoUrl}/tree/${encodedGitRef}/Source/xstatic-mcp`,
        ...(docSlug ? { docSlug } : {}),
      });
    } catch {
      // Ignore malformed package.json
    }
  }

  return plugins;
}

async function loadCompilers(overrides = {}) {
  let MarkedClass = overrides.Marked;
  let renderMermaidSVG = overrides.renderMermaidSVG;

  if (!MarkedClass) {
    const markedEntry = join(CLIENT_ASSETS_DIR, 'node_modules', 'marked', 'lib', 'marked.esm.js');
    const mod = await import(pathToFileURL(markedEntry).href);
    MarkedClass = mod.Marked;
  }

  if (!renderMermaidSVG) {
    const mermaidEntry = join(CLIENT_ASSETS_DIR, 'node_modules', 'beautiful-mermaid', 'dist', 'index.js');
    const mod = await import(pathToFileURL(mermaidEntry).href);
    renderMermaidSVG = mod.renderMermaidSVG;
  }

  return { MarkedClass, renderMermaidSVG };
}

const MERMAID_SVG_OPTIONS = {
  font: 'system-ui',
  padding: 24,
  transparent: true,
};

function cleanMermaidSvg(rawSvg) {
  // Strip <style> blocks (which contain an external Google Fonts @import and repeated theme vars);
  // theme variables are applied once via Shadow DOM CSS on `.wiki-diagram-svg svg` so diagrams
  // work 100% offline and adapt automatically to Umbraco light/dark themes.
  return rawSvg
    .replace(/<style>[\s\S]*?<\/style>\s*/g, '')
    .replace(/\sstyle="[^"]*"/, '');
}

function renderVideoCard(href, title) {
  return (
    `<a class="wiki-video-card" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">` +
    `<span class="wiki-video-icon" aria-hidden="true">` +
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>` +
    `</span>` +
    `<span class="wiki-video-body">` +
    `<span class="wiki-video-title">${escapeHtml(title || 'Watch video on YouTube')}</span>` +
    `<span class="wiki-video-cta">Watch on YouTube &rarr;</span>` +
    `</span>` +
    `</a>`
  );
}

/**
 * Compiles all Wiki/*.md pages and local official packages into a WikiDocsBundle object.
 */
export async function compileClientDocs(options = {}) {
  const { MarkedClass, renderMermaidSVG } = await loadCompilers(options);
  const version = options.version ?? detectVersion();
  const gitRef = resolveDocGitRef(options.gitRef, version);
  const encodedGitRef = encodeGitRef(gitRef);
  const repoUrl = (options.repoUrl ?? process.env.DOCS_REPO_URL ?? DEFAULT_REPO_URL).replace(/\/$/, '');
  const wikiUrl = `${repoUrl}/wiki`;
  const repoBlobBase = `${repoUrl}/blob/${encodedGitRef}/`;
  const repoRawWikiBase = `${repoUrl}/raw/${encodedGitRef}/Wiki/`;

  const allFiles = listPages();
  const sidebarPath = join(wikiDir, '_Sidebar.md');
  const sidebarMarkdown = existsSync(sidebarPath) ? readFileSync(sidebarPath, 'utf8') : '';
  const sections = parseSidebar(sidebarMarkdown);

  // Map slug -> { label, category } from _Sidebar.md
  const sidebarMeta = new Map();
  for (const section of sections) {
    for (const item of section.items) {
      if (!sidebarMeta.has(item.slug)) {
        sidebarMeta.set(item.slug, { label: item.label, category: section.title });
      }
    }
  }

  const contentFiles = allFiles.filter(f => !specialPages.includes(f));
  const validSlugs = new Set(contentFiles.map(f => f.slice(0, -3)));
  const pages = {};
  let mermaidCount = 0;

  for (const file of contentFiles) {
    const slug = file.slice(0, -3);
    const md = readFileSync(join(wikiDir, file), 'utf8');
    const meta = sidebarMeta.get(slug);
    const title = meta?.label ?? slug.replace(/-/g, ' ');
    const category = meta?.category ?? '';
    const githubUrl = `${repoBlobBase}Wiki/${encodeURIComponent(file)}`;

    const headings = [];
    const anchorCounts = new Map();

    const markedInstance = new MarkedClass({ gfm: true, breaks: false });
    const renderer = {
      heading(token) {
        const rawText = token.text ?? '';
        const depth = token.depth;
        const inner = this.parser.parseInline(token.tokens);
        const plainText = rawText
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
          .replace(/`/g, '')
          .replace(/[*_~]/g, '')
          .trim();

        const base = slugify(rawText);
        const count = anchorCounts.get(base) ?? 0;
        const id = count === 0 ? base : `${base}-${count}`;
        anchorCounts.set(base, count + 1);

        if (depth === 2 || depth === 3) {
          headings.push({ id, text: plainText, level: depth });
        }

        return `<h${depth} id="${escapeAttr(id)}">${inner}</h${depth}>\n`;
      },

      code(token) {
        const lang = (token.lang ?? '').trim().split(/\s+/)[0] || '';
        const text = token.text ?? '';

        if (lang.toLowerCase() === 'mermaid') {
          mermaidCount++;
          const svg = cleanMermaidSvg(renderMermaidSVG(text, MERMAID_SVG_OPTIONS));
          return `<figure class="wiki-diagram" data-diagram="mermaid"><div class="wiki-diagram-svg">${svg}</div></figure>\n`;
        }

        const displayLang = lang || 'text';
        return (
          `<div class="wiki-code-block" data-lang="${escapeAttr(displayLang)}">` +
          `<div class="wiki-code-header">` +
          `<span class="wiki-code-lang">${escapeHtml(displayLang)}</span>` +
          `<button type="button" class="wiki-copy-btn" data-copy-code>Copy</button>` +
          `</div>` +
          `<pre><code class="language-${escapeAttr(displayLang)}">${escapeHtml(text)}</code></pre>` +
          `</div>\n`
        );
      },

      table(token) {
        let headerCells = '';
        for (let i = 0; i < token.header.length; i++) {
          const cell = token.header[i];
          const align = token.align[i] ? ` style="text-align:${token.align[i]}"` : '';
          headerCells += `<th${align}>${this.parser.parseInline(cell.tokens)}</th>`;
        }
        const header = `<tr>${headerCells}</tr>`;

        let body = '';
        for (const row of token.rows) {
          let rowCells = '';
          for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            const align = token.align[i] ? ` style="text-align:${token.align[i]}"` : '';
            rowCells += `<td${align}>${this.parser.parseInline(cell.tokens)}</td>`;
          }
          body += `<tr>${rowCells}</tr>`;
        }

        return `<div class="wiki-table-wrap"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`;
      },

      link(token) {
        const href = (token.href ?? '').trim();
        const titleAttr = token.title ? ` title="${escapeAttr(token.title)}"` : '';

        // Convert linked YouTube video thumbnail images into lightweight video cards
        if (
          isYouTubeUrl(href) &&
          Array.isArray(token.tokens) &&
          token.tokens.length === 1 &&
          token.tokens[0].type === 'image' &&
          String(token.tokens[0].href ?? '').startsWith('images/video-')
        ) {
          return renderVideoCard(href, token.tokens[0].text || 'Watch video on YouTube');
        }

        const inner = this.parser.parseInline(token.tokens);

        // Same-page anchor link
        if (href.startsWith('#')) {
          const anchor = decodeURIComponent(href.slice(1));
          return `<a href="#${escapeAttr(anchor)}" data-wiki-anchor="${escapeAttr(anchor)}"${titleAttr}>${inner}</a>`;
        }

        // External link
        if (isSafeExternalUrl(href)) {
          return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${inner}</a>`;
        }

        const [rawPath, rawAnchor] = href.split('#');
        const decodedPath = decodeURIComponent(rawPath);
        const anchor = rawAnchor ? decodeURIComponent(rawAnchor) : '';

        // Repository-relative link (../Source/...)
        if (decodedPath.startsWith('../')) {
          const repoPath = posix.normalize(
            relative(repoRoot, resolve(wikiDir, decodedPath)).split('\\').join('/')
          );
          const encoded = repoPath.split('/').map(encodeURIComponent).join('/');
          const targetUrl = repoBlobBase + encoded + (anchor ? `#${encodeURIComponent(anchor)}` : '');
          return `<a href="${escapeAttr(targetUrl)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${inner}</a>`;
        }

        // Internal wiki page link (Page-Name.md or Page-Name.md#anchor)
        if (decodedPath.endsWith('.md')) {
          const targetSlug = decodedPath.slice(0, -3);
          if (validSlugs.has(targetSlug)) {
            const hashHref = `#wiki/${targetSlug}${anchor ? `#${anchor}` : ''}`;
            const anchorAttr = anchor ? ` data-wiki-anchor="${escapeAttr(anchor)}"` : '';
            return `<a href="${escapeAttr(hashHref)}" data-wiki-page="${escapeAttr(targetSlug)}"${anchorAttr}${titleAttr}>${inner}</a>`;
          }
        }

        // Fallback: reject unknown/unsafe schemes (e.g., javascript:)
        return `<span>${inner}</span>`;
      },

      image(token) {
        const href = (token.href ?? '').trim();
        const alt = token.text ?? '';
        // Banner on Home.md is replaced by the backoffice header
        if (href === 'images/banner.png') {
          return '';
        }
        if (href.startsWith('images/')) {
          const remoteUrl = repoRawWikiBase + href.split('/').map(encodeURIComponent).join('/');
          return `<img src="${escapeAttr(remoteUrl)}" alt="${escapeAttr(alt)}" loading="lazy" />`;
        }
        if (isSafeExternalUrl(href)) {
          return `<img src="${escapeAttr(href)}" alt="${escapeAttr(alt)}" loading="lazy" />`;
        }
        return '';
      },

      html(token) {
        // Escape any raw HTML in Markdown to prevent injection
        return escapeHtml(token.text ?? token.raw ?? '');
      },
    };

    markedInstance.use({ renderer });
    const html = markedInstance.parse(md);

    pages[slug] = {
      slug,
      title,
      category,
      githubUrl,
      headings,
      html,
    };
  }

  const plugins = discoverLocalPlugins({ repoUrl, encodedGitRef, validSlugs });

  return {
    bundle: {
      version,
      gitRef,
      repoUrl,
      wikiUrl,
      generatedAt: new Date().toISOString(),
      sections,
      pages,
      plugins,
    },
    stats: {
      pageCount: Object.keys(pages).length,
      mermaidCount,
      pluginCount: plugins.length,
    },
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const outArg = process.argv[2] ?? join(repoRoot, 'Source', 'XStaticCore', 'XStatic14', 'XStatic14.Client', 'wwwroot', 'App_Plugins', 'xstatic14', 'docs', 'docs-bundle.json');
  const outPath = resolve(outArg);
  const { bundle, stats } = await compileClientDocs();
  mkdirSync(dirname(outPath), { recursive: true });
  const json = JSON.stringify(bundle);
  writeFileSync(outPath, json, 'utf8');
  console.log(`Compiled ${stats.pageCount} wiki pages (${stats.mermaidCount} Mermaid SVGs, ${stats.pluginCount} local plugins) -> ${outPath} (${(Buffer.byteLength(json) / 1024).toFixed(1)} KB raw)`);
}
