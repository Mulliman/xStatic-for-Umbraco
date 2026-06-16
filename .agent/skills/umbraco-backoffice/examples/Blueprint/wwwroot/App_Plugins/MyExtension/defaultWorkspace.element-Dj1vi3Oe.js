import { B as C } from "./context-token-ClgMrqlf.js";
import { UmbTextStyles as w } from "@umbraco-cms/backoffice/style";
import { html as k, css as x, state as y, customElement as E } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as W } from "@umbraco-cms/backoffice/lit-element";
var T = Object.defineProperty, O = Object.getOwnPropertyDescriptor, d = (t) => {
  throw TypeError(t);
}, f = (t, e, r, n) => {
  for (var s = n > 1 ? void 0 : n ? O(e, r) : e, c = t.length - 1, p; c >= 0; c--)
    (p = t[c]) && (s = (n ? p(e, r, s) : p(s)) || s);
  return n && s && T(e, r, s), s;
}, v = (t, e, r) => e.has(t) || d("Cannot " + r), a = (t, e, r) => (v(t, e, "read from private field"), r ? r.call(t) : e.get(t)), u = (t, e, r) => e.has(t) ? d("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), b = (t, e, r, n) => (v(t, e, "write to private field"), e.set(t, r), r), B = (t, e, r) => (v(t, e, "access private method"), r), i, l, m, h, _;
let o = class extends W {
  constructor() {
    super(), u(this, l), u(this, i), this._count = 0, u(this, h, () => {
      a(this, i)?.increment();
    }), u(this, _, () => {
      a(this, i)?.reset();
    }), this.consumeContext(C, (t) => {
      b(this, i, t), B(this, l, m).call(this);
    });
  }
  render() {
    return k`
			<uui-box class="uui-text">
				<h1 class="uui-h2">Counter Example</h1>
				<p class="uui-lead">Current count value: ${this._count}</p>
				<p>This workspace view consumes the Counter Context and displays the current count.</p>
				<div class="actions">
					<uui-button look="primary" @click=${a(this, h)}>Increment</uui-button>
					<uui-button look="secondary" @click=${a(this, _)}>Reset</uui-button>
				</div>
			</uui-box>
		`;
  }
};
i = /* @__PURE__ */ new WeakMap();
l = /* @__PURE__ */ new WeakSet();
m = function() {
  a(this, i) && this.observe(a(this, i).counter, (t) => {
    this._count = t;
  });
};
h = /* @__PURE__ */ new WeakMap();
_ = /* @__PURE__ */ new WeakMap();
o.styles = [
  w,
  x`
			:host {
				display: block;
				padding: var(--uui-size-layout-1);
			}
			.actions {
				display: flex;
				gap: var(--uui-size-space-3);
				margin-top: var(--uui-size-space-4);
			}
		`
];
f([
  y()
], o.prototype, "_count", 2);
o = f([
  E("blueprint-counter-workspace-view")
], o);
const U = o;
export {
  o as BlueprintCounterWorkspaceView,
  U as default
};
//# sourceMappingURL=defaultWorkspace.element-Dj1vi3Oe.js.map
