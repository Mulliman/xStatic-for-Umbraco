import { UmbElementMixin as p } from "@umbraco-cms/backoffice/element-api";
import { LitElement as l, html as _, css as d, customElement as h } from "@umbraco-cms/backoffice/external/lit";
import { UMB_MODAL_MANAGER_CONTEXT as v } from "@umbraco-cms/backoffice/modal";
var f = Object.getOwnPropertyDescriptor, u = (e) => {
  throw TypeError(e);
}, E = (e, t, r, s) => {
  for (var a = s > 1 ? void 0 : s ? f(t, r) : t, o = e.length - 1, c; o >= 0; o--)
    (c = e[o]) && (a = c(a) || a);
  return a;
}, A = (e, t, r) => t.has(e) || u("Cannot " + r), T = (e, t, r) => t.has(e) ? u("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), k = (e, t, r) => (A(e, t, "access private method"), r), i, m;
let n = class extends p(l) {
  constructor() {
    super(...arguments), T(this, i);
  }
  render() {
    return _`
            <uui-button @click=${k(this, i, m)}
                look="primary"
                label="time"
                compact>
                <uui-icon name="icon-alarm-clock"></uui-icon>
            </uui-button>
        `;
  }
};
i = /* @__PURE__ */ new WeakSet();
m = function() {
  this.consumeContext(v, (e) => {
    e && e.open(this, "time.header.modal", {});
  });
};
n.styles = d`
        uui-button {
            font-size: 18pt;
            --uui-button-background-color: transparent;
        }
    `;
n = E([
  h("time-header-app")
], n);
const O = n;
export {
  n as TimeHeaderAppElement,
  O as default
};
//# sourceMappingURL=time-header-element-Bkftx33C.js.map
