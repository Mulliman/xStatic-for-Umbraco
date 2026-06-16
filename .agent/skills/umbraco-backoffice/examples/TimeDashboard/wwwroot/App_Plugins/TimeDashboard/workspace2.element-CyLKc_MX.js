import { UmbElementMixin as i } from "@umbraco-cms/backoffice/element-api";
import { LitElement as n, html as c, css as p, customElement as u } from "@umbraco-cms/backoffice/external/lit";
var d = Object.getOwnPropertyDescriptor, f = (o, s, l, m) => {
  for (var e = m > 1 ? void 0 : m ? d(s, l) : s, t = o.length - 1, a; t >= 0; t--)
    (a = o[t]) && (e = a(e) || e);
  return e;
};
let r = class extends i(n) {
  render() {
    return c`
            <umb-workspace-editor headline="Time Zone 2" alias="time.workspace2" .enforceNoFooter=${!0}>
            </umb-workspace-editor>
        `;
  }
};
r.styles = p`
        uui-box {
            display: block;
            margin: 20px;
        }
    `;
r = f([
  u("time-workspace2-root")
], r);
const w = r;
export {
  r as TimeWorkspace2Element,
  w as default
};
//# sourceMappingURL=workspace2.element-CyLKc_MX.js.map
