export interface WikiSidebarItem {
	slug: string;
	label: string;
}

export interface WikiSidebarSection {
	title: string;
	items: Array<WikiSidebarItem>;
}

export interface WikiHeading {
	id: string;
	text: string;
	level: number;
}

export interface WikiPage {
	slug: string;
	title: string;
	category: string;
	githubUrl: string;
	headings: Array<WikiHeading>;
	html: string;
	searchText?: string;
}

export interface WikiPlugin {
	id: string;
	author: string;
	description: string;
	kind: 'nuget' | 'npm';
	packageUrl?: string;
	gitUrl: string;
	docSlug?: string;
}

export interface WikiDocsBundle {
	version: string;
	gitRef: string;
	repoUrl: string;
	wikiUrl: string;
	generatedAt: string;
	sections: Array<WikiSidebarSection>;
	pages: Record<string, WikiPage>;
	plugins: Array<WikiPlugin>;
}
