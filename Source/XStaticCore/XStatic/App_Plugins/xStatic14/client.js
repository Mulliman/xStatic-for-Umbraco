/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const T = globalThis, I = T.ShadowRoot && (T.ShadyCSS === void 0 || T.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, V = Symbol(), W = /* @__PURE__ */ new WeakMap();
let st = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== V) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (I && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = W.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && W.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const at = (o) => new st(typeof o == "string" ? o : o + "", void 0, V), ct = (o, ...t) => {
  const e = o.length === 1 ? o[0] : t.reduce((s, i, n) => s + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + o[n + 1], o[0]);
  return new st(e, o, V);
}, dt = (o, t) => {
  if (I) o.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), i = T.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = e.cssText, o.appendChild(s);
  }
}, Z = I ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return at(e);
})(o) : o;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: pt, defineProperty: ut, getOwnPropertyDescriptor: $t, getOwnPropertyNames: ft, getOwnPropertySymbols: _t, getPrototypeOf: gt } = Object, _ = globalThis, q = _.trustedTypes, mt = q ? q.emptyScript : "", L = _.reactiveElementPolyfillSupport, w = (o, t) => o, N = { toAttribute(o, t) {
  switch (t) {
    case Boolean:
      o = o ? mt : null;
      break;
    case Object:
    case Array:
      o = o == null ? o : JSON.stringify(o);
  }
  return o;
}, fromAttribute(o, t) {
  let e = o;
  switch (t) {
    case Boolean:
      e = o !== null;
      break;
    case Number:
      e = o === null ? null : Number(o);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(o);
      } catch {
        e = null;
      }
  }
  return e;
} }, B = (o, t) => !pt(o, t), J = { attribute: !0, type: String, converter: N, reflect: !1, hasChanged: B };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), _.litPropertyMetadata ?? (_.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
class y extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = J) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(t, s, e);
      i !== void 0 && ut(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: i, set: n } = $t(this.prototype, t) ?? { get() {
      return this[e];
    }, set(r) {
      this[e] = r;
    } };
    return { get() {
      return i == null ? void 0 : i.call(this);
    }, set(r) {
      const l = i == null ? void 0 : i.call(this);
      n.call(this, r), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? J;
  }
  static _$Ei() {
    if (this.hasOwnProperty(w("elementProperties"))) return;
    const t = gt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(w("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(w("properties"))) {
      const e = this.properties, s = [...ft(e), ..._t(e)];
      for (const i of s) this.createProperty(i, e[i]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [s, i] of e) this.elementProperties.set(s, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, s] of this.elementProperties) {
      const i = this._$Eu(e, s);
      i !== void 0 && this._$Eh.set(i, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const i of s) e.unshift(Z(i));
    } else t !== void 0 && e.push(Z(t));
    return e;
  }
  static _$Eu(t, e) {
    const s = e.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const s of e.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return dt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var s;
      return (s = e.hostConnected) == null ? void 0 : s.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var s;
      return (s = e.hostDisconnected) == null ? void 0 : s.call(e);
    });
  }
  attributeChangedCallback(t, e, s) {
    this._$AK(t, s);
  }
  _$EC(t, e) {
    var n;
    const s = this.constructor.elementProperties.get(t), i = this.constructor._$Eu(t, s);
    if (i !== void 0 && s.reflect === !0) {
      const r = (((n = s.converter) == null ? void 0 : n.toAttribute) !== void 0 ? s.converter : N).toAttribute(e, s.type);
      this._$Em = t, r == null ? this.removeAttribute(i) : this.setAttribute(i, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var n;
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const r = s.getPropertyOptions(i), l = typeof r.converter == "function" ? { fromAttribute: r.converter } : ((n = r.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? r.converter : N;
      this._$Em = i, this[i] = l.fromAttribute(e, r.type), this._$Em = null;
    }
  }
  requestUpdate(t, e, s) {
    if (t !== void 0) {
      if (s ?? (s = this.constructor.getPropertyOptions(t)), !(s.hasChanged ?? B)(this[t], e)) return;
      this.P(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$ET());
  }
  P(t, e, s) {
    this._$AL.has(t) || this._$AL.set(t, e), s.reflect === !0 && this._$Em !== t && (this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Set())).add(t);
  }
  async _$ET() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, r] of this._$Ep) this[n] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [n, r] of i) r.wrapped !== !0 || this._$AL.has(n) || this[n] === void 0 || this.P(n, this[n], r);
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (s = this._$EO) == null || s.forEach((i) => {
        var n;
        return (n = i.hostUpdate) == null ? void 0 : n.call(i);
      }), this.update(e)) : this._$EU();
    } catch (i) {
      throw t = !1, this._$EU(), i;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((s) => {
      var i;
      return (i = s.hostUpdated) == null ? void 0 : i.call(s);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EU() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Ej && (this._$Ej = this._$Ej.forEach((e) => this._$EC(e, this[e]))), this._$EU();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
}
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[w("elementProperties")] = /* @__PURE__ */ new Map(), y[w("finalized")] = /* @__PURE__ */ new Map(), L == null || L({ ReactiveElement: y }), (_.reactiveElementVersions ?? (_.reactiveElementVersions = [])).push("2.0.4");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const P = globalThis, R = P.trustedTypes, K = R ? R.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, it = "$lit$", f = `lit$${Math.random().toFixed(9).slice(2)}$`, ot = "?" + f, At = `<${ot}>`, A = document, x = () => A.createComment(""), U = (o) => o === null || typeof o != "object" && typeof o != "function", rt = Array.isArray, yt = (o) => rt(o) || typeof (o == null ? void 0 : o[Symbol.iterator]) == "function", z = `[ 	
\f\r]`, S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Y = /-->/g, G = />/g, g = RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Q = /'/g, X = /"/g, nt = /^(?:script|style|textarea|title)$/i, vt = (o) => (t, ...e) => ({ _$litType$: o, strings: t, values: e }), bt = vt(1), v = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), tt = /* @__PURE__ */ new WeakMap(), m = A.createTreeWalker(A, 129);
function ht(o, t) {
  if (!Array.isArray(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return K !== void 0 ? K.createHTML(t) : t;
}
const Et = (o, t) => {
  const e = o.length - 1, s = [];
  let i, n = t === 2 ? "<svg>" : "", r = S;
  for (let l = 0; l < e; l++) {
    const h = o[l];
    let c, p, a = -1, u = 0;
    for (; u < h.length && (r.lastIndex = u, p = r.exec(h), p !== null); ) u = r.lastIndex, r === S ? p[1] === "!--" ? r = Y : p[1] !== void 0 ? r = G : p[2] !== void 0 ? (nt.test(p[2]) && (i = RegExp("</" + p[2], "g")), r = g) : p[3] !== void 0 && (r = g) : r === g ? p[0] === ">" ? (r = i ?? S, a = -1) : p[1] === void 0 ? a = -2 : (a = r.lastIndex - p[2].length, c = p[1], r = p[3] === void 0 ? g : p[3] === '"' ? X : Q) : r === X || r === Q ? r = g : r === Y || r === G ? r = S : (r = g, i = void 0);
    const $ = r === g && o[l + 1].startsWith("/>") ? " " : "";
    n += r === S ? h + At : a >= 0 ? (s.push(c), h.slice(0, a) + it + h.slice(a) + f + $) : h + f + (a === -2 ? l : $);
  }
  return [ht(o, n + (o[e] || "<?>") + (t === 2 ? "</svg>" : "")), s];
};
class M {
  constructor({ strings: t, _$litType$: e }, s) {
    let i;
    this.parts = [];
    let n = 0, r = 0;
    const l = t.length - 1, h = this.parts, [c, p] = Et(t, e);
    if (this.el = M.createElement(c, s), m.currentNode = this.el.content, e === 2) {
      const a = this.el.content.firstChild;
      a.replaceWith(...a.childNodes);
    }
    for (; (i = m.nextNode()) !== null && h.length < l; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const a of i.getAttributeNames()) if (a.endsWith(it)) {
          const u = p[r++], $ = i.getAttribute(a).split(f), O = /([.?@])?(.*)/.exec(u);
          h.push({ type: 1, index: n, name: O[2], strings: $, ctor: O[1] === "." ? wt : O[1] === "?" ? Pt : O[1] === "@" ? Ct : k }), i.removeAttribute(a);
        } else a.startsWith(f) && (h.push({ type: 6, index: n }), i.removeAttribute(a));
        if (nt.test(i.tagName)) {
          const a = i.textContent.split(f), u = a.length - 1;
          if (u > 0) {
            i.textContent = R ? R.emptyScript : "";
            for (let $ = 0; $ < u; $++) i.append(a[$], x()), m.nextNode(), h.push({ type: 2, index: ++n });
            i.append(a[u], x());
          }
        }
      } else if (i.nodeType === 8) if (i.data === ot) h.push({ type: 2, index: n });
      else {
        let a = -1;
        for (; (a = i.data.indexOf(f, a + 1)) !== -1; ) h.push({ type: 7, index: n }), a += f.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const s = A.createElement("template");
    return s.innerHTML = t, s;
  }
}
function b(o, t, e = o, s) {
  var r, l;
  if (t === v) return t;
  let i = s !== void 0 ? (r = e._$Co) == null ? void 0 : r[s] : e._$Cl;
  const n = U(t) ? void 0 : t._$litDirective$;
  return (i == null ? void 0 : i.constructor) !== n && ((l = i == null ? void 0 : i._$AO) == null || l.call(i, !1), n === void 0 ? i = void 0 : (i = new n(o), i._$AT(o, e, s)), s !== void 0 ? (e._$Co ?? (e._$Co = []))[s] = i : e._$Cl = i), i !== void 0 && (t = b(o, i._$AS(o, t.values), i, s)), t;
}
class St {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: s } = this._$AD, i = ((t == null ? void 0 : t.creationScope) ?? A).importNode(e, !0);
    m.currentNode = i;
    let n = m.nextNode(), r = 0, l = 0, h = s[0];
    for (; h !== void 0; ) {
      if (r === h.index) {
        let c;
        h.type === 2 ? c = new H(n, n.nextSibling, this, t) : h.type === 1 ? c = new h.ctor(n, h.name, h.strings, this, t) : h.type === 6 && (c = new xt(n, this, t)), this._$AV.push(c), h = s[++l];
      }
      r !== (h == null ? void 0 : h.index) && (n = m.nextNode(), r++);
    }
    return m.currentNode = A, i;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class H {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, s, i) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = i, this._$Cv = (i == null ? void 0 : i.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = b(this, t, e), U(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== v && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : yt(t) ? this.k(t) : this._(t);
  }
  S(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.S(t));
  }
  _(t) {
    this._$AH !== d && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(A.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var n;
    const { values: e, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = M.createElement(ht(s.h, s.h[0]), this.options)), s);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === i) this._$AH.p(e);
    else {
      const r = new St(i, this), l = r.u(this.options);
      r.p(e), this.T(l), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = tt.get(t.strings);
    return e === void 0 && tt.set(t.strings, e = new M(t)), e;
  }
  k(t) {
    rt(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, i = 0;
    for (const n of t) i === e.length ? e.push(s = new H(this.S(x()), this.S(x()), this, this.options)) : s = e[i], s._$AI(n), i++;
    i < e.length && (this._$AR(s && s._$AB.nextSibling, i), e.length = i);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, e); t && t !== this._$AB; ) {
      const i = t.nextSibling;
      t.remove(), t = i;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class k {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, i, n) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = t, this.name = e, this._$AM = i, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(t, e = this, s, i) {
    const n = this.strings;
    let r = !1;
    if (n === void 0) t = b(this, t, e, 0), r = !U(t) || t !== this._$AH && t !== v, r && (this._$AH = t);
    else {
      const l = t;
      let h, c;
      for (t = n[0], h = 0; h < n.length - 1; h++) c = b(this, l[s + h], e, h), c === v && (c = this._$AH[h]), r || (r = !U(c) || c !== this._$AH[h]), c === d ? t = d : t !== d && (t += (c ?? "") + n[h + 1]), this._$AH[h] = c;
    }
    r && !i && this.j(t);
  }
  j(t) {
    t === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class wt extends k {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === d ? void 0 : t;
  }
}
class Pt extends k {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== d);
  }
}
class Ct extends k {
  constructor(t, e, s, i, n) {
    super(t, e, s, i, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = b(this, t, e, 0) ?? d) === v) return;
    const s = this._$AH, i = t === d && s !== d || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, n = t !== d && (s === d || i);
    i && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class xt {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    b(this, t);
  }
}
const j = P.litHtmlPolyfillSupport;
j == null || j(M, H), (P.litHtmlVersions ?? (P.litHtmlVersions = [])).push("3.1.4");
const Ut = (o, t, e) => {
  const s = (e == null ? void 0 : e.renderBefore) ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const n = (e == null ? void 0 : e.renderBefore) ?? null;
    s._$litPart$ = i = new H(t.insertBefore(x(), n), n, void 0, e ?? {});
  }
  return i._$AI(o), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class C extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ut(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return v;
  }
}
var et;
C._$litElement$ = !0, C.finalized = !0, (et = globalThis.litElementHydrateSupport) == null || et.call(globalThis, { LitElement: C });
const D = globalThis.litElementPolyfillSupport;
D == null || D({ LitElement: C });
(globalThis.litElementVersions ?? (globalThis.litElementVersions = [])).push("4.0.6");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Mt = (o) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(o, t);
  }) : customElements.define(o, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ht = { attribute: !0, type: String, converter: N, reflect: !1, hasChanged: B }, Ot = (o = Ht, t, e) => {
  const { kind: s, metadata: i } = e;
  let n = globalThis.litPropertyMetadata.get(i);
  if (n === void 0 && globalThis.litPropertyMetadata.set(i, n = /* @__PURE__ */ new Map()), n.set(e.name, o), s === "accessor") {
    const { name: r } = e;
    return { set(l) {
      const h = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(r, h, o);
    }, init(l) {
      return l !== void 0 && this.P(r, void 0, o), l;
    } };
  }
  if (s === "setter") {
    const { name: r } = e;
    return function(l) {
      const h = this[r];
      t.call(this, l), this.requestUpdate(r, h, o);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function lt(o) {
  return (t, e) => typeof e == "object" ? Ot(o, t, e) : ((s, i, n) => {
    const r = i.hasOwnProperty(n);
    return i.constructor.createProperty(n, r ? { ...s, wrapped: !0 } : s), r ? Object.getOwnPropertyDescriptor(i, n) : void 0;
  })(o, t, e);
}
const Tt = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20aria-hidden='true'%20role='img'%20class='iconify%20iconify--logos'%20width='25.6'%20height='32'%20preserveAspectRatio='xMidYMid%20meet'%20viewBox='0%200%20256%20320'%3e%3cpath%20fill='%2300E8FF'%20d='m64%20192l25.926-44.727l38.233-19.114l63.974%2063.974l10.833%2061.754L192%20320l-64-64l-38.074-25.615z'%3e%3c/path%3e%3cpath%20fill='%23283198'%20d='M128%20256V128l64-64v128l-64%2064ZM0%20256l64%2064l9.202-60.602L64%20192l-37.542%2023.71L0%20256Z'%3e%3c/path%3e%3cpath%20fill='%23324FFF'%20d='M64%20192V64l64-64v128l-64%2064Zm128%20128V192l64-64v128l-64%2064ZM0%20256V128l64%2064l-64%2064Z'%3e%3c/path%3e%3cpath%20fill='%230FF'%20d='M64%20320V192l64%2064z'%3e%3c/path%3e%3c/svg%3e", Nt = "/App_Plugins/Client/vite.svg";
var Rt = Object.defineProperty, kt = Object.getOwnPropertyDescriptor, F = (o, t, e, s) => {
  for (var i = s > 1 ? void 0 : s ? kt(t, e) : t, n = o.length - 1, r; n >= 0; n--)
    (r = o[n]) && (i = (s ? r(t, e, i) : r(i)) || i);
  return s && i && Rt(t, e, i), i;
};
let E = class extends C {
  constructor() {
    super(...arguments), this.docsHint = "Click on the Vite and Lit logos to learn more", this.count = 0;
  }
  render() {
    return bt`
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src=${Nt} class="logo" alt="Vite logo" />
        </a>
        <a href="https://lit.dev" target="_blank">
          <img src=${Tt} class="logo lit" alt="Lit logo" />
        </a>
      </div>
      <slot></slot>
      <div class="card">
        <button @click=${this._onClick} part="button">
          count is ${this.count}
        </button>
      </div>
      <p class="read-the-docs">${this.docsHint}</p>
    `;
  }
  _onClick() {
    this.count++;
  }
};
E.styles = ct`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }

    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
      transition: filter 300ms;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.lit:hover {
      filter: drop-shadow(0 0 2em #325cffaa);
    }

    .card {
      padding: 2em;
    }

    .read-the-docs {
      color: #888;
    }

    ::slotted(h1) {
      font-size: 3.2em;
      line-height: 1.1;
    }

    a {
      font-weight: 500;
      color: #646cff;
      text-decoration: inherit;
    }
    a:hover {
      color: #535bf2;
    }

    button {
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0.6em 1.2em;
      font-size: 1em;
      font-weight: 500;
      font-family: inherit;
      background-color: #1a1a1a;
      cursor: pointer;
      transition: border-color 0.25s;
    }
    button:hover {
      border-color: #646cff;
    }
    button:focus,
    button:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }

    @media (prefers-color-scheme: light) {
      a:hover {
        color: #747bff;
      }
      button {
        background-color: #f9f9f9;
      }
    }
  `;
F([
  lt()
], E.prototype, "docsHint", 2);
F([
  lt({ type: Number })
], E.prototype, "count", 2);
E = F([
  Mt("my-element")
], E);
const zt = E;
export {
  E as MyElement,
  zt as default
};
//# sourceMappingURL=client.js.map
