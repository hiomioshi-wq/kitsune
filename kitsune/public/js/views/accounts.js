// Accounts & keys: subscriptions you use, accounts Kitsune can read, optional API keys.
import { $, $$, esc, icon, toast, coverHtml, plural } from "../util.js";
import { SERVICES, ACCESS_LABEL, getSubs, setSubs, getKeys, setKeys, googleBooks, europeana, dpla, openLibraryShelves } from "../services.js";
import { kvGet, kvSet } from "../store.js";
import { setCrumbs } from "../main.js";

const KEYS = [
  { id: "google", name: "Google Books", help: "Raises Google's small shared quota. Free: create a project in Google Cloud Console, enable the Books API, and make an API key.", url: "https://console.cloud.google.com/apis/library/books.googleapis.com", test: () => googleBooks("frankenstein", { max: 1 }) },
  { id: "europeana", name: "Europeana", help: "Optional. Kitsune uses Europeana's public demo key otherwise. Your own free key gives higher limits.", url: "https://pro.europeana.eu/page/get-api", test: () => europeana("hokusai") },
  { id: "dpla", name: "Digital Public Library of America", help: "Turns on DPLA results in Where to read. Free key, sent to you by email.", url: "https://pro.dp.la/developers/api-codex", test: () => dpla("frankenstein").then((r) => { if (!r) throw new Error("Add a key first."); return r; }) },
];

export async function render(view) {
  setCrumbs([["Link & import", "link"], ["Accounts & keys", ""]]);
  const subs = await getSubs(), keys = await getKeys();
  const ol = await kvGet("olShelves", null);
  const csvShelves = await kvGet("csvShelves", null);
  const has = new Set(subs.services);
  const group = (kind, title) => `<div style="margin-bottom:16px"><h4 class="eyebrow" style="margin-bottom:10px">${title}</h4><div class="chips">${SERVICES.filter((s) => s.kind === kind).map((s) =>
    `<button class="chip" type="button" data-svc="${s.id}" aria-pressed="${has.has(s.id)}">${has.has(s.id) ? icon("check") : ""}${esc(s.name)} <span class="n">${ACCESS_LABEL[s.access]}</span></button>`).join("")}</div></div>`;

  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Bring your own</p><h1 class="h1">Accounts &amp; keys</h1>
      <p class="lede">Tell Kitsune which services you use. Where to read then searches them for you, and puts your subscriptions first. Everything here stays on this device.</p></div></div>

    <div class="panel"><h3 class="h3">Subscriptions, apps and stores you use</h3>
      <p class="muted" style="margin:0 0 14px;font-size:13px">These services don't let other apps sign in or read your account, so Kitsune links straight into each one's search instead. You stay signed in on their site.</p>
      ${group("manga", "Manga & webcomics")}${group("books", "Books & libraries")}${group("audio", "Audiobooks")}
      <div class="setting" style="border-top:1px solid var(--line);margin-top:6px"><div><strong>Your library in Libby</strong><p>The short code from your library's Libby link, like <code>nypl</code> in libbyapp.com/library/<strong>nypl</strong>.</p></div>
        <div style="display:flex;gap:6px"><input class="field" id="ac-libby" value="${esc(subs.libby)}" placeholder="nypl" style="width:140px"><button class="btn" type="button" id="ac-libby-save">Save</button></div></div>
    </div>

    <div class="panel"><h3 class="h3">Accounts Kitsune can read</h3>
      <div class="setting"><div><strong>AniList</strong><p>Your public manga list, shown under Library → Tracking.</p></div><a class="btn" href="#library/tracking">Open</a></div>
      <div class="setting"><div><strong>MyAnimeList</strong><p>Import your list export on the Tracking page.</p></div><a class="btn" href="#library/tracking">Open</a></div>
      <div class="setting"><div><strong>Komga, Kavita, Calibre-Web (OPDS)</strong><p>Stream from your own comic server.</p></div><a class="btn" href="#link">Connect</a></div>
      <div class="setting"><div><strong>Open Library</strong><p>Your public reading log (want to read, reading, read). Each book gets a Where to read button.</p></div>
        <form style="display:flex;gap:6px" id="ac-ol"><input class="field" id="ac-ol-user" value="${esc(subs.olUser)}" placeholder="username" style="width:160px"><button class="btn btn-accent">Import</button></form></div>
      ${ol ? `<div id="ac-ol-out">${Object.entries(ol.shelves).map(([label, books]) => books.length ? `<h4 class="eyebrow" style="margin:18px 0 10px">${esc(label)} · ${books.length}</h4>
        <div class="rail">${books.map((b) => `<a class="card" href="#find/${encodeURIComponent((b.title + " " + b.author).trim())}">${coverHtml(b.cover, b.title)}<span class="card-t">${esc(b.title)}</span><span class="card-m">${esc(b.author)}</span></a>`).join("")}</div>` : "").join("")}
        <p class="hint">Imported from ${esc(ol.user)}. Tap a book to find where to read it.</p></div>` : ""}
    </div>

    <div class="panel"><h3 class="h3">Goodreads &amp; StoryGraph</h3>
      <p class="muted" style="margin:0 0 12px;font-size:13px">Neither has an open API, but both let you export your library. Goodreads: My Books → Import and export → Export library. StoryGraph: Manage account → Export StoryGraph library. Then choose the CSV file here.</p>
      <label class="btn" style="position:relative">${icon("upload")}Import a Goodreads or StoryGraph CSV<input type="file" id="ac-csv" accept=".csv,text/csv" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>
      ${csvShelves ? `<div>${Object.entries(csvShelves.shelves).map(([label, books]) => books.length ? `<h4 class="eyebrow" style="margin:18px 0 10px">${esc(label)} · ${books.length}</h4>
        <div class="rail">${books.slice(0, 60).map((b) => `<a class="card" href="#find/${encodeURIComponent((b.title + " " + b.author).trim())}">${coverHtml(b.isbn ? `https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg?default=false` : null, b.title)}<span class="card-t">${esc(b.title)}</span><span class="card-m">${esc(b.author)}${b.rating ? ` · ★${b.rating}` : ""}</span></a>`).join("")}</div>` : "").join("")}
        <p class="hint">Imported from ${esc(csvShelves.source)} · ${plural(Object.values(csvShelves.shelves).flat().length, "book")}. Tap a book to find where to read it.</p></div>` : ""}
    </div>

    <div class="panel"><h3 class="h3">API keys (optional)</h3>
      <p class="muted" style="margin:0 0 6px;font-size:13px">Keys are stored only on this device and sent straight from your browser to that service, never to Kitsune's server. Leave them empty to use the free defaults.</p>
      ${KEYS.map((k) => `<div class="setting"><div><strong>${k.name}</strong><p>${k.help} <a class="link-btn" href="${k.url}" target="_blank" rel="noopener">Get a key ↗</a></p><p class="status" id="kt-${k.id}" style="margin:4px 0 0"></p></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><input class="field" type="password" autocomplete="off" spellcheck="false" data-key="${k.id}" value="${esc(keys[k.id])}" placeholder="${k.id === "europeana" ? "Using demo key" : "Not set"}" style="width:220px"><button class="btn" type="button" data-test="${k.id}">Test</button></div></div>`).join("")}
      <div style="margin-top:10px"><button class="btn btn-accent" type="button" id="ac-keys-save">${icon("check")}Save keys</button></div>
    </div>`;

  view.addEventListener("click", async (e) => {
    const c = e.target.closest("[data-svc]");
    if (c) {
      const s = await getSubs();
      const set = new Set(s.services);
      set.has(c.dataset.svc) ? set.delete(c.dataset.svc) : set.add(c.dataset.svc);
      s.services = [...set]; await setSubs(s);
      if (c.dataset.svc === "libby" && set.has("libby") && !s.libby) toast("Add your library's Libby code below so searches open in your library.");
      return render(view);
    }
    const t = e.target.closest("[data-test]");
    if (t) {
      const k = KEYS.find((x) => x.id === t.dataset.test), st = $("#kt-" + k.id, view);
      await saveKeys(view, true);
      st.className = "status"; st.textContent = "Testing…";
      try { await k.test(); st.textContent = "Works."; } catch (err) { st.className = "status err"; st.textContent = err.message; }
    }
  });
  $("#ac-libby-save", view).onclick = async () => { const s = await getSubs(); s.libby = $("#ac-libby", view).value.trim().replace(/^.*libbyapp\.com\/library\//, "").replace(/\/.*$/, ""); if (s.libby && !s.services.includes("libby")) s.services.push("libby"); await setSubs(s); toast("Libby library saved."); render(view); };
  $("#ac-keys-save", view).onclick = () => saveKeys(view);
  $("#ac-csv", view).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = parseShelfCsv(await f.text()); kvSet("csvShelves", r); toast(`Imported ${plural(Object.values(r.shelves).flat().length, "book")} from ${r.source}.`); render(view); }
    catch (err) { toast(err.message, { ms: 6000 }); }
  };
  $("#ac-ol", view).onsubmit = async (e) => {
    e.preventDefault();
    const user = $("#ac-ol-user", view).value.trim(); if (!user) return;
    toast("Reading your Open Library lists…");
    try {
      const shelves = await openLibraryShelves(user);
      const s = await getSubs(); s.olUser = user; await setSubs(s);
      kvSet("olShelves", { user, shelves, fetched: Math.floor(Date.now() / 1000) });
      toast(`Imported ${plural(Object.values(shelves).flat().length, "book")}.`); render(view);
    } catch (err) { toast(err.message, { ms: 6000 }); }
  };
}

// CSV with quoted fields (both exports quote titles that contain commas).
function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
function parseShelfCsv(text) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const head = rows.shift()?.map((h) => h.trim().toLowerCase()) || [];
  const col = (...names) => names.map((n) => head.indexOf(n)).find((i) => i >= 0) ?? -1;
  const goodreads = head.includes("exclusive shelf");
  const storygraph = head.includes("read status");
  if (!goodreads && !storygraph) throw new Error("That doesn't look like a Goodreads or StoryGraph export.");
  const ti = col("title"), au = col("author", "authors"), isbn = col("isbn13", "isbn", "isbn/uid"), rt = col("my rating", "star rating"), sh = col("exclusive shelf", "read status");
  const LABEL = { "to-read": "Want to read", "currently-reading": "Reading", read: "Read", "did-not-finish": "Didn't finish", paused: "Paused" };
  const shelves = {};
  for (const r of rows) {
    const title = (r[ti] || "").replace(/\s*\([^)]*#\d+\)\s*$/, "").trim(); if (!title) continue;
    const shelf = LABEL[(r[sh] || "").trim().toLowerCase()] || (r[sh] || "Other").trim();
    (shelves[shelf] ||= []).push({ title, author: (r[au] || "").split(",")[0].trim(), isbn: (r[isbn] || "").replace(/[^0-9X]/gi, "") || null, rating: Number(r[rt]) || 0 });
  }
  return { source: goodreads ? "Goodreads" : "StoryGraph", shelves, fetched: Math.floor(Date.now() / 1000) };
}

async function saveKeys(view, silent = false) {
  const k = await getKeys();
  $$("[data-key]", view).forEach((i) => (k[i.dataset.key] = i.value.trim()));
  await setKeys(k);
  if (!silent) toast("Keys saved on this device.");
}
