import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { LitElement, css, html, customElement, property, when } from '@umbraco-cms/backoffice/external/lit';

export type DocModel = {
	heading: string;
	description: string;
	author: string;
	docSlug?: string;
	links: Array<{ href: string; text: string }>;
};

@customElement('xstatic-doc-element')
class DocElement extends UmbElementMixin(LitElement) {
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
				<div slot="headline" style="font-size: 1.2rem; padding-top: 0.5rem;">${doc.heading}</div>

				<div style="position:relative; display: block">
					<div>
						<h3>${doc.description}</h3>
						${when(doc.author, () => html`<h4>Author: <strong>${doc.author}</strong></h4>`)}

						<div class="buttons">
							${when(
								doc.docSlug,
								() =>
									html`<uui-button
										label="Read Docs"
										color="default"
										look="primary"
										@click=${() => this.#openDocs(doc.docSlug!)}
									></uui-button>&nbsp;`,
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
									></uui-button>&nbsp;`,
							)}
						</div>
					</div>
				</div>
			</uui-box>
		`;
	}

	static styles = css`
		:host {
			display: block;
			position: relative;
			width: 100%;
		}

		h3 {
			margin: 0;
			font-weight: normal;
		}

		h4 {
			margin: 0.5rem 0 0;
		}

		.buttons {
			text-align: center;
			margin-top: 1rem;
		}
	`;
}

export default DocElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-doc-element': DocElement;
	}
}
