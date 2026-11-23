import { $, $$, esc, icon, coverHtml, api, plural, toast, ls } from "../util.js";
import { lib, coverSrc, allProgress, progressPct, kvGet } from "../store.js";
import { itemCard, wireItems, linkToAniList, getCopies, editCopy, copiesHtml, emptyState, skeletonGrid } from "./common.js";
import { setCrumbs } from "../main.js";

const STATUS = { RELEASING: "Ongoing", FINISHED: "Finished", HIATUS: "On hiatus", CANCELLED: "Cancelled", NOT_YET_RELEASED: "Upcoming" };
const ORIGIN = { JP: "Manga", KR: "Manhwa", CN: "Manhua", TW: "Manhua" };
const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller", "Mecha", "Music"];

export async function render(view, name, params) {
  if (name === "manga") return renderManga(view, params[0]);
  const tab = params[0] || "browse";
  if (tab === "classic") return renderClassic(view, params[1] || "");
  if (tab === "free") return renderFree(view);
  if (tab === "shelves") return renderShelves(view);
  return renderBrowse(view, tab === "search" ? params[1] || "" : "");
}

const tabsHtml = (cur) => `<div class="tabs" role="tablist">${[["browse", "Browse"], ["shelves", "Curated shelves"], ["classic", "Classic manga · public domain"], ["free", "Read free & official"]].map(([k, l]) => `<button role="tab" type="button" data-dtab="${k}" aria-selected="${cur === k}">${l}</button>`).join("")}</div>`;
const wireTabs = (view) => $$("[data-dtab]", view).forEach((b) => (b.onclick = () => (location.hash = "discover/" + b.dataset.dtab)));
const ownedIds = () => new Set(lib.items.map((i) => i.link?.anilistId).filter(Boolean));

function mangaCard(m, owned) {
  return `<a class="card" href="#manga/${m.id}">${coverHtml(m.cover, m.title, { color: m.color, badge: ORIGIN[m.country] || m.format || "", own: owned.has(m.id) })}
    <span class="card-t">${esc(m.title)}</span><span class="card-m">${esc([m.year, STATUS[m.status], m.score ? m.score + "%" : ""].filter(Boolean).join(" · "))}</span></a>`;
}

async function renderBrowse(view, q0) {
  setCrumbs([["Discover", "discover"]]);
  const f = { q: q0, sort: q0 ? "match" : ls.get("dSort", "trending"), genre: "", country: "", status: "", page: 1 };
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Series info from AniList</p><h1 class="h1">Discover</h1>
      <p class="lede">Find your next series, then read the copies you own or follow the official links to buy them.</p></div>
      <form class="search" id="d-form" role="search">${icon("search")}<input class="field" id="d-q" type="search" placeholder="Search manga, manhwa, manhua" value="${esc(q0)}" aria-label="Search manga"><button class="btn btn-accent">Search</button></form></div>
    ${tabsHtml("browse")}
    <div class="toolbar">
      <div class="seg" role="group" aria-label="Sort">${[["trending", "Trending"], ["popular", "Popular"], ["score", "Top rated"], ["new", "Newest"]].map(([k, l]) => `<button type="button" data-sort="${k}" aria-pressed="${f.sort === k}">${l}</button>`).join("")}</div>
      <select class="field" id="d-country" style="width:auto" aria-label="Origin"><option value="">All origins</option><option value="JP">Manga (Japan)</option><option value="KR">Manhwa (Korea)</option><option value="CN">Manhua (China)</option></select>
      <select class="field" id="d-status" style="width:auto" aria-label="Status"><option value="">Any status</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
    </div>
    <div class="chips chips-scroll" id="d-genres" style="margin-bottom:22px"><button class="chip" type="button" data-g="" aria-pressed="true">All genres</button>${GENRES.map((g) => `<button class="chip" type="button" data-g="${esc(g)}">${esc(g)}</button>`).join("")}</div>
    <p class="status" id="d-status-line" role="status"></p>
    <div id="d-out">${skeletonGrid(18)}</div>
    <div class="more"><button class="btn" type="button" id="d-more" hidden>Load more</button></div>`;
  const out = $("#d-out", view), status = $("#d-status-line", view);
  let seq = 0;
  const run = async (more = false) => {
    const my = ++seq;
    if (!more) { f.page = 1; out.innerHTML = skeletonGrid(18); }
    status.className = "status";
    status.textContent = f.q ? `Searching for “${f.q}”…` : "Loading…";
    $("#d-more", view).hidden = true;
    try {
      const p = new URLSearchParams({ page: f.page, sort: f.sort });
      for (const k of ["q", "genre", "country", "status"]) if (f[k]) p.set(k, f[k]);
      const d = await api("manga?" + p);
      if (my !== seq) return;
      const owned = ownedIds();
      const html = d.results.map((m) => mangaCard(m, owned)).join("");
      if (more) $(".grid", out).insertAdjacentHTML("beforeend", html); else out.innerHTML = `<div class="grid">${html}</div>`;
      status.textContent = d.results.length || more ? (f.q ? `Results for “${f.q}”` : "") : `Nothing found${f.q ? ` for “${f.q}”` : ""}. Try another spelling or fewer filters.`;
      $("#d-more", view).hidden = !d.hasNext;
    } catch (e) { if (my === seq) { status.className = "status err"; status.textContent = e.message; out.innerHTML = ""; } }
  };
  $("#d-form", view).addEventListener("submit", (e) => { e.preventDefault(); f.q = $("#d-q", view).value.trim(); f.sort = f.q ? "match" : "trending"; $$("[data-sort]", view).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sort === f.sort))); run(); });
  $$("[data-sort]", view).forEach((b) => (b.onclick = () => { f.sort = b.dataset.sort; ls.set("dSort", f.sort); $$("[data-sort]", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); run(); }));
  $("#d-country", view).onchange = (e) => { f.country = e.target.value; run(); };
  $("#d-status", view).onchange = (e) => { f.status = e.target.value; run(); };
  $("#d-genres", view).onclick = (e) => { const c = e.target.closest("[data-g]"); if (!c) return; f.genre = c.dataset.g; $$("#d-genres .chip", view).forEach((x) => x.setAttribute("aria-pressed", String(x === c))); run(); };
  $("#d-more", view).onclick = () => { f.page++; run(true); };
  wireTabs(view);
  run();
}

async function renderClassic(view, q0) {
  setCrumbs([["Discover", "discover"], ["Classic manga", ""]]);
  const f = { q: q0, page: 1, sort: "downloads" };
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Public domain · published before ${(await api("health").catch(() => ({ pdCutoff: 1931 }))).pdCutoff}</p><h1 class="h1">Classic manga</h1>
      <p class="lede">The word “manga” comes from Hokusai's sketchbooks of 1814. Read them, and other Edo- and Meiji-era picture books, page by page from library scans on Internet Archive.</p></div>
      <form class="search" id="c-form" role="search">${icon("search")}<input class="field" id="c-q" type="search" placeholder="Hokusai, Hiroshige, ehon, kibyōshi…" value="${esc(q0)}"><button class="btn btn-accent">Search</button></form></div>
    ${tabsHtml("classic")}
    <div class="toolbar"><div class="chips">${["Hokusai manga", "Hiroshige", "Kuniyoshi", "Ehon", "Kyōsai", "Utamaro", "Fairy tales"].map((t) => `<button class="chip" type="button" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <span class="spacer"></span><button class="btn" type="button" id="c-surprise">${icon("star")}Surprise me</button><div class="seg"><button type="button" data-s="downloads" aria-pressed="true">Most viewed</button><button type="button" data-s="date">Oldest first</button></div></div>
    <p class="status" id="c-status"></p><div id="c-out">${skeletonGrid(18)}</div>
    <div class="more"><button class="btn" type="button" id="c-more" hidden>Load more</button></div>`;
  const out = $("#c-out", view), status = $("#c-status", view);
  const run = async (more = false) => {
    if (!more) { f.page = 1; out.innerHTML = skeletonGrid(18); }
    status.className = "status"; status.textContent = "Searching library scans…";
    try {
      const d = await api(`scans?kind=manga&page=${f.page}&sort=${f.sort}${f.q ? "&q=" + encodeURIComponent(f.q) : ""}`);
      const html = d.results.map((s) => `<a class="card" href="#scan/${encodeURIComponent(s.id)}">${coverHtml(s.cover, s.title, { badge: s.year ? String(s.year) : "" })}<span class="card-t">${esc(s.title)}</span><span class="card-m">${esc([s.creator.split(",")[0], s.pages + "p"].filter(Boolean).join(" · "))}</span></a>`).join("");
      if (more) $(".grid", out).insertAdjacentHTML("beforeend", html); else out.innerHTML = `<div class="grid">${html}</div>`;
      status.textContent = d.count ? `${d.count.toLocaleString()} scans` : "No scans found. Try another artist or title.";
      $("#c-more", view).hidden = !d.hasNext;
    } catch (e) { status.className = "status err"; status.textContent = e.message; out.innerHTML = ""; }
  };
  $("#c-form", view).onsubmit = (e) => { e.preventDefault(); f.q = $("#c-q", view).value.trim(); run(); };
  $$("[data-t]", view).forEach((c) => (c.onclick = () => { f.q = c.dataset.t; $("#c-q", view).value = f.q; run(); }));
  $$("[data-s]", view).forEach((b) => (b.onclick = () => { f.sort = b.dataset.s; $$("[data-s]", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); run(); }));
  $("#c-more", view).onclick = () => { f.page++; run(true); };
  $("#c-surprise", view).onclick = async () => {
    try {
      const d = await api(`scans?kind=manga&page=${1 + Math.floor(Math.random() * 8)}${f.q ? "&q=" + encodeURIComponent(f.q) : ""}`);
      const list = d.results.length ? d.results : (await api("scans?kind=manga")).results;
      const pick = list[Math.floor(Math.random() * list.length)];
      if (pick) location.hash = "scan/" + encodeURIComponent(pick.id);
    } catch (e) { toast(e.message); }
  };
  wireTabs(view);
  run();
}

// ---------- free & official places to read ----------
const FREE = [
  ["Free from the publishers", [
    ["MANGA Plus by SHUEISHA", "https://mangaplus.shueisha.co.jp", "Shueisha's own app and site. First and latest chapters of many Jump series free, worldwide."],
    ["Shonen Jump (VIZ)", "https://www.viz.com/shonenjump", "The newest chapters of weekly Jump series free; a small subscription unlocks the back catalogue."],
    ["K MANGA", "https://kmanga.kodansha.com", "Kodansha's app. Free chapters every day, more with points."],
    ["Comikey", "https://comikey.com", "Licensed manga with free first chapters, from several Japanese publishers."],
    ["INKR", "https://comics.inkr.com", "Licensed manga, manhwa and comics with many free chapters."],
  ]],
  ["Webcomics and manhwa", [
    ["WEBTOON", "https://www.webtoons.com", "Free official webcomics, updated weekly, from Korea and around the world."],
    ["Tapas", "https://tapas.io", "Webcomics and novels; lots of free episodes, plus wait-to-unlock."],
    ["Pocket Comics", "https://www.pocketcomics.com", "Comico's international app with free episodes of licensed series."],
  ]],
  ["Borrow free with a library card", [
    ["Libby", "https://libbyapp.com", "Borrow manga ebooks from your public library."],
    ["Hoopla", "https://www.hoopladigital.com", "Instant borrows of manga and comics through participating libraries."],
  ]],
  ["Public-domain comics", [
    ["Kitsune Comics", "#comics", "Webcomics from their creators' own feeds, the whole of xkcd, and Pepper&Carrot in 70+ languages, right here in Kitsune."],
    ["Digital Comic Museum", "https://digitalcomicmuseum.com", "Golden Age comics (1930s–50s) that are in the public domain, free to download."],
    ["Comic Book Plus", "https://comicbookplus.com", "A large library of public-domain comics and magazines."],
  ]],
];
function renderFree(view) {
  setCrumbs([["Discover", "discover"], ["Read free & official", ""]]);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Legal and free</p><h1 class="h1">Read free &amp; official</h1>
      <p class="lede">Places where reading is free and the creators are paid. These open in their own apps and sites. Public-domain downloads (CBZ, PDF) can be added to Kitsune.</p></div></div>
    ${tabsHtml("free")}
    ${FREE.map(([group, sites]) => `<section class="section" style="margin-top:28px"><h2 class="h2" style="margin-bottom:14px">${esc(group)}</h2>
      <div class="sources">${sites.map(([name, url, desc]) => `<a class="source" href="${esc(url)}" ${url.startsWith("#") ? "" : `target="_blank" rel="noopener"`} style="text-decoration:none">
        <span class="ico">${icon("globe")}</span><strong>${esc(name)}${url.startsWith("#") ? "" : " ↗"}</strong><p>${esc(desc)}</p><span class="fmts">${url.startsWith("#") ? "Right here in Kitsune" : esc(new URL(url).hostname.replace(/^www\./, ""))}</span></a>`).join("")}</div></section>`).join("")}
    <section class="section"><div class="panel"><h3 class="h3">Got a public-domain comic file?</h3>
      <p class="muted" style="margin:0 0 12px">Downloads from Digital Comic Museum and Comic Book Plus are usually CBZ, CBR or PDF. Kitsune reads CBZ and PDF directly; convert CBR to CBZ first.</p>
      <button class="btn btn-accent" type="button" id="fr-add">${icon("upload")}Add a file</button></div></section>`;
  wireTabs(view);
  $("#fr-add", view).onclick = async () => (await import("./link.js")).openImport(null, { mode: "files" });
}

// ---------- one series ----------
async function renderManga(view, id) {
  setCrumbs([["Discover", "discover"], ["…", ""]]);
  view.innerHTML = `<div class="detail"><div class="detail-side"><div class="cover skeleton"></div></div><div><div class="skeleton" style="height:40px;width:60%"></div><div class="skeleton" style="height:200px;margin-top:20px"></div></div></div>`;
  let m;
  try { m = await api("manga/" + encodeURIComponent(id)); }
  catch (e) { view.innerHTML = emptyState("Couldn't load this series.", e.message, `<a class="btn" href="#discover">Back to Discover</a>`); return; }
  setCrumbs([["Discover", "discover"], [m.title, ""]]);
  const key = "al-" + m.id;
  const mine = lib.items.filter((i) => i.link?.anilistId === m.id);
  const prog = await allProgress();
  const copies = await getCopies(key);
  const tracking = (await kvGet("tracking", null))?.entries?.find((e) => e.media.id === m.id);
  const staff = m.staff.map((s) => `${s.name}${s.role ? ` (${s.role})` : ""}`).join(", ");
  const official = m.links.filter((l) => !/twitter|^x$|instagram|facebook|youtube|tiktok|bluesky|threads/i.test(l.site));
  const unlinked = lib.items.filter((i) => i.type === "manga" && !i.link);

  view.innerHTML = `<div class="detail">
    <div class="detail-side">${coverHtml(m.cover, m.title, { color: m.color })}
      <div style="display:grid;gap:8px">
        ${mine.length ? `<button class="btn btn-accent btn-lg" type="button" id="m-read">${icon("book")}Read your copy</button>` : `<button class="btn btn-accent btn-lg" type="button" id="m-add">${icon("upload")}Add volumes I own</button>`}
        ${mine.length ? `<button class="btn" type="button" id="m-add">${icon("plus")}Add more volumes</button>` : ""}
        <a class="btn" href="#find/${encodeURIComponent(m.title)}">${icon("search")}Where to read</a>
        <button class="btn" type="button" id="m-copy">${icon("check")}Record a copy I own</button>
        <button class="btn" type="button" id="m-wish">${icon("star")}${(await kvGet("wishlist", [])).some((w) => w.id === m.id) ? "On your wishlist ✓" : "Add to wishlist"}</button>
        <a class="btn btn-ghost" href="${esc(m.source)}" target="_blank" rel="noopener">View on AniList ↗</a>
      </div></div>
    <div style="min-width:0">
      <p class="eyebrow">${esc([ORIGIN[m.country] || m.format, STATUS[m.status]].filter(Boolean).join(" · "))}</p>
      <h1>${esc(m.title)}</h1>
      ${m.altTitle || m.native ? `<p class="alt">${esc([m.altTitle, m.native !== m.altTitle ? m.native : ""].filter(Boolean).join(" · "))}</p>` : ""}
      <div class="tagrow">${m.genres.map((g) => `<span>${esc(g)}</span>`).join("")}</div>
      <dl class="facts">
        ${m.year ? `<div><dt>Started</dt><dd>${m.year}</dd></div>` : ""}
        <div><dt>Volumes</dt><dd>${m.volumes || "—"}</dd></div>
        <div><dt>Chapters</dt><dd>${m.chapters || "—"}</dd></div>
        ${m.score ? `<div><dt>Score</dt><dd>${m.score} / 100</dd></div>` : ""}
        ${m.popularity ? `<div><dt>Following</dt><dd>${m.popularity.toLocaleString()}</dd></div>` : ""}
        ${tracking ? `<div><dt>Your AniList</dt><dd>Ch. ${tracking.progress}${tracking.score ? ` · ★${tracking.score}` : ""}</dd></div>` : ""}
      </dl>
      ${staff ? `<p class="muted" style="font-size:14px">${esc(staff)}</p>` : ""}
      ${m.description ? `<div class="section" style="margin-top:20px"><h3 class="h3" style="margin-bottom:8px">Synopsis</h3><p class="prose">${esc(m.description)}</p></div>` : ""}

      <div class="panel ${mine.length ? "" : "panel-accent"}" style="margin-top:24px">
        <h3 class="h3">${mine.length ? `On your shelf · ${plural(mine.length, "volume")}` : "Own this series?"}</h3>
        ${mine.length ? `<div class="rail" id="m-mine">${mine.map((i) => itemCard(i, prog[i.id])).join("")}</div>`
          : `<p class="muted" style="margin:0 0 12px">Add CBZ, PDF or EPUB files of volumes you own, link images on your own server, or record where you keep them.</p>`}
        ${unlinked.length ? `<details style="margin-top:12px"><summary style="cursor:pointer;font-size:14px;font-weight:500">Link volumes already in your library (${unlinked.length})</summary>
          <div class="list" style="margin-top:10px">${unlinked.slice(0, 20).map((i) => `<button class="row" type="button" data-link="${esc(i.id)}" style="grid-template-columns:44px minmax(0,1fr) auto">${coverHtml(coverSrc(i), i.title)}<div class="row-main"><strong>${esc(i.title)}</strong><span class="sub">${esc(i.series || "")}</span></div><span class="btn btn-sm">Link</span></button>`).join("")}</div></details>` : ""}
      </div>

      <div class="panel" style="margin-top:14px"><div class="section-head" style="margin-bottom:10px"><h3 class="h3" style="margin:0">Copies you own elsewhere</h3></div><div id="m-copies">${copiesHtml(copies)}</div></div>

      ${official.length ? `<div class="section" style="margin-top:28px"><h3 class="h3" style="margin-bottom:10px">Buy or read officially</h3><div class="linkgrid">${official.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${icon("globe")}${esc(l.site)} ↗</a>`).join("")}</div></div>` : ""}
      ${m.recommendations?.length ? `<div class="section" style="margin-top:32px"><h3 class="h3" style="margin-bottom:12px">If you like this</h3><div class="rail">${m.recommendations.map((r) => mangaCard(r, ownedIds())).join("")}</div></div>` : ""}
    </div></div>`;

  const imp = async () => (await import("./link.js")).openImport(null, { link: { anilistId: m.id, title: m.title, cover: m.cover, color: m.color }, series: m.title });
  $("#m-add", view).onclick = imp;
  $("#m-read", view)?.addEventListener("click", async () => {
    const next = mine.find((i) => progressPct(prog[i.id]) < 100) || mine[0];
    (await import("./common.js")).openItem(next);
  });
  $("#m-copy", view).onclick = () => editCopy(key, null, () => renderManga(view, id));
  $("#m-wish", view).onclick = async () => {
    const { kvSet } = await import("../store.js");
    const list = await kvGet("wishlist", []);
    const i = list.findIndex((w) => w.id === m.id);
    if (i >= 0) { list.splice(i, 1); toast("Removed from your wishlist."); }
    else { list.unshift({ id: m.id, title: m.title, cover: m.cover, color: m.color, volumes: m.volumes, status: m.status, links: official, added: Math.floor(Date.now() / 1000) }); toast(`Added ${m.title} to your wishlist.`, { action: "View", onAction: () => (location.hash = "library/wishlist") }); }
    kvSet("wishlist", list);
    renderManga(view, id);
  };
  $("#m-copies", view).onclick = (e) => { const b = e.target.closest("[data-copy]"); if (b) editCopy(key, copies.find((c) => c.id === b.dataset.copy), () => renderManga(view, id)); };
  const mineRail = $("#m-mine", view); if (mineRail) wireItems(mineRail, () => renderManga(view, id));
  $$("[data-link]", view).forEach((b) => (b.onclick = async () => {
    const it = lib.items.find((i) => i.id === b.dataset.link);
    it.link = { anilistId: m.id, title: m.title, cover: m.cover, color: m.color };
    if (!it.series || it.series === it.title) it.series = m.title;
    await (await import("../store.js")).saveItem(it);
    toast(`Linked “${it.title}”.`); renderManga(view, id);
  }));
}

// ---------- curated shelves: themed rows drawn live from the free sources ----------
const SHELVES = [
  { title: "Hokusai and the ukiyo-e masters", blurb: "Woodblock-printed sketchbooks and picture books from Edo-period Japan.", src: "scans", kind: "manga", q: "hokusai" },
  { title: "Japanese illustrated books at The Met", blurb: "Ehon from the Met's open-access collection, every page photographed.", src: "met", q: "ehon" },
  { title: "Picture books from Japan's National Library", blurb: "Classical 絵本 digitized by the National Diet Library.", src: "ndl", q: "絵本" },
  { title: "The golden age of pulp science fiction", blurb: "The first issues of Amazing Stories and their rivals, before 1931.", src: "scans", kind: "pulps", q: "amazing stories" },
  { title: "Early comic strips and cartoons", blurb: "Newspaper strips, caricature and the ancestors of the comic book.", src: "scans", kind: "comics", q: "" },
  { title: "Fairy tale books with color plates", blurb: "Andrew Lang's colored fairy books and other illustrated collections.", src: "scans", kind: "folklore", q: "fairy book" },
  { title: "Ghost stories and gothic tales", blurb: "Ebooks to read by candlelight.", src: "gutenberg", q: "ghost stories" },
  { title: "Classic detective fiction", blurb: "Holmes, Poirot's predecessors and the first locked-room mysteries.", src: "gutenberg", q: "detective" },
  { title: "Children's picture books", blurb: "Nursery rhymes and storybooks with their original illustrations.", src: "scans", kind: "children", q: "" },
  { title: "Old maps and atlases", blurb: "Hand-colored maps of a world still being charted.", src: "scans", kind: "maps", q: "" },
  { title: "Antique cookbooks", blurb: "Recipes from Victorian kitchens and beyond.", src: "scans", kind: "cookery", q: "" },
  { title: "Vintage sheet music", blurb: "Popular songs and their illustrated covers.", src: "scans", kind: "music", q: "" },
];
async function shelfCards(sh) {
  const meta = (a, b) => [a, b].filter(Boolean).join(" · ");
  if (sh.src === "gutenberg") {
    const { searchBooks } = await import("../gutendex.js");
    return (await searchBooks({ q: sh.q, page: 1 })).results.slice(0, 14).map((b) => `<a class="card" href="#gutenberg/${b.id}">${coverHtml(b.cover, b.title)}<span class="card-t">${esc(b.title)}</span><span class="card-m">${esc(b.authors[0] || "")}</span></a>`);
  }
  if (sh.src === "met" || sh.src === "ndl") {
    const d = await api(sh.src === "met" ? `museum?src=met&q=${encodeURIComponent(sh.q)}` : `ndl?q=${encodeURIComponent(sh.q)}`);
    return d.results.slice(0, 14).map((x) => `<a class="card" href="#books/scans/${encodeURIComponent(sh.q)}" data-src="${sh.src}">${coverHtml(x.cover, x.title)}<span class="card-t">${esc(x.title)}</span><span class="card-m">${esc(meta(x.creator, x.year))}</span></a>`);
  }
  const d = await api(`scans?kind=${sh.kind}${sh.q ? "&q=" + encodeURIComponent(sh.q) : ""}`);
  return d.results.slice(0, 14).map((x) => `<a class="card" href="#scan/${encodeURIComponent(x.id)}">${coverHtml(x.cover, x.title, { badge: x.year ? String(x.year) : "" })}<span class="card-t">${esc(x.title)}</span><span class="card-m">${esc(meta(x.creator.split(",")[0], x.pages ? x.pages + "p" : ""))}</span></a>`);
}
function renderShelves(view) {
  setCrumbs([["Discover", "discover"], ["Curated shelves", ""]]);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Hand-picked themes</p><h1 class="h1">Curated shelves</h1>
      <p class="lede">Themed rows drawn live from Kitsune's free sources: scans, museums, Japan's national library and Project Gutenberg. Everything here is public domain.</p></div></div>
    ${tabsHtml("shelves")}
    ${SHELVES.map((sh, i) => `<section class="section" style="margin-top:26px" data-shelf="${i}"><div class="section-head"><div><h2 class="h2">${esc(sh.title)}</h2><p class="muted" style="margin:4px 0 0;font-size:13.5px">${esc(sh.blurb)}</p></div>
      <a class="link-btn" href="#" data-more="${i}">See more ${icon("next")}</a></div><div class="grid se-row">${skeletonGrid(6).replace(/^<div class="grid">|<\/div>$/g, "")}</div></section>`).join("")}`;
  wireTabs(view);
  const load = async (sec) => {
    const sh = SHELVES[Number(sec.dataset.shelf)], row = sec.querySelector(".se-row");
    try { const cards = await shelfCards(sh); row.innerHTML = cards.join("") || `<p class="muted">Nothing here right now.</p>`; }
    catch { row.outerHTML = `<p class="status err">This shelf's source didn't answer. Try again later.</p>`; }
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: "300px" });
  $$("[data-shelf]", view).forEach((s) => io.observe(s));
  view.addEventListener("click", (e) => {
    const c = e.target.closest("a[data-src]"); if (c) ls.set("scanSrc", c.dataset.src);
    const m = e.target.closest("[data-more]"); if (!m) return;
    e.preventDefault();
    const sh = SHELVES[Number(m.dataset.more)];
    if (sh.src === "gutenberg") location.hash = "books/ebooks/" + encodeURIComponent(sh.q);
    else { ls.set("scanSrc", sh.src === "scans" ? "ia" : sh.src); if (sh.kind) ls.set("scanShelf", sh.kind === "manga" ? "books" : sh.kind); location.hash = sh.kind === "manga" ? "discover/classic/" + encodeURIComponent(sh.q) : "books/scans/" + encodeURIComponent(sh.q); }
  });
}
