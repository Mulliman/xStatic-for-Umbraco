import { UmbModalBaseElement as c } from "@umbraco-cms/backoffice/modal";
import { html as m, customElement as h } from "@umbraco-cms/backoffice/external/lit";
var p = Object.getOwnPropertyDescriptor, i = (e) => {
  throw TypeError(e);
}, _ = (e, t, a, n) => {
  for (var o = n > 1 ? void 0 : n ? p(t, a) : t, r = e.length - 1, d; r >= 0; r--)
    (d = e[r]) && (o = d(o) || o);
  return o;
}, v = (e, t, a) => t.has(e) || i("Cannot " + a), f = (e, t, a) => t.has(e) ? i("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, a), g = (e, t, a) => (v(e, t, "access private method"), a), l, u;
let s = class extends c {
  constructor() {
    super(...arguments), f(this, l);
  }
  render() {
    return m`
            <uui-dialog-layout class="uui-text"
                headline="a modal dialog box">
                <p>Some modal things go here</p>

                <uui-button slot="actions" id="close" label="Close"
                    look='primary'  color='danger'
                     @click="${g(this, l, u)}">Close</uui-button>

            </uui-dialog-layout>
        `;
  }
};
l = /* @__PURE__ */ new WeakSet();
u = function() {
  this.modalContext?.reject();
};
s = _([
  h("time-header-modal")
], s);
const y = s;
export {
  s as TimeHeaderModalElement,
  y as default
};
//# sourceMappingURL=time-header-modal-PDNRHjor.js.map
