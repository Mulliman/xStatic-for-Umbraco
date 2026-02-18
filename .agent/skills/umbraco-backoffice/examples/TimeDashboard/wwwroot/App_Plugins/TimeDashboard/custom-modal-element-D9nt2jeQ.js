import { html as v, state as _, customElement as b } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement as f } from "@umbraco-cms/backoffice/modal";
var C = Object.defineProperty, x = Object.getOwnPropertyDescriptor, c = (t) => {
  throw TypeError(t);
}, d = (t, e, a, i) => {
  for (var n = i > 1 ? void 0 : i ? x(e, a) : e, l = t.length - 1, s; l >= 0; l--)
    (s = t[l]) && (n = (i ? s(e, a, n) : s(n)) || n);
  return i && n && C(e, a, n), n;
}, y = (t, e, a) => e.has(t) || c("Cannot " + a), E = (t, e, a) => e.has(t) ? c("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, a), r = (t, e, a) => (y(t, e, "access private method"), a), o, h, m, p;
let u = class extends f {
  constructor() {
    super(), E(this, o), this.content = "";
  }
  connectedCallback() {
    super.connectedCallback(), this.updateValue({ content: this.data?.content });
  }
  render() {
    return v`
            <umb-body-layout .headline=${this.data?.headline ?? "Custom dialog"}>
                <uui-box>
                    <uui-textarea label="content"
                        rows=10
                        .value=${this.data?.content}
                        @input=${r(this, o, p)}>
                    </uui-textarea>
                </uui-box>
                <uui-box>
                    <h2>Return Value</h2>
                    <pre>${this.value?.content}</pre>
                </uui-box>

                <div slot="actions">
                        <uui-button id="cancel" label="Cancel" @click="${r(this, o, m)}">Cancel</uui-button>
                        <uui-button
                            id="submit"
                            color='positive'
                            look="primary"
                            label="Submit"
                            @click=${r(this, o, h)}></uui-button>
            </div>
            </umb-body-layout>
        `;
  }
};
o = /* @__PURE__ */ new WeakSet();
h = function() {
  this.value = { content: this.data?.content ?? "" }, this.modalContext?.submit();
};
m = function() {
  this.modalContext?.reject();
};
p = function(t) {
  this.updateValue({ content: t.target.value.toString() });
};
d([
  _()
], u.prototype, "content", 2);
u = d([
  b("time-custom-modal")
], u);
const M = u;
export {
  u as TimeCustomModalElement,
  M as default
};
//# sourceMappingURL=custom-modal-element-D9nt2jeQ.js.map
