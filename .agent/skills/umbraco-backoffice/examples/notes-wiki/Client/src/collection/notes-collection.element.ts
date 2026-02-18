/**
 * Notes Collection Element
 *
 * The main collection UI with search toolbar and grid view.
 * Clicking folders navigates into them, clicking notes opens the workspace.
 * Skills used: umbraco-collection, umbraco-umbraco-element
 */

import { html, css, customElement, state, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { NotesCollectionContext } from "./notes-collection.context.js";
import type { NotesCollectionItemModel } from "./types.js";
import { UMB_EDIT_NOTE_WORKSPACE_PATH_PATTERN } from "../workspace/paths.js";
import { NoteswikiService } from "../api/index.js";

interface BreadcrumbItem {
  unique: string | null;
  name: string;
}

@customElement("notes-collection-element")
export class NotesCollectionElement extends UmbLitElement {
  #collectionContext: NotesCollectionContext;

  /**
   * Initial folder unique to navigate to when the collection loads.
   * Set via ?folder= query parameter from the dashboard.
   */
  @property({ attribute: false })
  initialFolderUnique: string | null = null;

  @state()
  private _items: NotesCollectionItemModel[] = [];

  @state()
  private _loading = false;

  @state()
  private _filter = "";

  @state()
  private _totalItems = 0;

  @state()
  private _breadcrumbs: BreadcrumbItem[] = [{ unique: null, name: "Notes" }];

  #hasInitialized = false;

  constructor() {
    super();
    this.#collectionContext = new NotesCollectionContext(this);

    this.observe(this.#collectionContext.items, (items) => {
      this._items = items;
    });

    this.observe(this.#collectionContext.loading, (loading) => {
      this._loading = loading[0] ?? false;
    });

    this.observe(this.#collectionContext.totalItems, (total) => {
      this._totalItems = total;
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#initialize();
  }

  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    // Handle initialFolderUnique being set after first render
    if (changedProperties.has("initialFolderUnique") && this.#hasInitialized) {
      if (this.initialFolderUnique) {
        this.setInitialFolder(this.initialFolderUnique);
      }
    }
  }

  async #initialize() {
    if (this.#hasInitialized) return;
    this.#hasInitialized = true;

    if (this.initialFolderUnique) {
      await this.setInitialFolder(this.initialFolderUnique);
    } else {
      this.#collectionContext.load();
    }
  }

  /**
   * Navigate to a specific folder and build breadcrumbs.
   * Called when /folder/<unique> path segment is present.
   * Pass empty string to navigate back to root.
   */
  async setInitialFolder(folderUnique: string) {
    // Empty string means navigate to root
    if (!folderUnique) {
      this._breadcrumbs = [{ unique: null, name: "Notes" }];
      this._filter = "";
      this.#collectionContext.setParentUnique(null);
      return;
    }

    try {
      // Get folder info to build breadcrumbs
      const response = await NoteswikiService.getFolder({
        path: { id: folderUnique },
      });

      const folder = response.data;

      // Build breadcrumbs: Root -> ... -> Current Folder
      // For now, we'll just show Root -> Current Folder
      // A full implementation would traverse parent IDs
      this._breadcrumbs = [
        { unique: null, name: "Notes" },
        { unique: folder.unique, name: folder.name },
      ];

      this._filter = "";
      this.#collectionContext.setParentUnique(folderUnique);
    } catch {
      // Folder not found, fall back to root
      console.error("Failed to load folder:", folderUnique);
      this._breadcrumbs = [{ unique: null, name: "Notes" }];
      this.#collectionContext.load();
    }
  }

  #handleFilterInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._filter = target.value;
  }

  #handleSearch() {
    this.#collectionContext.setFilter(this._filter);
  }

  #handleKeyPress(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this.#handleSearch();
    }
  }

  #handleFolderClick(item: NotesCollectionItemModel) {
    // Navigate into the folder
    this._breadcrumbs = [...this._breadcrumbs, { unique: item.unique, name: item.name }];
    this._filter = "";
    this.#collectionContext.setParentUnique(item.unique);
  }

  #handleBreadcrumbClick(index: number) {
    const breadcrumb = this._breadcrumbs[index];
    this._breadcrumbs = this._breadcrumbs.slice(0, index + 1);
    this._filter = "";
    this.#collectionContext.setParentUnique(breadcrumb.unique);
  }

  #getItemHref(item: NotesCollectionItemModel): string {
    return UMB_EDIT_NOTE_WORKSPACE_PATH_PATTERN.generateAbsolute({
      unique: item.unique,
    });
  }

  #renderBreadcrumbs() {
    if (this._breadcrumbs.length <= 1) return null;

    return html`
      <div class="breadcrumbs">
        ${this._breadcrumbs.map((crumb, index) => html`
          ${index > 0 ? html`<uui-icon name="icon-arrow-right" class="breadcrumb-separator"></uui-icon>` : ""}
          <button
            class="breadcrumb ${index === this._breadcrumbs.length - 1 ? "current" : ""}"
            @click=${() => this.#handleBreadcrumbClick(index)}
            ?disabled=${index === this._breadcrumbs.length - 1}
          >
            ${crumb.name}
          </button>
        `)}
      </div>
    `;
  }

  #renderToolbar() {
    return html`
      <div class="toolbar">
        <div class="toolbar-left">
          <slot name="actions"></slot>
        </div>
        <div class="toolbar-center">
          <uui-input
            placeholder="Type to search..."
            .value=${this._filter}
            @input=${this.#handleFilterInput}
            @keypress=${this.#handleKeyPress}
          ></uui-input>
        </div>
        <div class="toolbar-right">
          <span class="item-count">${this._totalItems} items</span>
        </div>
      </div>
      ${this.#renderBreadcrumbs()}
    `;
  }

  #renderGrid() {
    if (this._loading) {
      return html`
        <div class="loading">
          <uui-loader></uui-loader>
        </div>
      `;
    }

    if (this._items.length === 0) {
      return html`
        <div class="empty-state">
          <uui-icon name="icon-notepad"></uui-icon>
          <p>${this._filter ? "No items match your search." : "No items yet. Create your first note or folder!"}</p>
        </div>
      `;
    }

    return html`
      <div class="grid">
        ${this._items.map((item) => this.#renderItem(item))}
      </div>
    `;
  }

  #renderItem(item: NotesCollectionItemModel) {
    const href = this.#getItemHref(item);

    // Folders use button (navigate into), notes use anchor (open workspace)
    if (item.isFolder) {
      return html`
        <button
          class="grid-item"
          @click=${() => this.#handleFolderClick(item)}
        >
          <div class="grid-item-icon">
            <uui-icon name=${item.icon}></uui-icon>
          </div>
          <div class="grid-item-name">${item.name}</div>
        </button>
      `;
    }

    return html`
      <a class="grid-item" href=${href}>
        <div class="grid-item-icon">
          <uui-icon name=${item.icon}></uui-icon>
        </div>
        <div class="grid-item-name">${item.name}</div>
      </a>
    `;
  }

  override render() {
    return html`
      ${this.#renderToolbar()}
      ${this.#renderGrid()}
    `;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-4);
      padding: var(--uui-size-space-4) var(--uui-size-space-5);
      border-bottom: 1px solid var(--uui-color-border);
      background: var(--uui-color-surface);
    }

    .toolbar-left {
      display: flex;
      gap: var(--uui-size-space-2);
    }

    .toolbar-center {
      flex: 1;
      max-width: 400px;
    }

    .toolbar-center uui-input {
      width: 100%;
    }

    .toolbar-right {
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-2);
      padding: var(--uui-size-space-3) var(--uui-size-space-5);
      background: var(--uui-color-surface-alt);
      border-bottom: 1px solid var(--uui-color-border);
    }

    .breadcrumb {
      background: none;
      border: none;
      padding: var(--uui-size-space-1) var(--uui-size-space-2);
      cursor: pointer;
      color: var(--uui-color-interactive);
      font-size: var(--uui-type-small-size);
      border-radius: var(--uui-border-radius);
    }

    .breadcrumb:hover:not(:disabled) {
      background: var(--uui-color-surface-emphasis);
      text-decoration: underline;
    }

    .breadcrumb:disabled,
    .breadcrumb.current {
      color: var(--uui-color-text);
      cursor: default;
      font-weight: 600;
    }

    .breadcrumb-separator {
      font-size: 10px;
      color: var(--uui-color-text-alt);
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--uui-size-space-6);
      flex: 1;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--uui-size-layout-2);
      color: var(--uui-color-text-alt);
      flex: 1;
    }

    .empty-state uui-icon {
      font-size: 64px;
      margin-bottom: var(--uui-size-space-4);
      opacity: 0.5;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      grid-auto-rows: min-content;
      gap: var(--uui-size-space-4);
      padding: var(--uui-size-space-5);
      overflow: auto;
      align-content: start;
    }

    .grid-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--uui-size-space-4);
      border: 1px solid var(--uui-color-border);
      border-radius: var(--uui-border-radius);
      background: var(--uui-color-surface);
      text-decoration: none;
      color: var(--uui-color-text);
      transition: all 0.1s ease;
      cursor: pointer;
      height: fit-content;
    }

    .grid-item:hover {
      border-color: var(--uui-color-border-emphasis);
      background: var(--uui-color-surface-emphasis);
    }

    .grid-item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      margin-bottom: var(--uui-size-space-3);
      background: var(--uui-color-surface-alt);
      border-radius: var(--uui-border-radius);
    }

    .grid-item-icon uui-icon {
      font-size: 32px;
      color: var(--uui-color-text-alt);
    }

    .grid-item-name {
      font-size: var(--uui-type-small-size);
      text-align: center;
      word-break: break-word;
      max-width: 100%;
    }
  `;
}

export default NotesCollectionElement;

declare global {
  interface HTMLElementTagNameMap {
    "notes-collection-element": NotesCollectionElement;
  }
}
