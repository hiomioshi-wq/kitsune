// Feeds in the background: an unread count on the sidebar's Feeds link, and a quiet refresh of your feeds when the app
// opens (at most every 30 minutes, a handful of feeds at a time) so new articles are waiting when you get there.
import * as F from "./feedlib.js";
import { kvGet, kvSet } from "./store.js";

let busy = false;
export async function unreadCount() {
  const [subs, items, read] = await Promise.all([F.getSubs(), F.getItems(), F.getRead()]);
  let n = 0; for (const s of subs) for (const i of items[s.id] || []) if (!read.has(i.id)) n++;
  return n;
}
export async function paint() {
  try {
    const n = await unreadCount();
    document.querySelectorAll('[data-route="feeds"]').forEach((a) => {
      let c = a.querySelector(".count"); if (!n) { c?.remove(); return; }
      if (!c) { c = document.createElement("span"); c.className = "count"; a.append(c); } c.textContent = n > 99 ? "99+" : String(n);
    });
  } catch {}
}
export async function refreshSoon() {
  if (busy) return; busy = true;
  try {
    const last = (await kvGet("feedsLastRefresh", 0)) || 0; if (Date.now() - last < 30 * 60_000) return;
    const subs = await F.getSubs(); if (!subs.length || (navigator.onLine === false)) return;
    const items = await F.getItems(); let i = 0, changed = false; const work = subs.slice(0, 16);
    const run = async () => { while (i < work.length) { const s = work[i++]; try { const f = await F.loadFeed(s.url); items[s.id] = f.items; s.checked = Date.now(); changed = true; } catch {} } };
    await Promise.all([run(), run(), run()]);
    if (changed) { await Promise.all([F.setItems(items), F.setSubs(subs)]); }
    kvSet("feedsLastRefresh", Date.now());
  } finally { busy = false; paint(); }
}
export function start() {
  setTimeout(() => { paint(); refreshSoon(); }, 4000);
  addEventListener("hashchange", () => setTimeout(paint, 400));
  setInterval(() => { if (!document.hidden) { refreshSoon(); } }, 10 * 60_000);
}
