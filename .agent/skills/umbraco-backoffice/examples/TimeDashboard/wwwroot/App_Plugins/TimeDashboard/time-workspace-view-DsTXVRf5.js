import { UmbElementMixin as i } from "@umbraco-cms/backoffice/element-api";
import { LitElement as c, html as u, css as l, state as f, customElement as g } from "@umbraco-cms/backoffice/external/lit";
import { UMB_WORKSPACE_CONTEXT as h } from "@umbraco-cms/backoffice/workspace";
var N = Object.defineProperty, _ = Object.getOwnPropertyDescriptor, p = (m, e, s, r) => {
  for (var t = r > 1 ? void 0 : r ? _(e, s) : e, a = m.length - 1, n; a >= 0; a--)
    (n = m[a]) && (t = (r ? n(e, s, t) : n(t)) || t);
  return r && t && N(e, s, t), t;
};
let o = class extends i(c) {
  constructor() {
    super(), this.pageName = "", this.consumeContext(h, (m) => {
      if (!m) return;
      const e = m;
      e.getName && (this.pageName = e.getName() ?? "", console.log(this.pageName));
    });
  }
  render() {
    return u`

            <uui-box headline="A content app?">
                <h2>Page Name: ${this.pageName}</h2>
            </uui-box>

        `;
  }
};
o.styles = l`
        uui-box {
            margin: 20px;
        }
    `;
p([
  f()
], o.prototype, "pageName", 2);
o = p([
  g("time-document-workspace-view")
], o);
const b = o;
export {
  o as TimeDocumentWorkspaceElement,
  b as default
};
//# sourceMappingURL=time-workspace-view-DsTXVRf5.js.map
