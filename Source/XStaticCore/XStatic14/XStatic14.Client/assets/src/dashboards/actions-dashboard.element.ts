import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, customElement, html } from '@umbraco-cms/backoffice/external/lit';

import '../areas/actions/element.action-grid';

@customElement('xstatic-actions-dashboard')
export class XStaticActionsDashboard extends UmbLitElement {
	render() {
		return html`
			<umb-body-layout>
				<xstatic-action-grid></xstatic-action-grid>
			</umb-body-layout>
		`;
	}

	static styles = css`
		:host {
			display: block;
		}
	`;
}

export default XStaticActionsDashboard;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-actions-dashboard': XStaticActionsDashboard;
	}
}
