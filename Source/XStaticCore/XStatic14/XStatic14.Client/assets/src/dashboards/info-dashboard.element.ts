import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, customElement, html } from '@umbraco-cms/backoffice/external/lit';

import '../areas/docs/element.docs-grid';

@customElement('xstatic-info-dashboard')
export class XStaticInfoDashboard extends UmbLitElement {
	render() {
		return html`
			<umb-body-layout>
				<xstatic-docs-grid></xstatic-docs-grid>
			</umb-body-layout>
		`;
	}

	static styles = css`
		:host {
			display: block;
		}
	`;
}

export default XStaticInfoDashboard;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-info-dashboard': XStaticInfoDashboard;
	}
}
