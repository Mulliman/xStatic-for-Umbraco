import { UmbElementMixin as l } from "@umbraco-cms/backoffice/element-api";
import { LitElement as m, html as u, state as c, customElement as b } from "@umbraco-cms/backoffice/external/lit";
import { UMB_PROPERTY_DATASET_CONTEXT as y } from "@umbraco-cms/backoffice/property";
var f = Object.defineProperty, h = Object.getOwnPropertyDescriptor, a = (r, t, s, o) => {
  for (var e = o > 1 ? void 0 : o ? h(t, s) : t, n = r.length - 1, p; n >= 0; n--)
    (p = r[n]) && (e = (o ? p(t, s, e) : p(e)) || e);
  return o && e && f(t, s, e), e;
};
let i = class extends l(m) {
  constructor() {
    super(), this.setting = "Hello", this.consumeContext(y, async (r) => {
      r && this.observe(
        await r.propertyValueByAlias("textProperty"),
        (t) => {
          console.log(t);
        },
        "observetextProperty"
      );
    });
  }
  render() {
    return u`
            <umb-body-layout header-transparent header-fit-height>
                <uui-box headline="settings view">

                    Something...

                    <umb-property
                        label="Icon picker"
                        description="pick an icon"
                        alias="setting"
                        property-editor-ui-alias="Umb.PropertyEditorUi.TextBox"></umb-property>

                        <pre>${this.setting}</pre>
                </uui-box>
            </umb-body-layout>
        `;
  }
};
a([
  c()
], i.prototype, "setting", 2);
i = a([
  b("time-workspace-settings-view")
], i);
const _ = i;
export {
  i as TimeSettingsWorkspaceElement,
  _ as default
};
//# sourceMappingURL=settingsWorkspace.element-BUTF5a5W.js.map
