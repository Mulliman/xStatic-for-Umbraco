import {
	css,
	customElement,
	html,
	ifDefined,
	property,
	repeat,
	when,
	LitElement,
} from '@umbraco-cms/backoffice/external/lit';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';

export interface xStaticTableItem {
	id: string;
	icon?: string | null;
	entityType?: string;
	data: Array<xStaticTableItemData>;
}

export interface xStaticTableItemData {
	columnAlias: string;
	value: any;
}

export interface xStaticTableColumn {
	name: string;
	alias: string;
	elementName?: string;
	width?: string;
	allowSorting?: boolean;
	align?: 'left' | 'center' | 'right';
	labelTemplate?: string;
}

export interface xStaticTableColumnLayoutElement extends HTMLElement {
	column: xStaticTableColumn;
	item: xStaticTableItem;
	value: any;
}

export interface xStaticTableConfig {
	hideIcon?: boolean;
}

@customElement('xstatic-site-table')
export class SiteTable extends LitElement {

	@property({ type: Array, attribute: false })
	public items: Array<xStaticTableItem> = [];

	@property({ type: Array, attribute: false })
	public columns: Array<xStaticTableColumn> = [];

	@property({ type: Object, attribute: false })
	public config: xStaticTableConfig = {
		hideIcon: false,
	};

	override render() {
		return html`
			<uui-table class="uui-text">
				${repeat(this.items, (item) => item.id, this._renderRow)}
			</uui-table>
		`;
	}

	private _renderRow = (item: xStaticTableItem) => {
		return html`
			<uui-table-row>
				<uui-table-cell>
					${when(!this.config.hideIcon, () => html`<umb-icon name="${ifDefined(item.icon ?? undefined)}"></umb-icon>`)}
				</uui-table-cell>
				${this.columns.map((column) => this._renderRowCell(column, item))}
			</uui-table-row>
		`;
	};

	private _renderRowCell(column: xStaticTableColumn, item: xStaticTableItem) {
		return html`
			<uui-table-cell
				style="--uui-table-cell-padding: 0 var(--uui-size-5); text-align:${column.align ?? 'left'}; width: ${column.width || 'auto'};">
					${this._renderCellContent(column, item)}
			</uui-table-cell>
		</uui-table-cell>
		`;
	}

	private _renderCellContent(column: xStaticTableColumn, item: xStaticTableItem) {
		const value = item.data.find((data) => data.columnAlias === column.alias)?.value;

		if (column.elementName) {
			const element = document.createElement(column.elementName) as xStaticTableColumnLayoutElement;
			element.column = column;
			element.item = item;
			element.value = value;
			return element;
		}

		return value;
	}

	static override styles = [
		UmbTextStyles,
		css`
			:host {
				height: fit-content;
			}

			uui-table {
				box-shadow: var(--uui-shadow-depth-1);
			}

			uui-table-cell umb-icon {
				vertical-align: top;
			}
		`,
	];
}

export default SiteTable;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-site-table': SiteTable;
	}
}