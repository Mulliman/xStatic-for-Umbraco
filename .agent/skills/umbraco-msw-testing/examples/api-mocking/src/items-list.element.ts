/**
 * Items List Element
 *
 * Demonstrates:
 * - Fetching data from API
 * - Loading states
 * - Error handling
 * - Lit element patterns
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { Item } from './mocks/items.db.js';

interface ItemsResponse {
	total: number;
	items: Item[];
}

interface ApiError {
	type: string;
	status: number;
	detail: string;
}

@customElement('items-list')
export class ItemsListElement extends LitElement {
	static styles = css`
		:host {
			display: block;
			padding: 16px;
		}
		.loading {
			color: #666;
			font-style: italic;
		}
		.error {
			color: #d32f2f;
			padding: 8px;
			background: #ffebee;
			border-radius: 4px;
		}
		.items {
			list-style: none;
			padding: 0;
			margin: 0;
		}
		.item {
			padding: 12px;
			border-bottom: 1px solid #e0e0e0;
		}
		.item:last-child {
			border-bottom: none;
		}
		.item-name {
			font-weight: bold;
		}
		.item-description {
			color: #666;
			font-size: 0.9em;
		}
		.empty {
			color: #999;
			text-align: center;
			padding: 24px;
		}
	`;

	@state()
	private _items: Item[] = [];

	@state()
	private _loading = false;

	@state()
	private _error: string | null = null;

	private _apiBase = '/umbraco/management/api/v1';

	connectedCallback(): void {
		super.connectedCallback();
		this._loadItems();
	}

	async _loadItems(): Promise<void> {
		this._loading = true;
		this._error = null;

		try {
			const response = await fetch(`${this._apiBase}/items`);

			if (!response.ok) {
				const errorData = (await response.json()) as ApiError;
				throw new Error(errorData.detail || `HTTP ${response.status}`);
			}

			const data = (await response.json()) as ItemsResponse;
			this._items = data.items;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to load items';
		} finally {
			this._loading = false;
		}
	}

	async deleteItem(id: string): Promise<void> {
		try {
			const response = await fetch(`${this._apiBase}/items/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`Failed to delete: HTTP ${response.status}`);
			}

			// Reload items after deletion
			await this._loadItems();
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to delete item';
		}
	}

	render() {
		if (this._loading) {
			return html`<div class="loading">Loading items...</div>`;
		}

		if (this._error) {
			return html`<div class="error">${this._error}</div>`;
		}

		if (this._items.length === 0) {
			return html`<div class="empty">No items found</div>`;
		}

		return html`
			<ul class="items">
				${this._items.map(
					(item) => html`
						<li class="item">
							<div class="item-name">${item.name}</div>
							${item.description ? html`<div class="item-description">${item.description}</div>` : nothing}
							<button @click=${() => this.deleteItem(item.id)}>Delete</button>
						</li>
					`
				)}
			</ul>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'items-list': ItemsListElement;
	}
}
