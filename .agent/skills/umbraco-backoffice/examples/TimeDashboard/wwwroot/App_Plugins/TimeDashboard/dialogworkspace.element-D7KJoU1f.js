import { UMB_BLOCK_CATALOGUE_MODAL as c } from "@umbraco-cms/backoffice/block";
import { UmbElementMixin as d } from "@umbraco-cms/backoffice/element-api";
import { LitElement as p, html as u, css as b, state as m, customElement as h } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalToken as x, UMB_MODAL_MANAGER_CONTEXT as f, UMB_CONFIRM_MODAL as _ } from "@umbraco-cms/backoffice/modal";
const C = new x(
  "time.custom.modal",
  {
    modal: {
      type: "sidebar",
      size: "medium"
    }
  }
);
var y = Object.defineProperty, M = Object.getOwnPropertyDescriptor, r = (t, o, a, l) => {
  for (var e = l > 1 ? void 0 : l ? M(o, a) : o, i = t.length - 1, s; i >= 0; i--)
    (s = t[i]) && (e = (l ? s(o, a, e) : s(e)) || e);
  return l && e && y(o, a, e), e;
};
let n = class extends d(p) {
  constructor() {
    super(), this.icon = "", this.color = "", this.modal_names = [
      { name: "Block catalogue", value: c }
    ], this.consumeContext(f, (t) => {
      this._modalContext = t;
    });
  }
  async _OpenCustomModal() {
    const o = await this._modalContext?.open(this, C, {
      data: {
        headline: "A Custom modal",
        content: "Some content for the custom modal"
      }
    })?.onSubmit();
    o && console.log("data", o);
  }
  render() {
    return u`
            <umb-body-layout header-transparent header-fit-height>
                <uui-box headline="Dialog Examples">
                    <div>
                        <uui-button look="secondary"
                                    color="positive"
                                    label="custom dialog"
                                    @click=${this._OpenCustomModal}></uui-button>
                    </div>
                </uui-box>

                <uui-box>
                    ${this.render_modals()}
                </uui-box>

                <uui-box>
                    <uui-button
                        color="danger"
                        look="primary"
                        label="Confirm?" @click=${this.openConfirm}></uui-button>
                </uui-box>
            </umb-body-layout>
        `;
  }
  async openConfirm() {
    this._modalContext?.open(this, _, {
      data: {
        headline: "Are you sure",
        content: "Do you really want to do the thing here?",
        confirmLabel: "Confim",
        color: "danger"
      }
    })?.onSubmit().then(() => {
      console.log("confirm");
    }).catch(() => {
      console.log("cancel");
    });
  }
  async openModal(t) {
    const a = await this._modalContext?.open(this, t)?.onSubmit();
    console.log(a);
  }
  render_modals() {
    const t = this.modal_names.map((o) => u`
                <uui-button .label=${o.name}
                color="default" look="secondary"
                @click=${() => this.openModal(o.value)}></uui-button>
            `);
    return u`
            <div class="buttons">
                ${t}
            </div>
        `;
  }
};
n.styles = b`

        uui-icon {
            font-size: 25pt;
        }

        .picker {
            display: flex;
        }
        .buttons {
            display: flex;
            flex-wrap: wrap;
        }

        .buttons > uui-button {
            margin: 10px ;
        }

    `;
r([
  m()
], n.prototype, "icon", 2);
r([
  m()
], n.prototype, "color", 2);
n = r([
  h("dialog-examples-view")
], n);
const A = n;
export {
  n as TimeDialogExamplesElement,
  A as default
};
//# sourceMappingURL=dialogworkspace.element-D7KJoU1f.js.map
