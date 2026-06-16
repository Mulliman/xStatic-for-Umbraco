import { html as a, css as c, customElement as i } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as u } from "@umbraco-cms/backoffice/lit-element";
var m = Object.getOwnPropertyDescriptor, d = (o, s, p, l) => {
  for (var e = l > 1 ? void 0 : l ? m(s, p) : s, t = o.length - 1, n; t >= 0; t--)
    (n = o[t]) && (e = n(e) || e);
  return e;
};
let r = class extends u {
  render() {
    return a`
        <umb-workspace-editor headline="Blueprint" alias="Blueprint.Workspace" .enforceNoFooter=${!0}>
        </umb-workspace-editor>
    `;
  }
};
r.styles = c`
    :host {
      display: block;
      height: 100%;
    }
  `;
r = d([
  i("blueprint-workspace")
], r);
const h = r;
export {
  r as BlueprintWorkspaceElement,
  h as default
};
//# sourceMappingURL=workspace.element-Cqpx0ovr.js.map
