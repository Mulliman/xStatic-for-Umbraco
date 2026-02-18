const _ = {
  bodySerializer: (r) => JSON.stringify(
    r,
    (e, t) => typeof t == "bigint" ? t.toString() : t
  )
}, G = ({
  onRequest: r,
  onSseError: e,
  onSseEvent: t,
  responseTransformer: o,
  responseValidator: n,
  sseDefaultRetryDelay: l,
  sseMaxRetryAttempts: c,
  sseMaxRetryDelay: a,
  sseSleepFn: i,
  url: u,
  ...s
}) => {
  let d;
  const E = i ?? ((f) => new Promise((y) => setTimeout(y, f)));
  return { stream: async function* () {
    let f = l ?? 3e3, y = 0;
    const S = s.signal ?? new AbortController().signal;
    for (; !S.aborted; ) {
      y++;
      const x = s.headers instanceof Headers ? s.headers : new Headers(s.headers);
      d !== void 0 && x.set("Last-Event-ID", d);
      try {
        const j = {
          redirect: "follow",
          ...s,
          body: s.serializedBody,
          headers: x,
          signal: S
        };
        let m = new Request(u, j);
        r && (m = await r(u, j));
        const p = await (s.fetch ?? globalThis.fetch)(m);
        if (!p.ok)
          throw new Error(
            `SSE failed: ${p.status} ${p.statusText}`
          );
        if (!p.body) throw new Error("No body in SSE response");
        const w = p.body.pipeThrough(new TextDecoderStream()).getReader();
        let O = "";
        const $ = () => {
          try {
            w.cancel();
          } catch {
          }
        };
        S.addEventListener("abort", $);
        try {
          for (; ; ) {
            const { done: V, value: L } = await w.read();
            if (V) break;
            O += L;
            const k = O.split(`

`);
            O = k.pop() ?? "";
            for (const J of k) {
              const F = J.split(`
`), A = [];
              let I;
              for (const b of F)
                if (b.startsWith("data:"))
                  A.push(b.replace(/^data:\s*/, ""));
                else if (b.startsWith("event:"))
                  I = b.replace(/^event:\s*/, "");
                else if (b.startsWith("id:"))
                  d = b.replace(/^id:\s*/, "");
                else if (b.startsWith("retry:")) {
                  const D = Number.parseInt(
                    b.replace(/^retry:\s*/, ""),
                    10
                  );
                  Number.isNaN(D) || (f = D);
                }
              let z, B = !1;
              if (A.length) {
                const b = A.join(`
`);
                try {
                  z = JSON.parse(b), B = !0;
                } catch {
                  z = b;
                }
              }
              B && (n && await n(z), o && (z = await o(z))), t?.({
                data: z,
                event: I,
                id: d,
                retry: f
              }), A.length && (yield z);
            }
          }
        } finally {
          S.removeEventListener("abort", $), w.releaseLock();
        }
        break;
      } catch (j) {
        if (e?.(j), c !== void 0 && y >= c)
          break;
        const m = Math.min(
          f * 2 ** (y - 1),
          a ?? 3e4
        );
        await E(m);
      }
    }
  }() };
}, M = (r) => {
  switch (r) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, Q = (r) => {
  switch (r) {
    case "form":
      return ",";
    case "pipeDelimited":
      return "|";
    case "spaceDelimited":
      return "%20";
    default:
      return ",";
  }
}, K = (r) => {
  switch (r) {
    case "label":
      return ".";
    case "matrix":
      return ";";
    case "simple":
      return ",";
    default:
      return "&";
  }
}, U = ({
  allowReserved: r,
  explode: e,
  name: t,
  style: o,
  value: n
}) => {
  if (!e) {
    const a = (r ? n : n.map((i) => encodeURIComponent(i))).join(Q(o));
    switch (o) {
      case "label":
        return `.${a}`;
      case "matrix":
        return `;${t}=${a}`;
      case "simple":
        return a;
      default:
        return `${t}=${a}`;
    }
  }
  const l = M(o), c = n.map((a) => o === "label" || o === "simple" ? r ? a : encodeURIComponent(a) : C({
    allowReserved: r,
    name: t,
    value: a
  })).join(l);
  return o === "label" || o === "matrix" ? l + c : c;
}, C = ({
  allowReserved: r,
  name: e,
  value: t
}) => {
  if (t == null)
    return "";
  if (typeof t == "object")
    throw new Error(
      "Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these."
    );
  return `${e}=${r ? t : encodeURIComponent(t)}`;
}, v = ({
  allowReserved: r,
  explode: e,
  name: t,
  style: o,
  value: n,
  valueOnly: l
}) => {
  if (n instanceof Date)
    return l ? n.toISOString() : `${t}=${n.toISOString()}`;
  if (o !== "deepObject" && !e) {
    let i = [];
    Object.entries(n).forEach(([s, d]) => {
      i = [
        ...i,
        s,
        r ? d : encodeURIComponent(d)
      ];
    });
    const u = i.join(",");
    switch (o) {
      case "form":
        return `${t}=${u}`;
      case "label":
        return `.${u}`;
      case "matrix":
        return `;${t}=${u}`;
      default:
        return u;
    }
  }
  const c = K(o), a = Object.entries(n).map(
    ([i, u]) => C({
      allowReserved: r,
      name: o === "deepObject" ? `${t}[${i}]` : i,
      value: u
    })
  ).join(c);
  return o === "label" || o === "matrix" ? c + a : a;
}, X = /\{[^{}]+\}/g, Y = ({ path: r, url: e }) => {
  let t = e;
  const o = e.match(X);
  if (o)
    for (const n of o) {
      let l = !1, c = n.substring(1, n.length - 1), a = "simple";
      c.endsWith("*") && (l = !0, c = c.substring(0, c.length - 1)), c.startsWith(".") ? (c = c.substring(1), a = "label") : c.startsWith(";") && (c = c.substring(1), a = "matrix");
      const i = r[c];
      if (i == null)
        continue;
      if (Array.isArray(i)) {
        t = t.replace(
          n,
          U({ explode: l, name: c, style: a, value: i })
        );
        continue;
      }
      if (typeof i == "object") {
        t = t.replace(
          n,
          v({
            explode: l,
            name: c,
            style: a,
            value: i,
            valueOnly: !0
          })
        );
        continue;
      }
      if (a === "matrix") {
        t = t.replace(
          n,
          `;${C({
            name: c,
            value: i
          })}`
        );
        continue;
      }
      const u = encodeURIComponent(
        a === "label" ? `.${i}` : i
      );
      t = t.replace(n, u);
    }
  return t;
}, Z = ({
  baseUrl: r,
  path: e,
  query: t,
  querySerializer: o,
  url: n
}) => {
  const l = n.startsWith("/") ? n : `/${n}`;
  let c = (r ?? "") + l;
  e && (c = Y({ path: e, url: c }));
  let a = t ? o(t) : "";
  return a.startsWith("?") && (a = a.substring(1)), a && (c += `?${a}`), c;
};
function ee(r) {
  const e = r.body !== void 0;
  if (e && r.bodySerializer)
    return "serializedBody" in r ? r.serializedBody !== void 0 && r.serializedBody !== "" ? r.serializedBody : null : r.body !== "" ? r.body : null;
  if (e)
    return r.body;
}
const te = async (r, e) => {
  const t = typeof e == "function" ? await e(r) : e;
  if (t)
    return r.scheme === "bearer" ? `Bearer ${t}` : r.scheme === "basic" ? `Basic ${btoa(t)}` : t;
}, W = ({
  allowReserved: r,
  array: e,
  object: t
} = {}) => (n) => {
  const l = [];
  if (n && typeof n == "object")
    for (const c in n) {
      const a = n[c];
      if (a != null)
        if (Array.isArray(a)) {
          const i = U({
            allowReserved: r,
            explode: !0,
            name: c,
            style: "form",
            value: a,
            ...e
          });
          i && l.push(i);
        } else if (typeof a == "object") {
          const i = v({
            allowReserved: r,
            explode: !0,
            name: c,
            style: "deepObject",
            value: a,
            ...t
          });
          i && l.push(i);
        } else {
          const i = C({
            allowReserved: r,
            name: c,
            value: a
          });
          i && l.push(i);
        }
    }
  return l.join("&");
}, re = (r) => {
  if (!r)
    return "stream";
  const e = r.split(";")[0]?.trim();
  if (e) {
    if (e.startsWith("application/json") || e.endsWith("+json"))
      return "json";
    if (e === "multipart/form-data")
      return "formData";
    if (["application/", "audio/", "image/", "video/"].some(
      (t) => e.startsWith(t)
    ))
      return "blob";
    if (e.startsWith("text/"))
      return "text";
  }
}, se = (r, e) => e ? !!(r.headers.has(e) || r.query?.[e] || r.headers.get("Cookie")?.includes(`${e}=`)) : !1, ae = async ({
  security: r,
  ...e
}) => {
  for (const t of r) {
    if (se(e, t.name))
      continue;
    const o = await te(t, e.auth);
    if (!o)
      continue;
    const n = t.name ?? "Authorization";
    switch (t.in) {
      case "query":
        e.query || (e.query = {}), e.query[n] = o;
        break;
      case "cookie":
        e.headers.append("Cookie", `${n}=${o}`);
        break;
      case "header":
      default:
        e.headers.set(n, o);
        break;
    }
  }
}, N = (r) => Z({
  baseUrl: r.baseUrl,
  path: r.path,
  query: r.query,
  querySerializer: typeof r.querySerializer == "function" ? r.querySerializer : W(r.querySerializer),
  url: r.url
}), P = (r, e) => {
  const t = { ...r, ...e };
  return t.baseUrl?.endsWith("/") && (t.baseUrl = t.baseUrl.substring(0, t.baseUrl.length - 1)), t.headers = H(r.headers, e.headers), t;
}, ne = (r) => {
  const e = [];
  return r.forEach((t, o) => {
    e.push([o, t]);
  }), e;
}, H = (...r) => {
  const e = new Headers();
  for (const t of r) {
    if (!t)
      continue;
    const o = t instanceof Headers ? ne(t) : Object.entries(t);
    for (const [n, l] of o)
      if (l === null)
        e.delete(n);
      else if (Array.isArray(l))
        for (const c of l)
          e.append(n, c);
      else l !== void 0 && e.set(
        n,
        typeof l == "object" ? JSON.stringify(l) : l
      );
  }
  return e;
};
class T {
  constructor() {
    this.fns = [];
  }
  clear() {
    this.fns = [];
  }
  eject(e) {
    const t = this.getInterceptorIndex(e);
    this.fns[t] && (this.fns[t] = null);
  }
  exists(e) {
    const t = this.getInterceptorIndex(e);
    return !!this.fns[t];
  }
  getInterceptorIndex(e) {
    return typeof e == "number" ? this.fns[e] ? e : -1 : this.fns.indexOf(e);
  }
  update(e, t) {
    const o = this.getInterceptorIndex(e);
    return this.fns[o] ? (this.fns[o] = t, e) : !1;
  }
  use(e) {
    return this.fns.push(e), this.fns.length - 1;
  }
}
const ie = () => ({
  error: new T(),
  request: new T(),
  response: new T()
}), oe = W({
  allowReserved: !1,
  array: {
    explode: !0,
    style: "form"
  },
  object: {
    explode: !0,
    style: "deepObject"
  }
}), ce = {
  "Content-Type": "application/json"
}, R = (r = {}) => ({
  ..._,
  headers: ce,
  parseAs: "auto",
  querySerializer: oe,
  ...r
}), le = (r = {}) => {
  let e = P(R(), r);
  const t = () => ({ ...e }), o = (u) => (e = P(e, u), t()), n = ie(), l = async (u) => {
    const s = {
      ...e,
      ...u,
      fetch: u.fetch ?? e.fetch ?? globalThis.fetch,
      headers: H(e.headers, u.headers),
      serializedBody: void 0
    };
    s.security && await ae({
      ...s,
      security: s.security
    }), s.requestValidator && await s.requestValidator(s), s.body !== void 0 && s.bodySerializer && (s.serializedBody = s.bodySerializer(s.body)), (s.body === void 0 || s.serializedBody === "") && s.headers.delete("Content-Type");
    const d = N(s);
    return { opts: s, url: d };
  }, c = async (u) => {
    const { opts: s, url: d } = await l(u), E = {
      redirect: "follow",
      ...s,
      body: ee(s)
    };
    let g = new Request(d, E);
    for (const h of n.request.fns)
      h && (g = await h(g, s));
    const q = s.fetch;
    let f = await q(g);
    for (const h of n.response.fns)
      h && (f = await h(f, g, s));
    const y = {
      request: g,
      response: f
    };
    if (f.ok) {
      const h = (s.parseAs === "auto" ? re(f.headers.get("Content-Type")) : s.parseAs) ?? "json";
      if (f.status === 204 || f.headers.get("Content-Length") === "0") {
        let w;
        switch (h) {
          case "arrayBuffer":
          case "blob":
          case "text":
            w = await f[h]();
            break;
          case "formData":
            w = new FormData();
            break;
          case "stream":
            w = f.body;
            break;
          case "json":
          default:
            w = {};
            break;
        }
        return s.responseStyle === "data" ? w : {
          data: w,
          ...y
        };
      }
      let p;
      switch (h) {
        case "arrayBuffer":
        case "blob":
        case "formData":
        case "json":
        case "text":
          p = await f[h]();
          break;
        case "stream":
          return s.responseStyle === "data" ? f.body : {
            data: f.body,
            ...y
          };
      }
      return h === "json" && (s.responseValidator && await s.responseValidator(p), s.responseTransformer && (p = await s.responseTransformer(p))), s.responseStyle === "data" ? p : {
        data: p,
        ...y
      };
    }
    const S = await f.text();
    let x;
    try {
      x = JSON.parse(S);
    } catch {
    }
    const j = x ?? S;
    let m = j;
    for (const h of n.error.fns)
      h && (m = await h(j, f, g, s));
    if (m = m || {}, s.throwOnError)
      throw m;
    return s.responseStyle === "data" ? void 0 : {
      error: m,
      ...y
    };
  }, a = (u) => (s) => c({ ...s, method: u }), i = (u) => async (s) => {
    const { opts: d, url: E } = await l(s);
    return G({
      ...d,
      body: d.body,
      headers: d.headers,
      method: u,
      onRequest: async (g, q) => {
        let f = new Request(g, q);
        for (const y of n.request.fns)
          y && (f = await y(f, d));
        return f;
      },
      url: E
    });
  };
  return {
    buildUrl: N,
    connect: a("CONNECT"),
    delete: a("DELETE"),
    get: a("GET"),
    getConfig: t,
    head: a("HEAD"),
    interceptors: n,
    options: a("OPTIONS"),
    patch: a("PATCH"),
    post: a("POST"),
    put: a("PUT"),
    request: c,
    setConfig: o,
    sse: {
      connect: i("CONNECT"),
      delete: i("DELETE"),
      get: i("GET"),
      head: i("HEAD"),
      options: i("OPTIONS"),
      patch: i("PATCH"),
      post: i("POST"),
      put: i("PUT"),
      trace: i("TRACE")
    },
    trace: a("TRACE")
  };
}, fe = le(R({
  baseUrl: "https://localhost:44325"
}));
export {
  fe as c
};
//# sourceMappingURL=client.gen-DmQNfLcT.js.map
