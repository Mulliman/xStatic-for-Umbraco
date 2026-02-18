import { html as h, css as c, property as o, state as _, customElement as y } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as d } from "@umbraco-cms/backoffice/lit-element";
var f = Object.defineProperty, m = Object.getOwnPropertyDescriptor, v = (e) => {
  throw TypeError(e);
}, n = (e, t, a, l) => {
  for (var r = l > 1 ? void 0 : l ? m(t, a) : t, u = e.length - 1, i; u >= 0; u--)
    (i = e[u]) && (r = (l ? i(t, a, r) : i(r)) || r);
  return l && r && f(t, a, r), r;
}, x = (e, t, a) => t.has(e) || v("Cannot " + a), E = (e, t, a) => (x(e, t, "read from private field"), a ? a.call(e) : t.get(e)), g = (e, t, a) => t.has(e) ? v("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, a), p;
let s = class extends d {
  constructor() {
    super(...arguments), this.value = "", g(this, p, (e) => {
      const t = e.target.value;
      t !== this.value && (this.value = t, this.dispatchEvent(new CustomEvent("property-value-change")));
    });
  }
  set config(e) {
    this._styleValue = e?.getValueByAlias("styleValue") ?? "";
  }
  render() {
    return h`
            <uui-input
              .value=${this.value ?? ""}
              .style=${this._styleValue}
              type="text"
              @input=${E(this, p)}></uui-input>
        `;
  }
};
p = /* @__PURE__ */ new WeakMap();
s.styles = c`
        uui-input {
          width: 100%;
        }
    `;
n([
  o()
], s.prototype, "value", 2);
n([
  _()
], s.prototype, "_styleValue", 2);
n([
  o({ attribute: !1 })
], s.prototype, "config", 1);
s = n([
  y("styled-textbox")
], s);
const V = s;
export {
  s as StyledTextboxUiElement,
  V as default
};
//# sourceMappingURL=styledtext.ui.element-B8Wd4CK3.js.map
