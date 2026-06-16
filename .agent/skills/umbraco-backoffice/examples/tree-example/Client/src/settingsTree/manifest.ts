import {
  OUR_TREE_ITEM_ENTITY_TYPE,
  OUR_TREE_ROOT_ENTITY_TYPE,
} from "./types.js";

const repositoryManifest: UmbExtensionManifest = {
  type: "repository",
  alias: "OurTree.Repository",
  name: "OurTree Repository",
  api: () => import("./ourtree.repository.js"),
};

const treeManifest: UmbExtensionManifest = {
  type: "tree",
  kind: "default",
  alias: "OurTree.Tree",
  name: "OurTree Tree",
  meta: {
    repositoryAlias: repositoryManifest.alias,
  },
};

const treeItemManifest: UmbExtensionManifest = {
  type: "treeItem",
  kind: "default",
  alias: "OurTree.TreeItem",
  name: "OurTree Tree Item",
  forEntityTypes: [OUR_TREE_ROOT_ENTITY_TYPE, OUR_TREE_ITEM_ENTITY_TYPE],
};

const menuManifest: UmbExtensionManifest = {
  type: "menu",
  alias: "OurTree.Menu",
  name: "OurTree Menu",
  meta: {
    label: "Our Tree",
  },
};

const menuItemManifest: UmbExtensionManifest = {
  type: "menuItem",
  kind: "tree",
  alias: "OurTree.MenuItem",
  name: "OurTree Menu Item",
  weight: 100,
  meta: {
    label: "Our Tree",
    icon: "icon-bug",
    entityType: OUR_TREE_ROOT_ENTITY_TYPE,
    menus: [menuManifest.alias],
    treeAlias: treeManifest.alias,
    hideTreeRoot: true,
  },
};

const sidebarManifest: UmbExtensionManifest = {
  type: "sectionSidebarApp",
  kind: "menu",
  alias: "OurTree.SidebarApp",
  name: "OurTree Sidebar App",
  weight: 100,
  meta: {
    label: "Our Tree",
    menu: menuManifest.alias,
  },
  conditions: [
    {
      alias: "Umb.Condition.SectionAlias",
      match: "Umb.Section.Settings",
    },
  ],
};

export const manifests: Array<UmbExtensionManifest> = [
  repositoryManifest,
  treeManifest,
  treeItemManifest,
  menuManifest,
  menuItemManifest,
  sidebarManifest,
];
