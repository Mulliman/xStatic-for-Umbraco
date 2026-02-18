import { UmbControllerBase as e } from "@umbraco-cms/backoffice/class-api";
import { UmbNumberState as s } from "@umbraco-cms/backoffice/observable-api";
import { B as r } from "./context-token-ClgMrqlf.js";
class o extends e {
  constructor(t) {
    super(t), this.#t = new s(0), this.counter = this.#t.asObservable(), this.provideContext(r, this);
  }
  #t;
  increment() {
    this.#t.setValue(this.#t.value + 1);
  }
  reset() {
    this.#t.setValue(0);
  }
  destroy() {
    this.#t.destroy(), super.destroy();
  }
}
const m = o;
export {
  o as BlueprintCounterContext,
  m as api
};
//# sourceMappingURL=context-CQWPbpYh.js.map
