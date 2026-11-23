import { $, $$, esc, icon, coverHtml, api, plural, toast, ls, flipName, fmtDuration } from "../util.js";
import { lib, getItem, saveItem, allProgress, progressPct } from "../store.js";
import { itemCard, wireItems, openItem, emptyState, skeletonGrid } from "./common.js";
import { setCrumbs } from "../main.js";
import { searchBooks, getBook } from "../gutendex.js";

const LANGS = { en: "English", fr: "French", de: "German", es: "Spanish", it: "Italian", pt: "Portuguese", nl: "Dutch", fi: "Finnish", ja: "Japanese", zh: "Chinese", la: "Latin", el: "Greek", ru: "Russian", sv: "Swedish" };
const ERAS = { "": "Any era", ancient: "Ancient (before 500)", medieval: "500–1600", early: "1600–1800", c19: "1800s", c20: "1900s" };
const ERA_YEARS = { ancient: [-3000, 500], medieval: [500, 1600], early: [1600, 1800], c19: [1800, 1900], c20: [1900, 2000] };
const TOPICS = ["Adventure", "Science fiction", "Fantasy", "Horror", "Detective", "Romance", "Poetry", "Philosophy", "History", "Children", "Japan", "Folklore", "Mythology", "Drama", "Humor", "Travel"];

export async function render(view, name, params) {
  if (name === "gutenberg") return renderGutenberg(view, params[0]);
  if (name === "loc") return renderLoc(view, params[0]);
  if (name === "scan") return renderScan(view, params[0]);
  if (name === "audiobook") return renderAudio(view, params[0]);
  const tab = params[0] || "ebooks";
  if (tab === "scans") return renderScans(view, params[1] || "");
  if (tab === "audio") return renderAudioList(view, params[1] || "");
  if (tab === "mine") return renderMine(view);
  if (tab === "standard") return renderStandard(view, params[1] || "");
  if (tab === "wikisource") return renderWikisource(view, params[1] || "");
  if (tab === "google") return renderGoogle(view, params[1] || "");
  if (tab === "poems") return renderPoems(view, params[1] || "");
  if (tab === "free") return renderFree(view, params[1] || "");
  if (tab === "textbooks") return renderTextbooks(view, params[1] || "");
  return renderEbooks(view, params[1] || "");
}

const head = (tab, title, lede, searchId, placeholder, q = "") => `
  <div class="page-head"><div><p class="eyebrow">Free and public domain</p><h1 class="h1">${title}</h1><p class="lede">${lede}</p></div>
    ${searchId ? `<form class="search" id="${searchId}" role="search">${icon("search")}<input class="field" type="search" placeholder="${esc(placeholder)}" value="${esc(q)}" aria-label="Search"><button class="btn btn-accent">Search</button></form>` : ""}</div>
  <div class="tabs" role="tablist">${[["free", "Originals & free", "star"], ["ebooks", "Ebooks", "book"], ["standard", "Standard Ebooks", "star"], ["wikisource", "Wikisource", "globe"], ["google", "Google Books", "search"], ["poems", "Poems", "type"], ["textbooks", "Open textbooks", "list"], ["scans", "Scanned books", "pages"], ["audio", "Audiobooks", "headphones"], ["mine", "Your books", "shelf"]].map(([k, l, ic]) =>
    `<button role="tab" type="button" data-btab="${k}" aria-selected="${tab === k}">${icon(ic)}${l}</button>`).join("")}</div>`;
const wireTabs = (view) => $$("[data-btab]", view).forEach((b) => (b.onclick = () => (location.hash = "books/" + b.dataset.btab)));

function bookCard(b, owned) {
  return `<a class="bcard" href="#gutenberg/${b.id}">${coverHtml(b.cover, b.title, { own: owned })}
    <div><strong>${esc(b.title)}</strong><span class="au">${esc(b.authors.map(flipName).join(", ") || "Unknown author")}</span>
      ${b.summary ? `<p class="sm">${esc(b.summary)}</p>` : ""}
      <div class="meta"><span class="pill">${esc(b.languages.map((l) => LANGS[l] || l).join(", "))}</span><span class="pill">${b.downloads.toLocaleString()} reads</span>${b.copyright === false ? `<span class="pill completed">Public domain</span>` : ""}</div></div></a>`;
}

// ---------- Gutenberg ebooks ----------
async function renderEbooks(view, q0) {
  setCrumbs([["Books", "books"], ["Ebooks", ""]]);
  const f = { q: q0, topic: "", lang: ls.get("bLang", "en"), era: "", sort: "popular", page: 1 };
  view.innerHTML = head("ebooks", "Books", "Over 75,000 public-domain ebooks from Project Gutenberg, with a reader you can tune: themes, fonts, highlights, read-aloud and more.", "b-form", "Title or author", q0) + `
    <div class="toolbar">
      <select class="field" id="b-lang" style="width:auto" aria-label="Language">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${f.lang === k ? "selected" : ""}>${v}</option>`).join("")}</select>
      <select class="field" id="b-era" style="width:auto" aria-label="Author era">${Object.entries(ERAS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
      <select class="field" id="b-sort" style="width:auto" aria-label="Sort"><option value="popular">Most read</option><option value="ascending">Oldest on Gutenberg</option><option value="descending">Newest on Gutenberg</option></select>
      <span class="spacer"></span><button class="btn" type="button" id="b-surprise">${icon("star")}Surprise me</button>
    </div>
    <div class="chips" id="b-topics" style="margin-bottom:22px"><button class="chip" type="button" data-t="" aria-pressed="true">All topics</button>${TOPICS.map((t) => `<button class="chip" type="button" data-t="${esc(t.toLowerCase())}">${esc(t)}</button>`).join("")}</div>
    <p class="status" id="b-status"></p><div id="b-out"></div><div class="more"><button class="btn" type="button" id="b-more" hidden>Load more</button></div>`;
  const out = $("#b-out", view), status = $("#b-status", view);
  let seq = 0;
  const run = async (more = false) => {
    const my = ++seq;
    if (!more) { f.page = 1; out.innerHTML = `<div class="book-cards">${Array.from({ length: 8 }, () => `<div class="skeleton" style="height:150px;border-radius:10px"></div>`).join("")}</div>`; }
    status.className = "status"; status.textContent = "Loading from Project Gutenberg…"; $("#b-more", view).hidden = true;
    try {
      const p = new URLSearchParams({ page: f.page, languages: f.lang, sort: f.sort });
      if (f.q) p.set("search", f.q);
      if (f.topic) p.set("topic", f.topic);
      if (f.era) { p.set("author_year_start", ERA_YEARS[f.era][0]); p.set("author_year_end", ERA_YEARS[f.era][1]); }
      const d = await searchBooks(p);
      if (my !== seq) return;
      const owned = new Set(lib.items.filter((i) => i.source?.kind === "gutenberg").map((i) => i.source.gid));
      const html = d.results.map((b) => bookCard(b, owned.has(b.id))).join("");
      if (more) $(".book-cards", out).insertAdjacentHTML("beforeend", html); else out.innerHTML = `<div class="book-cards">${html}</div>`;
      status.textContent = d.count ? `${d.count.toLocaleString()} books` : "No books match. Try another language, topic or spelling.";
      $("#b-more", view).hidden = !d.hasNext;
    } catch (e) { if (my === seq) { status.className = "status err"; status.textContent = e.message; out.innerHTML = ""; } }
  };
  $("#b-form", view).onsubmit = (e) => { e.preventDefault(); f.q = $("#b-form input", view).value.trim(); run(); };
  $("#b-lang", view).onchange = (e) => { f.lang = e.target.value; ls.set("bLang", f.lang); run(); };
  $("#b-era", view).onchange = (e) => { f.era = e.target.value; run(); };
  $("#b-sort", view).onchange = (e) => { f.sort = e.target.value; run(); };
  $("#b-topics", view).onclick = (e) => { const c = e.target.closest("[data-t]"); if (!c) return; f.topic = c.dataset.t; $$("#b-topics .chip", view).forEach((x) => x.setAttribute("aria-pressed", String(x === c))); run(); };
  $("#b-more", view).onclick = () => { f.page++; run(true); };
  $("#b-surprise", view).onclick = async (e) => {
    const btn = e.currentTarget; btn.disabled = true; btn.lastChild.textContent = "Picking…";
    try {
      const p = { languages: f.lang, sort: "popular", page: 1 + Math.floor(Math.random() * (f.topic || f.q ? 3 : 20)) };
      if (f.topic) p.topic = f.topic; if (f.q) p.search = f.q;
      let d = await searchBooks(p);
      if (!d.results.length) d = await searchBooks({ ...p, page: 1 });
      const pick = d.results[Math.floor(Math.random() * d.results.length)];
      if (pick) location.hash = "gutenberg/" + pick.id; else toast("Nothing to pick from with these filters.");
    } catch (err) { toast(err.message); }
    btn.disabled = false; btn.lastChild.textContent = "Surprise me";
  };
  wireTabs(view);
  run();
}

export function gutenbergItem(b) {
  return {
    id: "gb-" + b.id, type: "book", title: b.title, author: b.authors.map(flipName).join(", "), cover: b.cover,
    description: b.summary, source: { kind: "gutenberg", gid: b.id }, origin: "Project Gutenberg", tags: [], status: "unread", rating: 0,
    subjects: b.subjects, added: Math.floor(Date.now() / 1000),
  };
}

async function renderGutenberg(view, id) {
  setCrumbs([["Books", "books"], ["…", ""]]);
  let b;
  try { b = await getBook(id); } catch (e) { view.innerHTML = emptyState("Couldn't load this book.", e.message, `<a class="btn" href="#books">Back</a>`); return; }
  setCrumbs([["Books", "books"], [b.title, ""]]);
  const existing = getItem("gb-" + b.id);
  const pct = existing ? progressPct((await allProgress())[existing.id]) : 0;
  view.innerHTML = `<div class="detail">
    <div class="detail-side">${coverHtml(b.cover, b.title, { pct })}
      <div style="display:grid;gap:8px">
        <button class="btn btn-accent btn-lg" type="button" id="g-read">${icon("book")}${pct ? "Continue reading" : "Read now"}</button>
        ${existing ? `<a class="btn" href="#item/${encodeURIComponent(existing.id)}">In your library</a>` : `<button class="btn" type="button" id="g-save">${icon("plus")}Save for later</button>`}
        ${b.hasEpub ? `<button class="btn" type="button" id="g-illus">${icon("book")}Read the illustrated edition</button>` : ""}
        <button class="btn" type="button" id="g-listen">${icon("headphones")}Find the audiobook</button>
        <a class="btn" href="#find/${encodeURIComponent((b.title.split(/[;:]/)[0] + " " + (b.authors[0] || "").split(",")[0]).trim())}">${icon("search")}Other editions</a>
        <button class="btn btn-ghost" type="button" id="g-share">${icon("link")}Copy link</button>
      </div></div>
    <div style="min-width:0">
      <p class="eyebrow">Project Gutenberg #${b.id} · ${b.copyright === false ? "Public domain in the US" : "Check copyright in your country"}</p>
      <h1>${esc(b.title)}</h1><p class="alt">${esc(b.authors.map(flipName).join(", "))}${b.authorYears[0]?.[0] ? ` (${b.authorYears[0][0]}–${b.authorYears[0][1] || ""})` : ""}</p>
      <dl class="facts"><div><dt>Language</dt><dd>${esc(b.languages.map((l) => LANGS[l] || l).join(", "))}</dd></div><div><dt>Reads</dt><dd>${b.downloads.toLocaleString()}</dd></div><div><dt>Formats</dt><dd>Text${b.hasEpub ? ", EPUB" : ""}</dd></div></dl>
      ${b.summary ? `<div class="section" style="margin-top:20px"><h3 class="h3" style="margin-bottom:8px">About this book</h3><p class="prose">${esc(b.summary)}</p></div>` : ""}
      ${b.subjects.length ? `<div class="section" style="margin-top:20px"><h3 class="h3" style="margin-bottom:8px">Subjects</h3><div class="tagrow">${b.subjects.map((s) => `<span>${esc(s)}</span>`).join("")}</div></div>` : ""}
      ${b.shelves.length ? `<div class="tagrow">${b.shelves.map((s) => `<span>${icon("shelf")} ${esc(s)}</span>`).join("")}</div>` : ""}
      <div class="panel" id="g-bio" style="margin-top:24px" hidden></div>
      <div class="section" id="g-more-wrap" style="margin-top:28px" hidden><h3 class="h3" style="margin-bottom:12px">More by ${esc(flipName(b.authors[0] || ""))}</h3><div class="rail" id="g-more"></div></div>
      <div style="margin-top:24px"><a class="btn btn-ghost" href="${esc(b.source)}" target="_blank" rel="noopener">${icon("globe")}Open on gutenberg.org ↗</a></div>
    </div></div>`;
  if (b.authors[0]) {
    import("../lookup.js").then((l) => l.authorBio(b.authors[0], b.authorYears[0])).then((w) => {
      const el = $("#g-bio", view); if (!el) return;
      el.hidden = false;
      el.innerHTML = `<div style="display:grid;grid-template-columns:${w.thumb ? "80px " : ""}minmax(0,1fr);gap:16px;align-items:start">
        ${w.thumb ? `<img src="${esc(w.thumb)}" alt="${esc(w.title)}" style="width:80px;border-radius:8px;object-fit:cover;aspect-ratio:3/4">` : ""}
        <div style="min-width:0"><p class="eyebrow" style="margin-bottom:6px">About the author</p><h3 class="h3">${esc(w.title)}</h3>${w.description ? `<p class="muted" style="margin:2px 0 8px;font-size:13px">${esc(w.description)}</p>` : ""}
        <p style="margin:0;max-width:68ch">${esc(w.extract)}</p><a class="link-btn" style="margin-top:8px" href="${esc(w.url)}" target="_blank" rel="noopener">Wikipedia ↗</a></div></div>`;
    }).catch(() => {});
    searchBooks({ search: b.authors[0].split(",")[0], languages: b.languages[0] || "en" }).then((d) => {
      const more = d.results.filter((x) => x.id !== b.id && x.authors.includes(b.authors[0])).slice(0, 14);
      if (!more.length || !$("#g-more", view)) return;
      $("#g-more-wrap", view).hidden = false;
      $("#g-more", view).innerHTML = more.map((x) => `<a class="card" href="#gutenberg/${x.id}">${coverHtml(x.cover, x.title)}<span class="card-t">${esc(x.title)}</span><span class="card-m">${x.downloads.toLocaleString()} reads</span></a>`).join("");
    }).catch(() => {});
  }
  $("#g-share", view).onclick = async () => { try { await navigator.clipboard.writeText(location.href); toast("Link copied."); } catch { toast(location.href, { ms: 8000 }); } };
  $("#g-illus", view)?.addEventListener("click", async () => {
    const it = await ensure("reading");
    it.source.illustrated = true; await saveItem(it);
    openItem(it);
  });
  const ensure = async (status) => existing || (await saveItem({ ...gutenbergItem(b), status }));
  $("#g-read", view).onclick = async () => openItem(await ensure("reading"));
  $("#g-save", view)?.addEventListener("click", async () => { await ensure("plan"); toast("Saved to your library.", { action: "View", onAction: () => (location.hash = "library/book") }); renderGutenberg(view, id); });
  $("#g-listen", view).onclick = () => (location.hash = "books/audio/" + encodeURIComponent(b.title.split(/[;:]/)[0]));
}

// ---------- Internet Archive scans ----------
async function renderScans(view, q0) {
  setCrumbs([["Books", "books"], ["Scanned books", ""]]);
  const f = { q: q0, page: 1, sort: "downloads", src: ls.get("scanSrc", "ia"), shelf: ls.get("scanShelf", "books") };
  const SRC = { ia: "Internet Archive", loc: "Library of Congress", ndl: "National Diet Library 🇯🇵", met: "The Met", cma: "Cleveland Museum", ol: "Open Library", wl: "Wellcome Collection", eu: "Europeana" };
  const SHELVES = { books: "Everything", comics: "Comics & cartoons", pulps: "Pulp magazines", magazines: "Magazines", newspapers: "Newspapers", children: "Children's books", folklore: "Fairy tales & myths", genre: "Sci-fi, mystery & horror", japanese: "Japanese books", music: "Sheet music", maps: "Maps & atlases", cookery: "Cookbooks" };
  const OPEN_LICENSES = { pdm: "Public domain", "cc-0": "CC0", "cc-by": "CC BY", "cc-by-nc": "CC BY-NC" };
  view.innerHTML = head("scans", "Books", "Original printed pages scanned by libraries, published before 1931. Illustrations, old typefaces and all.", "s-form", "Search scanned books", q0) + `
    <div class="toolbar"><div class="seg" id="s-src" role="group" aria-label="Library">${Object.entries(SRC).map(([k, v]) => `<button type="button" data-src="${k}" aria-pressed="${f.src === k}">${v}</button>`).join("")}</div>
      <span class="spacer"></span><select class="field" id="s-shelf" aria-label="Internet Archive shelf" style="width:auto">${Object.entries(SHELVES).map(([k, v]) => `<option value="${k}" ${f.shelf === k ? "selected" : ""}>${v}</option>`).join("")}</select><div class="seg" id="s-sort"><button type="button" data-s="downloads" aria-pressed="true">Most viewed</button><button type="button" data-s="date">Oldest first</button></div></div>
    <div class="chips" style="margin-bottom:18px">${["Fairy tales", "Japan", "Natural history", "Atlas", "Cookery", "Botany", "Children's books", "Art"].map((t) => `<button class="chip" type="button" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <p class="status" id="s-status"></p><div id="s-out">${skeletonGrid(18)}</div><div class="more"><button class="btn" type="button" id="s-more" hidden>Load more</button></div>`;
  const out = $("#s-out", view), status = $("#s-status", view);
  let seq = 0;
  const museumCache = [];
  const run = async (more = false) => {
    const my = ++seq;
    if (!more) { f.page = 1; out.innerHTML = skeletonGrid(18); }
    $("#s-sort", view).hidden = $("#s-shelf", view).hidden = f.src !== "ia";
    status.className = "status"; status.textContent = f.src === "loc" ? "Searching the Library of Congress… its catalog can take up to 10 seconds." : `Searching ${SRC[f.src]}…`;
    try {
      let html = "", d;
      if (f.src === "loc") {
        d = await api(`loc?page=${f.page}${f.q ? "&q=" + encodeURIComponent(f.q) : ""}`);
        html = d.results.map((s) => `<a class="card" href="#loc/${encodeURIComponent(s.id)}">${coverHtml(s.cover, s.title, { badge: s.year ? String(s.year) : "" })}<span class="card-t">${esc(s.title)}</span><span class="card-m">${esc(s.creator.split(",")[0] || "Library of Congress")}</span></a>`).join("");
      } else if (f.src === "met" || f.src === "cma") {
        // Museum open access: public-domain illustrated books, prints and albums with all their page photos.
        d = await api(`museum?src=${f.src}&page=${f.page}&q=${encodeURIComponent(f.q || (f.src === "met" ? "illustrated book" : "book"))}`);
        museumCache.push(...d.results);
        html = d.results.map((x) => `<button class="card" type="button" data-museum="${esc(x.id)}">${coverHtml(x.cover, x.title, { badge: x.pages.length > 1 ? x.pages.length + "p" : "" })}<span class="card-t">${esc(x.title)}</span><span class="card-m">${esc([x.creator, x.year].filter(Boolean).join(" · ") || x.culture)}</span></button>`).join("");
      } else if (f.src === "ndl") {
        // Japan's National Diet Library: classical and pre-${new Date().getFullYear() - 96} books, read through IIIF.
        d = await api(`ndl?page=${f.page}&q=${encodeURIComponent(f.q || "絵本")}`);
        html = d.results.map((x) => `<button class="card" type="button" data-wl="ndl${esc(x.id)}" data-manifest="${esc(x.manifest)}" data-title="${esc(x.title)}" data-license="Public domain" data-origin="National Diet Library">${coverHtml(x.cover, x.title, { badge: x.classic ? "Classic" : String(x.year || "") })}<span class="card-t">${esc(x.title)}</span><span class="card-m">${esc([x.creator, x.pages ? x.pages + "p" : ""].filter(Boolean).join(" · "))}</span></button>`).join("");
      } else if (f.src === "eu") {
        // Europeana: openly licensed texts from European libraries, opened through their IIIF manifests.
        const { europeana } = await import("../services.js");
        const r = await europeana(f.q || "illustrated book", { start: (f.page - 1) * 24 + 1 });
        d = { count: r.total, hasNext: f.page * 24 < r.total, results: r.results };
        html = r.results.map((x) => `<button class="card" type="button" data-wl="eu${esc(x.id.replace(/\//g, "_"))}" data-manifest="${esc(x.manifest)}" data-title="${esc(x.title)}" data-license="${esc(/publicdomain/.test(x.rights) ? "Public domain" : "Open licence")}">${coverHtml(x.cover, x.title, { badge: x.year || "" })}<span class="card-t">${esc(x.title)}</span><span class="card-m">${esc(x.provider)}</span></button>`).join("");
      } else if (f.src === "wl") {
        // Wellcome Collection: keep only items with page images under an open licence.
        const p = new URLSearchParams({ query: f.q || "illustrated", availabilities: "online", pageSize: "60", page: String(f.page), include: "items,production" });
        const r = await fetch("https://api.wellcomecollection.org/catalogue/v2/works?" + p, { signal: AbortSignal.timeout(20_000) });
        if (!r.ok) throw new Error(`Wellcome Collection answered ${r.status}.`);
        const raw = await r.json();
        const results = (raw.results || []).map((w) => {
          const loc = (w.items || []).flatMap((i) => i.locations || []).find((l) => /iiif-presentation/.test(l.locationType?.id || ""));
          const lic = loc?.license?.id;
          return loc && OPEN_LICENSES[lic] ? { id: w.id, title: w.title, manifest: loc.url, license: OPEN_LICENSES[lic], year: (w.production?.[0]?.dates?.[0]?.label || "").replace(/[[\]]/g, ""), type: w.workType?.label, thumb: w.thumbnail?.url?.replace(/\/full\/[^/]+\//, "/full/400,/") } : null;
        }).filter(Boolean);
        d = { count: results.length, hasNext: f.page < (raw.totalPages || 1), results };
        html = results.map((x) => `<button class="card" type="button" data-wl="${esc(x.id)}" data-manifest="${esc(x.manifest)}" data-title="${esc(x.title)}" data-license="${esc(x.license)}">${coverHtml(x.thumb, x.title, { badge: x.license })}<span class="card-t">${esc(x.title)}</span><span class="card-m">${esc([x.year, x.type].filter(Boolean).join(" · "))}</span></button>`).join("");
      } else if (f.src === "ol") {
        const p = new URLSearchParams({ q: f.q || "illustrated", ebook_access: "public", has_fulltext: "true", page: String(f.page), limit: "24", fields: "key,title,author_name,first_publish_year,ia,cover_i" });
        const r = await fetch("https://openlibrary.org/search.json?" + p, { signal: AbortSignal.timeout(20_000) });
        if (!r.ok) throw new Error(`Open Library answered ${r.status}.`);
        const raw = await r.json();
        d = { count: raw.numFound, hasNext: f.page * 24 < raw.numFound, results: raw.docs.filter((x) => x.ia?.length) };
        html = d.results.map((x) => `<button class="card" type="button" data-ol="${esc(x.ia.slice(0, 8).join(","))}">${coverHtml(x.cover_i ? `https://covers.openlibrary.org/b/id/${x.cover_i}-M.jpg` : null, x.title, { badge: x.first_publish_year ? String(x.first_publish_year) : "" })}<span class="card-t">${esc(x.title)}</span><span class="card-m">${esc((x.author_name || [])[0] || "")}</span></button>`).join("");
      } else {
        d = await api(`scans?kind=${f.shelf}&page=${f.page}&sort=${f.sort}${f.q ? "&q=" + encodeURIComponent(f.q) : ""}`);
        html = d.results.map((s) => `<a class="card" href="#scan/${encodeURIComponent(s.id)}">${coverHtml(s.cover, s.title, { badge: s.year ? String(s.year) : "" })}<span class="card-t">${esc(s.title)}</span><span class="card-m">${esc([s.creator.split(",")[0], s.pages + "p"].filter(Boolean).join(" · "))}</span></a>`).join("");
      }
      if (my !== seq) return;
      if (more) $(".grid", out).insertAdjacentHTML("beforeend", html); else out.innerHTML = html ? `<div class="grid">${html}</div>` : "";
      status.textContent = d.results.length || more ? (f.src === "ndl" ? `Public-domain books from ${d.count.toLocaleString()} matches on the National Diet Library` : `${(d.count || d.results.length).toLocaleString()} scanned books on ${SRC[f.src]}${f.src === "ol" ? " marked free to read" : ""}`) : "Nothing found. Try another word.";
      $("#s-more", view).hidden = !d.hasNext;
    } catch (e) { if (my === seq) { status.className = "status err"; status.textContent = e.message; out.innerHTML = ""; } }
  };
  $("#s-shelf", view).onchange = (e) => { f.shelf = e.target.value; ls.set("scanShelf", f.shelf); run(); };
  $("#s-src", view).onclick = (e) => { const b = e.target.closest("[data-src]"); if (!b) return; f.src = b.dataset.src; ls.set("scanSrc", f.src); $$("#s-src button", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); run(); };
  out.addEventListener("click", async (e) => {
    const w = e.target.closest("[data-wl]");
    if (w) {
      const id = "wl-" + w.dataset.wl;
      let item = getItem(id);
      if (!item) {
        w.disabled = true; toast("Opening from the Wellcome Collection…");
        try {
          const { importIIIF } = await import("../importers.js");
          const made = await importIIIF(w.dataset.manifest, { title: w.dataset.title, origin: `${w.dataset.origin || (w.dataset.wl.startsWith("eu") ? "Europeana" : "Wellcome Collection")} (${w.dataset.license})`, ...(w.dataset.origin === "National Diet Library" ? { dir: "rtl" } : {}) });
          // Re-save under a stable id so opening it again doesn't duplicate it.
          const { deleteItem } = await import("../store.js");
          await deleteItem(made.id);
          item = await saveItem({ ...made, id, dir: made.dir || (w.dataset.origin === "National Diet Library" ? "rtl" : "ltr") });
        } catch (err) { toast(err.message, { ms: 6000 }); w.disabled = false; return; }
      }
      return openItem(item);
    }
    const mu = e.target.closest("[data-museum]");
    if (mu) {
      const x = museumCache.find((r) => r.id === mu.dataset.museum); if (!x) return;
      const item = getItem(x.id) || await saveItem({ id: x.id, type: "manga", title: x.title, series: x.creator || SRC[f.src], author: x.creator, cover: x.cover,
        pages: x.pages.length, dir: /japan/i.test(x.culture) && x.pages.length > 2 ? "rtl" : "ltr", source: { kind: "urls", urls: x.pages },
        origin: `${f.src === "met" ? "The Metropolitan Museum of Art" : "Cleveland Museum of Art"} (${x.license})`, credit: { creator: x.creator, license: x.license, url: x.source },
        description: [x.kind, x.culture, x.year].filter(Boolean).join(" · "), tags: ["museum"], status: "unread", rating: 0, added: Math.floor(Date.now() / 1000), year: x.year });
      return openItem(item);
    }
    const b = e.target.closest("[data-ol]"); if (!b) return;
    b.disabled = true; toast("Finding a free copy…");
    try { const r = await api("ol/scan?ids=" + encodeURIComponent(b.dataset.ol)); location.hash = "scan/" + encodeURIComponent(r.id); }
    catch (err) { toast(err.message, { ms: 6000 }); b.disabled = false; }
  });
  $("#s-form", view).onsubmit = (e) => { e.preventDefault(); f.q = $("#s-form input", view).value.trim(); run(); };
  $$("[data-t]", view).forEach((c) => (c.onclick = () => { f.q = c.dataset.t; $("#s-form input", view).value = f.q; run(); }));
  $$("#s-sort [data-s]", view).forEach((b) => (b.onclick = () => { f.sort = b.dataset.s; $$("#s-sort [data-s]", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); run(); }));
  $("#s-more", view).onclick = () => { f.page++; run(true); };
  wireTabs(view);
  run();
}

export function iaToItem(s) {
  const japanese = /jap|jpn/i.test(s.language || "") || /hokusai|manga|ehon|hiroshige|kuniyoshi|utamaro/i.test(s.title);
  return {
    id: "ia-" + s.id, type: "manga", title: s.title, series: s.creator ? s.creator.split(",")[0] : "Internet Archive", author: s.creator,
    cover: s.cover, description: s.description, pages: s.pages, dir: s.rtl || japanese ? "rtl" : "ltr",
    source: { kind: "template", template: s.pageTemplate, ia: s.id }, origin: "Internet Archive", tags: [], status: "unread", rating: 0, added: Math.floor(Date.now() / 1000), year: s.year,
  };
}

async function renderScan(view, id) {
  setCrumbs([["Books", "books"], ["…", ""]]);
  let s;
  try { s = await api("ia/" + encodeURIComponent(id)); } catch (e) { view.innerHTML = emptyState("Couldn't open this scan.", e.message, `<a class="btn" href="#books/scans">Back</a>`); return; }
  setCrumbs([["Books", "books/scans"], [s.title, ""]]);
  const existing = getItem("ia-" + s.id);
  view.innerHTML = `<div class="detail">
    <div class="detail-side">${coverHtml(s.cover, s.title)}
      <div style="display:grid;gap:8px"><button class="btn btn-accent btn-lg" type="button" id="sc-read">${icon("book")}Read the scan</button>
      <button class="btn" type="button" id="sc-text" title="Uses the library's recognized text (OCR). Old type can have mistakes.">${icon("type")}Read as text</button>
      ${existing ? `<a class="btn" href="#item/${encodeURIComponent(existing.id)}">In your library</a>` : `<button class="btn" type="button" id="sc-save">${icon("plus")}Save to library</button>`}</div></div>
    <div style="min-width:0"><p class="eyebrow">Internet Archive scan${s.year ? ` · ${s.year}` : ""} · ${s.publicDomain ? "Public domain in the US" : "Check the rights before sharing"}</p>
      <h1>${esc(s.title)}</h1><p class="alt">${esc(s.creator)}</p>
      <dl class="facts"><div><dt>Pages</dt><dd>${s.pages}</dd></div>${s.language ? `<div><dt>Language</dt><dd>${esc(s.language)}</dd></div>` : ""}<div><dt>Reading</dt><dd>${s.rtl ? "Right to left" : "Left to right"}</dd></div></dl>
      ${s.description ? `<div class="section" style="margin-top:20px"><p class="prose">${esc(s.description)}</p></div>` : ""}
      <div style="margin-top:24px"><a class="btn btn-ghost" href="${esc(s.source)}" target="_blank" rel="noopener">${icon("globe")}Open on archive.org ↗</a></div></div></div>`;
  const ensure = async (status) => existing || (await saveItem({ ...iaToItem(s), status }));
  $("#sc-read", view).onclick = async () => openItem(await ensure("reading"));
  // Text mode: the scan's recognized text in the book reader (searchable, resizable, read-aloud).
  $("#sc-text", view).onclick = async (e) => {
    const btn = e.currentTarget, id = "iat-" + s.id;
    let item = getItem(id);
    if (!item) {
      btn.disabled = true; btn.lastChild.textContent = "Loading text…";
      try {
        const text = await api(`ia/${encodeURIComponent(s.id)}/text`);
        item = await saveItem({ id, type: "book", title: s.title, author: s.creator, description: s.description, cover: s.cover, source: { kind: "text", text }, origin: "Internet Archive (recognized text)", tags: [], status: "reading", rating: 0, added: Math.floor(Date.now() / 1000) });
      } catch (err) { toast(err.message, { ms: 6000 }); btn.disabled = false; btn.lastChild.textContent = "Read as text"; return; }
    }
    openItem(item);
  };
  $("#sc-save", view)?.addEventListener("click", async () => { await ensure("plan"); toast("Saved to your library."); renderScan(view, id); });
}

// ---------- LibriVox audiobooks ----------
async function renderAudioList(view, q0) {
  setCrumbs([["Books", "books"], ["Audiobooks", ""]]);
  view.innerHTML = head("audio", "Books", "Public-domain audiobooks read by LibriVox volunteers. Keep listening while you browse; Kitsune remembers where you stopped.", "a-form", "Title or author's last name", q0) + `<p class="status" id="a-status"></p><div id="a-out">${skeletonGrid(12)}</div>`;
  const out = $("#a-out", view), status = $("#a-status", view);
  const run = async (q) => {
    out.innerHTML = skeletonGrid(12); status.className = "status"; status.textContent = q ? `Searching LibriVox for “${q}”…` : "Loading favorites…";
    try {
      const d = await api("audio" + (q ? "?q=" + encodeURIComponent(q) : ""));
      out.innerHTML = d.results.length ? `<div class="grid">${d.results.map((b) => `<a class="card" href="#audiobook/${b.id}">${coverHtml(b.cover, b.title, { badge: b.language && b.language !== "English" ? b.language : "" })}<span class="card-t">${esc(b.title)}</span><span class="card-m">${esc([b.authors[0], b.totalTime].filter(Boolean).join(" · "))}</span></a>`).join("")}</div>` : "";
      status.textContent = q ? (d.results.length ? `${plural(d.results.length, "audiobook")} for “${q}”` : `Nothing for “${q}”. LibriVox matches titles from the start, or an author's last name.`) : "Listener favorites";
    } catch (e) { status.className = "status err"; status.textContent = e.message; out.innerHTML = ""; }
  };
  $("#a-form", view).onsubmit = (e) => { e.preventDefault(); run($("#a-form input", view).value.trim()); };
  wireTabs(view);
  run(q0);
}

export function audioToItem(b) {
  return {
    id: "lv-" + b.id, type: "audio", title: b.title, author: b.authors.join(", "), cover: b.cover, description: b.description,
    source: { kind: "librivox", lid: b.id, chapters: b.chapters }, totalSecs: b.totalSecs, origin: "LibriVox", tags: [], status: "unread", rating: 0, added: Math.floor(Date.now() / 1000),
  };
}

async function renderAudio(view, id) {
  setCrumbs([["Books", "books/audio"], ["…", ""]]);
  let b;
  try { b = await api("audio/" + Number(id)); } catch (e) { view.innerHTML = emptyState("Couldn't load this audiobook.", e.message, `<a class="btn" href="#books/audio">Back</a>`); return; }
  setCrumbs([["Audiobooks", "books/audio"], [b.title, ""]]);
  const existing = getItem("lv-" + b.id);
  const p = existing ? (await allProgress())[existing.id] : null;
  const doneSet = new Set(p?.done || []);
  const gid = Number((b.textSource || "").match(/gutenberg\.org\/(?:ebooks|etext|files)\/(\d+)/)?.[1]) || null;
  view.innerHTML = `<div class="detail">
    <div class="detail-side">${coverHtml(b.cover, b.title)}
      <div style="display:grid;gap:8px"><button class="btn btn-accent btn-lg" type="button" id="au-play">${icon("play")}${p ? "Resume" : "Play"}</button>
      ${gid ? `<button class="btn" type="button" id="au-along">${icon("book")}Read along</button>` : ""}
      ${existing ? `<a class="btn" href="#item/${encodeURIComponent(existing.id)}">In your library</a>` : `<button class="btn" type="button" id="au-save">${icon("plus")}Save to library</button>`}</div></div>
    <div style="min-width:0"><p class="eyebrow">LibriVox audiobook · ${esc(b.language || "")}</p><h1>${esc(b.title)}</h1><p class="alt">${esc(b.authors.join(", "))}</p>
      <dl class="facts"><div><dt>Length</dt><dd>${esc(b.totalTime || "—")}</dd></div><div><dt>Sections</dt><dd>${b.chapters.length}</dd></div>${b.genres.length ? `<div><dt>Genre</dt><dd>${esc(b.genres.join(", "))}</dd></div>` : ""}</dl>
      ${b.description ? `<div class="section" style="margin-top:20px"><p class="prose">${esc(b.description)}</p></div>` : ""}
      <div class="section" style="margin-top:24px"><h3 class="h3" style="margin-bottom:10px">Chapters</h3>
        <div class="chapters">${b.chapters.map((c, i) => `<button class="chapter ${p?.pos === i ? "current" : ""}" type="button" data-ch="${i}"><span class="n">${doneSet.has(i) ? `<span class="done">${icon("check")}</span>` : c.n}</span><div style="min-width:0"><strong style="display:block">${esc(c.title)}</strong><span class="muted" style="font-size:12px">${esc(c.readers.join(", "))}</span></div><span class="t">${fmtDuration(c.secs)}</span></button>`).join("")}</div></div>
      <div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-ghost" href="${esc(b.source)}" target="_blank" rel="noopener">${icon("globe")}LibriVox page ↗</a>${b.textSource ? `<a class="btn btn-ghost" href="${esc(b.textSource)}" target="_blank" rel="noopener">${icon("book")}Source text ↗</a>` : ""}</div></div></div>`;
  const ensure = async (status) => { const it = getItem("lv-" + b.id); if (it) { it.source.chapters = b.chapters; return it; } return saveItem({ ...audioToItem(b), status }); };
  $("#au-play", view).onclick = async () => openItem(await ensure("reading"));
  $("#au-along", view)?.addEventListener("click", async (e) => {
    e.currentTarget.disabled = true;
    try {
      await openItem(await ensure("reading"));
      const book = getItem("gb-" + gid) || await saveItem({ ...gutenbergItem(await getBook(gid)), status: "reading" });
      openItem(book);
      toast("Reading along. The audio keeps playing; press K to pause.");
    } catch (err) { toast(err.message); }
    e.currentTarget.disabled = false;
  });
  $("#au-save", view)?.addEventListener("click", async () => { await ensure("plan"); toast("Saved to your library."); renderAudio(view, id); });
  $$("[data-ch]", view).forEach((c) => (c.onclick = async () => openItem(await ensure("reading"), { chapter: Number(c.dataset.ch) })));
}

// ---------- Google Books ----------
async function renderGoogle(view, q0) {
  setCrumbs([["Books", "books"], ["Google Books", ""]]);
  const { googleBooks, getKeys } = await import("../services.js");
  const hasKey = !!(await getKeys()).google;
  const f = { q: q0, free: ls.get("gbFree", false), start: 0 };
  view.innerHTML = head("google", "Books", "Search Google Books for any book: free public-domain editions to read, previews, and where to buy.", "gg-form", "Title, author or ISBN", q0) + `
    <div class="toolbar"><div class="seg" id="gg-free"><button type="button" data-f="0" aria-pressed="${!f.free}">All books</button><button type="button" data-f="1" aria-pressed="${f.free}">Free to read</button></div>
      <span class="spacer"></span><span class="muted" style="font-size:13px">${hasKey ? "Using your API key" : `Shared free quota · <a class="link-btn" href="#accounts">add your own key</a>`}</span></div>
    <p class="status" id="gg-status"></p><div class="book-cards" id="gg-out"></div><div class="more"><button class="btn" type="button" id="gg-more" hidden>Load more</button></div>`;
  const out = $("#gg-out", view), status = $("#gg-status", view);
  const VIEW = { ALL_PAGES: ["Free to read", "completed"], PARTIAL: ["Preview", "reading"], NO_PAGES: ["", ""], UNKNOWN: ["", ""] };
  const run = async (more = false) => {
    if (!f.q) { status.textContent = "Search for any book. Free public-domain editions show a Free to read badge."; return; }
    if (!more) { f.start = 0; out.innerHTML = ""; }
    status.className = "status"; status.textContent = "Searching Google Books…";
    try {
      const d = await googleBooks(f.q, { free: f.free, start: f.start });
      out.insertAdjacentHTML("beforeend", d.results.map((b) => {
        const [vl, vc] = VIEW[b.view] || ["", ""];
        return `<div class="bcard" style="cursor:default">${coverHtml(b.cover, b.title)}
          <div><strong>${esc(b.title)}</strong><span class="au">${esc([b.authors.join(", "), b.year].filter(Boolean).join(" · "))}</span>
            ${b.description ? `<p class="sm">${esc(b.description)}</p>` : ""}
            <div class="meta">${vl ? `<span class="pill ${vc}">${vl}</span>` : ""}${b.publicDomain ? `<span class="pill completed">Public domain</span>` : ""}${b.price ? `<span class="pill">${esc(b.price)}</span>` : ""}</div>
            <div class="linkgrid" style="margin-top:8px">
              ${b.view === "ALL_PAGES" || b.view === "PARTIAL" ? `<a class="btn btn-sm ${b.view === "ALL_PAGES" ? "btn-accent" : ""}" href="${esc(b.readLink)}" target="_blank" rel="noopener">${b.view === "ALL_PAGES" ? "Read free" : "Preview"} ↗</a>` : ""}
              ${b.epub ? `<a class="btn btn-sm" href="${esc(b.epub)}" target="_blank" rel="noopener">EPUB ↗</a>` : ""}${b.pdf ? `<a class="btn btn-sm" href="${esc(b.pdf)}" target="_blank" rel="noopener">PDF ↗</a>` : ""}
              ${b.buy ? `<a class="btn btn-sm" href="${esc(b.buy)}" target="_blank" rel="noopener">Buy ↗</a>` : ""}
              <a class="btn btn-sm btn-ghost" href="#find/${encodeURIComponent((b.title.split(":")[0] + " " + (b.authors[0] || "")).trim())}">${icon("search")}Where to read</a></div></div></div>`;
      }).join(""));
      status.textContent = d.total ? `About ${d.total.toLocaleString()} books on Google Books${f.free ? " that are free to read" : ""}. Downloaded EPUB and PDF files can be added to Kitsune.` : "Nothing found.";
      f.start += d.results.length; $("#gg-more", view).hidden = !d.results.length || f.start >= d.total;
    } catch (e) { status.className = "status err"; status.innerHTML = esc(e.message) + (e.quota ? ` <a class="link-btn" href="#accounts">Add a key</a>` : ""); }
  };
  $("#gg-form", view).onsubmit = (e) => { e.preventDefault(); f.q = $("#gg-form input", view).value.trim(); run(); };
  $("#gg-free", view).onclick = (e) => { const b = e.target.closest("[data-f]"); if (!b) return; f.free = b.dataset.f === "1"; ls.set("gbFree", f.free); $$("#gg-free button", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); run(); };
  $("#gg-more", view).onclick = () => run(true);
  wireTabs(view); run();
}

// ---------- Wikisource ----------
const WS_STARTERS = { en: ["Frankenstein", "The Tale of Genji", "The Art of War", "Grimm's Fairy Tales", "Kwaidan", "Hōjōki"], ja: ["源氏物語", "羅生門", "坊っちゃん", "銀河鉄道の夜", "方丈記", "竹取物語"], zh: ["西遊記", "紅樓夢", "論語", "三國演義"], fr: ["Les Misérables", "Le Petit Prince", "Candide"], de: ["Faust", "Die Verwandlung", "Grimms Märchen"] };
async function renderWikisource(view, q0) {
  setCrumbs([["Books", "books"], ["Wikisource", ""]]);
  const { WS_LANGS, searchWikisource } = await import("../wikisource.js");
  const f = { q: q0, lang: ls.get("wsLang", (navigator.language || "en").slice(0, 2) in WS_LANGS ? (navigator.language || "en").slice(0, 2) : "en"), offset: 0 };
  view.innerHTML = head("wikisource", "Books", "Public-domain texts transcribed by Wikisource volunteers, in many languages, including Japanese and Chinese classics. Japanese reads well with vertical text, under Aa in the reader.", "ws-form", "Title or author", q0) + `
    <div class="toolbar"><select class="field" id="ws-lang" style="width:auto" aria-label="Language">${Object.entries(WS_LANGS).map(([k, v]) => `<option value="${k}" ${k === f.lang ? "selected" : ""}>${v}</option>`).join("")}</select>
      <div class="chips" id="ws-start"></div></div>
    <p class="status" id="ws-status"></p><div class="list" id="ws-out"></div><div class="more"><button class="btn" type="button" id="ws-more" hidden>Load more</button></div>`;
  const out = $("#ws-out", view), status = $("#ws-status", view);
  const starters = () => { $("#ws-start", view).innerHTML = (WS_STARTERS[f.lang] || WS_STARTERS.en).map((t) => `<button class="chip" type="button" data-t="${esc(t)}">${esc(t)}</button>`).join(""); };
  const run = async (more = false) => {
    if (!f.q) { out.innerHTML = ""; status.textContent = "Search for a title or author, or try one of these."; return; }
    if (!more) { f.offset = 0; out.innerHTML = ""; }
    status.className = "status"; status.textContent = "Searching Wikisource…";
    try {
      const d = await searchWikisource(f.q, f.lang, f.offset);
      out.insertAdjacentHTML("beforeend", d.results.map((r) => `<button class="row" type="button" data-ws="${esc(r.title)}" style="grid-template-columns:44px minmax(0,1fr) auto">
        <span style="width:44px;height:58px;border-radius:4px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent);font:600 20px var(--f-book, Georgia)">${esc([...r.title][0] || "W")}</span>
        <div class="row-main"><strong>${esc(r.title)}</strong><span class="sub" style="white-space:normal">${esc(r.snippet)}…</span></div><span class="btn btn-sm btn-accent">Read</span></button>`).join(""));
      status.textContent = d.total ? `${d.total.toLocaleString()} pages match “${f.q}” (works shown once)` : `Nothing on Wikisource for “${f.q}” in ${WS_LANGS[f.lang]}.`;
      f.offset = d.next; $("#ws-more", view).hidden = d.next == null;
    } catch (e) { status.className = "status err"; status.textContent = e.message; }
  };
  $("#ws-form", view).onsubmit = (e) => { e.preventDefault(); f.q = $("#ws-form input", view).value.trim(); run(); };
  $("#ws-lang", view).onchange = (e) => { f.lang = e.target.value; ls.set("wsLang", f.lang); starters(); run(); };
  $("#ws-start", view).onclick = (e) => { const c = e.target.closest("[data-t]"); if (!c) return; f.q = c.dataset.t; $("#ws-form input", view).value = f.q; run(); };
  $("#ws-more", view).onclick = () => run(true);
  out.onclick = async (e) => {
    const b = e.target.closest("[data-ws]"); if (!b) return;
    const title = b.dataset.ws, id = `ws-${f.lang}-${title}`.slice(0, 120);
    const item = getItem(id) || await saveItem({ id, type: "book", title, author: "", lang: f.lang, source: { kind: "wikisource", lang: f.lang, title }, origin: `Wikisource (${WS_LANGS[f.lang]})`, tags: [], status: "reading", rating: 0, added: Math.floor(Date.now() / 1000) });
    openItem(item);
  };
  starters(); wireTabs(view); run();
}

// ---------- Library of Congress item ----------
export function locToItem(s) {
  return { id: "loc-" + s.id, type: "manga", title: s.title, series: s.creator ? s.creator.split(",")[0] : "Library of Congress", author: s.creator, description: s.description,
    source: { kind: "urls", urls: s.pages }, pages: s.pages.length, cover: s.pages[0]?.replace("/full/1400,/", "/full/400,/"), dir: "ltr", year: s.year,
    origin: "Library of Congress", tags: [], status: "unread", rating: 0, added: Math.floor(Date.now() / 1000) };
}
async function renderLoc(view, id) {
  setCrumbs([["Books", "books/scans"], ["…", ""]]);
  view.innerHTML = `<p class="status">Loading from the Library of Congress…</p>`;
  let s;
  try { s = await api("loc/" + encodeURIComponent(id)); } catch (e) { view.innerHTML = emptyState("Couldn't open this item.", e.message, `<a class="btn" href="#books/scans">Back</a>`); return; }
  setCrumbs([["Books", "books/scans"], [s.title, ""]]);
  const existing = getItem("loc-" + s.id);
  view.innerHTML = `<div class="detail">
    <div class="detail-side">${coverHtml(s.pages[0].replace("/full/1400,/", "/full/400,/"), s.title)}
      <div style="display:grid;gap:8px"><button class="btn btn-accent btn-lg" type="button" id="lc-read">${icon("book")}Read the scan</button>
      ${existing ? `<a class="btn" href="#item/${encodeURIComponent(existing.id)}">In your library</a>` : `<button class="btn" type="button" id="lc-save">${icon("plus")}Save to library</button>`}</div></div>
    <div style="min-width:0"><p class="eyebrow">Library of Congress${s.year ? ` · ${s.year}` : ""} · ${s.publicDomain ? "Public domain in the US" : "Check the rights statement"}</p>
      <h1>${esc(s.title)}</h1><p class="alt">${esc(s.creator)}</p>
      <dl class="facts"><div><dt>Pages</dt><dd>${s.pages.length}</dd></div>${s.year ? `<div><dt>Published</dt><dd>${s.year}</dd></div>` : ""}</dl>
      ${s.description ? `<div class="section" style="margin-top:20px"><p class="prose">${esc(s.description)}</p></div>` : ""}
      ${s.rights ? `<p class="muted" style="font-size:13px;margin-top:16px">${esc(s.rights)}</p>` : ""}
      <div style="margin-top:24px"><a class="btn btn-ghost" href="${esc(s.source)}" target="_blank" rel="noopener">${icon("globe")}Open on loc.gov ↗</a></div></div></div>`;
  const ensure = async (status) => existing || (await saveItem({ ...locToItem(s), status }));
  $("#lc-read", view).onclick = async () => openItem(await ensure("reading"));
  $("#lc-save", view)?.addEventListener("click", async () => { await ensure("plan"); toast("Saved to your library."); renderLoc(view, id); });
}

// ---------- Standard Ebooks ----------
async function renderStandard(view, q0) {
  setCrumbs([["Books", "books"], ["Standard Ebooks", ""]]);
  const f = { q: q0, sort: "popular", page: 1 };
  view.innerHTML = head("standard", "Books", "Public-domain classics re-edited and typeset with care by Standard Ebooks volunteers. Download the EPUB from their site, then add it here with one click.", "se-form", "Title or author", q0) + `
    <div class="toolbar"><div class="seg" id="se-sort"><button type="button" data-s="popular" aria-pressed="true">Popular</button><button type="button" data-s="new" aria-pressed="false">Newest</button></div>
      <span class="spacer"></span><button class="btn btn-accent" type="button" id="se-import">${icon("upload")}Add a downloaded EPUB</button></div>
    <div class="panel" style="margin-bottom:20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="ico" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent)">${icon("download")}</span>
      <p style="margin:0;flex:1 1 300px;font-size:14px"><strong>How it works:</strong> pick a book, choose <em>Get the EPUB</em> to download it from standardebooks.org, then drop the file anywhere on Kitsune. It opens in the book reader with full formatting, contents and illustrations.</p></div>
    <p class="status" id="se-status"></p><div id="se-out">${skeletonGrid(18)}</div><div class="more"><button class="btn" type="button" id="se-more" hidden>Load more</button></div>`;
  const out = $("#se-out", view), status = $("#se-status", view);
  const run = async (more = false) => {
    if (!more) { f.page = 1; out.innerHTML = skeletonGrid(18); }
    status.className = "status"; status.textContent = "Loading from Standard Ebooks…";
    try {
      const d = await api(`standard?page=${f.page}&sort=${f.sort}${f.q ? "&q=" + encodeURIComponent(f.q) : ""}`);
      const html = d.results.map((b) => `<div class="card"><a href="${esc(b.url)}" target="_blank" rel="noopener" style="display:contents">${coverHtml(b.cover, b.title)}</a>
        <span class="card-t">${esc(b.title)}</span><span class="card-m">${esc(b.authors.join(", "))}</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><a class="btn btn-sm btn-accent" href="${esc(b.url)}#downloads" target="_blank" rel="noopener">${icon("download")}Get the EPUB</a></div></div>`).join("");
      if (more) $(".grid", out).insertAdjacentHTML("beforeend", html); else out.innerHTML = d.results.length ? `<div class="grid">${html}</div>` : "";
      status.textContent = d.results.length || more ? (f.q ? `Results for “${f.q}”` : f.sort === "new" ? "Newest releases" : "Most popular") : `Nothing found${f.q ? ` for “${f.q}”` : ""}.`;
      $("#se-more", view).hidden = !d.hasNext;
    } catch (e) { status.className = "status err"; status.textContent = e.message; out.innerHTML = ""; }
  };
  $("#se-form", view).onsubmit = (e) => { e.preventDefault(); f.q = $("#se-form input", view).value.trim(); run(); };
  $("#se-sort", view).onclick = (e) => { const b = e.target.closest("[data-s]"); if (!b) return; f.sort = b.dataset.s; $$("#se-sort button", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); run(); };
  $("#se-more", view).onclick = () => { f.page++; run(true); };
  $("#se-import", view).onclick = async () => (await import("./link.js")).openImport(null, { mode: "files" });
  wireTabs(view);
  run();
}

// ---------- your own book files ----------
async function renderMine(view) {
  setCrumbs([["Books", "books"], ["Your books", ""]]);
  const prog = await allProgress();
  const items = lib.items.filter((i) => i.type !== "manga").sort((a, b) => (prog[b.id]?.updated || b.added || 0) - (prog[a.id]?.updated || a.added || 0));
  view.innerHTML = head("mine", "Books", "Ebooks and audiobooks in your library, plus EPUB, PDF and text files you add.") + `
    <div class="toolbar"><button class="btn btn-accent" type="button" id="m-up">${icon("upload")}Add EPUB, PDF or TXT</button><span class="muted" style="font-size:13px">DRM-free files only. They stay on this device.</span></div>
    ${items.length ? `<div class="grid" id="m-grid">${items.map((i) => itemCard(i, prog[i.id])).join("")}</div>` : emptyState("No books yet.", "Open any ebook, scan or audiobook and it lands here, or add your own files.")}`;
  $("#m-up", view).onclick = async () => (await import("./link.js")).openImport(null, { mode: "files" });
  const g = $("#m-grid", view); if (g) wireItems(g, () => renderMine(view));
  wireTabs(view);
}

// ---------- Poems (PoetryDB: public-domain poetry) ----------
const POETS = ["Emily Dickinson", "William Shakespeare", "Edgar Allan Poe", "Walt Whitman", "John Keats", "William Blake", "Christina Rossetti", "Percy Bysshe Shelley", "Lord Byron", "Elizabeth Barrett Browning", "William Wordsworth", "Henry Wadsworth Longfellow"];
// Fetch JSON straight from the source; if the browser is blocked, go through Kitsune's server.
async function openJSON(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(15_000) }); if (!r.ok) throw new Error(String(r.status)); return await r.json(); }
  catch { const v = await api("feed?as=json&url=" + encodeURIComponent(url)); return typeof v === "string" ? JSON.parse(v) : v; }
}
async function poetry(path) {
  const d = await openJSON("https://poetrydb.org/" + path).catch(() => []);
  return Array.isArray(d) ? d : [];
}
async function renderPoems(view, q0) {
  setCrumbs([["Books", "books"], ["Poems", ""]]);
  view.innerHTML = head("poems", "Books", "Thousands of classic public-domain poems from PoetryDB. Read them here, or save one to your library to highlight and read aloud.", "pm-form", "Poem title or poet", q0) + `
    <div class="chips" style="margin-bottom:18px">${POETS.map((t) => `<button class="chip" type="button" data-poet="${esc(t)}">${esc(t)}</button>`).join("")}<button class="chip" type="button" id="pm-rand">${icon("star")}Surprise me</button></div>
    <div class="pm-layout"><div><p class="status" id="pm-s"></p><div class="list" id="pm-out"></div></div><article class="pm-read" id="pm-read" hidden></article></div>`;
  wireTabs(view);
  const out = $("#pm-out", view), st = $("#pm-s", view);
  let list = [];
  const show = (rows, label) => {
    list = rows;
    st.className = "status"; st.textContent = rows.length ? `${plural(rows.length, "poem")}${label ? " · " + label : ""}` : "No poems found. Try a poet's surname.";
    out.innerHTML = rows.slice(0, 200).map((r, i) => `<button class="row" type="button" data-i="${i}" style="grid-template-columns:minmax(0,1fr) auto;text-align:left"><div class="row-main"><strong>${esc(r.title)}</strong><span class="sub">${esc(r.author)}</span></div><span class="muted" style="font-size:12px">${r.linecount ? plural(Number(r.linecount), "line") : ""}</span></button>`).join("");
  };
  const search = async (q) => {
    st.className = "status"; st.textContent = "Searching PoetryDB…"; out.innerHTML = "";
    try {
      const e = encodeURIComponent(q);
      const [a, t] = await Promise.all([poetry(`author/${e}/title,author,linecount`), poetry(`title/${e}/title,author,linecount`)]);
      const seen = new Set();
      show([...a, ...t].filter((r) => { const k = r.author + "|" + r.title; if (seen.has(k)) return false; seen.add(k); return true; }), q);
    } catch (err) { st.className = "status err"; st.textContent = "PoetryDB didn't answer. " + err.message; }
  };
  const open = async (r) => {
    const box = $("#pm-read", view); box.hidden = false; box.innerHTML = `<p class="status">Loading…</p>`;
    try {
      const full = r.lines ? r : (await poetry(`author,title/${encodeURIComponent(r.author)};${encodeURIComponent(r.title)}:abs`))[0];
      if (!full) throw new Error("That poem didn't load.");
      box.innerHTML = `<p class="eyebrow">${esc(full.author)}</p><h2 class="h2">${esc(full.title)}</h2>
        <div class="pm-text">${full.lines.map((l) => (l.trim() ? `<p>${esc(l)}</p>` : "<br>")).join("")}</div>
        <div class="linkgrid" style="margin-top:18px"><button class="btn btn-sm btn-accent" type="button" id="pm-save">${icon("plus")}Save to library</button><a class="btn btn-sm btn-ghost" href="#books/poems/${encodeURIComponent(full.author)}">More by ${esc(full.author.split(" ").pop())}</a></div>
        <p class="muted" style="font-size:12px;margin-top:14px">Public domain · from PoetryDB</p>`;
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
      $("#pm-save", box).onclick = async () => {
        const id = ("poem-" + full.author + "-" + full.title).replace(/[^\w-]+/g, "_").slice(0, 120);
        const item = getItem(id) || await saveItem({ id, type: "book", title: full.title, author: full.author, lang: "en",
          source: { kind: "text", text: full.lines.join("\n") }, origin: "PoetryDB (public domain)", credit: { creator: full.author, license: "Public domain" },
          description: `A poem by ${full.author}.`, tags: ["poetry"], status: "reading", rating: 0, added: Math.floor(Date.now() / 1000) });
        openItem(item);
      };
    } catch (err) { box.innerHTML = `<p class="status err">${esc(err.message)}</p>`; }
  };
  out.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) open(list[Number(b.dataset.i)]); });
  $("#pm-form", view).onsubmit = (e) => { e.preventDefault(); const q = $("#pm-form input", view).value.trim(); if (q) search(q); };
  $$("[data-poet]", view).forEach((c) => (c.onclick = () => { $("#pm-form input", view).value = c.dataset.poet; search(c.dataset.poet); }));
  $("#pm-rand", view).onclick = async () => { try { const r = await poetry("random/12"); show(r, "random picks"); if (r[0]) open(r[0]); } catch {} };
  if (q0) search(q0); else $("#pm-rand", view).click();
}

// ---------- Open textbooks (Open Textbook Library, University of Minnesota) ----------
async function renderTextbooks(view, q0) {
  setCrumbs([["Books", "books"], ["Open textbooks", ""]]);
  view.innerHTML = head("textbooks", "Books", "Over 2,000 free, openly licensed college textbooks, reviewed by faculty. Read them online or download the PDF or EPUB from the publisher.", "tb-form", "Subject or title, e.g. chemistry", q0) + `
    <div class="chips" style="margin-bottom:18px">${["Biology", "Chemistry", "Physics", "Calculus", "Statistics", "Psychology", "Economics", "History", "Computer science", "Writing", "Art", "Japanese"].map((t) => `<button class="chip" type="button" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <p class="status" id="tb-s"></p><div class="book-cards" id="tb-out"></div><div class="more"><button class="btn" type="button" id="tb-more" hidden>Load more</button></div>`;
  wireTabs(view);
  const f = { q: q0, page: 1 };
  const run = async (more = false) => {
    if (!more) { f.page = 1; $("#tb-out", view).innerHTML = ""; }
    const st = $("#tb-s", view); st.className = "status"; st.textContent = "Searching the Open Textbook Library…";
    try {
      const p = new URLSearchParams({ page: String(f.page), ...(f.q ? { q: f.q } : {}) });
      const d = await openJSON("https://open.umn.edu/opentextbooks/textbooks.json?" + p);
      if (!Array.isArray(d?.data)) throw new Error("The Open Textbook Library didn't answer. Try again in a moment.");
      $("#tb-out", view).insertAdjacentHTML("beforeend", d.data.map((b) => {
        const fm = (b.formats || []).filter((x) => x.url && !x.price?.cents);
        const by = (b.contributors || []).filter((c) => /author/i.test(c.contribution || "author")).map((c) => [c.first_name, c.last_name].filter(Boolean).join(" ")).slice(0, 2).join(", ");
        return `<div class="bcard" style="grid-template-columns:1fr"><div><strong>${esc(b.title)}</strong><span class="au">${esc(by || (b.publishers || [])[0]?.name || "")}${b.copyright_year ? " · " + b.copyright_year : ""}</span>
          <p class="sm">${esc(String(b.description || "").replace(/<[^>]+>/g, "").slice(0, 220))}</p>
          <div class="meta"><span class="pill completed">${esc(b.license || "Open licence")}</span>${(b.subjects || []).slice(0, 2).map((x) => `<span class="pill">${esc(x.name)}</span>`).join("")}</div>
          <div class="linkgrid" style="margin-top:10px">${fm.slice(0, 4).map((x) => `<a class="btn btn-sm${x.type === "Online" ? " btn-accent" : ""}" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.type === "Online" ? "Read online" : x.type)} ↗</a>`).join("")}<a class="btn btn-sm btn-ghost" href="${esc(b.url)}" target="_blank" rel="noopener">Reviews ↗</a></div></div></div>`;
      }).join(""));
      st.textContent = d.data.length || more ? `${(d.links?.total_count || d.data.length).toLocaleString()} open textbooks${f.q ? ` for “${f.q}”` : ""}` : "No textbooks found. Try a broader subject.";
      $("#tb-more", view).hidden = !d.links?.next;
    } catch (e) { st.className = "status err"; st.textContent = e.message; }
  };
  $("#tb-form", view).onsubmit = (e) => { e.preventDefault(); f.q = $("#tb-form input", view).value.trim(); run(); };
  $$("[data-t]", view).forEach((c) => (c.onclick = () => { f.q = c.dataset.t; $("#tb-form input", view).value = f.q; run(); }));
  $("#tb-more", view).onclick = () => { f.page++; run(true); };
  run();
}

// ---------- Kitsune Originals and the free classics starter shelf ----------
async function renderFree(view, target = "") {
  setCrumbs([["Books", "books"], ["Originals & free", ""]]);
  const { ORIGINALS, CLASSICS, SERIES, addOriginal, addClassic, addSeriesItem } = await import("../originals.js");
  const kids = (await import("../profiles.js")).isKids();
  const series = SERIES.filter((x) => !(kids && x.mature));
  const total = CLASSICS.reduce((a, [, l]) => a + l.length, 0);
  // Where you are in each series: finished, part-read, or not started.
  const prog = await allProgress();
  const state = (id) => {
    const it = getItem(id), pct = prog[id]?.pos > 0 ? progressPct(prog[id]) : 0;
    const p = prog[id];
    const done = it?.status === "completed" || pct >= 100 || !!(p && p.total > 2 && p.pos >= p.total - 2);
    return { have: !!it, done, pct: done ? 100 : pct };
  };
  const pillText = (s) => (s.done ? "Finished ✓" : s.pct > 0 ? `${s.pct}% read` : s.have ? "In your library" : "Read");
  const SHOW = 8;
  const seriesHead = (x) => {
    const st = x.items.map((e) => state(e.id));
    const read = st.filter((s) => s.done).length, started = st.some((s) => s.pct > 0);
    const ni = st.findIndex((s) => !s.done), next = ni >= 0 ? x.items[ni] : null;
    const go = !started ? { id: x.items[0].id, label: `Start with ${x.items[0].label}` }
      : next ? { id: next.id, label: `${st[ni].pct > 0 ? "Continue" : "Next"}: ${next.title.replace(/^Incarnate: /, "")}` }
      : { id: x.items[0].id, label: "Read again from the start" };
    return { read, started, go };
  };
  view.innerHTML = head("free", "Books", "Stories and manga made for Kitsune, plus a hand-picked shelf of free classics. All free, all yours to keep.", null, null) + `
    <section class="section orig-hero"><div class="orig-hero-art"><img src="/originals/kitsu-delivers-1/000.svg" alt="Kitsu Delivers cover"></div>
      <div><p class="eyebrow">Kitsune Originals</p><h2 class="h1" style="margin:4px 0 10px">Made for Kitsune</h2>
        <p class="lede" style="margin:0 0 16px">Original short stories and manga written and drawn for this app. They come with Kitsune, work offline, and are free to share under Creative Commons BY 4.0.</p>
        <div class="linkgrid"><button class="btn btn-accent" type="button" data-orig="orig-kitsu-1">${icon("book")}Read Kitsu Delivers</button><button class="btn btn-on-dark" type="button" id="fr-orig-all">${icon("plus")}Add all originals</button><a class="btn btn-on-dark" href="#lore">${icon("list")}Originals wiki</a></div></div></section>
    <section class="section"><div class="orig-grid">${ORIGINALS.map((o) => `<button class="orig-card" type="button" data-orig="${o.id}">
      <img src="${o.cover}" alt="" loading="lazy"><span><span class="eyebrow">${o.type === "manga" ? "Manga" : "Short story"} · ${o.minutes} min</span><strong>${esc(o.title)}</strong><span class="muted">${esc(o.blurb)}</span>
      <span class="pill" data-have="${o.id}">${getItem(o.id) ? "In your library" : "Read free"}</span></span></button>`).join("")}</div></section>
    ${series.map((x) => { const sh = seriesHead(x); return `<section class="section orig-series" data-series="${x.id}" id="series-${x.id}">
      <div class="series-banner" data-tint="${(x.items.find((i) => /^(Episode 1|Book One)/.test(i.label)) || x.items[0]).cover}" style="--cover:url('${(x.items.find((i) => /^(Episode 1|Book One)/.test(i.label)) || x.items[0]).cover}')">
        <img class="series-banner-cover" src="${(x.items.find((i) => /^(Episode 1|Book One)/.test(i.label)) || x.items[0]).cover}" alt="">
        <div class="series-banner-txt"><p class="eyebrow">Original series · ${x.items.length} ${x.items.length === 1 ? "entry" : "entries"}${x.mature ? ` · <span class="pill mature">Mature</span>` : ""}</p><h2 class="h1">${esc(x.title)}</h2>
          <p class="series-banner-blurb">${esc(x.blurb)}</p>${x.note ? `<p class="series-banner-note">${esc(x.note)}</p>` : ""}
          ${sh.started ? `<div class="series-prog" aria-label="Read ${sh.read} of ${x.items.length}"><span class="series-prog-bar"><i style="width:${Math.round((sh.read / x.items.length) * 100)}%"></i></span><span>Read ${sh.read} of ${x.items.length}</span></div>` : ""}
          <div class="linkgrid" style="margin-top:14px"><button class="btn btn-accent" type="button" data-sitem="${sh.go.id}">${icon("book")}${esc(sh.go.label)}</button><button class="btn btn-on-dark" type="button" data-series-all="${x.id}">${icon("plus")}Add all</button><a class="btn btn-on-dark" href="#lore/s/${x.id}">${icon("list")}Wiki</a></div></div>
      </div>
      ${x.items.length > SHOW || sh.started ? `<div class="series-tools"><div class="seg" role="group" aria-label="Show"><button type="button" data-sf="all" aria-pressed="true">All ${x.items.length}</button><button type="button" data-sf="unread" aria-pressed="false">Unread ${x.items.length - sh.read}</button></div></div>` : ""}
      <div class="orig-grid">${x.items.map((e, i) => { const s = state(e.id); return `<button class="orig-card${s.done ? " is-done" : ""}" type="button" data-sitem="${e.id}" data-done="${s.done}" ${i >= SHOW ? "hidden" : ""}><img src="${e.cover}" alt="" loading="lazy"><span><span class="eyebrow">${i + 1} · ${esc(e.label)}${e.kind === "script" ? " · Script" : " · Novel"}</span><strong>${esc(e.title)}</strong><span class="muted">${esc(e.blurb)}</span>
        <span class="pill${s.done ? " pill-done" : ""}" data-have="${e.id}">${pillText(s)}</span>${s.pct > 0 && !s.done ? `<span class="card-prog"><i style="width:${s.pct}%"></i></span>` : ""}</span></button>`; }).join("")}</div>
      ${x.items.length > SHOW ? `<button class="btn btn-ghost series-more" type="button" data-smore="${x.id}">Show all ${x.items.length}</button>` : ""}
      <p class="muted" style="font-size:12px;margin-top:10px">${esc(x.rights)}</p></section>`; }).join("")}
    <section class="section"><div class="section-head"><div><h2 class="h2">Free classics</h2><p class="muted" style="margin:4px 0 0;font-size:13.5px">${total} public-domain books from Project Gutenberg. Add one to read it, or add a whole shelf and keep it offline.</p></div>
      <button class="btn btn-accent" type="button" id="fr-all">${icon("download")}Add all ${total} & keep offline</button></div><p class="status" id="fr-s"></p>
      ${CLASSICS.map(([name, list], gi) => `<div class="section" style="margin-top:18px"><div class="section-head"><h3 class="h3">${esc(name)}</h3><button class="link-btn" type="button" data-shelf="${gi}">${icon("download")}Add shelf & keep offline</button></div>
        <div class="grid se-row">${list.map(([id, t]) => `<button class="card" type="button" data-gb="${id}" data-t="${esc(t)}">${coverHtml(`https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`, t, { own: !!getItem("gb-" + id) })}<span class="card-t">${esc(t)}</span><span class="card-m" data-gbm="${id}">${getItem("gb-" + id)?.source?.cachedText ? "Offline ✓" : "Free · public domain"}</span></button>`).join("")}</div></div>`).join("")}
    </section>`;
  wireTabs(view);
  if (target) requestAnimationFrame(() => view.querySelector("#series-" + CSS.escape(target))?.scrollIntoView({ block: "start", behavior: "smooth" }));
  const st = $("#fr-s", view);
  const mark = (id) => { const m = view.querySelector(`[data-gbm="${id}"]`); if (m) m.textContent = "Offline ✓"; };
  const bulk = async (list) => {
    let done = 0, failed = 0;
    st.className = "status"; st.textContent = `Adding ${list.length} books…`;
    for (const [id, t] of list) {
      try { await addClassic(id, t, { offline: true }); mark(id); } catch { failed++; }
      st.textContent = `Saved ${++done} of ${list.length} for offline reading…`;
    }
    st.textContent = `Done: ${plural(done - failed, "book")} saved offline${failed ? `, ${failed} didn't download (try again later)` : ""}.`;
    toast("Your free classics are in your library.", { action: "View", onAction: () => (location.hash = "library/book") });
  };
  view.addEventListener("click", async (e) => {
    const o = e.target.closest("[data-orig]");
    if (o) { o.disabled = true; try { openItem(await addOriginal(ORIGINALS.find((x) => x.id === o.dataset.orig))); } catch (err) { toast(err.message); } o.disabled = false; return; }
    const si = e.target.closest("[data-sitem]");
    if (si) {
      si.disabled = true;
      const x = series.find((y) => y.items.some((i) => i.id === si.dataset.sitem));
      try { openItem(await addSeriesItem(x, x.items.find((i) => i.id === si.dataset.sitem))); } catch (err) { toast(err.message); }
      si.disabled = false; return;
    }
    const sa = e.target.closest("[data-series-all]");
    if (sa) {
      sa.disabled = true;
      const x = series.find((y) => y.id === sa.dataset.seriesAll);
      for (const it of x.items) { try { await addSeriesItem(x, it); const p = view.querySelector(`[data-have="${it.id}"]`); if (p && p.textContent === "Read") p.textContent = "In your library"; } catch {} }
      toast(`${x.title} is in your library.`, { action: "View", onAction: () => (location.hash = "library/book") }); return;
    }
    const sf = e.target.closest("[data-sf]"), sm = e.target.closest("[data-smore]");
    if (sf || sm) {
      const sec = e.target.closest(".orig-series");
      if (sf) { sec.dataset.sf = sf.dataset.sf; $$("[data-sf]", sec).forEach((b) => b.setAttribute("aria-pressed", String(b === sf))); }
      if (sm) sec.dataset.expanded = "1";
      const f = sec.dataset.sf || "all", all = sec.dataset.expanded === "1";
      const match = $$(".orig-card", sec).filter((c) => { const ok = f === "all" || c.dataset.done !== "true"; c.hidden = true; return ok; });
      match.forEach((c, i) => (c.hidden = !all && i >= SHOW));
      const more = $(".series-more", sec);
      if (more) { more.hidden = all || match.length <= SHOW; more.textContent = `Show all ${match.length}`; }
      if (!match.length) toast("You've read every entry in this series.");
      return;
    }
    const g = e.target.closest("[data-gb]");
    if (g) { g.disabled = true; try { openItem(await addClassic(Number(g.dataset.gb), g.dataset.t)); } catch (err) { toast(err.message); } g.disabled = false; return; }
    const sh = e.target.closest("[data-shelf]");
    if (sh) { sh.disabled = true; await bulk(CLASSICS[Number(sh.dataset.shelf)][1]); return; }
  });
  $("#fr-all", view).onclick = async (e) => { e.currentTarget.disabled = true; await bulk(CLASSICS.flatMap(([, l]) => l)); };
  $("#fr-orig-all", view).onclick = async () => {
    for (const o of ORIGINALS) { try { await addOriginal(o); const p = view.querySelector(`[data-have="${o.id}"]`); if (p) p.textContent = "In your library"; } catch {} }
    toast("All Kitsune Originals are in your library.", { action: "View", onAction: () => (location.hash = "library") });
  };
}
