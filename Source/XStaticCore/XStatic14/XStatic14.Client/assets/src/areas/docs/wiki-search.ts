import type { WikiDocsBundle, WikiPage } from './types.docs';

export interface WikiSearchResult {
	slug: string;
	title: string;
	category: string;
	score: number;
	matchedHeading?: string;
	snippet: string;
}

function buildSnippet(text: string, terms: Array<string>, maxLength = 150): string {
	if (!text) return '';
	const lower = text.toLowerCase();
	let firstIdx = -1;
	for (const term of terms) {
		const idx = lower.indexOf(term);
		if (idx !== -1 && (firstIdx === -1 || idx < firstIdx)) {
			firstIdx = idx;
		}
	}

	if (firstIdx === -1) {
		return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text;
	}

	const start = Math.max(0, firstIdx - 45);
	const end = Math.min(text.length, start + maxLength);
	const prefix = start > 0 ? '...' : '';
	const suffix = end < text.length ? '...' : '';
	return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export function extractPlainTextFromHtml(html: string): string {
	return html
		.replace(/<figure[^>]*data-diagram="mermaid"[\s\S]*?<\/figure>/gi, ' ')
		.replace(/<div[^>]*class="wiki-code-block"[\s\S]*?<\/div>\s*<\/div>/gi, ' ')
		.replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
		.replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&rarr;/g, ' ')
		// Decode &amp; last, so "&amp;lt;" becomes the text "&lt;" rather than "<".
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function getSearchText(page: WikiPage): string {
	if (page.searchText === undefined) {
		page.searchText = extractPlainTextFromHtml(page.html);
	}
	return page.searchText;
}

function scorePage(page: WikiPage, queryLower: string, terms: Array<string>): WikiSearchResult | null {
	const titleLower = page.title.toLowerCase();
	const categoryLower = page.category.toLowerCase();
	const bodyText = getSearchText(page);
	const bodyLower = bodyText.toLowerCase();
	const headingsLower = page.headings.map((h) => ({ raw: h.text, lower: h.text.toLowerCase() }));

	// Every query term must match somewhere in title, category, headings, or body.
	for (const term of terms) {
		const inTitle = titleLower.includes(term);
		const inCategory = categoryLower.includes(term);
		const inHeading = headingsLower.some((h) => h.lower.includes(term));
		const inBody = bodyLower.includes(term);
		if (!inTitle && !inCategory && !inHeading && !inBody) {
			return null;
		}
	}

	let score = 0;
	let matchedHeading: string | undefined;

	if (titleLower === queryLower) score += 120;
	else if (titleLower.startsWith(queryLower)) score += 90;
	else if (titleLower.includes(queryLower)) score += 70;

	for (const term of terms) {
		if (titleLower.includes(term)) score += 30;
		if (categoryLower.includes(term)) score += 10;
	}

	for (const h of headingsLower) {
		if (h.lower.includes(queryLower)) {
			score += 45;
			matchedHeading ??= h.raw;
		} else if (terms.some((t) => h.lower.includes(t))) {
			score += 20;
			matchedHeading ??= h.raw;
		}
	}

	if (bodyLower.includes(queryLower)) score += 25;
	for (const term of terms) {
		if (bodyLower.includes(term)) score += 8;
	}

	return {
		slug: page.slug,
		title: page.title,
		category: page.category,
		score,
		matchedHeading,
		snippet: buildSnippet(bodyText, terms),
	};
}

export function searchWikiDocs(bundle: WikiDocsBundle | undefined, query: string): Array<WikiSearchResult> {
	if (!bundle) return [];
	const trimmed = query.trim().toLowerCase();
	if (!trimmed) return [];

	const terms = trimmed.split(/\s+/).filter(Boolean);
	if (!terms.length) return [];

	const results: Array<WikiSearchResult> = [];
	for (const page of Object.values(bundle.pages)) {
		const match = scorePage(page, trimmed, terms);
		if (match) results.push(match);
	}

	results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
	return results;
}

export function flattenSidebarOrder(bundle: WikiDocsBundle | undefined): Array<{ slug: string; label: string; category: string }> {
	if (!bundle) return [];
	const seen = new Set<string>();
	const ordered: Array<{ slug: string; label: string; category: string }> = [];

	for (const section of bundle.sections) {
		for (const item of section.items) {
			if (!seen.has(item.slug) && bundle.pages[item.slug]) {
				seen.add(item.slug);
				ordered.push({ slug: item.slug, label: item.label, category: section.title });
			}
		}
	}

	return ordered;
}
