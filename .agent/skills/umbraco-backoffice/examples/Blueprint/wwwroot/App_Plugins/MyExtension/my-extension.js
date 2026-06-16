import { UMB_WORKSPACE_CONDITION_ALIAS as n } from "@umbraco-cms/backoffice/workspace";
const i = [
  {
    name: "Blueprint Entrypoint",
    alias: "Blueprint.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-CWUPkU2h.js")
  }
], a = [
  {
    name: "Blueprint Dashboard",
    alias: "Blueprint.Dashboard",
    type: "dashboard",
    js: () => import("./dashboard.element--L2h73vx.js"),
    weight: 100,
    meta: {
      label: "Welcome",
      pathname: "welcome"
    },
    conditions: [
      {
        // Dashboard only shows in the Blueprint section
        alias: "Umb.Condition.SectionAlias",
        match: "Blueprint.Section"
      }
    ]
  }
], t = "Blueprint.Section", o = {
  type: "menu",
  alias: "Blueprint.Menu",
  name: "Blueprint Menu",
  meta: {
    label: "Navigation"
  }
}, s = {
  type: "menuItem",
  alias: "Blueprint.MenuItem",
  name: "Blueprint Menu Item",
  meta: {
    label: "My Item",
    icon: "icon-document",
    entityType: "blueprint-entity",
    // Links to workspace via entityType
    menus: ["Blueprint.Menu"]
  }
}, p = {
  type: "sectionSidebarApp",
  kind: "menuWithEntityActions",
  alias: "Blueprint.SidebarApp",
  name: "Blueprint Sidebar",
  meta: {
    label: "Items",
    menu: "Blueprint.Menu"
  },
  conditions: [
    {
      alias: "Umb.Condition.SectionAlias",
      match: t
    }
  ]
}, r = [
  // Section - appears in top navigation
  {
    type: "section",
    alias: t,
    name: "Blueprint Section",
    weight: 100,
    meta: {
      label: "Blueprint",
      pathname: "blueprint"
    }
  },
  p,
  o,
  s
], e = "Blueprint.Workspace", l = [
  {
    type: "workspace",
    alias: e,
    name: "Blueprint Workspace",
    element: () => import("./workspace.element-Cqpx0ovr.js"),
    meta: {
      // entityType links this workspace to menu items with the same entityType
      entityType: "blueprint-entity"
    }
  },
  {
    type: "workspaceView",
    alias: "Blueprint.WorkspaceView.Another",
    name: "Blueprint Another View",
    element: () => import("./anotherWorkspace.element-B92XJiC-.js"),
    weight: 200,
    meta: {
      icon: "icon-document",
      pathname: "another",
      label: "Another"
    },
    conditions: [
      {
        alias: "Umb.Condition.WorkspaceAlias",
        match: e
      }
    ]
  },
  {
    type: "workspaceView",
    alias: "Blueprint.WorkspaceView.Counter",
    name: "Blueprint Counter View",
    element: () => import("./defaultWorkspace.element-Dj1vi3Oe.js"),
    weight: 100,
    meta: {
      icon: "icon-calculator",
      pathname: "counter",
      label: "Counter"
    },
    conditions: [
      {
        alias: "Umb.Condition.WorkspaceAlias",
        match: e
      }
    ]
  },
  {
    type: "workspaceContext",
    name: "Blueprint Counter Workspace Context",
    alias: "Blueprint.WorkspaceContext.Counter",
    api: () => import("./context-CQWPbpYh.js"),
    conditions: [
      {
        alias: n,
        match: e
      }
    ]
  }
], c = [
  ...i,
  ...a,
  ...r,
  ...l
];
export {
  c as manifests
};
//# sourceMappingURL=my-extension.js.map
