import { UmbElementMixin as f } from "@umbraco-cms/backoffice/element-api";
import { LitElement as o, ifDefined as p, html as a, property as d, customElement as b } from "@umbraco-cms/backoffice/external/lit";
var h = Object.defineProperty, y = Object.getOwnPropertyDescriptor, u = (t, n, s, m) => {
  for (var e = m > 1 ? void 0 : m ? y(n, s) : n, r = t.length - 1, l; r >= 0; r--)
    (l = t[r]) && (e = (m ? l(n, s, e) : l(e)) || e);
  return m && e && h(n, s, e), e;
};
let i = class extends f(o) {
  render() {
    return a`
            <umb-menu-item-layout
                label=${this.manifest.meta.label || this.manifest.name}
                icon-name=${this.manifest.meta.icon}
                entity-type=${p(this.manifest.meta.entityType)}
                has-Children=${!0}>${this.renderChildren()}</umb-menu-item-layout>`;
  }
  renderChildren() {
    return a` <umb-extension-slot
            type="time-menu-item"
            .filter=${(t) => t.meta.menus.includes(this.manifest.alias)}
            default-element="umb-menu-item-default"></umb-extension-slot>`;
  }
};
u([
  d({ type: Object, attribute: !1 })
], i.prototype, "manifest", 2);
i = u([
  b("time-nested-menu-item")
], i);
const v = i;
export {
  i as NestedMenuItemElement,
  v as default
};
//# sourceMappingURL=nested-menu.element-BKrWPEgz.js.map
