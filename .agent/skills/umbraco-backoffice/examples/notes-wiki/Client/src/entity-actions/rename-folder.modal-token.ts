/**
 * Folder Name Modal Token
 *
 * Modal token and types for creating/renaming folders.
 * Reused by both Create Folder and Rename Folder actions.
 * Skills used: umbraco-modals
 */

import { UmbModalToken } from "@umbraco-cms/backoffice/modal";

export interface FolderNameModalData {
  /** Headline for the modal (e.g., "Create Folder" or "Rename Folder") */
  headline: string;
  /** Current folder name (empty for create, existing name for rename) */
  currentName: string;
  /** Button label (e.g., "Create" or "Rename") */
  confirmLabel: string;
}

export interface FolderNameModalValue {
  name: string;
}

export const FOLDER_NAME_MODAL = new UmbModalToken<
  FolderNameModalData,
  FolderNameModalValue
>("Notes.Modal.FolderName", {
  modal: {
    type: "sidebar",
    size: "small",
  },
});
