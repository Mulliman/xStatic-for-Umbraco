import {
	css,
	customElement,
	html,
	property,
	LitElement,
	state,
} from '@umbraco-cms/backoffice/external/lit';

@customElement('xstatic-dashboard-grid')
export class DashboardGrid extends LitElement {
	override render() {
		return html`
			<div class="info"><slot name="info"></slot></div>
            <div class="grid"><slot name="grid"></slot></div>
		`;
	}

	static styles = css`
		:host {
			display: flex;
			flex-direction: row;
		}

		:host .info {
			display: flex;
			max-width: 400px;
			margin-right: 20px;
		}

		:host .grid {
			flex: auto;
		}

		:host .grid ::slotted(*) {
			position: relative;
			display: grid;
			flex: auto;
			grid-gap: 20px;
			grid-template-columns: repeat(auto-fill,minmax(400px,1fr));
		}

		:host > div{
			display: block;
			position: relative;
		}
	`;
}

export default DashboardGrid;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-dashboard-grid': DashboardGrid;
	}
}