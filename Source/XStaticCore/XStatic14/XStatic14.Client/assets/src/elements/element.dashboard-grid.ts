import { css, customElement, html } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

/**
 * Two-column dashboard layout: an "info" card on the left and a grid of cards on the right.
 * When the dashboard is narrow (a small screen, or a wide sidebar), the info card moves above the grid.
 */
@customElement('xstatic-dashboard-grid')
export class DashboardGrid extends UmbLitElement {
	override render() {
		return html`
			<div class="layout">
				<div class="info"><slot name="info"></slot></div>
				<div class="grid"><slot name="grid"></slot></div>
			</div>
		`;
	}

	static styles = css`
		:host {
			display: block;
			container-type: inline-size;
		}

		.layout {
			display: flex;
			flex-direction: row;
			gap: var(--uui-size-layout-1);
		}

		.info {
			display: flex;
			flex: 0 0 auto;
			width: 400px;
			max-width: 100%;
		}

		.grid {
			flex: 1 1 auto;
			min-width: 0;
		}

		.grid ::slotted(*) {
			position: relative;
			display: grid;
			grid-gap: var(--uui-size-layout-1);
			grid-template-columns: repeat(auto-fill, minmax(min(400px, 100%), 1fr));
		}

		@container (max-width: 900px) {
			.layout {
				flex-direction: column;
			}

			.info {
				width: 100%;
			}
		}
	`;
}

export default DashboardGrid;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-dashboard-grid': DashboardGrid;
	}
}
