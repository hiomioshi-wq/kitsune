// Search everywhere: one query across your library and every free source Kitsune knows.
import { $, $$, esc, icon, coverHtml, api, ls } from "../util.js";
import { lib, coverSrc } from "../store.js";
import { setCrumbs } from "../main.js";
import { isKids } from "../profiles.js";

const enc = encodeURIComponent;
const card = (href, cover, title, meta, attrs = "") =>
  `<a class="card" href="${esc(href)}" ${attrs}>${coverHtml(cover, title)}<span class="card-t">${esc(title)}</span><span class="card-m">${esc(meta || "")}</span></a>`;
const row = (href, title, meta) => `<a class="row" href="${esc(href)}" style="grid-template-columns:minmax(0,1fr)"><div class="row-main"><strong>${esc(title)}</strong><span class="sub">${esc(meta || "")}</span></div></a>`;

async function getJSON(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(15_000) }); if (!r.ok) throw 0; return await r.json(); }
  catch { const v = await api("feed?as=json&url=" + enc(url)); return typeof v === "string" ? JSON.parse(v) : v; }
}

// Each source: how to search it, how to show a result, and where "See all" goes.
const SOURCES = [
  { key: "library", name: "Your library", icon: "shelf", grid: true,
    run: async (q) => { const t = q.toLowerCase(); return lib.items.filter((i) => [i.title, i.author, i.series, ...(i.tags || [])].join(" ").toLowerCase().includes(t)).slice(0, 12)
      .map((i) => card("#item/" + enc(i.id), coverSrc(i), i.title, i.author || i.series)); }, all: (q) => "library" },
  { key: "gutenberg", name: "Project Gutenberg ebooks", icon: "book", grid: true,
    run: async (q) => { const { searchBooks } = await import("../gutendex.js"); return (await searchBooks({ q, page: 1 })).results.slice(0, 12).map((b) => card("#gutenberg/" + b.id, b.cover, b.title, b.authors.join(", "))); },
    all: (q) => "books/ebooks/" + enc(q) },
  { key: "standard", name: "Standard Ebooks", icon: "star", grid: true,
    run: async (q) => (await api("standard?q=" + enc(q))).results.slice(0, 12).map((b) => card("#books/standard/" + enc(b.title), b.cover, b.title, b.authors.join(", "))),
    all: (q) => "books/standard/" + enc(q) },
  { key: "wikisource", name: "Wikisource", icon: "globe",
    run: async (q) => { const { searchWikisource } = await import("../wikisource.js"); return (await searchWikisource(q)).results.slice(0, 6).map((r) => row("#books/wikisource/" + enc(r.work), r.work, r.snippet)); },
    all: (q) => "books/wikisource/" + enc(q) },
  { key: "scans", name: "Scanned books · Internet Archive", icon: "pages", grid: true,
    run: async (q) => (await api("scans?kind=books&q=" + enc(q))).results.slice(0, 12).map((s) => card("#scan/" + enc(s.id), s.cover, s.title, [s.creator.split(",")[0], s.year].filter(Boolean).join(" · "))),
    all: (q) => ["books/scans/" + enc(q), { scanSrc: "ia", scanShelf: "books" }] },
  { key: "classic", name: "Classic manga & ukiyo-e scans", icon: "pages", grid: true, adult: true,
    run: async (q) => (await api("scans?kind=manga&q=" + enc(q))).results.slice(0, 12).map((s) => card("#scan/" + enc(s.id), s.cover, s.title, [s.creator.split(",")[0], s.year].filter(Boolean).join(" · "))),
    all: (q) => "discover/classic/" + enc(q) },
  { key: "ndl", name: "National Diet Library (Japan)", icon: "pages", grid: true,
    run: async (q) => (await api("ndl?q=" + enc(q))).results.slice(0, 12).map((x) => card("#books/scans/" + enc(q), x.cover, x.title, [x.creator, x.year].filter(Boolean).join(" · "), `data-src="ndl"`)),
    all: (q) => ["books/scans/" + enc(q), { scanSrc: "ndl" }] },
  { key: "met", name: "The Met · open access", icon: "pages", grid: true,
    run: async (q) => (await api("museum?src=met&q=" + enc(q))).results.slice(0, 12).map((x) => card("#books/scans/" + enc(q), x.cover, x.title, [x.creator, x.year].filter(Boolean).join(" · "), `data-src="met"`)),
    all: (q) => ["books/scans/" + enc(q), { scanSrc: "met" }] },
  { key: "audio", name: "LibriVox audiobooks", icon: "headphones", grid: true,
    run: async (q) => (await api("audio?q=" + enc(q))).results.slice(0, 12).map((a) => card("#audiobook/" + a.id, a.cover, a.title, (a.authors || []).join(", "))),
    all: (q) => "books/audio/" + enc(q) },
  { key: "manga", name: "Manga on AniList", icon: "compass", grid: true, adult: true,
    run: async (q) => (await api("manga?q=" + enc(q))).results.slice(0, 12).map((m) => card("#manga/" + m.id, m.cover, m.title, [m.year, m.format].filter(Boolean).join(" · "))),
    all: (q) => "discover/search/" + enc(q) },
  { key: "wikipedia", name: "Wikipedia", icon: "globe",
    run: async (q) => { const { search } = await import("../mediawiki.js"); return (await search({ api: "https://en.wikipedia.org/w/api.php" }, q)).results.slice(0, 6).map((r) => row("#wiki/en-wikipedia-org/" + enc(r.title.replace(/ /g, "_")), r.title, r.snippet)); },
    all: (q) => "wiki" },
  { key: "poems", name: "Poems", icon: "type",
    run: async (q) => { const e = enc(q); const [a, t] = await Promise.all([getJSON(`https://poetrydb.org/author/${e}/title,author`).catch(() => []), getJSON(`https://poetrydb.org/title/${e}/title,author`).catch(() => [])]);
      return [...(Array.isArray(a) ? a : []), ...(Array.isArray(t) ? t : [])].slice(0, 6).map((p) => row("#books/poems/" + enc(p.author), p.title, p.author)); },
    all: (q) => "books/poems/" + enc(q) },
  { key: "textbooks", name: "Open textbooks", icon: "list",
    run: async (q) => (await getJSON("https://open.umn.edu/opentextbooks/textbooks.json?q=" + enc(q))).data.slice(0, 6).map((b) => row("#books/textbooks/" + enc(q), b.title, b.license || "")),
    all: (q) => "books/textbooks/" + enc(q) },
];

export async function render(view, _name, params) {
  const q0 = (() => { try { return decodeURIComponent(params.join("/") || ""); } catch { return params.join("/") || ""; } })();
  setCrumbs([["Search everywhere", ""]]);
  const kids = isKids();
  const sources = SOURCES.filter((s) => !(kids && s.adult));
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Every source at once</p><h1 class="h1">Search everywhere</h1>
      <p class="lede">One search across your library, ebooks, scans, museums, audiobooks, manga, Wikipedia, poems and textbooks.</p></div>
      <form class="search" id="se-form" role="search">${icon("search")}<input class="field" type="search" placeholder="Title, author, subject…" value="${esc(q0)}" aria-label="Search everywhere" autofocus><button class="btn btn-accent">Search</button></form></div>
    <div class="chips" id="se-jump" style="margin-bottom:12px"></div>
    <div id="se-out">${q0 ? "" : `<div class="empty"><p class="muted">Try “Hokusai”, “Dracula”, “fairy tales” or “chemistry”.</p></div>`}</div>`;
  $("#se-form", view).onsubmit = (e) => { e.preventDefault(); const q = $("#se-form input", view).value.trim(); if (q) location.hash = "search/" + enc(q); };
  if (!q0) return;

  const out = $("#se-out", view), jump = $("#se-jump", view);
  out.innerHTML = sources.map((s) => `<section class="section se-sec" id="se-${s.key}" data-k="${s.key}"><div class="section-head"><h2 class="h3">${icon(s.icon)} ${esc(s.name)}</h2>
    <span class="muted se-n" style="font-size:13px">Searching…</span><button class="link-btn" type="button" data-all="${s.key}" hidden>See all ${icon("next")}</button></div><div class="se-body"></div></section>`).join("");
  const counts = {};
  const drawJump = () => (jump.innerHTML = sources.filter((s) => counts[s.key]).map((s) => `<a class="chip" href="#" data-go="${s.key}">${esc(s.name.split(" · ")[0])} <span class="n">${counts[s.key]}</span></a>`).join(""));
  jump.onclick = (e) => { const c = e.target.closest("[data-go]"); if (c) { e.preventDefault(); $("#se-" + c.dataset.go, view)?.scrollIntoView({ behavior: "smooth", block: "start" }); } };
  out.addEventListener("click", (e) => {
    const a = e.target.closest("[data-all]");
    if (a) { const s = sources.find((x) => x.key === a.dataset.all); const dest = s.all(q0); const [hash, set] = Array.isArray(dest) ? dest : [dest, {}]; Object.entries(set).forEach(([k, v]) => ls.set(k, v)); location.hash = hash; return; }
    const c = e.target.closest("a[data-src]"); if (c) ls.set("scanSrc", c.dataset.src);
  });
  await Promise.allSettled(sources.map(async (s) => {
    const sec = $("#se-" + s.key, view);
    try {
      const items = await s.run(q0);
      if (!sec.isConnected) return;
      counts[s.key] = items.length;
      $(".se-n", sec).textContent = items.length ? "" : "Nothing found";
      $(".se-body", sec).innerHTML = items.length ? `<div class="${s.grid ? "grid se-row" : "list"}">${items.join("")}</div>` : "";
      $("[data-all]", sec).hidden = !items.length;
      if (!items.length) sec.classList.add("se-empty");
    } catch { $(".se-n", sec).textContent = "Didn't answer"; sec.classList.add("se-empty"); }
    drawJump();
  }));
  // Sources with results first.
  [...out.children].sort((a, b) => a.classList.contains("se-empty") - b.classList.contains("se-empty")).forEach((n) => out.append(n));
}
