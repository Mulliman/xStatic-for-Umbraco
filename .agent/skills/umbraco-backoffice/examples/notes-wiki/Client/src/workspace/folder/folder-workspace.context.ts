/**
 * Folder Workspace Context
 *
 * The workspace context for viewing a folder and its contents.
 * This is a read-only workspace - folders are renamed via entity actions.
 *
 * Skills used: umbraco-workspace, umbraco-context-api, umbraco-state-management
 */

import { NOTES_FOLDER_WORKSPACE_ALIAS } from "../constants.js";
import { FolderWorkspaceEditorElement } from "./folder-workspace-editor.element.js";
import { UmbSubmittableWorkspaceContextBase } from "@umbraco-cms/backoffice/workspace";
import { UmbStringState } from "@umbraco-cms/backoffice/observable-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { NOTES_FOLDER_ENTITY_TYPE } from "../../constants.js";
import { NoteswikiService } from "../../api/index.js";

/**
 * Model for folder data
 */
export interface FolderWorkspaceData {
  unique: string;
  name: string;
  parentUnique: string | null;
}

/**
 * Workspace context for viewing folders
 *
 * Extends UmbSubmittableWorkspaceContextBase to get routing support.
 * This is a read-only workspace - submit() is a no-op.
 */
export class FolderWorkspaceContext extends UmbSubmittableWorkspaceContextBase<FolderWorkspaceData> {
  // Observable state
  #unique = new UmbStringState(undefined);
  readonly unique = this.#unique.asObservable();

  #name = new UmbStringState("");
  readonly name = this.#name.asObservable();

  #parentUnique = new UmbStringState(undefined);
  readonly parentUnique = this.#parentUnique.asObservable();

  constructor(host: UmbControllerHost) {
    super(host, NOTES_FOLDER_WORKSPACE_ALIAS);

    // Define workspace routes
    this.routes.setRoutes([
      {
        // View folder contents
        path: "edit/:unique",
        component: FolderWorkspaceEditorElement,
        setup: (_component, info) => {
          const unique = info.match.params.unique;
          this.load(unique);
        },
      },
    ]);
  }

  /**
   * Load folder data from the API
   */
  async load(unique: string) {
    this.#unique.setValue(unique);

    try {
      const response = await NoteswikiService.getFolder({
        path: { id: unique },
      });

      const data = response.data;
      this.#name.setValue(data.name);
      this.#parentUnique.setValue(data.parentUnique ?? undefined);
    } catch (error) {
      console.error("Error loading folder:", error);
      this.#name.setValue("Error loading folder");
    }
  }

  // Getters required by UmbSubmittableWorkspaceContextBase
  getUnique() {
    return this.#unique.getValue();
  }

  getEntityType() {
    return NOTES_FOLDER_ENTITY_TYPE;
  }

  getData(): FolderWorkspaceData | undefined {
    const unique = this.#unique.getValue();
    if (!unique) return undefined;

    return {
      unique,
      name: this.#name.getValue(),
      parentUnique: this.#parentUnique.getValue() || null,
    };
  }

  /**
   * Submit is a no-op for the read-only folder workspace.
   * Folders are renamed via entity actions, not the workspace.
   */
  protected async submit(): Promise<void> {
    // No-op - this is a read-only workspace
  }

  override destroy() {
    this.#unique.destroy();
    this.#name.destroy();
    this.#parentUnique.destroy();
    super.destroy();
  }
}

export { FolderWorkspaceContext as api };
