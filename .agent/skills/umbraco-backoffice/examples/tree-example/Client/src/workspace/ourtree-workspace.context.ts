import { OUR_TREE_ITEM_ENTITY_TYPE } from "../settingsTree/types.js";
import { OUR_TREE_WORKSPACE_CONTEXT } from "./ourtree-workspace.context-token.js";
import { OUR_TREE_WORKSPACE_ALIAS } from "./manifest.js";
import { OurTreeWorkspaceEditorElement } from "./ourtree-workspace-editor.element.js";
import { UmbWorkspaceRouteManager } from "@umbraco-cms/backoffice/workspace";
import { UmbStringState } from "@umbraco-cms/backoffice/observable-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextBase } from "@umbraco-cms/backoffice/class-api";

/**
 * Workspace context for managing OurTree item editing.
 */
export class OurTreeWorkspaceContext extends UmbContextBase {
  public readonly workspaceAlias = OUR_TREE_WORKSPACE_ALIAS;

  #unique = new UmbStringState(undefined);
  readonly unique = this.#unique.asObservable();

  #name = new UmbStringState(undefined);
  readonly name = this.#name.asObservable();

  #icon = new UmbStringState("icon-bug");
  readonly icon = this.#icon.asObservable();

  readonly routes = new UmbWorkspaceRouteManager(this);

  constructor(host: UmbControllerHost) {
    super(host, OUR_TREE_WORKSPACE_CONTEXT);

    this.routes.setRoutes([
      {
        path: "edit/:unique",
        component: OurTreeWorkspaceEditorElement,
        setup: (_component, info) => {
          const unique = info.match.params.unique;
          this.load(unique);
        },
      },
    ]);
  }

  async load(unique: string) {
    this.#unique.setValue(unique);
    // For this example, we just display the unique ID
    // A real implementation would load from a detail repository
    this.#name.setValue(`Tree Item ${unique}`);
  }

  getUnique() {
    return this.#unique.getValue();
  }

  getEntityType() {
    return OUR_TREE_ITEM_ENTITY_TYPE;
  }

  override destroy() {
    this.#unique.destroy();
    this.#name.destroy();
    this.#icon.destroy();
    super.destroy();
  }
}

export { OurTreeWorkspaceContext as api };
