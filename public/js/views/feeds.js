// Feeds: follow sites, blogs, webcomics, podcasts' show notes and news in one place. RSS, Atom and JSON Feed, folders,
// unread and starred, OPML import and export, full-article loading, reading aloud. Everything is kept on this device.
import { $, $$, esc, icon, toast, modal, plural, menu, uid } from "../util.js";
import { saveItem, kvGet, kvSet } from "../store.js";
import { setCrumbs } from "../main.js";
import * as F from "../feedlib.js";

const S = { subs: [], items: {}, read: new Set(), stars: {}, view: "all", q: "", open: null, busy: false, errors: {}, collapsed: new Set(), full: {}, unreadOnly: false };
let root = null, keyHandler = null;

const ago = (t) => { if (!t) return ""; const s = (Date.now() - t) / 1000; if (s < 90) return "now"; if (s < 3600) return Math.round(s / 60) + "m"; if (s < 86400) return Math.round(s / 3600) + "h"; if (s < 86400 * 30) return Math.round(s / 86400) + "d"; return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" }); };
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const subOf = (id) => S.subs.find((s) => s.id === id);
const minsOf = (html) => { const w = F.snippet(html || "", 1e6).split(/\s+/).filter(Boolean).length; return w ? Math.max(1, Math.round(w / 200)) : 0; };

function all() { return S.subs.flatMap((s) => (S.items[s.id] || []).map((i) => ({ ...i, feed: s.id }))); }
function list(keepRead = false) {
  let l;
  const v = S.view;
  if (v === "starred") l = Object.values(S.stars);
  else if (v.startsWith("f:")) l = (S.items[v.slice(2)] || []).map((i) => ({ ...i, feed: v.slice(2) }));
  else if (v.startsWith("d:")) { const ids = S.subs.filter((s) => s.folder === v.slice(2)).map((s) => s.id); l = all().filter((i) => ids.includes(i.feed)); }
  else l = all();
  if (v === "unread" || v === "all") { if (v === "unread") l = l.filter((i) => !S.read.has(i.id)); }
  if (v === "today") l = l.filter((i) => Date.now() - i.date < 864e5);
  if (S.q) { const q = S.q.toLowerCase(); l = l.filter((i) => (i.title + " " + F.snippet(i.html, 400)).toLowerCase().includes(q)); }
  if (S.unreadOnly && !keepRead && v !== "unread") l = l.filter((i) => !S.read.has(i.id));
  return l.sort((a, b) => b.date - a.date).slice(0, 400);
}
const unreadOf = (ids) => ids.reduce((n, id) => n + (S.items[id] || []).filter((i) => !S.read.has(i.id)).length, 0);

export async function render(view, _n, params = []) {
  setCrumbs([["Feeds", "feeds"]]);
  root = view;
  [S.subs, S.items, S.read, S.stars, S.unreadOnly] = await Promise.all([F.getSubs(), F.getItems(), F.getRead(), F.getStars(), kvGet("feedUnreadOnly", false)]);
  if (params[0] === "add" && params[1]) { S.pendingAdd = decodeURIComponent(params[1]); }
  draw();
  if (S.pendingAdd) { const u = S.pendingAdd; S.pendingAdd = null; addFeed(u); }
  const stale = S.subs.filter((s) => !s.checked || Date.now() - s.checked > 15 * 60_000);
  if (stale.length) refresh(stale);
  bindKeys();
}

function draw() {
  const total = unreadOf(S.subs.map((s) => s.id)), folders = [...new Set(S.subs.map((s) => s.folder).filter(Boolean))].sort();
  const row = (v, label, n, extra = "") => `<button type="button" class="fd-nav ${S.view === v ? "on" : ""}" data-v="${esc(v)}" ${extra}><span>${esc(label)}</span>${n ? `<b>${n}</b>` : ""}</button>`;
  const feedRow = (s) => `<button type="button" class="fd-nav fd-sub ${S.view === "f:" + s.id ? "on" : ""}" data-v="f:${s.id}" data-sub="${s.id}"><span>${S.errors[s.id] ? "⚠ " : ""}${esc(s.title)}</span>${unreadOf([s.id]) ? `<b class="fd-mk" data-mark="${s.id}" title="Mark all as read">${unreadOf([s.id])} ✓</b>` : ""}</button>`;
  root.innerHTML = `<div class="fd ${S.open ? "fd-reading" : ""}">
    <aside class="fd-side" aria-label="Feeds">
      <div class="fd-actions"><button class="btn btn-accent btn-sm" type="button" data-a="add">${icon("plus")}Add feed</button><button class="icon-btn" type="button" data-a="refresh" aria-label="Refresh all" title="Refresh all (R)">↻</button><button class="icon-btn" type="button" data-a="more" aria-label="More">⋯</button></div>
      ${row("all", "All articles", total)}${row("unread", "Unread", total)}${row("today", "Today", 0)}${row("starred", "Starred", Object.keys(S.stars).length)}
      ${folders.map((f) => `<div class="fd-folder"><button type="button" class="fd-fh" data-fold="${esc(f)}">${S.collapsed.has(f) ? "▸" : "▾"} ${esc(f)}${unreadOf(S.subs.filter((s) => s.folder === f).map((s) => s.id)) ? `<b>${unreadOf(S.subs.filter((s) => s.folder === f).map((s) => s.id))}</b>` : ""}</button>${S.collapsed.has(f) ? "" : S.subs.filter((s) => s.folder === f).map(feedRow).join("")}</div>`).join("")}
      ${S.subs.filter((s) => !s.folder).map(feedRow).join("")}
    </aside>
    <section class="fd-list" aria-label="Articles">${S.subs.length ? `<form class="fd-search" id="fd-sf"><input class="field" id="fd-q" type="search" placeholder="Search articles ( / )" value="${esc(S.q)}" aria-label="Search articles"></form><div class="chips" id="fd-tools" style="padding:0 10px 8px"></div><div id="fd-items"></div>` : welcome()}</section>
    <article class="fd-read" id="fd-read" aria-label="Article"></article></div>`;
  fillList(); fillReader(); wire();
}

function welcome() {
  return `<div class="fd-welcome"><h2>Follow what you like</h2><p class="muted">Add a site's address and Kitsune finds its feed. New articles show up here, with no account and no algorithm. Your list stays on this device (export it any time as OPML).</p>
    <div class="fd-starters">${F.STARTERS.map(([n, u, f]) => `<button class="chip" type="button" data-start="${esc(u)}" data-folder="${esc(f)}">+ ${esc(n)}</button>`).join("")}</div>
    <p style="margin-top:14px"><button class="btn" type="button" data-a="add">Add by address</button> <button class="btn" type="button" data-a="import">Import OPML</button></p></div>`;
}

function fillList() {
  const box = $("#fd-items", root); if (!box) return;
  const l = list(), raw = list(true), un = raw.filter((i) => !S.read.has(i.id)).length, tools = $("#fd-tools", root);
  if (tools) tools.innerHTML = `<button class="chip" type="button" data-a="unreadOnly" aria-pressed="${!!S.unreadOnly}">${S.unreadOnly ? "●" : "○"} Unread only</button><span class="chip" style="cursor:default">${un} unread of ${raw.length}</span>`;
  box.innerHTML = l.length ? l.map((i) => { const m = minsOf(i.html); return `<button type="button" class="fd-item ${S.read.has(i.id) ? "read" : ""} ${S.open === i.id ? "on" : ""}" data-id="${esc(i.id)}">${i.thumb ? `<img src="${esc(i.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<span class="fd-t"><strong>${esc(i.title)}</strong><small>${esc(subOf(i.feed)?.title || i.feedTitle || "")} · ${ago(i.date)}${m ? ` · ${m} min read` : ""}${S.stars[i.id] ? " · ★" : ""}</small><em>${esc(F.snippet(i.html))}</em></span></button>`; }).join("")
    : `<p class="muted" style="padding:16px">${S.view === "unread" || S.unreadOnly ? "You’re all caught up." : S.view === "starred" ? "Star an article to keep it here." : S.q ? "Nothing matches that." : "Nothing here yet."}</p>`;
}

function fillReader() {
  const el = $("#fd-read", root); if (!el) return;
  const i = all().concat(Object.values(S.stars)).find((x) => x.id === S.open);
  if (!i) { el.innerHTML = `<div class="fd-empty muted">${S.subs.length ? "Pick an article. J and K move, M marks read, S stars." : ""}</div>`; return; }
  const body = S.full[i.id] || F.clean(i.html || "", i.link || "");
  el.innerHTML = `<div class="fd-rbar"><button class="icon-btn fd-back" type="button" data-a="close" aria-label="Back to the list">${icon("back")}</button><span class="fd-rbtns">
    <button class="btn btn-sm" type="button" data-a="open">Open in Browser</button><button class="btn btn-sm" type="button" data-a="full">Full article</button><button class="btn btn-sm" type="button" data-a="lib">Save to library</button><button class="btn btn-sm" type="button" data-a="star">${S.stars[i.id] ? "★ Starred" : "☆ Star"}</button><button class="btn btn-sm" type="button" data-a="unread">Mark unread</button><button class="btn btn-sm" type="button" data-a="above">Mark above read</button><button class="btn btn-sm" type="button" data-a="say">Read aloud</button></span></div>
    <h1 class="fd-h">${esc(i.title)}</h1><p class="muted fd-by">${esc([i.author, subOf(i.feed)?.title || i.feedTitle, i.date ? new Date(i.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""].filter(Boolean).join(" · "))}</p>
    ${i.media?.url && /^https?:/.test(i.media.url) ? (/^video/.test(i.media.type) || /\.(mp4|webm)(\?|$)/i.test(i.media.url) ? `<video class="fd-media" controls preload="none" src="${esc(i.media.url)}"></video>` : `<audio class="fd-media" controls preload="none" src="${esc(i.media.url)}"></audio>`) : ""}<div class="fd-body">${body || `<p class="muted">This feed only sent a headline. Try “Full article”.</p>`}</div>`;
  el.scrollTop = 0;
}

async function openArticle(id) {
  S.open = id; if (!S.read.has(id)) { S.read.add(id); F.setRead(S.read); }
  $("#fd-items", root)?.querySelectorAll(".on").forEach((n) => n.classList.remove("on"));
  const b = $(`[data-id="${CSS.escape(id)}"]`, root); b?.classList.add("on", "read"); $(".fd", root).classList.add("fd-reading");
  fillReader(); refreshCounts();
}
function refreshCounts() { const keep = $("#fd-q", root)?.value; const sc = $(".fd-list", root)?.scrollTop; const side = $(".fd-side", root); const tmp = document.createElement("div"); draw(); const q = $("#fd-q", root); if (q && keep) q.value = keep; const l = $(".fd-list", root); if (l && sc) l.scrollTop = sc; void side; void tmp; }

function wire() {
  root.onclick = async (e) => {
    const t = e.target;
    const fold = t.closest("[data-fold]"); if (fold) { const f = fold.dataset.fold; S.collapsed.has(f) ? S.collapsed.delete(f) : S.collapsed.add(f); return draw(); }
    const start = t.closest("[data-start]"); if (start) { start.disabled = true; await addFeed(start.dataset.start, start.dataset.folder); return; }
    const mk = t.closest("[data-mark]"); if (mk) { const id = mk.dataset.mark, n = (S.items[id] || []).filter((x) => !S.read.has(x.id)).length; (S.items[id] || []).forEach((x) => S.read.add(x.id)); F.setRead(S.read); toast(`Marked ${plural(n, "article")} read in ${subOf(id)?.title || "this feed"}.`); return draw(); }
    const nav = t.closest("[data-v]"); if (nav) { S.view = nav.dataset.v; S.open = null; return draw(); }
    const it = t.closest(".fd-item"); if (it) return openArticle(it.dataset.id);
    const a = t.closest("[data-a]")?.dataset.a; if (!a) return;
    const art = all().concat(Object.values(S.stars)).find((x) => x.id === S.open);
    if (a === "add") return addDialog();
    if (a === "import") return importOpml();
    if (a === "refresh") return refresh(S.subs, true);
    if (a === "more") return moreMenu(t.closest("[data-a]"));
    if (a === "close") { S.open = null; return draw(); }
    if (a === "unreadOnly") { S.unreadOnly = !S.unreadOnly; kvSet("feedUnreadOnly", S.unreadOnly); return draw(); }
    if (!art) return;
    if (a === "open") return (location.hash = "web/" + encodeURIComponent(art.link));
    if (a === "lib") {
      const html = S.full[art.id] || F.clean(art.html || "", art.link || "");
      if (!html.trim()) return toast("This feed only sent a headline. Use “Full article” first.");
      const item = await saveItem({ id: uid("v-"), type: "book", title: art.title, author: art.author || subOf(art.feed)?.title || host(art.link),
        source: { kind: "wiki", cachedHtml: html, url: art.link, wiki: subOf(art.feed)?.title || host(art.link), license: "" }, origin: `Saved from ${subOf(art.feed)?.title || host(art.link)}`, tags: ["saved pages", "feeds"], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000) });
      return toast(`Saved “${item.title}” to your library.`, { action: "Read", onAction: async () => (await import("./common.js")).openItem(item) });
    }
    if (a === "above") { const l = list(); const i = l.findIndex((x) => x.id === S.open); l.slice(0, i).forEach((x) => S.read.add(x.id)); F.setRead(S.read); toast("Marked everything above as read."); return draw(); }
    if (a === "star") { S.stars[art.id] ? delete S.stars[art.id] : (S.stars[art.id] = { ...art, feedTitle: subOf(art.feed)?.title || art.feedTitle }); F.setStars(S.stars); toast(S.stars[art.id] ? "Starred." : "Star removed."); return refreshKeep(); }
    if (a === "unread") { S.read.delete(art.id); F.setRead(S.read); return refreshKeep(); }
    if (a === "full") { try { toast("Loading the full article…", { ms: 1500 }); S.full[art.id] = await F.fullArticle(art.link); fillReader(); } catch (err) { toast(err.message); } return; }
    if (a === "say") { if (speechSynthesis.speaking) return speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(art.title + ". " + ($(".fd-body", root)?.innerText || "").slice(0, 12000)); u.lang = document.documentElement.lang || "en"; speechSynthesis.speak(u); }
  };
  root.onsubmit = (e) => e.preventDefault();
  const q = $("#fd-q", root); if (q) q.oninput = () => { S.q = q.value; fillList(); };
  root.oncontextmenu = (e) => { const s = e.target.closest("[data-sub]"); if (s) { e.preventDefault(); subMenu(s, s.dataset.sub); } };
  let press; root.addEventListener("pointerdown", (e) => { const s = e.target.closest("[data-sub]"); if (!s) return; press = setTimeout(() => subMenu(s, s.dataset.sub), 550); }); root.addEventListener("pointerup", () => clearTimeout(press)); root.addEventListener("pointerleave", () => clearTimeout(press));
}
const refreshKeep = () => { fillReader(); fillList(); const b = $(".fd-side", root); void b; refreshCounts(); };

function subMenu(anchor, id) {
  const s = subOf(id); if (!s) return;
  menu(anchor, [
    { label: "Open the site", icon: "globe", run: () => (location.hash = "web/" + encodeURIComponent(s.site || new URL(s.url).origin)) },
    { label: "Mark all read", icon: "check", run: () => { (S.items[id] || []).forEach((i) => S.read.add(i.id)); F.setRead(S.read); draw(); } },
    { label: "Rename…", icon: "edit", run: async () => { const n = prompt("Name", s.title); if (n) { s.title = n.trim(); await F.setSubs(S.subs); draw(); } } },
    { label: "Move to a folder…", icon: "folder", run: async () => { const n = prompt("Folder (empty for none)", s.folder || ""); if (n != null) { s.folder = n.trim(); await F.setSubs(S.subs); draw(); } } },
    { label: "Unsubscribe", icon: "trash", run: async () => { S.subs = S.subs.filter((x) => x.id !== id); delete S.items[id]; await Promise.all([F.setSubs(S.subs), F.setItems(S.items)]); if (S.view === "f:" + id) S.view = "all"; draw(); toast(`Unsubscribed from ${s.title}.`); } },
  ]);
}
function moreMenu(anchor) {
  menu(anchor, [
    { label: "Mark everything read", icon: "check", run: () => { all().forEach((i) => S.read.add(i.id)); F.setRead(S.read); draw(); } },
    { label: "Import OPML…", icon: "upload", run: importOpml },
    { label: "Export OPML", icon: "download", run: () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([F.toOpml(S.subs)], { type: "text/x-opml" })); a.download = "kitsune-feeds.opml"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); } },
    { label: "Starter feeds…", icon: "plus", run: () => { S.subs.length ? starterDialog() : toast("They’re shown on the empty page."); } },
  ]);
}
function starterDialog() {
  const m = modal({ title: "Starter feeds", body: `<div class="fd-starters">${F.STARTERS.filter(([, u]) => !S.subs.some((s) => s.url === u)).map(([n, u, f]) => `<button class="chip" type="button" data-start="${esc(u)}" data-folder="${esc(f)}">+ ${esc(n)}</button>`).join("") || "<p class='muted'>You already follow them all.</p>"}</div>` });
  m.root.onclick = async (e) => { const b = e.target.closest("[data-start]"); if (b) { b.disabled = true; await addFeed(b.dataset.start, b.dataset.folder); b.textContent = "✓ added"; } };
}
function addDialog() {
  const m = modal({ title: "Add a feed", body: `<form class="form" id="fd-af"><label class="lbl" for="fd-u">Feed or website address</label><input class="field" id="fd-u" required autofocus placeholder="example.com or https://example.com/feed.xml"><label class="lbl" for="fd-fo">Folder (optional)</label><input class="field" id="fd-fo" placeholder="News, Comics, …" list="fd-fl"><datalist id="fd-fl">${[...new Set(S.subs.map((s) => s.folder).filter(Boolean))].map((f) => `<option value="${esc(f)}">`).join("")}</datalist><p class="hint">Give any site’s address. Kitsune looks for its feed (RSS, Atom or JSON Feed) and checks the usual places too.</p><p class="status" id="fd-as" aria-live="polite"></p></form>`, actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="fd-af">Add</button>` });
  $("#fd-af", m.root).onsubmit = async (e) => { e.preventDefault(); $("#fd-as", m.root).textContent = "Looking for a feed…"; const ok = await addFeed($("#fd-u", m.root).value, $("#fd-fo", m.root).value.trim(), (t) => ($("#fd-as", m.root).textContent = t)); if (ok) m.close(); };
}
async function addFeed(input, folder = "", say) {
  try {
    const r = await F.subscribe(input, folder);
    S.subs = await F.getSubs(); S.items = await F.getItems(); S.view = "f:" + r.sub.id;
    if (r.existed) toast(`You already follow ${r.sub.title}.`); else toast(`Following ${r.sub.title}.`);
    draw(); return true;
  } catch (e) { say ? say(e.message) : toast(e.message); return false; }
}
function importOpml() {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".opml,.xml,text/xml";
  inp.onchange = async () => {
    try {
      const list = F.parseOpml(await inp.files[0].text()), have = new Set(S.subs.map((s) => s.url)); let n = 0;
      for (const f of list) if (!have.has(f.url)) { S.subs.push({ id: "f" + F.hash(f.url), url: f.url, title: f.title || host(f.url), site: f.site, folder: f.folder || "", added: Date.now() }); n++; }
      await F.setSubs(S.subs); draw(); toast(`Added ${plural(n, "feed")}. Loading their articles…`); refresh(S.subs.filter((s) => !S.items[s.id]));
    } catch (e) { toast(e.message); }
  };
  inp.click();
}

async function refresh(subs, loud = false) {
  if (S.busy || !subs.length) return; S.busy = true;
  const btn = $('[data-a="refresh"]', root); btn?.classList.add("spin");
  let i = 0, fresh = 0;
  const work = async () => {
    while (i < subs.length) {
      const s = subs[i++];
      try {
        const f = await F.loadFeed(s.url); delete S.errors[s.id];
        const known = new Set((S.items[s.id] || []).map((x) => x.id)); fresh += f.items.filter((x) => !known.has(x.id) && !S.read.has(x.id)).length;
        S.items[s.id] = f.items; s.checked = Date.now(); if (!s.site && f.site) s.site = f.site; if (!s.title && f.title) s.title = f.title;
      } catch (e) { S.errors[s.id] = e.message; s.checked = Date.now(); }
    }
  };
  await Promise.all([work(), work(), work(), work()]);
  await Promise.all([F.setItems(S.items), F.setSubs(S.subs)]);
  S.busy = false;
  if (root?.isConnected) { const keepOpen = S.open; draw(); S.open = keepOpen; if (loud) toast(fresh ? `${plural(fresh, "new article")}.` : "Nothing new."); }
}

function bindKeys() {
  if (keyHandler) removeEventListener("keydown", keyHandler);
  keyHandler = (e) => {
    if (!root?.isConnected || !location.hash.startsWith("#feeds") || e.metaKey || e.ctrlKey || e.altKey || document.querySelector(".modal")) return;
    if (e.target.matches?.("input, textarea, select")) { if (e.key === "Escape") e.target.blur(); return; }
    const l = list(), idx = l.findIndex((x) => x.id === S.open), k = e.key;
    if (k === "j" || k === "k") { e.preventDefault(); const n = l[Math.max(0, Math.min(l.length - 1, idx + (k === "j" ? 1 : -1)))]; if (n) { openArticle(n.id); $(`[data-id="${CSS.escape(n.id)}"]`, root)?.scrollIntoView({ block: "nearest" }); } }
    else if (k === "m" && S.open) { S.read.has(S.open) ? S.read.delete(S.open) : S.read.add(S.open); F.setRead(S.read); refreshKeep(); }
    else if (k === "s" && S.open) $('[data-a="star"]', root)?.click();
    else if ((k === "o" || k === "Enter") && S.open) $('[data-a="open"]', root)?.click();
    else if (k === "r") refresh(S.subs, true);
    else if (k === "l" && S.open) $('[data-a="lib"]', root)?.click();
    else if (k === "a" && S.open) $('[data-a="above"]', root)?.click();
    else if (k === "A") { all().forEach((i) => S.read.add(i.id)); F.setRead(S.read); draw(); }
    else if (k === "/") { e.preventDefault(); $("#fd-q", root)?.focus(); }
    else if (k === "Escape" && S.open) { S.open = null; draw(); }
  };
  addEventListener("keydown", keyHandler);
}
