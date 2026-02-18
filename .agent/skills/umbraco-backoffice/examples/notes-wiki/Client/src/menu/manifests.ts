/**
 * Notes Menu Manifest
 *
 * This file registers the Menu and MenuItem for the Notes section.
 *
 * MENU: A container for menu items in the sidebar.
 * MENUITEM: Individual navigation items. Using kind: "tree" connects to a tree.
 *
 * Skills used: umbraco-menu, umbraco-menu-items
 *
 * CONNECTION PATTERN:
 * Menu.alias --> SidebarApp.meta.menu (how sidebar finds menu)
 * MenuItem.meta.menus --> Menu.alias (how item belongs to menu)
 * MenuItem.meta.treeAlias --> Tree.alias (how menu item shows tree)
 * MenuItem.meta.entityType --> Links clicks to workspace
 *
 * Key properties:
 * - MenuItem kind: "tree" - Shows a tree structure
 * - meta.treeAlias: The tree to display
 * - meta.entityType: Links to workspace when tree root is clicked
 * - meta.hideTreeRoot: Whether to show the root node
 */

import {
  NOTES_MENU_ALIAS,
  NOTES_MENU_ITEM_ALIAS,
  NOTES_TREE_ALIAS,
  NOTES_ROOT_ENTITY_TYPE,
} from "../constants.js";

const menuManifest: UmbExtensionManifest = {
  type: "menu",
  alias: NOTES_MENU_ALIAS,
  name: "Notes Menu",
  meta: {
    label: "Notes",
  },
};

const menuItemManifest: UmbExtensionManifest = {
  type: "menuItem",
  kind: "tree", // This makes it show a tree
  alias: NOTES_MENU_ITEM_ALIAS,
  name: "Notes Menu Item",
  weight: 100,
  meta: {
    label: "All Notes",
    icon: "icon-notepad",
    entityType: NOTES_ROOT_ENTITY_TYPE, // For tree root clicks
    menus: [NOTES_MENU_ALIAS], // Belongs to our menu
    treeAlias: NOTES_TREE_ALIAS, // Shows our tree
    hideTreeRoot: true, // Don't show root node, show children directly
  },
};

export const manifests: Array<UmbExtensionManifest> = [
  menuManifest,
  menuItemManifest,
];
