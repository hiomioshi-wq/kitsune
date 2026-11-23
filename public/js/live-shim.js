// Runs first inside every live page, which Kitsune serves in a sealed sandbox (no access to Kitsune or its data).
// It makes the page believe it is at its real address, relays its data requests through Kitsune, gives it
// in-memory storage, and keeps its links inside Kitsune's browser.
(() => {
  // Safety first: this page must be sealed (an opaque origin). If it somehow isn't, stop before any of its scripts run.
  if (self.origin !== "null") { try { window.stop(); } catch {} document.documentElement.innerHTML = "<p>This page could not be sealed, so Kitsune stopped it.</p>"; throw new Error("Kitsune live mode: not sandboxed"); }
  const me = document.currentScript;
  let REAL = me?.dataset.real || location.href;
  const TRACKERS_REMOVED = Number(me?.dataset.blocked || 0);
  const send = (m) => parent.postMessage(Object.assign({ __kb: 1 }, m), "*");
  const ours = location.origin;
  // What the page thinks of as "its own server" is the real site.
  const resolve = (u) => {
    let x;
    try { x = new URL(String(u), REAL); } catch { return String(u); }
    if (x.origin === ours && x.pathname.startsWith("/api/browse/x/")) { const p = x.pathname.split("/"), h = decodeURIComponent(p[5] || ""), plain = h.startsWith("_http_"); return `${plain ? "http" : "https"}://${plain ? h.slice(6) : h}/${p.slice(6).join("/")}${x.search}${x.hash}`; }
    if (x.origin === ours) { const r = new URL(REAL); x = new URL(x.pathname + x.search + x.hash, r.origin); }
    return x.href;
  };
  const local = (abs) => { const x = new URL(abs); return ours + x.pathname + x.search + x.hash; };

  // The address the page sees: the real path, query and fragment (only the host is Kitsune's).
  const realHistory = { push: history.pushState.bind(history), replace: history.replaceState.bind(history) };
  try { realHistory.replace(history.state, "", local(REAL)); } catch {}
  for (const [k, fn] of [["pushState", realHistory.push], ["replaceState", realHistory.replace]]) {
    history[k] = (st, title, url) => {
      if (url == null) return fn(st, title);
      REAL = resolve(url);
      try { fn(st, title, local(REAL)); } catch {}
      send({ type: "url", url: REAL });
    };
  }
  addEventListener("popstate", () => { const r = new URL(REAL); REAL = new URL(location.pathname + location.search + location.hash, r.origin).href; send({ type: "url", url: REAL }); });
  addEventListener("hashchange", () => { const r = new URL(REAL); r.hash = location.hash; REAL = r.href; send({ type: "url", url: REAL }); });

  // Storage and cookies: a sealed sandbox has none, so scripts get private, in-memory stand-ins.
  const saved = (() => { try { return me?.dataset.storage ? JSON.parse(decodeURIComponent(escape(atob(me.dataset.storage)))) : null; } catch { return null; } })();
  let lsTimer = 0;
  const persist = (m) => { clearTimeout(lsTimer); lsTimer = setTimeout(() => send({ type: "ls", data: Object.fromEntries(m) }), 400); };
  const mem = (keep) => { const m = new Map(keep ? Object.entries(keep) : []); const p = keep ? () => persist(m) : () => {}; return { getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null), setItem: (k, v) => { m.set(String(k), String(v)); p(); }, removeItem: (k) => { m.delete(String(k)); p(); }, clear: () => { m.clear(); p(); }, key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } }; };
  for (const k of ["localStorage", "sessionStorage"]) { let ok = true; try { window[k].length; } catch { ok = false; } if (!ok) try { Object.defineProperty(window, k, { value: mem(k === "localStorage" && saved ? saved : null), configurable: true }); } catch {} }
  window.Notification = class { constructor(title, o = {}) { send({ type: "gm-notify", title: String(title || ""), text: String(o.body || "") }); } close() {} static get permission() { return "granted"; } static requestPermission(cb) { cb && cb("granted"); return Promise.resolve("granted"); } };
  // Cookies: the ones you allowed for this site (if any), and any the page sets go back to Kitsune to keep.
  let jar = me?.dataset.cookie || "", cookieOk = true; try { void document.cookie; } catch { cookieOk = false; }
  if (!cookieOk) try { Object.defineProperty(document, "cookie", { configurable: true, get: () => jar, set: (v) => { const kv = String(v).split(";")[0].trim(), name = kv.split("=")[0]; jar = [...(jar ? jar.split("; ").filter((p) => p.split("=")[0] !== name) : []), kv].join("; "); send({ type: "setcookie", raw: String(v).slice(0, 4096), host: new URL(REAL).hostname }); } }); } catch {}
  if (me?.dataset.setcookies) try { send({ type: "cookies", list: JSON.parse(atob(me.dataset.setcookies)) }); } catch {}
  try { Object.defineProperty(navigator, "serviceWorker", { value: undefined, configurable: true }); } catch {}

  // Data requests go out through Kitsune (GET, HEAD and small POSTs, never with cookies).
  let seq = 0; const waits = new Map();
  addEventListener("message", (e) => { const d = e.data; if (!d || !d.__kbr || e.source !== parent) return; const w = waits.get(d.id); if (!w) return; waits.delete(d.id); d.error ? w.reject(new TypeError(d.error)) : w.resolve(d); });
  const bridge = (url, method, body, ctype, headers) => new Promise((ok, no) => { const id = ++seq; waits.set(id, { resolve: ok, reject: no }); send({ type: "fetch", id, url, method, body, ctype, headers: headers && Object.keys(headers).length ? headers : undefined }, body ? [body] : undefined); });
  const realFetch = window.fetch.bind(window);
  // Requests to other sites that allow it (CORS) go straight there: faster, and no size limit. The page's own site and trackers go through Kitsune.
  const DIRECT = new Map(), TRK = (() => { try { return new RegExp(me?.dataset.trk || "^$"); } catch { return /^$/; } })();
  const siteOf = (h) => h.split(".").slice(-2).join(".");
  const directOk = (u) => { try { const x = new URL(u); return x.protocol === "https:" && siteOf(x.hostname) !== siteOf(new URL(REAL).hostname) && !TRK.test(x.hostname) && DIRECT.get(x.host) !== false; } catch { return false; } };
  window.fetch = async (input, init = {}) => {
    const req = typeof Request !== "undefined" && input instanceof Request ? input : null;
    const raw = req ? req.url : String(input instanceof URL ? input.href : input);
    if (/^(data|blob):/.test(raw)) return realFetch(input, init);
    const url = resolve(raw), method = String(init.method || (req && req.method) || "GET").toUpperCase();
    let body = null, ctype = "";
    if (method !== "GET" && method !== "HEAD") {
      const src = init.body !== undefined ? init.body : req ? await req.clone().arrayBuffer() : null;
      if (src != null) { const tmp = new Response(src); body = await tmp.arrayBuffer(); ctype = tmp.headers.get("content-type") || ""; }
      ctype = new Headers(init.headers || (req && req.headers) || {}).get("content-type") || ctype;
    }
    const hdrs = {}; try { new Headers(init.headers || (req && req.headers) || {}).forEach((v, k) => (hdrs[k] = v)); } catch {}
    if ((method === "GET" || method === "HEAD") && directOk(url)) {
      try { const r = await realFetch(url, { method, headers: hdrs, signal: init.signal || (req && req.signal), credentials: "omit", mode: "cors", cache: init.cache || "default", redirect: "follow" }); DIRECT.set(new URL(url).host, true); return r; }
      catch (e) { if (e && e.name === "AbortError") throw e; DIRECT.set(new URL(url).host, false); }
    }
    const sig = init.signal || (req && req.signal);
    if (sig?.aborted) throw sig.reason ?? new DOMException("The operation was aborted.", "AbortError");
    const d = await (sig ? Promise.race([bridge(url, method, body, ctype, hdrs), new Promise((_, no) => sig.addEventListener("abort", () => no(sig.reason ?? new DOMException("The operation was aborted.", "AbortError")), { once: true }))]) : bridge(url, method, body, ctype, hdrs));
    const empty = method === "HEAD" || [101, 204, 205, 304].includes(d.status);
    const res = new Response(empty ? null : d.body, { status: d.status, statusText: d.statusText || "", headers: d.headers });
    try { Object.defineProperty(res, "url", { value: url }); } catch {}
    return res;
  };
  class KX {
    constructor() { Object.assign(this, { readyState: 0, status: 0, statusText: "", responseText: "", response: null, responseType: "", responseURL: "", withCredentials: false, timeout: 0, _ls: {}, _rq: {}, upload: { addEventListener() {}, removeEventListener() {} } }); }
    open(m, u) { this._m = String(m).toUpperCase(); this._u = resolve(u); this.readyState = 1; this._fire("readystatechange"); }
    setRequestHeader(k, v) { this._rq[String(k).toLowerCase()] = String(v); }
    overrideMimeType() {}
    abort() { this._aborted = true; this._fire("abort"); }
    addEventListener(t, f) { (this._ls[t] ||= []).push(f); }
    removeEventListener(t, f) { this._ls[t] = (this._ls[t] || []).filter((x) => x !== f); }
    _fire(t) { const ev = { type: t, target: this, currentTarget: this, loaded: 0, total: 0, lengthComputable: false }; try { this["on" + t] && this["on" + t](ev); } catch (e) { setTimeout(() => { throw e; }); } (this._ls[t] || []).forEach((f) => { try { f.call(this, ev); } catch (e) { setTimeout(() => { throw e; }); } }); }
    getResponseHeader(n) { return (this._rh || {})[String(n).toLowerCase()] ?? null; }
    getAllResponseHeaders() { return Object.entries(this._rh || {}).map(([k, v]) => k + ": " + v).join("\r\n"); }
    async send(data) {
      let body = null, ctype = this._rq["content-type"] || "";
      if (data != null && !/^(GET|HEAD)$/.test(this._m)) { const tmp = new Response(data); body = await tmp.arrayBuffer(); ctype = ctype || tmp.headers.get("content-type") || ""; }
      this._fire("loadstart");
      if (this.timeout > 0) setTimeout(() => { if (this.readyState !== 4 && !this._aborted) { this._aborted = true; this.readyState = 4; this._fire("readystatechange"); this._fire("timeout"); this._fire("loadend"); } }, this.timeout);
      bridge(this._u, this._m, body, ctype, this._rq).then((d) => {
        if (this._aborted) return;
        const n = d.body ? d.body.byteLength : 0, ct = String((d.headers || {})["content-type"] || "");
        const text = new TextDecoder().decode(d.body || new ArrayBuffer(0)), t = this.responseType;
        Object.assign(this, { status: d.status, statusText: d.statusText || "", _rh: d.headers || {}, responseText: t === "" || t === "text" ? text : "", responseURL: this._u });
        this.response = t === "json" ? (() => { try { return JSON.parse(text); } catch { return null; } })() : t === "arraybuffer" ? d.body : t === "blob" ? new Blob([d.body], { type: (d.headers || {})["content-type"] || "" }) : t === "document" ? new DOMParser().parseFromString(text, "text/html") : text;
        this.responseXML = t === "document" ? this.response : (t === "" || t === "text") && /xml/.test(ct) ? (() => { try { return new DOMParser().parseFromString(text, /html/.test(ct) ? "text/html" : "application/xml"); } catch { return null; } })() : null;
        this.readyState = 2; this._fire("readystatechange"); this.readyState = 3; this._fire("readystatechange");
        try { const ev = { type: "progress", target: this, loaded: n, total: n, lengthComputable: true }; this.onprogress && this.onprogress(ev); (this._ls.progress || []).forEach((f) => f.call(this, ev)); } catch {}
        this.readyState = 4; this._fire("readystatechange"); this._fire("load"); this._fire("loadend");
      }, () => { this.readyState = 4; this._fire("readystatechange"); this._fire("error"); this._fire("loadend"); });
    }
  }
  Object.assign(KX, { UNSENT: 0, OPENED: 1, HEADERS_RECEIVED: 2, LOADING: 3, DONE: 4 });
  window.XMLHttpRequest = KX;
  try { window.sendBeacon = () => true; navigator.sendBeacon = () => true; } catch {}

  // Links, forms and pop-ups stay inside Kitsune's browser; the page's own handlers get the first say.
  addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button > 1) return;
    const a = e.composedPath().find((n) => n && n.tagName === "A" && n.hasAttribute("href")); if (!a) return;
    const h = a.getAttribute("href"); if (/^\s*javascript:/i.test(h)) return;
    e.preventDefault();
    if (h.startsWith("#")) { const id = decodeURIComponent(h.slice(1)); (document.getElementById(id) || document.getElementsByName(id)[0])?.scrollIntoView(); return; }
    send({ type: "nav", url: resolve(a.href), newTab: e.metaKey || e.ctrlKey || e.button === 1 || a.target === "_blank" });
  });
  addEventListener("submit", (e) => {
    if (e.defaultPrevented) return; e.preventDefault();
    const f = e.target;
    if ((f.getAttribute("method") || "get").toLowerCase() !== "get") {
      const fd = new FormData(f, e.submitter || undefined), multi = /multipart/i.test(f.enctype || "");
      const res = multi ? new Response(fd) : new Response(new URLSearchParams([...fd].filter(([, v]) => typeof v === "string")));
      res.arrayBuffer().then((body) => send({ type: "postnav", url: resolve(f.getAttribute("action") || REAL), ctype: res.headers.get("content-type") || "application/x-www-form-urlencoded", body }));
      return;
    }
    const u = new URL(resolve(f.getAttribute("action") || REAL)); u.search = new URLSearchParams([...new FormData(f, e.submitter || undefined)].filter(([, v]) => typeof v === "string")).toString();
    send({ type: "nav", url: u.href });
  });
  window.open = (u) => { if (u) send({ type: "nav", url: resolve(u), newTab: true }); return null; };

  // ---------- compatibility ----------
  const RELAY = me?.dataset.relay || "";
  // Navigations by script (location.href = …, form.submit(), location.assign) go through Kitsune, not out of the sandbox.
  if (window.navigation && navigation.addEventListener) navigation.addEventListener("navigate", (e) => {
    if (e.hashChange || e.downloadRequest != null || !e.cancelable) return;
    let dest; try { dest = new URL(e.destination.url); } catch { return; }
    if (e.destination.sameDocument) return; // pushState and friends are handled above
    if (dest.href.startsWith(location.origin + "/api/browse/")) return;
    e.preventDefault();
    send({ type: "nav", url: dest.origin === location.origin ? resolve(dest.pathname + dest.search + dest.hash) : dest.href });
  });
  // Back and forward inside a page use Kitsune's history.
  history.back = () => send({ type: "hist", dir: -1 });
  history.forward = () => send({ type: "hist", dir: 1 });
  history.go = (n) => send({ type: "hist", dir: Math.sign(+n || 0) });
  // Storage APIs a sealed page doesn't have: they fail politely (asynchronously), the way apps expect, instead of crashing.
  const failReq = () => { const req = { result: undefined, error: new DOMException("Storage is not available here", "SecurityError"), readyState: "done", onerror: null, onsuccess: null, onupgradeneeded: null, onblocked: null, addEventListener(t, f) { (this["_" + t] ||= []).push(f); }, removeEventListener() {} };
    setTimeout(() => { const ev = { type: "error", target: req, preventDefault() {}, stopPropagation() {} }; req.onerror && req.onerror(ev); (req._error || []).forEach((f) => f(ev)); }); return req; };
  try { indexedDB.open("__kb_probe").onsuccess = (e) => { try { e.target.result.close(); indexedDB.deleteDatabase("__kb_probe"); } catch {} }; } catch { try { Object.defineProperty(window, "indexedDB", { value: { open: failReq, deleteDatabase: failReq, databases: async () => [], cmp: (a, b) => (a < b ? -1 : a > b ? 1 : 0) }, configurable: true }); } catch {} }
  try { void window.caches.keys; } catch { try { const none = { match: async () => undefined, matchAll: async () => [], add: async () => {}, addAll: async () => {}, put: async () => {}, delete: async () => false, keys: async () => [] }; Object.defineProperty(window, "caches", { value: { open: async () => none, match: async () => undefined, has: async () => false, delete: async () => false, keys: async () => [] }, configurable: true }); } catch {} }
  try { navigator.storage && Object.assign(navigator.storage, { estimate: async () => ({ quota: 50e6, usage: 0 }), persist: async () => false, persisted: async () => false }); } catch {}
  document.hasStorageAccess = async () => true; document.requestStorageAccess = async () => {};
  // Clipboard and sharing go through Kitsune.
  try { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (t) => send({ type: "gm-clip", text: String(t) }), write: async () => {}, readText: async () => "", read: async () => [] } }); } catch {}
  navigator.share = async (d = {}) => send({ type: "share", title: String(d.title || ""), text: String(d.text || ""), url: d.url ? resolve(d.url) : REAL });
  navigator.canShare = () => true;
  try { navigator.geolocation && (navigator.geolocation.getCurrentPosition = (ok, no) => no && no({ code: 1, message: "Location isn't shared with pages in Kitsune." })); } catch {}
  // Web Workers must come from the page's own address, which a sealed page doesn't have: repackage them.
  const RealWorker = window.Worker;
  if (RealWorker) window.Worker = function (url, opts = {}) {
    const abs = resolve(String(url));
    if (/^(blob|data):/.test(String(url))) return new RealWorker(url, opts);
    const src = opts.type === "module"
      ? `import ${JSON.stringify(RELAY && abs.startsWith(new URL(REAL).origin) ? RELAY + abs.slice(new URL(REAL).origin.length) : abs)};`
      : `const __kbBase = ${JSON.stringify(abs)}; const __is = self.importScripts.bind(self); self.importScripts = (...u) => __is(...u.map((x) => new URL(x, __kbBase).href)); __is(__kbBase);`;
    return new RealWorker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })), opts);
  };
  // Download links become files you can keep in Kitsune.
  addEventListener("click", (e) => { const a = e.composedPath().find((n) => n && n.tagName === "A" && n.hasAttribute("download")); if (a && /^https?:/.test(a.href)) { e.preventDefault(); e.stopImmediatePropagation(); send({ type: "nav", url: resolve(a.href), newTab: true }); } }, true);
  // Service workers can't run in a sealed page: registration fails politely instead of throwing on access.
  try { void navigator.serviceWorker; } catch { try { Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register: () => Promise.reject(new DOMException("Service workers aren't available here", "SecurityError")), getRegistration: async () => undefined, getRegistrations: async () => [], ready: new Promise(() => {}), controller: null, addEventListener() {}, removeEventListener() {} } }); } catch {} }
  // Permission checks answer "prompt" rather than throwing; wake locks and orientation locks are harmless no-ops when refused.
  try { if (navigator.permissions?.query) { const q = navigator.permissions.query.bind(navigator.permissions); navigator.permissions.query = (d) => q(d).catch(() => ({ state: "prompt", name: d?.name, onchange: null, addEventListener() {}, removeEventListener() {} })); } } catch {}
  try { if (navigator.wakeLock) { const w = navigator.wakeLock.request.bind(navigator.wakeLock); navigator.wakeLock.request = (t) => w(t).catch(() => ({ released: false, type: "screen", release: async () => {}, addEventListener() {}, removeEventListener() {} })); } } catch {}
  try { if (screen.orientation?.lock) { const l = screen.orientation.lock.bind(screen.orientation); screen.orientation.lock = (o) => l(o).catch(() => {}); } } catch {}
  if (!window.requestIdleCallback) { window.requestIdleCallback = (f) => setTimeout(() => f({ didTimeout: false, timeRemaining: () => 8 }), 1); window.cancelIdleCallback = clearTimeout; }
  // Analytics beacons go nowhere.
  try { navigator.sendBeacon = () => true; } catch {}
  // Live connections (WebSocket, server-sent events) go to the real site, not Kitsune.
  const RealWS = window.WebSocket;
  if (RealWS) { const WS = function (url, protocols) { let u = String(url); try { const x = new URL(u, REAL.replace(/^http/, "ws")); if (x.host === location.host) { const r = new URL(REAL); x.host = r.host; x.protocol = r.protocol === "https:" ? "wss:" : "ws:"; } u = x.href; } catch {} return protocols === undefined ? new RealWS(u) : new RealWS(u, protocols); }; WS.prototype = RealWS.prototype; Object.assign(WS, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 }); window.WebSocket = WS; }
  const RealES = window.EventSource;
  if (RealES) { const ES = function (url, o) { return new RealES(resolve(String(url)), o); }; ES.prototype = RealES.prototype; Object.assign(ES, { CONNECTING: 0, OPEN: 1, CLOSED: 2 }); window.EventSource = ES; }
  // Frames inside this page that run live too: their requests and link clicks are passed up to Kitsune, and answers brought back.
  const FWD = new Map(); let fwdN = 0;
  addEventListener("message", (e) => {
    const d = e.data; if (!d || !e.source || e.source === window) return;
    if (d.__kb && e.source !== parent && (d.type === "fetch" || d.type === "nav")) {
      if (d.type === "nav") return send({ type: "nav", url: String(d.url || ""), newTab: !!d.newTab });
      const id = "f" + ++fwdN; FWD.set(id, { src: e.source, id: d.id });
      try { parent.postMessage({ ...d, id }, "*", d.body ? [d.body] : []); } catch { parent.postMessage({ ...d, id }, "*"); }
    } else if (d.__kbr && e.source === parent && FWD.has(d.id)) {
      const f = FWD.get(d.id); FWD.delete(d.id);
      try { f.src.postMessage({ ...d, id: f.id }, "*", d.body ? [d.body] : []); } catch {}
    }
  });
  // window.open hands back a stand-in window, so "open, then set its address" works too.
  window.open = (u) => {
    const go = (v) => { if (v) send({ type: "nav", url: resolve(String(v)), newTab: true }); };
    go(u);
    const loc = { assign: go, replace: go, reload() {}, toString: () => "about:blank" };
    Object.defineProperty(loc, "href", { get: () => "about:blank", set: go });
    const w = { closed: false, opener: window, name: "", close() { this.closed = true; }, focus() {}, blur() {}, postMessage() {}, addEventListener() {}, removeEventListener() {}, document: { write() {}, writeln() {}, open() { return this; }, close() {}, body: null, title: "" } };
    Object.defineProperty(w, "location", { get: () => loc, set: go });
    return w;
  };
  // Stylesheets and module scripts that scripts add later (code-split CSS, lazy modules) come from the page's own site
  // through Kitsune's relay, so their fonts and imports load. Fonts made with new FontFace() too.
  const viaRelay = (u) => { if (!RELAY) return null; try { const x = new URL(u, REAL), r = new URL(REAL); return x.origin === r.origin ? RELAY + x.pathname + x.search : null; } catch { return null; } };
  const fixLink = (el) => { if (el.__kb || !/stylesheet|modulepreload/i.test(el.rel || "")) return; const h = el.getAttribute("href"), v = h && viaRelay(h); if (v) { el.__kb = 1; el.href = v; } };
  try { new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType !== 1) continue; if (n.tagName === "LINK") fixLink(n); else if (n.firstElementChild) n.querySelectorAll("link[rel]").forEach(fixLink); } }).observe(document, { childList: true, subtree: true }); } catch {}
  try {
    const d = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
    Object.defineProperty(HTMLScriptElement.prototype, "src", { configurable: true, enumerable: d.enumerable, get() { return d.get.call(this); }, set(v) { d.set.call(this, (this.type === "module" && viaRelay(String(v))) || v); } });
  } catch {}
  if (window.FontFace) { const RF = window.FontFace; const FF = function (fam, src, desc) { if (typeof src === "string") src = src.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => { const v = viaRelay(u); return v ? `url("${v}")` : m; }); return new RF(fam, src, desc); }; FF.prototype = RF.prototype; window.FontFace = FF; }

  // ---------- userscripts: the Greasemonkey / Tampermonkey API ----------
  const menus = {};
  window.__kbRun = (when, name, fn) => {
    const go = () => { try { fn(); } catch (e) { send({ type: "jserror", msg: "[" + name + "] " + String(e && e.message || e).slice(0, 200) }); } };
    if (when === "now") return go();
    if (when === "ready") return document.readyState === "loading" ? addEventListener("DOMContentLoaded", go, { once: true }) : go();
    const idle = () => setTimeout(go, 0);
    document.readyState === "complete" ? idle() : addEventListener("load", idle, { once: true });
  };
  window.__kbGM = (id, info, vals) => {
    vals = vals || {};
    const listeners = {};
    const set = (k, v) => { const old = vals[k]; vals[k] = v; send({ type: "gm-set", id, key: String(k), value: v === undefined ? null : JSON.parse(JSON.stringify(v)), del: v === undefined }); (listeners[k] || []).forEach((f) => { try { f(k, old, v, false); } catch {} }); };
    const xhr = (d) => {
      let aborted = false;
      const method = String(d.method || "GET").toUpperCase(), url = resolve(d.url);
      let body = null, ctype = "";
      const hdrs = d.headers || {}; for (const k in hdrs) if (k.toLowerCase() === "content-type") ctype = hdrs[k];
      const start = async () => {
        if (d.data != null && method !== "GET" && method !== "HEAD") { const tmp = new Response(d.data); body = await tmp.arrayBuffer(); ctype = ctype || tmp.headers.get("content-type") || ""; }
        return bridge(url, method, body, ctype, hdrs);
      };
      const p = start().then((r) => {
        if (aborted) return;
        const text = new TextDecoder().decode(r.body || new ArrayBuffer(0)), t = d.responseType;
        const resp = { status: r.status, statusText: r.statusText || "", readyState: 4, finalUrl: url, responseHeaders: Object.entries(r.headers || {}).map(([k, v]) => k + ": " + v).join("\r\n"), responseText: text, context: d.context,
          response: t === "json" ? (() => { try { return JSON.parse(text); } catch { return null; } })() : t === "arraybuffer" ? r.body : t === "blob" ? new Blob([r.body]) : t === "document" ? new DOMParser().parseFromString(text, "text/html") : text };
        d.onreadystatechange && d.onreadystatechange(resp); d.onload && d.onload(resp); d.onloadend && d.onloadend(resp);
        return resp;
      }, (e) => { if (!aborted) { const resp = { status: 0, statusText: String(e && e.message || "error"), readyState: 4, context: d.context }; d.onerror && d.onerror(resp); d.onloadend && d.onloadend(resp); } throw e; });
      if (d.timeout) setTimeout(() => { if (!aborted) { aborted = true; d.ontimeout && d.ontimeout({}); } }, d.timeout);
      return { abort: () => { aborted = true; d.onabort && d.onabort({}); }, then: (a, b) => p.then(a, b) };
    };
    const addStyle = (css) => { const s = document.createElement("style"); s.textContent = String(css); (document.head || document.documentElement).append(s); return s; };
    const api = {
      info, getValueSync: (k, def) => (k in vals ? vals[k] : def), setValueSync: set, deleteValueSync: (k) => set(k, undefined), listValuesSync: () => Object.keys(vals),
      addStyle, notify: (a, b) => { const o = typeof a === "object" ? a : { text: a, title: b }; send({ type: "gm-notify", text: String(o.text || ""), title: String(o.title || info.script.name || "") }); },
      openInTab: (u) => { send({ type: "nav", url: resolve(u), newTab: true }); return { close() {} }; },
      setClipboard: (t) => send({ type: "gm-clip", text: String(t) }),
      registerMenuCommand: (label, fn) => { const k = id + ":" + label; menus[k] = fn; send({ type: "gm-menu", id, label: String(label), name: info.script.name }); return k; },
      unregisterMenuCommand: (k) => { delete menus[k]; send({ type: "gm-menu-remove", key: k }); },
      getResourceText: () => null, getResourceURL: () => null,
      addElement: (parent, tag, attrs) => { if (typeof parent === "string") { attrs = tag; tag = parent; parent = document.head || document.body; } const el = document.createElement(tag); Object.assign(el, attrs || {}); parent.append(el); return el; },
      download: (d) => send({ type: "nav", url: resolve(typeof d === "string" ? d : d.url), newTab: true }),
      addValueChangeListener: (k, f) => { (listeners[k] ||= []).push(f); return k; }, removeValueChangeListener: (k) => { delete listeners[k]; },
      xhr,
    };
    // the newer promise-based GM.* functions
    Object.assign(api, {
      getValue: async (k, def) => api.getValueSync(k, def), setValue: async (k, v) => set(k, v), deleteValue: async (k) => set(k, undefined), listValues: async () => Object.keys(vals),
      xmlHttpRequest: (d) => new Promise((ok, no) => xhr({ ...d, onload: (r) => { d.onload && d.onload(r); ok(r); }, onerror: (r) => { d.onerror && d.onerror(r); no(r); } })),
      notification: (a, b) => api.notify(a, b), openInTab: api.openInTab, setClipboard: async (t) => api.setClipboard(t), addStyle, registerMenuCommand: api.registerMenuCommand, getResourceUrl: async () => null,
    });
    window.GM = window.GM || api; // some scripts look for a global GM
    return api;
  };
  addEventListener("message", (e) => { const d = e.data; if (!d || !d.__kbmenu || e.source !== parent) return; const f = menus[d.key]; if (f) try { f(); } catch {} });

  const title = () => send({ type: "title", title: document.title });
  addEventListener("DOMContentLoaded", () => { title(); const t = document.querySelector("title"); if (t) new MutationObserver(title).observe(t, { childList: true, characterData: true, subtree: true }); });
  addEventListener("error", (e) => send({ type: "jserror", msg: String(e.message || "").slice(0, 200) }));
  addEventListener("unhandledrejection", (e) => send({ type: "jserror", msg: "(async) " + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason || "").slice(0, 300) }));
  addEventListener("load", () => { send({ type: "loaded", trackers: TRACKERS_REMOVED }); setTimeout(() => send({ type: "stats", text: ((document.body && document.body.innerText) || "").length, nodes: document.getElementsByTagName("*").length }), 3000); });
})();
