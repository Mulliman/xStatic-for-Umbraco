import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, customElement, html } from '@umbraco-cms/backoffice/external/lit';

import '../areas/export-types/element.export-type-grid';

@customElement('xstatic-export-types-dashboard')
export class XStaticExportTypesDashboard extends UmbLitElement {
	render() {
		return html`
			<umb-body-layout>
				<xstatic-export-type-grid></xstatic-export-type-grid>
			</umb-body-layout>
		`;
	}

	static styles = css`
		:host {
			display: block;
		}
	`;
}

export default XStaticExportTypesDashboard;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-export-types-dashboard': XStaticExportTypesDashboard;
	}
}
