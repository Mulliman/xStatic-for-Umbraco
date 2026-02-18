import { UmbControllerBase as n } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as l } from "@umbraco-cms/backoffice/context-api";
import { UmbStringState as i, UmbBooleanState as c } from "@umbraco-cms/backoffice/observable-api";
import { c as r } from "./client.gen-DmQNfLcT.js";
class s {
  static getDate(t) {
    return (t?.client ?? r).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/timedashboard/api/v1/time/date",
      ...t
    });
  }
  static getTime(t) {
    return (t?.client ?? r).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/timedashboard/api/v1/time/time",
      ...t
    });
  }
  static getChildren(t) {
    return (t?.client ?? r).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/timedashboard/api/v1/tree",
      ...t
    });
  }
  static getRoot(t) {
    return (t?.client ?? r).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/timedashboard/api/v1/tree/root",
      ...t
    });
  }
}
class h {
  async getTime() {
    const { data: t, error: e } = await s.getTime();
    return e ? { error: new Error(String(e)) } : { data: t };
  }
  async getDate() {
    const { data: t, error: e } = await s.getDate();
    return e ? { error: new Error(String(e)) } : { data: t };
  }
}
class m extends n {
  #e;
  constructor(t) {
    super(t), this.#e = new h();
  }
  async getTime() {
    return this.#e.getTime();
  }
  async getDate() {
    return this.#e.getDate();
  }
}
class u extends n {
  constructor(t) {
    super(t), this.#a = new i("unknown"), this.time = this.#a.asObservable(), this.#i = new i("unknown"), this.date = this.#i.asObservable(), this.#t = null, this.#r = new c(!1), this.polling = this.#r.asObservable(), this.provideContext(g, this), this.#e = new m(this);
  }
  #e;
  #a;
  #i;
  #t;
  #r;
  async getTime() {
    const { data: t } = await this.#e.getTime();
    t && this.#a.setValue(t);
  }
  async getDate() {
    const { data: t } = await this.#e.getDate();
    t && this.#i.setValue(t);
  }
  async getDateAndTime() {
    await Promise.all([this.getTime(), this.getDate()]);
  }
  togglePolling() {
    const t = !this.#r.getValue();
    if (this.#r.setValue(t), t) {
      this.#t = setInterval(() => {
        this.getDateAndTime();
      }, 750);
      return;
    }
    this.#t !== null && (clearInterval(this.#t), this.#t = null);
  }
  destroy() {
    this.#t !== null && (clearInterval(this.#t), this.#t = null), this.#a.destroy(), this.#i.destroy(), this.#r.destroy(), super.destroy();
  }
}
const g = new l("TimeDashboard.Context.TimeManagement"), T = u;
export {
  g as TIME_MANAGEMENT_CONTEXT_TOKEN,
  u as TimeManagementContext,
  T as api,
  u as default
};
//# sourceMappingURL=time.context-BIJ1IR8X.js.map
