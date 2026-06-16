import type { ManifestMenu, ManifestMenuItem } from "@umbraco-cms/backoffice/menu";
import type { ManifestSectionSidebarApp } from "@umbraco-cms/backoffice/section";

// Section alias - used to link components together
const sectionAlias = "Blueprint.Section";

// Menu that appears in the sidebar
const menuManifest: ManifestMenu = {
  type: "menu",
  alias: "Blueprint.Menu",
  name: "Blueprint Menu",
  meta: {
    label: "Navigation",
  },
};

// Menu item that opens the workspace when clicked
const menuItemManifest: ManifestMenuItem = {
  type: "menuItem",
  alias: "Blueprint.MenuItem",
  name: "Blueprint Menu Item",
  meta: {
    label: "My Item",
    icon: "icon-document",
    entityType: "blueprint-entity", // Links to workspace via entityType
    menus: ["Blueprint.Menu"],
  },
};

// Sidebar app that contains the menu
const sectionSidebarAppManifest: ManifestSectionSidebarApp = {
  type: "sectionSidebarApp",
  kind: "menuWithEntityActions",
  alias: "Blueprint.SidebarApp",
  name: "Blueprint Sidebar",
  meta: {
    label: "Items",
    menu: "Blueprint.Menu",
  },
  conditions: [
    {
      alias: "Umb.Condition.SectionAlias",
      match: sectionAlias,
    },
  ],
};

export const manifests: Array<UmbExtensionManifest> = [
  // Section - appears in top navigation
  {
    type: "section",
    alias: sectionAlias,
    name: "Blueprint Section",
    weight: 100,
    meta: {
      label: "Blueprint",
      pathname: "blueprint",
    },
  },
  sectionSidebarAppManifest,
  menuManifest,
  menuItemManifest,
];
