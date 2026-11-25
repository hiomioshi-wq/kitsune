// Wikis: Wikipedia, Wikibooks, Fandom, Miraheze (like Mental Block) and any other MediaWiki wiki.
import { $, $$, esc, icon, toast, confirmBox, plural, menu } from "../util.js";
import { kvGet, kvSet, saveItem, getItem } from "../store.js";
import { openItem, emptyState } from "./common.js";
import { setCrumbs } from "../main.js";
import { discover, search, random, page, category, featuredFeed, PRESET_WIKIS, WIKI_GROUPS } from "../mediawiki.js";
import { isKids } from "../profiles.js";

const WIKIPEDIA = { id: "en-wikipedia-org", name: "Wikipedia", api: "https://en.wikipedia.org/w/api.php", base: "https://en.wikipedia.org/wiki/", main: "Main Page", logo: null, lang: "en",
  license: "Creative Commons Attribution-Share Alike 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" };
async function getWikis() {
  const l = await kvGet("wikis", null);
  if (!l?.length) return [WIKIPEDIA];
  // Older versions gave wikis on /w/api.php an id ending in "-w"; tidy those up once.
  if (l.some((w) => /-w$/.test(w.id))) {
    const seen = new Set(), fixed = [];
    for (const w of l) { const id = w.id.replace(/-w$/, ""); if (!seen.has(id)) { seen.add(id); fixed.push({ ...w, id }); } }
    await kvSet("wikis", fixed); return fixed;
  }
  return l;
}
const setWikis = (l) => kvSet("wikis", l);
const kindOf = (w) => (/fandom\.com/.test(w.api) ? "Fandom" : /miraheze\.org/.test(w.api) ? "Miraheze" : /wiki(pedia|books|voyage|quote|news|versity|source|media)\.org|wiktionary/.test(w.api) ? "Wikimedia" : "MediaWiki");
const enc = (s) => encodeURIComponent(s).replace(/%20/g, "_");
const dec = (s) => { try { return decodeURIComponent(s || "").replace(/_/g, " "); } catch { return String(s || "").replace(/_/g, " "); } };
const wpLink = (t) => `#wiki/${WIKIPEDIA.id}/${enc(t)}`;

// Add a wiki by address (or reuse it if it's already in the list) and return it.
export async function ensureWiki(input) {
  const w = await discover(input);
  const list = await getWikis();
  const have = list.find((x) => x.id === w.id);
  if (have) return have;
  if (isKids()) throw new Error("Ask a grown-up to add new wikis.");
  await setWikis([...list, w]);
  return w;
}

// Articles you've opened recently, newest first.
async function remember(w, title) {
  const h = (await kvGet("wikiHistory", [])).filter((x) => !(x.wid === w.id && x.title === title));
  kvSet("wikiHistory", [{ wid: w.id, wiki: w.name, title, at: Date.now() }, ...h].slice(0, 40));
}

export async function render(view, _name, params) {
  const wikis = await getWikis();
  if (params[0]) {
    let w = wikis.find((x) => x.id === params[0] || x.id === params[0].replace(/-w$/, ""));
    // A shared link to a wiki you haven't added yet: find it by its address and add it.
    if (!w && !isKids()) {
      const preset = PRESET_WIKIS.find((p) => p.input.replace(/\./g, "-") === params[0]);
      view.innerHTML = `<div class="empty"><p class="muted">Finding that wiki…</p></div>`;
      w = await ensureWiki(preset?.input || params[0].replace(/-/g, ".")).catch(() => null);
    }
    if (!w) { view.innerHTML = emptyState("That wiki isn't in your list.", "Add it again from Wikis.", `<a class="btn" href="#wiki">Wikis</a>`); return; }
    if (!params[1]) return wikiHome(view, w);
    const title = dec(params.slice(1).join("/"));
    return /^Category:/i.test(title) ? categoryView(view, w, title) : article(view, w, title);
  }
  return hub(view, wikis);
}

async function hub(view, wikis) {
  setCrumbs([["Wikis", "wiki"]]);
  const kids = isKids();
  const history = (await kvGet("wikiHistory", [])).filter((x) => wikis.some((w) => w.id === x.wid)).slice(0, 8);
  const groups = Object.values(WIKI_GROUPS);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Read the wikis</p><h1 class="h1">Wikis</h1>
      <p class="lede">Wikipedia, Fandom, Miraheze and any other wiki built on MediaWiki, in a clean reader. Follow links without leaving Kitsune, switch languages, and save articles to your library.</p></div>
      <form class="search" id="wk-all" role="search">${icon("search")}<input class="field" type="search" placeholder="Search all your wikis at once"><button class="btn btn-accent">Search</button></form></div>
    <div id="wk-allres"></div>
    ${history.length ? `<section class="section" style="margin-top:8px"><div class="section-head"><h2 class="h2">Recently read</h2><button class="link-btn" type="button" id="wk-clearh">Clear</button></div>
      <div class="chips">${history.map((h) => `<a class="chip" href="#wiki/${esc(h.wid)}/${esc(enc(h.title))}">${esc(h.title)} <span class="n">${esc(h.wiki)}</span></a>`).join("")}</div></section>` : ""}
    <section class="section" id="wk-today" hidden><div class="section-head"><h2 class="h2">On Wikipedia today</h2></div><div class="wk-today" id="wk-today-in"></div></section>
    <section class="section" style="margin-top:8px"><div class="section-head"><h2 class="h2">Your wikis</h2><span class="muted" style="font-size:13px">${plural(wikis.length, "wiki")}</span></div>
      <div class="sources">${wikis.map((w) => `<div class="source" style="cursor:default">
        <span class="ico">${w.logo ? `<img src="${esc(w.logo)}" alt="" style="width:26px;height:26px;object-fit:contain" onerror="this.replaceWith(document.createTextNode('W'))">` : icon("globe")}</span>
        <strong>${esc(w.name)}</strong><p>${esc(new URL(w.base).hostname)} · ${kindOf(w)}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto"><a class="btn btn-sm btn-accent" href="#wiki/${esc(w.id)}">Open</a>${w.id !== WIKIPEDIA.id && !kids ? `<button class="icon-btn" type="button" data-rm="${esc(w.id)}" aria-label="Remove ${esc(w.name)}">${icon("trash")}</button>` : ""}</div></div>`).join("")}</div></section>
    ${kids ? "" : `<section class="section"><div class="panel"><h3 class="h3">Add any wiki</h3>
      <p class="muted" style="margin:0 0 12px;font-size:13px">Type its address or paste any link to it: <code>onepiece.fandom.com</code>, <code>mentalblock.miraheze.org</code>, <code>de.wikipedia.org</code>, or a language code like <code>ja</code> for that Wikipedia.</p>
      <form style="display:flex;gap:8px;flex-wrap:wrap" id="wk-add"><input class="field" id="wk-addr" placeholder="something.fandom.com" style="flex:1 1 280px"><button class="btn btn-accent">${icon("plus")}Add wiki</button></form><p class="status" id="wk-s"></p></div></section>
    <section class="section"><div class="section-head"><h2 class="h2">Wiki directory</h2><span class="muted" style="font-size:13px">${PRESET_WIKIS.length} to pick from</span></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
        <div class="chips" id="wk-groups"><button class="chip" type="button" data-g="" aria-pressed="true">All</button>${groups.map((g) => `<button class="chip" type="button" data-g="${esc(g)}" aria-pressed="false">${esc(g)}</button>`).join("")}</div>
        <input class="field" id="wk-filter" type="search" placeholder="Filter, e.g. naruto" style="flex:0 1 220px;margin-left:auto"></div>
      <div class="sources" id="wk-dir"></div></section>`}
    <section class="section"><div class="panel"><h3 class="h3">About wiki content</h3><p class="muted" style="margin:0;font-size:13px">Wiki articles are written by volunteers and shared under each wiki's licence (usually Creative Commons BY-SA). Kitsune shows that licence and a link to the original on every article.</p></div></section>`;

  // Directory, filtered by group and text.
  const dir = { g: "", q: "" };
  const drawDir = () => {
    const el = $("#wk-dir", view); if (!el) return;
    const have = new Set(wikis.map((w) => new URL(w.api).hostname));
    const q = dir.q.toLowerCase();
    const list = PRESET_WIKIS.filter((p) => (!dir.g || p.group === dir.g) && (!q || (p.input + " " + p.note + " " + (p.series || []).join(" ")).toLowerCase().includes(q)));
    el.innerHTML = list.map((p) => have.has(p.input)
      ? `<a class="source" href="#wiki/${esc(p.input.replace(/\./g, "-"))}"><span class="ico">${icon("globe")}</span><strong>${esc(p.note)}</strong><p>${esc(p.input)}</p><span class="fmts">In your list · Open</span></a>`
      : `<button class="source" type="button" data-preset="${esc(p.input)}"><span class="ico">${icon("globe")}</span><strong>${esc(p.note)}</strong><p>${esc(p.input)} · ${esc(p.group)}</p><span class="fmts">Add</span></button>`).join("")
      || `<p class="muted">Nothing in the directory matches. You can still add any wiki by its address above.</p>`;
  };
  drawDir();
  $("#wk-filter", view)?.addEventListener("input", (e) => { dir.q = e.target.value.trim(); drawDir(); });
  $("#wk-groups", view)?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-g]"); if (!b) return;
    dir.g = b.dataset.g; $$("#wk-groups [data-g]", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); drawDir();
  });
  $("#wk-clearh", view)?.addEventListener("click", () => { kvSet("wikiHistory", []); render(view, "wiki", []); });

  const add = async (input) => {
    const st = $("#wk-s", view); if (st) { st.className = "status"; st.textContent = "Looking for the wiki…"; }
    try { const w = await ensureWiki(input); toast(`Added ${w.name}.`); location.hash = "wiki/" + w.id; }
    catch (e) { if (st) { st.className = "status err"; st.textContent = e.message; } else toast(e.message); }
  };
  $("#wk-add", view)?.addEventListener("submit", (e) => { e.preventDefault(); add($("#wk-addr", view).value); });
  view.addEventListener("click", async (e) => {
    const p = e.target.closest("[data-preset]"); if (p) { p.disabled = true; p.querySelector(".fmts").textContent = "Adding…"; return add(p.dataset.preset); }
    const r = e.target.closest("[data-rm]");
    if (r) { const w = wikis.find((x) => x.id === r.dataset.rm); if (await confirmBox(`Remove ${w.name}?`, "Saved articles stay in your library.", "Remove")) { await setWikis(wikis.filter((x) => x !== w)); render(view, "wiki", []); } }
  });

  // Search every wiki in your list at once.
  $("#wk-all", view).onsubmit = async (e) => {
    e.preventDefault();
    const text = $("#wk-all input", view).value.trim(); if (!text) return;
    const out = $("#wk-allres", view);
    out.innerHTML = wikis.map((w) => `<section class="section" style="margin-top:20px" data-w="${esc(w.id)}"><div class="section-head"><h3 class="h3">${esc(w.name)}</h3><span class="muted" style="font-size:13px">Searching…</span></div><div class="list"></div></section>`).join("");
    await Promise.allSettled(wikis.map(async (w) => {
      const sec = out.querySelector(`[data-w="${CSS.escape(w.id)}"]`);
      try {
        const d = await search(w, text);
        sec.querySelector(".muted").textContent = d.results.length ? `${d.total != null ? d.total.toLocaleString() : d.results.length} results` : "Nothing found";
        sec.querySelector(".list").innerHTML = d.results.slice(0, 4).map((r) => resultRow(w, r)).join("");
      } catch (err) { sec.querySelector(".muted").textContent = err.message; }
    }));
  };

  // Wikipedia's daily feed: in the news, on this day, most read.
  try {
    const f = await featuredFeed("en");
    const el = $("#wk-today-in", view); if (!el) return;
    const thumb = (t) => t?.thumbnail?.source ? `<img src="${esc(t.thumbnail.source)}" alt="" loading="lazy" onerror="this.remove()">` : "";
    const strip = (h) => String(h || "").replace(/<[^>]+>/g, "");
    const cols = [];
    if (f.news?.length) cols.push(`<div class="panel"><h3 class="h3">In the news</h3><ul class="wk-feed">${f.news.slice(0, 4).map((n) => { const l = n.links?.[0]; return `<li>${l ? `<a href="${wpLink(l.titles.canonical)}">${esc(strip(n.story))}</a>` : esc(strip(n.story))}</li>`; }).join("")}</ul></div>`);
    if (f.onthisday?.length) cols.push(`<div class="panel"><h3 class="h3">On this day</h3><ul class="wk-feed">${f.onthisday.slice(0, 5).map((o) => { const l = o.pages?.[0]; return `<li><span class="yr">${esc(o.year)}</span> ${l ? `<a href="${wpLink(l.titles.canonical)}">${esc(o.text)}</a>` : esc(o.text)}</li>`; }).join("")}</ul></div>`);
    if (f.mostread?.articles?.length) cols.push(`<div class="panel"><h3 class="h3">Most read yesterday</h3><ol class="wk-feed wk-top">${f.mostread.articles.filter((a) => !/^(Main_Page|Special:)/.test(a.titles.canonical)).slice(0, 6).map((a) => `<li><a href="${wpLink(a.titles.canonical)}">${thumb(a)}<span><strong>${esc(a.titles.normalized)}</strong><span class="muted">${esc(a.description || "")}</span></span></a></li>`).join("")}</ol></div>`);
    if (cols.length) { el.innerHTML = cols.join(""); $("#wk-today", view).hidden = false; }
  } catch {}
}

const resultRow = (w, r) => `<a class="row" href="#wiki/${esc(w.id)}/${esc(enc(r.title))}" style="grid-template-columns:minmax(0,1fr) auto">
  <div class="row-main"><strong>${esc(r.title)}</strong><span class="sub" style="white-space:normal">${esc(r.snippet)}${r.snippet ? "…" : ""}</span></div><span class="muted" style="font-size:12px">${r.words ? plural(r.words, "word") : ""}</span></a>`;

async function wikiHome(view, w) {
  setCrumbs([["Wikis", "wiki"], [w.name, ""]]);
  const st = { q: "", offset: 0 };
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">${kindOf(w)} · ${esc(new URL(w.base).hostname)}</p><h1 class="h1">${esc(w.name)}</h1>
      <div class="linkgrid" style="margin-top:10px"><a class="btn btn-sm" href="#wiki/${esc(w.id)}/${esc(enc(w.main || "Main Page"))}">Main page</a><button class="btn btn-sm" type="button" id="wh-rand">${icon("star")}Random article</button><a class="btn btn-sm btn-ghost" href="${esc(w.base)}" target="_blank" rel="noopener">Open the site ↗</a></div></div>
      <form class="search" id="wh-form" role="search">${icon("search")}<input class="field" type="search" placeholder="Search ${esc(w.name)}" autofocus><button class="btn btn-accent">Search</button></form></div>
    <p class="status" id="wh-s"></p><div class="list" id="wh-out"></div><div class="more"><button class="btn" type="button" id="wh-more" hidden>Load more</button></div>`;
  const run = async (more = false) => {
    if (!more) { st.offset = 0; $("#wh-out", view).innerHTML = ""; }
    const s = $("#wh-s", view); s.className = "status"; s.textContent = "Searching…";
    try {
      const d = await search(w, st.q, st.offset);
      $("#wh-out", view).insertAdjacentHTML("beforeend", d.results.map((r) => resultRow(w, r)).join(""));
      s.textContent = d.results.length || more ? (d.total != null ? `${d.total.toLocaleString()} results` : "") : `Nothing on ${w.name} for “${st.q}”.`;
      st.offset = d.next; $("#wh-more", view).hidden = d.next == null;
    } catch (e) { s.className = "status err"; s.textContent = e.message; }
  };
  $("#wh-form", view).onsubmit = (e) => { e.preventDefault(); st.q = $("#wh-form input", view).value.trim(); if (st.q) run(); };
  $("#wh-more", view).onclick = () => run(true);
  $("#wh-rand", view).onclick = async () => { try { const t = await random(w); if (t) location.hash = `wiki/${w.id}/${enc(t)}`; } catch (e) { toast(e.message); } };
}

// A category: its pages and subcategories.
async function categoryView(view, w, title) {
  const name = title.replace(/^[^:]+:/, "");
  setCrumbs([["Wikis", "wiki"], [w.name, "wiki/" + w.id], [name, ""]]);
  view.innerHTML = `<div class="page-head"><div><p class="eyebrow">${esc(w.name)} · Category</p><h1 class="h1">${esc(name)}</h1></div></div>
    <p class="status" id="wc-s">Loading…</p><div class="chips" id="wc-subs" style="margin-bottom:16px"></div><div class="wk-cat" id="wc-out"></div><div class="more"><button class="btn" type="button" id="wc-more" hidden>Load more</button></div>`;
  let next = null;
  const load = async () => {
    try {
      const d = await category(w, title, next);
      $("#wc-subs", view).insertAdjacentHTML("beforeend", d.subcats.map((c) => `<a class="chip" href="#wiki/${esc(w.id)}/${esc(enc("Category:" + c))}">${icon("folder")}${esc(c)}</a>`).join(""));
      $("#wc-out", view).insertAdjacentHTML("beforeend", d.pages.map((t) => `<a href="#wiki/${esc(w.id)}/${esc(enc(t))}">${esc(t)}</a>`).join(""));
      const n = $$("#wc-out a", view).length;
      $("#wc-s", view).textContent = n || d.subcats.length ? `${plural(n, "article")}${d.next ? " so far" : ""}` : "This category is empty.";
      next = d.next; $("#wc-more", view).hidden = !next;
    } catch (e) { $("#wc-s", view).className = "status err"; $("#wc-s", view).textContent = e.message; }
  };
  $("#wc-more", view).onclick = load;
  load();
}

let speaking = null;
function stopSpeaking() { if (speaking) { speechSynthesis.cancel(); speaking = null; } }

async function article(view, w, title) {
  stopSpeaking();
  setCrumbs([["Wikis", "wiki"], [w.name, "wiki/" + w.id], [title, ""]]);
  view.innerHTML = `<p class="status">Loading “${esc(title)}” from ${esc(w.name)}…</p>`;
  let a;
  try { a = await page(w, title); } catch (e) {
    // Not an exact title: open the best search match instead.
    try { const d = await search(w, title); if (d.results[0] && d.results[0].title !== title) { location.replace("#wiki/" + w.id + "/" + enc(d.results[0].title)); return; } } catch {}
    view.innerHTML = emptyState("This article didn't load.", e.message, `<a class="btn" href="#wiki/${esc(w.id)}">Back to ${esc(w.name)}</a>`); return; }
  setCrumbs([["Wikis", "wiki"], [w.name, "wiki/" + w.id], [a.title, ""]]);
  remember(w, a.resolved);
  const saveId = `wk-${w.id}-${a.resolved}`.slice(0, 140);
  const words = a.text.split(/\s+/).length;
  view.innerHTML = `
    <div class="wiki-layout">
      <article class="wiki-article">
        <p class="eyebrow">${esc(w.name)} · ${Math.max(1, Math.round(words / 230))} min read</p><h1 class="h1" style="margin-bottom:14px">${esc(a.title)}</h1>
        <div class="linkgrid" style="margin-bottom:20px"><button class="btn btn-sm btn-accent" type="button" id="wa-save">${icon("plus")}${getItem(saveId) ? "Open in reader" : "Save to library"}</button>
          ${"speechSynthesis" in window ? `<button class="btn btn-sm" type="button" id="wa-speak">${icon("play")}Read aloud</button>` : ""}
          ${a.langs.length ? `<button class="btn btn-sm" type="button" id="wa-lang">${icon("globe")}${plural(a.langs.length, "language")}</button>` : ""}
          <button class="btn btn-sm" type="button" id="wa-rand">${icon("star")}Random</button><button class="btn btn-sm btn-ghost" type="button" id="wa-share">${icon("link")}Copy link</button><a class="btn btn-sm btn-ghost" href="${esc(a.url)}" target="_blank" rel="noopener">Original ↗</a></div>
        <div class="wiki-body" id="wa-body">${a.html}</div>
        ${a.categories.length ? `<div class="wk-cats"><span class="muted">Categories</span>${a.categories.slice(0, 24).map((c) => `<a class="chip" href="#wiki/${esc(w.id)}/${esc(enc("Category:" + c))}">${esc(c)}</a>`).join("")}</div>` : ""}
        <footer class="wiki-credit">From <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(w.name)}</a>, written by its contributors (<a href="${esc(a.url)}?action=history" target="_blank" rel="noopener">history</a>).
          ${w.license ? `Text available under ${w.licenseUrl ? `<a href="${esc(w.licenseUrl)}" target="_blank" rel="noopener">${esc(w.license)}</a>` : esc(w.license)}.` : ""}</footer>
      </article>
      ${a.sections.length > 2 ? `<nav class="wiki-toc" aria-label="Contents"><h4>Contents</h4>${a.sections.map((s) => `<a href="#" data-anchor="${esc(s.anchor)}">${esc(s.title)}</a>`).join("")}</nav>` : ""}
    </div>`;
  view.addEventListener("click", (e) => {
    const l = e.target.closest("[data-wiki]"); if (l) { e.preventDefault(); location.hash = `wiki/${w.id}/${enc(l.dataset.wiki)}`; return; }
    const t = e.target.closest("[data-anchor]");
    if (t) { e.preventDefault(); document.getElementById(t.dataset.anchor)?.scrollIntoView({ block: "start", behavior: "smooth" }); }
    const h = e.target.closest("#wa-body a[href^='#']:not([data-wiki])");
    if (h) { e.preventDefault(); document.getElementById(decodeURIComponent(h.getAttribute("href").slice(1)))?.scrollIntoView({ block: "start" }); }
  });
  $("#wa-rand", view).onclick = async () => { try { const t = await random(w); if (t) location.hash = `wiki/${w.id}/${enc(t)}`; } catch (e) { toast(e.message); } };
  $("#wa-share", view).onclick = async () => {
    const link = `${location.origin}${location.pathname}#wiki/${w.id}/${enc(a.resolved)}`;
    try { await navigator.clipboard.writeText(link); toast("Link copied. It opens this article in Kitsune."); } catch { toast(link); }
  };
  // Other languages: add that language's wiki and open the same article there.
  $("#wa-lang", view)?.addEventListener("click", (e) => {
    const langs = [...a.langs].sort((x, y) => x.name.localeCompare(y.name));
    menu(e.currentTarget, langs.slice(0, 80).map((l) => ({ label: `${l.name} · ${l.title}`, run: async () => {
      toast(`Opening ${l.name}…`);
      try { const w2 = await ensureWiki(l.url); location.hash = `wiki/${w2.id}/${enc(l.title)}`; } catch (err) { toast(err.message); }
    } })));
  });
  // Read aloud with the device's own voices, section by section.
  $("#wa-speak", view)?.addEventListener("click", (e) => {
    const btn = e.currentTarget;
    if (speaking) { stopSpeaking(); btn.innerHTML = `${icon("play")}Read aloud`; return; }
    const body = $("#wa-body", view).cloneNode(true);
    body.querySelectorAll("table, figure, .infobox, .portable-infobox, sup, .reflist, .references, style").forEach((n) => n.remove());
    const chunks = body.textContent.replace(/\s+/g, " ").match(/[^.!?。]+[.!?。]+["”’)]?\s*|.+$/g) || [];
    let i = 0; speaking = { btn };
    const voice = speechSynthesis.getVoices().find((v) => v.lang?.startsWith(w.lang || "en"));
    const next = () => {
      if (!speaking || i >= chunks.length) { speaking = null; btn.innerHTML = `${icon("play")}Read aloud`; return; }
      const u = new SpeechSynthesisUtterance(chunks.slice(i, i + 3).join(" ")); i += 3;
      if (voice) u.voice = voice; u.lang = w.lang || "en";
      u.onend = next; u.onerror = () => { speaking = null; btn.innerHTML = `${icon("play")}Read aloud`; };
      speechSynthesis.speak(u);
    };
    btn.innerHTML = `${icon("pause")}Stop reading`; next();
  });
  window.addEventListener("hashchange", stopSpeaking, { once: true });
  $("#wa-save", view).onclick = async () => {
    const item = getItem(saveId) || await saveItem({ id: saveId, type: "book", title: a.title, author: w.name, lang: w.lang,
      source: { kind: "wiki", api: w.api, wiki: w.name, page: a.resolved, url: a.url, license: w.license, cachedHtml: a.html },
      description: `Article from ${w.name}. ${w.license || ""}`.trim(), origin: `${w.name} (${kindOf(w)})`, tags: ["wikis"], status: "reading", rating: 0, added: Math.floor(Date.now() / 1000) });
    openItem(item);
  };
}
