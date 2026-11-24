import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, customElement, html } from '@umbraco-cms/backoffice/external/lit';

import '../areas/config/element.config-grid';

@customElement('xstatic-config-dashboard')
export class XStaticConfigDashboard extends UmbLitElement {
	render() {
		return html`
			<umb-body-layout>
				<xstatic-config-grid></xstatic-config-grid>
			</umb-body-layout>
		`;
	}

	static styles = css`
		:host {
			display: block;
		}
	`;
}

export default XStaticConfigDashboard;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-config-dashboard': XStaticConfigDashboard;
	}
}
