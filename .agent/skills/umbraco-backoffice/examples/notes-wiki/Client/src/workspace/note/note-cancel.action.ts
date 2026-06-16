/**
 * Note Cancel Action
 *
 * A workspace action that navigates back to the previous page.
 *
 * Skills used: umbraco-workspace
 */

import { UmbWorkspaceActionBase } from "@umbraco-cms/backoffice/workspace";

export class NoteCancelAction extends UmbWorkspaceActionBase {
  override async execute() {
    history.back();
  }
}

export { NoteCancelAction as api };
