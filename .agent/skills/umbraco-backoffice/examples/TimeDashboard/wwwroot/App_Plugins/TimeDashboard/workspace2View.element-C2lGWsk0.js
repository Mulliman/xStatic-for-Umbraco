import { UmbElementMixin as o } from "@umbraco-cms/backoffice/element-api";
import { LitElement as s, html as u, css as p, customElement as d } from "@umbraco-cms/backoffice/external/lit";
var f = Object.getOwnPropertyDescriptor, c = (r, a, l, n) => {
  for (var e = n > 1 ? void 0 : n ? f(a, l) : a, i = r.length - 1, m; i >= 0; i--)
    (m = r[i]) && (e = m(e) || e);
  return e;
};
let t = class extends o(s) {
  render() {
    return u`
            <umb-body-layout header-transparent header-fit-height>
                <uui-box headline="Child Item 2 View">
                    <p>This is a separate workspace view for Child Item 2.</p>
                    <p>It demonstrates how different menu items can navigate to different workspaces.</p>

                    <uui-box headline="Features">
                        <ul>
                            <li>Separate workspace from Child Item 1</li>
                            <li>Independent views and context</li>
                            <li>Different entity type routing</li>
                        </ul>
                    </uui-box>
                </uui-box>
            </umb-body-layout>
        `;
  }
};
t.styles = p`
        p {
            margin: 1rem 0;
        }
        ul {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
        }
        li {
            margin: 0.25rem 0;
        }
        uui-box {
            margin-top: 1rem;
        }
    `;
t = c([
  d("time-workspace2-view")
], t);
const b = t;
export {
  t as TimeWorkspace2ViewElement,
  b as default
};
//# sourceMappingURL=workspace2View.element-C2lGWsk0.js.map
