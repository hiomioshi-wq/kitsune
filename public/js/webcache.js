import { kvGet, kvSet } from "./store.js";
// Kitsune Browser, v116: a page cache and link prefetching.
//  - Back, forward and revisits show the page you already loaded at once, instead of fetching it again.
//  - If the network fails, the last copy of a page you had open is shown with a note, instead of an error.
//  - Hover (or touch) a link on the same site and its page is quietly fetched ahead, so the click is instant.
// Reload always fetches fresh. Pages with a sign-in cookie, and private browsing, are never cached.
const MAX_ENTRIES = 40, MAX_BYTES = 80 * 1024 * 1024, FRESH_MS = 15 * 60_000;
const store = new Map(); let bytes = 0;
const size = (r) => (r?.html?.length || 0) + (r?.text?.length || 0) + 2000;
const key = (u) => String(u).replace(/#.*$/, "");

export function get(url, { stale = false } = {}) {
  const e = store.get(key(url)); if (!e) return null;
  if (!stale && Date.now() - e.at > FRESH_MS) return null;
  store.delete(key(url)); store.set(key(url), e); // most recently used goes last
  return e;
}
export function put(url, r, { cookied = false, priv = false } = {}) {
  if (priv || cookied || !r || r.status >= 400 || r.file) return;
  if (!(r.html || r.text)) return;
  const k = key(url), old = store.get(k); if (old) bytes -= old.bytes;
  const e = { r, at: Date.now(), bytes: size(r) }; store.set(k, e); bytes += e.bytes; dirty = true;
  while ((store.size > MAX_ENTRIES || bytes > MAX_BYTES) && store.size > 1) { const [kk, v] = store.entries().next().value; store.delete(kk); bytes -= v.bytes; }
}
export const drop = (url) => { const e = store.get(key(url)); if (e) { bytes -= e.bytes; store.delete(key(url)); } };
export const ago = (e) => { const s = Math.round((Date.now() - e.at) / 1000); return s < 90 ? "just now" : s < 5400 ? Math.round(s / 60) + " min ago" : Math.round(s / 3600) + " h ago"; };

// ---------- prefetch ----------
const SKIP = /(log(out|off)|sign(out|off)|delete|remove|unsubscribe|cart|checkout|buy|download|\.(zip|pdf|exe|dmg|mp4|mp3|iso)(\?|$))/i;
let running = 0; const queued = new Set();
export function prefetch(url, fetcher) {
  const k = key(url);
  if (store.has(k) || queued.has(k) || running >= 2 || SKIP.test(url) || localStorage.getItem("kitsune.webNoPrefetch") === "1") return;
  queued.add(k); running++;
  Promise.resolve(fetcher(url)).then((r) => { if (r && r.status < 400 && (r.html || r.text)) { put(url, r); warm(r); } }).catch(() => {}).finally(() => { running--; queued.delete(k); });
}
export function watchLinks(root, base, fetcher, sameSiteOnly = true) {
  if (!root || root.__kbPrefetch) return; root.__kbPrefetch = true;
  let timer = null;
  const aim = (e) => {
    const a = e.target.closest?.("a[href]"); if (!a) return; clearTimeout(timer);
    let u; try { u = new URL(a.getAttribute("href"), base); } catch { return; }
    if (!/^https?:$/.test(u.protocol) || (sameSiteOnly && u.hostname !== new URL(base).hostname) || u.href === base || (u.pathname === new URL(base).pathname && u.hash)) return;
    if (a.target === "_blank" && sameSiteOnly) return;
    timer = setTimeout(() => prefetch(u.href, fetcher), e.type === "touchstart" ? 0 : 160);
  };
  root.addEventListener("mouseover", aim, { passive: true }); root.addEventListener("touchstart", aim, { passive: true });
  root.addEventListener("mouseout", () => clearTimeout(timer), { passive: true });
}
export const stats = () => ({ pages: store.size, mb: +(bytes / 1048576).toFixed(1) });
export const clear = () => { store.clear(); bytes = 0; dirty = false; try { kvSet("webPageStore", []); } catch {} };

// ---------- stylesheets: fetched once, reused by every page that links them ----------
const sheets = new Map(), inflight = new Map(); let sheetBytes = 0;
export function css(u) {
  const hit = sheets.get(u); if (hit && Date.now() - hit.at < 30 * 60_000) { sheets.delete(u); sheets.set(u, hit); return Promise.resolve(hit.text); }
  if (inflight.has(u)) return inflight.get(u);
  const p = fetch("/api/browse/css?url=" + encodeURIComponent(u)).then(async (r) => {
    if (!r.ok) return null; const text = await r.text();
    sheets.set(u, { text, at: Date.now() }); sheetBytes += text.length;
    while ((sheets.size > 120 || sheetBytes > 16 * 1048576) && sheets.size > 1) { const [k, v] = sheets.entries().next().value; sheets.delete(k); sheetBytes -= v.text.length; }
    return text;
  }).catch(() => null).finally(() => inflight.delete(u));
  inflight.set(u, p); return p;
}
// Warm a prefetched page's stylesheets too, so it paints without waiting for them.
export function warm(r) {
  if (!r?.html) return; const base = r.url;
  for (const m of [...r.html.matchAll(/<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi)].slice(0, 10)) {
    const h = m[0].match(/href=["']([^"']+)/i)?.[1]; if (!h) continue; let u; try { u = new URL(h.replace(/&amp;/g, "&"), base).href; } catch { continue; } css(u);
  }
}

// ---------- memo: the processed form of a stylesheet, so revisits skip the heavy rewriting ----------
const memos = new Map();
export const sig = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return s.length + ":" + (h >>> 0).toString(36); };
export function memo(key, fn) {
  if (memos.has(key)) { const v = memos.get(key); memos.delete(key); memos.set(key, v); return v; }
  const v = fn(); memos.set(key, v);
  while (memos.size > 80) memos.delete(memos.keys().next().value);
  return v;
}

// ---------- keep the newest pages on this device, so they open offline after a restart ----------
let dirty = false, restored = false;
const SAVE_PAGES = 14, SAVE_BYTES = 14 * 1048576;
export async function restore() {
  if (restored) return; restored = true;
  try {
    const list = (await kvGet("webPageStore", [])) || [];
    for (const e of list) { const k = key(e.u); if (!store.has(k)) { store.set(k, { r: e.r, at: e.at, bytes: size(e.r) }); bytes += size(e.r); } }
  } catch {}
}
export function persist() {
  if (!dirty) return; dirty = false;
  try {
    const out = []; let total = 0;
    for (const [u, e] of [...store.entries()].reverse()) { if (out.length >= SAVE_PAGES || total + e.bytes > SAVE_BYTES) break; if (e.r.html && e.r.html.length > 3_000_000) continue; out.push({ u, at: e.at, r: { url: e.r.url, status: e.r.status, kind: e.r.kind, html: e.r.html, text: e.r.text, ctype: e.r.ctype, adapted: e.r.adapted } }); total += e.bytes; }
    kvSet("webPageStore", out);
  } catch {}
}
export const markDirty = () => { dirty = true; };
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => { if (document.hidden) persist(); });
  setInterval(persist, 90_000);
}
