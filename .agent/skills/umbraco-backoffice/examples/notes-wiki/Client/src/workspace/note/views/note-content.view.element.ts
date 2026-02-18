/**
 * @fileoverview Note Content View Element
 *
 * The primary editing interface for note content, displayed as a tab in the
 * note workspace. Users edit the title and markdown content here.
 *
 * **What is a Workspace View?**
 *
 * Workspace views are tabs within a workspace that show different aspects
 * of the content being edited:
 *
 * ```
 * ┌──────────────────────────────────────────────────────┐
 * │  Note Workspace Header                    [Save]     │
 * ├──────────┬───────────┬───────────────────────────────┤
 * │ Content  │ Settings  │                               │
 * ├──────────┴───────────┴───────────────────────────────┤
 * │                                                      │
 * │   Title: [____________________]                      │
 * │                                                      │
 * │   Content:                                           │
 * │   [                                                ] │
 * │   [                                                ] │
 * │   [                                                ] │
 * │                                                      │
 * └──────────────────────────────────────────────────────┘
 * ```
 *
 * **Data Flow:**
 *
 * ```
 * Workspace Context (state)
 *         │
 *         └─── observe() ───> View Component (display)
 *                                    │
 *                                    └─── @input ───> setTitle()/setContent()
 *                                                          │
 *                                                          └─── Context state updated
 * ```
 *
 * The view subscribes to context observables for display, and calls
 * context setters when the user makes changes. The context handles
 * all state management and API communication.
 *
 * Skills demonstrated: umbraco-workspace, umbraco-umbraco-element, umbraco-context-api
 */

import { NOTE_WORKSPACE_CONTEXT } from "../note-workspace.context-token.js";
import { css, html, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

/**
 * Content editing view for the note workspace.
 *
 * Provides form fields for editing:
 * - Title (single-line input)
 * - Content (multi-line textarea for markdown)
 *
 * @element notes-note-content-view
 * @extends UmbLitElement
 *
 * @example
 * // Registered as a workspace view in workspace/manifests.ts:
 * {
 *   type: "workspaceView",
 *   alias: "Notes.WorkspaceView.Note.Content",
 *   element: () => import("./views/note-content.view.element.js"),
 *   conditions: [{ alias: "Umb.Condition.WorkspaceAlias", match: "Notes.Workspace.Note" }],
 * }
 */
@customElement("notes-note-content-view")
export class NoteContentViewElement extends UmbLitElement {
  /**
   * Reference to the workspace context.
   * Populated via `consumeContext` in the constructor.
   * @private
   */
  #workspaceContext?: typeof NOTE_WORKSPACE_CONTEXT.TYPE;

  /**
   * Local state for the title input.
   * Synchronized with context via `observe()`.
   * @private
   */
  @state()
  private _title = "";

  /**
   * Local state for the content textarea.
   * Synchronized with context via `observe()`.
   * @private
   */
  @state()
  private _content = "";

  /**
   * Sets up context consumption on construction.
   *
   * Uses `consumeContext` to get the workspace context, then
   * sets up observers for reactive data binding.
   */
  constructor() {
    super();

    this.consumeContext(NOTE_WORKSPACE_CONTEXT, (instance) => {
      this.#workspaceContext = instance;
      this.#observeData();
    });
  }

  // ===========================================================================
  // DATA OBSERVATION
  // ===========================================================================

  /**
   * Sets up observers for context data.
   *
   * The `observe()` helper (from UmbLitElement) automatically:
   * - Subscribes to the RxJS observable
   * - Unsubscribes when component is destroyed
   * - Triggers re-render when data changes
   *
   * @private
   */
  #observeData() {
    if (!this.#workspaceContext) return;

    // Subscribe to title changes from context
    this.observe(this.#workspaceContext.title, (title) => {
      this._title = title || "";
    });

    // Subscribe to content changes from context
    this.observe(this.#workspaceContext.content, (content) => {
      this._content = content || "";
    });
  }

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  /**
   * Handles title input changes.
   * Updates the workspace context with the new title.
   *
   * @param {InputEvent} e - The input event
   * @private
   */
  #handleTitleChange(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this.#workspaceContext?.setTitle(target.value);
  }

  /**
   * Handles content textarea changes.
   * Updates the workspace context with the new content.
   *
   * @param {InputEvent} e - The input event
   * @private
   */
  #handleContentChange(e: InputEvent) {
    const target = e.target as HTMLTextAreaElement;
    this.#workspaceContext?.setContent(target.value);
  }

  override render() {
    return html`
      <uui-box>
        <div class="form-group">
          <label for="title">Title</label>
          <uui-input
            id="title"
            placeholder="Enter note title..."
            .value=${this._title}
            @input=${this.#handleTitleChange}
          ></uui-input>
        </div>

        <div class="form-group">
          <label for="content">Content</label>
          <uui-textarea
            id="content"
            placeholder="Write your note content here..."
            .value=${this._content}
            @input=${this.#handleContentChange}
            rows="20"
          ></uui-textarea>
        </div>
      </uui-box>
    `;
  }

  static override readonly styles = [
    css`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }

      .form-group {
        margin-bottom: var(--uui-size-space-5);
      }

      .form-group:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        margin-bottom: var(--uui-size-space-2);
        font-weight: 600;
        color: var(--uui-color-text);
      }

      uui-input {
        width: 100%;
      }

      uui-textarea {
        width: 100%;
        min-height: 400px;
        font-family: var(--uui-font-family);
      }
    `,
  ];
}

export default NoteContentViewElement;

declare global {
  interface HTMLElementTagNameMap {
    "notes-note-content-view": NoteContentViewElement;
  }
}
