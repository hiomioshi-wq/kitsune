// Small shared helpers.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const naturalCompare = (a, b) => String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const uid = (p = "") => p + (crypto.randomUUID ? crypto.randomUUID().slice(0, 13) : Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const IMG_RE = /\.(jpe?g|png|webp|gif|avif|svg|bmp)$/i;
export const icon = (name, cls = "") => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

// Per-profile key prefix (see profiles.js; kept inline to avoid an import cycle).
const LS_PREFIX = (() => { try { const id = JSON.parse(localStorage.getItem("kitsune.profile") || '"main"'); return id === "main" ? "kitsune." : `kitsune.${id}.`; } catch { return "kitsune."; } })();
export const ls = {
  get(k, d) { try { const v = localStorage.getItem(LS_PREFIX + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)); } catch {} },
};

export async function api(path, opts = {}) {
  let res;
  try { res = await fetch("/api/" + path, opts); }
  catch { throw new Error("Kitsune's server isn't reachable. Check your connection."); }
  const type = res.headers.get("content-type") || "";
  const data = type.includes("json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
  return data;
}

let health;
export const getHealth = () => (health ??= api("health").catch(() => ({ features: {} })));

// ---------- formatting ----------
export const plural = (n, one, many = one + "s") => `${Number(n).toLocaleString()} ${n === 1 ? one : many}`;
export const flipName = (n) => { const [last, first] = String(n).split(", "); return first ? `${first.replace(/\s*\(.*\)/, "")} ${last}` : n; };
export function fmtDuration(secs) {
  secs = Math.round(secs || 0);
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
export function fmtMinutes(secs) {
  const m = Math.round((secs || 0) / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
export function timeAgo(sec) {
  if (!sec) return "";
  const d = Date.now() / 1000 - sec;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)} min ago`;
  if (d < 86400) return `${Math.floor(d / 3600)} h ago`;
  if (d < 86400 * 7) return `${Math.floor(d / 86400)} d ago`;
  return new Date(sec * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: d > 86400 * 300 ? "numeric" : undefined });
}
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function fmtBytes(b) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"]; let i = 0;
  while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
  return `${b.toFixed(b < 10 && i ? 1 : 0)} ${u[i]}`;
}

// ---------- toast ----------
let toastTimer;
export function toast(msg, { action, onAction, ms = 3600 } = {}) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ""}`;
  t.hidden = false;
  if (action) $("button", t).onclick = () => { t.hidden = true; onAction?.(); };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), ms);
}

// ---------- modal ----------
let modalStack = [];
export function modal({ title, body, wide = false, onClose, actions = "" }) {
  const root = document.createElement("div");
  root.className = "modal";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.innerHTML = `<div class="modal-scrim" data-close></div>
    <div class="modal-card ${wide ? "wide" : ""}">
      <header class="modal-head"><h2 class="h3">${esc(title)}</h2><button class="icon-btn" type="button" data-close aria-label="Close">${icon("x")}</button></header>
      <div class="modal-body">${body}</div>
      ${actions ? `<footer class="modal-foot">${actions}</footer>` : ""}
    </div>`;
  const prev = document.activeElement;
  document.body.append(root);
  const close = () => { root.remove(); modalStack = modalStack.filter((m) => m !== api); onClose?.(); prev?.focus?.(); };
  const api = { root, close };
  root.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  modalStack.push(api);
  requestAnimationFrame(() => (root.querySelector("[autofocus], input, select, textarea, .modal-body button") || root.querySelector("[data-close]")).focus());
  return api;
}
export const topModal = () => modalStack.at(-1);

// Confirmation built into the page (browser confirm() is avoided).
export function confirmBox(title, text, okLabel = "Delete", danger = true) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal({
      title, body: `<p class="muted">${esc(text)}</p>`,
      actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn ${danger ? "btn-danger" : "btn-accent"}" type="button" data-ok>${esc(okLabel)}</button>`,
      onClose: () => { if (!done) resolve(false); },
    });
    $("[data-ok]", m.root).onclick = () => { done = true; m.close(); resolve(true); };
  });
}

// Simple popover menu anchored to a button.
export function menu(anchor, items) {
  document.querySelector(".pop")?.remove();
  const pop = document.createElement("div");
  pop.className = "pop";
  pop.setAttribute("role", "menu");
  pop.innerHTML = items.map((it, i) => (it === "-" ? `<hr>` : `<button type="button" role="menuitem" data-i="${i}" class="${it.danger ? "danger" : ""}">${it.icon ? icon(it.icon) : ""}<span>${esc(it.label)}</span></button>`)).join("");
  document.body.append(pop);
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = clamp(r.right - w, 8, innerWidth - w - 8) + "px";
  pop.style.top = (r.bottom + h + 8 > innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6) + "px";
  const off = (e) => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener("pointerdown", off, true); } };
  setTimeout(() => document.addEventListener("pointerdown", off, true));
  pop.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]"); if (!b) return;
    pop.remove(); document.removeEventListener("pointerdown", off, true);
    items[Number(b.dataset.i)].run();
  });
  $("button", pop)?.focus();
  pop.addEventListener("keydown", (e) => {
    const bs = $$("button", pop), i = bs.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
    if (e.key === "Escape") { pop.remove(); anchor.focus(); }
  });
}

// Lazy-load a classic script once.
const scripts = {};
export function loadScript(src) {
  return (scripts[src] ??= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => { delete scripts[src]; rej(new Error("A helper library failed to load. Check your connection.")); };
    document.head.append(s);
  }));
}
export const JSZIP = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
export const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
export const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
export async function getJSZip() { await loadScript(JSZIP); return window.JSZip; }
export async function getPdfjs() {
  await loadScript(PDFJS);
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return window.pdfjsLib;
}

// Cover image or a typographic placeholder.
export function coverHtml(src, title, { color = "", badge = "", own = false, pct = 0, alt = "" } = {}) {
  return `<div class="cover" style="${color ? `--cc:${esc(color)}` : ""}">
    ${src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.remove()">` : ""}
    <div class="cover-blank"><span>${esc(title)}</span></div>
    ${badge ? `<span class="badge">${esc(badge)}</span>` : ""}
    ${own ? `<span class="badge badge-own">${icon("check")}Owned</span>` : ""}
    ${pct ? `<span class="bar"><i style="width:${pct}%"></i></span>` : ""}
  </div>`;
}

export function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// Content notes an author put at the top of a text ("Trigger warning: ..." or "Content warning: ...").
export function contentNotes(text) {
  const m = /^[ \t]*(?:trigger|content) warnings?:[ \t]*(.+)$/im.exec(String(text || "").slice(0, 2500));
  return m ? m[1].trim() : "";
}

// The main colour of a cover, used to tint the page around it (book pages, the home hero, series banners).
// Weighted toward saturated mid-tones so a dark border or white title doesn't win. Cached per image.
// Resolves to null when the image can't be read (for example a cover served without CORS).
const tintCache = new Map();
export function coverTint(src) {
  if (!src) return Promise.resolve(null);
  if (tintCache.has(src)) return tintCache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    if (/^https?:/i.test(src) && !src.startsWith(location.origin)) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 24; c.height = 36;
        const x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(img, 0, 0, 24, 36);
        const d = x.getImageData(0, 0, 24, 36).data;
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          const R = d[i], G = d[i + 1], B = d[i + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B);
          const sat = mx ? (mx - mn) / mx : 0, lum = (mx + mn) / 510;
          const wt = 0.12 + sat * sat * 3 * Math.max(0, 1 - Math.abs(lum - 0.5) * 1.5);
          r += R * wt; g += G * wt; b += B * wt; w += wt;
        }
        if (!w) return resolve(null);
        // Keep the cover's hue but make it usable as a wash: enough colour, mid lightness.
        const R = r / w / 255, G = g / w / 255, Bl = b / w / 255;
        const mx = Math.max(R, G, Bl), mn = Math.min(R, G, Bl), dl = mx - mn;
        const L = (mx + mn) / 2, S = dl ? dl / (1 - Math.abs(2 * L - 1)) : 0;
        if (S < 0.06) return resolve(null); // a grey cover: let the page keep its accent
        let H = !dl ? 0 : mx === R ? ((G - Bl) / dl) % 6 : mx === G ? (Bl - R) / dl + 2 : (R - G) / dl + 4;
        H = Math.round(H * 60 + 360) % 360;
        const sat = Math.round(Math.min(78, Math.max(42, S * 100))), lit = Math.round(Math.min(58, Math.max(44, L * 100)));
        resolve(`hsl(${H} ${sat}% ${lit}%)`);
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  tintCache.set(src, p);
  return p;
}
// Give every [data-tint] element under root a --tint from its cover. Safe to call repeatedly.
export function applyTints(root) {
  root?.querySelectorAll?.("[data-tint]:not([data-tinted])").forEach((el) => {
    el.setAttribute("data-tinted", "");
    coverTint(el.dataset.tint).then((t) => { if (t) el.style.setProperty("--tint", t); });
  });
}
