/**
 * @fileoverview Notes Dashboard Element
 *
 * The welcome dashboard that displays when entering the Notes section.
 * Provides an overview of the Notes Wiki with recent notes and getting started info.
 *
 * **What is a Dashboard?**
 *
 * In Umbraco, a dashboard is a view that appears when:
 * - A section is first opened (no item selected)
 * - The user clicks a dashboard tab
 *
 * Dashboards are typically used for:
 * - Welcome/overview screens
 * - Quick access to recent items
 * - Search interfaces
 * - Statistics and reports
 *
 * **Component Architecture:**
 *
 * This component extends `UmbLitElement` which provides:
 * - Lit's reactive properties (`@state`, `@property`)
 * - Umbraco's `observe()` helper for RxJS subscriptions
 * - Automatic cleanup on disconnect
 *
 * **Lifecycle:**
 *
 * ```
 * connectedCallback() ─────> #loadRecentNotes()
 *                                   │
 *                                   └─── API call
 *                                          │
 *                                          └─── Update _recentNotes state
 *                                                   │
 *                                                   └─── render() triggered
 * ```
 *
 * Skills demonstrated: umbraco-dashboard, umbraco-umbraco-element, Lit components
 */

import { html, css, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { NoteswikiService } from "../api/index.js";
import type { NoteModel } from "../api/types.gen.js";
import { UMB_EDIT_NOTE_WORKSPACE_PATH_PATTERN } from "../workspace/paths.js";

/**
 * Welcome dashboard component for the Notes section.
 *
 * Displays:
 * - Welcome message explaining the Notes Wiki purpose
 * - List of 5 most recently modified notes
 * - Getting started tips for new users
 *
 * @element notes-dashboard-element
 * @extends UmbLitElement
 *
 * @example
 * // Registered in dashboard/manifests.ts:
 * {
 *   type: "dashboard",
 *   alias: "Notes.Dashboard",
 *   element: () => import("./notes-dashboard.element.js"),
 *   conditions: [{ alias: "Umb.Condition.SectionAlias", match: "Notes.Section" }],
 * }
 */
@customElement("notes-dashboard-element")
export class NotesDashboardElement extends UmbLitElement {
  /**
   * Array of recently modified notes fetched from the API.
   * Used to render the "Recent Notes" section.
   * @private
   */
  @state()
  private _recentNotes: NoteModel[] = [];

  /**
   * Loading state flag for the recent notes section.
   * Shows a loader while fetching, then content or empty state.
   * @private
   */
  @state()
  private _loading = true;

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Called when the element is added to the DOM.
   * Triggers initial data loading for recent notes.
   * @override
   */
  override connectedCallback() {
    super.connectedCallback();
    this.#loadRecentNotes();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Fetches the 5 most recently modified notes from the API.
   *
   * Updates `_loading` state to show/hide the loader,
   * then populates `_recentNotes` with results.
   *
   * @private
   */
  async #loadRecentNotes() {
    this._loading = true;
    try {
      const response = await NoteswikiService.getRecentNotes({
        query: { count: 5 },
      });
      this._recentNotes = response.data ?? [];
    } catch (error) {
      console.error("Error loading recent notes:", error);
      this._recentNotes = [];
    } finally {
      this._loading = false;
    }
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Navigates to the note workspace when a recent note is clicked.
   *
   * Uses `history.pushState` for SPA navigation instead of a full page load.
   *
   * @param {NoteModel} note - The note that was clicked
   * @private
   */
  #handleNoteClick(note: NoteModel) {
    const editPath = UMB_EDIT_NOTE_WORKSPACE_PATH_PATTERN.generateAbsolute({
      unique: note.unique,
    });
    history.pushState({}, "", editPath);
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Formats an ISO date string for display.
   *
   * @param {string} dateString - ISO 8601 date string
   * @returns {string} Formatted date like "Jan 15, 2024, 2:30 PM"
   * @private
   */
  #formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ===========================================================================
  // RENDER METHODS
  // ===========================================================================

  /**
   * Renders the recent notes section with loading, empty, and content states.
   * @private
   */
  #renderRecentNotes() {
    if (this._loading) {
      return html`
        <div class="loading-state">
          <uui-loader></uui-loader>
        </div>
      `;
    }

    if (this._recentNotes.length === 0) {
      return html`
        <div class="empty-state">
          <uui-icon name="icon-notepad"></uui-icon>
          <p>No notes yet. Right-click in the tree to create your first note!</p>
        </div>
      `;
    }

    return html`
      <div class="notes-list">
        ${this._recentNotes.map(
          (note) => html`
            <button
              class="note-item"
              @click=${() => this.#handleNoteClick(note)}
            >
              <uui-icon name="icon-notepad"></uui-icon>
              <div class="note-info">
                <span class="note-title">${note.title || "Untitled"}</span>
                <span class="note-date">Modified ${this.#formatDate(note.modifiedDate)}</span>
              </div>
              <uui-icon name="icon-arrow-right" class="arrow"></uui-icon>
            </button>
          `
        )}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="dashboard">
        <uui-box headline="Notes Wiki">
          <div class="welcome-content">
            <p>
              Welcome to the Notes Wiki! This is your internal knowledge base for
              documentation, notes, and team information.
            </p>
          </div>
        </uui-box>

        <uui-box headline="Recent Notes" class="recent-notes">
          ${this.#renderRecentNotes()}
        </uui-box>

        <uui-box headline="Getting Started" class="getting-started">
          <ul>
            <li>Use the tree on the left to browse notes and folders</li>
            <li>Right-click on the tree to create new notes or folders</li>
            <li>Use tags to organize your notes</li>
          </ul>
        </uui-box>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      padding: var(--uui-size-layout-1);
    }

    .dashboard {
      display: grid;
      gap: var(--uui-size-layout-1);
      max-width: 1200px;
    }

    .welcome-content p {
      margin: 0;
      color: var(--uui-color-text-alt);
    }

    .recent-notes,
    .getting-started {
      margin-top: var(--uui-size-space-3);
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: var(--uui-size-space-6);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--uui-size-space-6);
      color: var(--uui-color-text-alt);
    }

    .empty-state uui-icon {
      font-size: 48px;
      margin-bottom: var(--uui-size-space-4);
      opacity: 0.5;
    }

    .notes-list {
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-2);
    }

    .note-item {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
      padding: var(--uui-size-space-3) var(--uui-size-space-4);
      border: 1px solid var(--uui-color-border);
      border-radius: var(--uui-border-radius);
      background: var(--uui-color-surface);
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: background-color 0.1s ease;
    }

    .note-item:hover {
      background: var(--uui-color-surface-emphasis);
    }

    .note-item uui-icon {
      font-size: 1.2rem;
      color: var(--uui-color-text-alt);
    }

    .note-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-1);
    }

    .note-title {
      font-weight: 600;
      color: var(--uui-color-text);
    }

    .note-date {
      font-size: var(--uui-type-small-size);
      color: var(--uui-color-text-alt);
    }

    .note-item .arrow {
      opacity: 0;
      transition: opacity 0.1s ease;
    }

    .note-item:hover .arrow {
      opacity: 1;
    }

    .getting-started ul {
      margin: 0;
      padding-left: var(--uui-size-space-6);
    }

    .getting-started li {
      margin-bottom: var(--uui-size-space-2);
    }
  `;
}

export default NotesDashboardElement;

declare global {
  interface HTMLElementTagNameMap {
    "notes-dashboard-element": NotesDashboardElement;
  }
}
