import { UmbElementMixin as l } from "@umbraco-cms/backoffice/element-api";
import { LitElement as m, html as d, css as _, customElement as v } from "@umbraco-cms/backoffice/external/lit";
import { TimeWorkspaceContext as h } from "./context-BPPHcj4a.js";
var u = Object.getOwnPropertyDescriptor, c = (e) => {
  throw TypeError(e);
}, f = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? u(t, r) : t, s = e.length - 1, p; s >= 0; s--)
    (p = e[s]) && (a = p(a) || a);
  return a;
}, k = (e, t, r) => t.has(e) || c("Cannot " + r), w = (e, t, r) => (k(e, t, "read from private field"), r ? r.call(e) : t.get(e)), x = (e, t, r) => t.has(e) ? c("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), n;
let o = class extends l(m) {
  constructor() {
    super(), x(this, n, new h(this)), w(this, n)._host;
  }
  render() {
    return d`
            <umb-workspace-editor headline="Time" alias="time.workspace" .enforceNoFooter=${!0}>
            </umb-workspace-editor>
        `;
  }
};
n = /* @__PURE__ */ new WeakMap();
o.styles = _`
        uui-box {
            display: block;
            margin: 20px;
        }
    `;
o = f([
  v("time-workspace-root")
], o);
const T = o;
export {
  o as TimeWorkspaceElement,
  T as default
};
//# sourceMappingURL=workspace.element-B0UG53Er.js.map
