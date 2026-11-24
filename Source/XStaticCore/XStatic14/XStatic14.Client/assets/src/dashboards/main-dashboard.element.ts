import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, customElement, html } from '@umbraco-cms/backoffice/external/lit';

import '../areas/sites/element.site-grid';

@customElement('xstatic-main-dashboard')
export class XStaticMainDashboard extends UmbLitElement {
	render() {
		return html`
			<umb-body-layout>
				<xstatic-site-grid></xstatic-site-grid>
			</umb-body-layout>
		`;
	}

	static styles = css`
		:host {
			display: block;
		}
	`;
}

export default XStaticMainDashboard;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-main-dashboard': XStaticMainDashboard;
	}
}
