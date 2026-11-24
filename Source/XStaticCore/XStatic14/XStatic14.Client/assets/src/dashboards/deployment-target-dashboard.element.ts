import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, customElement, html } from '@umbraco-cms/backoffice/external/lit';

import '../areas/deployment-targets/element.deployment-grid';

@customElement('xstatic-deployment-target-dashboard')
export class XStaticDeploymentTargetsDashboard extends UmbLitElement {
	render() {
		return html`
			<umb-body-layout>
				<xstatic-deployment-target-grid></xstatic-deployment-target-grid>
			</umb-body-layout>
		`;
	}

	static styles = css`
		:host {
			display: block;
		}
	`;
}

export default XStaticDeploymentTargetsDashboard;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-deployment-target-dashboard': XStaticDeploymentTargetsDashboard;
	}
}
