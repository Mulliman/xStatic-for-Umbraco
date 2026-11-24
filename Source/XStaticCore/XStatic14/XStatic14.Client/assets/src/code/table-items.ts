import type { xStaticTableColumn, xStaticTableItem } from '../elements/element.site-table';

/** One row of the details table on an xStatic card. Rows with an empty value are left out. */
export interface XStaticDetailRow {
	id: string;
	icon: string;
	value: unknown;
}

/** The single "Details" column used by every card. */
export const DETAILS_COLUMNS: Array<xStaticTableColumn> = [{ alias: 'value', name: 'Details' }];

/** Converts detail rows into table items for `<xstatic-site-table>`, dropping rows without a value. */
export function toDetailItems(rows: ReadonlyArray<XStaticDetailRow>): Array<xStaticTableItem> {
	return rows
		.filter((row) => row.id && row.value)
		.map((row) => ({
			id: row.id,
			icon: row.icon,
			data: [{ columnAlias: 'value', value: row.value }],
		}));
}
