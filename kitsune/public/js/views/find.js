// Where to read: one search across every source Kitsune knows, grouped by how you can get it.
import { $, esc, icon, coverHtml, api } from "../util.js";
import { lib, coverSrc } from "../store.js";
import { SERVICES, ACCESS_LABEL, getSubs, serviceLink, googleBooks, europeana, dpla } from "../services.js";
import { setCrumbs } from "../main.js";
import { isKids } from "../profiles.js";

const SECTIONS = [
  ["library", "On your shelf", "Already in Kitsune"],
  ["free", "Free to read now", "Public domain and openly licensed, readable in Kitsune or on the source's site"],
  ["listen", "Free to listen", "Public-domain audiobooks"],
  ["official", "Official places to read", "Publisher and platform links for this series"],
  ["borrow", "Borrow free", "With a library card or a free account"],
  ["subs", "With your subscriptions", "Services you told Kitsune you use"],
  ["buy", "Buy", "Stores"],
];

export async function render(view, _name, params) {
  const q = (params[0] || "").trim();
  setCrumbs([["Where to read", "find"], ...(q ? [[q, ""]] : [])]);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Find any book or series</p><h1 class="h1">Where to read</h1>
      <p class="lede">Kitsune checks free libraries, your library card, your subscriptions and stores at once. Add the services you use in <a class="link-btn" href="#accounts">Accounts &amp; keys</a>.</p></div>
      <form class="search" id="fd-form" role="search">${icon("search")}<input class="field" type="search" value="${esc(q)}" placeholder="Title, author or series" autofocus><button class="btn btn-accent">Find</button></form></div>
    <div id="fd-out">${q ? SECTIONS.map(([id, title, sub]) => `<section class="section find-sec" id="fs-${id}" style="margin-top:28px"><div class="section-head"><div><h2 class="h2">${title}</h2><p class="lede" style="margin-top:2px;font-size:13px">${sub}</p></div><span class="muted find-state" style="font-size:13px">Checking…</span></div><div class="find-body"></div></section>`).join("") : `<p class="muted">Try “Frankenstein”, “Hokusai”, “The Tale of Genji” or a manga series.</p>`}</div>`;
  $("#fd-form", view).onsubmit = (e) => { e.preventDefault(); const v = $("#fd-form input", view).value.trim(); if (v) location.hash = "find/" + encodeURIComponent(v); };
  if (!q) return;

  const subs = await getSubs();
  const kids = isKids();
  const rows = {};
  // Rows you can read inside Kitsune sort first, then the rest in arrival order.
  let seq = 0;
  const add = (sec, html) => { (rows[sec] ||= []).push({ html, p: html.includes("in Kitsune") ? 1 : 0, n: seq++ }); rows[sec].sort((a, b) => b.p - a.p || a.n - b.n); paint(sec); };
  const done = new Set();
  const paint = (sec) => {
    const el = $("#fs-" + sec, view); if (!el) return;
    const list = rows[sec] || [];
    $(".find-body", el).innerHTML = list.length ? `<div class="find-list">${list.map((r) => r.html).join("")}</div>` : "";
    $(".find-state", el).textContent = list.length ? `${list.length} found` : done.has(sec) ? "None found" : "Checking…";
    el.classList.toggle("empty-sec", !list.length && done.has(sec));
  };
  const row = ({ cover, title, sub, source, actions }) => `<div class="find-row">${coverHtml(cover, title)}
    <div class="row-main"><strong>${esc(title)}</strong><span class="sub">${esc([sub, source].filter(Boolean).join(" · "))}</span></div>
    <div class="linkgrid">${actions}</div></div>`;
  const out = (href, label, accent = false) => `<a class="btn btn-sm ${accent ? "btn-accent" : ""}" href="${esc(href)}" ${href.startsWith("#") ? "" : 'target="_blank" rel="noopener"'}>${esc(label)}${href.startsWith("#") ? "" : " ↗"}</a>`;
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const relevant = (t) => { const s = String(t || "").toLowerCase(); return !words.length || words.filter((w) => s.includes(w)).length >= Math.ceil(words.length / 2); };
  const settle = async (secs, fn) => { try { await fn(); } catch {} secs.forEach((s) => { done.add(s); paint(s); }); };
  const tasks = [];

  // Your shelf
  tasks.push(settle(["library"], async () => {
    for (const it of lib.items.filter((i) => relevant([i.title, i.series, i.author, i.link?.title].join(" "))).slice(0, 6))
      add("library", row({ cover: coverSrc(it), title: it.title, sub: it.series || it.author, source: it.origin, actions: out("#item/" + encodeURIComponent(it.id), "Open", true) }));
  }));
  // Free to read
  tasks.push(settle([], async () => {
    const { searchBooks } = await import("../gutendex.js");
    const d = await searchBooks({ search: q });
    for (const b of d.results.filter((b) => relevant(b.title + " " + b.authors.join(" "))).slice(0, 4))
      add("free", row({ cover: b.cover, title: b.title, sub: b.authors[0], source: "Project Gutenberg", actions: out("#gutenberg/" + b.id, "Read in Kitsune", true) }));
  }));
  tasks.push(settle([], async () => {
    const d = await api("standard?q=" + encodeURIComponent(q));
    for (const b of d.results.filter((b) => relevant(b.title + " " + b.authors.join(" "))).slice(0, 3))
      add("free", row({ cover: b.cover, title: b.title, sub: b.authors.join(", "), source: "Standard Ebooks", actions: out(b.url + "#downloads", "Get the EPUB") }));
  }));
  tasks.push(settle([], async () => {
    const { searchWikisource } = await import("../wikisource.js");
    const d = await searchWikisource(q, "en");
    for (const r of d.results.filter((r) => relevant(r.title)).slice(0, 2))
      add("free", row({ cover: null, title: r.title, sub: "Volunteer transcription", source: "Wikisource", actions: out("#books/wikisource/" + encodeURIComponent(r.title), "Read in Kitsune", true) }));
  }));
  tasks.push(settle([], async () => {
    const d = await api("scans?kind=books&q=" + encodeURIComponent(q));
    for (const s of d.results.filter((s) => relevant(s.title + " " + s.creator)).slice(0, 3))
      add("free", row({ cover: s.cover, title: s.title, sub: [s.creator.split(",")[0], s.year].filter(Boolean).join(", "), source: "Internet Archive scan", actions: out("#scan/" + encodeURIComponent(s.id), "Read in Kitsune", true) }));
  }));
  let google = null;
  tasks.push(settle(["buy"], async () => {
    try { google = await googleBooks(q, { max: 10 }); } catch (e) { if (e.quota) add("buy", `<p class="hint" style="margin:0">Google Books' free quota is used up. <a class="link-btn" href="#accounts">Add your own key</a> for free editions, previews and prices.</p>`); throw e; }
    for (const b of google.results.filter((b) => relevant(b.title + " " + b.authors.join(" ")))) {
      if (b.view === "ALL_PAGES") add("free", row({ cover: b.cover, title: b.title, sub: [b.authors[0], b.year].filter(Boolean).join(", "), source: "Google Books", actions: out(b.readLink, "Read free") + (b.epub ? out(b.epub, "EPUB") : "") }));
      else if (b.buy) add("buy", row({ cover: b.cover, title: b.title, sub: [b.authors[0], b.price].filter(Boolean).join(" · "), source: "Google Play Books", actions: out(b.buy, "Buy") + (b.view === "PARTIAL" ? out(b.preview, "Preview") : "") }));
    }
  }));
  tasks.push(settle([], async () => {
    const r = await europeana(q, { type: "TEXT" });
    for (const x of r.results.filter((x) => relevant(x.title + " " + x.creator)).slice(0, 3))
      add("free", row({ cover: x.cover, title: x.title, sub: [x.creator, x.year].filter(Boolean).join(", "), source: `Europeana · ${x.provider}`, actions: out(x.link, "Open") }));
  }));
  tasks.push(settle([], async () => {
    const r = await dpla(q); if (!r) return;
    for (const x of r.filter((x) => relevant(x.title)).slice(0, 3))
      add("free", row({ cover: x.cover, title: x.title, sub: x.creator, source: `DPLA · ${x.provider}`, actions: out(x.link, "Open") }));
  }));
  // Listen
  tasks.push(settle(["listen"], async () => {
    const d = await api("audio?q=" + encodeURIComponent(q));
    for (const b of d.results.filter((b) => relevant(b.title + " " + b.authors.join(" "))).slice(0, 4))
      add("listen", row({ cover: b.cover, title: b.title, sub: [b.authors[0], b.totalTime].filter(Boolean).join(" · "), source: "LibriVox", actions: out("#audiobook/" + b.id, "Listen in Kitsune", true) }));
  }));
  // Manga: official places from AniList
  tasks.push(settle(["official"], async () => {
    if (kids) return;
    const d = await api("manga?q=" + encodeURIComponent(q));
    const m = d.results.find((x) => relevant([x.title, x.altTitle, x.native].join(" ")));
    if (!m) return;
    const links = m.links.filter((l) => !/twitter|^x$|instagram|facebook|youtube|tiktok|bluesky|threads/i.test(l.site));
    add("official", row({ cover: m.cover, title: m.title, sub: [m.year, m.volumes ? m.volumes + " volumes" : ""].filter(Boolean).join(" · "), source: "AniList",
      actions: links.slice(0, 6).map((l) => out(l.url, l.site)).join("") + out("#manga/" + m.id, "Series page") }));
  }));
  // Borrow
  tasks.push(settle(["borrow"], async () => {
    const p = new URLSearchParams({ q, ebook_access: "borrowable", limit: "4", fields: "key,title,author_name,cover_i,first_publish_year" });
    const r = await (await fetch("https://openlibrary.org/search.json?" + p, { signal: AbortSignal.timeout(15_000) })).json();
    for (const x of (r.docs || []).filter((x) => relevant(x.title + " " + (x.author_name || []).join(" "))).slice(0, 3))
      add("borrow", row({ cover: x.cover_i ? `https://covers.openlibrary.org/b/id/${x.cover_i}-M.jpg` : null, title: x.title, sub: [(x.author_name || [])[0], x.first_publish_year].filter(Boolean).join(", "), source: "Open Library (free account)", actions: out("https://openlibrary.org" + x.key, "Borrow") }));
  }));
  // Library card services the reader has
  for (const s of SERVICES.filter((s) => s.access === "library" && subs.services.includes(s.id))) {
    const link = serviceLink(s, q, subs);
    if (link) add("borrow", row({ cover: null, title: `Search ${s.name}`, sub: `for “${q}”`, source: ACCESS_LABEL[s.access], actions: out(link, "Search") }));
  }
  // Subscriptions & free apps the reader uses
  const mine = SERVICES.filter((s) => s.access !== "library" && s.access !== "store" && subs.services.includes(s.id));
  for (const s of mine) add("subs", row({ cover: null, title: `Search ${s.name}`, sub: `for “${q}”`, source: ACCESS_LABEL[s.access], actions: out(serviceLink(s, q, subs), "Search") }));
  done.add("subs"); paint("subs");
  if (!mine.length) { $("#fs-subs .find-body", view).innerHTML = `<p class="hint" style="margin:0">Tell Kitsune which services you use in <a class="link-btn" href="#accounts">Accounts &amp; keys</a> and they'll show up here.</p>`; $("#fs-subs .find-state", view).textContent = ""; }
  // Stores (your stores first)
  const stores = SERVICES.filter((s) => s.access === "store").sort((a, b) => subs.services.includes(b.id) - subs.services.includes(a.id));
  add("buy", `<div class="linkgrid" style="padding:8px 0">${stores.map((s) => out(serviceLink(s, q, subs), `${s.name}${subs.services.includes(s.id) ? " ★" : ""}`)).join("")}</div>`);

  await Promise.allSettled(tasks);
  // Mark the empty sections
  SECTIONS.forEach(([id]) => { done.add(id); paint(id); });
}
