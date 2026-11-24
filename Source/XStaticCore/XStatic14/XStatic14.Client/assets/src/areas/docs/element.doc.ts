import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, html, customElement, property, when } from '@umbraco-cms/backoffice/external/lit';
import { xStaticCardStyles } from '../../code/styles';

export type DocModel = {
	heading: string;
	description: string;
	author: string;
	docSlug?: string;
	links: Array<{ href: string; text: string }>;
};

@customElement('xstatic-doc-element')
class DocElement extends UmbLitElement {
	@property({ type: Object, attribute: false })
	doc?: DocModel;

	#openDocs(slug: string) {
		this.dispatchEvent(
			new CustomEvent('xstatic-open-wiki-page', {
				detail: { slug },
				bubbles: true,
				composed: true,
			}),
		);
	}

	render() {
		if (!this.doc) {
			return html``;
		}

		const doc = this.doc;

		return html`
			<uui-box>
				<div slot="headline" class="headline">${doc.heading}</div>

				<div class="card-body">
					<h3>${doc.description}</h3>
					${when(doc.author, () => html`<h4>Author: <strong>${doc.author}</strong></h4>`)}

					<div class="buttons">
						${when(
							doc.docSlug,
							(slug) =>
								html`<uui-button
									label="Read Docs"
									color="default"
									look="primary"
									@click=${() => this.#openDocs(slug)}
								></uui-button>`,
						)}
						${doc.links?.map(
							(link) =>
								html`<uui-button
									label=${link.text}
									href=${link.href}
									target="_blank"
									rel="noopener noreferrer"
									color=${link.text?.includes('Git') ? 'positive' : 'default'}
									look=${doc.docSlug ? 'secondary' : 'primary'}
								></uui-button>`,
						)}
					</div>
				</div>
			</uui-box>
		`;
	}

	static styles = [
		xStaticCardStyles,
		css`
			h3 {
				margin: 0;
				font-weight: normal;
			}

			h4 {
				margin: var(--uui-size-space-2) 0 0;
			}
		`,
	];
}

export default DocElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-doc-element': DocElement;
	}
}
