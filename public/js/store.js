// Everything Kitsune keeps lives in IndexedDB on this device:
//   items: every manga volume, book and audiobook on your shelf (with any files you added)
//   kv:    progress, bookmarks, highlights, stats, settings, tracking, copies, sources

import { api, getHealth, today, naturalCompare, getPdfjs, ls } from "./util.js";
import { dbName } from "./profiles.js";

const DB_NAME = dbName();
let dbp;
function db() {
  return (dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore("items", { keyPath: "id" });
      r.result.createObjectStore("kv", { keyPath: "k" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error("Close other Kitsune tabs and reload."));
  }));
}
async function tx(store, mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => res(req?.result);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error("Storage is full. Free some space in Settings."));
  });
}
export const idb = {
  all: (s) => tx(s, "readonly", (o) => o.getAll()),
  get: (s, k) => tx(s, "readonly", (o) => o.get(k)),
  put: (s, v) => tx(s, "readwrite", (o) => o.put(v)),
  del: (s, k) => tx(s, "readwrite", (o) => o.delete(k)),
  clear: (s) => tx(s, "readwrite", (o) => o.clear()),
};

// ---------- key/value with in-memory mirror ----------
const kvCache = new Map();
export async function kvGet(k, d) {
  if (kvCache.has(k)) return kvCache.get(k);
  let v = d;
  try { const r = await idb.get("kv", k); if (r) v = r.v; } catch {}
  kvCache.set(k, v);
  return v;
}
const pendingKv = new Map();
export function kvSet(k, v) {
  kvCache.set(k, v);
  clearTimeout(pendingKv.get(k));
  pendingKv.set(k, setTimeout(() => idb.put("kv", { k, v }).catch(() => {}), 250));
}
export function kvFlush() {
  for (const [k, t] of pendingKv) { clearTimeout(t); idb.put("kv", { k, v: kvCache.get(k) }).catch(() => {}); }
  pendingKv.clear();
}
addEventListener("pagehide", kvFlush);

// ---------- settings ----------
export const DEFAULT_SETTINGS = {
  theme: "system", accent: "amber",
  manga: { mode: "single", dir: "rtl", fit: "height", offset: false, gap: false, brightness: 100, warmth: 0, autoNext: true, hq: true },
  book: { theme: "paper", font: "literata", size: 19, lineHeight: 1.7, width: 36, align: "left", layout: "scroll", rate: 1 },
  audio: { rate: 1 },
  a11y: { motion: "system", font: "default", scale: "100", underline: false, focus: false },
  world: { aiDialogue: true, aiCommands: true, aiProvider: "auto", mindControl: true, blackwoodPowers: true, walkSpeed: 1, overworldSpeed: 1, houndAggro: 1, weatherEffects: true, worldWeather: true, showMinimap: true, nightDarkness: "auto", lanternRadius: 1, worldZoom: 1, showPet: true, realmRewards: 1, realmRespawn: true, realmDamageNumbers: true, realmStaminaRegen: 1, autoHeal: false },
  limits: { aiPerMin: 20, aiCooldown: 2, quarryPerDay: 4, arcadeCap: 250 },
  goal: 20,
  yearGoal: 12,
};
// Titles finished this calendar year, for the reading challenge.
export async function finishedThisYear() {
  const st = await kvGet("stats", { days: {}, finished: [] });
  const y = new Date().getFullYear();
  return st.finished.filter((f) => new Date(f.at * 1000).getFullYear() === y);
}
export let settings = structuredClone(DEFAULT_SETTINGS);
export async function loadSettings() {
  const s = await kvGet("settings", {});
  settings = { ...structuredClone(DEFAULT_SETTINGS), ...s, manga: { ...DEFAULT_SETTINGS.manga, ...s.manga }, book: { ...DEFAULT_SETTINGS.book, ...s.book }, audio: { ...DEFAULT_SETTINGS.audio, ...s.audio }, a11y: { ...DEFAULT_SETTINGS.a11y, ...s.a11y }, world: { ...DEFAULT_SETTINGS.world, ...s.world }, limits: { ...DEFAULT_SETTINGS.limits, ...s.limits } };
  applyTheme();
  return settings;
}
export function saveSettings() { kvSet("settings", settings); applyTheme(); }
export const ACCENTS = {
  amber: ["#b8571b", "#f3a64c", "Fox amber"],
  vermilion: ["#c23b22", "#ff7a59", "Torii red"],
  sakura: ["#c2456f", "#f48fb1", "Sakura"],
  matcha: ["#4f7a28", "#a5d16b", "Matcha"],
  ai: ["#3e55c2", "#8fa2ff", "Ai indigo"],
  fuji: ["#7a4cc2", "#bb9bff", "Wisteria"],
  teal: ["#0f7d6e", "#3ecfb5", "Deep teal"],
  persimmon: ["#d1552c", "#ff8a50", "Persimmon"],
};
// Accessibility: motion, a readable interface font, text size, link underlines and strong focus rings.
export function applyA11y() {
  const root = document.documentElement, a = settings.a11y || DEFAULT_SETTINGS.a11y;
  if (a.motion === "reduce") root.dataset.motion = "reduce"; else delete root.dataset.motion;
  if (a.font && a.font !== "default") root.dataset.uifont = a.font; else delete root.dataset.uifont;
  if (a.font === "dyslexic") loadDyslexicFont();
  root.style.fontSize = a.scale && a.scale !== "100" ? a.scale + "%" : "";
  root.classList.toggle("a11y-underline", !!a.underline);
  root.classList.toggle("a11y-focus", !!a.focus);
}
let dysLoaded = false;
export function loadDyslexicFont() {
  if (dysLoaded) return;
  dysLoaded = true;
  for (const w of ["400", "700"]) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = `https://cdn.jsdelivr.net/npm/@fontsource/opendyslexic@5.1.0/${w}.css`; document.head.append(l); }
}

export function applyTheme() {
  const root = document.documentElement;
  applyA11y();
  if (settings.wallpaper || (settings.uiSound && settings.uiSound !== "off") || settings.sfxOn || document.getElementById("kt-decor")) import("./decor.js").then((D) => { D.applyDecor(settings); D.applySounds(settings); }).catch(() => {});
  // Custom and preset themes from the Theme studio ("preset:washi", "custom:<id>")
  if (/^(preset|custom):/.test(settings.theme)) {
    import("./themes.js").then((T) => { T.applyCustomTheme(settings.theme); T.applyCursorFrom(settings, ls.get("customCursorUrl", "")); });
    ls.set("theme", [settings.theme, settings.accent]);
    return;
  }
  document.getElementById("kt-theme")?.remove();
  ls.set("themeCss", "");
  import("./themes.js").then((T) => { T.applyCursorFrom(settings, ls.get("customCursorUrl", "")); });
  const night = nightNow();
  if (night != null) root.setAttribute("data-theme", night ? "dark" : "light");
  else if (settings.theme === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", settings.theme);
  if (settings.accent === "custom" && /^#[0-9a-f]{6}$/i.test(settings.customAccent || "")) {
    root.style.setProperty("--accent-l", settings.customAccent);
    root.style.setProperty("--accent-d", `color-mix(in srgb, ${settings.customAccent} 70%, white)`);
  } else {
    const [light, dark] = ACCENTS[settings.accent] || ACCENTS.amber;
    root.style.setProperty("--accent-l", light);
    root.style.setProperty("--accent-d", dark);
  }
  ls.set("theme", [settings.theme, settings.accent]);
}

// ---------- library ----------
export const lib = { items: [], features: {}, folder: "" };
const listeners = new Set();
export const onLibraryChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
const emit = () => listeners.forEach((fn) => fn());

const SAMPLE = {
  id: "sample", type: "manga", title: "Vol 01 – How to Read", series: "Kitsune Sample", author: "Kitsune",
  source: { kind: "urls", urls: ["/sample/000.svg", "/sample/001.svg", "/sample/002.svg", "/sample/003.svg"] },
  pages: 4, origin: "Built-in sample", tags: [], status: "unread", rating: 0, link: null, added: 1,
};

export async function loadLibrary() {
  let items = await idb.all("items").catch(() => []);
  if (!ls.get("seeded", false)) {
    if (!items.some((i) => i.id === "sample")) { await idb.put("items", SAMPLE).catch(() => {}); items.push(SAMPLE); }
    ls.set("seeded", true);
  }
  // Every library starts with the first Kitsune Original manga chapter (once).
  if (!ls.get("seededOriginals", false)) {
    ls.set("seededOriginals", true);
    if (!items.some((i) => i.id === "orig-kitsu-1")) {
      const { ORIGINALS, addOriginal } = await import("./originals.js");
      const o = ORIGINALS[0];
      const it = { id: o.id, type: "manga", title: o.title, series: o.series, volume: o.volume, author: "Kitsune Originals", cover: o.cover, description: o.blurb, pages: o.pages, dir: "ltr",
        source: { kind: "urls", urls: o.urls }, origin: "Kitsune Original", credit: { creator: "Kitsune Originals", license: "Creative Commons Attribution 4.0 (CC BY 4.0)" }, tags: ["kitsune originals"], status: "unread", rating: 0, added: 2 };
      await idb.put("items", it).catch(() => {}); items.push(it); void addOriginal;
    }
  }
  const health = await getHealth();
  lib.features = health.features || {};
  if (lib.features.libraryFolder) {
    try {
      const d = await api("library");
      lib.folder = d.folder;
      items = mergeServer(items, d.results);
    } catch {}
  }
  lib.items = items;
  emit();
  return items;
}

function mergeServer(items, serverVols) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const live = new Set();
  for (const v of serverVols) {
    const id = "srv-" + v.id;
    live.add(id);
    const prev = byId.get(id);
    const item = {
      tags: [], status: "unread", rating: 0, link: null, ...(prev || {}),
      id, type: "manga", title: prev?.title || v.title, series: prev?.series || v.series,
      source: { kind: "server", id: v.id, path: v.path }, pages: v.pages, origin: "Library folder", added: prev?.added || v.added,
    };
    byId.set(id, item);
    if (!prev) idb.put("items", item).catch(() => {});
  }
  // Folder volumes that disappeared stay hidden but keep their notes.
  return [...byId.values()].filter((i) => i.source?.kind !== "server" || live.has(i.id));
}

export async function rescanFolder() {
  const d = await api("library/rescan", { method: "POST" });
  lib.folder = d.folder;
  lib.items = mergeServer(lib.items, d.results);
  emit();
  return d.results.length;
}

export const getItem = (id) => lib.items.find((i) => i.id === id);
export async function saveItem(item) {
  item.updated = Math.floor(Date.now() / 1000);
  await idb.put("items", item);
  const i = lib.items.findIndex((x) => x.id === item.id);
  if (i >= 0) lib.items[i] = item; else lib.items.push(item);
  emit();
  return item;
}
export async function saveItems(list) { for (const it of list) await idb.put("items", { ...it, updated: Math.floor(Date.now() / 1000) }); await loadLibrary(); }
// Removed titles wait in "Recently deleted" for 30 days (with their files and reading position) before they're gone.
const TRASH_DAYS = 30;
export async function getTrash() {
  const t = (await idb.get("kv", "trash"))?.v || [];
  const keep = t.filter((x) => Date.now() - x.at < TRASH_DAYS * 86400_000);
  if (keep.length !== t.length) await idb.put("kv", { k: "trash", v: keep });
  return keep;
}
async function putTrash(list) { await idb.put("kv", { k: "trash", v: list }); }
export async function restoreItem(id) {
  const t = await getTrash(), x = t.find((e) => e.item.id === id);
  if (!x) return false;
  await idb.put("items", x.item);
  if (x.progress) { const p = await kvGet("progress", {}); p[id] = x.progress; kvSet("progress", p); }
  await putTrash(t.filter((e) => e.item.id !== id));
  await loadLibrary();
  return true;
}
export async function purgeTrash(id) { const t = await getTrash(); await putTrash(id ? t.filter((e) => e.item.id !== id) : []); }

export async function deleteItem(id) {
  const it = lib.items.find((i) => i.id === id);
  // Titles from the library folder come back on the next rescan, so they skip the bin.
  if (it && it.source?.kind !== "server") {
    const full = (await idb.get("items", id)) || it;
    const t = (await getTrash()).filter((e) => e.item.id !== id);
    t.unshift({ item: full, progress: (await kvGet("progress", {}))[id] || null, at: Date.now() });
    await putTrash(t);
  }
  await idb.del("items", id);
  lib.items = lib.items.filter((i) => i.id !== id);
  const p = await kvGet("progress", {}); delete p[id]; kvSet("progress", p);
  revokeItemUrls(id);
  emit();
}

export const seriesKey = (item) => (item.link?.anilistId ? "al-" + item.link.anilistId : "s-" + String(item.series || item.title).toLowerCase().trim());
export function seriesGroups(items = lib.items.filter((i) => i.type === "manga")) {
  const map = new Map();
  for (const it of items) {
    const k = seriesKey(it);
    if (!map.has(k)) map.set(k, { key: k, title: it.link?.title || it.series || it.title, link: it.link, items: [] });
    map.get(k).items.push(it);
  }
  for (const g of map.values()) g.items.sort((a, b) => naturalCompare(a.title, b.title));
  return [...map.values()];
}

// ---------- page sources ----------
const urlCache = new Map(); // "id:i" -> object URL
function revokeItemUrls(id) {
  for (const [k, u] of urlCache) if (k.startsWith(id + ":")) { URL.revokeObjectURL(u); urlCache.delete(k); }
}
function cacheUrl(key, blob) {
  if (!urlCache.has(key)) {
    urlCache.set(key, URL.createObjectURL(blob));
    if (urlCache.size > 400) { const [k, u] = urlCache.entries().next().value; URL.revokeObjectURL(u); urlCache.delete(k); }
  }
  return urlCache.get(key);
}

const pdfDocs = new Map();
async function pdfPage(item, i) {
  const key = item.id + ":" + i;
  if (urlCache.has(key)) return urlCache.get(key);
  const pdfjs = await getPdfjs();
  let doc = pdfDocs.get(item.id);
  if (!doc) {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await item.source.blob.arrayBuffer()) }).promise;
    pdfDocs.set(item.id, doc);
    if (pdfDocs.size > 2) { const [k, d] = pdfDocs.entries().next().value; d.destroy?.(); pdfDocs.delete(k); }
  }
  const page = await doc.getPage(i + 1);
  const vp1 = page.getViewport({ scale: 1 });
  const scale = Math.min(3, 1800 / vp1.height);
  const vp = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height);
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
  const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
  return cacheUrl(key, blob);
}

async function fetchedPage(item, url, i) {
  const key = item.id + ":" + i;
  if (urlCache.has(key)) return urlCache.get(key);
  const s = item.source;
  const headers = s.auth ? { [lib.features.proxy && s.proxy ? "X-Kitsune-Auth" : "Authorization"]: s.auth } : {};
  const target = s.proxy && lib.features.proxy ? "/api/proxy?url=" + encodeURIComponent(url) : url;
  const r = await fetch(target, { headers });
  if (!r.ok) throw new Error(`Page ${i + 1} didn't load (${r.status}).`);
  return cacheUrl(key, await r.blob());
}

export async function pageSrc(item, i) {
  const s = item.source;
  if (item.offline?.[i]) return cacheUrl(item.id + ":o" + i, item.offline[i]);
  switch (s.kind) {
    case "blobs": return cacheUrl(item.id + ":" + i, s.blobs[i]);
    case "urls": return s.urls[i];
    case "server": return `/api/library/${s.id}/pages/${i}`;
    case "pdf": return pdfPage(item, i);
    case "template": {
      let u = s.template.replace("{n}", i).replace("{pageNumber}", i + (s.base ?? 0)).replace("{maxWidth}", 1600);
      if (s.ia && !settings.manga.hq) u = u.replace("_w1400", "_w800");
      return s.auth || s.proxy ? fetchedPage(item, u, i) : u;
    }
    default: throw new Error("This item has no pages.");
  }
}
export function coverSrc(item) {
  if (item.coverBlob) return cacheUrl(item.id + ":cover" + (item.coverV || ""), item.coverBlob);
  const s = item.source || {};
  const cp = item.coverPage;
  if (cp != null) {
    if (item.offline?.[cp]) return cacheUrl(item.id + ":o" + cp, item.offline[cp]);
    if (s.kind === "blobs" && s.blobs[cp]) return cacheUrl(item.id + ":" + cp, s.blobs[cp]);
    if (s.kind === "urls" && s.urls[cp]) return s.urls[cp];
    if (s.kind === "server") return `/api/library/${s.id}/pages/${cp}`;
    if (s.kind === "template" && !s.auth && !s.proxy) return s.template.replace("{n}", cp).replace("{pageNumber}", cp + (s.base ?? 0)).replace("{maxWidth}", 400).replace("_w1400", "_w400");
  }
  if (item.cover) return item.cover;
  if (item.offline?.[0]) return cacheUrl(item.id + ":o0", item.offline[0]);
  if (s.kind === "blobs") return cacheUrl(item.id + ":0", s.blobs[0]);
  if (s.kind === "urls") return s.urls[0];
  if (s.kind === "server") return `/api/library/${s.id}/pages/0`;
  if (s.kind === "template" && !s.auth && !s.proxy) return s.template.replace("{n}", 0).replace("{pageNumber}", s.base ?? 0).replace("{maxWidth}", 400).replace("_w1400", "_w400");
  return item.link?.cover || null;
}

// ---------- offline copies ----------
// Which items can be saved for offline reading, and how each page is fetched.
export function canDownload(item) {
  const s = item.source || {};
  if (item.type !== "manga" || item.offline?.length) return false;
  return s.kind === "template" || (s.kind === "urls" && !s.urls[0]?.startsWith("/sample/")) || s.kind === "server";
}
function downloadUrl(item, i) {
  const s = item.source;
  if (s.kind === "template" && s.ia) return { url: `/api/ia/${encodeURIComponent(s.ia)}/page/${i}?w=${settings.manga.hq ? 1400 : 800}` };
  if (s.kind === "template") {
    const u = s.template.replace("{n}", i).replace("{pageNumber}", i + (s.base ?? 0)).replace("{maxWidth}", 1600);
    if (s.proxy && lib.features.proxy) return { url: "/api/proxy?url=" + encodeURIComponent(u), headers: s.auth ? { "X-Kitsune-Auth": s.auth } : {} };
    return { url: u, headers: s.auth ? { Authorization: s.auth } : {} };
  }
  if (s.kind === "urls") return { url: s.urls[i] };
  if (s.kind === "server") return { url: `/api/library/${s.id}/pages/${i}` };
  throw new Error("This item can't be saved for offline reading.");
}
export async function downloadItem(item, onProgress = () => {}, signal) {
  const blobs = [];
  let bytes = 0;
  for (let i = 0; i < item.pages; i++) {
    if (signal?.aborted) throw new Error("Download stopped.");
    const { url, headers } = downloadUrl(item, i);
    let r, tries = 0;
    while (true) {
      try { r = await fetch(url, { headers, signal }); if (r.ok || r.status === 404 || ++tries > 2) break; }
      catch (e) { if (signal?.aborted || ++tries > 2) throw new Error(`Page ${i + 1} couldn't be downloaded. ${url.startsWith("/") ? "Check your connection." : "The site hosting it doesn't allow downloads (CORS)."}`); }
      await new Promise((res) => setTimeout(res, 800 * tries));
    }
    if (!r.ok) throw new Error(`Page ${i + 1} couldn't be downloaded (${r.status}).`);
    const b = await r.blob();
    bytes += b.size;
    blobs.push(b);
    onProgress((i + 1) / item.pages, bytes);
  }
  item.offline = blobs;
  item.offlineBytes = bytes;
  await saveItem(item);
  return bytes;
}
export async function removeDownload(item) {
  for (const [k, u] of urlCache) if (k.startsWith(item.id + ":o")) { URL.revokeObjectURL(u); urlCache.delete(k); }
  delete item.offline; delete item.offlineBytes;
  await saveItem(item);
}

// ---------- Up Next queue ----------
export async function getQueue() { return (await kvGet("queue", [])).filter((id) => getItem(id)); }
export async function setQueue(ids) { kvSet("queue", [...new Set(ids)]); emit(); }
export async function toggleQueue(id) {
  const q = await getQueue();
  const has = q.includes(id);
  await setQueue(has ? q.filter((x) => x !== id) : [...q, id]);
  return !has;
}

// Makes a small JPEG cover from a page (used for PDFs and private sources).
export async function makeCoverBlob(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const scale = Math.min(1, 480 / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
}

// ---------- progress, bookmarks, highlights ----------
export async function getProgress(id) { return (await kvGet("progress", {}))[id] || null; }
export async function allProgress() { return kvGet("progress", {}); }
export async function setProgress(id, data) {
  if (settings.incognito) return; // incognito: nothing is recorded
  const p = await kvGet("progress", {});
  p[id] = { ...(p[id] || {}), ...data, updated: Math.floor(Date.now() / 1000) };
  kvSet("progress", p);
  const item = getItem(id);
  if (item) {
    const done = data.total && data.pos >= data.total - 1;
    let want = item.status || "unread";
    if (done) want = "completed";
    else if (want === "unread" || want === "plan") want = "reading";
    if (done) markFinished(id);
    if (item.status !== want) { item.status = want; item.lastRead = Math.floor(Date.now() / 1000); saveItem(item); }
    else if (!item.lastRead || Date.now() / 1000 - item.lastRead > 60) { item.lastRead = Math.floor(Date.now() / 1000); idb.put("items", item).catch(() => {}); }
  }
}
export const progressPct = (p) => (p && p.total ? Math.min(100, Math.round(((p.pos + 1) / p.total) * 100)) : 0);

export async function getMarks(kind, id) { return ((await kvGet(kind, {}))[id] || []).slice(); }
export async function setMarks(kind, id, list) { const all = await kvGet(kind, {}); all[id] = list; kvSet(kind, all); }

// ---------- reading stats ----------
export async function logStat({ pages = 0, secs = 0, words = 0, listen = 0, itemId } = {}) {
  if (settings.incognito) return;
  const st = await kvGet("stats", { days: {}, finished: [] });
  // Time spent in each title, for "time spent" and the finish estimate on its page.
  if (itemId && (secs || listen)) { st.itemSecs ||= {}; st.itemSecs[itemId] = (st.itemSecs[itemId] || 0) + secs + listen; }
  const d = (st.days[today()] ||= { pages: 0, secs: 0, words: 0, listen: 0, items: [] });
  d.pages += pages; d.secs += secs; d.words += words; d.listen += listen;
  if (itemId && !d.items.includes(itemId)) d.items.push(itemId);
  // Activity by hour of day, in rough "seconds of reading" (a page counts as 30 s).
  const h = new Date().getHours();
  st.hours ||= Array(24).fill(0);
  st.hours[h] += secs + listen + pages * 30;
  kvSet("stats", st);
  document.dispatchEvent(new CustomEvent("kitsune:stat", { detail: { pages, secs, listen } }));
  if ((pages || secs) && new Date().getHours() < 4) kvSet("lateNight", true);
}
export async function markFinished(id) {
  if (settings.incognito) return;
  const st = await kvGet("stats", { days: {}, finished: [] });
  if (!st.finished.some((f) => f.id === id)) { st.finished.push({ id, at: Math.floor(Date.now() / 1000) }); kvSet("stats", st); document.dispatchEvent(new Event("kitsune:finished")); }
}
// Streak freezes: every full week of a streak earns one (you can hold two). A freeze is used up by itself
// to cover a day you missed, so one busy day doesn't wipe out a long streak.
export async function streak() {
  const st = await kvGet("stats", { days: {} });
  const fz = { have: 0, used: [], start: "", weeks: 0, ...(st.freeze || {}) };
  const before = JSON.stringify(fz);
  const read = (k) => { const x = st.days?.[k]; return !!x && !!(x.pages || x.secs > 60 || x.listen > 60); };
  const active = (k) => read(k) || fz.used.includes(k);
  const d = new Date();
  if (!active(today(d))) d.setDate(d.getDate() - 1);
  let n = 0, first = true;
  const saved = [];
  for (;;) {
    if (active(today(d))) { if (read(today(d))) n++; first = false; d.setDate(d.getDate() - 1); continue; }
    // A missed day: freezes cover it if the streak carries on just before the gap.
    if ((n > 0 || first) && fz.have > 0) {
      const probe = new Date(d), gap = [];
      while (gap.length < fz.have && !active(today(probe))) { gap.push(today(probe)); probe.setDate(probe.getDate() - 1); }
      if (gap.length && read(today(probe))) { fz.used.push(...gap); fz.have -= gap.length; saved.push(...gap); d.setTime(probe.getTime()); first = false; continue; }
    }
    break;
  }
  // Earn: one freeze per full week of this streak, up to two held at once.
  if (n) {
    const s = new Date(d); s.setDate(s.getDate() + 1);
    const start = today(s), weeks = Math.floor(n / 7);
    const prev = fz.start && fz.start >= start ? fz.weeks : 0; // the same streak (or one it grew into) keeps what it earned
    if (weeks > prev) fz.have = Math.min(2, fz.have + (weeks - prev));
    fz.start = start; fz.weeks = Math.max(prev, weeks);
  }
  fz.used = fz.used.filter((k) => Date.now() - new Date(k).getTime() < 400 * 86400_000);
  if (JSON.stringify(fz) !== before) { st.freeze = fz; await kvSet("stats", { ...st }); }
  if (saved.length) import("./util.js").then((u) => u.toast(`A streak freeze covered ${saved.length === 1 ? "a day you missed" : `${saved.length} days you missed`}. Your ${n}-day streak is safe.`, { ms: 6000 }));
  return n;
}
export async function streakFreezes() { return (await kvGet("stats", { days: {} })).freeze?.have || 0; }

// Mark titles read or unread by hand (for volumes you read elsewhere). This sets the position only: it doesn't
// add reading time or count towards stats, streaks or the Den.
export async function markRead(items, read = true) {
  const p = { ...(await kvGet("progress", {})) };
  const now = Math.floor(Date.now() / 1000);
  for (const it of items) {
    if (read) { const total = it.pages || p[it.id]?.total || 1; p[it.id] = { ...(p[it.id] || {}), pos: total - 1, total, updated: now }; it.status = "completed"; }
    else { Reflect.deleteProperty(p, it.id); it.status = "unread"; }
    await idb.put("items", it);
  }
  kvSet("progress", p);
  await loadLibrary();
}
// Seconds spent in one title, and a finish estimate from the pace so far.
export async function titleTime(id) {
  const st = await kvGet("stats", { days: {} });
  const secs = st.itemSecs?.[id] || 0;
  const pct = progressPct(await getProgress(id));
  const left = pct >= 3 && pct < 100 && secs > 120 ? (secs * (100 - pct)) / pct : null;
  // Recent pace in this title: average seconds per day over the days you opened it in the last two weeks.
  const recent = Object.entries(st.days || {}).filter(([d, v]) => (v.items || []).includes(id) && Date.now() - new Date(d).getTime() < 14 * 86400_000).length;
  const perDay = recent ? Math.max(300, secs / Math.max(recent, Object.values(st.days || {}).filter((v) => (v.items || []).includes(id)).length)) : null;
  const doneBy = left && perDay ? new Date(Date.now() + Math.ceil(left / perDay) * 86400_000) : null;
  return { secs, left, doneBy, pct };
}

// Tracks active reading time while a reader is open.
export function sessionTimer(itemId, kind = "secs") {
  let last = Date.now(), lastInput = Date.now(), stopped = false;
  const bump = () => (lastInput = Date.now());
  ["pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((e) => addEventListener(e, bump, { passive: true, capture: true }));
  const tick = () => {
    const now = Date.now();
    if (!document.hidden && (kind === "listen" || now - lastInput < 180_000)) logStat({ [kind]: Math.round((now - last) / 1000), itemId });
    last = now;
  };
  const iv = setInterval(tick, 15_000);
  return { bump, stop() { if (stopped) return; stopped = true; tick(); clearInterval(iv); ["pointerdown", "keydown", "wheel", "touchstart", "scroll"].forEach((e) => removeEventListener(e, bump, { capture: true })); } };
}

// How many titles you'd expect to have finished by today for this year's goal. The goal is spread over the part of
// the year since you started reading in Kitsune, so someone who joins in November isn't told they're behind.
export async function expectedByNow(goal) {
  const now = new Date(), y = now.getFullYear();
  const jan1 = new Date(y, 0, 1), end = new Date(y + 1, 0, 1);
  const days = Object.keys((await kvGet("stats", { days: {} })).days || {}).filter((d) => d.startsWith(String(y))).sort();
  const first = days[0] ? new Date(days[0] + "T00:00:00") : now;
  const start = first > jan1 ? first : jan1;
  return Math.max(0, (goal * (now - start)) / Math.max(1, end - start));
}

// ---------- dark at night: a schedule for the light and dark themes ----------
// null when there's no schedule; otherwise whether it's night right now.
export function nightNow(d = new Date()) {
  const s = settings.nightSchedule; if (!s?.on) return null;
  const mins = (t) => { const [h, m] = String(t || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const now = d.getHours() * 60 + d.getMinutes(), from = mins(s.from || "20:00"), to = mins(s.to || "07:00");
  return from <= to ? now >= from && now < to : now >= from || now < to;
}
{ let lastNight = null; setInterval(() => { const n = nightNow(); if (n !== lastNight) { lastNight = n; if (n != null && !/^(preset|custom):/.test(settings.theme || "")) applyTheme(); } }, 60_000); }
