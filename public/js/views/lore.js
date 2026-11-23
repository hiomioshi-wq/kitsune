// The Originals fan wiki: every Kitsune Original, Blackwood episode, Incarnate book and Backrooms script,
// with character pages, episode guides, songs, places, quotes and timelines.
// Hand-written articles live in lore-curated.js; everything measurable comes from originals/lore-data.json.
import { $, $$, esc, icon, toast } from "../util.js";
import { setCrumbs } from "../main.js";
import { isKids } from "../profiles.js";
import { SERIES_LORE, CHARACTERS, CONCEPTS, TIMELINES } from "../lore-curated.js";

const NOISE = new Set(["MAGIC PICTURE", "MISTMOTH", "MISTMOTHS", "REMEMBERERS", "SEAM", "DOCTOR", "TENANT", "BACKROOMS", "FRONTROOMS", "PARTYGOERS", "COAT CHECK", "PRINCIPAL", "FRESHMAN", "STUDENT", "STUDENT 1", "STUDENT 2", "STUDENT 3", "PROFESSOR", "GHOST", "WOMAN", "MAN", "GIRL", "BOY", "VOICE", "RADIO", "PHONE", "TV", "NURSE", "WAITER", "WAITRESS", "COP", "GUARD", "TWENTY", "HORSEMAN", "SOUND", "COURIER", "TITLE", "SCREEN"]);
const NEWEST = ["bw-noncanon-want", "bw-ep22", "bw-ep21", "bw-sasha", "bw-lux-velvette", "bw-ep20", "bw-kevin-slides-4", "bw-kevin-slides-3", "bw-kevin-slides-2", "bw-kevin-slides-1", "bw-ep19"];
const SERIES_ORDER = ["kitsune", "blackwood", "incarnate", "backrooms"];
let DATA = null;
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60);
const pretty = (s) => s.toLowerCase().replace(/(^|[\s\-(])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bMeg\b/, "M.E.G.");
const fmt = (n) => Number(n || 0).toLocaleString();

async function load() {
  if (DATA) return DATA;
  const r = await fetch("/originals/lore-data.json"); const d = await r.json();
  const kids = isKids();
  d.series = d.series.filter((s) => !(kids && s.mature)).sort((a, b) => SERIES_ORDER.indexOf(a.id) - SERIES_ORDER.indexOf(b.id));
  const ok = new Set(d.series.map((s) => s.id));
  d.works = d.works.filter((w) => ok.has(w.series));
  d.work = Object.fromEntries(d.works.map((w) => [w.id, w]));
  // characters: measured ones plus every hand-written one
  const chars = new Map();
  for (const c of d.characters) { if (!ok.has(c.series) || NOISE.has(c.name) || /^(STUDENT|PROFESSOR|GHOST|M\.E\.G\.) /.test(c.name)) continue; chars.set(c.series + ":" + c.slug, { ...c, key: c.series + ":" + c.slug }); }
  for (const [key, cur] of Object.entries(CHARACTERS)) {
    const [sid, sl] = key.split(":"); if (!ok.has(sid)) continue;
    const base = chars.get(key) || { series: sid, slug: sl, name: cur.title.toUpperCase(), lines: 0, works: [], quotes: [], songs: [], related: [], appearances: 0 };
    chars.set(key, { ...base, key, cur });
  }
  d.chars = chars;
  d.charList = [...chars.values()].filter((c) => c.cur || c.lines >= 3 || (c.mentions || 0) >= 6).sort((a, b) => !!b.cur - !!a.cur || (b.lines + (b.mentions || 0)) - (a.lines + (a.mentions || 0)));
  d.concepts = CONCEPTS.filter((c) => ok.has(c.id.split(":")[0])).map((c) => ({ ...c, series: c.id.split(":")[0], slug: c.id.split(":")[1] }));
  d.songList = d.songs.filter((s) => ok.has(s.series)).map((s, i) => ({ ...s, n: i, slug: slug(s.title) + "-" + i }));
  d.placeList = d.places.filter((p) => ok.has(p.series));
  DATA = d; return d;
}
const seriesOf = (d, id) => d.series.find((s) => s.id === id);
const charHref = (c) => `#lore/c/${c.series}/${c.slug}`;
const charName = (c) => c.cur?.title || pretty(c.name);
const workHref = (id) => `#lore/w/${encodeURIComponent(id)}`;

// ---------- tiny markup: paragraphs, lists, **bold**, *italic*, [[series:slug|text]] ----------
function md(d, text) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[\[([a-z]+):([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (m, sid, sl, label) => {
      const key = sid + ":" + sl, c = d.chars.get(key), k = d.concepts.find((x) => x.id === key);
      const href = c ? charHref(c) : k ? `#lore/p/${sid}/${sl}` : null, text = label || (c ? charName(c) : k ? k.title : sl);
      return href ? `<a href="${href}" class="lw-link">${esc(text)}</a>` : `<span class="lw-red" title="No article yet">${esc(text)}</span>`;
    });
  return text.split(/\n{2,}/).map((block) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^- /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
    return `<p>${lines.map(inline).join("<br>")}</p>`;
  }).join("");
}
const infobox = (title, img, rows) => `<aside class="lw-info"><h3>${esc(title)}</h3>${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ""}<dl>${rows.filter((r) => r && r[1] != null && r[1] !== "").map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl></aside>`;
const chips = (list) => `<div class="lw-chips">${list.join("")}</div>`;
const charChip = (d, c) => `<a class="lw-chip" href="${charHref(c)}">${c.cur ? "★ " : ""}${esc(charName(c))}</a>`;

function shell(view, crumbs, body, side = "") {
  setCrumbs([["Originals wiki", "lore"], ...crumbs]);
  view.innerHTML = `<div class="page lw">
    <form class="lw-search" id="lw-sf"><span class="lw-logo">${icon("book")} <strong>Originals wiki</strong></span><input class="field" id="lw-q" type="search" placeholder="Search characters, episodes, songs, places…" aria-label="Search the wiki"><button class="btn">${icon("search")}</button></form>
    <div class="lw-body"><article class="lw-main">${body}</article>${side ? `<div class="lw-side">${side}</div>` : ""}</div></div>`;
  $("#lw-sf", view).onsubmit = (e) => { e.preventDefault(); const q = $("#lw-q", view).value.trim(); if (q) location.hash = "lore/search/" + encodeURIComponent(q); };
}

export async function render(view, _name, params = []) {
  view.innerHTML = `<div class="page"><p class="status">Opening the wiki…</p></div>`;
  let d; try { d = await load(); } catch { view.innerHTML = `<div class="page"><p class="status">The wiki couldn't load.</p></div>`; return; }
  const [kind, a, b] = params.map((x) => decodeURIComponent(x || ""));
  if (kind === "s") return seriesPage(view, d, a);
  if (kind === "c") return charPage(view, d, a, b);
  if (kind === "w") return workPage(view, d, a);
  if (kind === "p") return conceptPage(view, d, a, b);
  if (kind === "song") return songPage(view, d, a);
  if (kind === "cat") return categoryPage(view, d, a, b);
  if (kind === "search") return searchPage(view, d, a);
  if (kind === "stats") return statsPage(view, d);
  if (kind === "random") { const pool = d.charList.filter((c) => c.cur); const c = pool[Math.floor(Math.random() * pool.length)]; location.replace("#" + charHref(c).slice(1)); return; }
  return homePage(view, d);
}

// ---------- home ----------
function homePage(view, d) {
  const total = (k) => fmt(d[k].length);
  const curated = d.charList.filter((c) => c.cur);
  const featured = curated[(new Date().getDate() * 7) % curated.length];
  const body = `<header class="lw-hero"><h1>The Originals wiki</h1><p class="lede">An in-depth fan wiki for every Kitsune Original: ${fmt(d.works.length)} works, ${fmt(d.charList.length)} characters, ${fmt(d.songList.length)} songs and ${fmt(d.placeList.length + d.concepts.length)} places and ideas, with appearances, line counts and quotes measured from the texts themselves.</p>
      <div class="lw-tools"><a class="btn" href="#lore/random">${icon("star")}Random article</a><a class="btn" href="#lore/cat/all/songs">${icon("headphones")}All songs</a><a class="btn" href="#lore/stats">${icon("chart")}Statistics</a><a class="btn" href="#books/free">${icon("book")}Read the Originals</a></div></header>
    <h2 class="lw-h2">Series</h2><div class="lw-portals">${d.series.map((s) => { const w = d.works.find((x) => x.series === s.id); return `<a class="lw-portal" href="#lore/s/${s.id}"><img src="${esc(w?.cover || "")}" alt="" loading="lazy"><span><strong>${esc(s.title)}</strong><small>${esc(SERIES_LORE[s.id]?.tagline || s.blurb || "")}</small><em>${fmt(s.works)} works · ${fmt(s.words)} words${s.mature ? " · mature" : ""}</em></span></a>`; }).join("")}</div>
    ${featured ? `<h2 class="lw-h2">Featured article</h2><div class="lw-featured"><a href="${charHref(featured)}"><strong>${esc(charName(featured))}</strong></a> · <span class="muted">${esc(seriesOf(d, featured.series)?.title || "")}</span>${md(d, (featured.cur.sections[0]?.b || "").split("\n\n")[0])}<a class="btn btn-sm" href="${charHref(featured)}">Read more</a></div>` : ""}
    <h2 class="lw-h2">Newest works</h2><div class="lw-grid">${NEWEST.map((id) => d.work[id]).filter(Boolean).map((w) => `<a class="lw-card" href="${workHref(w.id)}"><img src="${esc(w.cover || "")}" alt="" loading="lazy"><strong>${esc(w.title)}</strong><small>${esc(seriesOf(d, w.series)?.title || "")}</small></a>`).join("")}</div>
    <h2 class="lw-h2">Most-heard voices</h2>${chips(d.charList.filter((c) => c.lines).sort((a, b) => b.lines - a.lines).slice(0, 24).map((c) => charChip(d, c)))}
    <h2 class="lw-h2">Browse</h2><div class="lw-cats">${d.series.map((s) => `<div><h4>${esc(s.title)}</h4><a href="#lore/cat/${s.id}/characters">Characters</a> · <a href="#lore/cat/${s.id}/works">Episodes &amp; books</a> · <a href="#lore/cat/${s.id}/places">Places &amp; ideas</a>${d.songList.some((x) => x.series === s.id) ? ` · <a href="#lore/cat/${s.id}/songs">Songs</a>` : ""}</div>`).join("")}</div>`;
  shell(view, [], body);
}

// ---------- series portal ----------
function seriesPage(view, d, sid) {
  const s = seriesOf(d, sid); if (!s) return homePage(view, d);
  const L = SERIES_LORE[sid] || { sections: [] }, works = d.works.filter((w) => w.series === sid).sort((a, b) => a.order - b.order);
  const cast = d.charList.filter((c) => c.series === sid), songs = d.songList.filter((x) => x.series === sid), places = d.placeList.filter((p) => p.series === sid), concepts = d.concepts.filter((c) => c.series === sid);
  const tl = TIMELINES[sid];
  const toc = ["Overview", ...L.sections.slice(1).map((x) => x.h), "Episode guide", "Characters", songs.length ? "Songs" : null, "Places and ideas", tl ? "Timeline" : null].filter(Boolean);
  const body = `<h1 class="lw-title">${esc(s.title)}</h1><p class="lw-sub">${esc(L.tagline || s.blurb || "")}</p>
    ${s.mature ? `<p class="lw-warn">Mature series. ${esc(s.rights || "")}</p>` : `<p class="lw-note">${esc(s.rights || "")}</p>`}
    <nav class="lw-toc"><strong>Contents</strong><ol>${toc.map((t) => `<li><a href="#" data-jump="${slug(t)}">${esc(t)}</a></li>`).join("")}</ol></nav>
    ${L.sections.map((x) => `<h2 class="lw-h2" id="lw-${slug(x.h)}">${esc(x.h)}</h2>${md(d, x.b)}`).join("") || `<h2 class="lw-h2" id="lw-overview">Overview</h2><p>${esc(s.blurb || "")}</p>`}
    ${s.note ? `<p class="lw-note">${esc(s.note)}</p>` : ""}
    <h2 class="lw-h2" id="lw-episode-guide">Episode guide</h2><table class="lw-table"><thead><tr><th>#</th><th>Title</th><th>Summary</th><th>Length</th></tr></thead><tbody>${works.map((w, i) => `<tr><td>${esc(w.label || String(i + 1))}</td><td><a href="${workHref(w.id)}">${esc(w.title)}</a></td><td>${esc((w.blurb || "").slice(0, 220))}${(w.blurb || "").length > 220 ? "…" : ""}</td><td>${fmt(w.words)} words</td></tr>`).join("")}</tbody></table>
    <h2 class="lw-h2" id="lw-characters">Characters</h2><p class="muted">★ has a full article. ${fmt(cast.length)} characters in all: <a href="#lore/cat/${sid}/characters">see the full list</a>.</p>${chips(cast.slice(0, 48).map((c) => charChip(d, c)))}
    ${songs.length ? `<h2 class="lw-h2" id="lw-songs">Songs</h2><p class="muted">${fmt(songs.length)} songs.</p>${chips(songs.map((x) => `<a class="lw-chip" href="#lore/song/${x.slug}">♪ ${esc(x.title)}</a>`))}` : ""}
    <h2 class="lw-h2" id="lw-places-and-ideas">Places and ideas</h2>${chips([...concepts.map((c) => `<a class="lw-chip" href="#lore/p/${sid}/${c.slug}">${c.kind === "place" ? "⌂" : "✦"} ${esc(c.title)}</a>`), ...places.slice(0, 30).map((p) => `<span class="lw-chip plain" title="${fmt(p.scenes || p.mentions)} ${p.scenes ? "scenes" : "mentions"}">⌂ ${esc(p.name)}</span>`)])}
    ${tl ? `<h2 class="lw-h2" id="lw-timeline">Timeline</h2><ol class="lw-timeline">${tl.map(([when, id, text]) => `<li><span>${esc(when)}</span><div><a href="${workHref(id)}">${esc(d.work[id]?.title || id)}</a><p>${esc(text)}</p></div></li>`).join("")}</ol>` : ""}`;
  const side = infobox(s.title, works[0]?.cover, [["Works", fmt(works.length)], ["Words", fmt(s.words)], ["Characters", fmt(cast.length)], ["Songs", songs.length ? fmt(songs.length) : ""], ["Rights", esc(s.rights || "")], ["Read", `<a href="#books/free/${sid === "kitsune" ? "" : sid}">Open in Originals &amp; free</a>`]]);
  shell(view, [[s.title, "lore/s/" + sid]], body, side);
  wireToc(view);
}

// ---------- character ----------
function charPage(view, d, sid, sl) {
  const c = d.chars.get(sid + ":" + sl); if (!c) return searchPage(view, d, sl.replace(/-/g, " "));
  const s = seriesOf(d, sid), cur = c.cur, name = charName(c);
  const apps = (c.works || []).map((x) => ({ ...x, w: d.work[x.id] })).filter((x) => x.w).sort((a, b) => a.w.order - b.w.order);
  const first = apps[0]?.w || (cur?.firstIn && d.work[cur.firstIn]);
  const related = (c.related || []).map((r) => d.chars.get(sid + ":" + r)).filter(Boolean).slice(0, 10);
  const lead = cur ? "" : `<p><strong>${esc(name)}</strong> is a character in <a href="#lore/s/${sid}">${esc(s.title)}</a>${c.lines ? `, with ${fmt(c.lines)} spoken line${c.lines === 1 ? "" : "s"}` : c.mentions ? `, named ${fmt(c.mentions)} times` : ""} across ${fmt(apps.length)} work${apps.length === 1 ? "" : "s"}${first ? `, first appearing in <a href="${workHref(first.id)}">${esc(first.title)}</a>` : ""}.</p>`;
  const sections = cur ? cur.sections : [];
  const toc = [...sections.map((x) => x.h), apps.length ? "Appearances" : null, c.songs?.length ? "Songs" : null, c.quotes?.length ? "Quotes" : null, c.phrases?.length ? "Catchphrases" : null, c.signature?.length ? "Signature words" : null, c.coScenes?.length ? "Scene partners" : null, related.length ? "Often appears with" : null].filter(Boolean);
  const body = `<h1 class="lw-title">${esc(name)}</h1>${cur?.aka?.length ? `<p class="lw-sub">Also known as ${cur.aka.map(esc).join(" · ")}</p>` : ""}
    ${cur ? `<p class="lw-warn">This article contains spoilers for ${esc(s.title)}.</p>` : ""}
    ${toc.length > 2 ? `<nav class="lw-toc"><strong>Contents</strong><ol>${toc.map((t) => `<li><a href="#" data-jump="${slug(t)}">${esc(t)}</a></li>`).join("")}</ol></nav>` : ""}
    ${lead}${sections.map((x) => `<h2 class="lw-h2" id="lw-${slug(x.h)}">${esc(x.h)}</h2>${md(d, x.b)}`).join("")}
    ${apps.length ? `<h2 class="lw-h2" id="lw-appearances">Appearances</h2><table class="lw-table"><thead><tr><th>Work</th><th></th><th>${c.lines ? "Lines" : "Mentions"}</th></tr></thead><tbody>${apps.map((x) => `<tr><td><a href="${workHref(x.id)}">${esc(x.w.title)}</a></td><td class="muted">${esc(x.w.label || "")}</td><td><span class="lw-bar"><i style="width:${Math.min(100, ((x.lines || x.mentions) / Math.max(...apps.map((y) => y.lines || y.mentions))) * 100)}%"></i></span>${fmt(x.lines || x.mentions)}</td></tr>`).join("")}</tbody></table>` : ""}
    ${c.songs?.length ? `<h2 class="lw-h2" id="lw-songs">Songs</h2><ul>${c.songs.map((x) => { const sg = d.songList.find((y) => y.title === x.title && y.work === x.work); return `<li>${sg ? `<a href="#lore/song/${sg.slug}">♪ ${esc(x.title)}</a>` : esc(x.title)} · <a href="${workHref(x.work)}" class="muted">${esc(d.work[x.work]?.title || "")}</a></li>`; }).join("")}</ul>` : ""}
    ${c.quotes?.length ? `<h2 class="lw-h2" id="lw-quotes">Quotes</h2>${c.quotes.slice(0, 12).map((q) => `<blockquote class="lw-quote">${esc(q.t)}<cite>${esc(d.work[q.w]?.title || "")}</cite></blockquote>`).join("")}` : ""}
    ${c.phrases?.length ? `<h2 class="lw-h2" id="lw-catchphrases">Catchphrases</h2><p class="muted">Phrases ${esc(name)} says most often, counted across every line.</p>${chips(c.phrases.map(([p, k]) => `<span class="lw-chip plain">“${esc(p)}” <small>×${k}</small></span>`))}` : ""}
    ${c.signature?.length ? `<h2 class="lw-h2" id="lw-signature-words">Signature words</h2><p class="muted">Words ${esc(name)} uses far more than anyone else in the series.</p>${chips(c.signature.map(([x, k]) => `<span class="lw-chip plain">${esc(x)} <small>×${k}</small></span>`))}` : ""}
    ${scenePartners(d, c)}
    ${related.length ? `<h2 class="lw-h2" id="lw-often-appears-with">Often appears with</h2>${chips(related.map((r) => charChip(d, r)))}` : ""}`;
  const side = infobox(name, first?.cover, [["Series", `<a href="#lore/s/${sid}">${esc(s.title)}</a>`], ["Species", esc(cur?.species || "")], ["Role", esc(cur?.role || "")], ["Affiliation", esc(cur?.affiliation || "")], ["Home", esc(cur?.home || "")], ["First appearance", first ? `<a href="${workHref(first.id)}">${esc(first.title)}</a>` : ""], ["Appearances", fmt(apps.length)], ["Spoken lines", c.lines ? fmt(c.lines) : ""], ["Songs", c.songs?.length ? fmt(c.songs.length) : ""], ["Swears", c.swears ? fmt(c.swears) : ""], ["Most scenes with", c.coScenes?.[0] && d.chars.get(sid + ":" + c.coScenes[0][0]) ? `<a href="${charHref(d.chars.get(sid + ":" + c.coScenes[0][0]))}">${esc(charName(d.chars.get(sid + ":" + c.coScenes[0][0])))}</a> (${c.coScenes[0][1]})` : ""]]);
  shell(view, [[s.title, "lore/s/" + sid], [name, location.hash.slice(1)]], body, side);
  wireToc(view);
}

// ---------- work (episode, book, story) ----------
function workPage(view, d, id) {
  const w = d.work[id]; if (!w) return homePage(view, d);
  const s = seriesOf(d, w.series), siblings = d.works.filter((x) => x.series === w.series).sort((a, b) => a.order - b.order), i = siblings.indexOf(w);
  const cast = (w.cast || []).map((x) => ({ ...x, c: d.chars.get(w.series + ":" + slug(x.name)) })).filter((x) => x.c && !NOISE.has(x.name));
  const body = `<h1 class="lw-title">${esc(w.title)}</h1><p class="lw-sub">${esc(w.label)}${w.label ? " · " : ""}<a href="#lore/s/${w.series}">${esc(s.title)}</a></p>
    <h2 class="lw-h2">Synopsis</h2><p>${esc(w.blurb || "No synopsis yet.")}</p>
    ${w.trivia?.opening ? `<h2 class="lw-h2">Opening</h2><blockquote class="lw-quote">${esc(w.trivia.opening)}</blockquote>` : ""}
    ${sceneGuide(d, w)}
    ${triviaBox(d, w)}
    ${cast.length ? `<h2 class="lw-h2">${w.cast[0]?.mentions ? "Characters" : "Cast"}</h2><table class="lw-table"><thead><tr><th>Character</th><th>${w.cast[0]?.mentions ? "Mentions" : "Lines"}</th></tr></thead><tbody>${cast.slice(0, 40).map((x) => `<tr><td><a href="${charHref(x.c)}">${x.c.cur ? "★ " : ""}${esc(charName(x.c))}</a></td><td><span class="lw-bar"><i style="width:${Math.min(100, (x.lines / cast[0].lines) * 100)}%"></i></span>${fmt(x.lines)}</td></tr>`).join("")}</tbody></table>` : ""}
    ${w.songs?.length ? `<h2 class="lw-h2">Songs</h2><ol>${w.songs.map((x) => { const sg = d.songList.find((y) => y.title === x.title && y.work === w.id); return `<li><a href="#lore/song/${sg?.slug}">♪ ${esc(x.title)}</a>${x.singers.length ? ` <span class="muted">· ${x.singers.slice(0, 6).map((n) => { const c = d.chars.get(w.series + ":" + slug(n)); return c ? `<a href="${charHref(c)}">${esc(charName(c))}</a>` : esc(pretty(n)); }).join(", ")}</span>` : ""}</li>`; }).join("")}</ol>` : ""}
    ${w.places?.length ? `<h2 class="lw-h2">Locations</h2>${chips(w.places.map((p) => `<span class="lw-chip plain">⌂ ${esc(p.name)} <small>${p.scenes}</small></span>`))}` : ""}
    ${w.chapters?.length ? `<h2 class="lw-h2">Chapters</h2><ol>${w.chapters.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
    <div class="lw-pager">${i > 0 ? `<a class="btn" href="${workHref(siblings[i - 1].id)}">← ${esc(siblings[i - 1].title)}</a>` : "<span></span>"}${i < siblings.length - 1 ? `<a class="btn" href="${workHref(siblings[i + 1].id)}">${esc(siblings[i + 1].title)} →</a>` : ""}</div>`;
  const side = infobox(w.title, w.cover, [["Series", `<a href="#lore/s/${w.series}">${esc(s.title)}</a>`], ["Format", esc(w.kind === "script" ? "Screenplay" : w.kind === "manga" ? "Illustrated manga" : "Prose")], ["Placement", esc(w.label || "")], ["Length", w.words ? `${fmt(w.words)} words` : ""], ["Reading time", w.minutes ? `About ${w.minutes} min` : ""], ["Scenes", w.scenes ? fmt(w.scenes) : ""], ["Songs", w.songs?.length ? fmt(w.songs.length) : ""], ["Speaking parts", w.cast?.length && !w.cast[0].mentions ? fmt(w.cast.filter((x) => !x.group).length) : ""], ["Read", `<a href="#books/free/${w.series === "kitsune" ? "" : w.series}">Open in Originals &amp; free</a>`]]);
  shell(view, [[s.title, "lore/s/" + w.series], [w.title, location.hash.slice(1)]], body, side);
}

// ---------- place / idea ----------
function conceptPage(view, d, sid, sl) {
  const c = d.concepts.find((x) => x.series === sid && x.slug === sl); if (!c) return seriesPage(view, d, sid);
  const s = seriesOf(d, sid), measured = d.placeList.find((p) => p.series === sid && slug(p.name) === sl);
  const body = `<h1 class="lw-title">${esc(c.title)}</h1><p class="lw-sub">${c.kind === "place" ? "Place" : "Concept"} · <a href="#lore/s/${sid}">${esc(s.title)}</a></p>${md(d, c.body)}
    ${measured ? `<h2 class="lw-h2">Appears in</h2><ul>${measured.works.map((id) => `<li><a href="${workHref(id)}">${esc(d.work[id]?.title || id)}</a></li>`).join("")}</ul>` : ""}
    <h2 class="lw-h2">More from ${esc(s.title)}</h2>${chips(d.concepts.filter((x) => x.series === sid && x !== c).map((x) => `<a class="lw-chip" href="#lore/p/${sid}/${x.slug}">${x.kind === "place" ? "⌂" : "✦"} ${esc(x.title)}</a>`))}`;
  shell(view, [[s.title, "lore/s/" + sid], [c.title, location.hash.slice(1)]], body, infobox(c.title, null, [["Series", `<a href="#lore/s/${sid}">${esc(s.title)}</a>`], ["Type", c.kind === "place" ? "Place" : "Concept"], ["Scenes set here", measured?.scenes ? fmt(measured.scenes) : ""]]));
}

// ---------- song ----------
function songPage(view, d, sl) {
  const sg = d.songList.find((x) => x.slug === sl); if (!sg) return categoryPage(view, d, "all", "songs");
  const w = d.work[sg.work], s = seriesOf(d, sg.series);
  const singers = sg.singers.map((n) => d.chars.get(sg.series + ":" + slug(n))).filter(Boolean);
  const siblings = d.songList.filter((x) => x.work === sg.work && x !== sg);
  const body = `<h1 class="lw-title">♪ ${esc(sg.title)}</h1><p class="lw-sub">A song from <a href="${workHref(sg.work)}">${esc(w?.title || "")}</a> · <a href="#lore/s/${sg.series}">${esc(s.title)}</a></p>
    <h2 class="lw-h2">Performed by</h2>${singers.length ? chips(singers.map((c) => charChip(d, c))) : `<p class="muted">The ensemble.</p>`}
    ${siblings.length ? `<h2 class="lw-h2">Other songs in this episode</h2>${chips(siblings.map((x) => `<a class="lw-chip" href="#lore/song/${x.slug}">♪ ${esc(x.title)}</a>`))}` : ""}
    <p class="lw-note">Lyrics are in the script itself. Open the episode to read them in context.</p>`;
  shell(view, [[s.title, "lore/s/" + sg.series], ["♪ " + sg.title, location.hash.slice(1)]], body, infobox(sg.title, w?.cover, [["Episode", `<a href="${workHref(sg.work)}">${esc(w?.title || "")}</a>`], ["Singers", fmt(singers.length) || "Ensemble"]]));
}

// ---------- categories and search ----------
function categoryPage(view, d, sid, what) {
  const inS = (x) => sid === "all" || x.series === sid, s = seriesOf(d, sid), title = { characters: "Characters", works: "Episodes and books", places: "Places and ideas", songs: "Songs" }[what] || "Articles";
  let body = `<h1 class="lw-title">${esc(title)}${s ? ` · ${esc(s.title)}` : ""}</h1>`;
  if (what === "characters") body += `<input class="field" id="lw-filter" placeholder="Filter…"><div class="lw-grid" id="lw-list">${d.charList.filter(inS).map((c) => `<a class="lw-card" href="${charHref(c)}" data-n="${esc(charName(c).toLowerCase())}"><strong>${c.cur ? "★ " : ""}${esc(charName(c))}</strong><small>${esc(c.cur?.role || (c.lines ? fmt(c.lines) + " lines" : fmt(c.mentions) + " mentions"))} · ${fmt((c.works || []).length)} works</small></a>`).join("")}</div>`;
  if (what === "works") body += `<div class="lw-grid">${d.works.filter(inS).sort((a, b) => a.order - b.order).map((w) => `<a class="lw-card" href="${workHref(w.id)}"><img src="${esc(w.cover || "")}" alt="" loading="lazy"><strong>${esc(w.title)}</strong><small>${esc(w.label)} · ${fmt(w.words)} words</small></a>`).join("")}</div>`;
  if (what === "places") body += `${chips(d.concepts.filter(inS).map((c) => `<a class="lw-chip" href="#lore/p/${c.series}/${c.slug}">${c.kind === "place" ? "⌂" : "✦"} ${esc(c.title)}</a>`))}<h2 class="lw-h2">Every location</h2><table class="lw-table"><thead><tr><th>Place</th><th>Scenes</th><th>Works</th></tr></thead><tbody>${d.placeList.filter(inS).map((p) => `<tr><td>${esc(p.name)}</td><td>${fmt(p.scenes || p.mentions)}</td><td>${p.works.slice(0, 6).map((id) => `<a href="${workHref(id)}">${esc(d.work[id]?.title || "")}</a>`).join(", ")}</td></tr>`).join("")}</tbody></table>`;
  if (what === "songs") body += `<table class="lw-table"><thead><tr><th>Song</th><th>Episode</th><th>Sung by</th></tr></thead><tbody>${d.songList.filter(inS).map((x) => `<tr><td><a href="#lore/song/${x.slug}">♪ ${esc(x.title)}</a></td><td><a href="${workHref(x.work)}">${esc(d.work[x.work]?.title || "")}</a></td><td>${esc(x.singers.slice(0, 4).map(pretty).join(", ") || "Ensemble")}</td></tr>`).join("")}</tbody></table>`;
  shell(view, [...(s ? [[s.title, "lore/s/" + sid]] : []), [title, location.hash.slice(1)]], body);
  $("#lw-filter", view)?.addEventListener("input", (e) => { const q = e.target.value.toLowerCase(); $$("#lw-list [data-n]", view).forEach((x) => (x.hidden = !x.dataset.n.includes(q))); });
}
function searchPage(view, d, q) {
  const t = q.toLowerCase(), hit = (s) => (s || "").toLowerCase().includes(t);
  const res = [
    ...d.charList.filter((c) => hit(charName(c)) || (c.cur?.aka || []).some(hit)).map((c) => ({ href: charHref(c), title: charName(c), sub: "Character · " + seriesOf(d, c.series)?.title })),
    ...d.works.filter((w) => hit(w.title) || hit(w.blurb)).map((w) => ({ href: workHref(w.id), title: w.title, sub: (w.label || "Work") + " · " + seriesOf(d, w.series)?.title })),
    ...d.songList.filter((x) => hit(x.title)).map((x) => ({ href: "#lore/song/" + x.slug, title: "♪ " + x.title, sub: "Song · " + (d.work[x.work]?.title || "") })),
    ...d.concepts.filter((c) => hit(c.title) || hit(c.body)).map((c) => ({ href: `#lore/p/${c.series}/${c.slug}`, title: c.title, sub: (c.kind === "place" ? "Place" : "Concept") + " · " + seriesOf(d, c.series)?.title })),
  ];
  const body = `<h1 class="lw-title">Search: ${esc(q)}</h1><p class="muted">${fmt(res.length)} result${res.length === 1 ? "" : "s"}.</p><div class="lw-results">${res.slice(0, 200).map((r) => `<a href="${r.href}"><strong>${esc(r.title)}</strong><small>${esc(r.sub)}</small></a>`).join("") || `<p>No articles match. Try a character's first name.</p>`}</div>`;
  shell(view, [["Search", location.hash.slice(1)]], body);
  $("#lw-q", view).value = q;
}
function wireToc(view) { view.addEventListener("click", (e) => { const j = e.target.closest("[data-jump]"); if (!j) return; e.preventDefault(); $("#lw-" + j.dataset.jump, view)?.scrollIntoView({ behavior: "smooth", block: "start" }); }); }

// ---------- v102: scene guides, trivia, scene partners, statistics ----------
function sceneGuide(d, w) {
  const list = w.sceneList || []; if (!list.length) return "";
  const acts = []; for (const x of list) { const a = x.a || "Opening"; if (!acts.length || acts[acts.length - 1].a !== a) acts.push({ a, scenes: [] }); acts[acts.length - 1].scenes.push(x); }
  const who = (names) => names.map((n) => d.chars.get(w.series + ":" + slug(n))).filter(Boolean).map((c) => `<a href="${charHref(c)}">${esc(charName(c))}</a>`).join(", ");
  return `<h2 class="lw-h2">Scene by scene</h2><p class="muted">${fmt(list.length)} scenes across ${fmt(acts.length)} parts. Open a part to see where each scene is set, who speaks, and how it opens.</p>
    ${acts.map((g, i) => `<details class="lw-act" ${i === 0 ? "open" : ""}><summary><strong>${esc(pretty(g.a))}</strong> <span class="muted">· ${g.scenes.length} scene${g.scenes.length === 1 ? "" : "s"}</span></summary><ol class="lw-scenes">${g.scenes.map((x) => `<li><span class="lw-scene-h">${esc(pretty(x.h))}</span>${x.f ? `<p>${esc(x.f)}</p>` : ""}<small>${who(x.who) || "No speaking parts"}${x.s?.length ? ` · ♪ ${x.s.map(esc).join(", ")}` : ""}${x.n ? ` · ${x.n} lines` : ""}</small></li>`).join("")}</ol></details>`).join("")}`;
}
function triviaBox(d, w) {
  const t = w.trivia || {}, items = [];
  const top = (w.cast || []).find((x) => !x.group && !x.mentions && d.chars.get(w.series + ":" + slug(x.name)));
  if (top) { const c = d.chars.get(w.series + ":" + slug(top.name)); items.push(`<a href="${charHref(c)}">${esc(charName(c))}</a> has the most lines (${fmt(top.lines)}).`); }
  if (w.scenes) items.push(`${fmt(w.scenes)} scenes${w.songs?.length ? ` and ${fmt(w.songs.length)} song${w.songs.length === 1 ? "" : "s"}` : ""}.`);
  if (t.swears) items.push(`The word “fuck” and its relatives appear ${fmt(t.swears)} times.`);
  if (t.dialogue) items.push(`${fmt(t.dialogue)} quoted lines of dialogue.`);
  if (w.words) items.push(`${fmt(w.words)} words, about ${w.minutes} minutes to read.`);
  if (t.longest?.t && t.longest.t.length > 120) { const c = d.chars.get(w.series + ":" + slug(t.longest.n)); items.push(`The longest single speech belongs to ${c ? `<a href="${charHref(c)}">${esc(charName(c))}</a>` : esc(pretty(t.longest.n))}: <em>“${esc(t.longest.t.slice(0, 260))}${t.longest.t.length > 260 ? "…" : ""}”</em>`); }
  return items.length ? `<h2 class="lw-h2">Trivia</h2><ul class="lw-trivia">${items.map((x) => `<li>${x}</li>`).join("")}</ul>` : "";
}
function scenePartners(d, c) {
  const list = (c.coScenes || []).map(([sl, k]) => [d.chars.get(c.series + ":" + sl), k]).filter(([o]) => o).slice(0, 10); if (!list.length) return "";
  const max = list[0][1];
  return `<h2 class="lw-h2" id="lw-scene-partners">Scene partners</h2><p class="muted">Who shares the most scenes with ${esc(charName(c))}.</p><table class="lw-table"><tbody>${list.map(([o, k]) => `<tr><td><a href="${charHref(o)}">${o.cur ? "★ " : ""}${esc(charName(o))}</a></td><td><span class="lw-bar"><i style="width:${(k / max) * 100}%"></i></span>${fmt(k)} scenes</td></tr>`).join("")}</tbody></table>`;
}
function statsPage(view, d) {
  const board = (title, rows, unit) => `<div class="lw-board"><h3>${esc(title)}</h3><ol>${rows.map(([href, label, v, sub]) => `<li><a href="${href}">${esc(label)}</a>${sub ? ` <small class="muted">${esc(sub)}</small>` : ""}<span>${fmt(v)} ${esc(unit)}</span></li>`).join("")}</ol></div>`;
  const ch = d.charList.filter((c) => c.lines);
  const sname = (sid) => seriesOf(d, sid)?.title || "";
  const body = `<h1 class="lw-title">Statistics</h1><p class="lw-sub">Measured from the texts of every Original.</p>
    <div class="lw-boards">
    ${board("Most lines", ch.slice().sort((a, b) => b.lines - a.lines).slice(0, 15).map((c) => [charHref(c), charName(c), c.lines, sname(c.series)]), "lines")}
    ${board("Most appearances", d.charList.slice().sort((a, b) => (b.works || []).length - (a.works || []).length).slice(0, 15).map((c) => [charHref(c), charName(c), (c.works || []).length, sname(c.series)]), "works")}
    ${board("Most songs sung", d.charList.filter((c) => c.songs?.length).sort((a, b) => b.songs.length - a.songs.length).slice(0, 15).map((c) => [charHref(c), charName(c), c.songs.length, sname(c.series)]), "songs")}
    ${board("Most profane", ch.filter((c) => c.swears).sort((a, b) => b.swears - a.swears).slice(0, 15).map((c) => [charHref(c), charName(c), c.swears, sname(c.series)]), "")}
    ${board("Longest works", d.works.slice().sort((a, b) => b.words - a.words).slice(0, 15).map((w) => [workHref(w.id), w.title, w.words, sname(w.series)]), "words")}
    ${board("Most scenes", d.works.filter((w) => w.scenes).sort((a, b) => b.scenes - a.scenes).slice(0, 15).map((w) => [workHref(w.id), w.title, w.scenes, sname(w.series)]), "scenes")}
    ${board("Busiest locations", d.placeList.filter((p) => p.scenes).sort((a, b) => b.scenes - a.scenes).slice(0, 15).map((p) => ["#lore/cat/" + p.series + "/places", p.name, p.scenes, sname(p.series)]), "scenes")}
    ${board("Series by length", d.series.map((x) => ["#lore/s/" + x.id, x.title, x.words, fmt(x.works) + " works"]), "words")}
    </div>`;
  shell(view, [["Statistics", "lore/stats"]], body);
}
