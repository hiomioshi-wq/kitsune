// Shared state for Kitsune Plus features. Saved in kv "plus", which syncs with the rest of the app.
import { kvGet, kvSet, kvFlush } from "../store.js";
import { ls } from "../util.js";
const BLANK = () => ({ custom: [], earned: {}, bank: { mon: 0, shells: 0, ink: 0, eggCare: 0, luck: 0 }, seen: {}, letters: [], stickers: [], podcasts: [], cards: [], photos: [], vn: [], gifts: {}, shelf: {}, tracks: [], radio: {} });
let S = null;
export async function plus() { if (!S) S = { ...BLANK(), ...(await kvGet("plus", {})) }; for (const [k, v] of Object.entries(BLANK())) S[k] ??= v; return S; }
export const savePlus = () => { if (S) kvSet("plus", S); };
export const flushPlus = () => { savePlus(); kvFlush(); };
export const pref = (k, d) => { const v = ls.get("plus:" + k); return v === null || v === undefined ? d : v; };
export const setPref = (k, v) => { ls.set("plus:" + k, v); document.dispatchEvent(new CustomEvent("kitsune:plus", { detail: { k, v } })); };
export async function bank(add) { const s = await plus(); for (const [k, v] of Object.entries(add)) s.bank[k] = (s.bank[k] || 0) + v; savePlus(); }
// Files too large for settings live in their own small database.
let dbp = null;
const db = () => (dbp ||= new Promise((ok, no) => { const r = indexedDB.open("kitsune-plus", 1); r.onupgradeneeded = () => r.result.createObjectStore("blobs"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }));
const tx = async (mode, f) => { const d = await db(); return new Promise((ok, no) => { const t = d.transaction("blobs", mode), q = f(t.objectStore("blobs")); t.oncomplete = () => ok(q?.result); t.onerror = () => no(t.error); t.onabort = () => no(t.error); }); };
export const blobPut = (k, v) => tx("readwrite", (s) => s.put(v, k));
export const blobGet = (k) => tx("readonly", (s) => s.get(k));
export const blobDel = (k) => tx("readwrite", (s) => s.delete(k));
export const zineInbox = { pages: null, text: "" };
export const encode = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const decode = (t) => JSON.parse(decodeURIComponent(escape(atob(t.trim().replace(/-/g, "+").replace(/_/g, "/")))));
export const dl = (blob, name) => { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); };
