// Custom sources: describe a source once (no code runs), then browse it like a built-in one.
// Types: JSON search API, RSS/Atom feed, IIIF collection, URL pattern for your own server.
import { $, $$, esc, icon, coverHtml, toast, modal, confirmBox, api, plural, uid } from "../util.js";
import { kvGet, kvSet, saveItem, getItem } from "../store.js";
import { openItem, emptyState, skeletonGrid } from "./common.js";
import { setCrumbs } from "../main.js";

const TYPES = {
  json: { name: "Search API (JSON)", icon: "search", blurb: "Any web API that returns JSON and allows browser requests. Map its fields to titles, covers and pages." },
  feed: { name: "RSS / Atom feed", icon: "globe", blurb: "Webcomic and blog feeds. Entries with images open as pages; others link out." },
  iiif: { name: "IIIF collection", icon: "book", blurb: "A library or museum's IIIF collection: a list of scanned works." },
  pattern: { name: "URL pattern", icon: "server", blurb: "Your own files with predictable names, like v{vol:2}/{page:3}.jpg. Adds whole series at once." },
};

const EXAMPLES = [
  { type: "json", name: "Art Institute of Chicago", note: "Public-domain artworks, including Japanese prints", searchUrl: "https://api.artic.edu/api/v1/artworks/search?q={q}&query[term][is_public_domain]=true&fields=id,title,artist_display,image_id,date_display&limit=24&page={page}", items: "data", title: "title", author: "artist_display", meta: "date_display", cover: "https://www.artic.edu/iiif/2/{image_id}/full/400,/0/default.jpg", image: "https://www.artic.edu/iiif/2/{image_id}/full/1686,/0/default.jpg", link: "https://www.artic.edu/artworks/{id}", defaultQuery: "ukiyo-e" },
  { type: "json", name: "Wellcome Collection (raw)", note: "Shows how to map a IIIF manifest field", searchUrl: "https://api.wellcomecollection.org/catalogue/v2/works?query={q}&availabilities=online&include=items&pageSize=24&page={page}", items: "results", title: "title", cover: "thumbnail.url", manifest: "items.0.locations.0.url", link: "https://wellcomecollection.org/works/{id}", defaultQuery: "botany" },
  { type: "feed", name: "xkcd", note: "A webcomic feed (CC BY-NC)", url: "https://xkcd.com/rss.xml" },
  { type: "pattern", name: "My NAS series", note: "Edit the link to match your own server", template: "https://nas.local/manga/my-series/v{vol:2}/{page:3}.jpg", series: "My series", volFrom: 1, volTo: 3, pages: 180, dir: "rtl" },
];

const getSources = () => kvGet("customSources", []);
const setSources = (list) => kvSet("customSources", list);

// Field mapping: "a.b.0.c" reads a path; text with {path} is a template.
const getPath = (o, p) => String(p || "").split(".").reduce((v, k) => (v == null ? v : v[k]), o);
const field = (o, spec) => {
  if (!spec) return null;
  if (spec.includes("{")) { let ok = true; const s = spec.replace(/\{([\w.]+)\}/g, (_, p) => { const v = getPath(o, p); if (v == null || v === "") ok = false; return encodeURI(String(v ?? "")); }); return ok ? s : null; }
  const v = getPath(o, spec);
  return v == null ? null : Array.isArray(v) ? v : String(v);
};

// ---------- share codes ----------
const b64 = { enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))) };
const ALLOWED = ["type", "name", "note", "searchUrl", "items", "title", "author", "meta", "cover", "image", "pages", "manifest", "link", "defaultQuery", "url", "template", "series", "volFrom", "volTo", "pages", "dir", "pad"];
function cleanSource(s) {
  if (!TYPES[s?.type]) throw new Error("That isn't a Kitsune source.");
  const out = { id: uid("src-"), type: s.type };
  for (const k of ALLOWED) if (s[k] != null) out[k] = typeof s[k] === "number" ? s[k] : String(s[k]).slice(0, 600);
  for (const k of ["searchUrl", "url", "template"]) if (out[k] && !/^https?:\/\//i.test(out[k])) throw new Error("Source links must start with http:// or https://");
  return out;
}

// Quick health checks for every built-in source: one tiny request each.
const direct = (url) => async () => { const r = await fetch(url, { signal: AbortSignal.timeout(15_000) }); if (!r.ok) throw new Error(r.status); };
const viaApi = (path) => async () => { await api(path); };
const STATUS_CHECKS = [
  { key: "kitsune", name: "Kitsune server", note: "Search helpers and proxies", run: viaApi("health") },
  { key: "gutenberg", name: "Project Gutenberg", note: "75,000+ ebooks", run: viaApi("books?q=alice") },
  { key: "standard", name: "Standard Ebooks", note: "Carefully produced classics", run: viaApi("standard?q=alice") },
  { key: "wikisource", name: "Wikisource", note: "Transcribed texts", run: direct("https://en.wikisource.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*") },
  { key: "ia", name: "Internet Archive", note: "Scans and shelves", run: viaApi("scans?kind=comics") },
  { key: "loc", name: "Library of Congress", note: "Scanned books", run: viaApi("loc?q=fairy") },
  { key: "ndl", name: "National Diet Library", note: "Japanese books", run: viaApi("ndl?q=hokusai") },
  { key: "met", name: "The Met", note: "Open-access books and prints", run: viaApi("museum?src=met&q=ehon") },
  { key: "cma", name: "Cleveland Museum of Art", note: "CC0 artworks", run: viaApi("museum?src=cma&q=book") },
  { key: "wellcome", name: "Wellcome Collection", note: "Medical history scans", run: direct("https://api.wellcomecollection.org/catalogue/v2/works?pageSize=1") },
  { key: "ol", name: "Open Library", note: "Free-to-read editions", run: direct("https://openlibrary.org/search.json?q=alice&limit=1&fields=key") },
  { key: "librivox", name: "LibriVox", note: "Audiobooks", run: viaApi("audio?q=alice") },
  { key: "anilist", name: "AniList", note: "Manga catalog and tracking", run: viaApi("manga?q=naruto") },
  { key: "wikipedia", name: "Wikipedia", note: "Wikis and look-up", run: direct("https://en.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*") },
  { key: "fandom", name: "Fandom", note: "Fan wikis", run: async () => { const { discover } = await import("../mediawiki.js"); await discover("onepiece.fandom.com"); } },
  { key: "poetry", name: "PoetryDB", note: "Poems", run: viaApi("feed?as=json&url=" + encodeURIComponent("https://poetrydb.org/random/1")) },
  { key: "otl", name: "Open Textbook Library", note: "College textbooks", run: viaApi("feed?as=json&url=" + encodeURIComponent("https://open.umn.edu/opentextbooks/textbooks.json?q=biology")) },
];
async function checkStatus(view) {
  await Promise.allSettled(STATUS_CHECKS.map(async (c) => {
    const el = view.querySelector(`[data-st="${c.key}"]`); if (!el) return;
    el.dataset.state = "wait"; el.querySelector(".st-ms").textContent = "…";
    const t0 = performance.now();
    try { await c.run(); el.dataset.state = "ok"; el.querySelector(".st-ms").textContent = `${Math.round(performance.now() - t0).toLocaleString()} ms`; }
    catch { el.dataset.state = "down"; el.querySelector(".st-ms").textContent = "Not answering"; }
  }));
}

export async function render(view, _name, params) {
  if (params[0] === "add" && params[1]) return confirmShared(view, params[1]);
  if (params[0]) return browse(view, params[0]);
  setCrumbs([["Link & import", "link"], ["Custom sources", ""]]);
  const list = await getSources();
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Bring your own</p><h1 class="h1">Custom sources</h1>
      <p class="lede">Teach Kitsune a new place to read from: a search API, a webcomic feed, a library's IIIF collection, or your own server. Sources are descriptions, not code, so they're safe to share.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="cs-import">${icon("download")}Import</button><button class="btn btn-accent" type="button" id="cs-new">${icon("plus")}New source</button></div></div>
    ${list.length ? `<div class="sources">${list.map((s) => `<div class="source" style="cursor:default">
        <span class="ico">${icon(TYPES[s.type].icon)}</span><strong>${esc(s.name)}</strong><p>${esc(s.note || TYPES[s.type].name)}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto"><a class="btn btn-sm btn-accent" href="#sources/${esc(s.id)}">${s.type === "pattern" ? "Add volumes" : "Browse"}</a>
          <button class="btn btn-sm" type="button" data-edit="${esc(s.id)}">Edit</button><button class="btn btn-sm" type="button" data-share="${esc(s.id)}">Share</button>
          <button class="icon-btn" type="button" data-del="${esc(s.id)}" aria-label="Delete ${esc(s.name)}">${icon("trash")}</button></div></div>`).join("")}</div>`
      : emptyState("No custom sources yet.", "Start from an example below, or make your own.")}
    <section class="section"><div class="section-head"><h2 class="h2">Built-in sources</h2><button class="btn btn-sm" type="button" id="st-run">${icon("fire")}Check status</button></div>
      <p class="muted" style="margin:-6px 0 14px;font-size:13px">Every free source Kitsune reads from, and whether it's answering right now from this device.</p>
      <div class="st-grid" id="st-grid">${STATUS_CHECKS.map((c) => `<div class="st" data-st="${c.key}"><span class="st-dot"></span><span><strong>${esc(c.name)}</strong><span class="muted">${esc(c.note)}</span></span><span class="st-ms muted"></span></div>`).join("")}</div></section>
    <section class="section"><h2 class="h2" style="margin-bottom:14px">Examples to start from</h2>
      <div class="sources">${EXAMPLES.map((x, i) => `<button class="source" type="button" data-example="${i}"><span class="ico">${icon(TYPES[x.type].icon)}</span><strong>${esc(x.name)}</strong><p>${esc(x.note)}</p><span class="fmts">${esc(TYPES[x.type].name)}</span></button>`).join("")}</div></section>
    <section class="section"><div class="panel"><h3 class="h3">How source types work</h3>
      ${Object.values(TYPES).map((t) => `<p style="margin:0 0 8px"><strong>${t.name}.</strong> <span class="muted">${t.blurb}</span></p>`).join("")}
      <p class="muted" style="margin:8px 0 0;font-size:13px">Search APIs must allow browser requests (CORS). Feeds are fetched through Kitsune's server, which only loads public RSS and Atom feeds. Only add sources you have the right to read.</p></div></section>`;

  $("#st-run", view).onclick = () => checkStatus(view);
  checkStatus(view);
  view.addEventListener("click", async (e) => {
    const ex = e.target.closest("[data-example]"); if (ex) return editSource(view, { ...EXAMPLES[Number(ex.dataset.example)] });
    const ed = e.target.closest("[data-edit]"); if (ed) return editSource(view, (await getSources()).find((s) => s.id === ed.dataset.edit));
    const sh = e.target.closest("[data-share]");
    if (sh) {
      const s = (await getSources()).find((x) => x.id === sh.dataset.share);
      const { id, ...rest } = s;
      const link = `${location.origin}/#sources/add/${b64.enc(JSON.stringify(rest))}`;
      modal({ title: `Share “${s.name}”`, body: `<p class="muted" style="margin:0 0 10px">Anyone with this link can add the source to their Kitsune. It contains only the description below, no code.</p><textarea class="field" rows="3" readonly id="sh-l">${esc(link)}</textarea>`,
        actions: `<button class="btn btn-accent" type="button" id="sh-c">${icon("link")}Copy link</button>` }).root.querySelector("#sh-c").onclick = async () => { try { await navigator.clipboard.writeText(link); toast("Link copied."); } catch { toast("Select the link and copy it."); } };
      return;
    }
    const del = e.target.closest("[data-del]");
    if (del) { const l = await getSources(); const s = l.find((x) => x.id === del.dataset.del); if (await confirmBox(`Delete “${s.name}”?`, "Volumes you already added from it stay in your library.", "Delete")) { setSources(l.filter((x) => x !== s)); render(view, _name, []); } }
  });
  $("#cs-new", view).onclick = () => chooseType(view);
  $("#cs-import", view).onclick = () => {
    const m = modal({ title: "Import a source", body: `<textarea class="field" id="ci-v" rows="4" placeholder="Paste a shared source link or its JSON" autofocus></textarea><p class="status" id="ci-s"></p>`, actions: `<button class="btn btn-accent" type="button" id="ci-go">Import</button>` });
    $("#ci-go", m.root).onclick = async () => {
      try {
        const v = $("#ci-v", m.root).value.trim();
        const data = v.includes("#sources/add/") ? JSON.parse(b64.dec(v.split("#sources/add/")[1])) : JSON.parse(v);
        const s = cleanSource(data); setSources([...(await getSources()), s]); m.close(); toast(`Added “${s.name}”.`); render(view, _name, []);
      } catch (err) { $("#ci-s", m.root).className = "status err"; $("#ci-s", m.root).textContent = err.message.includes("JSON") ? "That isn't a source link or source JSON." : err.message; }
    };
  };
}

function chooseType(view) {
  const m = modal({ title: "New source", wide: true, body: `<div class="sources">${Object.entries(TYPES).map(([k, t]) => `<button class="source" type="button" data-type="${k}"><span class="ico">${icon(t.icon)}</span><strong>${t.name}</strong><p>${t.blurb}</p></button>`).join("")}</div>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-type]"); if (b) { m.close(); editSource(view, { type: b.dataset.type, name: "" }); } });
}

function editSource(view, src) {
  const s = { ...src };
  const t = s.type;
  const f = (k, label, hint = "", ph = "") => `<div><label class="lbl" for="sf-${k}">${label}</label><input class="field" id="sf-${k}" data-k="${k}" value="${esc(s[k] ?? "")}" placeholder="${esc(ph)}">${hint ? `<p class="hint">${hint}</p>` : ""}</div>`;
  const body = {
    json: `${f("searchUrl", "Search link", "Use {q} for the search words and {page} for the page number.", "https://api.example.org/search?q={q}&page={page}")}
      <div class="row2">${f("items", "Where the results are", "Path to the list, like <code>data</code> or <code>results</code>.", "data")}${f("defaultQuery", "Default search", "", "")}</div>
      <p class="hint" style="margin:0">For each result, give a path like <code>title</code> or <code>images.0.url</code>, or a link template like <code>https://…/{image_id}/full/400,/0/default.jpg</code>.</p>
      <div class="row2">${f("title", "Title")}${f("author", "Author or artist")}</div>
      <div class="row2">${f("cover", "Cover image")}${f("meta", "Extra line (date etc.)")}</div>
      <div class="row2">${f("manifest", "IIIF manifest (optional)")}${f("pages", "List of page images (optional)")}</div>
      <div class="row2">${f("image", "Single full image (optional)")}${f("link", "Web page (optional)")}</div>`,
    feed: `${f("url", "Feed link", "An RSS or Atom feed. Entries with images open as pages in Kitsune.", "https://example.com/rss.xml")}`,
    iiif: `${f("url", "IIIF collection link", "A IIIF Presentation collection (v2 or v3). Each work in it opens as a scan.", "https://…/collection.json")}`,
    pattern: `${f("template", "Page link pattern", "Use {vol} or {vol:2} for the volume number and {page} or {page:3} for the page, with zero-padding.", "https://my-nas/manga/series/v{vol:2}/{page:3}.jpg")}
      <div class="row2">${f("series", "Series name")}${f("pages", "Pages per volume", "Extra pages just show as missing.")}</div>
      <div class="row2">${f("volFrom", "First volume")}${f("volTo", "Last volume")}</div>
      <div class="row2">${f("pad", "First page number", "Usually 1 or 0.", "1")}<div><label class="lbl" for="sf-dir">Reading direction</label><select class="field" id="sf-dir" data-k="dir"><option value="rtl" ${s.dir !== "ltr" ? "selected" : ""}>Right to left</option><option value="ltr" ${s.dir === "ltr" ? "selected" : ""}>Left to right</option></select></div></div>`,
  }[t];
  const m = modal({ title: `${src.id ? "Edit" : "New"} source · ${TYPES[t].name}`, wide: true, body: `<form class="form" id="sf">${f("name", "Name", "", "My source")}${f("note", "Description (optional)")}${body}<p class="status" id="sf-s"></p></form>`,
    actions: `${t === "json" || t === "feed" || t === "iiif" ? `<button class="btn" type="button" id="sf-test">Test it</button>` : ""}<button class="btn btn-accent" form="sf">Save</button>` });
  const read = () => { $$("[data-k]", m.root).forEach((i) => { const v = i.value.trim(); if (["volFrom", "volTo", "pages", "pad"].includes(i.dataset.k)) s[i.dataset.k] = v === "" ? undefined : Number(v); else s[i.dataset.k] = v || undefined; }); };
  $("#sf-test", m.root)?.addEventListener("click", async () => {
    read();
    const st = $("#sf-s", m.root); st.className = "status"; st.textContent = "Testing…";
    try { const r = await fetchResults(s, s.defaultQuery || "test", 1); st.textContent = r.length ? `Works: ${plural(r.length, "result")}. First: “${r[0].title || "(no title)"}”${r[0].cover ? ", with a cover" : ""}${r[0].manifest || r[0].pages || r[0].image ? ", readable in Kitsune" : ", opens as a link"}.` : "It answered, but no results were found where you said. Check the results path."; }
    catch (e) { st.className = "status err"; st.textContent = e.message; }
  });
  $("#sf", m.root).onsubmit = async (e) => {
    e.preventDefault(); read();
    try {
      if (!s.name) throw new Error("Give the source a name.");
      const clean = cleanSource(s);
      const list = await getSources();
      if (src.id) { clean.id = src.id; setSources(list.map((x) => (x.id === src.id ? clean : x))); } else setSources([...list, clean]);
      m.close(); toast(`Saved “${clean.name}”.`, { action: clean.type === "pattern" ? "Add volumes" : "Browse", onAction: () => (location.hash = "sources/" + clean.id) });
      render(view, "sources", []);
    } catch (err) { $("#sf-s", m.root).className = "status err"; $("#sf-s", m.root).textContent = err.message; }
  };
}

// ---------- fetching ----------
const IMG_IN_HTML = /<img[^>]+src=["']([^"']+)["']/gi;
async function fetchResults(s, q, page) {
  if (s.type === "json") {
    const url = s.searchUrl.replace(/\{q\}/g, encodeURIComponent(q)).replace(/\{page\}/g, page);
    // Ask the API directly; if the browser is blocked (no CORS), go through Kitsune's server.
    let d;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(12_000) });
      if (!r.ok) throw new Error(`The API answered ${r.status}.`);
      d = await r.json();
    } catch {
      try { const v = await api("feed?as=json&url=" + encodeURIComponent(url)); d = typeof v === "string" ? JSON.parse(v) : v; }
      catch (e) { throw new Error(`That API couldn't be read: ${e.message}`); }
    }
    const items = s.items ? getPath(d, s.items) : d;
    if (!Array.isArray(items)) throw new Error(`No list found at “${s.items || "(top level)"}”.`);
    return items.map((o) => ({ title: field(o, s.title) || "Untitled", author: field(o, s.author), meta: field(o, s.meta), cover: field(o, s.cover), manifest: field(o, s.manifest), pages: s.pages && Array.isArray(field(o, s.pages)) ? field(o, s.pages) : null, image: field(o, s.image), link: field(o, s.link) }));
  }
  if (s.type === "feed") {
    const xml = await api("feed?url=" + encodeURIComponent(s.url));
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const entries = [...doc.querySelectorAll("item, entry")];
    return entries.map((e) => {
      const html = (e.querySelector("description")?.textContent || "") + (e.getElementsByTagNameNS("*", "encoded")[0]?.textContent || "") + (e.querySelector("content")?.textContent || "") + (e.querySelector("summary")?.textContent || "");
      const imgs = [...html.matchAll(IMG_IN_HTML)].map((x) => x[1]).filter((u) => /^https?:/.test(u));
      const enclosure = e.querySelector("enclosure[type^='image']")?.getAttribute("url");
      const media = e.getElementsByTagNameNS("*", "content")[0]?.getAttribute?.("url");
      const all = [...new Set([...(enclosure ? [enclosure] : []), ...(media && /\.(jpe?g|png|gif|webp)/i.test(media) ? [media] : []), ...imgs])];
      const link = e.querySelector("link")?.getAttribute("href") || e.querySelector("link")?.textContent?.trim();
      return { title: e.querySelector("title")?.textContent?.trim() || "Untitled", meta: (e.querySelector("pubDate, updated, published")?.textContent || "").slice(0, 16), cover: all[0] || null, pages: all.length ? all : null, link };
    });
  }
  if (s.type === "iiif") {
    let r;
    try { r = await fetch(s.url, { signal: AbortSignal.timeout(20_000) }); } catch { throw new Error("That collection didn't allow Kitsune to read it (no CORS)."); }
    const d = await r.json();
    const label = (l) => (typeof l === "string" ? l : Array.isArray(l) ? label(l[0]) : l && typeof l === "object" ? (l["@value"] ?? label(Object.values(l)[0])) : "");
    const list = d.manifests || (d.items || []).filter((x) => /Manifest|Collection/.test(x.type || x["@type"] || "")) || [];
    return list.map((x) => ({ title: label(x.label) || "Untitled", manifest: x["@id"] || x.id, cover: (Array.isArray(x.thumbnail) ? x.thumbnail[0]?.id || x.thumbnail[0]?.["@id"] : x.thumbnail?.["@id"] || x.thumbnail) || null, sub: /Collection/.test(x.type || x["@type"] || "") }));
  }
  return [];
}

function patternVolumes(s) {
  const pad = (n, w) => String(n).padStart(w || 0, "0");
  const fill = (vol, page) => s.template.replace(/\{vol(?::(\d+))?\}/g, (_, w) => pad(vol, Number(w))).replace(/\{page(?::(\d+))?\}/g, (_, w) => pad(page, Number(w)));
  const from = s.volFrom ?? 1, to = Math.min(s.volTo ?? from, from + 199), pages = Math.min(s.pages || 200, 2000), first = s.pad ?? 1;
  const vols = [];
  for (let v = from; v <= to; v++) vols.push({ vol: v, urls: Array.from({ length: pages }, (_, i) => fill(v, i + first)) });
  return vols;
}

// ---------- browsing a source ----------
async function browse(view, id) {
  const s = (await getSources()).find((x) => x.id === id);
  if (!s) { view.innerHTML = emptyState("That source isn't here.", "It may have been deleted.", `<a class="btn" href="#sources">All sources</a>`); return; }
  setCrumbs([["Custom sources", "sources"], [s.name, ""]]);
  if (s.type === "pattern") return patternPage(view, s);
  const state = { q: s.defaultQuery || "", page: 1, results: [] };
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">${esc(TYPES[s.type].name)}</p><h1 class="h1">${esc(s.name)}</h1>${s.note ? `<p class="lede">${esc(s.note)}</p>` : ""}</div>
      ${s.type === "json" ? `<form class="search" id="sb-form">${icon("search")}<input class="field" type="search" value="${esc(state.q)}" placeholder="Search ${esc(s.name)}"><button class="btn btn-accent">Search</button></form>` : ""}</div>
    <p class="status" id="sb-status"></p><div id="sb-out">${skeletonGrid(12)}</div>
    ${s.type === "json" ? `<div class="more"><button class="btn" type="button" id="sb-more">Load more</button></div>` : ""}`;
  const out = $("#sb-out", view), status = $("#sb-status", view);
  const run = async (more = false) => {
    if (!more) { state.page = 1; state.results = []; out.innerHTML = skeletonGrid(12); }
    status.className = "status"; status.textContent = "Loading…";
    try {
      const r = await fetchResults(s, state.q || "a", state.page);
      const start = state.results.length;
      state.results.push(...r);
      const html = r.map((x, i) => `<button class="card" type="button" data-r="${start + i}">${coverHtml(x.cover, x.title, { badge: x.manifest || x.pages || x.image ? (x.sub ? "Collection" : "Read") : "Link" })}<span class="card-t">${esc(x.title)}</span><span class="card-m">${esc([x.author, x.meta].filter(Boolean).join(" · "))}</span></button>`).join("");
      if (more) $(".grid", out).insertAdjacentHTML("beforeend", html); else out.innerHTML = html ? `<div class="grid">${html}</div>` : "";
      status.textContent = state.results.length ? plural(state.results.length, "result") : "Nothing found.";
    } catch (e) { status.className = "status err"; status.textContent = e.message; if (!more) out.innerHTML = ""; }
  };
  $("#sb-form", view)?.addEventListener("submit", (e) => { e.preventDefault(); state.q = $("#sb-form input", view).value.trim(); run(); });
  $("#sb-more", view)?.addEventListener("click", () => { state.page++; run(true); });
  out.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    const x = state.results[Number(b.dataset.r)];
    const key = "cs-" + (x.manifest || x.link || x.image || x.title).replace(/[^\w]/g, "").slice(-60);
    const existing = getItem(key);
    if (existing) return openItem(existing);
    try {
      let item;
      if (x.manifest && !x.sub) {
        const { importIIIF } = await import("../importers.js");
        const made = await importIIIF(x.manifest, { title: x.title, origin: s.name });
        const { deleteItem } = await import("../store.js"); await deleteItem(made.id);
        item = await saveItem({ ...made, id: key });
      } else if (x.manifest && x.sub) {
        return toast("That's a collection inside this one. Add its link as another IIIF source to browse it.", { ms: 6000 });
      } else if (x.pages?.length || x.image) {
        const urls = x.pages?.length ? x.pages : [x.image];
        item = await saveItem({ id: key, type: "manga", title: x.title, series: s.name, author: x.author || "", cover: x.cover, source: { kind: "urls", urls }, pages: urls.length, dir: "ltr", origin: s.name, tags: [], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000) });
      } else if (x.link) { window.open(x.link, "_blank", "noopener"); return; }
      else return toast("This result has nothing Kitsune can open.");
      openItem(item);
    } catch (err) { toast(err.message, { ms: 6000 }); }
  });
  run();
}

function patternPage(view, s) {
  const vols = patternVolumes(s);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">URL pattern</p><h1 class="h1">${esc(s.name)}</h1>
      <p class="lede">${plural(vols.length, "volume")} of up to ${s.pages || 200} pages from <code>${esc(s.template)}</code>.</p></div>
      <button class="btn btn-accent" type="button" id="pt-add">${icon("plus")}Add ${plural(vols.length, "volume")} to library</button></div>
    <div class="panel"><h3 class="h3">First links</h3><div class="code">${vols[0].urls.slice(0, 3).map(esc).join("<br>")}<br>…</div>
      <p class="hint">Open one in a new tab to check it works before adding everything.</p></div>
    <p class="status" id="pt-s" style="margin-top:14px"></p>`;
  $("#pt-add", view).onclick = async (e) => {
    e.currentTarget.disabled = true;
    for (const v of vols) {
      const id = `pt-${s.id}-${v.vol}`;
      if (!getItem(id)) await saveItem({ id, type: "manga", title: `${s.series || s.name} Vol. ${v.vol}`, series: s.series || s.name, source: { kind: "urls", urls: v.urls }, pages: v.urls.length, dir: s.dir || "rtl", origin: `${s.name} (your server)`, tags: [], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000) });
    }
    $("#pt-s", view).textContent = `Added ${plural(vols.length, "volume")}.`;
    toast("Added to your library.", { action: "Series", onAction: () => (location.hash = "library/series") });
  };
}

// Someone shared a source link with you.
async function confirmShared(view, data) {
  setCrumbs([["Custom sources", "sources"], ["Add a shared source", ""]]);
  let s;
  try { s = cleanSource(JSON.parse(b64.dec(data))); } catch (e) { view.innerHTML = emptyState("This source link is broken.", e.message, `<a class="btn" href="#sources">Custom sources</a>`); return; }
  const { id, ...shown } = s;
  view.innerHTML = `<div class="page-head"><div><p class="eyebrow">Shared with you</p><h1 class="h1">Add “${esc(s.name)}”?</h1>
      <p class="lede">${esc(TYPES[s.type].name)}. Sources are descriptions, not code. Here's everything in this one:</p></div></div>
    <pre class="code" style="white-space:pre-wrap">${esc(JSON.stringify(shown, null, 2))}</pre>
    <div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-accent" type="button" id="ad-yes">${icon("plus")}Add source</button><a class="btn" href="#sources">Not now</a></div>`;
  $("#ad-yes", view).onclick = async () => { setSources([...(await getSources()), s]); toast(`Added “${s.name}”.`); location.hash = "sources/" + s.id; };
}
