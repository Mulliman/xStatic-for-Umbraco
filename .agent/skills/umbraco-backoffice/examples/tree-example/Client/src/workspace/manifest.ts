import { OUR_TREE_ITEM_ENTITY_TYPE } from "../settingsTree/types.js";
import { UMB_WORKSPACE_CONDITION_ALIAS } from "@umbraco-cms/backoffice/workspace";

export const OUR_TREE_WORKSPACE_ALIAS = "OurTree.Workspace";

const workspaceManifest: UmbExtensionManifest = {
  type: "workspace",
  kind: "routable",
  alias: OUR_TREE_WORKSPACE_ALIAS,
  name: "OurTree Item Workspace",
  api: () => import("./ourtree-workspace.context.js"),
  meta: {
    entityType: OUR_TREE_ITEM_ENTITY_TYPE,
  },
};

const workspaceViewManifest: UmbExtensionManifest = {
  type: "workspaceView",
  alias: "OurTree.WorkspaceView.Details",
  name: "OurTree Workspace Details View",
  element: () => import("./views/ourtree-workspace-view.element.js"),
  weight: 100,
  meta: {
    label: "Details",
    pathname: "details",
    icon: "icon-info",
  },
  conditions: [
    {
      alias: UMB_WORKSPACE_CONDITION_ALIAS,
      match: OUR_TREE_WORKSPACE_ALIAS,
    },
  ],
};

export const manifests: Array<UmbExtensionManifest> = [
  workspaceManifest,
  workspaceViewManifest,
];
