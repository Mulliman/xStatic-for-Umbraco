/**
 * @fileoverview Notes Tree Types
 *
 * Type definitions for the Notes tree structure.
 * These extend Umbraco's base tree types to provide type-safe
 * tree operations with proper entity type discrimination.
 *
 * **Why extend Umbraco's tree types?**
 *
 * Umbraco's `UmbTreeItemModel` is generic and accepts any entity type.
 * By creating our own interfaces that narrow the `entityType` property,
 * we get TypeScript support for:
 * - Type guards based on entity type
 * - Autocomplete for valid entity types
 * - Compile-time errors for invalid entity types
 *
 * **Usage:**
 *
 * ```typescript
 * // In tree repository or data source
 * const items: NotesTreeItemModel[] = await fetchItems();
 *
 * // Type guard example
 * if (item.entityType === NOTES_FOLDER_ENTITY_TYPE) {
 *   // TypeScript knows this is a folder
 *   navigateToFolder(item);
 * }
 * ```
 *
 * Note: API response types are auto-generated in `../api/types.gen.ts`
 *
 * Skills demonstrated: umbraco-tree, TypeScript interfaces
 */

import type { UmbTreeItemModel, UmbTreeRootModel } from "@umbraco-cms/backoffice/tree";
import {
  NOTES_ROOT_ENTITY_TYPE,
  NOTES_FOLDER_ENTITY_TYPE,
  NOTES_NOTE_ENTITY_TYPE,
} from "../constants.js";

/**
 * Tree item model for notes and folders.
 *
 * Extends Umbraco's base `UmbTreeItemModel` to narrow the `entityType`
 * property to only valid Notes entity types. This enables type-safe
 * tree item handling throughout the extension.
 *
 * **Properties inherited from UmbTreeItemModel:**
 * - `unique` - Unique identifier for the item
 * - `name` - Display name shown in the tree
 * - `hasChildren` - Whether this item has child items
 * - `isFolder` - Whether this item is a folder
 * - `icon` - Icon name for display
 * - `parent` - Parent item reference
 *
 * @example
 * // Creating a tree item
 * const item: NotesTreeItemModel = {
 *   unique: "123",
 *   entityType: NOTES_NOTE_ENTITY_TYPE,
 *   name: "My Note",
 *   hasChildren: false,
 *   isFolder: false,
 *   icon: "icon-notepad",
 *   parent: { unique: "folder-456", entityType: NOTES_FOLDER_ENTITY_TYPE },
 * };
 */
export interface NotesTreeItemModel extends UmbTreeItemModel {
  /**
   * Entity type discriminator.
   *
   * Used by Umbraco to route tree item clicks to the correct workspace.
   * Must be one of the registered entity types for the Notes extension.
   */
  entityType:
    | typeof NOTES_FOLDER_ENTITY_TYPE
    | typeof NOTES_NOTE_ENTITY_TYPE;
}

/**
 * Tree root model for the Notes tree.
 *
 * Represents the virtual root of the tree structure.
 * The root is not a real entity - it's a container for top-level items.
 * Umbraco uses this for tree initialization and root-level operations.
 *
 * **Important:** The root entity type is used by entity actions
 * to identify when an action is being performed at the root level
 * (e.g., creating a note or folder at the top level).
 *
 * @example
 * // The tree repository returns this for root-level operations
 * const root: NotesTreeRootModel = {
 *   entityType: NOTES_ROOT_ENTITY_TYPE,
 *   unique: null, // Root has no unique ID
 *   name: "Notes",
 * };
 */
export interface NotesTreeRootModel extends UmbTreeRootModel {
  /**
   * Entity type for the root.
   *
   * Always `notes-root` - used to identify root-level operations.
   */
  entityType: typeof NOTES_ROOT_ENTITY_TYPE;
}
