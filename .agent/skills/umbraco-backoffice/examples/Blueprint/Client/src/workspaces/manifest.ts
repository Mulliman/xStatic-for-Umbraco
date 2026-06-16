import { UMB_WORKSPACE_CONDITION_ALIAS } from "@umbraco-cms/backoffice/workspace";

const workspaceAlias = "Blueprint.Workspace";

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "workspace",
    alias: workspaceAlias,
    name: "Blueprint Workspace",
    element: () => import("./workspace.element.js"),
    meta: {
      // entityType links this workspace to menu items with the same entityType
      entityType: "blueprint-entity",
    },
  },
  {
    type: 'workspaceView',
    alias: 'Blueprint.WorkspaceView.Another',
    name: 'Blueprint Another View',
    element: () => import('./views/anotherWorkspace.element.js'),
    weight: 200,
    meta: {
      icon: 'icon-document',
      pathname: 'another',
      label: 'Another'
    },
    conditions: [
      {
        alias: 'Umb.Condition.WorkspaceAlias',
        match: workspaceAlias
      },
    ],
  },
  {
    type: 'workspaceView',
    alias: 'Blueprint.WorkspaceView.Counter',
    name: 'Blueprint Counter View',
    element: () => import('./views/defaultWorkspace.element.js'),
    weight: 100,
    meta: {
      icon: 'icon-calculator',
      pathname: 'counter',
      label: 'Counter'
    },
    conditions: [
      {
        alias: 'Umb.Condition.WorkspaceAlias',
        match: workspaceAlias
      },
    ],
  },
  {
    type: 'workspaceContext',
    name: 'Blueprint Counter Workspace Context',
    alias: 'Blueprint.WorkspaceContext.Counter',
    api: () => import('./context.js'),
    conditions: [
      {
        alias: UMB_WORKSPACE_CONDITION_ALIAS,
        match: workspaceAlias,
      },
    ]
  }
];
