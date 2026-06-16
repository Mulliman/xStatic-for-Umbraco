import { UmbControllerBase as e } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as o } from "@umbraco-cms/backoffice/context-api";
import { UMB_WORKSPACE_CONTEXT as r } from "@umbraco-cms/backoffice/workspace";
class s extends e {
  constructor(t) {
    super(t), this.workspaceAlias = "time.workspace", this.provideContext(r, this), this.provideContext(i, this);
  }
  getEntityType() {
    return "time-workspace";
  }
  getUnique() {
  }
}
const i = new o(
  s.name
);
export {
  i as TIME_WORKSPACE_CONTEXT,
  s as TimeWorkspaceContext,
  s as default
};
//# sourceMappingURL=context-BPPHcj4a.js.map
