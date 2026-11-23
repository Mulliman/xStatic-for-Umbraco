import { describe, expect, it } from 'vitest';
import { flattenSidebarOrder, searchWikiDocs } from './wiki-search';
import type { WikiDocsBundle } from './types.docs';

const sampleBundle: WikiDocsBundle = {
	version: '17.3.0',
	gitRef: 'lts/17',
	repoUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco',
	wikiUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/wiki',
	generatedAt: '2026-11-22T00:00:00.000Z',
	sections: [
		{ title: '', items: [{ slug: 'Home', label: 'Home' }] },
		{
			title: 'Deploying',
			items: [
				{ slug: 'Deploying-to-Netlify', label: 'To Netlify' },
				{ slug: 'Deploying-to-FTP', label: 'To FTP' },
			],
		},
	],
	pages: {
		Home: {
			slug: 'Home',
			title: 'Home',
			category: '',
			githubUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/blob/lts/17/Wiki/Home.md',
			headings: [{ id: 'where-to-start', text: 'Where to start', level: 2 }],
			html: '<p>Welcome to xStatic.</p>',
			searchText: 'xStatic turns your Umbraco site into a static website. Supports Netlify and FTP.',
		},
		'Deploying-to-Netlify': {
			slug: 'Deploying-to-Netlify',
			title: 'To Netlify',
			category: 'Deploying',
			githubUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/blob/lts/17/Wiki/Deploying-to-Netlify.md',
			headings: [{ id: 'netlify-site-creator', text: 'Netlify site creator', level: 2 }],
			html: '<p>Deploy to Netlify.</p>',
			searchText: 'Deploy your generated static site to Netlify using a personal access token.',
		},
		'Deploying-to-FTP': {
			slug: 'Deploying-to-FTP',
			title: 'To FTP',
			category: 'Deploying',
			githubUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/blob/lts/17/Wiki/Deploying-to-FTP.md',
			headings: [{ id: 'passive-mode', text: 'Passive mode', level: 2 }],
			html: '<p>Mirror to FTP.</p>',
			searchText: 'Mirror files onto an FTP server with passive mode enabled.',
		},
	},
	plugins: [],
};

describe('wiki-search', () => {
	it('returns empty array for empty or whitespace queries', () => {
		expect(searchWikiDocs(sampleBundle, '')).toEqual([]);
		expect(searchWikiDocs(sampleBundle, '   ')).toEqual([]);
		expect(searchWikiDocs(undefined, 'netlify')).toEqual([]);
	});

	it('ranks title matches above body-only matches', () => {
		const results = searchWikiDocs(sampleBundle, 'netlify');
		expect(results.length).toBe(2);
		expect(results[0].slug).toBe('Deploying-to-Netlify');
		expect(results[1].slug).toBe('Home');
	});

	it('matches multi-word queries across headings and body and extracts snippet', () => {
		const results = searchWikiDocs(sampleBundle, 'passive mirror');
		expect(results.length).toBe(1);
		expect(results[0].slug).toBe('Deploying-to-FTP');
		expect(results[0].matchedHeading).toBe('Passive mode');
		expect(results[0].snippet.toLowerCase()).toContain('mirror');
	});

	it('flattens sidebar pages in reading order without duplicates', () => {
		const order = flattenSidebarOrder(sampleBundle);
		expect(order.map((x) => x.slug)).toEqual(['Home', 'Deploying-to-Netlify', 'Deploying-to-FTP']);
	});
});
