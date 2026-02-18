/**
 * Notes Browse Dashboard Element
 *
 * Dashboard that hosts the collection view with search and grid.
 * Similar to how the Media section works.
 *
 * Supports /folder/<unique> path segment to open at a specific folder.
 * Listens to navigationsuccess event to detect URL changes.
 *
 * Skills used: umbraco-dashboard, umbraco-collection, umbraco-routing
 */

import { html, css, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import "../collection/notes-collection.element.js";
import type { NotesCollectionElement } from "../collection/notes-collection.element.js";

@customElement("notes-browse-dashboard-element")
export class NotesBrowseDashboardElement extends UmbLitElement {
  @state()
  private _initialFolderUnique: string | null = null;

  #lastFolderUnique: string | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.#readFolderFromUrl();

    // Listen for navigation events - this fires when Umbraco's router navigates
    window.addEventListener("navigationsuccess", this.#handleNavigation);
    // Also listen for browser back/forward
    window.addEventListener("popstate", this.#handleNavigation);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("navigationsuccess", this.#handleNavigation);
    window.removeEventListener("popstate", this.#handleNavigation);
  }

  #handleNavigation = () => {
    this.#readFolderFromUrl();
  };

  #readFolderFromUrl() {
    const folderUnique = this.#extractFolderFromPath(window.location.pathname);

    // Only update if the folder has actually changed
    if (folderUnique === this.#lastFolderUnique) {
      return;
    }

    this.#lastFolderUnique = folderUnique;
    this._initialFolderUnique = folderUnique;

    // Update collection if it exists
    const collection = this.shadowRoot?.querySelector<NotesCollectionElement>("notes-collection-element");
    if (collection) {
      collection.setInitialFolder(folderUnique ?? "");
    }
  }

  #extractFolderFromPath(path: string): string | null {
    // Match pattern: /folder/<unique> anywhere in the path
    const match = path.match(/\/folder\/([^/]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  }

  override render() {
    return html`
      <notes-collection-element .initialFolderUnique=${this._initialFolderUnique}>
      </notes-collection-element>
    `;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `;
}

export default NotesBrowseDashboardElement;

declare global {
  interface HTMLElementTagNameMap {
    "notes-browse-dashboard-element": NotesBrowseDashboardElement;
  }
}
