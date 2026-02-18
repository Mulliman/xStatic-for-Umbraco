/**
 * Notes Tree Manifests
 *
 * Registers all tree-related extensions:
 * - Repository: Data operations (with inline data source)
 * - Tree: The tree structure itself
 * - TreeItem: Custom rendering for tree nodes
 *
 * Skills used: umbraco-tree, umbraco-tree-item, umbraco-repository-pattern
 *
 * CONNECTION PATTERN:
 * Tree.meta.repositoryAlias --> Repository.alias
 * MenuItem.meta.treeAlias --> Tree.alias
 * TreeItem.forEntityTypes --> determines which items use this renderer
 */

import {
  NOTES_TREE_ALIAS,
  NOTES_TREE_REPOSITORY_ALIAS,
  NOTES_TREE_ITEM_ALIAS,
  NOTES_ROOT_ENTITY_TYPE,
  NOTES_FOLDER_ENTITY_TYPE,
  NOTES_NOTE_ENTITY_TYPE,
} from "../constants.js";

/**
 * Repository manifest
 * The repository handles data operations for the tree with an inline data source.
 */
const repositoryManifest: UmbExtensionManifest = {
  type: "repository",
  alias: NOTES_TREE_REPOSITORY_ALIAS,
  name: "Notes Tree Repository",
  api: () => import("./notes-tree.repository.js"),
};

/**
 * Tree manifest
 * Defines the tree and links it to the repository.
 */
const treeManifest: UmbExtensionManifest = {
  type: "tree",
  kind: "default",
  alias: NOTES_TREE_ALIAS,
  name: "Notes Tree",
  meta: {
    repositoryAlias: NOTES_TREE_REPOSITORY_ALIAS, // Links to our repository
  },
};

/**
 * TreeItem manifest for all entity types
 * Defines how tree items are rendered.
 * forEntityTypes determines which entity types use this renderer.
 *
 * Since folders now have a workspace with matching entityType,
 * the default tree item behavior works correctly - clicking a folder
 * opens the folder workspace.
 */
const treeItemManifest: UmbExtensionManifest = {
  type: "treeItem",
  kind: "default", // Uses default tree item rendering
  alias: NOTES_TREE_ITEM_ALIAS,
  name: "Notes Tree Item",
  forEntityTypes: [
    NOTES_ROOT_ENTITY_TYPE,
    NOTES_FOLDER_ENTITY_TYPE,
    NOTES_NOTE_ENTITY_TYPE,
  ],
};

/**
 * Reload Tree Item Children Entity Action
 *
 * This registers the built-in "Reload" action for tree items.
 * This is REQUIRED for tree refresh events to work properly.
 *
 * When UmbRequestReloadChildrenOfEntityEvent is dispatched, the tree item
 * children manager listens for it. This manifest ensures the reload
 * functionality is available for our entity types.
 */
const reloadTreeItemChildrenManifest: UmbExtensionManifest = {
  type: "entityAction",
  kind: "reloadTreeItemChildren",
  alias: "Notes.EntityAction.Tree.ReloadChildrenOf",
  name: "Reload Notes Tree Item Children Entity Action",
  forEntityTypes: [
    NOTES_ROOT_ENTITY_TYPE,
    NOTES_FOLDER_ENTITY_TYPE,
    NOTES_NOTE_ENTITY_TYPE,
  ],
};

export const manifests: Array<UmbExtensionManifest> = [
  repositoryManifest,
  treeManifest,
  treeItemManifest,
  reloadTreeItemChildrenManifest,
];
