/**
 * Folder Tree Item Context
 *
 * Custom tree item context for folders that navigates to Browse dashboard
 * instead of opening a workspace.
 *
 * Skills used: umbraco-tree-item, umbraco-routing
 */

import { UmbDefaultTreeItemContext, type UmbTreeItemModel, type UmbTreeRootModel } from "@umbraco-cms/backoffice/tree";
import { NOTES_SECTION_PATHNAME } from "../constants.js";

export class NotesFolderTreeItemContext extends UmbDefaultTreeItemContext<
  UmbTreeItemModel,
  UmbTreeRootModel
> {
  /**
   * Override constructPath to navigate to Browse dashboard with folder parameter
   * instead of opening a workspace.
   */
  override constructPath(_pathname: string, _entityType: string, unique: string | null): string {
    // Navigate to Browse dashboard with folder as path segment (not query param)
    // This ensures Umbraco's router detects the change and re-renders properly
    if (unique) {
      return `section/${NOTES_SECTION_PATHNAME}/dashboard/browse/folder/${encodeURIComponent(unique)}`;
    }
    return `section/${NOTES_SECTION_PATHNAME}/dashboard/browse`;
  }
}

export { NotesFolderTreeItemContext as api };
