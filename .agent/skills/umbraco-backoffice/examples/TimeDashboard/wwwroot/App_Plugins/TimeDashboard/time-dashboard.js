import { UMB_WORKSPACE_CONDITION_ALIAS as e, UmbWorkspaceActionBase as c } from "@umbraco-cms/backoffice/workspace";
import { UMB_NOTIFICATION_CONTEXT as m } from "@umbraco-cms/backoffice/notification";
import { UMB_DOCUMENT_ENTITY_TYPE as r } from "@umbraco-cms/backoffice/document";
import { UmbEntityActionBase as p } from "@umbraco-cms/backoffice/entity-action";
const d = [
  {
    name: "Time Dashboard Entrypoint",
    alias: "TimeDashboard.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-CadrE5P6.js")
  }
], h = [
  {
    type: "globalContext",
    alias: "time.context",
    name: "Time context",
    api: () => import("./time.context-BIJ1IR8X.js")
  }
], b = [
  {
    type: "section",
    alias: "TimeDashboard.Section.Main",
    name: "TimeDashboard Section",
    weight: 10,
    meta: {
      label: "Time",
      pathname: "time"
    }
  }
], y = {
  type: "sectionSidebarApp",
  kind: "menuWithEntityActions",
  alias: "TimeDashboard.SidebarApp",
  name: "TimeDashboard Sidebar App",
  meta: {
    label: "Time",
    menu: "TimeDashboard.Menu.Nested"
  },
  conditions: [
    {
      alias: "Umb.Condition.SectionAlias",
      match: "TimeDashboard.Section.Main"
    }
  ]
}, w = {
  type: "menu",
  alias: "TimeDashboard.Menu.Main",
  name: "TimeDashboard Sidebar Menu",
  meta: {
    label: "Time"
  }
}, u = {
  type: "menuItem",
  alias: "TimeDashboard.MenuItem.TimeZones",
  name: "TimeDashboard Time Zones Menu Item",
  meta: {
    label: "Time zones",
    icon: "icon-alarm-clock",
    entityType: "time-workspace",
    menus: [
      "TimeDashboard.Menu.Main"
    ]
  },
  element: () => import("./nested-menu.element-BKrWPEgz.js")
}, n = {
  type: "menu",
  alias: "TimeDashboard.Menu.Nested",
  name: "TimeDashboard Nested Menu",
  element: () => import("./nested-menu.element-BKrWPEgz.js"),
  meta: {
    label: "Time zones",
    icon: "icon-alarm-clock",
    entityType: "time-workspace"
  }
}, T = [
  {
    type: "time-menu-item",
    alias: "TimeDashboard.MenuItem.Child1",
    name: "TimeDashboard Child Item 1",
    weight: 200,
    meta: {
      menus: [n.alias],
      icon: "icon-alarm-clock",
      label: "Child Item 1",
      entityType: "time-workspace"
    }
  },
  {
    type: "time-menu-item",
    alias: "TimeDashboard.MenuItem.Child2",
    name: "TimeDashboard Child Item 2",
    weight: 100,
    meta: {
      menus: [n.alias],
      icon: "icon-globe",
      label: "Child Item 2",
      entityType: "time-workspace2"
    }
  }
], k = [
  y,
  w,
  u,
  n,
  ...T
], g = [
  {
    type: "dashboard",
    name: "TimeDashboard Dashboard",
    alias: "TimeDashboard.Dashboard.Main",
    elementName: "time-dashboard-element",
    element: () => import("./dashboard.element-DKo0xYIX.js"),
    weight: -10,
    meta: {
      label: "Time Dashboard",
      pathname: "time-dashboard"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "TimeDashboard.Section.Main"
      }
    ]
  }
], t = "time.workspace", s = "time.workspace2", f = [
  // Workspace 1 (Child Item 1)
  {
    type: "workspaceContext",
    alias: "time.workspace.context",
    name: "time workspace context",
    api: () => import("./context-BPPHcj4a.js"),
    conditions: [
      {
        alias: e,
        match: t
      }
    ]
  },
  {
    type: "workspace",
    alias: t,
    name: "time workspace",
    element: () => import("./workspace.element-B0UG53Er.js"),
    meta: {
      entityType: "time-workspace"
    }
  },
  {
    type: "workspaceView",
    alias: "time.workspace.defaultTime",
    name: "default view",
    js: () => import("./defaultWorkspace.element-7IkXAZPv.js"),
    weight: 300,
    meta: {
      icon: "icon-alarm-clock",
      pathname: "overview",
      label: "Time"
    },
    conditions: [
      {
        alias: e,
        match: t
      }
    ]
  },
  {
    type: "workspaceView",
    alias: "time.workspace.settings",
    name: "setting view",
    js: () => import("./settingsWorkspace.element-BUTF5a5W.js"),
    weight: 200,
    meta: {
      icon: "icon-settings",
      pathname: "settings",
      label: "Settings"
    },
    conditions: [
      {
        alias: e,
        match: t
      }
    ]
  },
  {
    type: "workspaceView",
    alias: "time.workspace.dialogs",
    name: "dialogs",
    js: () => import("./dialogworkspace.element-D7KJoU1f.js"),
    weight: 50,
    meta: {
      icon: "icon-app",
      pathname: "dialogs",
      label: "Dialogs"
    },
    conditions: [
      {
        alias: e,
        match: t
      }
    ]
  },
  // Workspace 2 (Child Item 2)
  {
    type: "workspace",
    alias: s,
    name: "time workspace 2",
    element: () => import("./workspace2.element-CyLKc_MX.js"),
    meta: {
      entityType: "time-workspace2"
    }
  },
  {
    type: "workspaceView",
    alias: "time.workspace2.main",
    name: "workspace 2 main view",
    js: () => import("./workspace2View.element-C2lGWsk0.js"),
    weight: 300,
    meta: {
      icon: "icon-globe",
      pathname: "overview",
      label: "Overview"
    },
    conditions: [
      {
        alias: e,
        match: s
      }
    ]
  }
], x = [
  {
    type: "headerApp",
    alias: "time.header.app",
    name: "time app",
    js: () => import("./time-header-element-Bkftx33C.js"),
    weight: 850,
    meta: {
      label: "time",
      icon: "icon-alarm-clock",
      pathname: "time"
    }
  },
  {
    type: "modal",
    alias: "time.header.modal",
    name: "time header modal",
    js: () => import("./time-header-modal-PDNRHjor.js")
  }
], D = [
  {
    type: "modal",
    alias: "time.custom.modal",
    name: "Time custom modal",
    js: () => import("./custom-modal-element-D9nt2jeQ.js")
  }
], A = [
  {
    type: "propertyEditorSchema",
    name: "Styled textbox",
    alias: "styled.textbox",
    meta: {
      defaultPropertyEditorUiAlias: "styled.textbox.ui",
      settings: {
        properties: [
          {
            alias: "styleValue",
            label: "Styles",
            description: "Styles to apply to the box",
            propertyEditorUiAlias: "Umb.PropertyEditorUi.TextArea"
          }
        ],
        defaultData: [
          {
            alias: "styleValue",
            value: `font-size: 20px;\r
border:none; border-bottom: 1px solid #444;`
          }
        ]
      }
    }
  },
  {
    type: "propertyEditorUi",
    alias: "styled.textbox.ui",
    name: "styled textbox",
    js: () => import("./styledtext.ui.element-B8Wd4CK3.js"),
    elementName: "styled-text",
    meta: {
      label: "Styled textbox",
      icon: "icon-brush",
      group: "common",
      propertyEditorSchemaAlias: "styled.textbox"
    }
  }
], M = [
  {
    type: "workspaceView",
    alias: "time.document.workspace",
    name: "time contentapp",
    js: () => import("./time-workspace-view-DsTXVRf5.js"),
    weight: 10,
    meta: {
      icon: "icon-alarm-clock",
      pathname: "time",
      label: "time"
    },
    conditions: [
      {
        alias: "Umb.Condition.WorkspaceAlias",
        match: "Umb.Workspace.Document"
      }
    ]
  }
];
class C extends c {
  #e;
  constructor(a, i) {
    super(a, i), this.consumeContext(m, (o) => {
      this.#e = o;
    });
  }
  async execute() {
    this.#e?.peek("warning", {
      data: {
        headline: "A thing has happened!",
        message: "What that thing is? Only time will tell."
      }
    });
  }
}
const E = [
  {
    type: "workspaceAction",
    kind: "default",
    alias: "time.workspace.action",
    name: "Time Workspace Action",
    weight: 900,
    api: C,
    meta: {
      label: "Time Action",
      look: "primary",
      color: "default"
    },
    conditions: [
      {
        alias: e,
        match: "Umb.Workspace.Document"
      }
    ]
  }
];
class S extends p {
  #e;
  constructor(a, i) {
    super(a, i), this.consumeContext(m, (o) => {
      this.#e = o;
    });
  }
  async execute() {
    this.#e?.peek("warning", {
      data: {
        headline: "A thing has happened!",
        message: "What that thing is? Only time will tell."
      }
    });
  }
}
const I = [
  {
    type: "entityAction",
    kind: "default",
    alias: "time.entity.action",
    name: "tell me the time action",
    weight: -100,
    forEntityTypes: [
      r
    ],
    api: S,
    meta: {
      icon: "icon-alarm-clock",
      label: "Time Action"
    }
  }
], U = [
  {
    type: "localization",
    alias: "time.lang.enus",
    name: "English (US)",
    weight: 0,
    meta: {
      culture: "en-us"
    },
    js: () => import("./en-us-D3ueGTry.js")
  },
  {
    type: "localization",
    alias: "time.lang.engb",
    name: "English (UK)",
    weight: 0,
    meta: {
      culture: "en-gb"
    },
    js: () => import("./en-gb-D3ueGTry.js")
  }
], O = [
  ...d,
  ...h,
  ...b,
  ...k,
  ...g,
  ...f,
  ...x,
  ...D,
  ...A,
  ...M,
  ...E,
  ...I,
  ...U
];
export {
  O as manifests
};
//# sourceMappingURL=time-dashboard.js.map
