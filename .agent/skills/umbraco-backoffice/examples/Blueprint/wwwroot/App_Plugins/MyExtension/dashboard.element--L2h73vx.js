import { LitElement as c, html as h, css as d, state as m, customElement as v } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as _ } from "@umbraco-cms/backoffice/element-api";
var f = Object.defineProperty, x = Object.getOwnPropertyDescriptor, p = (e) => {
  throw TypeError(e);
}, l = (e, t, r, n) => {
  for (var a = n > 1 ? void 0 : n ? x(t, r) : t, o = e.length - 1, s; o >= 0; o--)
    (s = e[o]) && (a = (n ? s(t, r, a) : s(a)) || a);
  return n && a && f(t, r, a), a;
}, g = (e, t, r) => t.has(e) || p("Cannot " + r), y = (e, t, r) => (g(e, t, "read from private field"), r ? r.call(e) : t.get(e)), E = (e, t, r) => t.has(e) ? p("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), u;
let i = class extends _(c) {
  constructor() {
    super(...arguments), this._counter = 0, E(this, u, () => {
      this._counter++;
    });
  }
  render() {
    return h`
      <uui-box headline="Welcome to Blueprint">
        <p>
          This dashboard appears when you navigate to the Blueprint section
          without selecting an item from the menu.
        </p>

        <h3>Interactive Example</h3>
        <p>Button clicked: <strong>${this._counter}</strong> times</p>
        <uui-button
          color="positive"
          look="primary"
          @click="${y(this, u)}"
        >
          Click me!
        </uui-button>
      </uui-box>
    `;
  }
};
u = /* @__PURE__ */ new WeakMap();
i.styles = [
  d`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }

      uui-box {
        max-width: 800px;
      }

      h3 {
        margin-top: var(--uui-size-space-5);
      }

      p {
        line-height: 1.6;
      }
    `
];
l([
  m()
], i.prototype, "_counter", 2);
i = l([
  v("blueprint-dashboard")
], i);
const C = i;
export {
  i as BlueprintDashboardElement,
  C as default
};
//# sourceMappingURL=dashboard.element--L2h73vx.js.map
