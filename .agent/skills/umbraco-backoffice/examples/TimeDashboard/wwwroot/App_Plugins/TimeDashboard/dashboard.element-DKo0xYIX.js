import { html as b, css as f, state as c, customElement as y } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as x } from "@umbraco-cms/backoffice/lit-element";
import { TIME_MANAGEMENT_CONTEXT_TOKEN as T } from "./time.context-BIJ1IR8X.js";
var w = Object.defineProperty, E = Object.getOwnPropertyDescriptor, v = (e) => {
  throw TypeError(e);
}, d = (e, t, i, r) => {
  for (var a = r > 1 ? void 0 : r ? E(t, i) : t, n = e.length - 1, p; n >= 0; n--)
    (p = e[n]) && (a = (r ? p(t, i, a) : p(a)) || a);
  return r && a && w(t, i, a), a;
}, g = (e, t, i) => t.has(e) || v("Cannot " + i), o = (e, t, i) => (g(e, t, "read from private field"), i ? i.call(e) : t.get(e)), h = (e, t, i) => t.has(e) ? v("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), P = (e, t, i, r) => (g(e, t, "write to private field"), t.set(e, i), i), l, _, m, u;
let s = class extends x {
  constructor() {
    super(), h(this, l), this._isPolling = !1, h(this, _, async () => {
      await o(this, l)?.getTime();
    }), h(this, m, async () => {
      await o(this, l)?.getDate();
    }), h(this, u, () => {
      o(this, l)?.togglePolling();
    }), this.consumeContext(T, (e) => {
      e && (P(this, l, e), e.getDateAndTime(), this.observe(e.time, (t) => {
        this._time = t;
      }), this.observe(e.date, (t) => {
        this._date = t;
      }), this.observe(e.polling, (t) => {
        this._isPolling = t;
      }));
    });
  }
  render() {
    return b`
            <uui-box headline="${this.localize.term("time_name")}">
                <div slot="header">
                    <umb-localize key="time_description"></umb-localize>
                </div>
                <div class="time-box">
                  <h2>${this._time}</h2>
                  <uui-button
                    .disabled=${this._isPolling}
                    @click=${o(this, _)} look="primary" color="positive" label="get time"></uui-button>
                </div>

                <div class="time-box">
                  <h2>${this._date}</h2>
                  <uui-button
                    .disabled=${this._isPolling}
                    @click=${o(this, m)} look="primary" color="default" label="get date"></uui-button>
                </div>

                <div>
                    <uui-toggle label="update"
                        .checked="${this._isPolling}"
                        @change=${o(this, u)}>automatically update</uui-toggle>
                </div>
            </uui-box>
        `;
  }
};
l = /* @__PURE__ */ new WeakMap();
_ = /* @__PURE__ */ new WeakMap();
m = /* @__PURE__ */ new WeakMap();
u = /* @__PURE__ */ new WeakMap();
s.styles = f`
        :host {
            display: block;
            padding: 20px;
        }

        .time-box {
            display: flex;
            margin-bottom: 10px;
            justify-content: space-between;
        }
    `;
d([
  c()
], s.prototype, "_time", 2);
d([
  c()
], s.prototype, "_date", 2);
d([
  c()
], s.prototype, "_isPolling", 2);
s = d([
  y("time-dashboard-element")
], s);
const D = s;
export {
  s as TimeDashboardElement,
  D as default
};
//# sourceMappingURL=dashboard.element-DKo0xYIX.js.map
