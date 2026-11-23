// Pieces shared by several views.
import { $, $$, esc, icon, coverHtml, modal, menu, toast, confirmBox, api, plural, timeAgo, fmtBytes } from "../util.js";
import { lib, coverSrc, saveItem, deleteItem, getItem, progressPct, allProgress, kvGet, kvSet, getQueue, toggleQueue, canDownload, downloadItem, removeDownload } from "../store.js";

// Save every page of a streamed volume into this browser.
export function downloadDialog(item, after = () => {}) {
  const ctl = new AbortController();
  let done = false;
  const m = modal({
    title: "Save for offline",
    body: `<p style="margin:0 0 14px">Saving all ${item.pages} pages of <strong>${esc(item.title)}</strong> to this device so it opens without a connection.</p>
      <div class="progressbar"><i id="dl-bar"></i></div><p class="status" id="dl-status" style="margin-top:10px">Starting…</p>`,
    actions: `<button class="btn" type="button" data-close id="dl-cancel">Stop</button>`,
    onClose: () => { if (!done) ctl.abort(); },
  });
  downloadItem(item, (p, bytes) => {
    const bar = $("#dl-bar", m.root); if (!bar) return;
    bar.style.width = Math.round(p * 100) + "%";
    $("#dl-status", m.root).textContent = `${Math.round(p * item.pages)} of ${item.pages} pages · ${fmtBytes(bytes)}`;
  }, ctl.signal).then((bytes) => {
    done = true; m.close();
    toast(`Saved “${item.title}” for offline reading (${fmtBytes(bytes)}).`);
    after();
  }).catch((e) => {
    if (ctl.signal.aborted) return;
    const s = $("#dl-status", m.root); if (s) { s.className = "status err"; s.textContent = e.message; }
    $("#dl-cancel", m.root).textContent = "Close";
  });
}

export const STATUS = { unread: "Unread", plan: "Plan to read", reading: "Reading", completed: "Finished", dropped: "Dropped" };
export const TYPE_LABEL = { manga: "Manga", book: "Book", audio: "Audiobook" };

export async function openItem(item, opts = {}) {
  if (!item) return toast("That isn't on your shelf any more.");
  if (item.source?.kind === "shelf") { location.hash = "item/" + encodeURIComponent(item.id); return; }
  if (item.type === "audio") return (await import("../readers/audio.js")).playItem(item, opts);
  if (item.type === "book") return (await import("../readers/book.js")).openBook(item, opts);
  return (await import("../readers/manga.js")).openManga(item, opts);
}

export function itemCard(item, prog, { select = false, selected = false } = {}) {
  const pct = progressPct(prog);
  const meta = item.type === "manga" ? `${item.pages || "?"}p` : item.type === "audio" ? "Audio" : item.source?.kind === "epub" ? "EPUB" : item.source?.kind === "gutenberg" ? "Gutenberg" : "Book";
  return `<div class="card ${selected ? "selected" : ""}" data-id="${esc(item.id)}">
    ${select ? `<input type="checkbox" class="select-box" data-sel="${esc(item.id)}" ${selected ? "checked" : ""} aria-label="Select ${esc(item.title)}">` : ""}
    <button class="icon-btn menu-btn" type="button" data-menu="${esc(item.id)}" aria-label="More for ${esc(item.title)}">${icon("more")}</button>
    <button class="card-hit" type="button" data-open="${esc(item.id)}" aria-label="Open ${esc(item.title)}"></button>
    ${coverHtml(coverSrc(item), item.title, { pct, badge: item.type !== "manga" ? TYPE_LABEL[item.type] : item.link ? "AniList" : "" })}
    <span class="card-t">${esc(item.title)}</span>
    <span class="card-m">${esc(item.series || item.author || "")}${item.series || item.author ? " · " : ""}${meta}${pct ? ` · ${pct}%` : ""}${item.offline?.length ? " · offline" : ""}</span>
  </div>`;
}

export function itemRow(item, prog) {
  const pct = progressPct(prog);
  return `<div class="row" data-id="${esc(item.id)}">
    <button class="card-hit" type="button" data-open="${esc(item.id)}" aria-label="Open ${esc(item.title)}"></button>
    ${coverHtml(coverSrc(item), item.title)}
    <div class="row-main"><strong>${esc(item.title)}</strong>
      <span class="sub">${esc([item.series || item.author, TYPE_LABEL[item.type], item.origin].filter(Boolean).join(" · "))}</span>
      ${pct ? `<div class="prog"><i style="width:${pct}%"></i></div>` : ""}</div>
    <div class="row-side" style="position:relative;z-index:2">
      <span class="pill ${esc(item.status || "unread")}">${STATUS[item.status || "unread"]}</span>
      <button class="icon-btn" type="button" data-menu="${esc(item.id)}" aria-label="More for ${esc(item.title)}">${icon("more")}</button>
    </div>
  </div>`;
}

// Wires open/menu clicks inside a container.
export function wireItems(container, after = () => {}) {
  container.addEventListener("click", (e) => {
    const m = e.target.closest("[data-menu]");
    if (m) { e.preventDefault(); return itemMenu(m, getItem(m.dataset.menu), after); }
    const o = e.target.closest("[data-open]");
    if (o) openItem(getItem(o.dataset.open));
  });
}

export async function itemMenu(anchor, item, after = () => {}) {
  if (!item) return;
  const queued = (await getQueue()).includes(item.id);
  menu(anchor, [
    { label: item.type === "audio" ? "Play" : "Read", icon: item.type === "audio" ? "play" : "book", run: () => openItem(item) },
    { label: "Details", icon: "list", run: () => (location.hash = "item/" + encodeURIComponent(item.id)) },
    { label: queued ? "Remove from Up Next" : "Add to Up Next", icon: "clock", run: async () => { const on = await toggleQueue(item.id); toast(on ? `Added “${item.title}” to Up Next.` : "Removed from Up Next."); after(); } },
    ...(canDownload(item) ? [{ label: "Save for offline", icon: "download", run: () => downloadDialog(item, after) }] : []),
    ...(item.offline?.length ? [{ label: `Remove offline copy (${fmtBytes(item.offlineBytes)})`, icon: "x", run: async () => { await removeDownload(item); toast("Offline copy removed."); after(); } }] : []),
    { label: "Edit details", icon: "edit", run: () => editItem(item, after) },
    ...(item.type === "manga" ? [{ label: item.link ? "Change AniList link" : "Link to AniList series", icon: "link", run: () => linkToAniList([item], after) }] : []),
    { label: "Set status…", icon: "check", run: () => statusMenu(anchor, [item], after) },
    "-",
    { label: "Remove from library", icon: "trash", danger: true, run: () => removeItems([item], after) },
  ]);
}

export function statusMenu(anchor, items, after) {
  menu(anchor, Object.entries(STATUS).map(([k, label]) => ({ label, run: async () => {
    for (const it of items) { it.status = k; await saveItem(it); }
    toast(`Marked ${items.length === 1 ? `“${items[0].title}”` : plural(items.length, "item")} as ${label.toLowerCase()}.`);
    after();
  } })));
}

export async function removeItems(items, after = () => {}) {
  const n = items.length;
  const ok = await confirmBox(n === 1 ? `Remove “${items[0].title}”?` : `Remove ${n} items?`,
    items.some((i) => i.source?.kind === "server") ? "Files in your library folder stay on disk; they'll come back on the next rescan." : "They go to Recently deleted in your library for 30 days, with their files and reading position, in case you change your mind.", "Remove");
  if (!ok) return;
  for (const it of items) await deleteItem(it.id);
  const ids = items.filter((i) => i.source?.kind !== "server").map((i) => i.id);
  toast(n === 1 ? "Removed." : `Removed ${n} items.`, ids.length ? { action: "Undo", ms: 7000, onAction: async () => { const { restoreItem } = await import("../store.js"); for (const id of ids) await restoreItem(id); toast(ids.length === 1 ? "Restored." : `Restored ${ids.length} items.`); after(); } } : {});
  after();
}

export function editItem(item, after = () => {}) {
  const tags = (item.tags || []).join(", ");
  const m = modal({
    title: "Edit details",
    body: `<form class="form" id="edit-form">
      <div><label class="lbl" for="e-title">Title</label><input class="field" id="e-title" value="${esc(item.title)}" required></div>
      <div class="row2">
        <div><label class="lbl" for="e-series">${item.type === "manga" ? "Series" : "Author"}</label><input class="field" id="e-series" value="${esc(item.type === "manga" ? item.series || "" : item.author || "")}"></div>
        <div><label class="lbl" for="e-status">Status</label><select class="field" id="e-status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${item.status === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
      </div>
      <div><label class="lbl" for="e-tags">Collections</label><input class="field" id="e-tags" value="${esc(tags)}" placeholder="favorites, to reread, box set"><p class="hint">Separate with commas. Collections show up as filters in your library.</p></div>
      ${item.type === "manga" ? `<div><label class="lbl" for="e-dir">Reading direction for this volume</label>
        <select class="field" id="e-dir"><option value="">Use my default</option><option value="rtl" ${item.dir === "rtl" ? "selected" : ""}>Right to left (manga)</option><option value="ltr" ${item.dir === "ltr" ? "selected" : ""}>Left to right (comics, manhwa)</option><option value="scroll" ${item.dir === "scroll" ? "selected" : ""}>Long strip (webtoon)</option></select></div>` : ""}
      <div><span class="lbl">Your rating</span><div class="stars" id="e-stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-r="${n}" class="${(item.rating || 0) >= n ? "on" : ""}" aria-label="${n} star${n > 1 ? "s" : ""}">${icon("star")}</button>`).join("")}</div></div>
      <div><label class="lbl" for="e-notes">Notes</label><textarea class="field" id="e-notes" rows="3" style="font-family:var(--f-body);font-size:14px">${esc(item.notes || "")}</textarea></div>
    </form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="submit" form="edit-form">Save</button>`,
  });
  let rating = item.rating || 0;
  $("#e-stars", m.root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    rating = Number(b.dataset.r) === rating ? 0 : Number(b.dataset.r);
    $$("#e-stars button", m.root).forEach((x) => x.classList.toggle("on", Number(x.dataset.r) <= rating));
  });
  $("#edit-form", m.root).addEventListener("submit", async (e) => {
    e.preventDefault();
    item.title = $("#e-title", m.root).value.trim() || item.title;
    if (item.type === "manga") item.series = $("#e-series", m.root).value.trim(); else item.author = $("#e-series", m.root).value.trim();
    item.status = $("#e-status", m.root).value;
    item.tags = $("#e-tags", m.root).value.split(",").map((t) => t.trim()).filter(Boolean);
    if ($("#e-dir", m.root)) item.dir = $("#e-dir", m.root).value || null;
    item.rating = rating;
    item.notes = $("#e-notes", m.root).value.trim();
    await saveItem(item);
    m.close(); toast("Saved."); after();
  });
}

// Search AniList and attach a series to one or more volumes.
export function linkToAniList(items, after = () => {}, presetQuery) {
  const q0 = presetQuery || items[0].series || items[0].title;
  const m = modal({
    title: items.length > 1 ? `Link ${items.length} volumes to a series` : "Link to an AniList series", wide: true,
    body: `<form class="search" id="la-form" style="max-width:none;margin-bottom:16px">${icon("search")}<input class="field" id="la-q" value="${esc(q0)}" placeholder="Series name"><button class="btn btn-accent">Search</button></form>
      <p class="status" id="la-status"></p><div class="list" id="la-list"></div>
      ${items.some((i) => i.link) ? `<button class="btn btn-ghost" type="button" id="la-unlink" style="margin-top:12px">${icon("x")}Remove the current link</button>` : ""}`,
  });
  const run = async () => {
    const q = $("#la-q", m.root).value.trim(); if (!q) return;
    $("#la-status", m.root).textContent = "Searching AniList…";
    try {
      const d = await api("manga?q=" + encodeURIComponent(q));
      $("#la-status", m.root).textContent = d.results.length ? "Pick the series these volumes belong to." : "No matches. Try the Japanese or romanized title.";
      $("#la-list", m.root).innerHTML = d.results.slice(0, 10).map((s, i) => `<button class="row" type="button" data-pick="${i}" style="grid-template-columns:44px minmax(0,1fr) auto">
        ${coverHtml(s.cover, s.title, { color: s.color })}<div class="row-main"><strong>${esc(s.title)}</strong><span class="sub">${esc([s.altTitle, s.year, s.volumes ? s.volumes + " vols" : ""].filter(Boolean).join(" · "))}</span></div><span class="btn btn-sm">Link</span></button>`).join("");
      $("#la-list", m.root).onclick = async (e) => {
        const b = e.target.closest("[data-pick]"); if (!b) return;
        const s = d.results[Number(b.dataset.pick)];
        for (const it of items) { it.link = { anilistId: s.id, title: s.title, cover: s.cover, color: s.color }; if (!it.series || it.series === it.title) it.series = s.title; await saveItem(it); }
        m.close(); toast(`Linked to ${s.title}.`); after();
      };
    } catch (err) { $("#la-status", m.root).textContent = err.message; }
  };
  $("#la-form", m.root).addEventListener("submit", (e) => { e.preventDefault(); run(); });
  $("#la-unlink", m.root)?.addEventListener("click", async () => { for (const it of items) { it.link = null; await saveItem(it); } m.close(); toast("Link removed."); after(); });
  run();
}

// "Your copies": record where you own a series (physical shelf, Kindle, BookWalker…).
export const FORMATS = { print: "Print", digital: "Digital", box: "Box set", omnibus: "Omnibus", ebook: "Ebook", other: "Other" };
export async function getCopies(key) { return ((await kvGet("copies", {}))[key] || []).slice(); }
export async function setCopies(key, list) { const all = await kvGet("copies", {}); all[key] = list; kvSet("copies", all); }
export function editCopy(key, existing, after) {
  const c = existing || { label: "", format: "print", store: "", url: "", note: "" };
  const m = modal({
    title: existing ? "Edit copy" : "Add a copy you own",
    body: `<form class="form" id="cp-form">
      <div class="row2"><div><label class="lbl" for="cp-label">Volumes</label><input class="field" id="cp-label" value="${esc(c.label)}" placeholder="Vol. 1–12" required autofocus></div>
      <div><label class="lbl" for="cp-format">Format</label><select class="field" id="cp-format">${Object.entries(FORMATS).map(([k, v]) => `<option value="${k}" ${c.format === k ? "selected" : ""}>${v}</option>`).join("")}</select></div></div>
      <div><label class="lbl" for="cp-store">Where</label><input class="field" id="cp-store" value="${esc(c.store)}" placeholder="Bookshelf, Kindle, BOOK☆WALKER, Kobo, VIZ Manga…" list="cp-stores">
        <datalist id="cp-stores">${["Bookshelf", "Kindle", "BOOK☆WALKER", "Kobo", "Google Play Books", "Apple Books", "VIZ Manga", "Shonen Jump", "MANGA Plus", "Kodansha K Manga", "Azuki", "Webtoon", "Tapas", "Comixology", "Library loan"].map((s) => `<option value="${esc(s)}">`).join("")}</datalist></div>
      <div><label class="lbl" for="cp-url">Link (optional)</label><input class="field" id="cp-url" type="url" value="${esc(c.url)}" placeholder="https://… where you read or bought it"></div>
      <div><label class="lbl" for="cp-note">Note (optional)</label><input class="field" id="cp-note" value="${esc(c.note)}" placeholder="First printing, signed, missing vol. 7…"></div>
    </form>`,
    actions: `${existing ? `<button class="btn btn-ghost" type="button" id="cp-del" style="margin-right:auto;color:var(--bad)">Delete</button>` : ""}<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="cp-form">Save</button>`,
  });
  $("#cp-form", m.root).addEventListener("submit", async (e) => {
    e.preventDefault();
    const list = await getCopies(key);
    const v = { id: c.id || Date.now().toString(36), label: $("#cp-label", m.root).value.trim(), format: $("#cp-format", m.root).value, store: $("#cp-store", m.root).value.trim(), url: $("#cp-url", m.root).value.trim(), note: $("#cp-note", m.root).value.trim() };
    const i = list.findIndex((x) => x.id === v.id);
    if (i >= 0) list[i] = v; else list.push(v);
    await setCopies(key, list); m.close(); toast("Saved to your collection."); after();
  });
  $("#cp-del", m.root)?.addEventListener("click", async () => { await setCopies(key, (await getCopies(key)).filter((x) => x.id !== c.id)); m.close(); after(); });
}
export function copiesHtml(list) {
  if (!list.length) return `<p class="muted" style="margin:0">No copies recorded yet.</p>`;
  return `<div class="copies">${list.map((c) => `<div class="copy"><span class="fmt">${esc(FORMATS[c.format] || c.format)}</span>
    <div><strong>${esc(c.label)}</strong><span>${esc([c.store, c.note].filter(Boolean).join(" · "))}</span></div>
    <div style="display:flex;gap:2px">${c.url ? `<a class="icon-btn" href="${esc(c.url)}" target="_blank" rel="noopener" aria-label="Open link">${icon("link")}</a>` : ""}<button class="icon-btn" type="button" data-copy="${esc(c.id)}" aria-label="Edit">${icon("edit")}</button></div></div>`).join("")}</div>`;
}

export function skeletonGrid(n = 12) {
  return `<div class="grid">${Array.from({ length: n }, () => `<div class="sk-card"><div class="skeleton"></div><div class="skeleton"></div></div>`).join("")}</div>`;
}
export function emptyState(title, text, actions = "") {
  return `<div class="empty"><svg class="empty-fox"><use href="#fox"/></svg><p><strong>${esc(title)}</strong> ${esc(text)}</p>${actions}</div>`;
}
export { allProgress, timeAgo };

// Titles that look like the same thing added twice (same type, same title once spacing, case and file
// extensions are ignored). Nothing is removed here: each copy links to its page, where you can delete it.
export function findDuplicates() {
  const norm = (t) => String(t || "").toLowerCase().replace(/\.(cbz|cbr|zip|pdf|epub|txt)$/i, "").replace(/[\s_\-–—:·.,!?'"()[\]]+/g, " ").trim();
  const groups = new Map();
  for (const it of lib.items) {
    const k = it.type + "|" + norm(it.title) + "|" + norm(it.series || it.author);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }
  const dups = [...groups.values()].filter((g) => g.length > 1);
  const size = (it) => (it.source?.blobs?.reduce?.((a, b) => a + (b.size || 0), 0) || it.source?.blob?.size || 0);
  const m = modal({ title: "Possible duplicates", wide: true, body: dups.length
    ? `<p class="muted" style="margin-top:0">${plural(dups.length, "title")} ${dups.length === 1 ? "appears" : "appear"} more than once. Open a copy to keep or delete it.</p>
       <div class="dup-list">${dups.map((g) => `<div class="dup-group"><strong>${esc(g[0].title)}</strong><div class="dup-copies">${g.map((it) => `<a class="dup-copy" href="#item/${encodeURIComponent(it.id)}" data-close>${coverHtml(coverSrc(it), it.title)}<span><b>${esc(it.origin || it.source?.kind || "Copy")}</b><small>${it.added > 1 ? "Added " + timeAgo(it.added) : "Built in"}${size(it) ? " · " + fmtBytes(size(it)) : ""}</small></span></a>`).join("")}</div></div>`).join("")}</div>`
    : `<p class="muted" style="margin:0">No duplicates. Every title in your library is there once.</p>` });
  m.root.addEventListener("click", (e) => { if (e.target.closest("a.dup-copy")) m.close(); });
}
