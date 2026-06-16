/**
 * Folder Workspace Editor Element
 *
 * Displays the folder name in the header and a grid of child items.
 * Clicking a child folder navigates to that folder's workspace.
 * Clicking a child note opens the note workspace.
 *
 * Skills used: umbraco-workspace, umbraco-umbraco-element, umbraco-routing, umbraco-modals, umbraco-notifications
 */

import { html, css, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/workspace";
import { UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { UMB_ACTION_EVENT_CONTEXT } from "@umbraco-cms/backoffice/action";
import { UmbRequestReloadChildrenOfEntityEvent } from "@umbraco-cms/backoffice/entity-action";
import type { FolderWorkspaceContext } from "./folder-workspace.context.js";
import { NoteswikiService } from "../../api/index.js";
import type { TreeItemModel } from "../../api/types.gen.js";
import { UMB_EDIT_NOTE_WORKSPACE_PATH_PATTERN, UMB_EDIT_FOLDER_WORKSPACE_PATH_PATTERN, UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN } from "../paths.js";
import { FOLDER_NAME_MODAL } from "../../entity-actions/rename-folder.modal-token.js";
import { NOTES_FOLDER_ENTITY_TYPE } from "../../constants.js";

interface ChildItem {
  unique: string;
  name: string;
  isFolder: boolean;
  icon: string;
}

@customElement("folder-workspace-editor-element")
export class FolderWorkspaceEditorElement extends UmbLitElement {
  #workspaceContext?: FolderWorkspaceContext;

  @state()
  private _name = "";

  @state()
  private _children: ChildItem[] = [];

  @state()
  private _loading = true;

  @state()
  private _searchQuery = "";

  @state()
  private _createMenuOpen = false;

  constructor() {
    super();

    this.consumeContext(UMB_WORKSPACE_CONTEXT, (context) => {
      this.#workspaceContext = context as unknown as FolderWorkspaceContext;
      this.#observeContext();
    });
  }

  #observeContext() {
    if (!this.#workspaceContext) return;

    this.observe(this.#workspaceContext.name, (name) => {
      this._name = name;
    });

    this.observe(this.#workspaceContext.unique, (unique) => {
      if (unique) {
        this.#loadChildren(unique);
      }
    });
  }

  async #loadChildren(parentUnique: string) {
    this._loading = true;

    try {
      const response = await NoteswikiService.getChildren({
        path: { parentId: parentUnique },
      });

      this._children = response.data.items.map((item: TreeItemModel) => ({
        unique: item.id,
        name: item.name,
        isFolder: item.isFolder,
        icon: item.isFolder ? "icon-folder" : "icon-notepad",
      }));
    } catch (error) {
      console.error("Error loading children:", error);
      this._children = [];
    } finally {
      this._loading = false;
    }
  }

  #getItemHref(item: ChildItem): string {
    if (item.isFolder) {
      return UMB_EDIT_FOLDER_WORKSPACE_PATH_PATTERN.generateAbsolute({
        unique: item.unique,
      });
    }
    return UMB_EDIT_NOTE_WORKSPACE_PATH_PATTERN.generateAbsolute({
      unique: item.unique,
    });
  }

  #handleSearchInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._searchQuery = target.value;
  }

  #onPopoverToggle(event: ToggleEvent) {
    this._createMenuOpen = (event as any).newState === "open";
  }

  #getCreateNoteHref(): string {
    const folderUnique = this.#workspaceContext?.getUnique();
    return UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN.generateAbsolute({
      parentEntityType: NOTES_FOLDER_ENTITY_TYPE,
      parentUnique: folderUnique ?? "null",
    });
  }

  async #handleCreateFolder() {
    const parentUnique = this.#workspaceContext?.getUnique() ?? null;

    // Open create folder modal
    const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
    if (!modalManager) return;

    const modal = modalManager.open(this, FOLDER_NAME_MODAL, {
      data: {
        headline: "Create Folder",
        currentName: "",
        confirmLabel: "Create",
      },
    });

    const result = await modal.onSubmit().catch(() => undefined);
    if (!result?.name) return;

    try {
      // Create folder via API
      const unique = crypto.randomUUID();

      await NoteswikiService.createFolder({
        body: { unique, name: result.name, parentUnique },
      });

      // Show success notification
      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("positive", {
        data: {
          headline: "Folder created",
          message: `Folder "${result.name}" has been created.`,
        },
      });

      // Refresh tree by dispatching reload event
      const eventContext = await this.getContext(UMB_ACTION_EVENT_CONTEXT);
      if (eventContext) {
        eventContext.dispatchEvent(
          new UmbRequestReloadChildrenOfEntityEvent({
            entityType: NOTES_FOLDER_ENTITY_TYPE,
            unique: parentUnique,
          })
        );
      }

      // Navigate to the new folder's workspace
      const folderPath = UMB_EDIT_FOLDER_WORKSPACE_PATH_PATTERN.generateAbsolute({
        unique,
      });
      history.pushState({}, "", folderPath);
    } catch (error) {
      console.error("Error creating folder:", error);

      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("danger", {
        data: {
          headline: "Error",
          message: "Failed to create the folder. Please try again.",
        },
      });
    }
  }

  #getFilteredChildren(): ChildItem[] {
    if (!this._searchQuery.trim()) {
      return this._children;
    }
    const query = this._searchQuery.toLowerCase();
    return this._children.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }

  #renderToolbar() {
    return html`
      <div class="toolbar">
        <uui-button
          popovertarget="create-menu-popover"
          label="Create"
          color="default"
          look="outline"
        >
          Create
          <uui-symbol-expand .open=${this._createMenuOpen}></uui-symbol-expand>
        </uui-button>
        <uui-popover-container
          id="create-menu-popover"
          placement="bottom-start"
          @toggle=${this.#onPopoverToggle}
        >
          <umb-popover-layout>
            <uui-scroll-container>
              <uui-menu-item label="Note" href=${this.#getCreateNoteHref()}>
                <umb-icon slot="icon" name="icon-notepad"></umb-icon>
              </uui-menu-item>
              <uui-menu-item label="Folder" @click=${this.#handleCreateFolder}>
                <umb-icon slot="icon" name="icon-folder"></umb-icon>
              </uui-menu-item>
            </uui-scroll-container>
          </umb-popover-layout>
        </uui-popover-container>
        <uui-input
          placeholder="Search in folder..."
          .value=${this._searchQuery}
          @input=${this.#handleSearchInput}
        ></uui-input>
        <span class="item-count">${this.#getFilteredChildren().length} items</span>
      </div>
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

    const filteredChildren = this.#getFilteredChildren();

    if (this._children.length === 0) {
      return html`
        <div class="empty-state">
          <uui-icon name="icon-folder"></uui-icon>
          <p>This folder is empty.</p>
          <p>Use the actions menu to create notes or subfolders.</p>
        </div>
      `;
    }

    if (filteredChildren.length === 0) {
      return html`
        <div class="empty-state">
          <uui-icon name="icon-search"></uui-icon>
          <p>No items match "${this._searchQuery}"</p>
        </div>
      `;
    }

    return html`
      <div class="grid">
        ${filteredChildren.map((item) => html`
          <a class="grid-item" href=${this.#getItemHref(item)}>
            <div class="grid-item-icon">
              <uui-icon name=${item.icon}></uui-icon>
            </div>
            <div class="grid-item-name">${item.name}</div>
          </a>
        `)}
      </div>
    `;
  }

  override render() {
    return html`
      <umb-workspace-editor alias="Notes.Workspace.Folder">
        <div id="header" slot="header">
          <uui-icon name="icon-folder"></uui-icon>
          <span>${this._name || "Loading..."}</span>
        </div>
        <div class="content">
          ${this.#renderToolbar()}
          ${this.#renderGrid()}
        </div>
      </umb-workspace-editor>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    #header {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
      font-size: var(--uui-type-h5-size);
      font-weight: 700;
    }

    .content {
      padding: var(--uui-size-space-5);
      height: 100%;
      box-sizing: border-box;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-4);
      margin-bottom: var(--uui-size-space-4);
      position: relative;
    }

    .toolbar uui-input {
      flex: 1;
      max-width: 400px;
    }

    .item-count {
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--uui-size-space-6);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--uui-size-layout-2);
      color: var(--uui-color-text-alt);
      text-align: center;
    }

    .empty-state uui-icon {
      font-size: 64px;
      margin-bottom: var(--uui-size-space-4);
      opacity: 0.5;
    }

    .empty-state p {
      margin: var(--uui-size-space-1) 0;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      grid-auto-rows: min-content;
      gap: var(--uui-size-space-4);
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

export default FolderWorkspaceEditorElement;

declare global {
  interface HTMLElementTagNameMap {
    "folder-workspace-editor-element": FolderWorkspaceEditorElement;
  }
}
