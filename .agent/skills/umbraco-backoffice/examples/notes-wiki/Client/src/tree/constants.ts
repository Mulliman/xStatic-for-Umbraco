/**
 * @fileoverview Tree Constants
 *
 * Defines aliases for the Notes tree navigation system.
 * The tree provides hierarchical navigation for notes and folders.
 *
 * The tree system consists of two components:
 * 1. **Tree** - The visual tree structure in the sidebar
 * 2. **Repository** - Coordinates data access with inline data source
 *
 * Skills demonstrated: umbraco-tree, umbraco-repository-pattern
 */

/**
 * Alias for the Notes tree.
 *
 * The tree appears in the sidebar and shows the folder/note hierarchy.
 * Clicking items opens the corresponding workspace.
 *
 * @constant {string}
 */
export const NOTES_TREE_ALIAS = "Notes.Tree";

/**
 * Alias for the Notes tree repository.
 *
 * The repository is the interface between the tree UI and the API.
 * It handles data fetching and tree structure operations with an inline data source.
 *
 * @constant {string}
 */
export const NOTES_TREE_REPOSITORY_ALIAS = "Notes.Tree.Repository";

/**
 * Alias for the Notes tree item extension.
 *
 * Tree items define how individual nodes are rendered.
 * This default item handles both folders and notes.
 *
 * @constant {string}
 */
export const NOTES_TREE_ITEM_ALIAS = "Notes.TreeItem";

/**
 * Alias for the folder-specific tree item extension.
 *
 * This provides custom behavior for folder tree items,
 * such as navigation to the folder workspace.
 *
 * @constant {string}
 */
export const NOTES_FOLDER_TREE_ITEM_ALIAS = "Notes.TreeItem.Folder";
