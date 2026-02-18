import { B as d } from "./context-token-ClgMrqlf.js";
import { UmbTextStyles as w } from "@umbraco-cms/backoffice/style";
import { html as m, css as C, state as x, customElement as y } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as E } from "@umbraco-cms/backoffice/lit-element";
var T = Object.defineProperty, O = Object.getOwnPropertyDescriptor, l = (t) => {
  throw TypeError(t);
}, v = (t, e, r, o) => {
  for (var s = o > 1 ? void 0 : o ? O(e, r) : e, n = t.length - 1, p; n >= 0; n--)
    (p = t[n]) && (s = (o ? p(e, r, s) : p(s)) || s);
  return o && s && T(e, r, s), s;
}, c = (t, e, r) => e.has(t) || l("Cannot " + r), h = (t, e, r) => (c(t, e, "read from private field"), e.get(t)), _ = (t, e, r) => e.has(t) ? l("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), W = (t, e, r, o) => (c(t, e, "write to private field"), e.set(t, r), r), k = (t, e, r) => (c(t, e, "access private method"), r), a, u, f;
let i = class extends E {
  constructor() {
    super(), _(this, u), _(this, a), this._count = 0, this.consumeContext(d, (t) => {
      W(this, a, t), k(this, u, f).call(this);
    });
  }
  render() {
    return m`
			<uui-box class="uui-text">
				<h1 class="uui-h2">Another View</h1>
				<p class="uui-lead">Current count value: ${this._count}</p>
				<p>This is another workspace view that also consumes the Counter Context.</p>
			</uui-box>
		`;
  }
};
a = /* @__PURE__ */ new WeakMap();
u = /* @__PURE__ */ new WeakSet();
f = function() {
  h(this, a) && this.observe(h(this, a).counter, (t) => {
    this._count = t;
  });
};
i.styles = [
  w,
  C`
			:host {
				display: block;
				padding: var(--uui-size-layout-1);
			}
		`
];
v([
  x()
], i.prototype, "_count", 2);
i = v([
  y("blueprint-another-workspace-view")
], i);
const U = i;
export {
  i as BlueprintAnotherWorkspaceView,
  U as default
};
//# sourceMappingURL=anotherWorkspace.element-B92XJiC-.js.map
