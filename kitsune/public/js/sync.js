// Sync between devices without an account: a sync file in a folder your cloud drive already syncs
// (iCloud Drive, Dropbox, OneDrive, Google Drive), or a sync code you paste on the other device.
// Both carry the same snapshot and merge it, so nothing is overwritten: the newest position wins,
// highlights and bookmarks are combined, and reading days keep the larger counts.
import { idb, kvGet, kvSet, kvFlush, lib, loadLibrary } from "./store.js";

const KEYS = ["progress", "bookmarks", "highlights", "stats", "vocab", "readingSpeed", "denFur", "seriesPrefs", "queue", "wishlist"];
const FILE_KEY = "syncFile";

// Library entries that can be rebuilt anywhere (originals, public-domain books, links). Your own files stay put.
const portable = (it) => !["blobs", "server"].includes(it.source?.kind) && !it.source?.blob;

export async function snapshot() {
  kvFlush();
  const kv = {};
  for (const k of KEYS) { const v = await kvGet(k, undefined); if (v !== undefined) kv[k] = v; }
  const items = lib.items.filter(portable).map((it) => { const c = { ...it, source: { ...it.source } }; delete c.coverBlob; delete c.offline; delete c.offlineBytes; delete c.source.epubBlob; return c; });
  return { app: "Kitsune", sync: 1, at: Date.now(), kv, items };
}

const sameMark = (a, b) => (a.pos === b.pos && (a.text || "") === (b.text || "")) || (a.created && a.created === b.created);
function mergeLists(mine = {}, theirs = {}) {
  const out = { ...mine };
  for (const [id, list] of Object.entries(theirs || {})) {
    const cur = out[id] || [];
    out[id] = [...cur, ...(list || []).filter((x) => !cur.some((y) => sameMark(x, y)))];
  }
  return out;
}
function mergeStats(mine = { days: {}, finished: [] }, theirs = { days: {}, finished: [] }) {
  const days = { ...(mine.days || {}) };
  for (const [d, v] of Object.entries(theirs.days || {})) {
    const c = days[d];
    days[d] = !c ? v : { pages: Math.max(c.pages || 0, v.pages || 0), secs: Math.max(c.secs || 0, v.secs || 0), words: Math.max(c.words || 0, v.words || 0), listen: Math.max(c.listen || 0, v.listen || 0), items: [...new Set([...(c.items || []), ...(v.items || [])])] };
  }
  const finished = [...(mine.finished || [])];
  for (const f of theirs.finished || []) if (!finished.some((x) => x.id === f.id)) finished.push(f);
  const hours = Array.from({ length: 24 }, (_, h) => Math.max(mine.hours?.[h] || 0, theirs.hours?.[h] || 0));
  const itemSecs = { ...(mine.itemSecs || {}) };
  for (const [id, v] of Object.entries(theirs.itemSecs || {})) itemSecs[id] = Math.max(itemSecs[id] || 0, v);
  return { ...mine, days, finished, hours, itemSecs };
}

export async function merge(snap) {
  if (snap?.app !== "Kitsune" || !snap.sync) throw new Error("That isn't Kitsune sync data.");
  let newItems = 0;
  for (const it of snap.items || []) if (!lib.items.some((x) => x.id === it.id)) { await idb.put("items", it); newItems++; }
  const t = snap.kv || {};
  const mine = {};
  for (const k of KEYS) mine[k] = await kvGet(k, undefined);
  if (t.progress) {
    const p = { ...(mine.progress || {}) };
    for (const [id, v] of Object.entries(t.progress)) if (!p[id] || (v.updated || 0) > (p[id].updated || 0)) p[id] = v;
    kvSet("progress", p);
  }
  if (t.bookmarks) kvSet("bookmarks", mergeLists(mine.bookmarks, t.bookmarks));
  if (t.highlights) kvSet("highlights", mergeLists(mine.highlights, t.highlights));
  if (t.stats) kvSet("stats", mergeStats(mine.stats, t.stats));
  if (t.vocab) { const cur = mine.vocab || []; kvSet("vocab", [...cur, ...t.vocab.filter((w) => !cur.some((c) => (c.word || c.w) === (w.word || w.w)))]); }
  if (t.queue) kvSet("queue", [...new Set([...(mine.queue || []), ...t.queue])]);
  if (t.wishlist) { const cur = mine.wishlist || []; kvSet("wishlist", [...cur, ...t.wishlist.filter((w) => !cur.some((c) => c.id === w.id))]); }
  if (t.seriesPrefs) kvSet("seriesPrefs", { ...t.seriesPrefs, ...(mine.seriesPrefs || {}) });
  if (t.readingSpeed && (!mine.readingSpeed || (t.readingSpeed.secs || 0) > (mine.readingSpeed.secs || 0))) kvSet("readingSpeed", t.readingSpeed);
  if (t.denFur && !mine.denFur) kvSet("denFur", t.denFur);
  kvFlush();
  if (newItems) await loadLibrary();
  return { newItems, progress: Object.keys(t.progress || {}).length };
}

// ---------- sync code (any device) ----------
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }

export async function makeCode() {
  const json = new TextEncoder().encode(JSON.stringify(await snapshot()));
  const z = "CompressionStream" in window ? await pipe(json, new CompressionStream("gzip")) : null;
  let out = "";
  const bytes = z || json;
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return "KITSUNE1" + (z ? "z" : "j") + btoa(out).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export async function readCode(code) {
  const c = code.trim().replace(/\s+/g, "");
  if (!c.startsWith("KITSUNE1")) throw new Error("That isn't a Kitsune sync code.");
  const raw = unb64url(c.slice(9));
  const bytes = c[8] === "z" ? await pipe(raw, new DecompressionStream("gzip")) : raw;
  return merge(JSON.parse(new TextDecoder().decode(bytes)));
}
void b64url;

// ---------- sync file (Chrome and Edge on a computer) ----------
export const fileSyncSupported = () => "showSaveFilePicker" in window;
export async function syncFileHandle() { return (await idb.get("kv", FILE_KEY))?.v || null; }

export async function chooseSyncFile() {
  const h = await window.showSaveFilePicker({ suggestedName: "kitsune-sync.json", types: [{ description: "Kitsune sync", accept: { "application/json": [".json"] } }] });
  await idb.put("kv", { k: FILE_KEY, v: h });
  return syncNow({ ask: true });
}
export async function forgetSyncFile() { await idb.put("kv", { k: FILE_KEY, v: null }); localStorage.removeItem("kitsune.lastSync"); }

// Read the file (merging whatever another device wrote), then write the merged result back.
export async function syncNow({ ask = false } = {}) {
  const h = await syncFileHandle();
  if (!h) return null;
  const perm = await h.queryPermission?.({ mode: "readwrite" });
  if (perm !== "granted") { if (!ask || (await h.requestPermission?.({ mode: "readwrite" })) !== "granted") return { needsPermission: true }; }
  let res = { newItems: 0, progress: 0 };
  const f = await h.getFile();
  if (f.size) { try { res = await merge(JSON.parse(await f.text())); } catch { /* a fresh or damaged file is simply overwritten */ } }
  const w = await h.createWritable();
  await w.write(JSON.stringify(await snapshot()));
  await w.close();
  try { localStorage.setItem("kitsune.lastSync", String(Date.now())); } catch {}
  return res;
}

// Quietly sync on open and every few minutes while the app is in use (only once permission is already given).
let timer = 0;
export function startAutoSync() {
  if (!fileSyncSupported()) return;
  const tick = () => syncNow().catch(() => {});
  tick();
  clearInterval(timer);
  timer = setInterval(() => { if (!document.hidden) tick(); }, 4 * 60_000);
  addEventListener("pagehide", tick);
  document.addEventListener("visibilitychange", () => { if (document.hidden) tick(); });
}
