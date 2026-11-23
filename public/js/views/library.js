import { $, $$, esc, icon, coverHtml, api, plural, ls, toast, timeAgo, fmtDuration, naturalCompare, modal, contentNotes, confirmBox } from "../util.js";
import { lib, coverSrc, allProgress, progressPct, seriesGroups, seriesKey, getItem, saveItem, rescanFolder, kvGet, kvSet, getMarks, getQueue, setQueue, toggleQueue, canDownload, removeDownload } from "../store.js";
import { itemCard, itemRow, wireItems, openItem, STATUS, TYPE_LABEL, editItem, linkToAniList, removeItems, statusMenu, getCopies, editCopy, copiesHtml, emptyState, downloadDialog } from "./common.js";
import { setCrumbs } from "../main.js";
import { shelfSpines } from "./home.js";

export async function render(view, name, params) {
  if (name === "item") return renderItem(view, params[0]);
  if (name === "series") return renderSeries(view, params[0]);
  if (params[0] === "tracking") return renderTracking(view);
  if (params[0] === "queue") return renderQueue(view);
  if (params[0] === "collections") return renderCollections(view);
  if (params[0] === "wishlist") return renderWishlist(view);
  if (params[0] === "trash") return renderTrash(view);
  return renderLibrary(view, params[0] || ls.get("libTab", "all"), params[1] || "");
}

const LIB_TABS = [["all", "All"], ["manga", "Manga"], ["series", "Series"], ["book", "Books"], ["audio", "Audiobooks"], ["collections", "Collections"], ["queue", "Up next"], ["wishlist", "Wishlist"], ["tracking", "Tracking"], ["trash", "Recently deleted"]];

// ---------- wishlist: series you want to buy ----------
async function renderTrash(view) {
  setCrumbs([["Library", "library"], ["Recently deleted", ""]]);
  const { getTrash, restoreItem, purgeTrash } = await import("../store.js");
  const list = await getTrash();
  const daysLeft = (at) => Math.max(1, 30 - Math.floor((Date.now() - at) / 86400_000));
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Your library</p><h1 class="h1">Recently deleted</h1>
      <p class="lede">Titles you remove wait here for 30 days with their files and reading position, then they're gone for good.</p></div>
      ${list.length ? `<button class="btn" type="button" id="tr-empty" style="color:var(--bad)">${icon("trash")}Delete all now</button>` : ""}</div>
    ${libTabs("trash")}
    ${list.length ? `<div class="list">${list.map((x) => `<div class="row" style="grid-template-columns:44px minmax(0,1fr) auto">${coverHtml(coverSrc(x.item), x.item.title)}
        <div class="row-main"><strong>${esc(x.item.title)}</strong><span class="sub">Removed ${timeAgo(Math.floor(x.at / 1000))} · ${plural(daysLeft(x.at), "day")} left</span></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm btn-accent" type="button" data-restore="${esc(x.item.id)}">Restore</button><button class="btn btn-sm btn-ghost" type="button" data-purge="${esc(x.item.id)}">Delete now</button></div></div>`).join("")}</div>`
      : emptyState("Nothing here.", "Titles you remove land here for 30 days.", `<a class="btn" href="#library">Back to library</a>`)}`;
  $$(".tabs [data-tab]", view).forEach((b) => b.addEventListener("click", () => (location.hash = "library/" + b.dataset.tab)));
  view.onclick = async (e) => {
    const r = e.target.closest("[data-restore]"), p = e.target.closest("[data-purge]");
    if (r) { await restoreItem(r.dataset.restore); toast("Restored to your library."); renderTrash(view); }
    else if (p) { if (await confirmBox("Delete it for good?", "Its files and reading position are removed from this device. This can't be undone.", "Delete")) { await purgeTrash(p.dataset.purge); renderTrash(view); } }
    else if (e.target.closest("#tr-empty")) { if (await confirmBox(`Delete ${plural(list.length, "title")} for good?`, "Everything in Recently deleted is removed from this device. This can't be undone.", "Delete all")) { await purgeTrash(); renderTrash(view); } }
  };
}

async function renderWishlist(view) {
  setCrumbs([["Library", "library"], ["Wishlist", ""]]);
  const list = await kvGet("wishlist", []);
  const owned = new Set(lib.items.map((i) => i.link?.anilistId).filter(Boolean));
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Your library</p><h1 class="h1">Wishlist</h1>
      <p class="lede">Series you want to buy, with the official stores AniList lists for each. When you get a volume, add it and it moves to your shelf.</p></div>
      <a class="btn" href="#discover">${icon("compass")}Find series</a></div>
    ${libTabs("wishlist")}
    ${list.length ? `<div class="list">${list.map((w) => `<div class="row" style="grid-template-columns:52px minmax(0,1fr) auto;cursor:default">
        <a href="#manga/${w.id}" style="display:block">${coverHtml(w.cover, w.title, { color: w.color, own: owned.has(w.id) })}</a>
        <div class="row-main"><strong><a href="#manga/${w.id}" style="text-decoration:none">${esc(w.title)}</a></strong>
          <span class="sub">${esc([w.volumes ? w.volumes + " volumes" : "", owned.has(w.id) ? `${lib.items.filter((i) => i.link?.anilistId === w.id).length} on your shelf` : "", "added " + timeAgo(w.added)].filter(Boolean).join(" · "))}</span>
          <div class="linkgrid" style="margin-top:6px">${(w.links || []).slice(0, 5).map((l) => `<a class="btn btn-sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.site)} ↗</a>`).join("") || `<span class="muted" style="font-size:12px">AniList lists no official stores for this one.</span>`}</div></div>
        <div class="row-side" style="flex-direction:column;align-items:stretch">
          <a class="btn btn-sm" href="#find/${encodeURIComponent(w.title)}">${icon("search")}Where to read</a>
          <button class="btn btn-sm btn-accent" type="button" data-got="${w.id}">${icon("check")}I got it</button>
          <button class="btn btn-sm btn-ghost" type="button" data-rmw="${w.id}">Remove</button></div></div>`).join("")}</div>`
      : emptyState("Your wishlist is empty.", "Open any series in Discover and choose Add to wishlist.", `<a class="btn" href="#discover">Browse series</a>`)}`;
  $$(".tabs [data-tab]", view).forEach((b) => b.addEventListener("click", () => (location.hash = "library/" + b.dataset.tab)));
  view.addEventListener("click", async (e) => {
    const r = e.target.closest("[data-rmw]"), g = e.target.closest("[data-got]");
    if (r) { kvSet("wishlist", list.filter((w) => w.id !== Number(r.dataset.rmw))); return renderWishlist(view); }
    if (g) {
      const w = list.find((x) => x.id === Number(g.dataset.got));
      kvSet("wishlist", list.filter((x) => x.id !== w.id));
      (await import("./link.js")).openImport(null, { link: { anilistId: w.id, title: w.title, cover: w.cover, color: w.color }, series: w.title });
    }
  });
}

// ---------- collections (your tags, shown as shelves) ----------
async function renderCollections(view) {
  setCrumbs([["Library", "library"], ["Collections", ""]]);
  const prog = await allProgress();
  const tags = new Map();
  for (const it of lib.items) for (const t of it.tags || []) { if (!tags.has(t)) tags.set(t, []); tags.get(t).push(it); }
  const auto = [
    ["Favorites", lib.items.filter((i) => (i.rating || 0) >= 4)],
    ["In progress", lib.items.filter((i) => { const p = progressPct(prog[i.id]); return p > 0 && p < 100; })],
    ["Finished", lib.items.filter((i) => i.status === "completed")],
    ["Saved offline", lib.items.filter((i) => i.offline?.length)],
    ["Public domain", lib.items.filter((i) => ["gutenberg", "librivox"].includes(i.source?.kind) || i.source?.ia)],
  ].filter(([, l]) => l.length);
  const shelf = (name, items, href) => `<a class="card stack" href="${href}">
    <div class="cover" style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:2px;background:var(--line)">${items.slice(0, 4).map((i) => `<img src="${esc(coverSrc(i) || "")}" alt="" loading="lazy" style="position:static;width:100%;height:100%;object-fit:cover" onerror="this.style.visibility='hidden'">`).join("")}</div>
    <span class="card-t">${esc(name)}</span><span class="card-m">${plural(items.length, "item")}</span></a>`;
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Your library</p><h1 class="h1">Collections</h1>
      <p class="lede">Your own collections, plus a few Kitsune keeps for you. Add items to a collection with Edit details or Select → Add to collection.</p></div></div>
    ${libTabs("collections")}
    ${auto.length ? `<h2 class="h2" style="margin-bottom:14px">Smart collections</h2><div class="grid">${auto.map(([n, l]) => shelf(n, l, "#library/smart/" + encodeURIComponent(n))).join("")}</div>` : ""}
    <h2 class="h2" style="margin:36px 0 14px">Your collections</h2>
    ${tags.size ? `<div class="grid">${[...tags].sort((a, b) => naturalCompare(a[0], b[0])).map(([t, l]) => shelf(t, l, "#library/all/" + encodeURIComponent(t))).join("")}</div>`
      : `<p class="muted">None yet. Open an item's ⋯ menu → Edit details → Collections, or select several and choose Add to collection.</p>`}`;
  $$(".tabs [data-tab]", view).forEach((b) => b.addEventListener("click", () => (location.hash = "library/" + b.dataset.tab)));
}
const libTabs = (cur) => `<div class="tabs" role="tablist">${LIB_TABS.map(([k, l]) => `<button role="tab" type="button" data-tab="${k}" aria-selected="${k === cur}">${l}</button>`).join("")}</div>`;

// ---------- Up Next queue ----------
async function renderQueue(view) {
  setCrumbs([["Library", "library"], ["Up next", ""]]);
  const prog = await allProgress();
  const ids = await getQueue();
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Your library</p><h1 class="h1">Up next</h1>
      <p class="lede">Line up what to read or listen to next. Add anything from its ⋯ menu.</p></div>
      ${ids.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="q-share">${icon("link")}Share list</button><button class="btn btn-accent" type="button" id="q-start">${icon("play")}Start the first one</button></div>` : ""}</div>
    ${libTabs("queue")}
    ${ids.length ? `<div class="list" id="q-list">${ids.map((id, i) => { const it = getItem(id); const pct = progressPct(prog[id]); return `
      <div class="row" style="grid-template-columns:auto 52px minmax(0,1fr) auto" data-id="${esc(id)}">
        <span class="mono muted tnum" style="width:2ch;text-align:right">${i + 1}</span>
        ${coverHtml(coverSrc(it), it.title, { pct })}
        <div class="row-main"><strong>${esc(it.title)}</strong><span class="sub">${esc([it.series || it.author, TYPE_LABEL[it.type], pct ? pct + "%" : ""].filter(Boolean).join(" · "))}</span></div>
        <div class="row-side">
          <button class="icon-btn" type="button" data-up="${i}" aria-label="Move up" ${i === 0 ? "disabled" : ""} style="transform:rotate(90deg)">${icon("back")}</button>
          <button class="icon-btn" type="button" data-down="${i}" aria-label="Move down" ${i === ids.length - 1 ? "disabled" : ""} style="transform:rotate(90deg)">${icon("next")}</button>
          <button class="btn btn-sm" type="button" data-go="${esc(id)}">${it.type === "audio" ? "Play" : "Read"}</button>
          <button class="icon-btn" type="button" data-rmq="${esc(id)}" aria-label="Remove from Up next">${icon("x")}</button>
        </div></div>`; }).join("")}</div>`
      : emptyState("Nothing lined up.", "Use “Add to Up Next” in any item's ⋯ menu to build your reading queue.", `<a class="btn" href="#library">Go to library</a>`)}`;
  $$(".tabs [data-tab]", view).forEach((b) => b.addEventListener("click", () => (location.hash = "library/" + b.dataset.tab)));
  $("#q-start", view)?.addEventListener("click", () => openItem(getItem(ids[0])));
  $("#q-share", view)?.addEventListener("click", async () => (await import("./list.js")).shareListDialog(ids.map(getItem).filter(Boolean), "Up next"));
  $("#q-list", view)?.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const q = ids.slice();
    if (b.dataset.up) { const i = Number(b.dataset.up); [q[i - 1], q[i]] = [q[i], q[i - 1]]; }
    else if (b.dataset.down) { const i = Number(b.dataset.down); [q[i + 1], q[i]] = [q[i], q[i + 1]]; }
    else if (b.dataset.rmq) q.splice(q.indexOf(b.dataset.rmq), 1);
    else if (b.dataset.go) return openItem(getItem(b.dataset.go));
    await setQueue(q); renderQueue(view);
  });
}

// "Pick up where you left off": items started but not finished, newest first.
function contStrip(tab, tag, smart, prog) {
  if (tab !== "all" || tag || smart) return "";
  const going = lib.items.filter((i) => { const p = progressPct(prog[i.id]); return p > 0 && p < 100 && i.source?.kind !== "shelf"; })
    .sort((a, b) => (prog[b.id]?.updated || 0) - (prog[a.id]?.updated || 0)).slice(0, 8);
  if (!going.length) return "";
  return `<section class="cont-strip" aria-label="Continue reading"><h2 class="h3">Pick up where you left off</h2><div class="cont-row">${going.map((i) => { const p = progressPct(prog[i.id]); return `
    <button class="cont-card" type="button" data-cont="${esc(i.id)}">${coverHtml(coverSrc(i), i.title)}
      <span class="cont-main"><strong>${esc(i.title)}</strong><span class="sub">${esc(i.series || i.author || TYPE_LABEL[i.type])}</span>
        <span class="prog"><i style="width:${p}%"></i></span><span class="sub tnum">${p}% · ${timeAgo(prog[i.id].updated)}</span></span></button>`; }).join("")}</div></section>`;
}

// ---------- library grid ----------
const SORTS = { recent: "Recently read", added: "Recently added", title: "Title", series: "Series", progress: "Progress", rating: "Your rating" };

async function renderLibrary(view, tab, tag = "") {
  let smart = "";
  if (tab === "smart") { smart = tag; tag = ""; tab = "all"; }
  setCrumbs([["Library", "library"]]);
  ls.set("libTab", tab);
  const state = { q: "", status: "", tag, smart, sort: ls.get("libSort", "recent"), layout: ls.get("libLayout", "grid"), select: false, selected: new Set() };
  const prog = await allProgress();

  const counts = { all: lib.items.length, manga: 0, book: 0, audio: 0 };
  lib.items.forEach((i) => counts[i.type]++);
  const tags = [...new Set(lib.items.flatMap((i) => i.tags || []))].sort(naturalCompare);

  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Your library</p><h1 class="h1">Library</h1>
      <p class="lede">${plural(counts.manga, "manga volume")}, ${plural(counts.book, "book")} and ${plural(counts.audio, "audiobook")}. Everything you add stays on this device.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${lib.features.libraryFolder ? `<button class="btn" type="button" id="rescan">${icon("folder")}Rescan folder</button>` : ""}
        <button class="btn btn-accent" type="button" id="lib-add">${icon("plus")}Add</button></div></div>
    <div class="tabs" role="tablist">
      ${LIB_TABS.map(([k, l]) =>
        `<button role="tab" type="button" data-tab="${k}" aria-selected="${tab === k}">${l}${counts[k] != null ? ` <span class="pill">${counts[k]}</span>` : ""}</button>`).join("")}
    </div>
    ${contStrip(tab, tag, smart, prog)}
    <div class="toolbar">
      <div class="search" style="flex:1 1 260px;max-width:340px">${icon("search")}<input class="field" id="lib-q" type="search" placeholder="Filter by title, series, author" aria-label="Filter"></div>
      <select class="field" id="lib-status" style="width:auto" aria-label="Status"><option value="">Any status</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
      ${tags.length ? `<select class="field" id="lib-tag" style="width:auto" aria-label="Collection"><option value="">All collections</option>${tags.map((t) => `<option ${t === tag ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>` : ""}
      ${smart ? `<button class="chip" type="button" aria-pressed="true" id="lib-smart">${esc(smart)} ${icon("x")}</button>` : ""}
      <select class="field" id="lib-sort" style="width:auto" aria-label="Sort">${Object.entries(SORTS).map(([k, v]) => `<option value="${k}" ${state.sort === k ? "selected" : ""}>${v}</option>`).join("")}</select>
      <button class="btn btn-sm btn-ghost" type="button" id="lib-ft" title="Search the words inside your books">${icon("search")}Inside books</button>
      <button class="btn btn-sm btn-ghost" type="button" id="lib-dups" title="Find titles added more than once">${icon("list")}Duplicates</button>
      <span class="spacer"></span>
      <div class="seg" role="group" aria-label="Layout">
        <button type="button" data-layout="grid" aria-pressed="${state.layout === "grid"}" aria-label="Grid">${icon("grid")}</button>
        <button type="button" data-layout="list" aria-pressed="${state.layout === "list"}" aria-label="List">${icon("list")}</button><button type="button" data-layout="shelf" aria-pressed="${state.layout === "shelf"}" aria-label="Shelf" title="Shelf view">${icon("shelf")}</button></div>
      <button class="btn" type="button" id="lib-select">${icon("check")}Select</button>
      <button class="icon-btn" type="button" id="lib-csv" title="Export your library as a spreadsheet (CSV)" aria-label="Export your library as CSV">${icon("download")}</button>
    </div>
    <div class="toolbar" id="bulk" hidden style="padding:10px 12px;border-radius:10px;background:var(--accent-soft)">
      <strong id="bulk-n">0 selected</strong><span class="spacer"></span>
      <button class="btn btn-sm" type="button" data-bulk="all">Select all</button>
      <button class="btn btn-sm" type="button" data-bulk="status">Set status</button>
      <button class="btn btn-sm" type="button" data-bulk="tag">Add to collection</button>
      <button class="btn btn-sm" type="button" data-bulk="series">Set series</button>
      <button class="btn btn-sm" type="button" data-bulk="link">Link to AniList</button>
      <button class="btn btn-sm" type="button" data-bulk="share">${icon("link")}Share list</button>
      <button class="btn btn-sm" type="button" data-bulk="delete" style="color:var(--bad)">Remove</button>
    </div>
    <div id="lib-out"></div>`;

  const out = $("#lib-out", view);
  const filtered = () => {
    const q = state.q.toLowerCase();
    let items = lib.items.filter((i) => (tab === "all" || tab === "series" || i.type === tab) && (tab !== "series" || i.type === "manga"));
    if (q) items = items.filter((i) => [i.title, i.series, i.author, i.link?.title, ...(i.tags || [])].join(" ").toLowerCase().includes(q));
    if (state.status) items = items.filter((i) => (i.status || "unread") === state.status);
    if (state.tag) items = items.filter((i) => (i.tags || []).includes(state.tag));
    if (state.smart) items = items.filter((i) => ({
      "Favorites": () => (i.rating || 0) >= 4,
      "In progress": () => { const p = progressPct(prog[i.id]); return p > 0 && p < 100; },
      "Finished": () => i.status === "completed",
      "Saved offline": () => !!i.offline?.length,
      "Public domain": () => ["gutenberg", "librivox"].includes(i.source?.kind) || !!i.source?.ia,
    }[state.smart] || (() => true))());
    const by = {
      recent: (a, b) => (prog[b.id]?.updated || b.lastRead || 0) - (prog[a.id]?.updated || a.lastRead || 0) || (b.added || 0) - (a.added || 0),
      added: (a, b) => (b.added || 0) - (a.added || 0),
      title: (a, b) => naturalCompare(a.title, b.title),
      series: (a, b) => naturalCompare(a.series || a.author, b.series || b.author) || naturalCompare(a.title, b.title),
      progress: (a, b) => progressPct(prog[b.id]) - progressPct(prog[a.id]),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
    }[state.sort];
    return items.sort(by);
  };
  const draw = () => {
    const items = filtered();
    if (!lib.items.length) {
      out.innerHTML = emptyState("Your library is empty.", "Add CBZ, ZIP, PDF or EPUB files you own, link a server, or open a public-domain book.", `<button class="btn btn-accent" type="button" data-imp>${icon("upload")}Add files</button>`);
      $("[data-imp]", out).onclick = async () => (await import("./link.js")).openImport();
      return;
    }
    if (!items.length) { out.innerHTML = `<p class="status">Nothing matches these filters.</p>`; return; }
    if (tab === "series") {
      const groups = seriesGroups(items).sort((a, b) => naturalCompare(a.title, b.title));
      out.innerHTML = `<div class="grid">${groups.map((g) => {
        const read = g.items.filter((i) => progressPct(prog[i.id]) >= 100).length;
        return `<a class="card ${g.items.length > 1 ? "stack" : ""}" href="#series/${encodeURIComponent(g.key)}">
          ${coverHtml(g.link?.cover || coverSrc(g.items[0]), g.title, { color: g.link?.color, badge: g.link ? "AniList" : "" })}
          <span class="card-t">${esc(g.title)}</span><span class="card-m">${plural(g.items.length, "vol")} · ${read} read</span></a>`;
      }).join("")}</div>`;
      return;
    }
    if (state.layout === "shelf") {
      out.innerHTML = items.length
        ? `<div class="shelf shelf-big" id="lib-shelf" role="list">${shelfSpines(items, prog)}</div>`
        : `<p class="muted">Nothing on this shelf yet.</p>`;
      $("#lib-shelf", out)?.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) openItem(getItem(b.dataset.id)); });
      return;
    }
    out.innerHTML = state.layout === "grid"
      ? `<div class="grid">${items.map((i) => itemCard(i, prog[i.id], { select: state.select, selected: state.selected.has(i.id) })).join("")}</div>`
      : `<div class="list">${items.map((i) => itemRow(i, prog[i.id])).join("")}</div>`;
  };
  const updateBulk = () => { $("#bulk", view).hidden = !state.select; $("#bulk-n", view).textContent = `${state.selected.size} selected`; };

  wireItems(out, () => renderLibrary(view, tab));
  out.addEventListener("click", (e) => {
    if (!state.select) return;
    const card = e.target.closest(".card[data-id]"); if (!card) return;
    if (e.target.closest("[data-menu]")) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const id = card.dataset.id;
    state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
    draw(); updateBulk();
  }, true);
  $$(".tabs [data-tab]", view).forEach((b) => b.addEventListener("click", () => (location.hash = "library/" + b.dataset.tab)));
  $$("[data-cont]", view).forEach((b) => b.addEventListener("click", () => openItem(getItem(b.dataset.cont))));
  $("#lib-ft", view)?.addEventListener("click", async () => (await import("../fulltext.js")).openFullText($("#lib-q", view)?.value || ""));
  $("#lib-dups", view)?.addEventListener("click", async () => (await import("./common.js")).findDuplicates());
  $("#lib-q", view).addEventListener("input", (e) => { state.q = e.target.value; draw(); });
  $("#lib-status", view).addEventListener("change", (e) => { state.status = e.target.value; draw(); });
  $("#lib-tag", view)?.addEventListener("change", (e) => { state.tag = e.target.value; draw(); });
  $("#lib-smart", view)?.addEventListener("click", () => (location.hash = "library/all"));
  $("#lib-sort", view).addEventListener("change", (e) => { state.sort = e.target.value; ls.set("libSort", state.sort); draw(); });
  $$("[data-layout]", view).forEach((b) => b.addEventListener("click", () => { state.layout = b.dataset.layout; ls.set("libLayout", state.layout); $$("[data-layout]", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); }));
  $("#lib-select", view).addEventListener("click", () => { state.select = !state.select; state.selected.clear(); if (state.select && state.layout !== "grid") { state.layout = "grid"; } $("#lib-select", view).setAttribute("aria-pressed", String(state.select)); draw(); updateBulk(); });
  $("#lib-add", view).addEventListener("click", async () => (await import("./link.js")).openImport());
  $("#lib-csv", view).addEventListener("click", () => {
    const cell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const head = ["Title", "Series or author", "Type", "Status", "Rating", "Progress %", "Pages", "Source", "Collections", "AniList", "Added", "Notes"];
    const rows = filtered().map((i) => [i.title, i.series || i.author, TYPE_LABEL[i.type], STATUS[i.status || "unread"], i.rating || "", progressPct(prog[i.id]), i.pages || "", i.origin || "", (i.tags || []).join("; "),
      i.link?.anilistId ? `https://anilist.co/manga/${i.link.anilistId}` : "", i.added > 1 ? new Date(i.added * 1000).toISOString().slice(0, 10) : "", i.notes || ""]);
    const csv = [head, ...rows].map((r) => r.map(cell).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }));
    a.download = `kitsune-library-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(a); a.click(); a.remove();
    toast(`Exported ${plural(rows.length, "item")}.`);
  });
  $("#rescan", view)?.addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    try { const n = await rescanFolder(); toast(`Found ${plural(n, "volume")} in your library folder.`); renderLibrary(view, tab); } catch (err) { toast(err.message); e.currentTarget.disabled = false; }
  });
  $("#bulk", view).addEventListener("click", async (e) => {
    const b = e.target.closest("[data-bulk]"); if (!b) return;
    const sel = [...state.selected].map(getItem).filter(Boolean);
    const done = () => { state.selected.clear(); draw(); updateBulk(); };
    if (b.dataset.bulk === "all") { filtered().forEach((i) => state.selected.add(i.id)); draw(); return updateBulk(); }
    if (!sel.length) return toast("Select some items first.");
    if (b.dataset.bulk === "status") statusMenu(b, sel, done);
    if (b.dataset.bulk === "delete") removeItems(sel, done);
    if (b.dataset.bulk === "link") linkToAniList(sel.filter((i) => i.type === "manga"), done);
    if (b.dataset.bulk === "share") (await import("./list.js")).shareListDialog(sel, state.tag || state.smart || "");
    if (b.dataset.bulk === "tag" || b.dataset.bulk === "series") {
      const isTag = b.dataset.bulk === "tag";
      const m = modal({ title: isTag ? "Add to collection" : "Set series", body: `<form class="form" id="bk-f"><input class="field" id="bk-v" placeholder="${isTag ? "favorites" : "Series name"}" required autofocus>${isTag && tags.length ? `<div class="chips">${tags.map((t) => `<button class="chip" type="button" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}</form>`,
        actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="bk-f">Apply to ${sel.length}</button>` });
      $$("[data-t]", m.root).forEach((c) => (c.onclick = () => ($("#bk-v", m.root).value = c.dataset.t)));
      $("#bk-f", m.root).addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const v = $("#bk-v", m.root).value.trim();
        for (const it of sel) { if (isTag) it.tags = [...new Set([...(it.tags || []), v])]; else it.series = v; await saveItem(it); }
        m.close(); toast(`Updated ${plural(sel.length, "item")}.`); done();
      });
    }
  });
  draw();
}

// ---------- one item ----------
async function renderItem(view, id) {
  const item = getItem(id);
  if (!item) { setCrumbs([["Library", "library"], ["Not found", ""]]); view.innerHTML = emptyState("Not on your shelf.", "It may have been removed.", `<a class="btn" href="#library">Back to library</a>`); return; }
  setCrumbs([["Library", "library"], [item.title, ""]]);
  const prog = (await allProgress())[item.id];
  const pct = progressPct(prog);
  const bms = await getMarks("bookmarks", item.id);
  const hls = item.type === "book" ? await getMarks("highlights", item.id) : [];
  const siblings = item.type === "manga" ? seriesGroups().find((g) => g.items.some((i) => i.id === item.id))?.items || [] : [];
  const src = item.source || {};
  const where = item.origin && src.kind !== "server" ? item.origin : { blobs: "Files added in this browser", urls: "Image links", server: "Library folder: " + (src.path || ""), pdf: "PDF added in this browser", template: src.ia ? "Internet Archive" : "Linked server", epub: "EPUB added in this browser", text: "Text file added in this browser", gutenberg: "Project Gutenberg", librivox: "LibriVox" }[src.kind] || item.origin;

  const sibIds = new Set(siblings.map((s) => s.id));
  const by = item.author || (item.type !== "manga" ? item.series : "");
  const more = by ? lib.items.filter((i) => i.id !== item.id && !sibIds.has(i.id) && (i.author === by || i.series === by)).slice(0, 12) : [];
  const bg = coverSrc(item);
  view.innerHTML = `<div class="detail detail-cine" data-tint="${esc(bg || "")}">
    <header class="cine">
      ${bg ? `<div class="cine-bg" aria-hidden="true" style="background-image:url('${esc(bg).replace(/'/g, "%27")}')"></div>` : ""}
      <div class="cine-cover">${coverHtml(coverSrc(item), item.title, { pct })}</div>
      <div class="cine-txt">
      <p class="eyebrow">${esc(TYPE_LABEL[item.type])} · <span class="pill ${esc(item.status || "unread")}">${STATUS[item.status || "unread"]}</span></p>
      <h1>${esc(item.title)}</h1>
      <p class="alt">${esc(item.series || item.author || "")}</p>
      ${item.work || item.credit?.license || item.credit?.creator ? `<p class="pill rights-line" style="margin:0 0 12px;white-space:normal">${icon("star")}${esc(item.work ? `Your work · ${(await import("./create.js")).LICENSES[item.work.license]?.[0] || ""}` : [item.credit.creator && `By ${item.credit.creator}`, item.credit.license].filter(Boolean).join(" · "))}</p>` : ""}
      ${item.rating ? `<div class="stars" aria-label="${item.rating} stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" tabindex="-1" class="${item.rating >= n ? "on" : ""}">${icon("star")}</button>`).join("")}</div>` : ""}
      ${item.review ? `<p class="it-review">“${esc(item.review)}”</p>` : ""}
      <div class="cine-actions">
        ${siblings.length > 1 && siblings.findIndex((s) => s.id === item.id) > 0 ? `<button class="btn" type="button" id="it-markprev">${icon("check")}Mark earlier volumes read</button>` : ""}
        ${item.source?.kind === "shelf" ? `<p class="pill" style="justify-content:center;padding:10px">${icon("shelf")}Owned · ${esc(item.origin || "elsewhere")}</p>` : ""}
        <button class="btn btn-accent btn-lg" type="button" id="it-open" ${item.source?.kind === "shelf" ? "hidden" : ""}>${icon(item.type === "audio" ? "play" : "book")}${pct ? (item.type === "audio" ? "Resume" : "Continue") : item.type === "audio" ? "Play" : "Start reading"}</button>
        ${pct ? `<button class="btn" type="button" id="it-restart">Start over</button>` : ""}
        <button class="btn" type="button" id="it-edit">${icon("edit")}Edit details</button>
        ${item.work ? `<button class="btn btn-accent" type="button" id="it-sharework">${icon("upload")}Share this work</button>` : `<a class="btn" href="#find/${encodeURIComponent([item.link?.title || item.title.replace(/\s*(vol(ume)?\.?|#)\s*\d+.*$/i, ""), item.type === "manga" ? "" : item.author || ""].join(" ").trim())}">${icon("search")}Where to read</a>`}
        ${item.type === "manga" && !item.work ? `<button class="btn" type="button" id="it-fanwiki">${icon("globe")}${item.fanWiki ? esc(item.fanWiki.name) : "Fan wiki"}</button>` : ""}
        <button class="btn" type="button" id="it-queue">${icon("clock")}${(await getQueue()).includes(item.id) ? "In Up Next ✓" : "Add to Up Next"}</button>
        ${canDownload(item) ? `<button class="btn" type="button" id="it-dl">${icon("download")}Save for offline</button>` : item.offline?.length ? `<button class="btn" type="button" id="it-undl">${icon("check")}Saved offline · remove</button>` : ""}
      </div></div>
    </header>
    <div class="cine-body">
      <dl class="facts">
        ${item.pages ? `<div><dt>Pages</dt><dd>${item.pages}</dd></div>` : ""}
        <div><dt>Progress</dt><dd>${pct}%${prog ? ` · ${timeAgo(prog.updated)}` : ""}</dd></div>
        ${await (async () => { const t = await (await import("../store.js")).titleTime(item.id); if (!t.secs) return "";
          const f = (s) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : `${Math.max(1, Math.round(s / 60))} min`);
          return `<div><dt>Time spent</dt><dd>${f(t.secs)}</dd></div>${t.left ? `<div><dt>Left at your pace</dt><dd>About ${f(t.left)}${t.doneBy ? ` · done by ${t.doneBy.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}` : ""}</dd></div>` : ""}`; })()}
        <div><dt>Source</dt><dd>${esc(where || "—")}</dd></div>
        <div><dt>Added</dt><dd>${item.added > 1 ? timeAgo(item.added) : "Built in"}</dd></div>
        ${item.dir ? `<div><dt>Direction</dt><dd>${{ rtl: "Right to left", ltr: "Left to right", scroll: "Long strip" }[item.dir]}</dd></div>` : ""}
      </dl>
      ${item.tags?.length ? `<div class="tagrow">${item.tags.map((t) => `<span>${icon("tag")} ${esc(t)}</span>`).join("")}</div>` : ""}
      ${item.description ? `<div class="section" style="margin-top:24px"><h3 class="h3" style="margin-bottom:8px">About</h3><p class="prose">${esc(item.description)}</p></div>` : ""}
      ${(() => { const n = contentNotes(item.source?.text); return n ? `<div class="section cn-detail" style="margin-top:24px"><h3 class="h3" style="margin-bottom:8px">Content notes</h3><p class="prose">${esc(n)}</p></div>` : ""; })()}
      ${item.notes ? `<div class="section" style="margin-top:24px"><h3 class="h3" style="margin-bottom:8px">Your notes</h3><p class="prose">${esc(item.notes)}</p></div>` : ""}
      ${item.type === "manga" ? `<div class="panel ${item.link ? "" : "panel-accent"}" style="margin-top:24px">
        ${item.link ? `<h3 class="h3">Part of ${esc(item.link.title)}</h3><div class="linkgrid"><a class="btn" href="#manga/${item.link.anilistId}">Series info</a><a class="btn" href="#series/${encodeURIComponent(seriesKey(item))}">Your volumes (${siblings.length})</a><button class="btn btn-ghost" type="button" id="it-link">Change link</button></div>`
        : `<h3 class="h3">Link this volume to its series</h3><p class="muted" style="margin:0 0 12px">Linking pulls in the cover, synopsis and official store links from AniList, and groups your volumes together.</p><button class="btn btn-accent" type="button" id="it-link">${icon("link")}Find the series</button>`}</div>` : ""}
      ${bms.length ? `<div class="section" style="margin-top:28px"><h3 class="h3" style="margin-bottom:10px">Bookmarks</h3><div class="list">${bms.map((b, i) => `<button class="row" type="button" data-bm="${i}" style="grid-template-columns:auto minmax(0,1fr) auto">${icon("bookmark")}<div class="row-main"><strong>${esc(b.label || `Page ${b.pos + 1}`)}</strong><span class="sub">${timeAgo(b.created)}</span></div>${icon("next")}</button>`).join("")}</div></div>` : ""}
      ${hls.length ? `<div class="section" style="margin-top:28px"><h3 class="h3" style="margin-bottom:10px">Highlights &amp; notes</h3><div class="list">${hls.map((h, i) => `<button class="b-note" type="button" data-hl="${i}" style="background:var(--surface);border:1px solid var(--line)"><q>${esc(h.text)}</q>${h.note ? `<span style="font-family:var(--f-body);font-size:13px;color:var(--ink)">${esc(h.note)}</span>` : ""}<span>${timeAgo(h.created)}</span></button>`).join("")}</div></div>` : ""}
      ${siblings.length > 1 ? `<div class="section" style="margin-top:28px"><div class="section-head"><h3 class="h3">More in this series</h3><a href="#series/${encodeURIComponent(seriesKey(item))}">All ${siblings.length} ${icon("next")}</a></div><div class="rail" id="it-sib">${siblings.filter((s) => s.id !== item.id).map((s) => itemCard(s, null)).join("")}</div></div>` : ""}
      ${more.length ? `<div class="section" style="margin-top:28px"><div class="section-head"><h3 class="h3">More from ${esc(by)}</h3></div><div class="rail" id="it-more">${more.map((s) => itemCard(s, null)).join("")}</div></div>` : ""}
      <div style="margin-top:32px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost" type="button" id="it-del" style="color:var(--bad)">${icon("trash")}Remove from library</button></div>
    </div></div>`;
  $("#it-open", view).onclick = () => openItem(item);
  $("#it-restart", view)?.addEventListener("click", () => openItem(item, { from: 0 }));
  $("#it-markprev", view)?.addEventListener("click", async () => {
    const before = siblings.slice(0, siblings.findIndex((s) => s.id === item.id));
    await (await import("../store.js")).markRead(before, true);
    toast(`Marked ${plural(before.length, "earlier volume")} read.`);
  });
  $("#it-edit", view).onclick = () => editItem(item, () => renderItem(view, id));
  $("#it-sharework", view)?.addEventListener("click", async () => (await import("./create.js")).shareWork(item));
  // The series' fan wiki (Fandom), found from its title and remembered on the item.
  $("#it-fanwiki", view)?.addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    if (item.fanWiki) { location.hash = `wiki/${item.fanWiki.id}/${encodeURIComponent(item.fanWiki.page || "").replace(/%20/g, "_")}`; return; }
    btn.disabled = true; btn.lastChild.textContent = "Finding the wiki…";
    try {
      const { fandomFor, search } = await import("../mediawiki.js");
      const { ensureWiki } = await import("./wiki.js");
      const series = item.link?.title || item.series || item.title.replace(/\s*(vol(ume)?\.?|#)\s*\d+.*$/i, "");
      const found = await fandomFor(series);
      const w = await ensureWiki(found.api.replace(/\/(w\/)?api\.php$/, ""));
      const top = (await search(w, series).catch(() => ({ results: [] }))).results[0]?.title || "";
      item.fanWiki = { id: w.id, name: w.name, page: top }; await saveItem(item);
      location.hash = `wiki/${w.id}/${encodeURIComponent(top).replace(/%20/g, "_")}`;
    } catch (err) { toast(err.message); btn.disabled = false; btn.lastChild.textContent = "Fan wiki"; }
  });
  $("#it-queue", view).onclick = async () => { const on = await toggleQueue(item.id); toast(on ? "Added to Up Next." : "Removed from Up Next."); renderItem(view, id); };
  $("#it-dl", view)?.addEventListener("click", () => downloadDialog(item, () => renderItem(view, id)));
  $("#it-undl", view)?.addEventListener("click", async () => { await removeDownload(item); toast("Offline copy removed."); renderItem(view, id); });
  $("#it-link", view)?.addEventListener("click", () => linkToAniList([item], () => renderItem(view, id)));
  $("#it-del", view).onclick = () => removeItems([item], () => (location.hash = "library"));
  $$("[data-bm]", view).forEach((b) => (b.onclick = () => openItem(item, { from: bms[Number(b.dataset.bm)].pos })));
  $$("[data-hl]", view).forEach((b) => (b.onclick = () => openItem(item, { para: hls[Number(b.dataset.hl)].p })));
  const sib = $("#it-sib", view); if (sib) wireItems(sib, () => renderItem(view, id));
  const mo = $("#it-more", view); if (mo) wireItems(mo, () => renderItem(view, id));
}

// ---------- one series ----------
async function renderSeries(view, key) {
  const g = seriesGroups().find((x) => x.key === key);
  if (!g) { setCrumbs([["Library", "library"], ["Series", ""]]); view.innerHTML = emptyState("No volumes in this series.", "They may have been removed.", `<a class="btn" href="#library/series">All series</a>`); return; }
  setCrumbs([["Library", "library"], ["Series", "library/series"], [g.title, ""]]);
  const prog = await allProgress();
  const copies = await getCopies(key);
  const trk = await import("../trackers.js");
  let trackers = await trk.getLinks(key);
  let info = null;
  const read = g.items.filter((i) => progressPct(prog[i.id]) >= 100).length;
  const next = g.items.find((i) => progressPct(prog[i.id]) < 100) || g.items[0];

  const draw = async () => {
    view.innerHTML = `<div class="detail" data-tint="${esc(g.link?.cover || coverSrc(g.items[0]) || "")}">
      <div class="detail-side">${coverHtml(g.link?.cover || coverSrc(g.items[0]), g.title, { color: g.link?.color })}
        <div style="display:grid;gap:8px"><button class="btn btn-accent btn-lg" type="button" id="s-next">${icon("book")}${read ? "Continue: " : "Start: "}${esc(next.title)}</button>
        <button class="btn" type="button" id="s-link">${icon("link")}${g.link ? "Change series link" : "Link to AniList"}</button>
        ${g.items.some(canDownload) ? `<button class="btn" type="button" id="s-offline">${icon("download")}Save the series offline (${g.items.filter(canDownload).length})</button>` : ""}
        <div style="display:flex;gap:8px"><button class="btn btn-sm" type="button" id="s-allread" style="flex:1">${icon("check")}Mark all read</button><button class="btn btn-sm" type="button" id="s-allunread" style="flex:1">Mark all unread</button></div></div></div>
      <div style="min-width:0">
        <p class="eyebrow">Series on your shelf</p><h1>${esc(g.title)}</h1>
        <p class="alt">${plural(g.items.length, "volume")} on this device · ${read} finished${info?.volumes ? ` · ${info.volumes} published` : ""}</p>
        ${(() => { const nums = g.items.map((it) => Number((String(it.title).match(/(?:vol(?:ume)?\.?|#|v)\s*0*(\d{1,3})\b/i) || String(it.title).match(/\b0*(\d{1,3})\s*$/) || [])[1])).filter((n) => n > 0);
          if (nums.length < 1) return "";
          const have = new Set(nums), top = Math.max(info?.volumes || 0, ...nums);
          const miss = Array.from({ length: top }, (_, i) => i + 1).filter((n) => !have.has(n));
          return miss.length ? `<p class="missing-vols">${icon("search")}<span>Missing from your shelf: <strong>${miss.length > 14 ? miss.slice(0, 14).join(", ") + ` and ${miss.length - 14} more` : miss.join(", ")}</strong></span> <a class="link-btn" href="#find/${encodeURIComponent(g.title)}">Where to get them</a></p>` : "";
        })()}
        ${info ? `<p class="prose" style="max-width:68ch">${esc(info.description.slice(0, 600))}${info.description.length > 600 ? "…" : ""}</p><a class="link-btn" href="#manga/${info.id}">Full series info ${icon("next")}</a>` : ""}
        ${info?.volumes ? `<div class="vol-strip" aria-label="Volumes">${Array.from({ length: Math.min(info.volumes, 120) }, (_, i) => { const n = i + 1; const has = g.items.some((it) => new RegExp(`(^|\\D)0*${n}(\\D|$)`).test(it.title)); return `<span class="${has ? "own" : ""}" title="Vol. ${n}${has ? " (on your shelf)" : ""}">${n}</span>`; }).join("")}</div>` : ""}
        <div class="section" style="margin-top:28px"><div class="section-head"><h3 class="h3">Your volumes</h3></div><div class="grid" id="s-grid">${g.items.map((i) => itemCard(i, prog[i.id])).join("")}</div></div>
        <div class="panel" style="margin-top:28px" id="s-trk"><div class="section-head" style="margin-bottom:10px"><h3 class="h3" style="margin:0">Trackers</h3></div>
          <p class="muted" style="margin:0 0 12px;font-size:13px">Link this series to MyAnimeList, Kitsu and MangaUpdates to see their scores here and include it when you export your list.</p>
          ${g.link ? `<p class="muted" style="margin:0 0 10px;font-size:13px">AniList: <a href="https://anilist.co/manga/${g.link.anilistId}" target="_blank" rel="noopener">${esc(g.link.title)}</a></p>` : ""}
          ${trk.linksHtml(trackers)}</div>
        <div class="panel" style="margin-top:16px"><div class="section-head" style="margin-bottom:10px"><h3 class="h3" style="margin:0">Copies you own elsewhere</h3><button class="btn btn-sm" type="button" id="s-addcopy">${icon("plus")}Add</button></div>
          <p class="muted" style="margin:0 0 12px;font-size:13px">Keep track of print volumes on your shelf and digital copies in other apps, with links to where you read them.</p>
          <div id="s-copies">${copiesHtml(copies)}</div></div>
      </div></div>`;
    $("#s-next", view).onclick = () => openItem(next);
    $("#s-offline", view)?.addEventListener("click", () => saveSeriesOffline(g.items.filter(canDownload), () => renderSeries(view, key)));
    $("#s-allread", view).onclick = async () => { await (await import("../store.js")).markRead(g.items, true); toast(`Marked ${plural(g.items.length, "volume")} read.`); renderSeries(view, key); };
    $("#s-allunread", view).onclick = async () => { if (!(await confirmBox("Mark every volume unread?", "Reading positions in this series are cleared. Your stats, highlights and bookmarks stay.", "Mark unread", false))) return; await (await import("../store.js")).markRead(g.items, false); toast("Marked unread."); renderSeries(view, key); };
    $("#s-link", view).onclick = () => linkToAniList(g.items, () => (location.hash = "library/series"), g.title);
    wireItems($("#s-grid", view), () => renderSeries(view, key));
    $("#s-addcopy", view).onclick = () => editCopy(key, null, () => renderSeries(view, key));
    trk.wireLinks($("#s-trk", view), key, g.title, async () => { trackers = await trk.getLinks(key); draw(); });
    $("#s-copies", view).addEventListener("click", (e) => { const b = e.target.closest("[data-copy]"); if (b) editCopy(key, copies.find((c) => c.id === b.dataset.copy), () => renderSeries(view, key)); });
  };
  await draw();
  if (g.link?.anilistId) { try { info = await api("manga/" + g.link.anilistId); draw(); } catch {} }
}

// Save every volume of a series for offline reading, one after another, with one progress bar.
async function saveSeriesOffline(items, after) {
  const { downloadItem } = await import("../store.js");
  const ctl = new AbortController();
  let finished = false;
  const m = modal({ title: "Save the series offline", body: `<p style="margin:0 0 14px">${plural(items.length, "volume")} to save to this device.</p><div class="progressbar"><i id="so-bar"></i></div><p class="status" id="so-status" style="margin-top:10px">Starting…</p>`,
    actions: `<button class="btn" type="button" data-close>Stop</button>`, onClose: () => { if (!finished) ctl.abort(); } });
  let done = 0, failed = 0;
  for (const it of items) {
    if (ctl.signal.aborted) break;
    const st = $("#so-status", m.root); if (st) st.textContent = `Saving ${it.title} (${done + 1} of ${items.length})…`;
    try { await downloadItem(it, (p) => { const bar = $("#so-bar", m.root); if (bar) bar.style.width = (((done + p) / items.length) * 100).toFixed(1) + "%"; }, ctl.signal); }
    catch (e) { if (ctl.signal.aborted) break; failed++; }
    done++;
  }
  finished = true;
  const st = $("#so-status", m.root);
  if (st) { st.textContent = ctl.signal.aborted ? "Stopped. Volumes already saved stay saved." : `Saved ${plural(done - failed, "volume")}${failed ? `, ${failed} couldn't be saved` : ""}.`; const bar = $("#so-bar", m.root); if (bar && !ctl.signal.aborted) bar.style.width = "100%"; }
  after();
}

// ---------- AniList list import ----------
const AL_STATUS = { CURRENT: "Reading", PLANNING: "Plan to read", COMPLETED: "Completed", PAUSED: "Paused", DROPPED: "Dropped", REPEATING: "Rereading" };
async function renderTracking(view) {
  setCrumbs([["Library", "library"], ["Tracking", ""]]);
  const saved = await kvGet("tracking", null);
  let filter = "CURRENT";
  const draw = () => {
    const t = saved;
    const ownedIds = new Set(lib.items.map((i) => i.link?.anilistId).filter(Boolean));
    view.innerHTML = `
      <div class="page-head"><div><p class="eyebrow">Your library</p><h1 class="h1">Tracking</h1>
        <p class="lede">Bring in your public AniList manga list to see what you're reading next to what you own.</p></div>
        <div style="display:grid;gap:8px;flex:1 1 360px;max-width:520px">
          <form class="search" id="tr-form" style="max-width:none">${icon("search")}<input class="field" id="tr-user" placeholder="AniList username" value="${esc(t?.source === "mal" ? "" : t?.user?.name || "")}" required autocomplete="off"><button class="btn btn-accent">${t && t.source !== "mal" ? "Refresh" : "Import"}</button></form>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn" style="position:relative">${icon("upload")}Import a MyAnimeList export (.xml or .xml.gz)<input type="file" id="tr-mal" accept=".xml,.gz,application/xml,application/gzip" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>
            <button class="btn" type="button" id="tr-export" title="Series you've linked to MyAnimeList, with the volumes you've finished">${icon("download")}Export for MyAnimeList &amp; Kitsu</button></div>
          <p class="hint" style="margin:0">Link a series to MyAnimeList, Kitsu or MangaUpdates from its series page. The export opens in MyAnimeList (Import list) and Kitsu (Import from MyAnimeList).</p>
        </div></div>
      ${libTabs("tracking")}
      <p class="status" id="tr-status">${t ? `Imported ${plural(t.entries.length, "entry", "entries")} from ${esc(t.user.name)} · ${timeAgo(t.fetched)}` : "Your list is read once and kept on this device. Nothing is sent back to AniList."}</p>
      ${t ? `<div class="chips" style="margin-bottom:18px">${Object.entries(AL_STATUS).map(([k, v]) => { const n = t.entries.filter((e) => e.status === k).length; return n ? `<button class="chip" type="button" data-f="${k}" aria-pressed="${filter === k}">${v} <span class="n">${n}</span></button>` : ""; }).join("")}
        <button class="chip" type="button" data-f="OWNED" aria-pressed="${filter === "OWNED"}">On my shelf <span class="n">${t.entries.filter((e) => ownedIds.has(e.media.id)).length}</span></button></div>
        <div class="grid">${t.entries.filter((e) => filter === "OWNED" ? ownedIds.has(e.media.id) : e.status === filter).sort((a, b) => b.updatedAt - a.updatedAt).map((e) => `
          <a class="card" href="#manga/${e.media.id}">${coverHtml(e.media.cover, e.media.title, { color: e.media.color, own: ownedIds.has(e.media.id), pct: e.media.chapters ? Math.round((e.progress / e.media.chapters) * 100) : 0 })}
          <span class="card-t">${esc(e.media.title)}</span><span class="card-m">Ch. ${e.progress || 0}${e.media.chapters ? "/" + e.media.chapters : ""}${e.score ? ` · ★${e.score}` : ""}</span></a>`).join("") || `<p class="status">Nothing here.</p>`}</div>` : ""}`;
    $$(".tabs [data-tab]", view).forEach((b) => b.addEventListener("click", () => (location.hash = "library/" + b.dataset.tab)));
    $$("[data-f]", view).forEach((c) => (c.onclick = () => { filter = c.dataset.f; draw(); }));
    $("#tr-form", view).addEventListener("submit", async (e) => {
      e.preventDefault();
      const s = $("#tr-status", view); s.className = "status"; s.textContent = "Reading your AniList list…";
      try {
        const d = await api("anilist/user/" + encodeURIComponent($("#tr-user", view).value.trim()));
        Object.assign(d, { fetched: Math.floor(Date.now() / 1000) });
        kvSet("tracking", d);
        renderTracking(view);
      } catch (err) { s.className = "status err"; s.textContent = err.message; }
    });
    $("#tr-export", view).onclick = async () => {
      const s = $("#tr-status", view);
      try { const n = await (await import("../trackers.js")).exportMalXml(); s.className = "status"; s.textContent = `Exported ${plural(n, "series", "series")}.`; }
      catch (err) { s.className = "status err"; s.textContent = err.message; }
    };
    $("#tr-mal", view).addEventListener("change", async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const s = $("#tr-status", view); s.className = "status"; s.textContent = "Reading your MyAnimeList export…";
      try { const d = await importMal(file, (msg) => (s.textContent = msg)); kvSet("tracking", d); renderTracking(view); }
      catch (err) { s.className = "status err"; s.textContent = err.message; }
    });
  };
  draw();
}

// MyAnimeList export: Profile → Export Lists → Manga. The file is XML, often gzipped.
const MAL_STATUS = { reading: "CURRENT", completed: "COMPLETED", "on-hold": "PAUSED", dropped: "DROPPED", "plan to read": "PLANNING" };
async function importMal(file, onStatus) {
  let text;
  if (/\.gz$/i.test(file.name) || file.type.includes("gzip")) {
    if (!("DecompressionStream" in window)) throw new Error("This browser can't unzip .gz files. Unzip it first and choose the .xml.");
    text = await new Response(file.stream().pipeThrough(new DecompressionStream("gzip"))).text();
  } else text = await file.text();
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const rows = [...doc.querySelectorAll("manga")];
  if (!rows.length) throw new Error("That file has no manga in it. On MyAnimeList, export your manga list (not your anime list).");
  const g = (el, t) => el.querySelector(t)?.textContent?.trim() || "";
  const user = doc.querySelector("myinfo user_name")?.textContent || "MyAnimeList";
  const mine = rows.map((r) => ({ idMal: Number(g(r, "manga_mangadb_id")), status: MAL_STATUS[g(r, "my_status").toLowerCase()] || "PLANNING", progress: Number(g(r, "my_read_chapters")) || 0, progressVolumes: Number(g(r, "my_read_volumes")) || 0, score: Number(g(r, "my_score")) || 0, title: g(r, "manga_title") }));
  const found = new Map();
  for (let i = 0; i < mine.length; i += 50) {
    onStatus(`Matching ${Math.min(i + 50, mine.length)} of ${mine.length} titles on AniList…`);
    const d = await api("anilist/mal?ids=" + mine.slice(i, i + 50).map((m) => m.idMal).join(","));
    d.results.forEach((r) => found.set(r.idMal, r.media));
  }
  const now = Math.floor(Date.now() / 1000);
  const entries = mine.filter((m) => found.has(m.idMal)).map((m) => ({ status: m.status, progress: m.progress, progressVolumes: m.progressVolumes, score: m.score, updatedAt: now, media: found.get(m.idMal) }));
  return { source: "mal", user: { name: user + " (MyAnimeList)", url: `https://myanimelist.net/mangalist/${encodeURIComponent(user)}` }, entries, fetched: now, unmatched: mine.length - entries.length };
}
