import { UmbElementMixin as h } from "@umbraco-cms/backoffice/element-api";
import { LitElement as c, html as m, css as v, state as f, customElement as _ } from "@umbraco-cms/backoffice/external/lit";
var y = Object.defineProperty, x = Object.getOwnPropertyDescriptor, p = (e) => {
  throw TypeError(e);
}, l = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? x(t, r) : t, s = e.length - 1, u; s >= 0; s--)
    (u = e[s]) && (a = (i ? u(t, r, a) : u(a)) || a);
  return i && a && y(t, r, a), a;
}, b = (e, t, r) => t.has(e) || p("Cannot " + r), w = (e, t, r) => t.has(e) ? p("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), E = (e, t, r) => (b(e, t, "access private method"), r), n, d;
let o = class extends h(c) {
  constructor() {
    super(...arguments), w(this, n), this.text = "your text goes here";
  }
  render() {
    return m`
            <umb-body-layout header-transparent header-fit-height>
                <uui-box headline="default view">
                    <umb-property-layout
                        label="property"
                        description="property description">
                        <div slot="editor">
                            <uui-input
                                slot="editor"
                                type="text"
                                @change=${E(this, n, d)}
                                .value=${this.text}></uui-input>
                        </div>
                    </umb-property-layout>

                    <em>[${this.text}]</em>
                </uui-box>
            </umb-body-layout>

        `;
  }
};
n = /* @__PURE__ */ new WeakSet();
d = function(e) {
  this.text = e.target.value;
};
o.styles = v`
        uui-input {
            width: 100%;
            --uui-button-border-radius: 0;
        }
    `;
l([
  f()
], o.prototype, "text", 2);
o = l([
  _("time-workspace-default-view")
], o);
const D = o;
export {
  o as TimeDefaultWorkspaceElement,
  D as default
};
//# sourceMappingURL=defaultWorkspace.element-7IkXAZPv.js.map
