import { UMB_AUTH_CONTEXT as c } from "@umbraco-cms/backoffice/auth";
import { c as r } from "./client.gen-DmQNfLcT.js";
const d = (n, a) => {
  console.log("Time Dashboard extension loaded"), n.consumeContext(c, async (t) => {
    if (!t) return;
    const e = t.getOpenApiConfiguration();
    e && (r.setConfig({
      baseUrl: e.base ?? "",
      credentials: e.credentials ?? "same-origin"
    }), r.interceptors.request.use(async (i) => {
      const o = e.token;
      if (o) {
        const s = typeof o == "function" ? await o() : o;
        s && i.headers.set("Authorization", `Bearer ${s}`);
      }
      return i;
    }));
  });
}, g = (n, a) => {
  console.log("Time Dashboard extension unloaded");
};
export {
  d as onInit,
  g as onUnload
};
//# sourceMappingURL=entrypoint-CadrE5P6.js.map
