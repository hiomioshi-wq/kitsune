// Comics: webcomics you follow (from the artists' own feeds), the whole xkcd archive, Pepper&Carrot in 70+ languages,
// and your favourite strips. Everything links back to the artist, and nothing is copied off their sites.
import { $, $$, esc, icon, toast, api, modal, debounce, plural } from "../util.js";
import { kvGet, kvSet, saveItem, getItem } from "../store.js";
import { openItem } from "./common.js";
import { setCrumbs } from "../main.js";
import { isKids } from "../profiles.js";

export const FEEDS = [
  { id: "xkcd", name: "xkcd", by: "Randall Munroe", url: "https://xkcd.com/rss.xml", site: "https://xkcd.com", blurb: "Romance, sarcasm, math and language.", hue: 210 },
  { id: "oatmeal", name: "The Oatmeal", by: "Matthew Inman", url: "https://theoatmeal.com/feed/rss", site: "https://theoatmeal.com", blurb: "Long, loud, illustrated stories about everything.", hue: 25 },
  { id: "webcomicname", name: "Webcomic Name", by: "Alex Norris", url: "https://webcomicname.com/rss", site: "https://webcomicname.com", blurb: "Three panels. One blob. Oh no.", hue: 330 },
  { id: "sarah", name: "Sarah's Scribbles", by: "Sarah Andersen", url: "https://sarahcandersen.com/rss", site: "https://sarahcandersen.com", blurb: "Introverts, cats, and being a person.", hue: 0 },
  { id: "loadingartist", name: "Loading Artist", by: "Gregor Czaykowski", url: "https://loadingartist.com/feed/", site: "https://loadingartist.com", blurb: "Everyday absurdity, beautifully drawn.", hue: 190 },
  { id: "exocomics", name: "Extra Ordinary", by: "Li Chen", url: "https://www.exocomics.com/feed/", site: "https://www.exocomics.com", blurb: "Gentle, odd and often moving.", hue: 160 },
  { id: "commitstrip", name: "CommitStrip", by: "Etienne Issartial & Thomas Gx", url: "https://www.commitstrip.com/en/feed/", site: "https://www.commitstrip.com/en/", blurb: "The life of programmers.", hue: 45 },
  { id: "buttersafe", name: "Buttersafe", by: "Alex Culang & Raynato Castro", url: "https://www.buttersafe.com/feed/", site: "https://www.buttersafe.com", blurb: "Sweet, surreal and silly.", hue: 280 },
  { id: "savagechickens", name: "Savage Chickens", by: "Doug Savage", url: "https://www.savagechickens.com/feed", site: "https://www.savagechickens.com", blurb: "Cartoons on sticky notes, since 2005.", hue: 55 },
  { id: "invisiblebread", name: "Invisible Bread", by: "Justin Boyd", url: "https://invisiblebread.com/feed/", site: "https://invisiblebread.com", blurb: "Daft and delightful.", hue: 120 },
  { id: "nedroid", name: "Nedroid", by: "Anthony Clark", url: "https://nedroid.com/feed/", site: "https://nedroid.com", blurb: "Beartato and Reginald, among others.", hue: 140 },
  { id: "smbc", name: "SMBC", by: "Zach Weinersmith", url: "https://www.smbc-comics.com/comic/rss", site: "https://www.smbc-comics.com", blurb: "Science, philosophy and dark jokes.", hue: 0, mature: true },
  { id: "explosm", name: "Cyanide & Happiness", by: "Explosm", url: "https://explosm.net/rss.xml", site: "https://explosm.net", blurb: "Stick figures, very dark humour.", hue: 15, mature: true },
  { id: "warandpeas", name: "War and Peas", by: "Elizabeth Pich & Jonathan Kunz", url: "https://warandpeas.com/feed/", site: "https://warandpeas.com", blurb: "Grim, absurd and adult.", hue: 100, mature: true },
];
const DEFAULT_FOLLOW = ["xkcd", "oatmeal", "webcomicname", "sarah", "loadingartist", "exocomics", "savagechickens", "buttersafe"];
const TABS = [["", "Webcomics"], ["xkcd", "xkcd"], ["pepper", "Pepper&Carrot"], ["favs", "Favourites"]];

const prefs = async () => ({ follow: DEFAULT_FOLLOW, custom: [], ...((await kvGet("comicFeeds", null)) || {}) });
const savePrefs = (p) => kvSet("comicFeeds", p);
async function allFeeds() { const p = await prefs(); return [...FEEDS, ...p.custom].filter((f) => !(f.mature && isKids())); }

export async function render(view, _n, params = []) {
  const tab = params[0] || "";
  setCrumbs([["Comics", "comics"], ...(tab ? [[TABS.find((t) => t[0] === tab)?.[1] || "", ""]] : [])]);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Read free, from the artists</p><h1 class="h1">Comics</h1>
      <p class="lede">Webcomics straight from their creators' feeds, all of xkcd, and Pepper&amp;Carrot in dozens of languages. Every strip links back to its artist. Support the ones you love.</p></div></div>
    <div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" type="button" data-ctab="${k}" aria-selected="${tab === k}">${l}</button>`).join("")}</div>
    <div id="cx"></div>`;
  $$("[data-ctab]", view).forEach((b) => (b.onclick = () => (location.hash = "comics" + (b.dataset.ctab ? "/" + b.dataset.ctab : ""))));
  const host = $("#cx", view);
  if (tab === "xkcd") return renderXkcd(host, params[1]);
  if (tab === "pepper") return renderPepper(host);
  if (tab === "favs") return renderFavs(host);
  return renderWebcomics(host);
}

// ---------- feeds ----------
const feedCache = new Map();
const JUNK = /feedburner|gravatar|emoji|wp-includes|share|pixel|badge|button|patreon|avatar|logo|icon|ads?\.|doubleclick|stats\./i;
export async function loadFeed(f, { fresh = false } = {}) {
  if (!fresh && feedCache.has(f.url) && Date.now() - feedCache.get(f.url).t < 10 * 60_000) return feedCache.get(f.url).items;
  const xml = await api("feed?url=" + encodeURIComponent(f.url));
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const nodes = [...doc.querySelectorAll("item, entry")];
  const items = [];
  for (const n of nodes) {
    const pick = (sel) => n.getElementsByTagName(sel)[0];
    const title = (pick("title")?.textContent || "").trim();
    const linkEl = [...n.getElementsByTagName("link")].find((l) => !l.getAttribute("rel") || l.getAttribute("rel") === "alternate") || pick("link");
    const link = (linkEl?.getAttribute("href") || linkEl?.textContent || "").trim();
    const date = (pick("pubDate") || pick("published") || pick("updated") || pick("dc:date"))?.textContent?.trim() || "";
    const raw = (pick("content:encoded") || pick("content") || pick("description") || pick("summary"))?.textContent || "";
    const html = new DOMParser().parseFromString(raw, "text/html");
    const abs = (u) => { try { return new URL(u, link || f.site).href; } catch { return ""; } };
    let imgs = [...html.querySelectorAll("img")].map((im) => ({ src: abs(im.getAttribute("src") || im.getAttribute("data-src") || ""), alt: im.getAttribute("title") || "", w: Number(im.getAttribute("width") || 0), h: Number(im.getAttribute("height") || 0) }))
      .filter((x) => x.src && !JUNK.test(x.src) && !(x.w && x.w < 60) && !(x.h && x.h < 60));
    const media = [...n.getElementsByTagName("media:content"), ...n.getElementsByTagName("enclosure"), ...n.getElementsByTagName("media:thumbnail")]
      .map((m) => ({ src: abs(m.getAttribute("url") || ""), type: m.getAttribute("type") || m.getAttribute("medium") || "image" })).filter((m) => m.src && /image/.test(m.type));
    if (!imgs.length && media.length) imgs = [{ src: media[0].src, alt: "" }];
    if (!imgs.length) continue;
    // the strip is the biggest picture in the post when sizes are given, otherwise the first
    const best = imgs.slice().sort((a, b) => (b.w * b.h || 0) - (a.w * a.h || 0))[0].w ? imgs.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0] : imgs[0];
    const text = html.body.textContent.replace(/\s+/g, " ").trim();
    const hover = best.alt || (text.match(/Hovertext:\s*(.+)/i)?.[1] || "").slice(0, 400);
    items.push({ key: link || best.src, title: title || f.name, img: best.src, alt: hover && hover !== title ? hover : "", date, link, by: f.by });
  }
  feedCache.set(f.url, { t: Date.now(), items });
  return items;
}

async function renderWebcomics(host) {
  const p = await prefs(), feeds = await allFeeds(), followed = feeds.filter((f) => p.follow.includes(f.id));
  host.innerHTML = `
    <div class="toolbar"><button class="btn btn-accent" type="button" id="cx-choose">${icon("plus")}Choose comics</button><button class="btn" type="button" id="cx-add">${icon("link")}Add a webcomic by its feed</button><span class="muted" style="font-size:13px">${plural(followed.length, "comic")} followed</span></div>
    <section class="section" style="margin-top:8px"><div class="section-head"><h2 class="h2">New strips</h2><span class="muted" style="font-size:13px" id="cx-new-n">Loading…</span></div>
      <div class="cx-river" id="cx-river"><div class="cx-skel"></div><div class="cx-skel"></div><div class="cx-skel"></div></div></section>
    <section class="section"><div class="section-head"><h2 class="h2">Your comics</h2></div>
      <div class="cx-grid" id="cx-grid">${followed.map((f) => cardHtml(f)).join("") || `<p class="muted">You aren't following any comics yet. Choose some above.</p>`}</div></section>`;
  $("#cx-choose", host).onclick = () => chooseDialog(host);
  $("#cx-add", host).onclick = () => addFeedDialog(host);
  const all = [];
  await Promise.all(followed.map(async (f) => {
    const card = $(`[data-feed="${CSS.escape(f.id)}"]`, host);
    try {
      const items = await loadFeed(f), seen = await (await import("../strips.js")).seenSet("feed:" + f.id);
      items.forEach((it) => all.push({ ...it, feed: f }));
      const unread = items.filter((it) => !seen.has(it.key)).length;
      if (card) {
        const im = $(".cx-thumb", card);
        if (items[0]) im.innerHTML = `<img src="${esc(items[0].img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`;
        $(".cx-count", card).textContent = unread ? `${unread} new` : items.length ? "All read" : "No strips in the feed";
        card.classList.toggle("has-new", unread > 0);
      }
    } catch (e) { if (card) { $(".cx-count", card).textContent = "Couldn't load right now"; card.classList.add("err"); } }
  }));
  // the newest dozen across everything you follow
  all.sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0));
  const river = all.slice(0, 12);
  $("#cx-new-n", host).textContent = river.length ? `The latest from ${plural(new Set(river.map((r) => r.feed.id)).size, "comic")}` : "";
  $("#cx-river", host).innerHTML = river.length ? river.map((it, i) => `<button class="cx-strip" type="button" data-river="${i}"><span class="cx-simg"><img src="${esc(it.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('broken')"></span>
      <span class="cx-sbody"><small style="--h:${it.feed.hue ?? 200}">${esc(it.feed.name)}</small><strong>${esc(it.title)}</strong><em>${it.date ? esc(new Date(it.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })) : ""}</em></span></button>`).join("")
    : `<p class="muted">No new strips could be loaded. Check your connection.</p>`;
  host.onclick = async (e) => {
    const r = e.target.closest("[data-river]");
    if (r) { const { openStrips } = await import("../strips.js"); const items = river; return openStrips({ id: "river", name: "New strips", count: items.length, get: async (i) => items[i], label: (i) => `${items[i].feed.name} · ${i + 1} of ${items.length}`, onView: (it) => { const f = river.find((x) => x.key === it.key)?.feed; if (f) import("../strips.js").then((S) => S.markSeen("feed:" + f.id, [it.key])); } }, Number(r.dataset.river)); }
    const c = e.target.closest("[data-feed]");
    if (c && !e.target.closest("a")) return openFeed(feeds.find((f) => f.id === c.dataset.feed), () => renderWebcomics(host));
  };
}
// comic cards open with Enter or Space too
document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches?.(".cx-card")) { e.preventDefault(); e.target.click(); } });
const cardHtml = (f) => `<div class="cx-card" data-feed="${esc(f.id)}" role="button" tabindex="0" style="--h:${f.hue ?? 200}">
    <span class="cx-thumb" aria-hidden="true"></span>
    <span class="cx-cbody"><strong>${esc(f.name)}</strong><small>${esc(f.by || "")}</small><span class="cx-count">Loading…</span></span>
    <a class="cx-site" href="${esc(f.site || f.url)}" target="_blank" rel="noopener" aria-label="Visit ${esc(f.name)}" title="Visit the artist's site">${icon("link")}</a></div>`;

export async function openFeed(f, onClose) {
  if (!f) return;
  const S = await import("../strips.js");
  let items;
  try { items = await loadFeed(f); } catch (e) { return toast(e.message); }
  if (!items.length) return toast(`${f.name}'s feed has no strips right now.`);
  S.openStrips({ id: "feed:" + f.id, name: f.name, count: items.length, get: async (i) => items[i], credit: `By ${f.by || f.name}. Read more at ${new URL(f.site || f.url).hostname}`, onClose });
}

function chooseDialog(host) {
  prefs().then((p) => {
    const list = [...FEEDS, ...p.custom].filter((f) => !(f.mature && isKids()));
    const m = modal({ title: "Choose comics", wide: true, body: `<p class="hint" style="margin-top:0">Kitsune reads each comic from the artist's own feed and links every strip back to them.${isKids() ? "" : " Comics marked 18+ have adult humour."}</p>
      <div class="cx-choose">${list.map((f) => `<label class="cx-opt" style="--h:${f.hue ?? 200}"><input type="checkbox" value="${esc(f.id)}" ${p.follow.includes(f.id) ? "checked" : ""}>
        <span><strong>${esc(f.name)}${f.mature ? ` <em class="cx-18">18+</em>` : ""}${f.custom ? ` <em class="cx-own">yours</em>` : ""}</strong><small>${esc(f.by || "")}${f.blurb ? ` · ${esc(f.blurb)}` : ""}</small></span></label>`).join("")}</div>`,
      actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="cx-save">Save</button>` });
    $("#cx-save", m.root).onclick = async () => { p.follow = $$(".cx-choose input:checked", m.root).map((i) => i.value); await savePrefs(p); m.close(); renderWebcomics(host); };
  });
}
function addFeedDialog(host) {
  const m = modal({ title: "Add a webcomic", body: `<form class="form" id="cx-f"><p class="hint" style="margin-top:0">Most webcomics have an RSS or Atom feed. Paste its link (often ending in /feed or /rss.xml). Kitsune checks it has pictures in it.</p>
      <input class="field" id="cx-u" type="url" required placeholder="https://example.com/feed" autofocus><input class="field" id="cx-n" placeholder="Name (optional)"><p class="status" id="cx-s"></p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="cx-f">Add</button>` });
  $("#cx-f", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const s = $("#cx-s", m.root), url = $("#cx-u", m.root).value.trim();
    s.className = "status"; s.textContent = "Checking the feed…";
    try {
      const u = new URL(url), f = { id: "c-" + u.hostname.replace(/\W/g, "") + "-" + Math.random().toString(36).slice(2, 6), name: $("#cx-n", m.root).value.trim() || u.hostname.replace(/^www\./, ""), by: "", url, site: u.origin, custom: true, hue: Math.floor(Math.random() * 360) };
      const items = await loadFeed(f, { fresh: true });
      if (!items.length) throw new Error("That feed works, but Kitsune couldn't find comic pictures in it.");
      const p = await prefs(); p.custom.push(f); p.follow.push(f.id); await savePrefs(p);
      m.close(); toast(`Following ${f.name}: ${plural(items.length, "strip")} in its feed.`); renderWebcomics(host);
    } catch (err) { s.className = "status err"; s.textContent = err.message.startsWith("Invalid URL") ? "That isn't a full link." : err.message; }
  };
}

// ---------- xkcd ----------
let xk = null;
async function xkcdArchive() { if (!xk || Date.now() - xk.t > 30 * 60_000) xk = { t: Date.now(), ...(await api("comics/xkcd/archive")) }; return xk; }
function xkcdSource(latest) {
  const cache = new Map();
  return {
    id: "xkcd", name: "xkcd", count: latest, credit: "xkcd by Randall Munroe · CC BY-NC 2.5",
    label: (i) => `#${latest - i}`,
    random: () => Math.floor(Math.random() * latest),
    get: async (i) => {
      const n = latest - i;
      if (!cache.has(n)) cache.set(n, api(`comics/xkcd/${n}`).then((d) => ({ key: "xkcd:" + d.num, num: d.num, title: d.title, img: d.img, alt: d.alt, date: d.date, link: d.link, by: "Randall Munroe" })));
      return cache.get(n);
    },
  };
}
async function renderXkcd(host, start) {
  host.innerHTML = `<p class="status">Loading xkcd…</p>`;
  let latest, arch;
  try { [latest, arch] = await Promise.all([api("comics/xkcd/latest"), xkcdArchive()]); } catch (e) { host.innerHTML = `<p class="status err">${esc(e.message)}</p>`; return; }
  const open = async (num) => (await import("../strips.js")).openStrips(xkcdSource(latest.num), latest.num - num);
  host.innerHTML = `
    <section class="xk-hero">
      <div class="xk-img"><img src="${esc(latest.img)}" alt="${esc(latest.title)}. ${esc(latest.alt)}" referrerpolicy="no-referrer"></div>
      <div class="xk-txt"><p class="eyebrow">Latest · #${latest.num} · ${esc(new Date(latest.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }))}</p>
        <h2 class="h2">${esc(latest.title)}</h2><p class="xk-alt">${esc(latest.alt)}</p>
        <div class="hero-actions"><button class="btn btn-accent" type="button" data-xk="${latest.num}">${icon("book")}Read from here</button><button class="btn" type="button" id="xk-rand">${icon("compass")}Random</button><button class="btn" type="button" data-xk="1">${icon("back")}Start at #1</button></div>
        <p class="hint">xkcd by Randall Munroe, CC BY-NC 2.5. Tap a comic to see its hover text.</p></div>
    </section>
    <section class="section"><div class="section-head"><h2 class="h2">The archive</h2><span class="muted" style="font-size:13px">${arch.count.toLocaleString()} comics</span></div>
      <div class="toolbar"><div class="search" style="flex:1 1 260px;max-width:420px">${icon("search")}<input class="field" id="xk-q" type="search" placeholder="Search titles, or type a number" aria-label="Search xkcd"></div></div>
      <ol class="xk-list" id="xk-list"></ol><button class="btn" type="button" id="xk-more" hidden>Show more</button></section>`;
  let shown = 60, list = arch.comics;
  const draw = () => {
    $("#xk-list", host).innerHTML = list.slice(0, shown).map((c) => `<li><button type="button" data-xk="${c.num}"><span class="xk-n">#${c.num}</span><span class="xk-t">${esc(c.title)}</span><span class="xk-d">${esc(c.date.slice(0, 4))}</span></button></li>`).join("") || `<li class="muted">No titles match.</li>`;
    $("#xk-more", host).hidden = list.length <= shown;
  };
  draw();
  $("#xk-q", host).oninput = debounce((e) => {
    const q = e.target.value.trim().toLowerCase();
    list = !q ? arch.comics : /^#?\d+$/.test(q) ? arch.comics.filter((c) => String(c.num).startsWith(q.replace("#", ""))) : arch.comics.filter((c) => c.title.toLowerCase().includes(q));
    shown = 60; draw();
  }, 150);
  $("#xk-more", host).onclick = () => { shown += 120; draw(); };
  $("#xk-rand", host).onclick = () => open(1 + Math.floor(Math.random() * latest.num));
  host.onclick = (e) => { const b = e.target.closest("[data-xk]"); if (b) open(Number(b.dataset.xk)); };
  if (start && Number(start) > 0) open(Number(start));
}

// ---------- Pepper&Carrot ----------
async function renderPepper(host) {
  host.innerHTML = `<p class="status">Loading Pepper&amp;Carrot…</p>`;
  let d;
  try { d = await api("comics/peppercarrot"); } catch (e) { host.innerHTML = `<p class="status err">${esc(e.message)}</p>`; return; }
  const guess = (navigator.language || "en").slice(0, 2).toLowerCase();
  let lang = localStorage.getItem("kitsune.pcLang") || (d.langs.some((l) => l.code === guess) ? guess : "en");
  const draw = () => {
    host.innerHTML = `
      <section class="pc-hero"><div><p class="eyebrow">An open-source webcomic</p><h2 class="h2">Pepper&amp;Carrot</h2>
        <p class="lede">A young witch and her cat in the world of Hereva, by French artist David Revoy. Free for everyone under CC BY 4.0, funded by readers, and translated by volunteers into ${d.langs.length} languages.</p>
        <div class="toolbar" style="margin:14px 0 0"><label class="lbl" for="pc-lang" style="margin:0">Language</label><select class="field" id="pc-lang" style="width:auto">${d.langs.map((l) => `<option value="${esc(l.code)}" ${l.code === lang ? "selected" : ""}>${esc(l.local)}${l.local !== l.name ? ` (${esc(l.name)})` : ""}</option>`).join("")}</select>
          <button class="btn btn-accent" type="button" id="pc-all">${icon("plus")}Add all ${d.episodes.length} episodes to my library</button>
          <a class="btn" href="https://www.peppercarrot.com/en/support/index.html" target="_blank" rel="noopener">${icon("star")}Support David Revoy</a></div></div></section>
      <div class="pc-grid">${d.episodes.map((e) => { const has = e.langs.includes(lang); const it = getItem(`pc-${e.n}-${has ? lang : "en"}`); return `<button class="pc-ep" type="button" data-ep="${e.n}">
        <span class="pc-cover"><img src="${esc(e.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer"><b>${e.n}</b>${it ? `<i class="pc-in">In library</i>` : ""}</span>
        <span class="pc-t"><strong>${esc(e.title)}</strong><small>${plural(e.pages, "page")}${has ? "" : " · in English"}</small></span></button>`; }).join("")}</div>`;
    $("#pc-lang", host).onchange = (e) => { lang = e.target.value; localStorage.setItem("kitsune.pcLang", lang); draw(); };
    $("#pc-all", host).onclick = async (e) => {
      const b = e.currentTarget; b.disabled = true;
      let n = 0;
      for (const ep of d.episodes) { b.textContent = `Adding ${ep.n} of ${d.episodes.length}…`; try { await addEpisode(ep, lang); n++; } catch {} }
      toast(`Added ${n} episodes of Pepper&Carrot. Find them under Series in your library.`); draw();
    };
  };
  draw();
  host.onclick = async (e) => {
    const b = e.target.closest("[data-ep]"); if (!b) return;
    const ep = d.episodes.find((x) => x.n === Number(b.dataset.ep));
    b.classList.add("busy");
    try { openItem(await addEpisode(ep, lang)); } catch (err) { toast(err.message); }
    b.classList.remove("busy");
  };
}
async function addEpisode(ep, lang) {
  const lg = ep.langs.includes(lang) ? lang : "en", id = `pc-${ep.n}-${lg}`;
  const have = getItem(id); if (have) return have;
  const d = await api(`comics/peppercarrot/${ep.n}?lang=${encodeURIComponent(lg)}`);
  return saveItem({
    id, type: "manga", title: `Episode ${ep.n}: ${d.title}`, series: lg === "en" ? "Pepper&Carrot" : `Pepper&Carrot (${lg})`, volume: ep.n, author: "David Revoy",
    source: { kind: "urls", urls: d.pages }, pages: d.pages.length, dir: "ltr", lang: lg, cover: ep.cover,
    credit: { creator: "David Revoy", license: "Creative Commons Attribution 4.0 (CC BY 4.0)", url: d.link }, origin: "Pepper&Carrot",
    tags: ["webcomics"], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000),
  });
}

// ---------- favourites ----------
async function renderFavs(host) {
  const S = await import("../strips.js"), favs = await S.getFavs();
  host.innerHTML = favs.length ? `<div class="cx-river cx-favs">${favs.map((f, i) => `<button class="cx-strip" type="button" data-fav="${i}"><span class="cx-simg"><img src="${esc(f.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('broken')"></span>
      <span class="cx-sbody"><small>${esc(f.source || "")}</small><strong>${esc(f.title)}</strong><em>Saved ${esc(new Date(f.saved).toLocaleDateString(undefined, { month: "short", day: "numeric" }))}</em></span></button>`).join("")}</div>`
    : `<div class="empty"><h3>No favourites yet.</h3><p>Tap the star while reading a strip to keep it here.</p><a class="btn btn-accent" href="#comics">Read some webcomics</a></div>`;
  host.onclick = (e) => {
    const b = e.target.closest("[data-fav]"); if (!b) return;
    S.openStrips({ id: "", name: "Favourites", count: favs.length, get: async (i) => favs[i], onClose: () => renderFavs(host) }, Number(b.dataset.fav));
  };
}
