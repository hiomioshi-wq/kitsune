// Kitsune Browser: a reading-first web browser built into the app.
// Pages are fetched by Kitsune's server and drawn by Kitsune itself: real layout and styles inside a sealed
// shadow root, with every script removed, links kept in the browser, and GET forms working. Reader mode turns any
// article into a clean page, any ebook link can go straight into your library, and any site can be searched:
// Kitsune reads a site's OpenSearch description, or its own search form, and remembers how to search it.
import { $, $$, esc, icon, toast, api, modal, uid, plural, debounce } from "../util.js";
import { kvGet, kvSet, saveItem, settings } from "../store.js";
import { setCrumbs } from "../main.js";
import { isKids } from "../profiles.js";
import * as E from "../embeds.js";
import * as US from "../userscripts.js";
import * as WP4 from "../webplus4.js";
import * as WC from "../webcompat.js";
import * as WC2 from "../webcompat2.js";
import * as WPG from "../webpages.js";
import * as WCODE from "../webcode.js";
import * as WP9 from "../webplus9.js";
import * as WCache from "../webcache.js";
import * as WProg from "../webprog.js";
import * as WA from "../webadapters.js";
// Menu-only tools load in the background after the first page is up, so the Browser opens with far fewer files to read first.
const LZ = {}; let _lz = null;
const lazyMods = () => (_lz ||= Promise.all([import("../webplus.js"), import("../webplus2.js"), import("../webplus3.js"), import("../webplus5.js"), import("../webplus6.js"), import("../webplus7.js"), import("../webplus8.js"), import("../webcode2.js"), import("../weblisten.js"), import("../webplus10.js"), import("../webplus11.js"), import("../webplus12.js"), import("../webplus13.js"), import("../webplus14.js"), import("../webplus15.js"), import("../webplus16.js"), import("../webplus17.js"), import("../webplus18.js"), import("../webplus19.js"), import("../webplus20.js"), import("../webplus21.js"), import("../webplus22.js"), import("../webplus23.js"), import("../webplus24.js"), import("../webplus25.js"), import("../webplus26.js")]).then(([a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r2, s2, t2, u2, v2, w2, x2, y2, z2]) => { Object.assign(LZ, { WP: a, WP2: b, WP3: c, WP5: d, WP6: e, WP7: f, WP8: g, WCODE2: h, WL: i, WP10: j, WP11: k, WP12: l, WP13: m, WP14: n, WP15: o, WP16: p, WP17: q, WP18: r2, WP19: s2, WP20: t2, WP21: u2, WP22: v2, WP23: w2, WP24: x2, WP25: y2, WP26: z2 }); }));
const li = (k, arg) => (LZ[k] ? LZ[k].items(arg) : []);
let _pg; const pg = () => (_pg ||= WPG.items({ T, root: () => contentRoot(), scroller: () => scrollerNow(), go, B, host, translate: () => translateDialog() }));
const wp4ctx = () => ({ T, root: () => contentRoot(), host, go, B, setMode: (m) => { const t = T(); t.mode = m; syncBar(); if (t.data) paint(t); else go(t.url, { push: false }); }, paint });

export const ENGINES = {
  marginalia: { name: "Marginalia", template: "https://search.marginalia.nu/search?query={q}", blurb: "Independent search that favours small, text-heavy sites." },
  ddg: { name: "DuckDuckGo", template: "https://html.duckduckgo.com/html/?q={q}", blurb: "Private web search, the version made for simple browsers." },
  mojeek: { name: "Mojeek", template: "https://www.mojeek.com/search?q={q}", blurb: "Its own index of the web, no tracking." },
  wikipedia: { name: "Wikipedia", template: "https://en.wikipedia.org/w/index.php?search={q}", blurb: "The free encyclopedia." },
  brave: { name: "Brave Search", template: "https://search.brave.com/search?q={q}", blurb: "An independent index, no tracking." },
  bing: { name: "Bing", template: "https://www.bing.com/search?q={q}", blurb: "Microsoft’s web search." },
  qwant: { name: "Qwant", template: "https://lite.qwant.com/?q={q}", blurb: "European, private web search." },
  baidu: { name: "Baidu 百度", template: "https://www.baidu.com/s?wd={q}", blurb: "Search in Chinese." },
  sogou: { name: "Sogou 搜狗", template: "https://www.sogou.com/web?query={q}", blurb: "Search in Chinese." },
  naver: { name: "Naver 네이버", template: "https://search.naver.com/search.naver?query={q}", blurb: "Search in Korean." },
  yahoojp: { name: "Yahoo! JAPAN", template: "https://search.yahoo.co.jp/search?p={q}", blurb: "Search in Japanese." },
  seznam: { name: "Seznam", template: "https://search.seznam.cz/?q={q}", blurb: "Search in Czech." },
  wja: { name: "Wikipedia 日本語", template: "https://ja.wikipedia.org/w/index.php?search={q}", blurb: "Japanese Wikipedia." },
  wzh: { name: "Wikipedia 中文", template: "https://zh.wikipedia.org/w/index.php?search={q}", blurb: "Chinese Wikipedia." },
  wko: { name: "Wikipedia 한국어", template: "https://ko.wikipedia.org/w/index.php?search={q}", blurb: "Korean Wikipedia." },
  wde: { name: "Wikipedia Deutsch", template: "https://de.wikipedia.org/w/index.php?search={q}", blurb: "German Wikipedia." },
  wfr: { name: "Wikipédia français", template: "https://fr.wikipedia.org/w/index.php?search={q}", blurb: "French Wikipedia." },
  wes: { name: "Wikipedia español", template: "https://es.wikipedia.org/w/index.php?search={q}", blurb: "Spanish Wikipedia." },
  wru: { name: "Википедия", template: "https://ru.wikipedia.org/w/index.php?search={q}", blurb: "Russian Wikipedia." },
  war: { name: "ويكيبيديا", template: "https://ar.wikipedia.org/w/index.php?search={q}", blurb: "Arabic Wikipedia." },
  wiktionary: { name: "Wiktionary", template: "https://en.wiktionary.org/w/index.php?search={q}", blurb: "The free dictionary, every language." },
};
const DIAL = [
  ["Wikipedia", "https://en.wikipedia.org/wiki/Main_Page", 210], ["Standard Ebooks", "https://standardebooks.org/ebooks", 25], ["Wikisource", "https://en.wikisource.org/wiki/Main_Page", 200],
  ["Hacker News", "https://news.ycombinator.com/", 25], ["Marginalia", "https://search.marginalia.nu/", 150], ["Internet Archive", "https://archive.org/", 0],
  ["xkcd", "https://xkcd.com/", 220], ["Pepper&Carrot", "https://www.peppercarrot.com/", 30], ["Public Domain Review", "https://publicdomainreview.org/", 340],
  ["Smithsonian Magazine", "https://www.smithsonianmag.com/", 200], ["Aeon", "https://aeon.co/", 0], ["The Marginalian", "https://www.themarginalian.org/", 30],
];
const KIDS_HOSTS = /(^|\.)(wikipedia\.org|wikisource\.org|standardebooks\.org|gutenberg\.org|peppercarrot\.com|kids\.britannica\.com|nasa\.gov|natgeokids\.com)$/;
const B = { tabs: [], active: 0, view: null };

// ---------- storage ----------
const store = { engines: () => kvGet("webEngines", {}), history: () => kvGet("webHistory", []), marks: () => kvGet("webBookmarks", []) };
async function remember(url, title) {
  if (settings.incognito) return;
  const h = ((await store.history()) || []).filter((x) => x.url !== url);
  h.unshift({ url, title, t: Date.now() });
  kvSet("webHistory", h.slice(0, 400));
}
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const favicon = (u) => { try { return new URL("/favicon.ico", u).href; } catch { return ""; } };
const defaultEngine = () => ENGINES[localStorage.getItem("kitsune.webEngine")] ? localStorage.getItem("kitsune.webEngine") : "marginalia";

// ---------- address bar: URL, keyword search, site search, or web search ----------
async function resolveInput(raw) {
  let s = raw.trim(); if (!s) return null;
  s = s.replace(/^(https?)：\/\//i, "$1://");
  if (/^https?:\/\//i.test(s)) return s;
  // same-app pages (the compat suite, originals, anything Kitsune itself serves) open here, not on a search engine
  if (s.startsWith("/") && !s.startsWith("//")) { try { return new URL(s, location.origin).href; } catch {} }
  const dotted = s.replace(/[。．｡]/g, ".");
  if (/^[\p{L}\p{N}_-]+(\.[\p{L}\p{N}_-]+)+(:\d+)?(\/\S*)?$/u.test(dotted) && !/\s/.test(dotted) && /\.[\p{L}]{2,}(?::\d+)?(\/|$)/u.test(dotted)) { try { return new URL("https://" + dotted).href; } catch {} }
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(s) && !/\s/.test(s)) return "https://" + s;
  const engines = (await store.engines()) || {};
  // "@site words" or "words @site": search that one site
  let site = null, q = s;
  const m1 = s.match(/^@(\S+)\s+(.+)$/), m2 = s.match(/^(.+?)\s+@(\S+)$/);
  if (m1) { site = m1[1]; q = m1[2]; } else if (m2) { site = m2[2]; q = m2[1]; }
  if (site) return siteSearchUrl(site.replace(/^https?:\/\//, "").replace(/\/.*$/, ""), q);
  // a keyword for a site you've searched before: "se dickens"
  const [kw, ...rest] = s.split(/\s+/);
  const byKw = Object.values(engines).find((e) => e.keyword === kw.toLowerCase());
  if (byKw && rest.length) return fill(byKw.template, rest.join(" "));
  if (ENGINES[kw.toLowerCase()] && rest.length) return fill(ENGINES[kw.toLowerCase()].template, rest.join(" "));
  return fill(ENGINES[defaultEngine()].template, s);
}
const fill = (t, q) => t.replace(/\{q\}|\{searchTerms\}/g, encodeURIComponent(q)).replace(/\{[\w:]+\?\}/g, "").replace(/\{startPage\}|\{startIndex\}/g, "1").replace(/\{count\}/g, "20").replace(/\{language\}/g, "en").replace(/\{(input|output)Encoding\}/g, "UTF-8");
// Kitsune's own pages (the compat suite, originals, anything the app serves) open in this tab, fetched directly.
const isLocalUrl = (u) => { try { return new URL(u, location.origin).hostname === location.hostname; } catch { return false; } };

// Learn how to search a site: its OpenSearch description first (the open standard sites publish for exactly this),
// then its own search form, and failing both, a web search limited to that site.
async function learnSearch(siteHost, doc = null, pageUrl = null) {
  const engines = { ...((await store.engines()) || {}) };
  const key = siteHost.replace(/^www\./, "");
  if (engines[key]) return engines[key];
  let d = doc, base = pageUrl;
  if (!d) {
    try { const r = await api("browse?url=" + encodeURIComponent("https://" + siteHost + "/")); if (r.html) { d = new DOMParser().parseFromString(r.html, "text/html"); base = r.url; } } catch { return null; }
  }
  if (!d) return null;
  let found = null;
  const os = d.querySelector('link[rel~="search"][type*="opensearchdescription"][href]');
  if (os) {
    try {
      const r = await api("browse?url=" + encodeURIComponent(new URL(os.getAttribute("href"), base).href));
      const x = new DOMParser().parseFromString(r.text || r.html || "", "application/xml");
      const urlEl = [...x.getElementsByTagName("Url")].find((u) => /html/.test(u.getAttribute("type") || "")) || x.getElementsByTagName("Url")[0];
      const tpl = urlEl?.getAttribute("template");
      if (tpl && /\{searchTerms\}/.test(tpl)) {
        // fill the optional parts now, so only the search words are left to put in
        const t0 = tpl.replace(/\{searchTerms\}/g, "__Q__").replace(/\{[\w:]+\?\}/g, "").replace(/\{startPage\}|\{startIndex\}/g, "1").replace(/\{count\}/g, "20").replace(/\{language\}/g, "en").replace(/\{(input|output)Encoding\}/g, "UTF-8");
        found = { name: (x.getElementsByTagName("ShortName")[0]?.textContent || os.getAttribute("title") || key).trim(), template: new URL(t0, base).href.replace("__Q__", "{q}"), kind: "OpenSearch" };
      }
    } catch {}
  }
  if (!found) {
    const NAMES = ["q", "s", "query", "search", "term", "keywords", "search_query", "k", "text", "searchTerm", "searchword"];
    for (const f of d.querySelectorAll("form")) {
      if ((f.getAttribute("method") || "get").toLowerCase() !== "get") continue;
      const input = f.querySelector('input[type="search"][name]') || [...f.querySelectorAll("input[name]")].find((i) => NAMES.includes(i.name) && (!i.type || /text|search/.test(i.type)));
      if (!input) continue;
      const action = new URL(f.getAttribute("action") || base, base);
      const params = new URLSearchParams();
      f.querySelectorAll('input[type="hidden"][name]').forEach((h) => params.set(h.name, h.value));
      params.set(input.name, "__Q__");
      action.search = params.toString();
      found = { name: d.title?.split(/[|·–—-]/)[0].trim() || key, template: action.href.replace("__Q__", "{q}"), kind: "search form" };
      break;
    }
  }
  if (!found) return null;
  // the keyword is the site's own name: "wikipedia" for en.wikipedia.org, "bbc" for bbc.co.uk
  const labels = key.split("."), sld = labels.length > 2 && /^(co|com|org|net|ac|gov|edu)$/.test(labels.at(-2)) ? labels.at(-3) : labels.at(-2) || labels[0];
  found.keyword = sld.slice(0, 16).toLowerCase();
  if (Object.values(engines).some((e) => e.keyword === found.keyword)) found.keyword = key.replace(/\./g, "").slice(0, 14).toLowerCase();
  found.host = key; found.icon = favicon("https://" + siteHost); found.learned = Date.now();
  engines[key] = found;
  await kvSet("webEngines", engines);
  return found;
}
async function siteSearchUrl(siteHost, q) {
  const e = await learnSearch(siteHost).catch(() => null);
  if (e) return fill(e.template, q);
  return fill(ENGINES[defaultEngine() === "wikipedia" ? "ddg" : defaultEngine()].template, `site:${siteHost.replace(/^www\./, "")} ${q}`);
}

// ---------- the view ----------
export async function render(view, _n, params = []) {
  setCrumbs([["Browser", "web"]]);
  if (!settings.incognito) await WCache.restore();
  B.view = view;
  if (!B.tabs.length) {
    const saved = (await kvGet("webTabs", null)) || null;
    B.tabs = saved?.tabs?.length ? saved.tabs.map((t) => Object.assign(newTab(t.url), { pinned: !!t.pinned, color: t.color || "", custom: t.custom || "" })) : [newTab(null)];
    B.active = Math.min(saved?.active || 0, B.tabs.length - 1);
  }
  const want = params.length ? decodeURIComponent(params.join("/")) : null;
  view.innerHTML = `
    <div class="kb" id="kb">
      <div class="kb-tabs" id="kb-tabs" role="tablist" aria-label="Tabs"></div>
      <div class="kb-bar">
        <button class="icon-btn" type="button" data-b="back" aria-label="Back" title="Back (Alt ←)">${icon("back")}</button>
        <button class="icon-btn" type="button" data-b="fwd" aria-label="Forward" title="Forward (Alt →)">${icon("next")}</button>
        <button class="icon-btn" type="button" data-b="reload" aria-label="Reload" title="Reload">${svgReload}</button>
        <form class="kb-addr" id="kb-addr" role="search"><span class="kb-lock" id="kb-lock" aria-hidden="true"></span>
          <input id="kb-url" type="text" inputmode="url" autocomplete="off" spellcheck="false" aria-label="Address or search" placeholder="Search, type an address, or “words @site.com” to search one site">
          <div class="kb-sugg" id="kb-sugg" role="listbox" hidden></div></form>
        <button class="icon-btn" type="button" data-b="sitesearch" id="kb-ss" aria-label="Search this site" title="Search this site (⌘⇧F)">${icon("search")}</button>
        <div class="seg kb-mode" id="kb-mode"><button type="button" data-mode="page" aria-pressed="true">Page</button><button type="button" data-mode="reader" aria-pressed="false">${icon("book")}Reader</button><button type="button" data-mode="live" aria-pressed="false" title="Run the page's JavaScript in a sealed sandbox">Live</button></div>
        <button class="icon-btn kb-usbtn" type="button" data-b="userscripts" id="kb-us" aria-label="Userscripts" title="Userscripts and styles"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M9 4.5a2 2 0 1 1 4 0V6h3.5A1.5 1.5 0 0 1 18 7.5V11h1.5a2 2 0 1 1 0 4H18v3.5a1.5 1.5 0 0 1-1.5 1.5H13v-1.5a2 2 0 1 0-4 0V20H5.5A1.5 1.5 0 0 1 4 18.5V15h1.5a2 2 0 1 0 0-4H4V7.5A1.5 1.5 0 0 1 5.5 6H9z"/></svg><span id="kb-us-n"></span></button>
        <button class="icon-btn kb-followbtn" type="button" data-b="follow" id="kb-follow" aria-label="Follow this site" title="Follow this site's new articles" hidden><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 11a8 8 0 0 1 8 8"/><path d="M5 5a14 14 0 0 1 14 14"/><circle cx="6" cy="18" r="1.4" fill="currentColor"/></svg><span>Follow</span></button>
        <button class="icon-btn kb-shieldbtn" type="button" data-b="shield" id="kb-shield" aria-label="Privacy shield" title="Privacy shield" hidden><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.6" stroke-linecap="round"/></svg><span id="kb-shield-n"></span></button>
        <button class="icon-btn kb-mediabtn" type="button" data-b="media" id="kb-media" aria-label="Media on this page" title="Videos, music and pictures on this page" hidden>${icon("play")}<span id="kb-media-n"></span></button>
        <button class="icon-btn" type="button" data-b="mark" id="kb-mark" aria-label="Bookmark" title="Bookmark">${icon("star")}</button>
        <button class="icon-btn sm-hide" type="button" data-b="focus" aria-label="Focus mode" title="Focus mode: the browser fills the screen (Esc to leave)">${icon("expand")}</button>
        <button class="icon-btn" type="button" data-b="menu" id="kb-menu" aria-label="More" title="More">${icon("more")}</button>
      </div>
      <div class="kb-prog" id="kb-prog"><i></i></div>
      <div class="kb-body" id="kb-body"></div>
    </div>`;
  wire(view);
  try { WP9.init({ B, go }); } catch {}
  (window.requestIdleCallback || ((f) => setTimeout(f, 1200)))(() => lazyMods().then(() => { try { menuItems(); } catch {} }).catch(() => {}));
  drawTabs();
  if (want) { B.active = B.tabs.length; B.tabs.push(newTab(null)); drawTabs(); go(want); }
  else showTab();
}
const svgReload = `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/></svg>`;

function newTab(url) { return { id: uid("t-"), url: url || null, title: url ? host(url) : "New tab", hist: url ? [url] : [], idx: url ? 0 : -1, mode: "page", data: null, scroll: 0, zoom: 1 }; }
const T = () => B.tabs[B.active];
function persistTabs() { if (!settings.incognito) kvSet("webTabs", { tabs: B.tabs.filter((t) => t.url).map((t) => ({ url: t.url, pinned: !!t.pinned, ...(t.color ? { color: t.color } : {}), ...(t.custom ? { custom: t.custom } : {}) })), active: B.active }); }
function togglePin(i) {
  const t = B.tabs[i]; if (!t?.url) return;
  const cur = T(); t.pinned = !t.pinned;
  B.tabs.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  B.active = B.tabs.indexOf(cur); persistTabs(); drawTabs();
  toast(t.pinned ? "Pinned. It stays at the front and comes back next time." : "Unpinned.");
}

function drawTabs() {
  const el = $("#kb-tabs", B.view); if (!el) return;
  el.innerHTML = B.tabs.map((t, i) => `<div draggable="true" class="kb-tab ${i === B.active ? "on" : ""} ${t.pinned ? "pinned" : ""}" ${t.color ? `style="--tabc:${TAB_COLORS[t.color] || "transparent"}" data-color="${t.color}"` : ""} role="tab" aria-selected="${i === B.active}" data-tab="${i}" title="${esc(t.custom || t.title)}">
      ${t.url ? `<img src="${esc(favicon(t.url))}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'${esc(host(t.url)[0] || "·").toUpperCase()}'}))">` : `<b>+</b>`}
      <span>${esc(t.custom || t.title || "New tab")}</span><button type="button" class="kb-x" data-close="${i}" aria-label="Close tab">×</button></div>`).join("")
    + `<button class="kb-newtab" type="button" data-b="newtab" aria-label="New tab" title="New tab (⌘T)">${icon("plus")}</button>`;
}

// A background tab keeps its page text but lets go of the big parsed copy of it. It comes back on demand, so nothing is lost.
function discardDoc(t) {
  if (!t.doc || !t.data?.html || Object.getOwnPropertyDescriptor(t, "doc")?.get) return;
  const keep = (v) => Object.defineProperty(t, "doc", { value: v, writable: true, configurable: true, enumerable: true });
  Object.defineProperty(t, "doc", { configurable: true, enumerable: true, get() { const d = new DOMParser().parseFromString(t.data.html, "text/html"); keep(d); return d; }, set(v) { keep(v); } });
}
let _sweep = null;
function sweepTabs() {
  if (_sweep) return; _sweep = setInterval(() => {
    if (!B.view?.isConnected) { clearInterval(_sweep); _sweep = null; return; }
    const now = Date.now(); B.tabs.forEach((x, i) => { if (i !== B.active && x.lastActive && now - x.lastActive > 90_000) discardDoc(x); });
  }, 45_000);
}
async function showTab() {
  const t = T(); t.lastActive = Date.now(); sweepTabs(); drawTabs();
  $("#kb-url", B.view).value = t.url || "";
  syncBar();
  if (!t.url) return startPage();
  if (t.data) return paint(t);
  go(t.url, { push: false });
}
function syncBar() {
  const t = T(), v = B.view;
  $("[data-b=back]", v).disabled = t.idx <= 0;
  $("[data-b=fwd]", v).disabled = t.idx >= t.hist.length - 1;
  $$("#kb-mode [data-mode]", v).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === t.mode)));
  $("#kb-lock", v).className = "kb-lock " + (t.url?.startsWith("https:") ? "secure" : t.url ? "plain" : "");
  store.marks().then((m) => $("#kb-mark", v)?.setAttribute("aria-pressed", String((m || []).some((x) => x.url === t.url))));
}
const progress = (on) => B.view && $("#kb-prog", B.view).classList.toggle("on", on);

// ---------- navigation ----------
let navSeq = 0;
async function go(input, { push = true, newTab: inNew = false, fresh = false } = {}) {
  if (typeof input === "string" && input.trim().startsWith(">")) return commandPalette(input.trim().slice(1).trim(), true);
  let url = await resolveInput(input);
  if (!url) return;
  { const rw = WC.rewriteUrl(url); if (rw.url !== url) { url = rw.url; if (rw.note) toast(rw.note, { ms: 2600 }); } }
  if (isKids() && !isLocalUrl(url) && !KIDS_HOSTS.test(host(url))) return toast("In a kids profile, the browser opens only a few hand-picked sites.");
  if (isBlocked(url)) return blockedPage(url, inNew);
  if (localStorage.getItem("kitsune.webReuseTab") === "1" && push) {
    const strip = (u) => String(u || "").replace(/#.*$/, ""), have = B.tabs.findIndex((x, i) => x.url && strip(x.url) === strip(url) && (inNew || i !== B.active));
    if (have >= 0 && (inNew || B.tabs[B.active].url)) { B.active = have; showTab(); toast("That page is already open, so here's its tab.", { ms: 2500 }); return; }
  }
  if (inNew) { B.tabs.splice(B.active + 1, 0, newTab(null)); B.active++; }
  const t = T(), my = ++navSeq;
  if (push) { t.hist = t.hist.slice(0, t.idx + 1); t.hist.push(url); t.idx = t.hist.length - 1; }
  t.url = url; t.title = host(url); t.data = null; t.scroll = 0; t.paintRetried = false; t.mediaCount = 0; t.feed = null; t.usMenus = []; t.usRunning = 0; t.netlog = []; t.errlog = []; t.readerTried = false;
  { const fb = B.view && $("#kb-follow", B.view); if (fb) fb.hidden = true; }
  stopSay(); stopAuto(); $("#kb-outline", B.view)?.remove(); $("#kb-pager", B.view)?.remove(); { const sb = B.view && $("#kb-shield", B.view); if (sb) sb.hidden = true; }
  E.hideTip(); { const mb = B.view && $("#kb-media", B.view); if (mb) mb.hidden = true; }
  $("#kb-url", B.view).value = url; drawTabs(); syncBar(); progress(true);
  const body = $("#kb-body", B.view);
  if (!body.querySelector(".kb-page, .kb-reader")) body.innerHTML = `<div class="kb-loading"><span class="kb-spin"></span>Loading ${esc(host(url))}…</div>`;
  let r;
  const localFetch = async () => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ctype = res.headers.get("content-type") || "", text = await res.text();
    if (/html/i.test(ctype)) return { url, ctype, html: text };
    if (/^image\//i.test(ctype)) return { url, ctype, html: `<!doctype html><title>${esc(decodeURIComponent(url.split("/").pop()))}</title><body style="margin:0;background:#111;display:grid;place-items:center;min-height:100vh"><img src="${esc(url)}" style="max-width:96vw;max-height:96vh"></body>` };
    const kind = /json/i.test(ctype) && !/geo\+json/i.test(ctype) ? "json" : /xml/i.test(ctype) && !/svg/i.test(ctype) ? "xml" : "text";
    return { url, ctype, kind, text: text.slice(0, 4_000_000) };
  };
  const fetchPage = async () => isLocalUrl(url) ? localFetch() : api("browse?url=" + encodeURIComponent(url), { headers: { ...(await cookieHeaders(url)), ...(mobileFor(url) ? { "X-KB-UA": "mobile" } : {}) } });
  let cacheHit = !push && !fresh && !settings.incognito ? WCache.get(url) : null;
  try { if (cacheHit) { r = cacheHit.r; } else { try { r = (await WA.tryAdapter(url, { markdown })) || (await fetchPage()); } catch (e0) { if (!/reach|timed? ?out|fetch|network|502|503|504|slow|failed/i.test(String(e0.message || e0)) || my !== navSeq) throw e0; await new Promise((ok) => setTimeout(ok, 900)); r = await fetchPage(); } } if (r.setCookies && !cacheHit) storeSetCookies(r.setCookies); }
  catch (e) {
    if (my !== navSeq) return;
    const old = !settings.incognito && WCache.get(url, { stale: true });
    if (old) { r = old.r; cacheHit = old; toast(`Couldn't reach ${host(url)}. Showing the copy you loaded ${WCache.ago(old)}.`, { ms: 6000, action: "Try again", onAction: () => go(url, { push: false, fresh: true }) }); }
    else { progress(false); return errorPage(url, e.message); }
  }
  try {
    const WR = await import("../webrescue.js");
    if (WR.needsRescue(r) && my === navSeq) {
      toast("This page didn't come through. Trying another way…", { ms: 2500 });
      const x = await WR.rescue(url, r, { markdown });
      if (x && my === navSeq) { r = x; toast("Found another way to read this page.", { ms: 2500 }); }
    }
  } catch {}
  if (my !== navSeq || T() !== t) return;
  progress(false);
  if (r.url !== url) { t.url = r.url; t.hist[t.idx] = r.url; $("#kb-url", B.view).value = r.url; }
  t.data = r;
  if (!cacheHit) { try { const ch = await cookieHeaders(url); WCache.put(url, r, { cookied: !!ch["X-KB-Cookie"], priv: settings.incognito }); } catch {} }
  if (r.truncated) toast("This page is very long: showing its first 4 MB.");
  if ((r.status === 404 || r.status === 410) && !/web\.archive\.org/.test(r.url)) {
    // A page that's gone: offer the Internet Archive's last copy, if it has one.
    fetch("/api/browse?url=" + encodeURIComponent("https://archive.org/wayback/available?url=" + encodeURIComponent(url))).then((x) => x.json()).then((j) => {
      const snap = JSON.parse(j.text || "{}").archived_snapshots?.closest; if (!snap?.available || T() !== t) return;
      const d = snap.timestamp ? `${snap.timestamp.slice(0, 4)}-${snap.timestamp.slice(4, 6)}-${snap.timestamp.slice(6, 8)}` : "";
      toast(`This page is gone (${r.status}). The Internet Archive has a copy from ${d}.`, { ms: 12000, action: "Open the copy", onAction: () => go(snap.url.replace(/^http:/, "https:")) });
    }).catch(() => {});
  }
  try { await paint(t); }
  catch (e) {
    // a page that breaks the drawing code must never leave you on a blank screen: try the clean reader copy, then say so
    console.error("[kitsune] could not draw", url, e);
    if (T() === t && my === navSeq) {
      let ok = false;
      if (t.mode !== "reader" && !t.paintRetried) { t.paintRetried = true; const was = t.mode; t.mode = "reader"; syncBar(); try { await paint(t); ok = !!$("#kb-reader", B.view); if (ok) toast("This page couldn't be drawn as it is, so here's the clean reader copy."); } catch {} if (!ok) { t.mode = was; syncBar(); } }
      if (!ok) { progress(false); errorPage(url, "Kitsune hit a problem drawing this page (" + String(e.message || e).slice(0, 120) + ")."); }
    }
  }
  persistTabs();
}
function errorPage(url, msg) {
  kvGet("webOffline", []).then((list) => { const x = (list || []).find((y) => y.url === url); const acts = B.view && $(".kb-err .hero-actions", B.view); if (!x || !acts) return; const b = document.createElement("button"); b.className = "btn btn-accent"; b.type = "button"; b.innerHTML = `${icon("download")}Open the copy you saved`; b.onclick = () => openOffline(x, true); acts.prepend(b); });
  $("#kb-body", B.view).innerHTML = `<div class="kb-err"><h2>That page didn't open</h2><p>${esc(msg)}</p>
    <p class="muted">Some sites block apps like Kitsune, or only work with their own scripts or a sign-in.</p>
    <div class="hero-actions"><a class="btn btn-accent" href="${esc(url)}" target="_blank" rel="noopener">${icon("link")}Open in your browser</a><button class="btn" type="button" data-b="reload">Try again</button>
    <button class="btn" type="button" data-websearch="${esc(url)}">${icon("search")}Search for it</button><button class="btn" type="button" data-b="wayback">${icon("clock")}Try an archived copy</button><button class="btn" type="button" data-b="another">${icon("globe")}Try another way</button></div></div>`;
}

async function paint(t) {
  const r = t.data, body = $("#kb-body", B.view);
  if (r.file) return viewFile(t, r) || fileCard(r);
  if (r.kind === "text" || r.kind === "json" || r.kind === "xml") { t.title = decodeURIComponent(r.url.split("/").pop() || host(r.url)); drawTabs(); remember(r.url, t.title); if (r.kind === "text" && (/markdown/i.test(r.ctype || "") || /\.(md|markdown|mdown|mkd)$/i.test((r.url.split(/[?#]/).pop() || "").split("/").pop() || ""))) return void mdView(t, r); if (WC.viewSpecial(t, r, body, go)) return void drawTabs(); return viewText(t, r); }
  const doc = new DOMParser().parseFromString(r.html, "text/html");
  t.title = (doc.title || host(r.url)).trim().slice(0, 120); drawTabs();
  remember(r.url, t.title);
  t.doc = doc;
  // v142: clear consent walls and polish the oldest markup before any view draws the page
  try { WC2.fixDoc2(doc, (u) => { try { return new URL(u, r.url).href; } catch { return ""; } }); } catch {}
  if (followRefresh(t, doc)) return;
  if (botWall(t, doc)) return;
  t.feed = feedOf(t); // before the page is cleaned, which removes its <link> tags
  // learn this site's search quietly, the first time you visit
  if (doc.querySelector('link[rel~="search"][type*="opensearch"]') || doc.querySelector('input[type="search"]')) learnSearch(new URL(r.url).hostname, doc, r.url).then((e) => { if (e && Date.now() - e.learned < 4000) toast(`You can now search ${e.name}: type “${e.keyword} …” in the address bar, or use the search button.`); }).catch(() => {});
  if (liveSites().has(host(r.url)) && t.mode !== "reader") t.mode = "live";
  else if (readerSites().has(host(r.url)) && t.mode === "page" && !t.readerTried) { t.mode = "reader"; t.readerTried = true; }
  if (t.mode === "live") return liveView(t);
  if (t.mode === "reader") return readerView(t, doc);
  await pageView(t, doc, r.url);
}

// ---------- page mode: the site's own layout, without its scripts ----------
const DROP = "script, iframe, frame, frameset, object, embed, applet, base, meta, template:not([shadowrootmode]):not([shadowroot]), portal, noscript link, link:not([rel~=stylesheet])";
async function pageView(t, doc, baseUrl) {
  const _p0 = performance.now(), _lap = (n) => { if (localStorage.getItem("kitsune.webPerf")) console.log("[perf]", n, Math.round(performance.now() - _p0)); };
  const body = $("#kb-body", B.view);
  const base = new URL(doc.querySelector("base[href]")?.getAttribute("href") || baseUrl, baseUrl).href;
  t.shield = { scripts: doc.querySelectorAll("script").length, trackers: 0, banners: 0, hosts: new Set(), on: shieldOn(t) };
  const abs0 = (u) => { try { return new URL(u, base).href; } catch { return ""; } };
  const abs = (u) => cleanUrl(abs0(u), t);
  // stylesheets: the page's own, fetched through Kitsune, with their relative links fixed
  doc.querySelectorAll('link[rel~="preload"][as="style"][href]').forEach((l) => { if (!doc.querySelector(`link[rel~="stylesheet"][href="${CSS.escape(l.getAttribute("href"))}"]`)) l.setAttribute("rel", "stylesheet"); });
  doc.querySelectorAll('link[rel~="stylesheet"][onload]').forEach((l) => { if (/media/.test(l.getAttribute("onload")) && /^(print|none|only x|not all)$/i.test((l.getAttribute("media") || "").trim())) l.setAttribute("media", "all"); });
  doc.querySelectorAll('link[rel~="stylesheet"][disabled]').forEach((l) => l.hasAttribute("onload") && l.removeAttribute("disabled"));
  const sheetLinks = [...new Map([...doc.querySelectorAll('link[rel~="stylesheet"][href]')].filter((l) => !l.hasAttribute("disabled") && (!l.media || /all|screen/.test(l.media) || matchMedia(l.media).matches)).map((l) => [l.getAttribute("href"), l])).values()].slice(0, 25).map((l) => abs(l.getAttribute("href")));
  doc.querySelectorAll("style#antiClickjack, style#anti-clickjack, style#antiClickJack").forEach((n) => n.remove());
  _lap("start");
  const inline = [...doc.querySelectorAll("style")].map((s) => [s.textContent, base]);
  const fetched = await Promise.all(sheetLinks.map(async (u) => { try { const text = await WCache.css(u); return text == null ? null : [text, u]; } catch { return null; } }));
  _lap("sheets fetched");
  const cssParts = [];
  for (const pair of fetched.filter(Boolean)) cssParts.push(...(await WCache.memo("x:" + pair[1] + ":" + WCache.sig(pair[0]), () => expandCss(pair[0], pair[1], 0))));
  for (const pair of inline) cssParts.push(...(await expandCss(pair[0], pair[1], 0)));
  const joined = cssParts.join("\n");
  const { css: css0, fonts } = WCache.memo("sc:" + WCache.sig(joined), () => scopeCss(joined)); const css = css0 + "\n" + WC.COMPAT_CSS + "\n" + WC2.COMPAT_CSS2;
  framesToCards(doc, abs); _lap("frames");
  compatFixups(doc, t, abs); _lap("compatFixups");
  try { await WC.fixDoc(doc, abs0); } catch {} _lap("fixDoc");
  doc.querySelectorAll("noscript").forEach((n) => { const d = doc.createElement("div"); d.innerHTML = n.textContent || n.innerHTML; n.replaceWith(...d.childNodes); });
  t.mediaCount = buildEmbeds(doc, abs); _lap("embeds");
  doc.querySelectorAll(DROP).forEach((n) => n.remove());
  if (t.shield.on) t.shield.banners += hideClutter(doc); _lap("clutter");
  if (/(^|\.)web\.archive\.org$/.test(host(baseUrl))) doc.querySelectorAll("#wm-ipp-base, #wm-ipp, #donato, #wm-ipp-print, .wb-autocomplete-suggestions, #wm-btns").forEach((n) => n.remove());
  _lap("css done");
  doc.querySelectorAll("style, link").forEach((n) => n.remove());
  for (const el of doc.querySelectorAll("*")) {
    for (let ai = el.attributes.length - 1; ai >= 0; ai--) {
      const a = el.attributes[ai]; if (!a) continue;
      const n = a.name.toLowerCase(), v = a.value.trim();
      if (n.startsWith("on") || n === "srcdoc" || n === "formaction" || n === "ping") { el.removeAttribute(a.name); if (n === "onclick" || n === "onmousedown") el.setAttribute("data-kb-js", "1"); }
      else if (/^(href|src|action|poster|xlink:href|data)$/.test(n) && /^\s*(javascript|vbscript):/i.test(v)) el.removeAttribute(a.name);
      else if (n === "style" && /url\(/i.test(v)) el.setAttribute("style", v.replace(/url\((['"]?)([^'")]+)\1\)/gi, (_, q, u) => `url("${abs(u)}")`));
    }
    const tag = el.tagName.toUpperCase();
    if (tag === "IMG" || tag === "SOURCE") {
      // pictures that wait for a script to load them get their real source now
      const lazy = el.getAttribute("data-src") || el.getAttribute("data-lazy-src") || el.getAttribute("data-original") || el.getAttribute("data-url") || el.getAttribute("data-lazy") || el.getAttribute("data-original-src") || el.getAttribute("data-hi-res-src") || el.getAttribute("data-lazyload") || el.getAttribute("data-echo") || el.getAttribute("data-full-src");
      if (lazy && (!el.getAttribute("src") || /^data:|blank|placeholder|spacer|pixel/i.test(el.getAttribute("src")))) el.setAttribute("src", lazy);
      const lss = el.getAttribute("data-srcset") || el.getAttribute("data-lazy-srcset"); if (lss) el.setAttribute("srcset", lss);
      if (el.getAttribute("src")) el.setAttribute("src", tag === "SOURCE" && el.parentElement?.tagName !== "PICTURE" ? abs(el.getAttribute("src")) : viaImg(abs(el.getAttribute("src"))));
      if (el.getAttribute("srcset")) el.setAttribute("srcset", el.getAttribute("srcset").split(",").map((p) => { const [u, ...d] = p.trim().split(/\s+/); return [viaImg(abs(u)), ...d].join(" "); }).join(", "));
      if (tag === "IMG") { el.setAttribute("loading", "lazy"); el.setAttribute("decoding", "async"); el.setAttribute("referrerpolicy", "no-referrer"); }
    } else if (tag === "A" || tag === "AREA") { if (el.getAttribute("href")) { const h = el.getAttribute("href"); if (!h.startsWith("#")) el.setAttribute("href", abs(h)); } el.setAttribute("rel", "noopener noreferrer"); }
    else if (tag === "VIDEO" || tag === "AUDIO") { el.removeAttribute("autoplay"); el.setAttribute("controls", ""); el.setAttribute("preload", "none"); ["src", "poster"].forEach((k) => el.getAttribute(k) && el.setAttribute(k, abs(el.getAttribute(k)))); }
    else if (tag === "FORM") el.setAttribute("action", abs(el.getAttribute("action") || base));
    // backgrounds that wait for a script
    const bg = el.getAttribute("data-bg") || el.getAttribute("data-background-image") || el.getAttribute("data-bg-src");
    if (bg && !/background-image/.test(el.getAttribute("style") || "")) el.setAttribute("style", `${el.getAttribute("style") || ""};background-image:url("${abs(bg.replace(/^url\(["']?|["']?\)$/g, ""))}")`);
  }
  _lap("attributes");
  const html = doc.body ? doc.body.innerHTML : "";
  const bodyCls = doc.body?.getAttribute("class") || "", bodyId = doc.body?.id || "", htmlCls = doc.documentElement.getAttribute("class") || "";
  body.innerHTML = `<div class="kb-page" id="kb-page"></div>`;
  const hostEl = $("#kb-page", body);
  const root = hostEl.attachShadow({ mode: "open" });
  const sheet = new CSSStyleSheet();
  try { sheet.replaceSync(css); } catch { /* a stylesheet Kitsune can't read is skipped */ }
  const baseSheet = new CSSStyleSheet();
  baseSheet.replaceSync(`:host { all: initial; display: block; } .kb-html { display: block; background: #fff; color: #111; font: 16px/1.45 -apple-system, "Segoe UI", system-ui, sans-serif; min-height: 100%; zoom: var(--kbz, 1); }
    .kb-body { display: block; margin: 8px; } .kb-html, .kb-body { animation: none !important; visibility: visible !important; opacity: 1 !important; }
    .kb-html.kb-cs-dark { color-scheme: dark; background: #121318; color: #e7e7ea; }
    img[data-kb-src] { min-width: 90px; min-height: 54px; background: #ececec; outline: 1px dashed #aaa; cursor: pointer; }
    [data-aos], [data-sal], [data-sr], [data-scroll-reveal], [data-animate], .wow, .lazyload, .lazyloading, .aos-init, .reveal-on-scroll, .fade-in-up { opacity: 1 !important; visibility: visible !important; transform: none !important; } img, video { max-width: 100%; height: auto; } .kb-embed { display: grid; gap: 4px; padding: 16px; margin: 10px 0; border: 1px dashed #aaa; border-radius: 10px; background: #f6f6f6; color: #333; font: 14px system-ui, sans-serif; cursor: pointer; }
    :host(.kb-dark) .kb-html { filter: invert(.9) hue-rotate(180deg); background: #fff; }
    :host(.kb-dark) img, :host(.kb-dark) video, :host(.kb-dark) picture, :host(.kb-dark) canvas, :host(.kb-dark) svg image, :host(.kb-dark) .kbx, :host(.kb-dark) [style*="background-image"] { filter: invert(1) hue-rotate(180deg); }
    .kb-hide { display: none !important; } .kb-zap-hover { outline: 2px solid #e53935 !important; outline-offset: -2px; background-color: rgb(229 57 53 / .08) !important; cursor: crosshair !important; } ::highlight(kb-say) { background: #ffd54a; color: #000; } ::highlight(kb-say-line) { background: #fff3c4; }
    .kb-embed iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; } ::highlight(kb-find) { background: #ffd54a; color: #000; } ::highlight(kb-find-cur) { background: #ff9f1a; color: #000; }`);
  const embedSheet = new CSSStyleSheet(); embedSheet.replaceSync(E.EMBED_CSS);
  root.adoptedStyleSheets = [baseSheet, sheet, embedSheet];
  // setHTMLUnsafe keeps web components that come pre-rendered (declarative shadow DOM); innerHTML would drop them
  const RTL_LANG = /^(ar|he|iw|fa|ur|ps|sd|ug|yi|dv|ckb)(-|$)/i, pageDir = doc.documentElement.getAttribute("dir") || doc.body?.getAttribute("dir") || (RTL_LANG.test(doc.documentElement.lang || "") ? "rtl" : "");
  const shell = `<div class="kb-html ${esc(htmlCls)}" lang="${esc(doc.documentElement.lang || "")}" ${pageDir ? `dir="${esc(pageDir)}"` : ""} ${carryAttrs(doc.documentElement, ["class", "lang", "dir"])}><div class="kb-body ${esc(bodyCls)}" ${bodyId ? `id="${esc(bodyId)}"` : ""} ${carryAttrs(doc.body, ["class", "id"])}>${html}</div></div>`;
  const prog = localStorage.getItem("kitsune.webProgressive") === "1" && WProg.worthIt(html) && !t.noProgressive;
  const shellHtml = prog ? shell.replace(html, "") : shell;
  if (typeof root.setHTMLUnsafe === "function") root.setHTMLUnsafe(shellHtml); else root.innerHTML = shellHtml;
  if (prog) { const bodyEl = root.querySelector(".kb-body"); if (bodyEl) { try { await WProg.fill(bodyEl, html); } catch { bodyEl.innerHTML = html; } } }
  inlineSprites(root, base).catch(() => {});
  try { const kh = root.querySelector(".kb-html"); if (kh) hostEl.style.setProperty("--kb-rem", getComputedStyle(kh).fontSize); } catch {}
  _lap("inserted");
  scriptAppHint(root, t);
  t.zoom = siteZoom(host(t.url)) || t.zoom || 1;
  hostEl.style.setProperty("--kbz", t.zoom);
  // fonts can't be declared inside a shadow root, so they go in the document, one set per tab
  $(`#kbf-${t.id}`)?.remove();
  if (fonts) { const st = document.createElement("style"); st.id = "kbf-" + t.id; st.textContent = fonts; document.head.append(st); }
  root.addEventListener("click", (e) => onPageClick(e, root, t));
  E.hydrate(root);
  E.attachLinkPreviews(root);
  markZoomable(root);
  _lap("before afterRender");
  afterRender(root, hostEl, t);
  _lap("afterRender");
  syncFollow(t);
  suggestLive(root, t);
  paintMediaCount(root);
  root.addEventListener("submit", (e) => onSubmit(e, t));
  root.addEventListener("click", (e) => { const im = e.target.closest?.("img[data-kb-src]"); if (!im) return; e.preventDefault(); e.stopImmediatePropagation(); im.src = viaImg(im.dataset.kbSrc); im.removeAttribute("data-kb-src"); im.removeAttribute("title"); }, true);
  root.addEventListener("error", (e) => { const im = e.target; if (im?.tagName !== "IMG" || im.dataset.kbRetry || !/^https?:/.test(im.currentSrc || im.src) || (im.currentSrc || im.src).includes("/api/browse/img")) return; im.dataset.kbRetry = "1"; im.removeAttribute("srcset"); im.src = "/api/browse/img?url=" + encodeURIComponent(im.currentSrc || im.src) + "&ref=" + encodeURIComponent(t.data.url); }, true);
  root.addEventListener("contextmenu", (e) => { const a = e.composedPath().find((n) => n.tagName === "A"); if (a && /^https?:/.test(a.href) && matchMedia("(pointer: coarse)").matches) { e.preventDefault(); peek(a.href); } });
  if (t.scroll) hostEl.scrollTop = t.scroll;
  hostEl.addEventListener("scroll", debounce(() => (t.scroll = hostEl.scrollTop), 200), { passive: true });
  const hash = (() => { try { return decodeURIComponent(new URL(t.url).hash.slice(1)); } catch { return ""; } })();
  if (hash) setTimeout(() => root.getElementById(hash)?.scrollIntoView(), 50);
}

async function expandCss(text, from, depth) {
  const out = [];
  // @import pulls in more sheets (one level deep), then relative url()s are made absolute
  const imports = [...text.matchAll(/@import\s+(?:url\()?\s*['"]?([^'")\s;]+)['"]?\s*\)?([^;]*);/gi)];
  if (depth < 1) for (const m of imports.slice(0, 6)) {
    try { const u = new URL(m[1], from).href; const r = await fetch("/api/browse/css?url=" + encodeURIComponent(u)); if (r.ok) out.push(...(await expandCss(await r.text(), u, depth + 1))); } catch {}
  }
  text = text.replace(/((?:-webkit-)?image-set\()([^)]*)\)/gi, (m, a, inner) => a + inner.replace(/(['"])(?!data:|https?:|#)([^'"]+)\1/g, (q0, q, u) => { try { return `"${new URL(u, from).href}"`; } catch { return q0; } }) + ")");
  out.push(text.replace(/@import[^;]+;/gi, "").replace(/url\(\s*(['"]?)(?!data:|#)([^'")]+)\1\s*\)/gi, (_, q, u) => { try { return `url("${new URL(u.trim(), from).href}")`; } catch { return "none"; } }));
  return out;
}
// The page's html, body and :root rules are pointed at Kitsune's stand-ins inside the shadow root.
function scopeCss(css) {
  const fonts = (css.match(/@font-face\s*\{[^}]*\}/gi) || []).join("\n");
  const scoped = css.replace(/@font-face\s*\{[^}]*\}/gi, "")
    .replace(/(^|[\s,{}>+~(])(:root|html)(?=[\s,.{:#[>+~)])/gi, "$1.kb-html")
    .replace(/(^|[\s,{}>+~(])body(?=[\s,.{:#[>+~)])/gi, "$1.kb-body")
    .replace(/:([^;{}]*)(?=[;}])/g, (m) => (/\drem\b/.test(m) ? m.replace(/(-?(?:\d+\.?\d*|\.\d+))rem\b/g, "calc($1 * var(--kb-rem, 1rem))") : m));
  return { css: scoped, fonts };
}

function onPageClick(e, root, t) {
  E.hideTip();
  if (embedClick(e)) return;
  // a picture that isn't a link opens in the image viewer, with every other picture on the page
  const img = e.target.closest?.("img.kb-zoomable");
  if (img && !(img.dataset.zoomLink && (e.metaKey || e.ctrlKey))) { // ⌘-click on a picture link still follows the link
    e.preventDefault();
    const all = pageImages(root), at = all.findIndex((x) => x.el === img);
    E.lightbox(at >= 0 ? all : [{ el: img, src: fullSize(img), alt: img.alt, full: fullSize(img) }], Math.max(0, at));
    return;
  }
  const a = e.composedPath().find((n) => /^(A|AREA)$/i.test(n.tagName || ""));
  if (!a || !(a.getAttribute("href") || a.getAttribute("xlink:href"))) {
    const ctl = e.composedPath().find((n) => n.nodeType === 1 && (n.hasAttribute?.("data-kb-js") || /^(javascript:|#?)$/i.test(n.getAttribute?.("href") ?? "x")) && /^(A|BUTTON|SUMMARY|DIV|SPAN|LI)$/.test(n.tagName) && !n.closest?.("form"));
    if (ctl && t.mode !== "live" && Date.now() - (B.jsHint || 0) > 9000) { B.jsHint = Date.now(); toast("That control needs the page’s own scripts.", { ms: 6000, action: "Run it live", onAction: () => { t.mode = "live"; syncBar(); paint(t); } }); }
    return;
  }
  const href = a.getAttribute("href") || a.getAttribute("xlink:href");
  e.preventDefault();
  if (href.startsWith("#") && footnotePop(root, decodeURIComponent(href.slice(1)), e)) return;
  if (href.startsWith("#")) { root.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ behavior: "smooth" }); return; }
  try { const x = new URL(a.href || href, t.url), cur = new URL(t.url); if (x.hash && x.origin + x.pathname + x.search === cur.origin + cur.pathname + cur.search && !(e.metaKey || e.ctrlKey || e.shiftKey)) { const id = decodeURIComponent(x.hash.slice(1)); const el = root.getElementById(id) || root.querySelector(`[name="${CSS.escape(id)}"]`); if (el) { if (footnotePop(root, id, e)) return; el.scrollIntoView({ behavior: "smooth" }); return; } } } catch {}
  if (/^(mailto|tel|sms|magnet|webcal|geo|facetime|callto|bitcoin|ftp):/i.test(href)) { toast("Handing that link to your device.", { ms: 1800 }); location.href = href; return; }
  if (!/^https?:/i.test(href)) return;
  if (/\.(epub|pdf|cbz|cbr|zip)(\?|#|$)/i.test(href)) return downloadAsk(href, a.textContent.trim());
  if (/\.user\.(js|css)(\?|#|$)/i.test(href)) return US.installFromUrl(href);
  if (e.shiftKey) return peek(href);
  if (e.altKey) { B.tabs.splice(B.active + 1, 0, Object.assign(newTab(null), { mode: "reader" })); B.active++; drawTabs(); return go(href); } // Alt-click: straight to Reader mode in a new tab
  go(href, { newTab: e.metaKey || e.ctrlKey || e.button === 1 });
}
function onSubmit(e, t) {
  const f = e.target; e.preventDefault();
  if ((f.getAttribute("method") || "get").toLowerCase() === "post") {
    const fd = new FormData(f, e.submitter || undefined), body = new TextEncoder().encode(new URLSearchParams([...fd.entries()].filter(([, v]) => typeof v === "string")).toString()).buffer;
    t.mode = "live"; syncBar(); return livePostNav(t, { url: f.getAttribute("action") || t.url, ctype: "application/x-www-form-urlencoded", body });
  }
  if ((f.getAttribute("method") || "get").toLowerCase() !== "get") return toast("This form sends private data. Open the page in your browser to use it.", { action: "Open", onAction: () => window.open(t.url, "_blank", "noopener") });
  const u = new URL(f.getAttribute("action")), fd = new FormData(f, e.submitter || undefined);
  u.search = new URLSearchParams([...fd.entries()].filter(([, v]) => typeof v === "string")).toString();
  go(u.href);
}

// ---------- reader mode ----------
let readability = null;
function loadReadability() {
  if (readability) return readability;
  readability = new Promise((res, rej) => {
    if (window.Readability) return res();
    let n = 0; const done = () => ++n === 2 && res();
    for (const f of ["Readability.js", "Readability-readerable.js"]) { const s = document.createElement("script"); s.src = `https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/${f}`; s.onload = done; s.onerror = rej; document.head.append(s); }
  });
  return readability;
}
async function readerArticle(t) {
  await loadReadability();
  const doc = new DOMParser().parseFromString(t.data.html, "text/html");
  const base = doc.createElement("base"); base.href = t.data.url; doc.head.prepend(base);
  const art = new window.Readability(doc, { charThreshold: 300 }).parse();
  if (!art?.content) return null;
  const d = new DOMParser().parseFromString(art.content, "text/html");
  d.querySelectorAll("script, style, iframe, object, embed, form, button, input").forEach((n) => n.remove());
  d.querySelectorAll("*").forEach((el) => [...el.attributes].forEach((a) => { if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name); }));
  d.querySelectorAll("img").forEach((im) => { im.setAttribute("loading", "lazy"); im.setAttribute("referrerpolicy", "no-referrer"); im.removeAttribute("width"); im.removeAttribute("height"); });
  return { ...art, content: d.body.innerHTML, words: (art.textContent || "").split(/\s+/).length };
}
async function readerView(t) {
  const body = $("#kb-body", B.view);
  body.innerHTML = `<div class="kb-loading"><span class="kb-spin"></span>Making a clean copy…</div>`;
  let art = null;
  try { art = await readerArticle(t); } catch { /* falls through */ }
  if (T() !== t || t.mode !== "reader") return;
  if (!art) { toast("Kitsune couldn't find an article on this page. Showing the page itself."); t.mode = "page"; syncBar(); return pageView(t, new DOMParser().parseFromString(t.data.html, "text/html"), t.data.url); }
  t.article = art;
  body.innerHTML = `<article class="kb-reader" id="kb-reader" style="--kbz:${t.zoom}">
    <p class="kb-site"><img src="${esc(favicon(t.data.url))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">${esc(art.siteName || host(t.data.url))}</p>
    <h1>${esc(art.title || t.title)}</h1>
    <p class="kb-meta">${[art.byline, `${Math.max(1, Math.round(art.words / 230))} min read`].filter(Boolean).map(esc).join(" · ")}</p>
    <div class="kb-art">${art.content}</div>
    <div class="kb-art-media" id="kb-art-media"></div>
    <div class="kb-endbar"><button class="btn btn-accent" type="button" data-b="save">${icon("plus")}Save to my library</button><a class="btn" href="${esc(t.data.url)}" target="_blank" rel="noopener">${icon("link")}Original page</a></div>
  </article>`;
  const rd = $("#kb-reader", body);
  {
    // the article's videos, music and posts, as cards after the text
    const src = new DOMParser().parseFromString(t.data.html, "text/html"), base = t.data.url;
    const host2 = $("#kb-art-media", rd), n = buildEmbeds(src, (u) => { try { return new URL(u, base).href; } catch { return ""; } });
    const cards = [...src.querySelectorAll(".kbx")].slice(0, 12);
    if (n && cards.length) { host2.innerHTML = `<h2>Media on this page</h2>`; cards.forEach((c) => host2.append(document.importNode(c, true))); E.hydrate(host2); }
  }
  E.attachLinkPreviews(rd);
  applyClips(rd, t); selectionBar(rd, t); swipeNav(rd); syncFollow(t);
  markZoomable(rd);
  applyReaderLook(rd);
  readProgress(rd);
  rd.addEventListener("click", (e) => { E.hideTip(); if (embedClick(e)) return; const im = e.target.closest("img.kb-zoomable"); if (im) { e.preventDefault(); const all = pageImages(rd), at = all.findIndex((x) => x.el === im); return E.lightbox(at >= 0 ? all : [{ el: im, src: fullSize(im), alt: im.alt, full: fullSize(im) }], Math.max(0, at)); } const a = e.target.closest("a[href]"); if (!a) return; e.preventDefault(); const h = a.getAttribute("href"); if (/^https?:/i.test(a.href)) go(a.href); else if (h.startsWith("#")) rd.querySelector(CSS.escape(h))?.scrollIntoView(); });
}

// ---------- files: ebooks and comics go straight into the library ----------
function fileCard(r) {
  const name = r.file.name || "file", mb = (r.file.size / 1e6).toFixed(1), ok = /\.(epub|pdf|cbz|zip)$/i.test(name) || /epub|pdf|comicbook|zip/.test(r.file.type);
  $("#kb-body", B.view).innerHTML = `<div class="kb-err kb-file"><span class="kb-fileico">${icon("download")}</span><h2>${esc(name)}</h2><p class="muted">${esc(r.file.type || "File")} · ${mb} MB · from ${esc(host(r.url))}</p>
    <div class="hero-actions">${ok ? `<button class="btn btn-accent" type="button" data-import="${esc(r.url)}" data-name="${esc(name)}">${icon("plus")}Add to my library</button>` : ""}<a class="btn" href="${esc(r.url)}" target="_blank" rel="noopener">${icon("link")}Download in your browser</a></div>
    <p class="hint">Only add files you own or that are free to share, like public-domain ebooks.</p></div>`;
}
function downloadAsk(url, label) {
  const name = decodeURIComponent(url.split("?")[0].split("/").pop() || "file");
  const m = modal({ title: "Add this to your library?", body: `<p style="margin-top:0"><strong>${esc(label || name)}</strong><br><span class="muted">${esc(name)} · from ${esc(host(url))}</span></p><p class="hint">Kitsune downloads it and adds it to your library. Only add files you own or that are free to share.</p><p class="status" id="dl-s"></p>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">In your browser</a><button class="btn btn-accent" type="button" id="dl-go">Add to library</button>` });
  $("#dl-go", m.root).onclick = async () => { const s = $("#dl-s", m.root); s.className = "status"; s.textContent = "Downloading…"; try { await importFile(url, name); m.close(); } catch (e) { s.className = "status err"; s.textContent = e.message; } };
}
async function importFile(url, name, retried = false) {
  const r = await fetch("/api/browse/file?url=" + encodeURIComponent(url));
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e.error || "That file didn't download.") + (r.status === 413 ? " Download it in your browser, then add it with Add files." : "")); }
  let blob = await r.blob();
  // Some sites answer an ebook link with a "thanks for downloading" page that starts the real download itself.
  // Follow it once: a meta refresh, or a link to the same file.
  if (/html/.test(blob.type) && !retried) {
    const d = new DOMParser().parseFromString(await blob.text(), "text/html");
    const meta = d.querySelector('meta[http-equiv="refresh" i]')?.getAttribute("content")?.match(/url=(.+)$/i)?.[1];
    const file = name.split("?")[0];
    const link = [...d.querySelectorAll("a[href]")].map((x) => x.getAttribute("href")).find((h) => h.split("?")[0].endsWith(file) && h !== url);
    const next = meta || link;
    if (next) return importFile(new URL(next.replace(/^['"]|['"]$/g, ""), url).href, name, true);
    throw new Error("That link led to a web page, not a file. Look for the download link on it.");
  }
  const { importFiles } = await import("../importers.js");
  const { items, errors } = await importFiles([new File([blob], name, { type: blob.type })], {});
  if (!items.length) throw new Error(errors.join(" ") || "Kitsune couldn't read that file.");
  toast(`Added “${items[0].title}” to your library.`, { action: "Open", onAction: async () => (await import("./common.js")).openItem(items[0]) });
}

// ---------- start page ----------
async function startPage() {
  const [hist, marks, engines] = await Promise.all([store.history(), store.marks(), store.engines()]);
  const eng = defaultEngine(), learned = Object.values(engines || {}).sort((a, b) => b.learned - a.learned);
  const dial0 = (await (await import("../webplus5.js")).customDial()) || DIAL;
  const dial = isKids() ? dial0.filter(([, u]) => KIDS_HOSTS.test(host(u))) : DIAL;
  $("#kb-body", B.view).innerHTML = `<div class="kb-start">
    <div class="kb-hero"><span class="kb-fox" aria-hidden="true"><svg><use href="#fox"/></svg></span><h2>Where to?</h2>
      <form class="kb-big" id="kb-big"><input id="kb-bigq" type="search" placeholder="Search the web, or try “dickens @standardebooks.org”" aria-label="Search" autofocus><button class="btn btn-accent" type="submit">${icon("search")}Search</button></form>
      <div class="kb-engines" role="radiogroup" aria-label="Search with">${Object.entries(ENGINES).map(([k, e]) => `<button type="button" role="radio" data-engine="${k}" aria-checked="${k === eng}" title="${esc(e.blurb)}">${esc(e.name)}</button>`).join("")}</div></div>
    <section><h3>Places to read <button class="link-btn" type="button" data-b="editdial">Edit</button></h3><div class="kb-dial">${dial.map(([n, u, h]) => `<button type="button" class="kb-tile" data-go="${esc(u)}" style="--h:${h}"><span><img src="${esc(favicon(u))}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'${esc(n[0])}'}))"></span><strong>${esc(n)}</strong></button>`).join("")}</div></section>
    <section><h3>Search any site</h3><p class="hint">Type <kbd>words @site.com</kbd> in the address bar. Kitsune looks for the site's OpenSearch description (the open standard sites publish so browsers can search them), then its own search box, and remembers it. If a site has neither, it searches the web for that site only.</p>
      <form class="kb-site-form" id="kb-sitef"><input class="field" id="kb-site-h" placeholder="site.com" aria-label="Site" required><input class="field" id="kb-site-q" placeholder="What to look for" aria-label="Words" required><button class="btn" type="submit">${icon("search")}Search that site</button></form>
      ${learned.length ? `<div class="kb-learned">${learned.map((e) => `<button type="button" class="kb-eng" data-engine-host="${esc(e.host)}" title="${esc(e.kind)} · ${esc(e.template)}"><img src="${esc(e.icon)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span><strong>${esc(e.name)}</strong><small>type <kbd>${esc(e.keyword)} …</kbd></small></span><i class="kb-forget" data-forget="${esc(e.host)}" role="button" aria-label="Forget ${esc(e.name)}" title="Forget">×</i></button>`).join("")}</div>` : ""}</section>
    <section id="kb-following" hidden></section>
    <section id="kb-laters" hidden></section>
    ${(marks || []).length ? `<section><h3>Bookmarks</h3><div class="kb-links">${marks.map((m) => `<button type="button" data-go="${esc(m.url)}"><img src="${esc(favicon(m.url))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span>${esc(m.title)}</span><small>${esc(host(m.url))}</small></button>`).join("")}</div></section>` : ""}
    ${(hist || []).length ? `<section><h3>Recently visited <button class="link-btn" type="button" data-b="clearhist">Clear</button></h3><div class="kb-links">${hist.slice(0, 12).map((m) => `<button type="button" data-go="${esc(m.url)}"><img src="${esc(favicon(m.url))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span>${esc(m.title)}</span><small>${esc(host(m.url))}</small></button>`).join("")}</div></section>` : ""}
    <p class="hint kb-note">Kitsune's browser shows pages without their scripts, so it's fast, private and quiet, but sign-ins, shops and apps won't work here. Open those in your usual browser.</p></div>`;
  $("#kb-big", B.view).onsubmit = (e) => { e.preventDefault(); const q = $("#kb-bigq", B.view).value.trim(); if (q) go(q); };
  drawFollowing(); drawLaters();
  if (!settings.incognito) import("../webplus21.js").then((m) => m.continueReading($("#kb-body", B.view), go)).then(() => import("../webplus22.js")).then((m) => m.startHighlight($("#kb-body", B.view), go)).catch(() => {});
  $("#kb-sitef", B.view).onsubmit = async (e) => { e.preventDefault(); go(`${$("#kb-site-q", B.view).value.trim()} @${$("#kb-site-h", B.view).value.trim()}`); };
}

// ---------- site search ----------
async function siteSearchDialog() {
  const t = T();
  const h = t.url ? new URL(t.url).hostname : "";
  if (!h) return $("#kb-url", B.view).focus();
  const e = await learnSearch(h, t.doc, t.data?.url).catch(() => null);
  const m = modal({ title: `Search ${e?.name || host(t.url)}`, body: `<form class="form" id="ss"><input class="field" id="ss-q" type="search" required autofocus placeholder="What are you looking for?">
      <p class="hint">${e ? `Using ${esc(e.name)}'s own search (${esc(e.kind)}). Next time, type <kbd>${esc(e.keyword)} your words</kbd> in the address bar.` : `This site doesn't say how to search it, so Kitsune searches the web for pages on ${esc(host(t.url))}.`}</p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="ss">${icon("search")}Search</button>` });
  $("#ss", m.root).onsubmit = async (ev) => { ev.preventDefault(); const q = $("#ss-q", m.root).value.trim(); m.close(); go(await siteSearchUrl(h, q)); };
}

// ---------- find in page ----------
function findInPage() {
  const root = $("#kb-page", B.view)?.shadowRoot || $("#kb-reader", B.view);
  if (!root) return;
  const m = modal({ title: "Find on this page", body: `<form class="form" id="fp"><input class="field" id="fp-q" type="search" required autofocus><p class="status" id="fp-s"></p></form>`,
    actions: `<button class="btn" type="button" data-close>Done</button><button class="btn" type="button" id="fp-prev">Previous</button><button class="btn btn-accent" form="fp">Next</button>`, onClose: () => { CSS.highlights?.delete("kb-find"); CSS.highlights?.delete("kb-find-cur"); } });
  let ranges = [], cur = -1, last = "";
  const run = (dir) => {
    const q = $("#fp-q", m.root).value.trim().toLowerCase(); if (!q) return;
    if (q !== last) {
      ranges = []; last = q; cur = -1;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode, s = n.nodeValue.toLowerCase(); let i = s.indexOf(q); while (i >= 0 && ranges.length < 1000) { const r = new Range(); r.setStart(n, i); r.setEnd(n, i + q.length); ranges.push(r); i = s.indexOf(q, i + q.length); } }
      if (CSS.highlights) CSS.highlights.set("kb-find", new Highlight(...ranges));
    }
    if (!ranges.length) { $("#fp-s", m.root).textContent = "Not found."; return; }
    cur = (cur + dir + ranges.length) % ranges.length;
    if (CSS.highlights) CSS.highlights.set("kb-find-cur", new Highlight(ranges[cur]));
    ranges[cur].startContainer.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" });
    $("#fp-s", m.root).textContent = `${cur + 1} of ${ranges.length}${ranges.length >= 1000 ? "+" : ""}`;
  };
  $("#fp", m.root).onsubmit = (e) => { e.preventDefault(); run(1); };
  $("#fp-prev", m.root).onclick = () => run(-1);
}

// ---------- saving ----------
async function saveToLibrary() {
  const t = T(); if (!t.data?.html) return toast("Open a page first.");
  let art = t.article;
  if (!art) { try { art = await readerArticle(t); } catch {} }
  if (!art) return toast("Kitsune couldn't find an article on this page to save.");
  const item = await saveItem({ id: uid("v-"), type: "book", title: art.title || t.title, author: art.byline || art.siteName || host(t.data.url),
    source: { kind: "wiki", cachedHtml: art.content, url: t.data.url, wiki: art.siteName || host(t.data.url), license: "" },
    origin: `Saved from ${host(t.data.url)}`, tags: ["saved pages"], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000) });
  toast(`Saved “${item.title}” to your library. Read it any time, even offline.`, { action: "Read", onAction: async () => (await import("./common.js")).openItem(item) });
}

function menuItems() {
  const t = T();
  const feed = t.doc?.querySelector('link[rel~="alternate"][type*="rss"], link[rel~="alternate"][type*="atom"]');
  return [
    { label: "Run a command… (type > in the address bar)", icon: "search", run: () => commandPalette("") },
    { label: "Find on this page", icon: "search", run: findInPage },
    { label: "Page outline (O)", icon: "toc", run: toggleOutline },
    { label: darkFor(T()) ? "Dark page: off" : "Dark page: on", icon: "moon", run: toggleDark },
    { label: SAY.on ? "Stop reading aloud" : "Read this page aloud", icon: "speak", run: () => (SAY.on ? stopSay() : readAloud()) },
    { label: "Translate this page", icon: "globe", run: translateDialog },
    { label: "Summarize with AI", icon: "spark", run: () => aiPage("Summarize this page in 3 to 6 bullet points, then one line on who would find it useful.", "Summary") },
    { label: "Ask AI about this page…", icon: "spark", run: () => aiPage("", "Ask about this page") },
    { label: "Older versions (Wayback Machine)", icon: "clock", run: waybackDialog },
    { label: "Make this site readable…", icon: "type", run: siteStyleDialog },
    { label: "Focus mode", icon: "expand", run: toggleFocusMode },
    { label: "Peek at a link: Shift-click it", icon: "book", run: () => toast("Shift-click any link (or long-press it on a phone) to read it in a side panel.") },
    { label: "History", icon: "list", run: historyDialog },
    { label: "Bookmarks…", icon: "bookmark", run: bookmarksDialog },
    { label: "Time on sites…", icon: "clock", run: timeDialog },
    { label: "Blocked sites…", icon: "x", run: blockedDialog },
    { label: "Search shortcuts…", icon: "search", run: shortcutsDialog },
    { label: "Copy as Markdown link", icon: "link", run: () => t.url && navigator.clipboard?.writeText(`[${(t.title || host(t.url)).replace(/[[\]]/g, "")}](${t.url})`).then(() => toast("Markdown link copied.")) },
    { label: "Compare with my saved copy", icon: "list", run: compareSaved },
    { label: "All tabs…", icon: "grid", run: tabsDialog },
    { label: "Recently closed tabs (⌘⇧T)", icon: "back", run: closedDialog },
    { label: "Save for offline reading", icon: "download", run: saveOffline },
    { label: "Offline pages…", icon: "folder", run: offlineDialog },
    { label: AS.on ? "Stop auto-scroll" : "Auto-scroll (hands-free reading)", icon: "play", run: autoScroll },
    { label: "Pop out video (picture-in-picture)", icon: "expand", run: popOutVideo },
    { label: "Video speed…", icon: "play", run: videoSpeed },
    { label: localStorage.getItem("kitsune.webDarkNight") === "1" ? "Dark pages at night: on" : "Dark pages at night: off", icon: "moon", run: () => { const on = localStorage.getItem("kitsune.webDarkNight") !== "1"; try { localStorage.setItem("kitsune.webDarkNight", on ? "1" : "0"); } catch {} toast(on ? "Pages turn dark at night (follows Settings → Dark at night, or 8 pm to 7 am)." : "Pages keep their own colours at night."); go(T().url, { push: false }); } },
    { label: "QR code for this page", icon: "grid", run: qrDialog },
    { label: "Site settings…", icon: "sliders", run: siteSettings },
    { label: "Print or save as PDF", icon: "download", run: printPage },
    { label: "Copy page as Markdown", icon: "edit", run: copyMarkdown },
    { label: "Save tabs as a session…", icon: "bookmark", run: saveSession },
    { label: "Sessions…", icon: "folder", run: sessionsDialog },
    { label: "Page note…", icon: "edit", run: pageNoteDialog },
    { label: "All page notes…", icon: "list", run: allPageNotes },
    { label: "Remove an element (zapper)", icon: "x", run: zapMode },
    { label: "Reveal hidden content", icon: "expand", run: revealHidden },
    { label: "Reader appearance…", icon: "type", run: readerLookDialog },
    { label: "Speed reader", icon: "play", run: speedReader },
    { label: READ_LOOK().bold ? "Bold-start reading: off" : "Bold-start reading: on", icon: "type", run: toggleBoldStart },
    { label: "All links on this page…", icon: "link", run: linksDialog },
    { label: "Download all pictures (ZIP)", icon: "download", run: downloadPictures },
    { label: "Watch this page for changes", icon: "clock", run: watchPage },
    { label: "All highlights…", icon: "highlight", run: allHighlights },
    { label: "Developer tools (requests, errors)", icon: "list", run: devPanel },
    { label: "View page source", icon: "type", run: viewSource },
    { label: "Archive this page (Wayback Machine)", icon: "clock", run: () => T().url && window.open("https://web.archive.org/save/" + T().url, "_blank", "noopener") },
    { label: "Cookies and site data…", icon: "sliders", run: cookieManager },
    { label: "Userscripts and styles…", icon: "edit", run: () => US.manager({ url: T().url || "" }).then(() => {}) },
    { label: "Daemons (watch pages, feeds, scripts)…", icon: "clock", run: async () => (await import("../daemons.js")).manager(T().url || "") },
    { label: "Extensions: export or import…", icon: "download", run: extensionsHub },
    { label: "Page info", icon: "list", run: pageInfo },
    { label: mobileFor(T().url || "") ? "Request the desktop site" : "Request the mobile site", icon: "sliders", run: () => { setMobile(T().url || "", !mobileFor(T().url || "")); go(T().url, { push: false }); } },
    { label: "Save to my library", icon: "plus", run: saveToLibrary },
    { label: "Read later (S)", icon: "bookmark", run: readLater },
    { label: "Make a book from my reading list…", icon: "book", run: makeBookDialog },
    { label: "Bigger text", icon: "type", run: () => zoomBy(0.1) },
    { label: "Smaller text", icon: "type", run: () => zoomBy(-0.1) },
    ...(feed ? [{ label: "Follow in Comics (from its feed)", icon: "comics", run: () => followFeed(new URL(feed.getAttribute("href"), t.data.url).href, t.title) }] : []),
    { label: autoEmbed() ? "Stop turning media links into players" : "Turn media links into players", icon: "play", run: () => { try { localStorage.setItem("kitsune.webAutoEmbed", autoEmbed() ? "0" : "1"); } catch {} if (T().data) paint(T()); } },
    { label: "Copy link", icon: "link", run: () => navigator.clipboard?.writeText(t.url).then(() => toast("Link copied.")) },
    { label: "Open in your browser", icon: "globe", run: () => t.url && window.open(t.url, "_blank", "noopener") },
    ...li("WP", { T, root: () => contentRoot(), host, B, go, showTab, newTab, persistTabs }),
    ...WP4.items(wp4ctx()),
    ...li("WP8", { T, go }),
    ...WCODE.items({ T, root: () => contentRoot(), markdown }),
    ...li("WCODE2", { T, root: () => contentRoot() }),
    ...WP9.items({ B }),
    ...li("WL", { T, B }),
    ...li("WP16", { T }),
    ...li("WP17", { T, go }),
    ...li("WP18", { T, go, root: () => contentRoot() }),
    ...li("WP21", { root: () => contentRoot() }),
    ...li("WP22", { T }),
    ...li("WP23", { T, root: () => contentRoot() }),
    ...li("WP24", { T, root: () => contentRoot() }),
    ...li("WP25", { T, go }),
    ...li("WP26", { T, root: () => contentRoot(), go }),
    ...li("WP20", { T, B, go, root: () => contentRoot(), scroller: () => scrollerNow() }),
    ...li("WP19", { T, B, go, root: () => contentRoot(), scroller: () => scrollerNow() }),
    ...li("WP15", { T, go, root: () => contentRoot() }),
    ...li("WP14", { T, root: () => contentRoot() }),
    ...li("WP13", { T, B, root: () => contentRoot(), refilter: () => { try { return LZ.WP13.filterPage(contentRoot()); } catch { return 0; } } }),
    ...li("WP12", { T, B, showTab, getSel: () => { const r = contentRoot(); return r?.getSelection ? r.getSelection() : getSelection(); } }),
    ...li("WP11", { T, B, go }),
    ...li("WP10", { T, B, go, selText: () => selText(contentRoot()), drawTabs, persistTabs }),
    { label: localStorage.getItem("kitsune.webProgressive") === "1" ? "Load big pages in pieces: on (turn off)" : "Load big pages in pieces: off (turn on)", icon: "pages", run: () => { const on = localStorage.getItem("kitsune.webProgressive") === "1"; try { on ? localStorage.removeItem("kitsune.webProgressive") : localStorage.setItem("kitsune.webProgressive", "1"); } catch {} toast(on ? "Big pages are drawn all at once." : "Very big pages are now drawn top to bottom in pieces, so the start appears sooner. Applies to the next page you open."); } },
    { label: `Page cache: ${WCache.stats().pages} pages, ${WCache.stats().mb} MB (clear)`, icon: "trash", run: () => { WCache.clear(); toast("Page cache cleared."); } },
    { label: localStorage.getItem("kitsune.webNoPrefetch") === "1" ? "Load links ahead: off (turn on)" : "Load links ahead: on (turn off)", icon: "play", run: () => { const off = localStorage.getItem("kitsune.webNoPrefetch") === "1"; try { off ? localStorage.removeItem("kitsune.webNoPrefetch") : localStorage.setItem("kitsune.webNoPrefetch", "1"); } catch {} toast(off ? "Links on the same site load ahead when you point at them." : "Links won't load ahead."); } },
    ...pg().menu,
    ...li("WP7", { T, root: () => contentRoot(), host, go }),
    ...li("WP6", { T, root: () => contentRoot(), scroller: () => scrollerNow(), host, B, go, find: () => findInPage(), keys: () => li("WP2", { T, root: () => contentRoot(), scroller: () => scrollerNow(), host, B, go }).find((x) => x.label === "Keyboard shortcuts").run() }),
    ...li("WP5", { T, host, B, go, showTab, newTab, persistTabs, defaults: DIAL, refreshStart: () => { if (!T().url) startPage(); } }),
    ...li("WP3", { T, root: () => contentRoot(), host, B, go, showTab }),
    ...li("WP2", { T, root: () => contentRoot(), scroller: () => scrollerNow(), host, B, go }),
    { label: "Default search engine…", icon: "sliders", run: () => { T().url = null; showTab(); } },
  ];
}
async function menu() { const { menu } = await import("../util.js"); await lazyMods(); menu($("#kb-menu", B.view), menuItems()); }
function zoomBy(d) { const t = T(); t.zoom = Math.max(0.6, Math.min(2, +(t.zoom + d).toFixed(2))); setSiteZoom(host(t.url || ""), t.zoom); toast(`Text size ${Math.round(t.zoom * 100)}% on ${host(t.url || "")}`, { ms: 1600 }); $("#kb-page", B.view)?.style.setProperty("--kbz", t.zoom); $("#kb-reader", B.view)?.style.setProperty("--kbz", t.zoom); }
async function followFeed(url, name) {
  const prefs = { follow: [], custom: [], ...((await kvGet("comicFeeds", null)) || {}) };
  if (!prefs.follow.length) prefs.follow = ["xkcd", "oatmeal", "webcomicname", "sarah", "loadingartist", "exocomics", "savagechickens", "buttersafe"];
  const { loadFeed } = await import("./comics.js");
  const f = { id: "c-" + host(url).replace(/\W/g, "") + "-" + Math.random().toString(36).slice(2, 6), name: name.split(/[|·–—]/)[0].trim().slice(0, 40), by: "", url, site: new URL(url).origin, custom: true, hue: Math.floor(Math.random() * 360) };
  try { const items = await loadFeed(f, { fresh: true }); if (!items.length) return toast("That site's feed has no pictures, so it isn't a webcomic Kitsune can show."); }
  catch (e) { return toast(e.message); }
  prefs.custom.push(f); prefs.follow.push(f.id); await kvSet("comicFeeds", prefs);
  toast(`Following ${f.name} in Comics.`, { action: "Open", onAction: () => (location.hash = "comics") });
}

// ---------- address suggestions ----------
async function suggest(q) {
  const box = $("#kb-sugg", B.view); q = q.trim().toLowerCase();
  if (!q) { box.hidden = true; return; }
  const [hist, marks, engines] = await Promise.all([store.history(), store.marks(), store.engines()]);
  const rows = [];
  const site = q.match(/@(\S*)$/)?.[1];
  if (site != null) Object.values(engines || {}).filter((e) => e.host.includes(site)).slice(0, 5).forEach((e) => rows.push({ kind: "Search", label: `${q.replace(/@\S*$/, "").trim() || "…"} @${e.host}`, value: `${q.replace(/@\S*$/, "").trim()} @${e.host}` }));
  const kw = q.split(" ")[0], e = Object.values(engines || {}).find((x) => x.keyword === kw);
  if (e && q.includes(" ")) rows.push({ kind: e.name, label: `Search ${e.name} for “${q.slice(kw.length + 1)}”`, value: q });
  [...(marks || []), ...(hist || [])].filter((h) => h.url.toLowerCase().includes(q) || (h.title || "").toLowerCase().includes(q)).slice(0, 6).forEach((h) => rows.push({ kind: "Page", label: h.title, sub: host(h.url), value: h.url }));
  rows.push({ kind: ENGINES[defaultEngine()].name, label: `Search for “${q}”`, value: q });
  instantAnswer(q, box);
  box.innerHTML = rows.map((r, i) => `<button type="button" role="option" data-sv="${esc(r.value)}" class="${i === 0 ? "on" : ""}"><em>${esc(r.kind)}</em><span>${esc(r.label)}</span>${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</button>`).join("");
  box.hidden = false;
}

// ---------- wiring ----------
function wire(view) {
  const url = $("#kb-url", view);
  $("#kb-addr", view).onsubmit = (e) => { e.preventDefault(); $("#kb-sugg", view).hidden = true; const on = $("#kb-sugg .on", view); go(!$("#kb-sugg", view).hidden && on ? on.dataset.sv : url.value); url.blur(); };
  url.addEventListener("input", debounce(() => suggest(url.value), 120));
  url.addEventListener("focus", () => url.select());
  url.addEventListener("blur", () => setTimeout(() => ($("#kb-sugg", view).hidden = true), 150));
  url.addEventListener("keydown", (e) => {
    const box = $("#kb-sugg", view); if (box.hidden) return;
    const opts = $$("button", box), i = opts.findIndex((o) => o.classList.contains("on"));
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); const n = (i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length; opts.forEach((o, k) => o.classList.toggle("on", k === n)); url.value = opts[n].dataset.sv; }
    if (e.key === "Escape") { box.hidden = true; }
  });
  $("#kb-sugg", view).addEventListener("mousedown", (e) => { const b = e.target.closest("[data-sv]"); if (b) { e.preventDefault(); $("#kb-sugg", view).hidden = true; go(b.dataset.sv); } });
  view.addEventListener("click", async (e) => {
    const tab = e.target.closest("[data-tab]"), close = e.target.closest("[data-close]");
    if (close && close.closest("#kb-tabs") && B.tabs[Number(close.dataset.close)]?.pinned) { e.stopPropagation(); return toast("Unpin this tab first (double-click it)."); }
    if (close && close.closest("#kb-tabs")) { e.stopPropagation(); const i = Number(close.dataset.close); rememberClosed(B.tabs[i]); $(`#kbf-${B.tabs[i].id}`)?.remove(); B.tabs.splice(i, 1); if (!B.tabs.length) B.tabs.push(newTab(null)); B.active = Math.min(B.active >= i ? Math.max(0, B.active - 1) : B.active, B.tabs.length - 1); persistTabs(); return showTab(); }
    if (tab) { B.active = Number(tab.dataset.tab); return showTab(); }
    const g = e.target.closest("[data-go]"); if (g) return go(g.dataset.go);
    const en = e.target.closest("[data-engine]"); if (en) { localStorage.setItem("kitsune.webEngine", en.dataset.engine); $$("[data-engine]", view).forEach((x) => x.setAttribute("aria-checked", String(x === en))); return; }
    const fg = e.target.closest("[data-forget]"); if (fg) { e.stopPropagation(); const all = { ...((await store.engines()) || {}) }; delete all[fg.dataset.forget]; await kvSet("webEngines", all); return startPage(); }
    const eh = e.target.closest("[data-engine-host]"); if (eh) { $("#kb-url", view).value = `${(await store.engines())[eh.dataset.engineHost].keyword} `; return $("#kb-url", view).focus(); }
    const im = e.target.closest("[data-import]"); if (im) { im.disabled = true; im.textContent = "Downloading…"; try { await importFile(im.dataset.import, im.dataset.name); } catch (err) { toast(err.message); } im.disabled = false; return; }
    const ws = e.target.closest("[data-websearch]"); if (ws) return go(host(ws.dataset.websearch) + " " + decodeURIComponent(new URL(ws.dataset.websearch).pathname.split("/").filter(Boolean).pop() || ""));
    const md = e.target.closest("[data-mode]"); if (md) {
      const t = T(); if (t.mode === md.dataset.mode) return;
      const h = host(t.url || "");
      if (t.mode === "live" && liveSites().has(h)) setLiveSite(h, false);
      t.mode = md.dataset.mode; syncBar(); if (t.data) paint(t);
      if (t.mode === "live" && h) toast("Live: this page's JavaScript is running in a sealed sandbox that can't see Kitsune or your data.", { action: `Always for ${h}`, onAction: () => setLiveSite(h, true), ms: 7000 });
      return;
    }
    const b = e.target.closest("[data-b]")?.dataset.b; if (!b) return;
    const t = T();
    if (b === "back" && t.idx > 0) { t.idx--; return go(t.hist[t.idx], { push: false }); }
    if (b === "fwd" && t.idx < t.hist.length - 1) { t.idx++; return go(t.hist[t.idx], { push: false }); }
    if (b === "reload" && t.url) return go(t.url, { push: false, fresh: true });
    if (b === "newtab") { B.tabs.push(newTab(null)); B.active = B.tabs.length - 1; await showTab(); return $("#kb-bigq", view)?.focus(); }
    if (b === "sitesearch") return siteSearchDialog();
    if (b === "menu") return menu();
    if (b === "media") return mediaPanel();
    if (b === "shield") return shieldPanel();
    if (b === "focus") return toggleFocusMode();
    if (b === "userscripts") return usPanel();
    if (b === "follow") return followToggle();
    if (b === "later") return readLater();
    if (b === "makebook") return makeBookDialog();
    if (b === "feeds") return manageFeeds();
    if (b === "wayback") return waybackDialog();
    if (b === "editdial") return lazyMods().then(() => li("WP5", { T, host, B, go, showTab, newTab, persistTabs, defaults: DIAL, refreshStart: () => { if (!T().url) startPage(); } })[1].run());
    if (b === "another") return WP4.items(wp4ctx())[0].run();
    if (b === "outline") return toggleOutline();
    if (b === "save") return saveToLibrary();
    if (b === "clearhist") { await kvSet("webHistory", []); return startPage(); }
    if (b === "mark" && t.url) {
      const m = (await store.marks()) || [], i = m.findIndex((x) => x.url === t.url);
      if (i >= 0) m.splice(i, 1); else m.unshift({ url: t.url, title: t.title, t: Date.now() });
      await kvSet("webBookmarks", m); syncBar(); toast(i >= 0 ? "Bookmark removed." : "Bookmarked. It's on the new tab page.");
    }
  });
}
addEventListener("keydown", (e) => {
  if (!B.view?.isConnected || !location.hash.startsWith("#web")) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && (e.key === "l" || e.key === "L")) { e.preventDefault(); $("#kb-url", B.view)?.focus(); }
  else if (mod && e.shiftKey && (e.key === "t" || e.key === "T")) { e.preventDefault(); reopenClosed(); }
  else if (mod && (e.key === "t" || e.key === "T")) { e.preventDefault(); $("[data-b=newtab]", B.view)?.click(); }
  else if (mod && e.shiftKey && (e.key === "a" || e.key === "A")) { e.preventDefault(); tabsDialog(); }
  else if (mod && e.shiftKey && (e.key === "p" || e.key === "P")) { e.preventDefault(); commandPalette(""); }
  else if (mod && e.shiftKey && (e.key === "f" || e.key === "F")) { e.preventDefault(); siteSearchDialog(); }
  else if (mod && (e.key === "f" || e.key === "F")) { e.preventDefault(); findInPage(); }
  else if (!mod && !e.altKey && !e.target.matches?.("input, textarea, select, [contenteditable]") && !document.querySelector(".modal, #kb-lb, #kb-hints")) {
    if (e.key === "f" || e.key === "F") { e.preventDefault(); linkHints(e.shiftKey); }
    else if (e.key === "s" || e.key === "S") { e.preventDefault(); readLater(); }
    else if (e.key === "o" || e.key === "O") { e.preventDefault(); toggleOutline(); }
    else if (e.key === "j" || e.key === "k") { const sc = scrollerNow(); if (sc) { e.preventDefault(); sc.scrollBy({ top: (e.key === "j" ? 1 : -1) * sc.clientHeight * 0.45, behavior: "smooth" }); } }
    else if (e.key === "G") { const sc = scrollerNow(); if (sc) { e.preventDefault(); sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" }); } }
    else if (e.key === "g") { if (Date.now() - (B.gAt || 0) < 600) { scrollerNow()?.scrollTo({ top: 0, behavior: "smooth" }); B.gAt = 0; } else B.gAt = Date.now(); }
    else if (e.key === "Escape" && SAY.on) { e.preventDefault(); stopSay(); }
  }
  else if (e.altKey && /^[1-9]$/.test(e.key)) { e.preventDefault(); const i = e.key === "9" ? B.tabs.length - 1 : +e.key - 1; if (B.tabs[i]) { B.active = i; showTab(); } }
  else if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); $("[data-b=back]", B.view)?.click(); }
  else if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); $("[data-b=fwd]", B.view)?.click(); }
});
void plural;

// ---------- embeds, media and pictures ----------
const autoEmbed = () => localStorage.getItem("kitsune.webAutoEmbed") !== "0";
const POSTS = "blockquote.twitter-tweet, blockquote.instagram-media, blockquote.tiktok-embed, blockquote.bluesky-embed, blockquote.mastodon-embed, blockquote[data-instgrm-permalink], blockquote.reddit-embed-bq";
// Turns a page's embeds into cards, before the page is cleaned: frames, social posts, and links that stand alone.
export function buildEmbeds(doc, abs) {
  let n = 0;
  doc.querySelectorAll("iframe, embed[src], object[data]").forEach((f) => {
    const src = abs(f.getAttribute("src") || f.getAttribute("data-src") || f.getAttribute("data-lazy-src") || f.getAttribute("data") || "");
    if (!/^https?:/.test(src)) { f.remove(); return; }
    const info = E.classify(src) || E.generic(src);
    // a frame's own label is often just "YouTube video player"; the real title comes from the service
    const label = (f.getAttribute("title") || "").trim();
    f.replaceWith(E.card(doc, info, { title: /player|embed|iframe|^video$|^audio$|^(youtube|vimeo|spotify|soundcloud)$/i.test(label) ? "" : label })); n++;
  });
  doc.querySelectorAll(POSTS).forEach((bq) => {
    const links = [...bq.querySelectorAll("a[href]")].map((a) => abs(a.getAttribute("href"))).concat(abs(bq.getAttribute("data-instgrm-permalink") || bq.getAttribute("cite") || ""));
    const info = links.map((u) => E.classify(u)).find((x) => x && x.kind === "post") || links.map((u) => E.classify(u)).find(Boolean);
    if (!info) return;
    const text = [...bq.querySelectorAll("p")].map((p) => p.textContent.trim()).filter(Boolean).join("\n\n") || bq.textContent.trim();
    bq.replaceWith(E.card(doc, info, { text: text.slice(0, 600) })); n++;
  });
  if (autoEmbed()) {
    // a paragraph that is nothing but a link to a video, song or post gets a player under it
    let added = 0;
    for (const a of doc.querySelectorAll("p > a[href], li > a[href], div > a[href]")) {
      if (added >= 16) break;
      const p = a.parentElement;
      if (p.closest(".kbx, nav, header, footer, aside, [role=navigation]") || p.textContent.trim() !== a.textContent.trim() || a.querySelector("img")) continue;
      const info = E.classify(abs(a.getAttribute("href")));
      if (!info || info.kind === "map" || info.provider === "twitch" && !/videos/.test(a.href)) continue;
      p.after(E.card(doc, info, { title: /^https?:/.test(a.textContent.trim()) ? "" : a.textContent.trim() })); added++; n++;
    }
  }
  doc.querySelectorAll("video, audio").forEach(() => n++);
  return n;
}
function embedClick(e) {
  const btn = e.composedPath().find((n) => n.dataset && ("kbxPlay" in n.dataset || "kbxPop" in n.dataset || "kbxOut" in n.dataset));
  if (!btn) return false;
  const c = btn.closest(".kbx"), info = JSON.parse(c.dataset.kbx), title = c.querySelector(".kbx-title")?.textContent || "";
  if ("kbxOut" in btn.dataset) { e.preventDefault(); window.open(info.page, "_blank", "noopener"); return true; }
  e.preventDefault();
  if ("kbxPop" in btn.dataset) { E.popOut(info, title); toast("Playing in the mini player. It keeps going while you browse."); return true; }
  E.playInline(c);
  return true;
}
// Pictures open in the viewer: ones that aren't links, and ones whose link only leads to a bigger copy of
// themselves (a full-size file, or an image page such as Wikipedia's File: pages).
const IMG_FILE = /\.(jpe?g|png|gif|webp|avif|svg)(\?|#|$)/i;
function markZoomable(root) {
  for (const im of root.querySelectorAll("img")) {
    if (im.closest("button, .kbx")) continue;
    const a = im.closest("a[href]");
    if (a) {
      const imageOnly = !a.textContent.trim() && a.querySelectorAll("img").length === 1;
      const toImage = IMG_FILE.test(a.href) || /\/(File|Image|Datei|Fichier|Archivo):|\/media\//i.test(a.href) || /lightbox|zoom|gallery|image|mw-file/i.test(a.className + " " + (a.rel || ""));
      if (!imageOnly || !toImage) continue;
      im.dataset.zoomLink = "1";
    }
    im.classList.add("kb-zoomable");
  }
}
function fullSize(im) {
  const a = im.closest("a[href]");
  if (a && IMG_FILE.test(a.href) && !/\/(File|Image):/i.test(a.href)) return a.href;
  const src = im.currentSrc || im.src;
  // Wikimedia thumbnails (old and new addresses): ask for a large one; the viewer falls back if it doesn't exist
  if (/^https:\/\/(upload|thumb)\.wikimedia\.org\/.+\/thumb\/.+\/\d+px-[^/]+$/.test(src)) return src.replace(/\/\d+px-([^/]+)$/, "/1280px-$1");
  const best = (im.getAttribute("srcset") || "").split(",").map((p) => p.trim().split(/\s+/)).filter((p) => p[0]).sort((x, y) => parseFloat(y[1] || 0) - parseFloat(x[1] || 0))[0]?.[0];
  return best || src;
}
function pageImages(root) {
  return [...root.querySelectorAll("img.kb-zoomable")].filter((im) => (im.naturalWidth || Number(im.getAttribute("width")) || 200) >= 120)
    .map((im) => { const full = fullSize(im); return { el: im, src: full, fallback: im.currentSrc || im.src, alt: im.alt || im.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || "", full }; });
}
function paintMediaCount(root) {
  const t = T(), btn = $("#kb-media", B.view); if (!btn) return;
  const imgs = pageImages(root).length, n = (t.mediaCount || 0);
  const files = pageFiles(root).length;
  btn.hidden = !(n || imgs > 1 || files);
  $("#kb-media-n", B.view).textContent = n ? String(n) : "";
  btn.title = `${n ? `${n} ${n === 1 ? "video, song or post" : "videos, songs and posts"}` : ""}${n && imgs ? " and " : ""}${imgs ? `${imgs} pictures` : ""} on this page`;
}
// Everything playable or viewable on the page, in one place.
function mediaPanel() {
  const root = $("#kb-page", B.view)?.shadowRoot || $("#kb-reader", B.view);
  if (!root) return;
  const cards = [...root.querySelectorAll(".kbx")], natives = [...root.querySelectorAll("video, audio")], imgs = pageImages(root), files = pageFiles(root);
  const m = modal({ title: "On this page", wide: true, body: `
    ${cards.length ? `<h4 class="kb-mh">Videos, music and posts</h4><div class="kb-mlist">${cards.map((c, i) => { const info = JSON.parse(c.dataset.kbx), th = c.querySelector(".kbx-thumb")?.src || info.thumb; return `<div class="kb-mrow" style="--pc:${info.color}">
      <span class="kb-mthumb">${th ? `<img src="${esc(th)}" alt="" referrerpolicy="no-referrer">` : ""}</span>
      <span class="kb-mtxt"><small>${esc(info.name)}</small><strong>${esc(c.querySelector(".kbx-title")?.textContent || c.querySelector(".kbx-text")?.textContent?.slice(0, 80) || info.page)}</strong></span>
      <span class="kb-macts"><button class="btn btn-sm" type="button" data-mjump="${i}">Show</button><button class="btn btn-sm btn-accent" type="button" data-mpop="${i}">${icon("play")}Mini player</button></span></div>`; }).join("")}</div>` : ""}
    ${natives.length ? `<h4 class="kb-mh">Video and audio files</h4><div class="kb-mlist">${natives.map((v, i) => `<div class="kb-mrow"><span class="kb-mthumb">${icon(v.tagName === "VIDEO" ? "play" : "headphones")}</span><span class="kb-mtxt"><small>${v.tagName === "VIDEO" ? "Video" : "Audio"}</small><strong>${esc((v.currentSrc || v.querySelector("source")?.src || "").split("/").pop() || "Media")}</strong></span>
      <span class="kb-macts"><button class="btn btn-sm" type="button" data-njump="${i}">Show</button>${v.tagName === "VIDEO" && document.pictureInPictureEnabled ? `<button class="btn btn-sm btn-accent" type="button" data-npip="${i}">Picture in picture</button>` : ""}</span></div>`).join("")}</div>` : ""}
    ${imgs.length ? `<h4 class="kb-mh">Pictures <span class="muted">${imgs.length}</span></h4><div class="kb-mgrid">${imgs.slice(0, 120).map((im, i) => `<button type="button" data-mimg="${i}"><img src="${esc(im.src)}" alt="${esc(im.alt || "")}" loading="lazy" referrerpolicy="no-referrer"></button>`).join("")}</div>` : ""}
    ${files.length ? `<h4 class="kb-mh">Files · ${files.length}${files.some((f) => /\.(epub|pdf|cbz)$/i.test(f.name)) ? ` <button class="btn btn-sm btn-accent" type="button" id="kb-fall" style="margin-left:8px">${icon("plus")}Add all books</button>` : ""}</h4><div class="kb-mlist">${files.slice(0, 40).map((f, i) => `<div class="kb-mrow"><span class="kb-mthumb kb-ftype">${esc(f.ext.toUpperCase())}</span><span class="kb-mtxt"><small>${esc(f.ext)}</small><strong>${esc(f.label)}</strong></span><span class="kb-macts">${/^(epub|pdf|cbz)$/.test(f.ext) ? `<button class="btn btn-sm" type="button" data-fadd="${i}">${icon("plus")}Add</button>` : ""}<a class="btn btn-sm" href="${esc(f.url)}" target="_blank" rel="noopener">Download</a></span></div>`).join("")}</div>` : ""}
    ${!cards.length && !natives.length && !imgs.length && !files.length ? `<p class="muted">Nothing to play or look at on this page.</p>` : ""}` });
  m.root.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.mjump) { m.close(); cards[+b.dataset.mjump].scrollIntoView({ behavior: "smooth", block: "center" }); }
    if (b.dataset.mpop) { const c = cards[+b.dataset.mpop]; E.popOut(JSON.parse(c.dataset.kbx), c.querySelector(".kbx-title")?.textContent || ""); m.close(); }
    if (b.dataset.njump) { m.close(); natives[+b.dataset.njump].scrollIntoView({ behavior: "smooth", block: "center" }); }
    if (b.dataset.npip) { const v = natives[+b.dataset.npip]; try { await v.play(); await v.requestPictureInPicture(); m.close(); } catch { toast("This video can't go picture in picture."); } }
    if (b.dataset.mimg) { m.close(); E.lightbox(imgs, +b.dataset.mimg); }
    if (b.dataset.fadd) { b.disabled = true; b.textContent = "Adding…"; try { await importFile(files[+b.dataset.fadd].url, files[+b.dataset.fadd].name); b.textContent = "Added"; } catch (err) { b.textContent = "Couldn't add"; toast(err.message); } }
    if (b.id === "kb-fall") { b.disabled = true; let n = 0; for (const [i, f] of files.entries()) { if (!/\.(epub|pdf|cbz)$/i.test(f.name)) continue; b.textContent = `Adding ${++n}…`; try { await importFile(f.url, f.name); $(`[data-fadd="${i}"]`, m.root)?.replaceWith(Object.assign(document.createElement("span"), { className: "pill", textContent: "Added" })); } catch {} } b.textContent = `Added ${n}`; }
  });
}

// =====================================================================
// v72: shield, dark pages, time travel, outline, link hints, read aloud,
// translation and history
// =====================================================================

// ---------- privacy shield ----------
const TRACK = /^(utm_[a-z]+|fbclid|gclid|gclsrc|dclid|msclkid|yclid|twclid|igshid|mc_cid|mc_eid|_hsenc|_hsmi|mkt_tok|oly_anon_id|oly_enc_id|vero_id|vero_conv|ref_src|ref_url|s_cid|wickedid|__s|_ga|_gl|trk|trkCampaign|spm|scm|share_id|si)$/i;
const shieldOff = () => { try { return new Set(JSON.parse(localStorage.getItem("kitsune.shieldOff") || "[]")); } catch { return new Set(); } };
const shieldOn = (t) => !shieldOff().has(host(t.url || ""));
function cleanUrl(u, t) {
  if (!u || !/^https?:/.test(u)) return u;
  try {
    const x = new URL(u);
    if (t?.shield && x.hostname && x.hostname !== new URL(t.url).hostname) t.shield.hosts.add(x.hostname.replace(/^www\./, ""));
    if (!t?.shield?.on || !x.search) return u;
    let n = 0;
    for (const k of [...x.searchParams.keys()]) if (TRACK.test(k)) { x.searchParams.delete(k); n++; }
    if (!n) return u;
    t.shield.trackers += n;
    return x.href;
  } catch { return u; }
}
// Cookie walls, consent pop-ups, newsletter nags and ad slots, by the names sites give them.
const CLUTTER = [
  "#onetrust-banner-sdk", "#onetrust-consent-sdk", ".onetrust-pc-dark-filter", "#CybotCookiebotDialog", "#cookiebanner", "#cookie-banner", "#cookie-notice", "#cookie-law-info-bar", "#cookieConsent", ".cookie-banner", ".cookie-notice", ".cookie-consent", ".cookieconsent", ".cc-window", ".cc-banner",
  "#didomi-host", ".didomi-popup", "#usercentrics-root", "#qc-cmp2-container", ".qc-cmp2-container", "[id^=sp_message_container]", ".fc-consent-root", "#truste-consent-track", ".truste_overlay", "#gdpr-banner", ".gdpr-banner", ".consent-banner", "#consent-banner", ".cmp-banner", "#cmpbox", "#cmpbox2",
  ".newsletter-popup", ".newsletter-modal", ".subscribe-popup", ".popup-overlay", ".modal-backdrop", ".signup-modal", "#newsletter-modal", ".mailchimp-popup", ".mc-modal", ".tp-modal", ".tp-backdrop", ".fancybox-overlay",
  ".adsbygoogle", "ins.adsbygoogle", ".ad-slot", ".ad-container", ".ad-unit", ".advert", ".advertisement", "[id^=div-gpt-ad]", "[id^=google_ads]", ".dfp-ad", ".taboola", "#taboola-below-article", ".OUTBRAIN", ".outbrain", ".mgid", "[data-ad-slot]", "[data-google-query-id]",
].join(",");
function hideClutter(doc) { let n = 0; try { doc.querySelectorAll(CLUTTER).forEach((el) => { el.remove(); n++; }); } catch {} return n; }
// After drawing: anything still pinned over the page that reads like a nag gets hidden too.
function overlayKiller(root, t) {
  if (!t.shield?.on) return;
  const vw = innerWidth, vh = innerHeight;
  for (const el of root.querySelectorAll("div, section, aside, dialog, form")) {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
    const r = el.getBoundingClientRect(), area = (r.width * r.height) / (vw * vh);
    const text = (el.textContent || "").slice(0, 600);
    const naggy = /cookie|consent|gdpr|privacy settings|accept all|we use|subscribe|newsletter|sign up|disable (your )?ad ?block|turn off/i.test(text);
    if ((naggy && area > 0.02) || (area > 0.55 && cs.position === "fixed")) { el.classList.add("kb-hide"); t.shield.banners++; }
  }
  // a hidden wall often leaves the page unscrollable; let it scroll again
  root.querySelectorAll(".kb-html, .kb-body").forEach((el) => { el.style.overflow = "visible"; });
}
function afterRender(root, hostEl, t) {
  { const _s = performance.now(); const _tab = t; setTimeout(() => { try { if (T() === _tab) pg().afterRender(); } catch {} }, 350); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "pg", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); try { WCODE.enhance(root); } catch {} if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "enhance", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); try { if (t.url) WCache.watchLinks(root, t.url, async (u) => { const ch = await cookieHeaders(u); if (ch["X-KB-Cookie"]) return null; return api("browse?url=" + encodeURIComponent(u)); }); } catch {} if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "watchLinks", Math.round(performance.now() - _s)); }
  try { setTimeout(() => { if (T() === t && t.url && !cookiesAllowed(t.url)) import("../webplus11.js").then((m) => m.indexPage(t, { priv: settings.incognito })).catch(() => {}); }, 2500); } catch {}
  try { setTimeout(() => { if (T() === t) import("../webplus16.js").then((m) => m.afterRender({ t, B })).then(() => import("../webplus17.js")).then((m) => m.afterRender({ t, B, go })).catch(() => {}); }, 600); } catch {}
  try { setTimeout(() => { if (T() === t) import("../webplus23.js").then((m) => m.afterRender({ root, t, B })).then(() => import("../webplus24.js")).then((m) => m.afterRender({ root, t, B })).then(() => import("../webplus25.js")).then((m) => m.afterRender({ t, B, go })).catch(() => {}); }, 1800); } catch {}
  try { if (localStorage.getItem("kitsune.webMagnifier") === "1") import("../webplus21.js").then((m) => m.magnifier(root)).catch(() => {}); } catch {}
  try { setTimeout(() => { if (T() === t) import("../webplus20.js").then((m) => m.renderStickies(root, t)).catch(() => {}); }, 400); } catch {}
  try { if (localStorage.getItem("kitsune.webParaFocus") === "1") import("../webplus19.js").then((m) => m.paragraphFocus(root, hostEl)).catch(() => {}); } catch {}
  try { import("../webplus15.js").then((m) => { m.applyComfort(root); setTimeout(() => { if (T() === t) m.afterRender({ t, B }); }, 500); }).catch(() => {}); } catch {}
  try { if (localStorage.getItem("kitsune.webFilterWords")?.length > 2) import("../webplus13.js").then((m) => m.filterPage(root)).catch(() => {}); } catch {}
  try { setTimeout(() => { if (T() === t) import("../webplus12.js").then((m) => m.afterRender({ root, t, hostEl, B })).catch(() => {}); }, 300); } catch {}
  try { if (t.url && t.url.includes("#:~:text=")) setTimeout(() => import("../webplus10.js").then((m) => m.applyFragment(root, t)).catch(() => {}), 450); } catch {}
  { const _s = performance.now(); setTimeout(() => { try { WP9.afterRender({ root, scroller: hostEl, B }); } catch {} }, 250); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "afterRender", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); applyZaps(root, t); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "applyZaps", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); userStylesInPage(root, t); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "userStylesInPage", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); readProgress(hostEl); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "readProgress", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); hostEl.classList.toggle("kb-dark", darkFor(t)); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "toggle", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); applySiteStyle(root, t); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "applySiteStyle", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); applyClips(root, t); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "applyClips", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); selectionBar(root, t); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "selectionBar", Math.round(performance.now() - _s)); }
  { const _s = performance.now(); swipeNav(hostEl); if (localStorage.getItem("kitsune.webPerf")) console.log("[perf] after:", "swipeNav", Math.round(performance.now() - _s)); }
  requestAnimationFrame(() => setTimeout(() => { overlayKiller(root, t); paintShield(t); }, 60));
  if (/(^|\.)web\.archive\.org$/.test(host(t.url))) timeBar(t);
  if (localStorage.getItem("kitsune.outline") === "1") showOutline();
}
function paintShield(t) {
  const b = $("#kb-shield", B.view); if (!b || !t.shield) return;
  const n = t.shield.on ? t.shield.trackers + t.shield.banners + t.shield.scripts : 0;
  b.hidden = false; b.classList.toggle("off", !t.shield.on);
  $("#kb-shield-n", B.view).textContent = t.shield.on ? (n > 99 ? "99+" : String(n || "")) : "off";
  if (t.shield.live) { $("#kb-shield-n", B.view).textContent = t.shield.trackers ? String(t.shield.trackers) : ""; b.title = `Live mode: the page's own scripts are running in a sandbox. ${t.shield.trackers} trackers blocked.`; return; }
  b.title = t.shield.on ? `Shield: ${t.shield.scripts} scripts, ${t.shield.trackers} tracking codes and ${t.shield.banners} banners removed` : "Shield is off for this site";
}
function shieldPanel() {
  const t = T(), s = t.shield; if (!s) return;
  const h = host(t.url), hosts = [...s.hosts].sort();
  const m = modal({ title: `Shield · ${h}`, body: `
    <div class="kb-sh-stats">
      <div><strong>${s.scripts}</strong><span>scripts never ran</span></div>
      <div><strong>${s.on ? s.trackers : "–"}</strong><span>tracking codes taken off links</span></div>
      <div><strong>${s.on ? s.banners : "–"}</strong><span>banners and pop-ups hidden</span></div>
      <div><strong>0</strong><span>cookies sent</span></div></div>
    <p class="hint">Kitsune fetches pages for you without cookies or your address, never runs their scripts, and holds embedded players back until you press play.</p>
    ${hosts.length ? `<h4 class="kb-mh">Other sites this page points to · ${hosts.length}</h4><div class="kb-sh-hosts">${hosts.slice(0, 60).map((x) => `<span>${esc(x)}</span>`).join("")}${hosts.length > 60 ? `<span>+${hosts.length - 60} more</span>` : ""}</div>` : ""}
    <label class="check" style="margin-top:14px"><input type="checkbox" id="kb-sh-on" ${s.on ? "checked" : ""}> Hide banners and strip tracking on ${esc(h)}</label>
    <h4 class="kb-mh" style="margin-top:16px">Cookies</h4>
    <label class="check"><input type="checkbox" id="kb-ck-on" ${cookiesAllowed(t.url) ? "checked" : ""}> Allow cookies on ${esc(regOf(host(t.url)))}, so it can remember you (sign-ins, settings, consent)</label>
    <p class="hint" id="kb-ck-n">Off by default. Cookies stay on this device and only go to ${esc(regOf(host(t.url)))}, through Kitsune's server, when you visit it.</p>
    <button class="btn btn-sm" type="button" id="kb-ck-clear">${icon("trash")}Clear this site's cookies</button>` });
  cookiesFor(regOf(host(t.url))).then((list) => { const n = $("#kb-ck-n", m.root); if (n && list.length) n.textContent = `${plural(list.length, "cookie")} kept for ${regOf(host(t.url))}. ` + n.textContent; });
  $("#kb-ck-on", m.root).onchange = (e) => { setCookiesAllowed(t.url, e.target.checked); toast(e.target.checked ? `Cookies on for ${regOf(host(t.url))}. Reload to sign in or keep your settings.` : `Cookies off for ${regOf(host(t.url))}. Kept ones stay until you clear them.`, { action: "Reload", onAction: () => go(t.url, { push: false }) }); };
  $("#kb-ck-clear", m.root).onclick = async () => { await clearCookies(regOf(host(t.url))); toast("Cookies cleared."); m.close(); };
  $("#kb-sh-on", m.root).onchange = (e) => {
    const off = shieldOff(); e.target.checked ? off.delete(h) : off.add(h);
    try { localStorage.setItem("kitsune.shieldOff", JSON.stringify([...off])); } catch {}
    m.close(); if (t.data) paint(t);
  };
}

// ---------- dark pages ----------
// "on" for every site, "off", or a list of sites you've darkened
function darkFor(t) { if (localStorage.getItem("kitsune.webDarkNight") === "1" && nightActive()) return true; const v = localStorage.getItem("kitsune.webDark") || ""; if (v === "all") return true; try { return JSON.parse(localStorage.getItem("kitsune.webDarkSites") || "[]").includes(host(t.url || "")); } catch { return false; } }
function toggleDark() {
  const t = T(), h = host(t.url || ""); if (!h) return;
  let list = []; try { list = JSON.parse(localStorage.getItem("kitsune.webDarkSites") || "[]"); } catch {}
  const on = !list.includes(h);
  list = on ? [...list, h] : list.filter((x) => x !== h);
  try { localStorage.setItem("kitsune.webDarkSites", JSON.stringify(list)); } catch {}
  $("#kb-page", B.view)?.classList.toggle("kb-dark", on);
  toast(on ? `${h} is dark now. Kitsune remembers it.` : `${h} is back to its own colours.`);
}

// ---------- time travel with the Wayback Machine ----------
async function waybackFor(url, year) {
  const r = await api(`feed?as=json&url=${encodeURIComponent(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}${year ? `&timestamp=${year}0701` : ""}`)}`);
  const c = r?.archived_snapshots?.closest;
  if (c?.available) return { url: c.url.replace(/^http:/, "https:"), ts: c.timestamp };
  // The lookup service sometimes gives up early. The archive itself still jumps to the copy nearest any date.
  const ts = year ? `${year}0701000000` : String(new Date().getFullYear()) + "1231235959";
  return { url: `https://web.archive.org/web/${ts}/${url}`, ts, approx: true };
}
const tsDate = (ts) => new Date(`${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
const originalOf = (u) => u.match(/web\.archive\.org\/web\/\d+[a-z_]*\/(.+)$/)?.[1] || u;
function waybackDialog() {
  const t = T(); if (!t.url) return toast("Open a page first.");
  const orig = originalOf(t.url), now = new Date().getFullYear(), years = Array.from({ length: now - 1996 + 1 }, (_, i) => now - i);
  const m = modal({ title: "Older versions", wide: true, body: `<p class="muted" style="margin-top:0">The Internet Archive's Wayback Machine has kept copies of much of the web since 1996. Pick a year to see <strong>${esc(host(orig))}</strong> as it was.</p>
    <div class="kb-years">${years.map((y) => `<button type="button" data-y="${y}">${y}</button>`).join("")}</div><p class="status" id="wb-s"></p>
    <button class="btn btn-accent" type="button" data-y="">${icon("clock")}The latest copy</button>` });
  m.root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-y]"); if (!b) return;
    const s = $("#wb-s", m.root); s.className = "status"; s.textContent = "Looking in the archive…";
    try {
      const snap = await waybackFor(orig, b.dataset.y);
      if (!snap) { s.className = "status err"; s.textContent = "The archive has no copy of this page."; return; }
      m.close(); go(snap.url);
      toast(snap.approx ? `Opening the copy nearest ${b.dataset.y || "today"}…` : `Showing the copy from ${tsDate(snap.ts)}.`);
    } catch (err) { s.className = "status err"; s.textContent = err.message; }
  });
}
// While you're in the archive: when this copy is from, and a step back or forward in time.
function timeBar(t) {
  const ts = t.url.match(/web\.archive\.org\/web\/(\d{8,14})/)?.[1]; if (!ts) return;
  $("#kb-timebar", B.view)?.remove();
  const bar = document.createElement("div"); bar.id = "kb-timebar"; bar.className = "kb-timebar";
  const y = +ts.slice(0, 4);
  bar.innerHTML = `${icon("clock")}<span>Archived copy from <strong>${tsDate(ts)}</strong></span>
    <button type="button" data-tb="${y - 1}">‹ ${y - 1}</button>${y < new Date().getFullYear() ? `<button type="button" data-tb="${y + 1}">${y + 1} ›</button>` : ""}
    <button type="button" data-tb="live">See it live</button><button type="button" data-tb="x" aria-label="Hide">×</button>`;
  $("#kb-body", B.view).append(bar);
  bar.onclick = async (e) => {
    const b = e.target.closest("[data-tb]"); if (!b) return;
    if (b.dataset.tb === "x") return bar.remove();
    if (b.dataset.tb === "live") return go(originalOf(t.url));
    const snap = await waybackFor(originalOf(t.url), b.dataset.tb).catch(() => null);
    if (snap) go(snap.url); else toast(`No copy from ${b.dataset.tb}.`);
  };
}

// ---------- outline ----------
function pageRoot() { return $("#kb-page", B.view)?.shadowRoot || $("#kb-reader", B.view); }
function toggleOutline() {
  if ($("#kb-outline", B.view)) { $("#kb-outline", B.view).remove(); localStorage.setItem("kitsune.outline", "0"); return; }
  localStorage.setItem("kitsune.outline", "1"); showOutline();
}
function showOutline() {
  const root = pageRoot(); if (!root) return;
  $("#kb-outline", B.view)?.remove();
  const hs = [...root.querySelectorAll("h1, h2, h3, h4")].filter((h) => h.textContent.trim() && h.getClientRects().length).slice(0, 200);
  const el = document.createElement("nav"); el.id = "kb-outline"; el.className = "kb-outline"; el.setAttribute("aria-label", "Page outline");
  el.innerHTML = `<header><strong>Outline</strong><button type="button" aria-label="Close outline">×</button></header>${hs.length ? `<ol>${hs.map((h, i) => `<li class="l${h.tagName[1]}"><button type="button" data-h="${i}">${esc(h.textContent.trim().replace(/\[edit\]$/i, "").slice(0, 90))}</button></li>`).join("")}</ol>` : `<p>This page has no headings.</p>`}`;
  $("#kb-body", B.view).append(el);
  el.onclick = (e) => {
    if (e.target.closest("header button")) return toggleOutline();
    const b = e.target.closest("[data-h]"); if (b) hs[+b.dataset.h].scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // keep the heading you're reading highlighted
  const io = new IntersectionObserver((es) => {
    for (const en of es) if (en.isIntersecting) { const i = hs.indexOf(en.target); $$("[data-h]", el).forEach((x) => x.classList.toggle("on", +x.dataset.h === i)); $(`[data-h="${i}"]`, el)?.scrollIntoView({ block: "nearest" }); }
  }, { root: $("#kb-page", B.view) || $("#kb-reader", B.view), rootMargin: "0px 0px -70% 0px" });
  hs.forEach((h) => io.observe(h));
}

// ---------- link hints: press F, then type the letters on a link ----------
function linkHints(newTab) {
  const root = pageRoot(); if (!root) return;
  const box = ($("#kb-page", B.view) || $("#kb-reader", B.view)).getBoundingClientRect();
  const links = [...root.querySelectorAll("a[href], button, [data-kbx-play]")].filter((a) => { const r = a.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > box.top && r.top < box.bottom && r.right > box.left && r.left < box.right; }).slice(0, 26 * 26);
  if (!links.length) return toast("No links in view.");
  const ABC = "asdfghjklqwertyuiopzxcvbnm", two = links.length > 26;
  const label = (i) => (two ? ABC[Math.floor(i / 26)] + ABC[i % 26] : ABC[i]);
  const layer = document.createElement("div"); layer.id = "kb-hints"; layer.className = "kb-hints";
  layer.innerHTML = links.map((a, i) => { const r = a.getBoundingClientRect(); return `<span data-l="${label(i)}" style="left:${Math.max(box.left, r.left) - 2}px;top:${Math.max(box.top, r.top) - 2}px">${label(i).toUpperCase()}</span>`; }).join("")
    + `<p class="kb-hints-tip">Type the letters on a link${newTab ? " to open it in a new tab" : ""}. Esc to cancel.</p>`;
  document.body.append(layer);
  let typed = "";
  const done = () => { layer.remove(); removeEventListener("keydown", key, true); };
  const key = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.key === "Escape") return done();
    if (e.key === "Backspace") typed = typed.slice(0, -1); else if (/^[a-z]$/i.test(e.key)) typed += e.key.toLowerCase(); else return;
    $$("span", layer).forEach((s) => s.classList.toggle("dim", !s.dataset.l.startsWith(typed)));
    const i = links.findIndex((_, k) => label(k) === typed);
    if (i >= 0) {
      done(); const a = links[i];
      if (a.tagName === "A" && newTab && /^https?:/.test(a.href)) go(a.href, { newTab: true });
      else a.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
    } else if (!links.some((_, k) => label(k).startsWith(typed))) done();
  };
  addEventListener("keydown", key, true);
}

// ---------- read the page aloud, word by word ----------
const SAY = { on: false, blocks: [], i: 0, bar: null };
function readAloud(from = 0) {
  if (!("speechSynthesis" in window)) return toast("Reading aloud isn't available in this browser.");
  const root = pageRoot(); if (!root) return;
  const main = root.querySelector("article, main, [role=main], .kb-art, #content, #mw-content-text") || root;
  SAY.blocks = [...main.querySelectorAll("h1, h2, h3, p, li, blockquote")].filter((b) => b.textContent.trim().length > 1 && b.getClientRects().length && !b.closest("nav, footer, aside, .kbx, .kb-hide"));
  if (!SAY.blocks.length) return toast("Nothing to read on this page.");
  SAY.on = true; SAY.i = from; SAY.root = root;
  SAY.bar?.remove();
  const bar = document.createElement("div"); bar.className = "kb-saybar"; bar.id = "kb-saybar";
  bar.innerHTML = `${icon("speak")}<span id="kb-say-pos"></span><button type="button" data-sy="prev" aria-label="Previous paragraph">‹</button><button type="button" data-sy="pause" aria-label="Pause">❚❚</button><button type="button" data-sy="next" aria-label="Next paragraph">›</button>
    <select id="kb-say-rate" aria-label="Speed">${[0.8, 1, 1.2, 1.5, 1.8].map((r) => `<option value="${r}" ${(+localStorage.getItem("kitsune.sayRate") || 1) === r ? "selected" : ""}>${r}×</option>`).join("")}</select><select id="kb-say-voice" aria-label="Voice" style="max-width:150px"><option value="">Default voice</option></select><button type="button" data-sy="stop" aria-label="Stop">×</button>`;
  $("#kb-body", B.view).append(bar); SAY.bar = bar;
  bar.onclick = (e) => {
    const b = e.target.closest("[data-sy]"); if (!b) return;
    const a = b.dataset.sy;
    if (a === "stop") return stopSay();
    if (a === "pause") { if (speechSynthesis.paused) { speechSynthesis.resume(); b.textContent = "❚❚"; } else { speechSynthesis.pause(); b.textContent = "▶"; } return; }
    speechSynthesis.cancel(); SAY.i = Math.max(0, Math.min(SAY.blocks.length - 1, SAY.i + (a === "next" ? 1 : -1))); sayNext();
  };
  $("#kb-say-rate", bar).onchange = (e) => { localStorage.setItem("kitsune.sayRate", e.target.value); speechSynthesis.cancel(); sayNext(); };
  { const vs = $("#kb-say-voice", bar), fill = () => { const cur = localStorage.getItem("kitsune.sayVoice") || "", list = speechSynthesis.getVoices(); vs.innerHTML = `<option value="">Default voice</option>` + list.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === cur ? "selected" : ""}>${esc(v.name)} · ${esc(v.lang)}</option>`).join(""); }; fill(); speechSynthesis.addEventListener?.("voiceschanged", fill, { once: true }); vs.onchange = () => { localStorage.setItem("kitsune.sayVoice", vs.value); speechSynthesis.cancel(); sayNext(); }; }
  speechSynthesis.cancel(); sayNext();
}
function sayNext() {
  if (!SAY.on) return;
  const blk = SAY.blocks[SAY.i]; if (!blk) return stopSay();
  $("#kb-say-pos", SAY.bar).textContent = `${SAY.i + 1} of ${SAY.blocks.length}`;
  blk.scrollIntoView({ behavior: "smooth", block: "center" });
  const line = new Range(); line.selectNodeContents(blk);
  if (CSS.highlights) CSS.highlights.set("kb-say-line", new Highlight(line));
  const u = new SpeechSynthesisUtterance(blk.textContent);
  u.rate = +localStorage.getItem("kitsune.sayRate") || 1;
  u.lang = SAY.root.querySelector?.("[lang]")?.getAttribute("lang") || document.documentElement.lang || "en";
  { const vu = localStorage.getItem("kitsune.sayVoice"), v = vu && speechSynthesis.getVoices().find((x) => x.voiceURI === vu); if (v) { u.voice = v; u.lang = v.lang; } }
  u.onboundary = (ev) => {
    if ((ev.name && ev.name !== "word") || !CSS.highlights) return;
    const w = document.createTreeWalker(blk, NodeFilter.SHOW_TEXT); let s = 0, n;
    while ((n = w.nextNode())) { const L = n.nodeValue.length; if (ev.charIndex < s + L) { const off = ev.charIndex - s, len = ev.charLength || (n.nodeValue.slice(off).match(/^[\p{L}\p{N}'’-]+/u)?.[0].length || 1); const r = new Range(); r.setStart(n, off); r.setEnd(n, Math.min(L, off + len)); CSS.highlights.set("kb-say", new Highlight(r)); return; } s += L; }
  };
  u.onend = () => { if (!SAY.on) return; SAY.i++; sayNext(); };
  u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") stopSay(); };
  speechSynthesis.speak(u);
}
function stopSay() {
  if (!SAY.on && !SAY.bar) return;
  SAY.on = false; try { speechSynthesis.cancel(); } catch {}
  CSS.highlights?.delete("kb-say"); CSS.highlights?.delete("kb-say-line");
  SAY.bar?.remove(); SAY.bar = null;
}

// ---------- translate the page ----------
const LANGS = [["es", "Spanish"], ["fr", "French"], ["de", "German"], ["it", "Italian"], ["pt", "Portuguese"], ["nl", "Dutch"], ["pl", "Polish"], ["ru", "Russian"], ["uk", "Ukrainian"], ["tr", "Turkish"], ["ar", "Arabic"], ["hi", "Hindi"], ["ja", "Japanese"], ["ko", "Korean"], ["zh", "Chinese"], ["en", "English"]];
function translateDialog() {
  const root = pageRoot(); if (!root) return;
  const from = (root.querySelector?.("[lang]")?.getAttribute("lang") || "en").slice(0, 2);
  const m = modal({ title: "Translate this page", body: `<form class="form" id="tr"><div class="row2"><div><label class="lbl" for="tr-from">From</label><select class="field" id="tr-from">${LANGS.map(([k, n]) => `<option value="${k}" ${k === from ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      <div><label class="lbl" for="tr-to">Into</label><select class="field" id="tr-to">${LANGS.map(([k, n]) => `<option value="${k}" ${k === (localStorage.getItem("kitsune.trTo") || (from === "en" ? "es" : "en")) ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
      <p class="hint">Uses the free MyMemory service, a paragraph at a time, starting with the ones on screen. Free translation has a daily limit, so very long pages are done in part. Tap a translated paragraph to see the original.</p><p class="status" id="tr-s"></p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="tr">Translate</button>` });
  $("#tr", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const fromL = $("#tr-from", m.root).value, to = $("#tr-to", m.root).value;
    if (fromL === to) { $("#tr-s", m.root).textContent = "Pick two different languages."; return; }
    localStorage.setItem("kitsune.trTo", to); m.close();
    const { translate } = await import("../lookup.js");
    const view = ($("#kb-page", B.view) || $("#kb-reader", B.view)).getBoundingClientRect();
    const blocks = [...root.querySelectorAll("h1, h2, h3, p, li, blockquote, figcaption")].filter((b) => !b.dataset.orig && b.textContent.trim().length > 2 && b.textContent.length < 1400 && !b.closest(".kbx, nav, footer"));
    blocks.sort((a, b) => Math.abs(a.getBoundingClientRect().top - view.top) - Math.abs(b.getBoundingClientRect().top - view.top));
    let done = 0, failed = "";
    const queue = blocks.slice(0, 60);
    toast(`Translating ${queue.length} paragraphs…`);
    const worker = async () => {
      while (queue.length && !failed) {
        const b = queue.shift(), text = b.textContent.trim();
        try {
          const out = (await translate(text.slice(0, 480), fromL, to)).text;
          b.dataset.orig = b.innerHTML; b.dataset.tr = "1"; b.textContent = out + (text.length > 480 ? " …" : ""); b.title = "Translated. Tap to see the original.";
          b.addEventListener("click", function swap(ev) { if (ev.target.closest("a")) return; const o = b.dataset.orig; b.dataset.orig = b.innerHTML; b.innerHTML = o; }, { once: false });
          done++;
        } catch (err) { failed = err.message; }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    toast(failed && !done ? failed : `Translated ${done} paragraphs${failed ? " (the free service stopped early: " + failed + ")" : ""}.`, { ms: 6000 });
  };
}

// ---------- history ----------
async function historyDialog() {
  const hist = (await store.history()) || [];
  const m = modal({ title: "History", wide: true, body: `<div class="search" style="max-width:none;margin-bottom:12px">${icon("search")}<input class="field" id="hs-q" type="search" placeholder="Search your history" autofocus></div><div id="hs-list" class="kb-hist"></div>`,
    actions: `<button class="btn" type="button" id="hs-clear" style="color:var(--bad)">${icon("trash")}Clear history</button><button class="btn" type="button" data-close>Done</button>` });
  const draw = (q = "") => {
    const list = hist.filter((h) => !q || (h.title + " " + h.url).toLowerCase().includes(q));
    let day = "";
    $("#hs-list", m.root).innerHTML = list.slice(0, 300).map((h) => {
      const d = new Date(h.t).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
      const head = d !== day ? `<h4 class="kb-mh">${(day = d)}</h4>` : "";
      return head + `<button type="button" class="kb-hrow" data-go="${esc(h.url)}"><img src="${esc(favicon(h.url))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span>${esc(h.title || h.url)}</span><small>${esc(host(h.url))} · ${new Date(h.t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</small></button>`;
    }).join("") || `<p class="muted">${q ? "Nothing matches." : "Nothing here yet. Pages you visit show up here (but not in incognito)."}</p>`;
  };
  draw();
  $("#hs-q", m.root).oninput = (e) => draw(e.target.value.trim().toLowerCase());
  $("#hs-list", m.root).onclick = (e) => { const b = e.target.closest("[data-go]"); if (b) { m.close(); go(b.dataset.go); } };
  $("#hs-clear", m.root).onclick = async () => { await kvSet("webHistory", []); hist.length = 0; draw(); toast("History cleared."); };
}

// =====================================================================
// v73: web highlights, selection toolbar, instant answers, peek, files,
// focus mode, swipes and site styles
// =====================================================================

// ---------- highlight the web ----------
const CLIP_COLORS = { yellow: "#ffe066", green: "#a5e3a1", blue: "#a8cdf5", pink: "#f6b2cf" };
const clipKey = (u) => { try { const x = new URL(u); x.hash = ""; return x.href; } catch { return u; } };
async function clipsFor(url) { return (((await kvGet("webClips", {})) || {})[clipKey(url)] || {}).clips || []; }
async function saveClip(t, clip) {
  const all = { ...((await kvGet("webClips", {})) || {}) }, k = clipKey(t.url);
  const page = all[k] || { url: k, title: t.title, clips: [] };
  page.title = t.title; page.clips = [...page.clips, clip]; page.t = Date.now();
  all[k] = page; await kvSet("webClips", all);
}
async function removeClip(t, text) {
  const all = { ...((await kvGet("webClips", {})) || {}) }, k = clipKey(t.url);
  if (!all[k]) return;
  all[k].clips = all[k].clips.filter((c) => c.text !== text);
  if (!all[k].clips.length) delete all[k];
  await kvSet("webClips", all);
}
// Highlights are drawn with the CSS Highlight API, so the page itself is never changed.
function findRanges(root, text) {
  const out = [], needle = text.replace(/\s+/g, " ").trim(); if (!needle) return out;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; let full = "";
  while (w.nextNode()) { const n = w.currentNode; if (n.parentElement?.closest(".kbx, script, style")) continue; nodes.push({ n, s: full.length }); full += n.nodeValue.replace(/\s+/g, " "); }
  const at = full.indexOf(needle); if (at < 0) return out;
  const end = at + needle.length, r = new Range(); let started = false;
  for (const { n, s } of nodes) {
    const len = n.nodeValue.replace(/\s+/g, " ").length, e = s + len;
    if (!started && at < e) { r.setStart(n, Math.min(n.nodeValue.length, at - s)); started = true; }
    if (started && end <= e) { r.setEnd(n, Math.min(n.nodeValue.length, end - s)); out.push(r); break; }
  }
  return out;
}
async function applyClips(root, t) {
  if (!CSS.highlights) return;
  const clips = await clipsFor(t.url);
  const by = {}; for (const c of clips) for (const r of findRanges(root, c.text)) (by[c.color] ||= []).push(r);
  for (const k of Object.keys(CLIP_COLORS)) { if (by[k]?.length) CSS.highlights.set("kb-clip-" + k, new Highlight(...by[k])); else CSS.highlights.delete("kb-clip-" + k); }
  root.__clips = clips;
}
function selText(root) {
  const sel = root.getSelection ? root.getSelection() : document.getSelection();
  const s = sel?.toString().trim() || "";
  return s && sel.rangeCount ? { s, rect: sel.getRangeAt(0).getBoundingClientRect(), sel } : null;
}
// A small toolbar over any text you select: highlight it, copy it, define it, translate it, or search for it.
function selectionBar(root, t) {
  if (root.__selBar) return; root.__selBar = true;
  const show = debounce(() => {
    $("#kb-selbar")?.remove();
    const got = selText(root); if (!got || got.s.length < 2 || got.s.length > 2000) return;
    const existing = (root.__clips || []).find((c) => c.text === got.s || got.s.includes(c.text) && c.text.length > 8);
    const bar = document.createElement("div"); bar.id = "kb-selbar"; bar.className = "kb-selbar";
    bar.innerHTML = `${Object.entries(CLIP_COLORS).map(([k, c]) => `<button type="button" data-c="${k}" style="--c:${c}" aria-label="Highlight ${k}"></button>`).join("")}<span></span>
      ${existing ? `<button type="button" data-a="unclip">Remove highlight</button>` : ""}<button type="button" data-a="copy">Copy</button><button type="button" data-a="frag" title="Copy a link that jumps to this text">Link</button>${got.s.split(/\s+/).length <= 3 ? `<button type="button" data-a="define">Define</button>` : ""}<button type="button" data-a="translate">Translate</button><button type="button" data-a="search">Search</button><button type="button" data-a="card" aria-label="Make a quote card">Card</button><button type="button" data-a="say" aria-label="Read aloud">${icon("speak")}</button><button type="button" data-a="ai" aria-label="Ask AI about this">${icon("spark")}</button>`;
    document.body.append(bar);
    const w = bar.offsetWidth, x = Math.max(8, Math.min(innerWidth - w - 8, got.rect.left + got.rect.width / 2 - w / 2)), y = got.rect.top > 64 ? got.rect.top - 48 : got.rect.bottom + 10;
    Object.assign(bar.style, { left: x + "px", top: y + "px" });
    bar.onmousedown = (e) => e.preventDefault(); // keep the selection while tapping the bar
    bar.onclick = async (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const text = got.s;
      if (b.dataset.c) { await saveClip(t, { text, color: b.dataset.c, t: Date.now() }); got.sel.removeAllRanges(); bar.remove(); await applyClips(root, t); toast("Highlighted. Find it in your Notebook under Web clips."); }
      const a = b.dataset.a;
      if (a === "unclip") { await removeClip(t, existing.text); bar.remove(); await applyClips(root, t); toast("Highlight removed."); }
      if (a === "copy") { navigator.clipboard?.writeText(text); bar.remove(); toast("Copied."); }
      if (a === "frag") { bar.remove(); (await import("../webplus10.js")).copyFragment(text, t); }
      if (a === "search") { bar.remove(); go(text, { newTab: true }); }
      if (a === "define" || a === "translate") { bar.remove(); lookupPanel(text, a); }
      if (a === "card") { bar.remove(); const L = await import("../lookup.js"); const blob = await L.quoteCard({ text: text.slice(0, 600), title: t.title, author: host(t.url) }, darkFor(t) ? "night" : "paper"); L.saveBlob(blob, `${(t.title || host(t.url)).replace(/[^\w\s-]/g, "").trim().slice(0, 40)} quote.png`); toast("Quote card saved as an image."); }
      if (a === "say") { bar.remove(); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = +localStorage.getItem("kitsune.sayRate") || 1; const vu = localStorage.getItem("kitsune.sayVoice"), v = vu && speechSynthesis.getVoices().find((x) => x.voiceURI === vu); if (v) u.voice = v; speechSynthesis.speak(u); }
      if (a === "ai") { bar.remove(); const ctx = (t.doc?.querySelector("article, main") || t.doc?.body)?.textContent?.replace(/\s+/g, " ").slice(0, 8000) || ""; (await import("../ai.js")).askPanel({ title: "Ask AI about this", quote: text, context: `From the page “${t.title}” (${t.url}):\n${ctx}`, system: "You explain passages from web pages clearly and briefly, using the page for context.", prompt: `Explain this, in context:\n\n"${text}"` }); }
    };
  }, 250);
  document.addEventListener("selectionchange", () => { if (!B.view?.isConnected) return; if (root.isConnected === false) return; show(); });
  root.addEventListener("pointerdown", (e) => { if (!e.target.closest?.("#kb-selbar")) $("#kb-selbar")?.remove(); });
}
async function lookupPanel(text, kind) {
  const L = await import("../lookup.js");
  const m = modal({ title: kind === "define" ? `“${text}”` : "Translate", body: `<div id="lk" class="kb-lookup"><p class="status">${kind === "define" ? "Looking it up…" : "Translating…"}</p></div>` });
  const host2 = $("#lk", m.root);
  try {
    if (kind === "define") {
      const d = await L.define(text);
      host2.innerHTML = `${d.phonetic ? `<p class="muted">${esc(d.phonetic)}</p>` : ""}${d.senses.map((s) => `<p><em>${esc(s.pos || "")}</em></p><ol>${s.defs.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`).join("")}<p class="hint">From ${esc(d.via)}</p>`;
    } else {
      const to = localStorage.getItem("kitsune.trTo") || (navigator.language || "en").slice(0, 2);
      const r = await L.translate(text, to === "en" ? "es" : "en", to === "en" ? "en" : to).catch(() => L.translate(text, "en", to === "en" ? "es" : to));
      host2.innerHTML = `<blockquote class="kb-tr">${esc(r.text)}</blockquote><p class="hint">Original: ${esc(text.slice(0, 300))}</p>`;
    }
  } catch (e) { host2.innerHTML = `<p class="status err">${esc(e.message)}</p>`; }
}

// ---------- instant answers in the address bar ----------
let iaSeq = 0;
async function instantAnswer(q, box) {
  const my = ++iaSeq;
  { const quick = quickAnswer(q); if (quick) { await null; if (my !== iaSeq || box.hidden) return; box.insertAdjacentHTML("afterbegin", `<div class="kb-answer kb-def"><span><em>${esc(quick.kind)}</em><strong>${esc(quick.value)}</strong><small>${esc(quick.detail)}</small></span><button type="button" class="btn btn-sm" data-copyans="${esc(quick.value)}">Copy</button></div>`); box.querySelector("[data-copyans]")?.addEventListener("mousedown", (e) => { e.preventDefault(); navigator.clipboard?.writeText(e.target.dataset.copyans).then(() => toast("Copied.")); }); return; } }
  setTimeout(() => { if (my !== iaSeq || box.hidden) return; import("../webanswers.js").then(async (A) => { const r = await A.answer(q).catch(() => null); if (r && my === iaSeq && !box.hidden) box.insertAdjacentHTML("afterbegin", `<div class="kb-answer kb-def"><span><em>${esc(r.kind)}</em><strong>${esc(r.value)}</strong><small>${esc(r.detail)}</small></span></div>`); }).catch(() => {}); }, 400);
  if (/^https?:|\.[a-z]{2,}(\/|$)|@/.test(q) || q.split(/\s+/).length > 5 || q.length < 3) return;
  const title = (q[0].toUpperCase() + q.slice(1)).replace(/\s+/g, "_"); // Wikipedia only folds the first letter
  const [wiki, dict] = await Promise.all([
    E.preview("https://en.wikipedia.org/wiki/" + encodeURIComponent(title)).catch(() => null),
    !q.includes(" ") ? import("../lookup.js").then((L) => L.define(q)).catch(() => null) : null,
  ]);
  if (my !== iaSeq || box.hidden) return;
  const cards = [];
  if (wiki?.via === "wikipedia" && wiki.text) cards.push(`<button type="button" class="kb-answer" data-sv="${esc(wiki.url)}">${wiki.thumb ? `<img src="${esc(wiki.thumb)}" alt="" referrerpolicy="no-referrer">` : ""}<span><em>Wikipedia</em><strong>${esc(wiki.title)}</strong><small>${esc(wiki.text.slice(0, 170))}${wiki.text.length > 170 ? "…" : ""}</small></span></button>`);
  if (dict?.senses?.length) cards.push(`<div class="kb-answer kb-def"><span><em>Dictionary${dict.phonetic ? " · " + esc(dict.phonetic) : ""}</em><strong>${esc(dict.word)}</strong><small>${esc((dict.senses[0].pos ? dict.senses[0].pos + ". " : "") + dict.senses[0].defs[0])}</small></span></div>`);
  if (cards.length) box.insertAdjacentHTML("afterbegin", cards.join(""));
}

// ---------- peek: read a link in a side panel ----------
async function peek(url) {
  $("#kb-peek")?.remove();
  const el = document.createElement("aside"); el.id = "kb-peek"; el.className = "kb-peek"; el.setAttribute("aria-label", "Peek");
  el.innerHTML = `<header><span>${esc(host(url))}</span><button type="button" data-p="open">Open in a tab</button><button type="button" data-p="close" aria-label="Close">×</button></header><div class="kb-peek-body"><div class="kb-loading"><span class="kb-spin"></span>Loading…</div></div>`;
  $("#kb-body", B.view).append(el);
  el.onclick = (e) => { const b = e.target.closest("[data-p]"); if (b?.dataset.p === "close") el.remove(); if (b?.dataset.p === "open") { el.remove(); go(url, { newTab: true }); } const a = e.target.closest(".kb-peek-body a[href]"); if (a) { e.preventDefault(); peek(a.href); } };
  try {
    const r = await api("browse?url=" + encodeURIComponent(url));
    if (!r.html) throw new Error(r.file ? "That link is a file. Open it in a tab to add it to your library." : "Nothing to read there.");
    const art = await readerArticle({ data: r });
    const body = $(".kb-peek-body", el); if (!body) return;
    body.innerHTML = art ? `<h2>${esc(art.title || "")}</h2>${art.byline ? `<p class="muted">${esc(art.byline)}</p>` : ""}<div class="kb-art">${art.content}</div>` : `<p class="muted">No article found. Open it in a tab to see the page.</p>`;
    body.querySelectorAll("img").forEach((i) => i.referrerPolicy = "no-referrer");
  } catch (e) { const body = $(".kb-peek-body", el); if (body) body.innerHTML = `<p class="status err">${esc(e.message)}</p>`; }
}

// ---------- files a page links to ----------
const FILE_EXT = /\.(epub|pdf|cbz|cbr|mobi|azw3|mp3|m4a|m4b|ogg|flac|zip|txt)(\?|#|$)/i;
function pageFiles(root) {
  const seen = new Set(), out = [];
  for (const a of root.querySelectorAll("a[href]")) {
    const u = a.href; if (!/^https?:/.test(u) || !FILE_EXT.test(u.split("?")[0] + "?") || seen.has(u)) continue;
    seen.add(u);
    const name = decodeURIComponent(u.split("?")[0].split("/").pop());
    out.push({ url: u, name, ext: name.split(".").pop().toLowerCase(), label: a.textContent.trim().replace(/\s+/g, " ").slice(0, 80) || name });
  }
  return out;
}

// ---------- focus mode ----------
function toggleFocusMode() {
  const on = !document.documentElement.classList.contains("kb-focus");
  document.documentElement.classList.toggle("kb-focus", on);
  if (on) toast("Focus mode. Press Esc to leave.");
  const esc2 = (e) => { if (e.key === "Escape" && !document.querySelector(".modal, #kb-lb, #kb-hints")) { document.documentElement.classList.remove("kb-focus"); removeEventListener("keydown", esc2, true); } };
  if (on) addEventListener("keydown", esc2, true);
}
addEventListener("hashchange", () => { if (!location.hash.startsWith("#web")) { document.documentElement.classList.remove("kb-focus"); $("#kb-selbar")?.remove(); } });

// ---------- swipe from the edge to go back or forward ----------
function swipeNav(el) {
  if (el.__swipe) return; el.__swipe = true;
  let s = null;
  el.addEventListener("touchstart", (e) => { const x = e.touches[0].clientX, r = el.getBoundingClientRect(); s = e.touches.length === 1 && (x - r.left < 28 || r.right - x < 28) ? { x, y: e.touches[0].clientY, left: x - r.left < 28 } : null; }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (!s) return; const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y; const was = s; s = null;
    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx)) return;
    if (was.left && dx > 0) $("[data-b=back]", B.view)?.click(); else if (!was.left && dx < 0) $("[data-b=fwd]", B.view)?.click();
  }, { passive: true });
}

// ---------- make any site readable ----------
const siteStyles = () => { try { return JSON.parse(localStorage.getItem("kitsune.siteStyles") || "{}"); } catch { return {}; } };
const FONTS2 = { site: "", serif: '"Literata", Georgia, serif', sans: 'system-ui, -apple-system, "Segoe UI", sans-serif', hyper: '"Atkinson Hyperlegible", system-ui, sans-serif', dyslexic: '"OpenDyslexic", "Atkinson Hyperlegible", sans-serif' };
function applySiteStyle(root, t) {
  const st = siteStyles()[host(t.url)] || null;
  const old = root.adoptedStyleSheets?.find?.((s) => s.__site);
  const rest = (root.adoptedStyleSheets || []).filter((s) => !s.__site);
  if (!st) { if (old) root.adoptedStyleSheets = rest; return; }
  if (st.font === "dyslexic") import("../store.js").then((s) => s.loadDyslexicFont?.());
  const css = new CSSStyleSheet(); css.__site = true;
  css.replaceSync(`
    ${st.font && FONTS2[st.font] ? `.kb-body p, .kb-body li, .kb-body blockquote, .kb-body td, .kb-body dd, .kb-body h1, .kb-body h2, .kb-body h3, .kb-body h4 { font-family: ${FONTS2[st.font]} !important; }` : ""}
    ${st.size ? `.kb-body p, .kb-body li, .kb-body blockquote, .kb-body dd { font-size: ${st.size}px !important; }` : ""}
    ${st.spacing ? `.kb-body p, .kb-body li, .kb-body dd { line-height: ${st.spacing} !important; }` : ""}
    ${st.narrow ? `.kb-body { max-width: 46em !important; margin-left: auto !important; margin-right: auto !important; padding: 0 16px !important; }` : ""}
    ${st.noImages ? `.kb-body img:not(.kbx-thumb), .kb-body picture, .kb-body video { display: none !important; } .kb-body [style*="background-image"] { background-image: none !important; }` : ""}`);
  root.adoptedStyleSheets = [...rest, css];
}
function siteStyleDialog() {
  const t = T(), h = host(t.url || ""); if (!h) return;
  const all = siteStyles(), st = { font: "site", size: 0, spacing: 0, narrow: false, noImages: false, ...(all[h] || {}) };
  const m = modal({ title: `Make ${h} readable`, body: `<form class="form" id="ss2">
    <div><label class="lbl">Font</label><div class="seg" id="ss-font">${[["site", "The site's"], ["serif", "Serif"], ["sans", "Sans"], ["hyper", "Hyperlegible"], ["dyslexic", "OpenDyslexic"]].map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${st.font === k}">${n}</button>`).join("")}</div></div>
    <label class="ps-range">Text size <b id="ss-sz">${st.size ? st.size + "px" : "the site's"}</b><input type="range" id="ss-size" min="0" max="26" value="${st.size || 0}"></label>
    <label class="ps-range">Line spacing <b id="ss-sp">${st.spacing || "the site's"}</b><input type="range" id="ss-spacing" min="0" max="2.2" step="0.1" value="${st.spacing || 0}"></label>
    <label class="check"><input type="checkbox" id="ss-narrow" ${st.narrow ? "checked" : ""}> Narrow column, centred</label>
    <label class="check"><input type="checkbox" id="ss-noimg" ${st.noImages ? "checked" : ""}> Data saver: hide pictures and videos</label>
    <p class="hint">Saved for ${esc(h)} only. Changes show as you make them.</p></form>`,
    actions: `<button class="btn" type="button" id="ss-reset">Reset</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  const save = () => { const a = siteStyles(); a[h] = st; try { localStorage.setItem("kitsune.siteStyles", JSON.stringify(a)); } catch {} const root = pageRoot(); if (root && root.adoptedStyleSheets) applySiteStyle(root, t); };
  $("#ss-font", m.root).onclick = (e) => { const b = e.target.closest("[data-v]"); if (!b) return; st.font = b.dataset.v; $$("#ss-font button", m.root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); save(); };
  $("#ss-size", m.root).oninput = (e) => { st.size = +e.target.value < 12 ? 0 : +e.target.value; $("#ss-sz", m.root).textContent = st.size ? st.size + "px" : "the site's"; save(); };
  $("#ss-spacing", m.root).oninput = (e) => { st.spacing = +e.target.value < 1 ? 0 : +e.target.value; $("#ss-sp", m.root).textContent = st.spacing || "the site's"; save(); };
  $("#ss-narrow", m.root).onchange = (e) => { st.narrow = e.target.checked; save(); };
  $("#ss-noimg", m.root).onchange = (e) => { st.noImages = e.target.checked; save(); };
  $("#ss-reset", m.root).onclick = () => { const a = siteStyles(); delete a[h]; try { localStorage.setItem("kitsune.siteStyles", JSON.stringify(a)); } catch {} const root = pageRoot(); if (root?.adoptedStyleSheets) applySiteStyle(root, t); m.close(); toast(`${h} is back to its own style.`); };
}

// =====================================================================
// v74: follow any site, read later, and make a book from what you saved
// =====================================================================

// ---------- feeds ----------
const feedStore = { list: async () => (await kvGet("webFeeds", [])) || [], seen: async () => (await kvGet("webFeedSeen", {})) || {} };
const feedMemo = new Map();
// Articles from an RSS or Atom feed: title, link, date, a short summary and a picture when there is one.
async function readFeed(url, fresh = false) {
  const hit = feedMemo.get(url);
  if (!fresh && hit && Date.now() - hit.t < 10 * 60_000) return hit.items;
  const xml = await api("feed?url=" + encodeURIComponent(url));
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const items = [...doc.querySelectorAll("item, entry")].slice(0, 40).map((n) => {
    const get = (tag) => n.getElementsByTagName(tag)[0];
    const linkEl = [...n.getElementsByTagName("link")].find((l) => !l.getAttribute("rel") || l.getAttribute("rel") === "alternate") || get("link");
    const link = (linkEl?.getAttribute("href") || linkEl?.textContent || get("guid")?.textContent || "").trim();
    const raw = (get("content:encoded") || get("description") || get("summary") || get("content"))?.textContent || "";
    const html = new DOMParser().parseFromString(raw, "text/html");
    const img = [...n.getElementsByTagName("media:thumbnail"), ...n.getElementsByTagName("media:content"), ...n.getElementsByTagName("enclosure")].map((m) => m.getAttribute("url")).find((u) => u && !/\.(mp3|m4a|mp4)(\?|$)/i.test(u)) || html.querySelector("img[src]")?.getAttribute("src") || "";
    const date = (get("pubDate") || get("published") || get("updated") || get("dc:date"))?.textContent?.trim() || "";
    return { title: (get("title")?.textContent || "").trim(), link, date, t: new Date(date).getTime() || 0, img, summary: html.body.textContent.replace(/\s+/g, " ").trim().slice(0, 220) };
  }).filter((x) => x.link && /^https?:/.test(x.link));
  feedMemo.set(url, { t: Date.now(), items });
  return items;
}
function feedOf(t) {
  const l = t.doc?.querySelector('link[rel~="alternate"][type*="rss"][href], link[rel~="alternate"][type*="atom"][href], link[rel~="alternate"][type*="feed"][href]');
  try { return l ? new URL(l.getAttribute("href"), t.data.url).href : null; } catch { return null; }
}
async function syncFollow(t) {
  const btn = $("#kb-follow", B.view); if (!btn) return;
  if (!t.feed) { btn.hidden = true; return; }
  const following = (await feedStore.list()).some((f) => f.url === t.feed);
  btn.hidden = false; btn.classList.toggle("on", following);
  $("span", btn).textContent = following ? "Following" : "Follow";
  btn.title = following ? "You follow this site. Click to stop." : "Follow this site's new articles";
}
async function followToggle() {
  const t = T(); if (!t.feed) return;
  const list = await feedStore.list(), i = list.findIndex((f) => f.url === t.feed);
  if (i >= 0) { list.splice(i, 1); await kvSet("webFeeds", list); toast(`Stopped following ${host(t.url)}.`); }
  else {
    try { const items = await readFeed(t.feed, true); if (!items.length) return toast("This site's feed has no articles in it."); }
    catch (e) { return toast(e.message); }
    // the site's name: its own og:site_name, else the part of the title that matches its address
    const core = host(t.url).split(".").slice(-2, -1)[0] || "", flat = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
    const segs = t.title.split(/\s[|·–—-]\s/).map((x) => x.trim()).filter(Boolean);
    const name = (t.doc?.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || segs.find((x) => flat(x).includes(flat(core)) || flat(core).includes(flat(x))) || (segs.length > 1 ? segs.at(-1) : "") || host(t.url)).trim().slice(0, 50);
    list.push({ url: t.feed, title: name, site: new URL(t.data.url).origin, added: Date.now() });
    await kvSet("webFeeds", list);
    toast(`Following ${name}. New articles show up on the new tab page.`);
  }
  syncFollow(t);
}
async function drawFollowing() {
  const sec = $("#kb-following", B.view); if (!sec) return;
  const feeds = await feedStore.list(); if (!feeds.length) return;
  sec.hidden = false;
  sec.innerHTML = `<h3>Following <button class="link-btn" type="button" data-b="feeds">Manage</button></h3><div class="kb-river"><div class="kb-loading"><span class="kb-spin"></span>Fetching new articles…</div></div>`;
  const seen = await feedStore.seen();
  const all = [];
  await Promise.all(feeds.map(async (f) => { try { (await readFeed(f.url)).forEach((it) => all.push({ ...it, feed: f })); } catch {} }));
  all.sort((a, b) => b.t - a.t);
  const list = all.slice(0, 24);
  const river = $(".kb-river", sec); if (!river) return;
  river.innerHTML = list.length ? list.map((it, i) => `<button type="button" class="kb-art-item ${(seen[it.feed.url] || []).includes(it.link) ? "read" : ""}" data-feeditem="${i}">
      ${it.img ? `<img src="${esc(it.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
      <span><small><img src="${esc(favicon(it.feed.site))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">${esc(it.feed.title)}${it.t ? " · " + esc(timeSince(it.t)) : ""}</small><strong>${esc(it.title || "Untitled")}</strong>${it.summary ? `<em>${esc(it.summary)}</em>` : ""}</span></button>`).join("")
    : `<p class="muted">No articles yet.</p>`;
  river.onclick = async (e) => {
    const b = e.target.closest("[data-feeditem]"); if (!b) return;
    const it = list[+b.dataset.feeditem];
    const s = await feedStore.seen(); s[it.feed.url] = [...new Set([...(s[it.feed.url] || []), it.link])].slice(-400); await kvSet("webFeedSeen", s);
    T().mode = "reader"; go(it.link);
  };
}
const timeSince = (t) => { const m = (Date.now() - t) / 60000; return m < 60 ? `${Math.max(1, Math.round(m))} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : m < 10080 ? `${Math.round(m / 1440)} d ago` : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" }); };
async function manageFeeds() {
  const feeds = await feedStore.list();
  const m = modal({ title: "Sites you follow", body: feeds.length ? `<div class="kb-feeds">${feeds.map((f, i) => `<div class="kb-feedrow"><img src="${esc(favicon(f.site))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span><strong>${esc(f.title)}</strong><small>${esc(host(f.site))}</small></span><button class="btn btn-sm" type="button" data-unf="${i}">Unfollow</button></div>`).join("")}</div>` : `<p class="muted">You don't follow any sites yet. Look for the Follow button on a site's page.</p>` });
  m.root.addEventListener("click", async (e) => { const b = e.target.closest("[data-unf]"); if (!b) return; feeds.splice(+b.dataset.unf, 1); await kvSet("webFeeds", feeds); b.closest(".kb-feedrow").remove(); drawFollowing(); });
}

// ---------- read later ----------
async function readLater() {
  const t = T(); if (!t.url || !t.data?.html) return toast("Open a page first.");
  const list = (await kvGet("webLater", [])) || [];
  if (list.some((x) => x.url === t.url)) return toast("Already on your reading list.");
  list.unshift({ url: t.url, title: t.title, site: host(t.url), t: Date.now() });
  await kvSet("webLater", list.slice(0, 200));
  toast(`Added to your reading list (${list.length}).`, { action: "Make a book", onAction: makeBookDialog });
}
async function drawLaters() {
  const sec = $("#kb-laters", B.view); if (!sec) return;
  const list = (await kvGet("webLater", [])) || []; if (!list.length) return;
  sec.hidden = false;
  sec.innerHTML = `<h3>Read later · ${list.length} <button class="link-btn" type="button" data-b="makebook">Make a book</button></h3><div class="kb-links">${list.slice(0, 12).map((m, i) => `<div class="kb-later"><button type="button" data-go="${esc(m.url)}"><img src="${esc(favicon(m.url))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span>${esc(m.title)}</span><small>${esc(m.site)}</small></button><button type="button" class="kb-x" data-rmlater="${i}" aria-label="Remove">×</button></div>`).join("")}</div>`;
  sec.onclick = async (e) => { const b = e.target.closest("[data-rmlater]"); if (!b) return; e.stopPropagation(); list.splice(+b.dataset.rmlater, 1); await kvSet("webLater", list); drawLaters(); if (!list.length) sec.hidden = true; };
}

// ---------- make a book from your reading list ----------
async function makeBookDialog() {
  const list = (await kvGet("webLater", [])) || [];
  if (!list.length) return toast("Your reading list is empty. Press S on a page to add it.");
  const m = modal({ title: "Make a book", wide: true, body: `<form class="form" id="mb">
    <p class="muted" style="margin-top:0">Kitsune makes a clean copy of each page and binds them into one book in your library, a chapter each, with pictures and credits. Read it offline, highlight it, or have it read aloud.</p>
    <div><label class="lbl" for="mb-t">Title</label><input class="field" id="mb-t" value="Reading from ${new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}" required></div>
    <div class="kb-mbpick">${list.map((x, i) => `<label class="check"><input type="checkbox" value="${i}" checked> <span><strong>${esc(x.title)}</strong> <small class="muted">${esc(x.site)}</small></span></label>`).join("")}</div>
    <label class="check"><input type="checkbox" id="mb-clear" checked> Take them off the reading list afterwards</label>
    <p class="status" id="mb-s"></p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="mb">${icon("book")}Make the book</button>` });
  $("#mb", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const picks = $$(".kb-mbpick input:checked", m.root).map((c) => list[+c.value]);
    const s = $("#mb-s", m.root);
    if (!picks.length) { s.textContent = "Pick at least one page."; return; }
    const chapters = [];
    for (const [i, p] of picks.entries()) {
      s.className = "status"; s.textContent = `Making a clean copy of ${i + 1} of ${picks.length}: ${p.title}…`;
      try {
        const r = await api("browse?url=" + encodeURIComponent(p.url));
        const art = r.html ? await readerArticle({ data: r }) : null;
        if (art) chapters.push({ title: art.title || p.title, by: [art.byline, art.siteName || host(p.url)].filter(Boolean).join(" · "), url: r.url, html: art.content });
      } catch {}
    }
    if (!chapters.length) { s.className = "status err"; s.textContent = "None of those pages could be copied."; return; }
    const title = $("#mb-t", m.root).value.trim();
    const html = `<section><h1>Contents</h1><ol>${chapters.map((c) => `<li>${esc(c.title)}</li>`).join("")}</ol></section>`
      + chapters.map((c) => `<section><h1>${esc(c.title)}</h1><p><em>${esc(c.by)}</em></p>${c.html}<p><small>Source: ${esc(c.url)}</small></p></section>`).join("");
    const item = await saveItem({ id: uid("v-"), type: "book", title, author: [...new Set(chapters.map((c) => host(c.url)))].slice(0, 3).join(", "),
      source: { kind: "wiki", cachedHtml: html, url: chapters[0].url, wiki: `${chapters.length} pages from the web`, license: "each chapter belongs to its own author" },
      origin: "Made in Kitsune's browser", tags: ["saved pages"], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000) });
    if ($("#mb-clear", m.root).checked) await kvSet("webLater", list.filter((x) => !picks.includes(x)));
    m.close(); drawLaters();
    toast(`“${title}” is in your library: ${plural(chapters.length, "chapter")}${chapters.length < picks.length ? ` (${picks.length - chapters.length} couldn't be copied)` : ""}.`, { action: "Read it", onAction: async () => (await import("./common.js")).openItem(item) });
  };
}

// =====================================================================
// v75: live mode, pages with their JavaScript running in a sealed sandbox
// =====================================================================
const LIVE_SHIM = "(() => {\n  const BASE = document.baseURI, send = (m) => parent.postMessage(Object.assign({ __kb: 1 }, m), \"*\");\n  // Storage and cookies don't exist in a sealed sandbox; scripts get private, in-memory stand-ins instead of crashing.\n  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null), setItem: (k, v) => void m.set(String(k), String(v)), removeItem: (k) => void m.delete(String(k)), clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } }; };\n  for (const k of [\"localStorage\", \"sessionStorage\"]) { let ok = true; try { window[k].length; } catch { ok = false; } if (!ok) try { Object.defineProperty(window, k, { value: mem(), configurable: true }); } catch {} }\n  let jar = \"\"; let cookieOk = true; try { void document.cookie; } catch { cookieOk = false; }\n  if (!cookieOk) try { Object.defineProperty(document, \"cookie\", { configurable: true, get: () => jar, set: (v) => { const kv = String(v).split(\";\")[0].trim(), name = kv.split(\"=\")[0]; jar = [...(jar ? jar.split(\"; \").filter((p) => p.split(\"=\")[0] !== name) : []), kv].join(\"; \"); } }); } catch {}\n  // Data requests go through Kitsune, which fetches them for the page (reads only).\n  let seq = 0; const waits = new Map();\n  addEventListener(\"message\", (e) => { const d = e.data; if (!d || !d.__kbr || e.source !== parent) return; const w = waits.get(d.id); if (!w) return; waits.delete(d.id); d.error ? w.reject(new TypeError(d.error)) : w.resolve(d); });\n  const bridge = (url, method, body, ctype) => new Promise((resolve, reject) => { const id = ++seq; waits.set(id, { resolve, reject }); send({ type: \"fetch\", id, url, method, body, ctype }); });\n  const realFetch = window.fetch.bind(window);\n  window.fetch = async (input, init = {}) => {\n    const req = typeof Request !== \"undefined\" && input instanceof Request ? input : null;\n    const url = new URL(req ? req.url : String(input), BASE).href;\n    if (/^(data|blob):/.test(url)) return realFetch(input, init);\n    const method = String(init.method || (req && req.method) || \"GET\").toUpperCase();\n    let body = null, ctype = \"\";\n    if (method !== \"GET\" && method !== \"HEAD\") { const src = init.body !== undefined ? init.body : req ? await req.clone().arrayBuffer() : null; if (src != null) { const tmp = new Response(src); body = await tmp.arrayBuffer(); ctype = tmp.headers.get(\"content-type\") || \"\"; } const h = new Headers(init.headers || (req && req.headers) || {}); ctype = h.get(\"content-type\") || ctype; }\n    const d = await bridge(url, method, body, ctype);\n    return new Response(method === \"HEAD\" || d.status === 204 || d.status === 304 ? null : d.body, { status: d.status, statusText: d.statusText || \"\", headers: d.headers });\n  };\n  class KX {\n    constructor() { Object.assign(this, { readyState: 0, status: 0, statusText: \"\", responseText: \"\", response: null, responseType: \"\", responseURL: \"\", withCredentials: false, timeout: 0, _ls: {}, upload: { addEventListener() {}, removeEventListener() {} } }); }\n    open(m, u) { this._m = String(m).toUpperCase(); this._u = new URL(u, BASE).href; this.readyState = 1; this._fire(\"readystatechange\"); }\n    setRequestHeader(k, v) { (this._rq ||= {})[String(k).toLowerCase()] = String(v); } overrideMimeType() {} abort() { this._aborted = true; this._fire(\"abort\"); }\n    addEventListener(t, f) { (this._ls[t] ||= []).push(f); } removeEventListener(t, f) { this._ls[t] = (this._ls[t] || []).filter((x) => x !== f); }\n    _fire(t) { const ev = { type: t, target: this, currentTarget: this, loaded: 0, total: 0 }; try { this[\"on\" + t] && this[\"on\" + t](ev); } catch (e) { setTimeout(() => { throw e; }); } (this._ls[t] || []).forEach((f) => { try { f.call(this, ev); } catch (e) { setTimeout(() => { throw e; }); } }); }\n    getResponseHeader(n) { return (this._rh || {})[String(n).toLowerCase()] ?? null; }\n    getAllResponseHeaders() { return Object.entries(this._rh || {}).map(([k, v]) => k + \": \" + v).join(\"\\r\\n\"); }\n    async send(data) {\n      let body = null, ctype = (this._rq || {})[\"content-type\"] || \"\";\n      if (data != null && !/^(GET|HEAD)$/.test(this._m)) { const tmp = new Response(data); body = await tmp.arrayBuffer(); ctype = ctype || tmp.headers.get(\"content-type\") || \"\"; }\n      bridge(this._u, this._m, body, ctype).then((d) => {\n        if (this._aborted) return;\n        const text = new TextDecoder().decode(d.body || new ArrayBuffer(0));\n        Object.assign(this, { status: d.status, statusText: d.statusText || \"\", _rh: d.headers || {}, responseText: text, responseURL: this._u });\n        const t = this.responseType;\n        this.response = t === \"json\" ? (() => { try { return JSON.parse(text); } catch { return null; } })() : t === \"arraybuffer\" ? d.body : t === \"blob\" ? new Blob([d.body], { type: (d.headers || {})[\"content-type\"] || \"\" }) : t === \"document\" ? new DOMParser().parseFromString(text, \"text/html\") : text;\n        this.readyState = 4; this._fire(\"readystatechange\"); this._fire(\"load\"); this._fire(\"loadend\");\n      }, () => { this.readyState = 4; this._fire(\"readystatechange\"); this._fire(\"error\"); this._fire(\"loadend\"); });\n    }\n  }\n  Object.assign(KX, { UNSENT: 0, OPENED: 1, HEADERS_RECEIVED: 2, LOADING: 3, DONE: 4 });\n  window.XMLHttpRequest = KX;\n  // Links, forms and pop-ups stay inside Kitsune's browser. The page's own handlers get the first say.\n  addEventListener(\"click\", (e) => {\n    if (e.defaultPrevented || e.button > 1) return;\n    const a = e.composedPath().find((n) => n && n.tagName === \"A\" && n.hasAttribute(\"href\")); if (!a) return;\n    const h = a.getAttribute(\"href\"); if (/^\\s*javascript:/i.test(h)) return;\n    e.preventDefault();\n    if (h.startsWith(\"#\")) { const id = decodeURIComponent(h.slice(1)); (document.getElementById(id) || document.getElementsByName(id)[0])?.scrollIntoView(); return; }\n    send({ type: \"nav\", url: a.href, newTab: e.metaKey || e.ctrlKey || e.button === 1 || a.target === \"_blank\" });\n  });\n  addEventListener(\"submit\", (e) => {\n    if (e.defaultPrevented) return; e.preventDefault();\n    const f = e.target; if ((f.getAttribute(\"method\") || \"get\").toLowerCase() !== \"get\") return send({ type: \"post\" });\n    const u = new URL(f.getAttribute(\"action\") || BASE, BASE); u.search = new URLSearchParams([...new FormData(f, e.submitter || undefined)].filter(([, v]) => typeof v === \"string\")).toString();\n    send({ type: \"nav\", url: u.href });\n  });\n  window.open = (u) => { if (u) send({ type: \"nav\", url: new URL(u, BASE).href, newTab: true }); return null; };\n  // In-page navigation (single-page apps) updates Kitsune's address bar.\n  let here = BASE;\n  for (const k of [\"pushState\", \"replaceState\"]) { const orig = history[k].bind(history); history[k] = (st, title, url) => { try { orig(st, title, url); } catch {} if (url != null) { here = new URL(url, here).href; send({ type: \"url\", url: here }); } }; }\n  const tObs = () => send({ type: \"title\", title: document.title });\n  addEventListener(\"DOMContentLoaded\", () => { tObs(); const t = document.querySelector(\"title\"); if (t) new MutationObserver(tObs).observe(t, { childList: true, characterData: true, subtree: true }); });\n  addEventListener(\"error\", (e) => send({ type: \"jserror\", msg: String(e.message || \"\").slice(0, 200) }));\n  addEventListener(\"unhandledrejection\", (e) => send({ type: \"jserror\", msg: \"(async) \" + String((e.reason && (e.reason.stack || e.reason.message)) || e.reason || \"\").slice(0, 300) }));\n  addEventListener(\"load\", () => { send({ type: \"loaded\" }); setTimeout(() => send({ type: \"stats\", text: (document.body && document.body.innerText || \"\").length, nodes: document.getElementsByTagName(\"*\").length }), 3000); });\n})();";
const TRACKERS = /(^|\.)(google-analytics\.com|googletagmanager\.com|doubleclick\.net|googlesyndication\.com|googleadservices\.com|adservice\.google\.com|facebook\.net|connect\.facebook\.net|hotjar\.com|clarity\.ms|segment\.(com|io)|mixpanel\.com|amplitude\.com|fullstory\.com|newrelic\.com|nr-data\.net|scorecardresearch\.com|quantserve\.com|chartbeat\.(com|net)|parsely\.com|taboola\.com|outbrain\.com|criteo\.(com|net)|adnxs\.com|amazon-adsystem\.com|pubmatic\.com|rubiconproject\.com|moatads\.com|branch\.io|onesignal\.com|intercom\.io|tiktok\.com\/i18n\/pixel|ads-twitter\.com|static\.ads-twitter\.com|snap\.licdn\.com|bat\.bing\.com|cdn\.mxpnl\.com|matomo\.cloud|plausible\.io|cloudflareinsights\.com)$/i;
const INLINE_TRACK = /googletagmanager|google-analytics\.com|gtag\(|fbq\(|connect\.facebook\.net|hotjar|_paq\.push|clarity\.ms|analytics\.js|mixpanel|amplitude|_hsq|plausible\(|beacon\.min\.js/;
const liveSites = () => { try { return new Set(JSON.parse(localStorage.getItem("kitsune.webLive") || "[]")); } catch { return new Set(); } };
function setLiveSite(h, on) { const s = liveSites(); on ? s.add(h) : s.delete(h); try { localStorage.setItem("kitsune.webLive", JSON.stringify([...s])); } catch {} }

function liveView(t) {
  const body = $("#kb-body", B.view);
  t.shield = { scripts: 0, trackers: 0, banners: 0, hosts: new Set(), on: true, live: true, requests: 0, errors: 0 };
  // Served by Kitsune's server inside a sandbox, so the page sees its real path and its app router works.
  // The server seals the page with a Content-Security-Policy sandbox header; the helper inside refuses to run unsealed,
  // and below we check that Kitsune can't reach into the frame (if it could, the frame is removed).
  body.innerHTML = `<iframe class="kb-live" id="kb-live" name="kblive-${esc(t.id)}" title="${esc(t.title)}" allow="autoplay; fullscreen; clipboard-write; picture-in-picture" referrerpolicy="no-referrer"></iframe>
    <div class="kb-livebadge" id="kb-livebadge" title="This page's JavaScript is running in a sealed sandbox">${icon("play")}Live<span id="kb-live-n"></span></div>`;
  const fr = $("#kb-live", body);
  fr.addEventListener("load", () => { let reachable = false; try { reachable = !!fr.contentDocument && fr.contentWindow.origin !== "null"; } catch {} if (reachable && fr.contentWindow.location.pathname.startsWith("/api/browse/live")) { fr.remove(); toast("Kitsune couldn't seal that page, so it didn't run it."); } });
  // Everything the page needs goes with it in one form post: your cookies and its saved storage (only for sites you
  // allowed), your userscripts and styles, the mobile-site choice, and a form being submitted, if any.
  const post = t.livePost; t.livePost = null;
  Promise.all([cookieString(post?.url || t.data.url), US.livePayload(t.data.url), siteStorage(t.data.url)]).then(([ck, us, store]) => {
    t.usRunning = us.scripts.length + us.styles.length; paintUs(t);
    const fields = [["url", post?.url || t.data.url], ["cookie", ck], ["scripts", JSON.stringify(us.scripts)], ["styles", JSON.stringify(us.styles)], ["ua", mobileFor(t.data.url) ? "mobile" : ""], ["storage", store]];
    if (post) fields.push(["method", "POST"], ["body", post.body], ["ctype", post.ctype]);
    const f = document.createElement("form"); f.method = "POST"; f.action = "/api/browse/live"; f.target = "kblive-" + t.id; f.hidden = true;
    for (const [k, v] of fields) { const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v || ""; f.append(i); }
    document.body.append(f); f.submit(); f.remove();
  });
  paintShield(t);
  $("#kb-media", B.view).hidden = true;
}

// Messages from the live page. Only the page in our own frame is listened to.
addEventListener("message", async (e) => {
  const fr = B.view && $("#kb-live", B.view);
  if (!fr || e.source !== fr.contentWindow) return;
  const d = e.data; if (!d || !d.__kb) return;
  const t = T();
  if (d.type === "nav" && /^https?:/.test(d.url)) return go(d.url, { newTab: !!d.newTab });
  if (d.type === "url" && /^https?:/.test(d.url)) { $("#kb-url", B.view).value = d.url; t.virtualUrl = d.url; return; }
  if (d.type === "title" && d.title) { t.title = String(d.title).slice(0, 120); drawTabs(); return; }
  if (d.type === "post") return toast("This page wants to send a form, which could carry your details. Open it in your browser for that.", { action: "Open", onAction: () => window.open(t.url, "_blank", "noopener") });
  if (d.type === "ls" && d.data && typeof d.data === "object") return saveSiteStorage(t.url, d.data);
  if (d.type === "hist") { if (d.dir < 0) $("[data-b=back]", B.view)?.click(); else if (d.dir > 0) $("[data-b=fwd]", B.view)?.click(); else $("[data-b=reload]", B.view)?.click(); return; }
  if (d.type === "share") { const data = { title: String(d.title || ""), text: String(d.text || ""), url: /^https?:/.test(d.url) ? d.url : t.url }; if (navigator.share) navigator.share(data).catch(() => {}); else navigator.clipboard?.writeText(data.url).then(() => toast("Link copied to share.")); return; }
  if (d.type === "postnav" && d.url) return livePostNav(t, d);
  if (d.type === "gm-set" && d.id) return US.setValue(String(d.id), String(d.key), d.del ? undefined : d.value);
  if (d.type === "gm-notify") return toast(`${d.title ? d.title + ": " : ""}${String(d.text).slice(0, 200)}`, { ms: 6000 });
  if (d.type === "gm-clip") { navigator.clipboard?.writeText(String(d.text)).then(() => toast("A userscript copied something to your clipboard."), () => {}); return; }
  if (d.type === "gm-menu" && d.id) { (t.usMenus ||= []).push({ key: d.id + ":" + d.label, label: String(d.label), name: String(d.name || "") }); paintUs(t); return; }
  if (d.type === "gm-menu-remove") { t.usMenus = (t.usMenus || []).filter((x) => x.key !== d.key); return; }
  if (d.type === "nav" && /\.user\.(js|css)(\?|#|$)/i.test(d.url || "")) return US.installFromUrl(d.url);
  if (d.type === "cookies" && Array.isArray(d.list)) return storeSetCookies(d.list);
  if (d.type === "setcookie" && d.raw && d.host) return storeSetCookies([{ host: String(d.host), raw: String(d.raw) }]);
  if (d.type === "loaded") { if (t.shield) { t.shield.trackers += Number(d.trackers) || 0; paintShield(t); } return; }
  if (d.type === "stats") { t.liveStats = { text: d.text, nodes: d.nodes }; window.__kbLiveStats = t.liveStats; return; }
  if (d.type === "jserror") { (t.errlog ||= []).push({ msg: String(d.msg || "").slice(0, 500), at: Date.now() }); if (t.errlog.length > 200) t.errlog.shift(); if (t.shield) t.shield.errors++; (window.__kbLiveErrors ||= []).push(String(d.msg || "")); return; }
  if (d.type === "fetch") {
    const t0 = performance.now();
    const reply = (m, transfer) => { try { e.source.postMessage({ __kbr: 1, id: d.id, ...m }, "*", transfer || []); } catch {} };
    const method = String(d.method || "GET").toUpperCase();
    if (method === "OPTIONS") return reply({ status: 204, headers: {}, body: new ArrayBuffer(0) });
    if (!/^(GET|HEAD|POST|PUT|PATCH|DELETE)$/.test(method)) return reply({ error: `Live mode can't send ${method} requests.` });
    const body = !/^(GET|HEAD)$/.test(method) && d.body ? new Uint8Array(d.body) : null;
    if (body && body.length > 1_800_000) return reply({ error: "That upload is too big for live mode (the limit is about 1.8 MB)." });
    let url; try { url = new URL(d.url); } catch { return reply({ error: "Not a web address." }); }
    if (!/^https?:$/.test(url.protocol)) return reply({ error: "Only web addresses." });
    if (TRACKERS.test(url.hostname)) { t.shield && (t.shield.trackers++, t.shield.hosts.add(url.hostname)); paintShield(t); return reply({ status: 204, headers: {}, body: new ArrayBuffer(0) }); }
    try {
      const ch = await cookieHeaders(url.href);
      const kbh = { ...ch, ...(/^https?:/.test(t.url || "") ? { "X-KB-Referer": t.url } : {}), ...(d.headers && typeof d.headers === "object" && Object.keys(d.headers).length ? { "X-KB-Req-Headers": btoa(unescape(encodeURIComponent(JSON.stringify(d.headers)))) } : {}), ...(method !== "GET" && method !== "POST" ? { "X-KB-Method": method } : {}) };
      const r = await fetch("/api/browse/raw?url=" + encodeURIComponent(url.href), /^(GET|HEAD)$/.test(method) ? { headers: kbh } : { method: "POST", body: body || new Uint8Array(0), headers: { "Content-Type": String(d.ctype || "application/octet-stream").slice(0, 200), ...kbh } });
      const sc = r.headers.get("X-KB-Set-Cookie"); if (sc) { try { storeSetCookies(JSON.parse(atob(sc))); } catch {} }
      const buf = await r.arrayBuffer();
      (t.netlog ||= []).push({ m: method, url: url.href, s: r.status, n: buf.byteLength, ms: Math.round(performance.now() - t0), type: (r.headers.get("content-type") || "").split(";")[0] }); if (t.netlog.length > 400) t.netlog.shift();
      if (t.shield) t.shield.requests++;
      const n = $("#kb-live-n", B.view); if (n) n.textContent = ` · ${t.shield.requests}`;
      let extra = {}; try { extra = JSON.parse(atob(r.headers.get("X-KB-Headers") || "") || "{}"); } catch {}
      reply({ status: r.status, statusText: r.statusText, headers: { ...extra, "content-type": r.headers.get("content-type") || "" }, body: buf }, [buf]);
    } catch (err) { reply({ error: String(err.message || err) }); }
  }
});

// A page that's empty without its scripts gets an offer to run it live.
function suggestLive(root, t) {
  $("#kb-livetip", B.view)?.remove();
  if (!t.data?.html || isKids()) return;
  const text = (root.querySelector(".kb-body")?.innerText || "").replace(/\s+/g, " ").trim();
  const needsJs = /enable javascript|javascript (is )?(required|disabled)|requires javascript|turn on javascript|you need to enable/i.test(t.data.html.slice(0, 200000).match(/<noscript[\s\S]*?<\/noscript>/gi)?.join(" ") || "");
  const nScripts = (t.data.html.match(/<script/gi) || []).length;
  const thin = nScripts >= 1 && (text.length < 200 || (text.length < 400 && nScripts >= 3));
  if (!needsJs && !thin) return;
  try { const ec = WP4.embeddedContent(t.data.html, t.url), card = WC.rescueCard(ec, host(t.url)); if (card && !$("#kb-rescue-wrap", B.view)) { const wrap = document.createElement("div"); wrap.id = "kb-rescue-wrap"; wrap.innerHTML = card; $("#kb-body", B.view).prepend(wrap); } } catch {}
  const tip = document.createElement("div"); tip.id = "kb-livetip"; tip.className = "kb-livetip";
  tip.innerHTML = `${icon("play")}<span><strong>This page is built by JavaScript.</strong> Run it live in a sealed sandbox to see it properly.</span><button type="button" data-lt="once">Run it live</button><button type="button" data-lt="rescue">Show its text</button><button type="button" data-lt="always">Always for ${esc(host(t.url))}</button><button type="button" data-lt="x" aria-label="Dismiss">×</button>`;
  $("#kb-body", B.view).append(tip);
  tip.onclick = (e) => {
    const b = e.target.closest("[data-lt]"); if (!b) return;
    tip.remove(); if (b.dataset.lt === "x") return;
    if (b.dataset.lt === "rescue") return WP4.items(wp4ctx())[1].run();
    if (b.dataset.lt === "always") setLiveSite(host(t.url), true);
    t.mode = "live"; syncBar(); paint(t);
  };
}

// =====================================================================
// v76: optional cookies, kept on this device, per site, off by default
// =====================================================================
const regOf = (h) => h.split(".").slice(-2).join(".");
const ckSites = () => { try { return new Set(JSON.parse(localStorage.getItem("kitsune.cookieSites") || "[]")); } catch { return new Set(); } };
const cookiesAllowed = (url) => { try { return !settings.incognito && ckSites().has(regOf(new URL(url).hostname)); } catch { return false; } };
function setCookiesAllowed(url, on) { const s = ckSites(), r = regOf(new URL(url).hostname); on ? s.add(r) : s.delete(r); try { localStorage.setItem("kitsune.cookieSites", JSON.stringify([...s])); } catch {} }
const jarAll = async () => (await kvGet("webCookies", {})) || {};
async function cookiesFor(site) { const all = await jarAll(), now = Date.now(); return (all[site] || []).filter((c) => !c.exp || c.exp > now); }
async function clearCookies(site) { const all = { ...(await jarAll()) }; delete all[site]; await kvSet("webCookies", all); }
// The Cookie header for a URL: matching domain and path, not expired, secure ones only over https.
async function cookieString(url) {
  if (!cookiesAllowed(url)) return "";
  const u = new URL(url), list = await cookiesFor(regOf(u.hostname));
  return list.filter((c) => (u.hostname === c.domain || u.hostname.endsWith("." + c.domain) || (!c.hostOnly && u.hostname.endsWith(c.domain))) && u.pathname.startsWith(c.path || "/") && (!c.secure || u.protocol === "https:"))
    .sort((a, b) => (b.path || "").length - (a.path || "").length).map((c) => `${c.name}=${c.value}`).join("; ");
}
async function cookieHeaders(url) { const c = await cookieString(url); return c ? { "X-KB-Cookie": c } : {}; }
// Keeps cookies a site set (only for sites you allowed), the way a browser would read Set-Cookie.
async function storeSetCookies(list) {
  const all = { ...(await jarAll()) }; let changed = false;
  for (const { host: h, raw } of list || []) {
    if (!h || !raw || !ckSites().has(regOf(h)) || settings.incognito) continue;
    const [kv, ...attrs] = String(raw).split(";"), eq = kv.indexOf("="); if (eq < 1) continue;
    const c = { name: kv.slice(0, eq).trim(), value: kv.slice(eq + 1).trim(), domain: h, path: "/", hostOnly: true, secure: false, exp: 0 };
    for (const a of attrs) {
      const [k0, ...v0] = a.split("="), k = k0.trim().toLowerCase(), v = v0.join("=").trim();
      if (k === "domain" && v) { const d = v.replace(/^\./, "").toLowerCase(); if (h === d || h.endsWith("." + d)) { c.domain = d; c.hostOnly = false; } }
      else if (k === "path" && v.startsWith("/")) c.path = v;
      else if (k === "secure") c.secure = true;
      else if (k === "max-age") c.exp = Number(v) <= 0 ? 1 : Date.now() + Number(v) * 1000;
      else if (k === "expires" && !c.exp) { const t = Date.parse(v); if (t) c.exp = t; }
    }
    const site = regOf(c.domain), jar = (all[site] || []).filter((x) => !(x.name === c.name && x.domain === c.domain && x.path === c.path));
    if (!(c.exp && c.exp < Date.now())) jar.push(c); // an expired cookie is a deletion
    all[site] = jar.slice(-150); changed = true;
  }
  if (changed) await kvSet("webCookies", all);
}
async function cookieManager() {
  const all = await jarAll(), sites = [...new Set([...ckSites(), ...Object.keys(all)])].sort();
  const m = modal({ title: "Cookies and site data", wide: true, body: `<p class="muted" style="margin-top:0">Kitsune's browser sends no cookies unless you allow them for a site. Allowed cookies stay on this device and only go to their own site, through Kitsune's server, when you visit it. Incognito never uses them.</p>
    ${sites.length ? `<div class="kb-feeds">${sites.map((s) => `<div class="kb-feedrow"><img src="${esc(favicon("https://" + s))}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span><strong>${esc(s)}</strong><small>${plural((all[s] || []).filter((c) => !c.exp || c.exp > Date.now()).length, "cookie")} · ${ckSites().has(s) ? "allowed" : "not allowed"}</small></span>
      <span style="display:flex;gap:6px"><button class="btn btn-sm" type="button" data-cktoggle="${esc(s)}">${ckSites().has(s) ? "Block" : "Allow"}</button><button class="btn btn-sm" type="button" data-ckclear="${esc(s)}">Clear</button></span></div>`).join("")}</div>` : `<p class="muted">No sites yet. Allow cookies for a site from its Shield panel.</p>`}`,
    actions: `${sites.length ? `<button class="btn" type="button" id="ck-all" style="color:var(--bad)">${icon("trash")}Clear all cookies</button>` : ""}<button class="btn btn-accent" type="button" data-close>Done</button>` });
  m.root.addEventListener("click", async (e) => {
    const tg = e.target.closest("[data-cktoggle]"), cl = e.target.closest("[data-ckclear]");
    if (tg) { const s = tg.dataset.cktoggle; setCookiesAllowed("https://" + s, !ckSites().has(s)); m.close(); cookieManager(); }
    if (cl) { await clearCookies(cl.dataset.ckclear); m.close(); cookieManager(); }
    if (e.target.closest("#ck-all")) { await kvSet("webCookies", {}); m.close(); toast("All browser cookies cleared."); }
  });
}

// =====================================================================
// v77: pinned tabs, text size per site, reading progress, page info
// =====================================================================
const siteZoom = (h) => { try { return JSON.parse(localStorage.getItem("kitsune.siteZoom") || "{}")[h] || 0; } catch { return 0; } };
function setSiteZoom(h, z) { if (!h) return; try { const all = JSON.parse(localStorage.getItem("kitsune.siteZoom") || "{}"); if (z === 1) delete all[h]; else all[h] = z; localStorage.setItem("kitsune.siteZoom", JSON.stringify(all)); } catch {} }
// double-click a tab to pin it
document.addEventListener("dblclick", (e) => { const tab = e.target.closest?.("#kb-tabs [data-tab]"); if (tab) togglePin(Number(tab.dataset.tab)); });

function readProgress(scroller) {
  $("#kb-readbar", B.view)?.remove();
  const bar = document.createElement("div"); bar.id = "kb-readbar"; bar.className = "kb-readbar"; bar.innerHTML = "<i></i>";
  $("#kb-body", B.view).append(bar);
  const paint = () => { const max = scroller.scrollHeight - scroller.clientHeight; bar.firstChild.style.width = (max > 40 ? Math.min(100, (scroller.scrollTop / max) * 100) : 0) + "%"; };
  scroller.addEventListener("scroll", paint, { passive: true }); paint();
  rememberScroll(scroller);
  showPageNote();
  topButton(scroller);
  offerTranslate();
}

function pageInfo() {
  const t = T(), root = pageRoot(); if (!t.data) return toast("Open a page first.");
  const doc = new DOMParser().parseFromString(t.data.html || "", "text/html");
  const text = (doc.body?.textContent || "").replace(/\s+/g, " ").trim(), words = text ? text.split(" ").length : 0;
  const links = doc.querySelectorAll("a[href]").length, imgs = doc.querySelectorAll("img").length, scripts = doc.querySelectorAll("script").length;
  const lang = doc.documentElement.lang || "not stated", desc = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  const author = doc.querySelector('meta[name="author"]')?.getAttribute("content") || "", published = doc.querySelector('meta[property="article:published_time"], time[datetime]')?.getAttribute("content") || doc.querySelector("time[datetime]")?.getAttribute("datetime") || "";
  const rows = [
    ["Address", t.url], ["Title", t.title], desc && ["Description", desc], author && ["Author", author], published && ["Published", new Date(published).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })],
    ["Language", lang], ["Words", `${words.toLocaleString()} (about ${Math.max(1, Math.round(words / 230))} min to read)`], ["Links", links.toLocaleString()], ["Pictures", imgs.toLocaleString()],
    ["Scripts", t.mode === "live" ? `${scripts} running in a sealed sandbox` : `${scripts}, none run`], ["Mode", { page: "Page (no scripts)", reader: "Reader", live: "Live (sandboxed JavaScript)" }[t.mode] || t.mode],
    ["Feed", t.feed ? "Yes, you can follow it" : "None found"], ["Site search", "Type “" + host(t.url) + " …” style keywords after Kitsune learns it"],
    ["Cookies", cookiesAllowed(t.url) ? "Allowed for this site" : "Off (none sent)"], ["Connection", t.url.startsWith("https:") ? "Encrypted (https)" : "Not encrypted (http)"],
  ].filter(Boolean);
  modal({ title: "Page info", wide: true, body: `<dl class="kb-info">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(String(v))}</dd>`).join("")}</dl>` });
  void root;
}

// =====================================================================
// v78: userscripts and user styles
// =====================================================================
async function userStylesInPage(root, t) {
  const css = await US.stylesFor(t.url);
  const rest = (root.adoptedStyleSheets || []).filter((s) => !s.__user);
  const scripts = (await US.forUrl(t.url, "script")).length;
  t.usRunning = 0; paintUs(t, scripts);
  if (scripts && t.mode !== "live" && !$("#kb-livetip", B.view)) {
    const tip = document.createElement("div"); tip.id = "kb-livetip"; tip.className = "kb-livetip";
    tip.innerHTML = `${icon("edit")}<span><strong>${plural(scripts, "userscript")} for this site.</strong> Userscripts run in Live mode, inside a sealed sandbox.</span><button type="button" data-lt="once">Run them</button><button type="button" data-lt="always">Always for ${esc(host(t.url))}</button><button type="button" data-lt="x" aria-label="Dismiss">×</button>`;
    $("#kb-body", B.view).append(tip);
    tip.onclick = (e) => { const b = e.target.closest("[data-lt]"); if (!b) return; tip.remove(); if (b.dataset.lt === "x") return; if (b.dataset.lt === "always") setLiveSite(host(t.url), true); t.mode = "live"; syncBar(); paint(t); };
  }
  if (!css) { root.adoptedStyleSheets = rest; return; }
  const sheet = new CSSStyleSheet(); sheet.__user = true;
  try { sheet.replaceSync(scopeCss(css).css); } catch {}
  root.adoptedStyleSheets = [...rest, sheet];
}
function paintUs(t, matching) {
  const b = $("#kb-us", B.view); if (!b) return;
  const n = t.mode === "live" ? t.usRunning || 0 : matching || 0;
  $("#kb-us-n", B.view).textContent = n ? String(n) : "";
  b.classList.toggle("on", !!n);
  b.title = t.mode === "live" ? (n ? `${plural(n, "userscript or style", "userscripts and styles")} running here` : "Userscripts and styles") : (n ? `${plural(n, "userscript")} for this site (they run in Live mode)` : "Userscripts and styles");
}
async function usPanel() {
  const t = T(), url = t.url || "";
  const here = url ? (await US.all()).filter((s) => US.runsOn(s.meta, url)) : [];
  const menus = t.mode === "live" ? t.usMenus || [] : [];
  if (!here.length && !menus.length) return US.manager({ url });
  const m = modal({ title: "Userscripts on this page", body: `
    <div class="us-list">${here.map((s) => `<div class="us-row ${s.enabled ? "" : "off"}"><span class="us-main"><strong>${esc(s.meta.name)}</strong><small>${s.kind === "style" ? "Style" : "Script"} · ${s.enabled ? (t.mode === "live" || s.kind === "style" ? "running" : "runs in Live mode") : "off"}</small></span></div>`).join("")}</div>
    ${menus.length ? `<h4 class="kb-mh">Commands</h4><div class="us-cmds">${menus.map((c, i) => `<button class="btn btn-sm" type="button" data-cmd="${i}">${esc(c.label)}<small>${esc(c.name)}</small></button>`).join("")}</div>` : ""}`,
    actions: `${t.mode !== "live" && here.some((s) => s.kind === "script" && s.enabled) ? `<button class="btn" type="button" id="usp-live">Run them (Live)</button>` : ""}<button class="btn" type="button" id="usp-manage">Manage…</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  m.root.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cmd]");
    if (c) { const fr = $("#kb-live", B.view); fr?.contentWindow?.postMessage({ __kbmenu: 1, key: menus[+c.dataset.cmd].key }, "*"); m.close(); }
    if (e.target.closest("#usp-manage")) { m.close(); US.manager({ url }); }
    if (e.target.closest("#usp-live")) { m.close(); t.mode = "live"; syncBar(); paint(t); }
  });
}

// =====================================================================
// v79: web compatibility
// =====================================================================
// ---------- site storage (localStorage) kept for sites you allowed cookies and site data ----------
async function siteStorage(url) {
  if (!cookiesAllowed(url)) return "";
  const all = (await kvGet("webStorage", {})) || {}, s = all[regOf(new URL(url).hostname)];
  return s ? btoa(unescape(encodeURIComponent(JSON.stringify(s)))) : "";
}
async function saveSiteStorage(url, data) {
  if (!url || !cookiesAllowed(url)) return;
  const json = JSON.stringify(data); if (json.length > 1_000_000) return;
  const all = { ...((await kvGet("webStorage", {})) || {}) }; all[regOf(new URL(url).hostname)] = data; await kvSet("webStorage", all);
}

// ---------- forms that send data, in live mode ----------
async function livePostNav(t, d) {
  const site = regOf(host(d.url));
  if (!cookiesAllowed(d.url)) {
    return toast(`This form sends data to ${site}. Allow cookies for ${site} in the Shield panel to sign in or submit forms here, or open it in your browser.`, { action: "Open in browser", onAction: () => window.open(t.url, "_blank", "noopener"), ms: 9000 });
  }
  let ok = true;
  try { ok = JSON.parse(localStorage.getItem("kitsune.postOk") || "[]").includes(site); } catch {}
  if (!ok) {
    const { confirmBox } = await import("../util.js");
    if (!(await confirmBox(`Send this form to ${site}?`, `What you typed goes to ${site} through Kitsune's server, the way your browser would send it. Only do this on sites you trust.`, "Send", false))) return;
    try { const list = JSON.parse(localStorage.getItem("kitsune.postOk") || "[]"); localStorage.setItem("kitsune.postOk", JSON.stringify([...list, site])); } catch {}
  }
  const bytes = new Uint8Array(d.body || new ArrayBuffer(0));
  let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  t.livePost = { url: d.url, body: btoa(bin), ctype: String(d.ctype || "application/x-www-form-urlencoded") };
  liveView(t);
}

// ---------- desktop or mobile site (an honest "Mobile" marker, nothing more) ----------
const mobileSites = () => { try { return new Set(JSON.parse(localStorage.getItem("kitsune.mobileSites") || "[]")); } catch { return new Set(); } };
const mobileFor = (url) => { try { return mobileSites().has(regOf(new URL(url).hostname)); } catch { return false; } };
function setMobile(url, on) { try { const s = mobileSites(), r = regOf(new URL(url).hostname); on ? s.add(r) : s.delete(r); localStorage.setItem("kitsune.mobileSites", JSON.stringify([...s])); toast(on ? `Asking ${r} for its mobile site.` : `Asking ${r} for its desktop site.`); } catch {} }

// ---------- pages that redirect themselves ----------
function followRefresh(t, doc) {
  const m = (doc.querySelector('meta[http-equiv="refresh" i]')?.getAttribute("content") || t.data.refresh || "").match(/^\s*(\d+)\s*[;,]\s*url\s*=\s*['"]?([^'"]+)/i);
  if (!m || Number(m[1]) > 8) return false;
  let next; try { next = new URL(m[2].trim(), t.data.url).href; } catch { return false; }
  if (next === t.data.url || (t.hops = (t.hops || 0) + 1) > 3) return false;
  toast("Following this page's redirect…", { ms: 1500 });
  go(next, { push: false });
  return true;
}

// ---------- bot checks: explain them and offer real alternatives (Kitsune doesn't try to get around them) ----------
function botWall(t, doc) {
  const title = (doc.title || "").trim(), text = (doc.body?.textContent || "").replace(/\s+/g, " ").slice(0, 2000);
  const wall = /^(just a moment|attention required|access denied|verifying|are you a robot|please wait|ddos-guard|security check)/i.test(title) || (/cf-chl|challenge-platform|captcha|verify you are (a )?human|enable javascript and cookies to continue/i.test(t.data.html.slice(0, 60000)) && text.length < 600);
  if (!wall) return false;
  t.hops = 0;
  $("#kb-body", B.view).innerHTML = `<div class="kb-err"><h2>${esc(host(t.data.url))} is checking for robots</h2>
    <p>This site shows a security check to apps like Kitsune before it shows the page. Kitsune doesn't try to get around those checks.</p>
    <div class="hero-actions"><a class="btn btn-accent" href="${esc(t.data.url)}" target="_blank" rel="noopener">${icon("link")}Open in your browser</a>
      <button class="btn" type="button" data-b="wayback">${icon("clock")}Read an archived copy</button>
      <button class="btn" type="button" data-websearch="${esc(t.data.url)}">${icon("search")}Search for it elsewhere</button></div></div>`;
  return true;
}

// ---------- viewers: PDFs, pictures, video, audio ----------
function viewFile(t, r) {
  const type = r.file.type || "", name = r.file.name || "", body = $("#kb-body", B.view);
  t.title = decodeURIComponent(name || host(r.url)); drawTabs(); remember(r.url, t.title);
  if (/^image\//.test(type) || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)) {
    body.innerHTML = `<div class="kb-view kb-view-img"><img src="${esc(r.url)}" alt="${esc(name)}" referrerpolicy="no-referrer"><p>${esc(name)} · ${(r.file.size / 1e6).toFixed(1)} MB</p></div>`;
    $("img", body).onclick = () => E.lightbox([{ src: r.url, alt: name, full: r.url }], 0);
    return true;
  }
  if (/^(video|audio)\//.test(type) || /\.(mp4|webm|mov|m4v|mp3|m4a|ogg|oga|opus|flac|wav)$/i.test(name)) {
    const tag = /^audio|\.(mp3|m4a|ogg|oga|opus|flac|wav)$/i.test(type + " " + name) ? "audio" : "video";
    body.innerHTML = `<div class="kb-view kb-view-media"><${tag} src="${esc(r.url)}" controls preload="metadata" referrerpolicy="no-referrer"></${tag}><p>${esc(name)}</p></div>`;
    return true;
  }
  if (/pdf/.test(type) || /\.pdf$/i.test(name)) { viewPdf(t, r); return true; }
  return false;
}
async function viewPdf(t, r) {
  const body = $("#kb-body", B.view);
  body.innerHTML = `<div class="kb-loading"><span class="kb-spin"></span>Opening the PDF…</div>`;
  try {
    const res = await fetch("/api/browse/file?url=" + encodeURIComponent(r.url));
    if (!res.ok) throw new Error(res.status === 413 ? "too big" : "failed");
    const data = new Uint8Array(await res.arrayBuffer());
    const { getPdfjs } = await import("../util.js"), pdfjs = await getPdfjs();
    const pdf = await pdfjs.getDocument({ data }).promise;
    if (T() !== t) return;
    body.innerHTML = `<div class="kb-pdf" id="kb-pdf"><div class="kb-pdfbar"><strong>${esc(t.title)}</strong><span>${pdf.numPages} pages</span><button class="btn btn-sm" type="button" data-import="${esc(r.url)}" data-name="${esc(r.file.name || "document.pdf")}">${icon("plus")}Add to my library</button></div><div class="kb-pdfpages" id="kb-pdfpages"></div></div>`;
    const pages = $("#kb-pdfpages", body), width = Math.min(1000, pages.clientWidth - 24 || 800);
    const io = new IntersectionObserver(async (es) => { for (const e of es) if (e.isIntersecting && !e.target.dataset.done) { e.target.dataset.done = "1"; const n = +e.target.dataset.n, pg = await pdf.getPage(n), vp0 = pg.getViewport({ scale: 1 }), scale = (width / vp0.width) * (devicePixelRatio || 1), vp = pg.getViewport({ scale }); const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; c.style.width = width + "px"; await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise; e.target.replaceChildren(c); } }, { root: $("#kb-pdf", body), rootMargin: "800px" });
    for (let n = 1; n <= Math.min(pdf.numPages, 400); n++) { const d = document.createElement("div"); d.className = "kb-pdfpage"; d.dataset.n = n; d.style.width = width + "px"; d.style.aspectRatio = "1 / 1.3"; d.textContent = "Page " + n; pages.append(d); io.observe(d); }
  } catch (e) { if (T() === t) fileCard(r); }
}

// ---------- viewers: JSON as a tree, Markdown as a page, text with line numbers ----------
function viewText(t, r) {
  const body = $("#kb-body", B.view), name = r.url.split(/[?#]/)[0];
  if (r.kind === "json") {
    let data; try { data = JSON.parse(r.text); } catch { data = undefined; }
    if (data !== undefined) {
      const node = (v, k, depth) => {
        const key = k != null ? `<span class="jk">${esc(String(k))}</span>: ` : "";
        if (v && typeof v === "object") {
          const arr = Array.isArray(v), entries = arr ? v.map((x, i) => [i, x]) : Object.entries(v);
          return `<details ${depth < 2 ? "open" : ""}><summary>${key}<span class="jt">${arr ? `Array(${v.length})` : `{${entries.length}}`}</span></summary><div class="jc">${entries.slice(0, 500).map(([kk, vv]) => node(vv, kk, depth + 1)).join("")}${entries.length > 500 ? `<div class="jm">… ${entries.length - 500} more</div>` : ""}</div></details>`;
        }
        const cls = typeof v === "string" ? "js" : typeof v === "number" ? "jn" : "jb";
        const shown = typeof v === "string" ? (/^https?:\/\//.test(v) ? `<a href="${esc(v)}" data-go="${esc(v)}">"${esc(v)}"</a>` : `"${esc(v.length > 400 ? v.slice(0, 400) + "…" : v)}"`) : esc(String(v));
        return `<div class="jl">${key}<span class="${cls}">${shown}</span></div>`;
      };
      body.innerHTML = `<div class="kb-view kb-json"><div class="kb-jsonbar"><strong>JSON</strong><button class="btn btn-sm" type="button" id="kb-jraw">Raw</button></div><div id="kb-jtree">${node(data, null, 0)}</div><pre class="kb-plain" id="kb-jtext" hidden>${esc(JSON.stringify(data, null, 2))}</pre></div>`;
      $("#kb-jraw", body).onclick = () => { $("#kb-jtree", body).hidden = !$("#kb-jtree", body).hidden; $("#kb-jtext", body).hidden = !$("#kb-jtext", body).hidden; };
      body.querySelectorAll("a[data-go]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); go(a.dataset.go); }));
      return;
    }
  }
  if (/\.(md|markdown)$/i.test(name)) { body.innerHTML = `<article class="kb-reader kb-md"><div class="kb-art">${markdown(r.text)}</div></article>`; return; }
  const lines = r.text.split("\n");
  body.innerHTML = `<div class="kb-view kb-text"><div class="kb-textnums" aria-hidden="true">${lines.slice(0, 20000).map((_, i) => i + 1).join("\n")}</div><pre>${esc(lines.slice(0, 20000).join("\n"))}</pre></div>`;
}
// A small, safe Markdown renderer (headings, lists, quotes, code, links, emphasis).
// With a base address, relative links and images resolve against the page that served the Markdown.
function markdown(md, base = "") {
  const rel = (u) => { if (!base || /^(https?:|mailto:|data:|#)/i.test(u)) return u; try { return new URL(u, base).href; } catch { return u; } };
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img alt="${a}" src="${esc(rel(u))}" referrerpolicy="no-referrer">`).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, a, u) => `<a href="${esc(rel(u))}">${a}</a>`);
  const out = []; let list = null, code = null;
  for (const line of String(md).split("\n")) {
    if (/^```/.test(line)) { if (code) { out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`); code = null; } else code = []; continue; }
    if (code) { code.push(line); continue; }
    const h = line.match(/^(#{1,6})\s+(.*)/), li = line.match(/^\s*([-*+]|\d+\.)\s+(.*)/);
    if (li) { const tag = /\d/.test(li[1]) ? "ol" : "ul"; if (list !== tag) { if (list) out.push(`</${list}>`); out.push(`<${tag}>`); list = tag; } out.push(`<li>${inline(li[2])}</li>`); continue; }
    if (list) { out.push(`</${list}>`); list = null; }
    if (h) out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
    else if (/^>\s?/.test(line)) out.push(`<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`);
    else if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) out.push("<hr>");
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push(`</${list}>`); if (code) out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
  return out.join("");
}

// Raw Markdown on the web (READMEs, author notes, changelogs) opens as the formatted document it is.
function mdView(t, r) {
  const body = $("#kb-body", B.view);
  body.innerHTML = `<div class="kb-view kb-md"><div class="kb-md-bar"><span>${esc((r.url.split("/").pop() || "document").slice(0, 60))}</span><button class="btn btn-sm" type="button" id="kb-md-raw">Raw</button></div>${markdown((r.text || "").slice(0, 400000), r.url)}</div>`;
  $("#kb-md-raw", body).onclick = () => viewText(t, r);
}

// ---------- extensions: your scripts, styles and daemons as one shareable bundle ----------
async function extensionsHub() {
  const D = await import("../daemons.js"), us = await US.all(), dm = await D.all();
  const m = modal({ title: "Extensions", body: `<p class="muted" style="margin-top:0">${plural(us.filter((x) => x.kind === "script").length, "userscript")}, ${plural(us.filter((x) => x.kind === "style").length, "style")} and ${plural(dm.length, "daemon")}. Save them as one file to back up or share, or load a bundle.</p>
    <div class="toolbar" style="margin:0"><button class="btn btn-accent" type="button" id="ex-out">${icon("download")}Export bundle</button><label class="btn">${icon("upload")}Import bundle<input type="file" id="ex-in" accept=".json" hidden></label>
    <button class="btn" type="button" id="ex-us">Userscripts…</button><button class="btn" type="button" id="ex-dm">Daemons…</button></div>` });
  $("#ex-out", m.root).onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ kitsuneExtensions: 1, userscripts: us, daemons: dm.map(({ state, values, lastRun, lastLog, ...d }) => d) }, null, 2)], { type: "application/json" })); a.download = "kitsune-extensions.json"; document.body.append(a); a.click(); a.remove(); };
  $("#ex-in", m.root).onchange = async (e) => {
    try {
      const b = JSON.parse(await e.target.files[0].text()); if (!b.kitsuneExtensions) throw new Error("That isn't a Kitsune extensions file.");
      const { confirmBox } = await import("../util.js");
      if (!(await confirmBox("Import these extensions?", `${plural((b.userscripts || []).length, "userscript or style", "userscripts and styles")} and ${plural((b.daemons || []).length, "daemon")}. Scripts run only in sealed sandboxes, but only import bundles from people you trust.`, "Import", false))) return;
      const have = new Set(us.map((x) => x.id)), hd = new Set(dm.map((x) => x.id));
      await kvSet("userscripts", [...us, ...(b.userscripts || []).filter((x) => x.code && !have.has(x.id)).map((x) => ({ ...x, meta: US.parseMeta(x.code) }))]);
      await kvSet("daemons", [...dm, ...(b.daemons || []).filter((x) => x.kind && !hd.has(x.id))]);
      m.close(); toast("Extensions imported.");
    } catch (err) { toast(err.message); }
  };
  $("#ex-us", m.root).onclick = () => { m.close(); US.manager({ url: T().url || "" }); };
  $("#ex-dm", m.root).onclick = () => { m.close(); D.manager(T().url || ""); };
}

// =====================================================================
// v81: more compatibility
// =====================================================================
// A secure page can't show plain-http pictures, so those come through Kitsune.
const viaImg = (u) => (/^http:\/\//i.test(u) ? "/api/browse/img?url=" + encodeURIComponent(u) : u);
// Old framed sites (<frameset>): each frame becomes something you can open, instead of a blank page.
function framesToCards(doc, abs) {
  const frames = [...doc.querySelectorAll("frameset frame[src], frameset iframe[src]")];
  if (!frames.length) return;
  const body = doc.createElement("body");
  body.innerHTML = `<div style="max-width:640px;margin:40px auto;font:16px/1.5 system-ui,sans-serif"><h1 style="font-size:22px">This page is made of ${frames.length} frames</h1><p>Open each part:</p><ul>${frames.map((f, i) => { const u = abs(f.getAttribute("src")); return `<li><a href="${esc(u)}">${esc(f.getAttribute("name") || f.getAttribute("title") || "Frame " + (i + 1))}</a> <small style="color:#888">${esc(u)}</small></li>`; }).join("")}</ul></div>`;
  doc.querySelectorAll("frameset").forEach((n) => n.remove());
  doc.documentElement.append(body);
}

// ---------- v82: AI about the page you're on ----------
async function aiPage(prompt, title) {
  const t = T(); if (!t.url) return toast("Open a page first.");
  const d = t.doc, el = d && (d.querySelector("article, main, [role=main]") || d.body);
  const text = (el?.textContent || t.data?.text || "").replace(/\s+/g, " ").trim();
  if (!text) return toast("There's no text on this page to work with.");
  (await import("../ai.js")).askPanel({ title, prompt, context: `Page title: ${t.title}\nAddress: ${t.url}\n\n${text.slice(0, 12000)}`,
    system: "You answer questions about the web page given in the context. Base answers on the page; if it doesn't say, say so. Be concise." });
}
// Pages built for scripts that never run in page mode: AMP pictures and videos become normal ones; content hidden until a framework loads is shown.
function compatFixups(doc, t, abs = (u) => u) {
  // pictures embedded as <object> or <embed> (often SVG diagrams) become ordinary pictures
  doc.querySelectorAll('object[data], embed[src]').forEach((o) => { const src = o.getAttribute("data") || o.getAttribute("src") || "", type = o.getAttribute("type") || ""; if (!/^image\//.test(type) && !/\.(svg|png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(src)) return; const im = doc.createElement("img"); im.setAttribute("src", src); im.setAttribute("alt", o.getAttribute("title") || o.getAttribute("aria-label") || o.textContent.trim().slice(0, 120) || ""); for (const k of ["width", "height", "class"]) if (o.hasAttribute(k)) im.setAttribute(k, o.getAttribute(k)); o.replaceWith(im); });
  doc.querySelectorAll("svg a").forEach((a) => { const x = a.getAttribute("xlink:href"); if (x && !a.getAttribute("href")) a.setAttribute("href", x); });
  // pages made for dark backgrounds only
  const cs = (doc.querySelector('meta[name="color-scheme"]')?.getAttribute("content") || "").toLowerCase().trim();
  if (cs === "dark" || cs === "only dark") doc.documentElement.classList.add("kb-cs-dark");
  doc.querySelectorAll("svg image, track[src]").forEach((n) => { for (const a of ["href", "xlink:href", "src"]) { const v = n.getAttribute(a); if (v && !v.startsWith("#") && !/^data:/.test(v)) n.setAttribute(a, n.tagName === "TRACK" ? abs(v) : viaImg(abs(v))); } });
  if (saverOn(t?.url)) doc.querySelectorAll("img, picture source").forEach((im) => {
    if (im.tagName === "SOURCE") return im.remove();
    const s = im.getAttribute("data-src") || im.getAttribute("data-lazy-src") || im.getAttribute("src") || ""; if (!s || /^data:/.test(s)) return;
    im.setAttribute("data-kb-src", abs(s)); for (const a of ["src", "srcset", "data-src", "data-srcset", "data-lazy-src"]) im.removeAttribute(a);
    im.setAttribute("alt", im.getAttribute("alt") || "Picture"); im.setAttribute("title", "Data saver: click to load this picture");
  });
  const bodyText = (doc.body?.textContent || "").replace(/\s+/g, " ").trim();
  if (bodyText.length < 200 && doc.body) {
    const a = ldArticle(doc);
    if (a && a.body.length > bodyText.length) {
      const art = doc.createElement("article"); art.setAttribute("data-kb-ld", ""); art.setAttribute("style", "max-width:720px;margin:24px auto;font:18px/1.6 Georgia,serif;color:#222");
      art.innerHTML = `${a.image ? `<img src="${esc(a.image)}" alt="" style="width:100%;border-radius:8px">` : ""}<h1 style="font-size:30px;line-height:1.2">${esc(a.title)}</h1>${a.author ? `<p style="color:#666">${esc(a.author)}</p>` : ""}${a.body.split(/\n{1,}/).map((p) => `<p>${esc(p)}</p>`).join("")}`;
      doc.body.prepend(art);
    }
  }
  doc.querySelectorAll("amp-img, amp-anim").forEach((n) => { const i = doc.createElement("img"); for (const k of ["src", "srcset", "alt", "width", "height", "sizes", "title"]) if (n.hasAttribute(k)) i.setAttribute(k, n.getAttribute(k)); n.replaceWith(i); });
  doc.querySelectorAll("amp-video, amp-audio").forEach((n) => { const v = doc.createElement(n.tagName === "AMP-AUDIO" ? "audio" : "video"); for (const k of ["src", "poster", "width", "height"]) if (n.hasAttribute(k)) v.setAttribute(k, n.getAttribute(k)); v.append(...n.querySelectorAll("source, track")); n.replaceWith(v); });
  doc.querySelectorAll("amp-youtube[data-videoid]").forEach((n) => { const a = doc.createElement("a"); a.href = "https://www.youtube.com/watch?v=" + n.getAttribute("data-videoid"); a.textContent = "YouTube video"; n.replaceWith(a); });
  for (const a of ["x-cloak", "v-cloak", "ng-cloak", "data-cloak"]) doc.querySelectorAll(`[${a}]`).forEach((n) => n.removeAttribute(a));
  doc.documentElement.classList.remove("async-hide", "wf-loading");
  doc.body?.classList.remove("loading", "is-loading", "preload");
}

// ---------- v83: more compatibility ----------
// Icons drawn from a sprite file (<use href="/icons.svg#cart">) can't load into Kitsune's page view, so the symbols are copied in.
async function inlineSprites(root, base) {
  const uses = [...root.querySelectorAll("use")].map((u) => [u, u.getAttribute("href") || u.getAttribute("xlink:href") || ""]).filter(([, h]) => h && !h.startsWith("#") && h.includes("#"));
  if (!uses.length) return;
  const files = new Map();
  for (const [u, h] of uses) { let abs; try { abs = new URL(h, base); } catch { continue; } const id = decodeURIComponent(abs.hash.slice(1)); abs.hash = ""; (files.get(abs.href) || files.set(abs.href, []).get(abs.href)).push([u, id]); }
  const holder = document.createElementNS("http://www.w3.org/2000/svg", "svg"); holder.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden"); holder.setAttribute("aria-hidden", "true");
  root.append(holder);
  let n = 0;
  for (const [file, list] of [...files].slice(0, 6)) {
    try {
      const r = await fetch("/api/browse/raw?url=" + encodeURIComponent(file)); if (!r.ok) continue;
      const svg = new DOMParser().parseFromString(await r.text(), "image/svg+xml");
      if (svg.querySelector("parsererror")) continue;
      svg.querySelectorAll("script, foreignObject").forEach((x) => x.remove());
      svg.querySelectorAll("*").forEach((el) => [...el.attributes].forEach((a) => /^on/i.test(a.name) && el.removeAttribute(a.name)));
      const done = new Map();
      for (const [u, id] of list) {
        if (!done.has(id)) { const src = svg.getElementById(id); if (!src) continue; const c = document.importNode(src, true), nid = "kbs" + ++n + "-" + id.replace(/[^\w-]/g, ""); c.id = nid; holder.append(c); done.set(id, nid); }
        u.setAttribute("href", "#" + done.get(id)); u.removeAttribute("xlink:href");
      }
    } catch {}
  }
}
// Pages that are drawn by their scripts (React, Vue and friends) come out nearly empty without them.
function scriptAppHint(root, t) {
  const text = (root.querySelector(".kb-body")?.textContent || "").replace(/\s+/g, " ").trim();
  if (text.length > 160 || !t.shield?.scripts || root.querySelector("[data-kb-ld]")) return;
  const bar = document.createElement("div");
  bar.setAttribute("style", "margin:10px;padding:12px 14px;border-radius:10px;background:#fff6e0;color:#3a2a00;font:14px/1.4 system-ui,sans-serif;display:flex;gap:10px;align-items:center;flex-wrap:wrap");
  bar.innerHTML = `<span style="flex:1;min-width:200px">This page is drawn by its scripts, so it looks empty here.</span><button type="button" data-kbl="1" style="font:inherit;padding:6px 12px;border-radius:8px;border:1px solid #c9a24a;background:#fff;cursor:pointer">Open in Live mode</button><button type="button" data-kbl="2" style="font:inherit;padding:6px 12px;border-radius:8px;border:1px solid #c9a24a;background:#fff;cursor:pointer">Always for this site</button>`;
  bar.addEventListener("click", (e) => { const b = e.target.closest("[data-kbl]"); if (!b) return; e.stopPropagation(); if (b.dataset.kbl === "2") setLiveSite(host(t.url), true); t.mode = "live"; syncBar(); liveView(t); });
  root.querySelector(".kb-html")?.prepend(bar);
}
// When a page has no text of its own but describes its article in structured data (JSON-LD), show that.
function ldArticle(doc) {
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let j; try { j = JSON.parse(s.textContent); } catch { continue; }
    const all = [].concat(j, j?.["@graph"] || []).flat().filter(Boolean);
    const a = all.find((x) => x.articleBody || (/(Article|BlogPosting|Report)$/.test([].concat(x["@type"] || []).join(" ")) && x.description));
    if (a) return { title: String(a.headline || a.name || ""), body: String(a.articleBody || a.description || ""), author: [].concat(a.author || []).map((x) => x?.name || x).filter((x) => typeof x === "string").join(", "), image: [].concat(a.image || []).map((x) => x?.url || x).find((x) => typeof x === "string") || "" };
  }
  return null;
}

// =====================================================================
// v84: tabs you closed, offline pages, resume reading, auto-scroll, picture-in-picture, QR codes
// =====================================================================
const CLOSED = [];
function rememberClosed(t) { if (t?.url && !settings.incognito) { CLOSED.unshift({ url: t.url, title: t.title || host(t.url), at: Date.now() }); CLOSED.length = Math.min(CLOSED.length, 25); } }
function reopenClosed(i = 0) { const c = CLOSED.splice(i, 1)[0]; if (!c) return toast("No recently closed tabs."); go(c.url, { newTab: true }); }
const ago = (ms) => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : new Date(ms).toLocaleDateString(); };
function closedDialog() {
  if (!CLOSED.length) return toast("No tabs closed yet in this visit.");
  const m = modal({ title: "Recently closed tabs", body: `<div class="kb-list">${CLOSED.map((c, i) => `<button type="button" class="kb-li" data-re="${i}"><img src="${esc(favicon(c.url))}" alt="" referrerpolicy="no-referrer"><span><strong>${esc(c.title)}</strong><small>${esc(host(c.url))} · closed ${ago(c.at)}</small></span></button>`).join("")}</div>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-re]"); if (b) { m.close(); reopenClosed(+b.dataset.re); } });
}
function tabsDialog() {
  const m = modal({ title: `All tabs (${B.tabs.length})`, body: `<input class="field" id="tb-q" placeholder="Find a tab…" autofocus><div class="kb-list" id="tb-l" style="margin-top:10px"></div>` });
  const draw = () => { const q = $("#tb-q", m.root).value.toLowerCase(); $("#tb-l", m.root).innerHTML = B.tabs.map((t, i) => [t, i]).filter(([t]) => !q || (t.title + " " + (t.url || "")).toLowerCase().includes(q)).map(([t, i]) => `<div class="kb-li-row"><button type="button" class="kb-li ${i === B.active ? "on" : ""}" data-to="${i}">${t.url ? `<img src="${esc(favicon(t.url))}" alt="" referrerpolicy="no-referrer">` : "<b>+</b>"}<span><strong>${esc(t.title || "New tab")}</strong><small>${esc(t.url ? host(t.url) : "")}${t.pinned ? " · pinned" : ""}</small></span></button>${t.pinned ? "" : `<button type="button" class="icon-btn" data-cl="${i}" aria-label="Close tab">×</button>`}</div>`).join(""); };
  $("#tb-q", m.root).oninput = draw;
  m.root.addEventListener("click", (e) => {
    const to = e.target.closest("[data-to]"), cl = e.target.closest("[data-cl]");
    if (to) { B.active = +to.dataset.to; m.close(); showTab(); }
    if (cl) { const i = +cl.dataset.cl; rememberClosed(B.tabs[i]); $(`#kbf-${B.tabs[i].id}`)?.remove(); B.tabs.splice(i, 1); if (!B.tabs.length) B.tabs.push(newTab(null)); B.active = Math.min(B.active >= i ? Math.max(0, B.active - 1) : B.active, B.tabs.length - 1); persistTabs(); drawTabs(); draw(); m.root.querySelector(".modal-title, h2")?.replaceChildren(`All tabs (${B.tabs.length})`); }
  });
  draw();
}

// ---------- offline pages: the page as it was, kept on this device ----------
async function saveOffline() {
  const t = T();
  if (!t.data || t.data.file || !t.url) return toast("Open a web page first.");
  if (settings.incognito) return toast("Incognito: nothing is saved.");
  if ((t.data.html || t.data.text || "").length > 3_000_000) return toast("This page is too big to keep offline.");
  const list = (await kvGet("webOffline", [])) || [];
  const i = list.findIndex((x) => x.url === t.url); if (i >= 0) list.splice(i, 1);
  list.unshift({ url: t.url, title: t.title, saved: Date.now(), data: t.data });
  await kvSet("webOffline", list.slice(0, 40));
  toast("Saved for offline reading. Its text is kept on this device; pictures still need a connection.", { action: "Offline pages", onAction: offlineDialog, ms: 6000 });
}
async function offlineDialog() {
  let list = (await kvGet("webOffline", [])) || [];
  const m = modal({ title: "Offline pages", wide: true, body: `<p class="muted" style="margin-top:0">Pages you saved with "Save for offline reading". They open without a connection, and Kitsune offers them when a page won't load.</p><div class="kb-list" id="of-l"></div>` });
  const draw = () => { $("#of-l", m.root).innerHTML = list.length ? list.map((x, i) => `<div class="kb-li-row"><button type="button" class="kb-li" data-of="${i}"><img src="${esc(favicon(x.url))}" alt="" referrerpolicy="no-referrer"><span><strong>${esc(x.title)}</strong><small>${esc(host(x.url))} · saved ${ago(x.saved)} · ${Math.max(1, Math.round((x.data.html || x.data.text || "").length / 1024))} KB</small></span></button><button type="button" class="icon-btn" data-ofdel="${i}" aria-label="Delete">${icon("trash")}</button></div>`).join("") : `<p class="hint">Nothing saved yet.</p>`; };
  m.root.addEventListener("click", async (e) => {
    const o = e.target.closest("[data-of]"), d = e.target.closest("[data-ofdel]");
    if (o) { m.close(); openOffline(list[+o.dataset.of]); }
    if (d) { list.splice(+d.dataset.ofdel, 1); await kvSet("webOffline", list); draw(); }
  });
  draw();
}
function openOffline(x, here = false) {
  if (!here && T().url) { B.tabs.splice(B.active + 1, 0, newTab(null)); B.active++; }
  const t = T(); Object.assign(t, { url: x.url, title: x.title, hist: [x.url], idx: 0, data: x.data, scroll: 0 });
  $("#kb-url", B.view).value = x.url; drawTabs(); syncBar(); paint(t);
  toast(`The copy you saved ${ago(x.saved)}.`, { action: "Load live", onAction: () => go(x.url, { push: false }) });
}

// ---------- resume reading ----------
let SCROLLS = null;
const scrollMap = async () => (SCROLLS ||= (await kvGet("webScroll", {})) || {});
function rememberScroll(scroller) {
  const t = T(); if (!t?.url || settings.incognito) return;
  const key = (scroller.classList.contains("kb-reader") ? "r " : "p ") + t.url.split("#")[0];
  setTimeout(async () => {
    const s = (await scrollMap())[key];
    if (!s || s.y < 600 || s.p > 0.97 || t.scroll || !scroller.isConnected || T() !== t) return;
    const max = scroller.scrollHeight - scroller.clientHeight; if (max < 600) return;
    scroller.scrollTop = Math.min(s.y, max);
    toast(`Picked up where you left off (${Math.round(s.p * 100)}%).`, { action: "Start over", onAction: () => scroller.scrollTo({ top: 0, behavior: "smooth" }) });
  }, 500);
  scroller.addEventListener("scroll", debounce(async () => {
    const m = await scrollMap(), max = scroller.scrollHeight - scroller.clientHeight;
    m[key] = { y: Math.round(scroller.scrollTop), p: max > 0 ? +(scroller.scrollTop / max).toFixed(3) : 0, t: Date.now() };
    const ks = Object.keys(m); if (ks.length > 400) ks.sort((a, b) => m[a].t - m[b].t).slice(0, ks.length - 400).forEach((k) => delete m[k]);
    kvSet("webScroll", m);
  }, 800), { passive: true });
}

// ---------- auto-scroll ----------
const AS = { on: false, speed: 50, raf: 0, paused: false };
function stopAuto() { AS.on = false; cancelAnimationFrame(AS.raf); B.view && $("#kb-auto", B.view)?.remove(); }
function autoScroll() {
  if (AS.on) return stopAuto();
  const sc = (B.view && ($(".kb-reader", B.view) || $("#kb-page", B.view)));
  if (!sc) return toast(T().mode === "live" ? "Auto-scroll works in Page and Reader modes." : "Open a page first.");
  try { AS.speed = +localStorage.getItem("kitsune.autoScroll") || 50; } catch {}
  AS.on = true; AS.paused = false;
  const ui = document.createElement("div"); ui.id = "kb-auto"; ui.className = "kb-auto";
  ui.innerHTML = `<button type="button" data-as="-" aria-label="Slower">−</button><span id="kb-as-v"></span><button type="button" data-as="+" aria-label="Faster">+</button><button type="button" data-as="p" aria-label="Pause">${icon("pause")}</button><button type="button" data-as="x" aria-label="Stop auto-scroll">×</button>`;
  $("#kb-body", B.view).append(ui);
  const label = () => ($("#kb-as-v", ui).textContent = AS.speed + " px/s");
  ui.addEventListener("click", (e) => {
    const a = e.target.closest("[data-as]")?.dataset.as; if (!a) return;
    if (a === "x") return stopAuto();
    if (a === "p") { AS.paused = !AS.paused; e.target.closest("button").innerHTML = icon(AS.paused ? "play" : "pause"); }
    if (a === "+" || a === "-") { AS.speed = Math.max(10, Math.min(400, AS.speed + (a === "+" ? 10 : -10))); try { localStorage.setItem("kitsune.autoScroll", AS.speed); } catch {} label(); }
  });
  label();
  let last = performance.now(), acc = 0;
  const step = (now) => {
    if (!AS.on) return;
    const dt = Math.min(100, now - last); last = now;
    if (!AS.paused && sc.isConnected) { acc += (AS.speed * dt) / 1000; const whole = Math.floor(acc); if (whole) { sc.scrollTop += whole; acc -= whole; } if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) { stopAuto(); return toast("Reached the end."); } }
    AS.raf = requestAnimationFrame(step);
  };
  AS.raf = requestAnimationFrame(step);
  // a wheel or touch from you pauses it for a moment rather than fighting you
  const nudge = () => { if (!AS.on) return; AS.paused = true; clearTimeout(AS.t); AS.t = setTimeout(() => { if (AS.on) AS.paused = false; }, 2500); };
  sc.addEventListener("wheel", nudge, { passive: true }); sc.addEventListener("touchstart", nudge, { passive: true });
}

// ---------- picture-in-picture ----------
async function popOutVideo() {
  const sr = B.view && $("#kb-page", B.view)?.shadowRoot;
  const vids = sr ? [...sr.querySelectorAll("video")].filter((v) => v.currentSrc || v.getAttribute("src") || v.querySelector("source")) : [];
  if (!vids.length) return toast(T().mode === "live" ? "In Live mode, use the video's own player." : "There's no video on this page Kitsune can pop out. Try the media panel.");
  if (!document.pictureInPictureEnabled) return toast("Your browser doesn't support picture-in-picture.");
  const v = vids.find((x) => !x.paused) || vids[0];
  try { if (v.paused) await v.play().catch(() => {}); await v.requestPictureInPicture(); } catch (e) { toast("This video can't pop out: " + e.message); }
}

// ---------- QR code: open this page on your phone ----------
async function qrDialog() {
  const t = T(); if (!t.url) return toast("Open a page first.");
  if (!window.qrcode) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"; s.onload = ok; s.onerror = () => no(new Error("Couldn't load the QR maker.")); document.head.append(s); }).catch((e) => toast(e.message));
  if (!window.qrcode) return;
  const q = window.qrcode(0, "M"); q.addData(t.url); q.make();
  const m = modal({ title: "Scan to open on another device", body: `<div class="kb-qr">${q.createSvgTag({ cellSize: 6, margin: 3, scalable: true })}</div><p class="muted" style="text-align:center;word-break:break-all;margin:10px 0 0">${esc(t.url)}</p>`,
    actions: `<button class="btn" type="button" id="qr-dl">${icon("download")}Save image</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  $("#qr-dl", m.root).onclick = () => { const svg = $(".kb-qr svg", m.root).outerHTML; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.download = host(t.url) + "-qr.svg"; document.body.append(a); a.click(); a.remove(); };
}

// =====================================================================
// v85: sessions, site settings, print, Markdown, data saver, keyboard scrolling
// =====================================================================
const scrollerNow = () => B.view && ($(".kb-reader", B.view) || $("#kb-page", B.view));
function carryAttrs(el, skip) {
  if (!el) return "";
  return [...el.attributes].filter((a) => !skip.includes(a.name) && /^[a-z][\w:.-]*$/i.test(a.name) && !/^on/i.test(a.name) && a.name !== "xmlns" && !/^xmlns:/.test(a.name)).map((a) => `${a.name}="${esc(a.value)}"`).join(" ");
}
const saverSites = () => { try { return new Set(JSON.parse(localStorage.getItem("kitsune.webSaver") || "[]")); } catch { return new Set(); } };
function saverOn(url) { try { const s = saverSites(); return s.has("*") || s.has(new URL(url).hostname); } catch { return false; } }
function setSaver(h, on) { const s = saverSites(); on ? s.add(h) : s.delete(h); try { localStorage.setItem("kitsune.webSaver", JSON.stringify([...s])); } catch {} }

// ---------- sessions: sets of tabs you can bring back ----------
function saveSession() {
  const tabs = B.tabs.filter((t) => t.url).map((t) => ({ url: t.url, title: t.title || host(t.url) }));
  if (!tabs.length) return toast("No open pages to save.");
  if (settings.incognito) return toast("Incognito: nothing is saved.");
  const m = modal({ title: "Save these tabs as a session", body: `<form class="form" id="ss-f"><input class="field" id="ss-n" required aria-label="Session name" value="${esc(new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " · " + plural(tabs.length, "tab"))}"><p class="hint" style="margin:0">${tabs.slice(0, 8).map((x) => esc(x.title)).join(" · ")}${tabs.length > 8 ? " …" : ""}</p></form>`,
    actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="ss-f">Save</button>` });
  $("#ss-f", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const list = (await kvGet("webSessions", [])) || [];
    list.unshift({ id: uid("ss-"), name: $("#ss-n", m.root).value.trim() || "Session", tabs, saved: Date.now() });
    await kvSet("webSessions", list.slice(0, 30)); m.close(); toast("Session saved.", { action: "Sessions", onAction: sessionsDialog });
  };
}
async function sessionsDialog() {
  let list = (await kvGet("webSessions", [])) || [];
  const m = modal({ title: "Sessions", wide: true, body: `<p class="muted" style="margin-top:0">Sets of tabs you saved. Open one to bring its tabs back next to yours, or swap your tabs for it.</p><div class="kb-list" id="ss-l"></div>`,
    actions: `<button class="btn" type="button" id="ss-new">${icon("plus")}Save current tabs</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  const draw = () => { $("#ss-l", m.root).innerHTML = list.length ? list.map((s, i) => `<div class="kb-li-row"><button type="button" class="kb-li" data-ssopen="${i}"><b>${s.tabs.length}</b><span><strong>${esc(s.name)}</strong><small>${esc(s.tabs.slice(0, 4).map((x) => host(x.url)).join(", "))}${s.tabs.length > 4 ? "…" : ""} · ${ago(s.saved)}</small></span></button><button type="button" class="btn btn-sm" data-ssswap="${i}">Swap in</button><button type="button" class="icon-btn" data-ssdel="${i}" aria-label="Delete session">${icon("trash")}</button></div>`).join("") : `<p class="hint">No sessions yet.</p>`; };
  const open = (s, swap) => {
    if (swap) { B.tabs.filter((t) => t.url).forEach(rememberClosed); B.tabs = B.tabs.filter((t) => t.pinned); }
    const at = B.tabs.length;
    for (const x of s.tabs) { const n = newTab(x.url); n.title = x.title; B.tabs.push(n); }
    B.active = Math.min(at, B.tabs.length - 1); persistTabs(); m.close(); showTab();
    toast(`Opened ${plural(s.tabs.length, "tab")} from “${s.name}”.`);
  };
  m.root.addEventListener("click", async (e) => {
    const o = e.target.closest("[data-ssopen]"), sw = e.target.closest("[data-ssswap]"), d = e.target.closest("[data-ssdel]");
    if (o) open(list[+o.dataset.ssopen], false);
    if (sw) open(list[+sw.dataset.ssswap], true);
    if (d) { list.splice(+d.dataset.ssdel, 1); await kvSet("webSessions", list); draw(); }
    if (e.target.closest("#ss-new")) { m.close(); saveSession(); }
  });
  draw();
}

// ---------- site settings: everything Kitsune remembers about this site, in one place ----------
function siteSettings() {
  const t = T(); if (!t.url) return toast("Open a page first.");
  const h = host(t.url), reg = regOf(h), zoom = siteZoom(h) || 1;
  const rows = [
    ["live", "Always open in Live mode", "Runs the site's own scripts, sealed off from Kitsune.", liveSites().has(h)],
    ["cookies", `Cookies for ${reg}`, "Stay signed in and send forms. Off means every visit starts fresh.", cookiesAllowed(t.url)],
    ["mobile", "Ask for the mobile site", "Adds an honest \"Mobile\" marker to requests.", mobileFor(t.url)],
    ["dark", "Dark page", "Shows this site with dark colors.", darkFor(t)],
    ["reader", "Always open in Reader mode", "Clean article text whenever you visit.", readerSites().has(h)],
    ["saver", "Data saver", "Pictures load only when you click them.", saverOn(t.url)],
    ["block", `Block ${reg}`, "Kitsune won't open it again until you unblock it.", isBlocked(t.url)],
  ];
  const m = modal({ title: `Site settings · ${h}`, body: `<div class="kb-set">${rows.map(([k, l, hint, on]) => `<label class="kb-set-row"><span><strong>${esc(l)}</strong><small>${esc(hint)}</small></span><span class="us-sw"><input type="checkbox" data-ss="${k}" ${on ? "checked" : ""}><i></i></span></label>`).join("")}
      ${(zaps()[h] || []).length ? `<div class="kb-set-row"><span><strong>Removed elements</strong><small>${plural(zaps()[h].length, "element")} hidden with the zapper</small></span><button type="button" class="btn btn-sm" id="ss-unzap">Bring back</button></div>` : ""}
      <div class="kb-set-row"><span><strong>Text size</strong><small>${Math.round(zoom * 100)}% on this site</small></span><button type="button" class="btn btn-sm" id="ss-zoom" ${zoom === 1 ? "disabled" : ""}>Reset</button></div></div>`,
    actions: `<button class="btn btn-accent" type="button" data-close>Done</button>`,
    onClose: () => { if (changed) go(t.url, { push: false }); } });
  let changed = false;
  m.root.addEventListener("change", (e) => {
    const c = e.target.closest("[data-ss]"); if (!c) return; changed = true;
    const on = c.checked, k = c.dataset.ss;
    if (k === "live") { setLiveSite(h, on); t.mode = on ? "live" : "page"; }
    if (k === "cookies") setCookiesAllowed(t.url, on);
    if (k === "mobile") setMobile(t.url, on);
    if (k === "dark" && darkFor(t) !== on) toggleDark();
    if (k === "saver") setSaver(h, on);
    if (k === "reader") { setReaderSite(h, on); t.mode = on ? "reader" : "page"; }
    if (k === "block") setBlocked(reg, on);
  });
  $("#ss-unzap", m.root)?.addEventListener("click", (e) => { const all = zaps(); delete all[h]; saveZaps(all); e.target.disabled = true; changed = true; });
  $("#ss-zoom", m.root).onclick = (e) => { setSiteZoom(h, 1); t.zoom = 1; e.target.disabled = true; changed = true; };
}

// ---------- print, or save as PDF from the print dialog ----------
function printable() {
  const t = T(), rd = B.view && $(".kb-reader", B.view), sr = B.view && $("#kb-page", B.view)?.shadowRoot;
  const src = rd || sr?.querySelector("article, main, [role=main]") || sr?.querySelector(".kb-body");
  if (!src) { toast(t.mode === "live" ? "Switch to Page or Reader mode for this." : "Open a page first."); return null; }
  const c = src.cloneNode(true);
  // only what you can see: menus, language lists and pop-ups hidden by the page stay out
  if (src.checkVisibility) { const from = src.querySelectorAll("*"), to = c.querySelectorAll("*"); for (let i = from.length - 1; i >= 0; i--) if (!from[i].checkVisibility()) to[i]?.remove(); }
  c.querySelectorAll("[role=navigation], .navbox, .mw-editsection, .reference, sup.reference, .noprint, .sr-only, .visually-hidden").forEach((n) => n.remove());
  c.querySelectorAll("script, style, iframe, button, form, nav, .kb-embed, .kbx, #kb-auto, [aria-hidden=true]").forEach((n) => n.remove());
  c.querySelectorAll("img[data-kb-src]").forEach((n) => n.remove());
  return c;
}
function printPage() {
  const t = T(), c = printable(); if (!c) return;
  const f = document.createElement("iframe");
  f.setAttribute("sandbox", "allow-same-origin allow-modals"); f.setAttribute("aria-hidden", "true");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  f.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t.title)}</title><style>body{font:12pt/1.55 Georgia,serif;color:#111;max-width:42em;margin:0 auto;padding:12px}img,video,svg{max-width:100%;height:auto}a{color:inherit}h1,h2,h3,h4{font-family:system-ui,sans-serif;line-height:1.2;break-after:avoid}pre{white-space:pre-wrap}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px}.kb-ph{font:9pt system-ui,sans-serif;color:#666;border-bottom:1px solid #ccc;margin-bottom:16px;padding-bottom:6px}</style></head><body><div class="kb-ph">${esc(t.title)} · ${esc(t.url)} · ${esc(new Date().toLocaleDateString())}</div>${c.innerHTML}</body></html>`;
  f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch { toast("Printing isn't available here."); } setTimeout(() => f.remove(), 60_000); };
  document.body.append(f);
}

// ---------- copy as Markdown ----------
function mdOf(n) {
  if (n.nodeType === 3) return n.textContent.replace(/\s+/g, " ");
  if (n.nodeType !== 1 || n.hidden) return "";
  const tag = n.tagName, kids = () => [...n.childNodes].map(mdOf).join("");
  if (/^(SCRIPT|STYLE|NOSCRIPT|BUTTON|NAV|FORM|IFRAME|SVG|TEMPLATE)$/.test(tag)) return "";
  if (/^H[1-6]$/.test(tag)) return `\n\n${"#".repeat(+tag[1])} ${kids().trim()}\n\n`;
  switch (tag) {
    case "P": case "DIV": case "SECTION": case "ARTICLE": case "HEADER": case "FOOTER": case "MAIN": case "FIGURE": case "ASIDE": return `\n\n${kids().trim()}\n\n`;
    case "FIGCAPTION": return `\n\n*${kids().trim()}*\n\n`;
    case "BR": return "  \n";
    case "STRONG": case "B": { const k = kids().trim(); return k ? `**${k}**` : ""; }
    case "EM": case "I": { const k = kids().trim(); return k ? `*${k}*` : ""; }
    case "CODE": return n.closest("pre") ? n.textContent : "`" + n.textContent + "`";
    case "PRE": return "\n\n```\n" + n.textContent.replace(/\n$/, "") + "\n```\n\n";
    case "A": { const k = kids().trim(), h = n.href || ""; return /^https?:/.test(h) && k ? `[${k}](${h})` : k; }
    case "IMG": { let s = n.currentSrc || n.src || ""; const m = s.match(/\/api\/browse\/img\?url=([^&]+)/); if (m) s = decodeURIComponent(m[1]); return /^https?:/.test(s) ? `![${(n.alt || "").replace(/[[\]]/g, "")}](${s})` : ""; }
    case "UL": case "OL": return "\n\n" + [...n.children].filter((c) => c.tagName === "LI").map((li, i) => (tag === "OL" ? `${i + 1}. ` : "- ") + mdOf(li).trim().replace(/\n+/g, "\n   ")).join("\n") + "\n\n";
    case "BLOCKQUOTE": return "\n\n" + kids().trim().split("\n").map((l) => "> " + l).join("\n") + "\n\n";
    case "HR": return "\n\n---\n\n";
    case "TABLE": {
      const rows = [...n.querySelectorAll("tr")].slice(0, 200).map((tr) => [...tr.children].map((c) => mdOf(c).trim().replace(/\|/g, "\\|").replace(/\n+/g, " ")));
      if (!rows.length) return "";
      const w = Math.max(...rows.map((r) => r.length)), line = (r) => "| " + Array.from({ length: w }, (_, i) => r[i] || "").join(" | ") + " |";
      return "\n\n" + [line(rows[0]), "|" + " --- |".repeat(w), ...rows.slice(1).map(line)].join("\n") + "\n\n";
    }
    default: return kids();
  }
}
async function copyMarkdown() {
  const t = T(), c = printable(); if (!c) return;
  const md = `# ${t.title}\n\n<${t.url}>\n\n` + mdOf(c).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  const save = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" })); a.download = (t.title || host(t.url)).replace(/[^\w\s-]/g, "").trim().slice(0, 60) + ".md"; document.body.append(a); a.click(); a.remove(); };
  try { await navigator.clipboard.writeText(md); toast(`Copied as Markdown (${md.length.toLocaleString()} characters).`, { action: "Save as file", onAction: save }); }
  catch { save(); }
}

// =====================================================================
// v86: zapper, developer tools, page source, all highlights, command runner
// =====================================================================
const zaps = () => { try { return JSON.parse(localStorage.getItem("kitsune.webZaps") || "{}"); } catch { return {}; } };
function saveZaps(all) { try { localStorage.setItem("kitsune.webZaps", JSON.stringify(all)); } catch {} }
function applyZaps(root, t) {
  const list = zaps()[host(t.url || "")] || []; if (!list.length) return;
  const sheet = new CSSStyleSheet();
  for (const sel of list) { try { sheet.insertRule(`.kb-body ${sel} { display: none !important; }`, sheet.cssRules.length); } catch {} }
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
}
// a short selector that picks out exactly this element inside the page
function selectorFor(el) {
  const body = el.getRootNode().querySelector(".kb-body"), chain = [];
  for (let n = el; n && n !== body; n = n.parentElement) {
    if (n.id && !/\d{4,}|^kb/.test(n.id)) { chain.unshift("#" + CSS.escape(n.id)); break; }
    let s = n.tagName.toLowerCase();
    const cls = [...n.classList].filter((c) => !/^kb-|\d{3,}|^(active|open|show|hover|focus|is-|has-)/.test(c) && c.length < 40).slice(0, 2);
    if (cls.length) s += cls.map((c) => "." + CSS.escape(c)).join("");
    const sib = n.parentElement ? [...n.parentElement.children].filter((x) => x.tagName === n.tagName) : [];
    if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(n) + 1})`;
    chain.unshift(s);
  }
  for (let i = chain.length - 1; i >= 0; i--) { const sel = chain.slice(i).join(" > "); try { const hits = body.querySelectorAll(sel); if (hits.length === 1 && hits[0] === el) return sel; } catch {} }
  return chain[0]?.startsWith("#") ? chain.join(" > ") : "> " + chain.join(" > ");
}
function zapMode() {
  const sr = B.view && $("#kb-page", B.view)?.shadowRoot;
  if (!sr) return toast("The zapper works in Page mode.");
  const t = T(), h = host(t.url); let cur = null, n = 0;
  toast("Click anything on the page to remove it, on this site from now on. Press Esc when you're done.", { ms: 6000 });
  const over = (e) => { const el = e.target?.closest?.(".kb-body *"); if (el === cur) return; cur?.classList.remove("kb-zap-hover"); cur = el || null; cur?.classList.add("kb-zap-hover"); };
  const click = (e) => {
    e.preventDefault(); e.stopImmediatePropagation(); if (!cur) return;
    cur.classList.remove("kb-zap-hover"); const sel = selectorFor(cur); cur.remove(); cur = null; n++;
    const all = zaps(); all[h] = [...new Set([...(all[h] || []), sel])].slice(-200); saveZaps(all);
  };
  const key = (e) => { if (e.key === "Escape") { e.preventDefault(); stop(); } };
  const stop = () => { sr.removeEventListener("mouseover", over, true); sr.removeEventListener("click", click, true); removeEventListener("keydown", key, true); cur?.classList.remove("kb-zap-hover"); if (n) toast(`Removed ${plural(n, "element")} on ${h}. Bring them back in Site settings.`); };
  sr.addEventListener("mouseover", over, true); sr.addEventListener("click", click, true); addEventListener("keydown", key, true);
}

// ---------- developer tools ----------
function devPanel() {
  const t = T(); if (!t.url) return toast("Open a page first.");
  const net = t.netlog || [], errs = t.errlog || [];
  const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : n > 1024 ? Math.round(n / 1024) + " KB" : n + " B");
  const html = t.data?.html || "", doc = t.doc;
  const m = modal({ title: "Developer tools · " + host(t.url), wide: true, body: `<div class="seg" id="dv-tabs"><button type="button" data-dv="net" aria-pressed="true">Requests ${net.length}</button><button type="button" data-dv="err" aria-pressed="false">Errors ${errs.length}</button><button type="button" data-dv="page" aria-pressed="false">Page</button></div>
    <div id="dv-body" style="margin-top:12px"></div>`,
    actions: `<button class="btn" type="button" id="dv-copy">Copy log</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  const draw = (tab) => {
    $$("#dv-tabs [data-dv]", m.root).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dv === tab)));
    const box = $("#dv-body", m.root);
    if (tab === "net") box.innerHTML = t.mode !== "live" && !net.length ? `<p class="hint">Page and Reader modes fetch the page once; the page's own requests appear here in Live mode.</p>` : `<input class="field" id="dv-q" placeholder="Filter requests…"><div class="dv-table" id="dv-rows"></div>`;
    if (tab === "err") box.innerHTML = errs.length ? errs.map((x) => `<pre class="dv-err">${esc(x.msg)}</pre>`).join("") : `<p class="hint">${t.mode === "live" ? "No script errors so far." : "Script errors appear here in Live mode."}</p>`;
    if (tab === "page") {
      const c = (s) => doc ? doc.querySelectorAll(s).length : 0;
      const rows = [["Mode", t.mode], ["Status", t.data?.status ?? "–"], ["HTML size", kb(html.length)], ["Scripts", c("script")], ["Stylesheets", c('link[rel~="stylesheet"]') + " linked · " + c("style") + " inline"], ["Images", c("img")], ["Links", c("a[href]")], ["Forms", c("form")], ["Iframes", c("iframe")], ["Elements", c("*")], ["Live page elements", t.liveStats?.nodes ?? "–"], ["Removed by the shield", t.shield ? `${t.shield.trackers} tracking codes · ${t.shield.banners} banners` : "–"], ["Removed with the zapper", (zaps()[host(t.url)] || []).length]];
      box.innerHTML = `<div class="dv-kv">${rows.map(([k, v]) => `<span>${esc(k)}</span><strong>${esc(String(v))}</strong>`).join("")}</div>`;
    }
    if (tab === "net" && $("#dv-rows", m.root)) {
      const rowsHtml = (q) => net.filter((r) => !q || r.url.toLowerCase().includes(q)).slice(-300).reverse().map((r) => `<div class="dv-row ${r.s >= 400 ? "bad" : ""}"><b>${esc(r.m)}</b><span>${r.s}</span><span>${kb(r.n)}</span><span>${r.ms} ms</span><a href="#" data-dvurl="${esc(r.url)}" title="${esc(r.url)}">${esc(r.url.replace(/^https?:\/\//, ""))}</a></div>`).join("") || `<p class="hint">No requests yet.</p>`;
      $("#dv-rows", m.root).innerHTML = rowsHtml("");
      $("#dv-q", m.root).oninput = (e) => ($("#dv-rows", m.root).innerHTML = rowsHtml(e.target.value.toLowerCase()));
    }
  };
  m.root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dv]"); if (b) draw(b.dataset.dv);
    const u = e.target.closest("[data-dvurl]"); if (u) { e.preventDefault(); m.close(); go(u.dataset.dvurl, { newTab: true }); }
  });
  $("#dv-copy", m.root).onclick = () => navigator.clipboard?.writeText(JSON.stringify({ page: t.url, requests: net, errors: errs }, null, 2)).then(() => toast("Log copied."));
  draw("net");
}

// ---------- page source ----------
function viewSource() {
  const t = T(), src = t.data?.html || t.data?.text || "";
  if (!src) return toast("Open a page first.");
  const shown = src.length > 400_000 ? src.slice(0, 400_000) : src;
  const color = (s) => esc(s).replace(/(&lt;\/?)([\w:-]+)/g, '$1<b class="sv-t">$2</b>').replace(/([\w:-]+)=(&quot;[^&]*?&quot;)/g, '<i class="sv-a">$1</i>=<em class="sv-v">$2</em>').replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="sv-c">$1</span>');
  const lines = shown.split("\n");
  const m = modal({ title: "Source · " + host(t.url), wide: true, body: `${src.length > shown.length ? `<p class="hint">Showing the first 400 KB of ${Math.round(src.length / 1024)} KB.</p>` : ""}<input class="field" id="sv-q" placeholder="Find in source…"><pre class="sv" id="sv-pre">${lines.map((l, i) => `<span class="sv-l" data-n="${i + 1}">${shown.length < 200_000 ? color(l) : esc(l)}</span>`).join("\n")}</pre>`,
    actions: `<button class="btn" type="button" id="sv-copy">Copy</button><button class="btn" type="button" id="sv-save">${icon("download")}Save .html</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  $("#sv-copy", m.root).onclick = () => navigator.clipboard?.writeText(src).then(() => toast("Source copied."));
  $("#sv-save", m.root).onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([src], { type: "text/plain" })); a.download = host(t.url) + ".html"; document.body.append(a); a.click(); a.remove(); };
  $("#sv-q", m.root).addEventListener("keydown", (e) => { if (e.key !== "Enter") return; const q = e.target.value.toLowerCase(); if (!q) return; const ls = [...m.root.querySelectorAll(".sv-l")]; const start = (+(m.root.dataset.svAt || 0)); const hit = ls.slice(start).concat(ls.slice(0, start)).find((l) => l.textContent.toLowerCase().includes(q)); if (hit) { ls.forEach((l) => l.classList.remove("on")); hit.classList.add("on"); hit.scrollIntoView({ block: "center" }); m.root.dataset.svAt = ls.indexOf(hit) + 1; } else toast("Not found."); });
}

// ---------- every highlight you've made on the web ----------
async function allHighlights() {
  const all = Object.values((await kvGet("webClips", {})) || {}).filter((p) => p.clips?.length).sort((a, b) => (b.t || 0) - (a.t || 0));
  if (!all.length) return toast("No highlights yet. Select text on a page and pick a colour.");
  const m = modal({ title: `All highlights · ${plural(all.reduce((n, p) => n + p.clips.length, 0), "highlight")}`, wide: true, body: `<input class="field" id="hl-q" placeholder="Search your highlights…"><div id="hl-l" class="hl-all"></div>`,
    actions: `<button class="btn" type="button" id="hl-md">${icon("download")}Export as Markdown</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  const draw = (q = "") => { $("#hl-l", m.root).innerHTML = all.map((p) => { const cs = p.clips.filter((c) => !q || c.text.toLowerCase().includes(q) || (p.title || "").toLowerCase().includes(q)); return cs.length ? `<section><button type="button" class="hl-page" data-hlgo="${esc(p.url)}"><img src="${esc(favicon(p.url))}" alt="" referrerpolicy="no-referrer"><strong>${esc(p.title || host(p.url))}</strong><small>${esc(host(p.url))}</small></button>${cs.map((c) => `<blockquote style="--c:${CLIP_COLORS[c.color] || CLIP_COLORS.yellow}">${esc(c.text)}${c.note ? `<small>${esc(c.note)}</small>` : ""}</blockquote>`).join("")}</section>` : ""; }).join("") || `<p class="hint">Nothing matches.</p>`; };
  $("#hl-q", m.root).oninput = (e) => draw(e.target.value.toLowerCase());
  m.root.addEventListener("click", (e) => { const g = e.target.closest("[data-hlgo]"); if (g) { m.close(); go(g.dataset.hlgo, { newTab: true }); } });
  $("#hl-md", m.root).onclick = () => { const md = "# Highlights\n\n" + all.map((p) => `## [${p.title || host(p.url)}](${p.url})\n\n` + p.clips.map((c) => `> ${c.text.replace(/\n+/g, " ")}${c.note ? `\n\n${c.note}` : ""}`).join("\n\n")).join("\n\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" })); a.download = "kitsune-highlights.md"; document.body.append(a); a.click(); a.remove(); };
  draw();
}

// ---------- command runner: every menu action by name ----------
function commandPalette(q = "", direct = false) {
  if (!LZ.WP) { lazyMods().then(() => commandPalette(q, direct)); return; }
  const items = menuItems().filter((x) => x && x.label && x.run);
  const score = (label, q) => { const l = label.toLowerCase(), words = q.toLowerCase().split(/\s+/).filter(Boolean); if (!words.length) return 1; let s = 0; for (const w of words) { const i = l.indexOf(w); if (i < 0) return 0; s += i === 0 || l[i - 1] === " " ? 3 : 1; } return s; };
  const ranked = (q) => items.map((x) => [x, score(x.label, q)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([x]) => x);
  if (direct && q) { const r = ranked(q); if (r.length === 1 || (r.length && score(r[0].label, q) >= q.split(/\s+/).length * 3 && score(r[1]?.label || "", q) < score(r[0].label, q))) { $("#kb-url", B.view).value = T().url || ""; return r[0].run(); } }
  const m = modal({ title: "Run a command", body: `<input class="field" id="cp-q" placeholder="Type to find an action…" value="${esc(q)}" autofocus><div class="kb-list" id="cp-l" style="margin-top:10px"></div>` });
  let sel = 0;
  const draw = () => { const r = ranked($("#cp-q", m.root).value); sel = Math.min(sel, Math.max(0, r.length - 1)); $("#cp-l", m.root).innerHTML = r.map((x, i) => `<button type="button" class="kb-li ${i === sel ? "on" : ""}" data-cp="${items.indexOf(x)}">${icon(x.icon || "next")}<span><strong>${esc(x.label)}</strong></span></button>`).join("") || `<p class="hint">No action matches.</p>`; };
  const runAt = (i) => { const x = items[i]; if (!x) return; m.close(); $("#kb-url", B.view).value = T().url || ""; x.run(); };
  $("#cp-q", m.root).oninput = () => { sel = 0; draw(); };
  $("#cp-q", m.root).addEventListener("keydown", (e) => {
    const btns = [...m.root.querySelectorAll("[data-cp]")];
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, btns.length - 1); draw(); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
    if (e.key === "Enter") { e.preventDefault(); if (btns[sel]) runAt(+btns[sel].dataset.cp); }
  });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-cp]"); if (b) runAt(+b.dataset.cp); });
  draw(); setTimeout(() => $("#cp-q", m.root)?.focus(), 30);
}

// =====================================================================
// v87: reveal hidden content, reader appearance, speed reader, bold-start, links, pictures ZIP, watch page
// =====================================================================
const contentRoot = () => B.view && ($(".kb-reader", B.view) || $("#kb-page", B.view)?.shadowRoot?.querySelector(".kb-body"));

// Panels a page hides until its scripts open them (tabs, accordions, "read more") are opened.
function revealHidden() {
  const sr = B.view && $("#kb-page", B.view)?.shadowRoot;
  if (!sr) return toast(T().mode === "live" ? "In Live mode the page's own buttons work." : "Open a page in Page mode first.");
  let n = 0;
  sr.querySelectorAll("details:not([open])").forEach((d) => { d.open = true; n++; });
  sr.querySelectorAll(".kb-body [hidden]").forEach((el) => { if (el.closest("svg, template")) return; el.removeAttribute("hidden"); n++; });
  sr.querySelectorAll('.kb-body [aria-hidden="true"], .kb-body .collapse:not(.show), .kb-body [aria-expanded="false"] + *, .kb-body .is-collapsed, .kb-body .collapsed, .kb-body .accordion-content, .kb-body .tab-pane, .kb-body .read-more-content, .kb-body .truncated, .kb-body [class*="line-clamp"]').forEach((el) => {
    if (el.closest("svg") || el.tagName === "svg" || el.matches("i, span:empty, img")) return;
    if (getComputedStyle(el).display === "none" || getComputedStyle(el).visibility === "hidden" || /line-clamp|truncated/.test(el.className)) { el.style.setProperty("display", el.tagName === "SPAN" ? "inline" : "block", "important"); el.style.setProperty("visibility", "visible", "important"); el.style.setProperty("max-height", "none", "important"); el.style.setProperty("-webkit-line-clamp", "unset", "important"); el.style.setProperty("overflow", "visible", "important"); n++; }
  });
  toast(n ? `Opened ${plural(n, "hidden section")}.` : "Nothing hidden found on this page.");
}

// ---------- reader appearance ----------
const READ_LOOK = () => { try { return { theme: "app", font: "serif", width: 40, lh: 1.7, bold: false, ...JSON.parse(localStorage.getItem("kitsune.readerLook") || "{}") }; } catch { return { theme: "app", font: "serif", width: 40, lh: 1.7, bold: false }; } };
const READ_FONTS = { serif: '"Literata", Georgia, serif', sans: '-apple-system, "Segoe UI", system-ui, sans-serif', hyper: '"Atkinson Hyperlegible", system-ui, sans-serif', dyslexic: '"OpenDyslexic", "Comic Sans MS", sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace' };
function applyReaderLook(rd) {
  if (!rd) return; const l = READ_LOOK();
  rd.classList.add("rl"); rd.dataset.rlTheme = l.theme;
  rd.style.setProperty("--rl-font", READ_FONTS[l.font] || READ_FONTS.serif); rd.style.setProperty("--rl-w", l.width + "em"); rd.style.setProperty("--rl-lh", l.lh);
  if (l.bold) boldStart(rd, true);
}
function readerLookDialog() {
  const l = READ_LOOK();
  const seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${n}</button>`).join("")}</div>`;
  const m = modal({ title: "Reader appearance", body: `<div class="form">
      <label class="lbl">Colours</label>${seg("rl-theme", [["app", "Like Kitsune"], ["paper", "Paper"], ["sepia", "Sepia"], ["dusk", "Dusk"], ["night", "Night"]], l.theme)}
      <label class="lbl">Font</label>${seg("rl-font", [["serif", "Serif"], ["sans", "Sans"], ["hyper", "Hyperlegible"], ["dyslexic", "OpenDyslexic"], ["mono", "Mono"]], l.font)}
      <label class="ps-range">Column width <b id="rl-wv">${l.width} em</b><input type="range" id="rl-w" min="28" max="70" step="2" value="${l.width}"></label>
      <label class="ps-range">Line spacing <b id="rl-lv">${l.lh}</b><input type="range" id="rl-lh" min="1.3" max="2.3" step="0.1" value="${l.lh}"></label>
      <label class="check"><input type="checkbox" id="rl-bold" ${l.bold ? "checked" : ""}> Bold-start reading (the first part of each word in bold, to guide your eyes)</label></div>`,
    actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
  const save = (patch) => { const n = { ...READ_LOOK(), ...patch }; try { localStorage.setItem("kitsune.readerLook", JSON.stringify(n)); } catch {} const rd = B.view && $(".kb-reader", B.view); if (rd) { boldStart(rd, false); applyReaderLook(rd); } };
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; const g = b.parentElement; $$("[data-v]", g).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); save({ [g.id === "rl-theme" ? "theme" : "font"]: b.dataset.v }); });
  $("#rl-w", m.root).oninput = (e) => { $("#rl-wv", m.root).textContent = e.target.value + " em"; save({ width: +e.target.value }); };
  $("#rl-lh", m.root).oninput = (e) => { $("#rl-lv", m.root).textContent = e.target.value; save({ lh: +e.target.value }); };
  $("#rl-bold", m.root).onchange = (e) => save({ bold: e.target.checked });
  if (T().mode !== "reader") toast("These apply in Reader mode.", { action: "Switch to Reader", onAction: () => $('#kb-mode [data-mode="reader"]', B.view)?.click() });
}

// ---------- bold-start reading ----------
function boldStart(rootEl, on) {
  if (!rootEl) return;
  if (!on) { rootEl.querySelectorAll("b.kb-bs").forEach((b) => b.replaceWith(b.textContent)); rootEl.normalize(); return; }
  if (rootEl.querySelector("b.kb-bs")) return;
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest("pre, code, script, style, a.kbx, .kb-site, h1, button") || !/\S/.test(n.data) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes.slice(0, 20000)) {
    const frag = document.createDocumentFragment();
    for (const part of n.data.split(/(\s+)/)) {
      const m = part.match(/^([\p{L}\p{N}'’-]+)(.*)$/u);
      if (!m || m[1].length < 2) { frag.append(part); continue; }
      const k = Math.ceil(m[1].length * 0.45), b = document.createElement("b"); b.className = "kb-bs"; b.textContent = m[1].slice(0, k);
      frag.append(b, m[1].slice(k) + m[2]);
    }
    n.replaceWith(frag);
  }
}
function toggleBoldStart() {
  const on = !READ_LOOK().bold; try { localStorage.setItem("kitsune.readerLook", JSON.stringify({ ...READ_LOOK(), bold: on })); } catch {}
  const el = contentRoot(); boldStart(el, on);
  toast(on ? "Bold-start reading is on." : "Bold-start reading is off.");
}

// ---------- speed reader: one word at a time ----------
function speedReader() {
  const el = contentRoot(); if (!el) return toast(T().mode === "live" ? "The speed reader works in Page and Reader modes." : "Open a page first.");
  const src = (el.querySelector?.("article, main, [role=main]") || el);
  const words = (src.innerText || src.textContent || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length < 20) return toast("Not enough text here for the speed reader.");
  let wpm = +localStorage.getItem("kitsune.rsvpWpm") || 300, i = 0, timer = 0, playing = true;
  const m = modal({ title: "Speed reader", wide: true, onClose: () => clearTimeout(timer), body: `<div class="rsvp"><div class="rsvp-word" id="rv-w" aria-live="off"></div><div class="rsvp-bar"><i id="rv-p"></i></div>
      <div class="toolbar" style="justify-content:center;margin:12px 0 0"><button class="btn" type="button" id="rv-back" aria-label="Back 10 words">−10</button><button class="btn btn-accent" type="button" id="rv-play">Pause</button><button class="btn" type="button" id="rv-fwd" aria-label="Forward 10 words">+10</button>
      <label class="ps-range" style="min-width:200px">Speed <b id="rv-sv">${wpm} wpm</b><input type="range" id="rv-s" min="100" max="900" step="25" value="${wpm}"></label></div>
      <p class="hint" style="text-align:center;margin:8px 0 0">${plural(words.length, "word")} · about ${Math.max(1, Math.round(words.length / wpm))} min · Space pauses, ← → skip</p></div>` });
  const show = () => {
    const w = words[i] || "", pivot = Math.max(0, Math.min(w.length - 1, Math.floor((w.length - 1) / 3)));
    $("#rv-w", m.root).innerHTML = `<span>${esc(w.slice(0, pivot))}</span><mark>${esc(w[pivot] || "")}</mark><span>${esc(w.slice(pivot + 1))}</span>`;
    $("#rv-p", m.root).style.width = ((i + 1) / words.length) * 100 + "%";
  };
  const tick = () => { if (!playing) return; show(); const w = words[i] || ""; i++; if (i >= words.length) { playing = false; $("#rv-play", m.root).textContent = "Again"; return; } timer = setTimeout(tick, (60000 / wpm) * (/[.!?]["”’)]?$/.test(w) ? 2.2 : /[,;:]$/.test(w) ? 1.5 : w.length > 9 ? 1.3 : 1)); };
  const play = (on) => { playing = on; clearTimeout(timer); $("#rv-play", m.root).textContent = on ? "Pause" : "Play"; if (on) { if (i >= words.length) i = 0; tick(); } };
  $("#rv-play", m.root).onclick = () => play(!playing);
  $("#rv-back", m.root).onclick = () => { i = Math.max(0, i - 10); show(); };
  $("#rv-fwd", m.root).onclick = () => { i = Math.min(words.length - 1, i + 10); show(); };
  $("#rv-s", m.root).oninput = (e) => { wpm = +e.target.value; $("#rv-sv", m.root).textContent = wpm + " wpm"; try { localStorage.setItem("kitsune.rsvpWpm", wpm); } catch {} };
  m.root.addEventListener("keydown", (e) => { if (e.target.matches("input")) return; if (e.key === " ") { e.preventDefault(); play(!playing); } if (e.key === "ArrowLeft") $("#rv-back", m.root).click(); if (e.key === "ArrowRight") $("#rv-fwd", m.root).click(); });
  m.root.tabIndex = -1; m.root.focus(); tick();
}

// ---------- every link on the page ----------
function linksDialog() {
  const el = contentRoot(), t = T();
  const doc = t.doc; const src = el && el.querySelectorAll ? [...el.querySelectorAll("a[href]")] : doc ? [...doc.querySelectorAll("a[href]")] : [];
  const seen = new Map();
  for (const a of src) { let u; try { u = new URL(a.getAttribute("href"), t.url).href; } catch { continue; } if (!/^https?:/.test(u) || seen.has(u)) continue; seen.set(u, (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120)); }
  if (!seen.size) return toast("No links on this page.");
  const list = [...seen].map(([url, text]) => ({ url, text, ext: host(url) !== host(t.url) }));
  const m = modal({ title: `Links · ${list.length}`, wide: true, body: `<div class="toolbar" style="margin:0 0 8px"><input class="field" id="lk-q" placeholder="Filter links…" style="flex:1"><div class="seg" id="lk-f"><button type="button" data-f="all" aria-pressed="true">All</button><button type="button" data-f="in" aria-pressed="false">This site</button><button type="button" data-f="out" aria-pressed="false">Other sites</button></div></div><div class="kb-list" id="lk-l"></div>`,
    actions: `<button class="btn" type="button" id="lk-copy">Copy shown</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  let f = "all";
  const shown = () => { const q = $("#lk-q", m.root).value.toLowerCase(); return list.filter((x) => (f === "all" || (f === "out") === x.ext) && (!q || (x.url + " " + x.text).toLowerCase().includes(q))); };
  const draw = () => { $("#lk-l", m.root).innerHTML = shown().slice(0, 800).map((x) => `<button type="button" class="kb-li" data-lk="${esc(x.url)}"><img src="${esc(favicon(x.url))}" alt="" referrerpolicy="no-referrer"><span><strong>${esc(x.text || x.url)}</strong><small>${esc(x.url)}</small></span></button>`).join(""); };
  $("#lk-q", m.root).oninput = draw;
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { f = b.dataset.f; $$("#lk-f [data-f]", m.root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); } const l = e.target.closest("[data-lk]"); if (l) { m.close(); go(l.dataset.lk, { newTab: e.metaKey || e.ctrlKey }); } });
  $("#lk-copy", m.root).onclick = () => navigator.clipboard?.writeText(shown().map((x) => x.url).join("\n")).then(() => toast("Links copied."));
  draw();
}

// ---------- every picture on the page, as one ZIP ----------
async function downloadPictures() {
  const el = contentRoot(), t = T(); if (!el) return toast("Open a page in Page or Reader mode first.");
  const urls = [...new Set([...el.querySelectorAll("img")].map((im) => { let s = im.currentSrc || im.src || im.dataset.kbSrc || ""; const m = s.match(/\/api\/browse\/img\?url=([^&]+)/); if (m) s = decodeURIComponent(m[1]); return s; }).filter((s) => /^https?:/.test(s)))].slice(0, 150);
  if (!urls.length) return toast("No pictures on this page.");
  if (!window.JSZip) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; s.onload = ok; s.onerror = () => no(); document.head.append(s); }).catch(() => {});
  if (!window.JSZip) return toast("Couldn't load the ZIP maker.");
  const zip = new window.JSZip(); let done = 0, ok = 0;
  const tst = toast(`Collecting ${plural(urls.length, "picture")}…`, { ms: 60000 });
  const names = new Set();
  const one = async (u) => {
    try {
      const r = await fetch("/api/browse/img?url=" + encodeURIComponent(u) + "&ref=" + encodeURIComponent(t.url)); if (!r.ok) return;
      const blob = await r.blob(), ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg").replace("svg+xml", "svg").split(";")[0];
      let base = decodeURIComponent(new URL(u).pathname.split("/").pop() || "picture").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[^\w.-]+/g, "_").slice(0, 60) || "picture", name = `${base}.${ext}`, k = 2;
      while (names.has(name)) name = `${base}-${k++}.${ext}`; names.add(name);
      zip.file(name, blob); ok++;
    } catch {} finally { done++; }
  };
  for (let i = 0; i < urls.length; i += 6) await Promise.all(urls.slice(i, i + 6).map(one));
  if (!ok) return toast("Couldn't download the pictures.");
  const out = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(out); a.download = `${host(t.url)} pictures.zip`; document.body.append(a); a.click(); a.remove();
  toast(`Saved ${plural(ok, "picture")} as a ZIP.`);
  void tst; void done;
}

// ---------- watch this page ----------
async function watchPage() {
  const t = T(); if (!t.url) return toast("Open a page first.");
  const D = await import("../daemons.js"), list = await D.all();
  if (list.some((d) => d.kind === "watch" && d.url === t.url)) return toast("You're already watching this page.", { action: "Daemons", onAction: () => D.manager(t.url) });
  const d = { id: uid("dm-"), kind: "watch", name: (t.title || host(t.url)).slice(0, 60), url: t.url, selector: "", code: "", every: 60, enabled: true };
  await kvSet("daemons", [...list, d]);
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
  toast("Watching this page: Kitsune checks it every hour while open and tells you when it changes.", { action: "Daemons", onAction: () => D.manager(t.url), ms: 7000 });
}

// =====================================================================
// v88: page notes
// =====================================================================
const notesAll = async () => (await kvGet("webNotes", {})) || {};
async function showPageNote() {
  const t = T(); B.view && $("#kb-note", B.view)?.remove();
  if (!t?.url) return;
  const n = (await notesAll())[clipKey(t.url)]; if (!n?.text || T() !== t) return;
  const el = document.createElement("button"); el.type = "button"; el.id = "kb-note"; el.className = "kb-note";
  el.innerHTML = `${icon("edit")}<span>${esc(n.text.split("\n")[0].slice(0, 80))}</span>`; el.title = n.text.slice(0, 500);
  el.onclick = pageNoteDialog;
  $("#kb-body", B.view)?.append(el);
}
async function pageNoteDialog() {
  const t = T(); if (!t.url) return toast("Open a page first.");
  if (settings.incognito) return toast("Incognito: nothing is saved.");
  const all = await notesAll(), k = clipKey(t.url), cur = all[k]?.text || "";
  const m = modal({ title: "Note for this page", body: `<p class="muted" style="margin-top:0">${esc(t.title || host(t.url))}</p><textarea class="field" id="pn-t" rows="7" placeholder="Anything you want to remember about this page…">${esc(cur)}</textarea><p class="hint" style="margin:6px 0 0">It shows up as a small note whenever you come back here.</p>`,
    actions: `${cur ? `<button class="btn btn-ghost" type="button" id="pn-del" style="margin-right:auto;color:var(--bad)">Delete</button>` : ""}<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="pn-save">Save</button>` });
  setTimeout(() => $("#pn-t", m.root)?.focus(), 30);
  $("#pn-save", m.root).onclick = async () => { const v = $("#pn-t", m.root).value.trim(); const a = await notesAll(); if (v) a[k] = { text: v, title: t.title, url: k, t: Date.now() }; else delete a[k]; await kvSet("webNotes", a); m.close(); showPageNote(); toast(v ? "Note saved." : "Note removed."); };
  $("#pn-del", m.root)?.addEventListener("click", async () => { const a = await notesAll(); delete a[k]; await kvSet("webNotes", a); m.close(); showPageNote(); toast("Note deleted."); });
}
async function allPageNotes() {
  const list = Object.values(await notesAll()).sort((a, b) => b.t - a.t);
  if (!list.length) return toast("No page notes yet. Use “Page note…” on any page.");
  const m = modal({ title: `Page notes · ${list.length}`, wide: true, body: `<input class="field" id="pnl-q" placeholder="Search notes…"><div class="kb-list" id="pnl-l" style="margin-top:10px"></div>`,
    actions: `<button class="btn" type="button" id="pnl-md">${icon("download")}Export as Markdown</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  const draw = (q = "") => { $("#pnl-l", m.root).innerHTML = list.filter((n) => !q || (n.text + " " + n.title).toLowerCase().includes(q)).map((n) => `<button type="button" class="kb-li" data-pn="${esc(n.url)}"><img src="${esc(favicon(n.url))}" alt="" referrerpolicy="no-referrer"><span><strong>${esc(n.title || host(n.url))}</strong><small>${esc(n.text.replace(/\s+/g, " ").slice(0, 140))} · ${ago(n.t)}</small></span></button>`).join("") || `<p class="hint">Nothing matches.</p>`; };
  $("#pnl-q", m.root).oninput = (e) => draw(e.target.value.toLowerCase());
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-pn]"); if (b) { m.close(); go(b.dataset.pn, { newTab: true }); } });
  $("#pnl-md", m.root).onclick = () => { const md = "# Page notes\n\n" + list.map((n) => `## [${n.title || host(n.url)}](${n.url})\n\n${n.text}`).join("\n\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" })); a.download = "kitsune-page-notes.md"; document.body.append(a); a.click(); a.remove(); };
  draw();
}

// =====================================================================
// v89: bookmarks manager, tab menu, back to top
// =====================================================================
async function bookmarksDialog() {
  let list = ((await store.marks()) || []).slice();
  const m = modal({ title: `Bookmarks · ${list.length}`, wide: true, body: `<input class="field" id="bm-q" placeholder="Search bookmarks…"><div class="kb-list" id="bm-l" style="margin-top:10px"></div>`,
    actions: `<label class="btn" style="margin-right:auto">${icon("upload")}Import<input type="file" id="bm-in" accept=".html,.htm" hidden></label><button class="btn" type="button" id="bm-out">${icon("download")}Export</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  const save = async () => { await kvSet("webBookmarks", list); syncBar(); m.root.querySelector(".modal-title, h2")?.replaceChildren(`Bookmarks · ${list.length}`); };
  const draw = () => { const q = $("#bm-q", m.root).value.toLowerCase(); $("#bm-l", m.root).innerHTML = list.map((b, i) => [b, i]).filter(([b]) => !q || (b.title + " " + b.url).toLowerCase().includes(q)).map(([b, i]) => `<div class="kb-li-row"><button type="button" class="kb-li" data-bmgo="${i}"><img src="${esc(favicon(b.url))}" alt="" referrerpolicy="no-referrer"><span><strong>${esc(b.title || b.url)}</strong><small>${esc(b.url)}</small></span></button><button type="button" class="icon-btn" data-bmed="${i}" aria-label="Rename">${icon("edit")}</button><button type="button" class="icon-btn" data-bmdel="${i}" aria-label="Delete">${icon("trash")}</button></div>`).join("") || `<p class="hint">${list.length ? "Nothing matches." : "No bookmarks yet. Use the bookmark button on any page, or import from another browser."}</p>`; };
  $("#bm-q", m.root).oninput = draw;
  m.root.addEventListener("click", async (e) => {
    const g = e.target.closest("[data-bmgo]"), ed = e.target.closest("[data-bmed]"), d = e.target.closest("[data-bmdel]");
    if (g) { m.close(); go(list[+g.dataset.bmgo].url, { newTab: e.metaKey || e.ctrlKey }); }
    if (ed) { const b = list[+ed.dataset.bmed]; const row = ed.closest(".kb-li-row"); row.innerHTML = `<input class="field" value="${esc(b.title || "")}" style="flex:1"><button type="button" class="btn btn-sm btn-accent">Save</button>`; const inp = row.querySelector("input"); inp.focus(); inp.select(); const done = async () => { b.title = inp.value.trim() || b.title; await save(); draw(); }; row.querySelector("button").onclick = done; inp.onkeydown = (k) => { if (k.key === "Enter") done(); if (k.key === "Escape") draw(); }; }
    if (d) { list.splice(+d.dataset.bmdel, 1); await save(); draw(); }
  });
  // the standard bookmarks file every browser can import and export
  $("#bm-out", m.root).onclick = () => {
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n  <DT><H3>Kitsune</H3>\n  <DL><p>\n${list.map((b) => `    <DT><A HREF="${esc(b.url)}" ADD_DATE="${Math.floor((b.t || Date.now()) / 1000)}">${esc(b.title || b.url)}</A>`).join("\n")}\n  </DL><p>\n</DL><p>\n`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = "kitsune-bookmarks.html"; document.body.append(a); a.click(); a.remove();
  };
  $("#bm-in", m.root).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const doc = new DOMParser().parseFromString(await f.text(), "text/html");
    const have = new Set(list.map((b) => b.url)); let n = 0;
    for (const a of doc.querySelectorAll("a[href]")) { const u = a.getAttribute("href"); if (!/^https?:\/\//.test(u) || have.has(u)) continue; have.add(u); list.push({ url: u, title: a.textContent.trim().slice(0, 200) || u, t: (+a.getAttribute("add_date") || Date.now() / 1000) * 1000 }); n++; }
    await save(); draw(); toast(n ? `Imported ${n} bookmark${n > 1 ? "s" : ""}.` : "No new bookmarks in that file.");
  };
  draw();
}

// right-click (or long-press) a tab for more
document.addEventListener("contextmenu", async (e) => {
  const tabEl = e.target.closest?.("#kb-tabs [data-tab]"); if (!tabEl) return;
  e.preventDefault();
  const i = +tabEl.dataset.tab, t = B.tabs[i]; if (!t) return;
  const { menu } = await import("../util.js");
  const closeWhere = (keep) => { const cur = T(); const gone = B.tabs.filter((x, j) => !keep(x, j) && !x.pinned); gone.forEach((x) => { rememberClosed(x); $(`#kbf-${x.id}`)?.remove(); }); B.tabs = B.tabs.filter((x) => !gone.includes(x)); if (!B.tabs.length) B.tabs.push(newTab(null)); B.active = Math.max(0, B.tabs.indexOf(cur.url && B.tabs.includes(cur) ? cur : t)); persistTabs(); showTab(); if (gone.length) toast(`Closed ${gone.length} tab${gone.length > 1 ? "s" : ""}.`, { action: "Undo", onAction: () => gone.forEach(() => reopenClosed(0)) }); };
  menu(tabEl, [
    ...(t.url ? [{ label: "Duplicate tab", icon: "plus", run: () => { const n = newTab(t.url); n.title = t.title; n.mode = t.mode; B.tabs.splice(i + 1, 0, n); B.active = i + 1; persistTabs(); showTab(); } }] : []),
    ...(t.url ? [{ label: t.pinned ? "Unpin tab" : "Pin tab", icon: "bookmark", run: () => togglePin(i) }] : []),
    ...(t.url ? [{ label: "Copy link", icon: "link", run: () => navigator.clipboard?.writeText(t.url).then(() => toast("Link copied.")) }] : []),
    ...(t.url ? [{ label: "Copy as Markdown link", icon: "link", run: () => navigator.clipboard?.writeText(`[${(t.title || host(t.url)).replace(/[[\]]/g, "")}](${t.url})`).then(() => toast("Markdown link copied.")) }] : []),
    ...(t.url ? [{ label: "Colour…", icon: "star", run: () => colourTab(t, tabEl) }] : []),
    ...(t.color ? [{ label: "Close tabs of this colour", icon: "x", run: () => closeWhere((x) => x.color !== t.color) }] : []),
    { label: "Close other tabs", icon: "x", run: () => closeWhere((x) => x === t) },
    { label: "Close tabs to the right", icon: "x", run: () => closeWhere((x, j) => j <= i) },
    { label: "Reopen closed tab", icon: "back", run: () => reopenClosed() },
    { label: "All tabs…", icon: "grid", run: tabsDialog },
  ]);
});

// a way back up from far down a long page
function topButton(scroller) {
  B.view && $("#kb-top", B.view)?.remove();
  const b = document.createElement("button"); b.type = "button"; b.id = "kb-top"; b.className = "kb-top"; b.hidden = true; b.setAttribute("aria-label", "Back to top"); b.title = "Back to top";
  b.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
  b.onclick = () => scroller.scrollTo({ top: 0, behavior: "smooth" });
  $("#kb-body", B.view)?.append(b);
  let last = 0;
  scroller.addEventListener("scroll", () => { const y = scroller.scrollTop; if (y < 1800) b.hidden = true; else if (Math.abs(y - last) > 4) b.hidden = y > last; last = y; }, { passive: true });
}

// =====================================================================
// v90: a calculator and unit converter in the address bar
// =====================================================================
function calc(src) {
  const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, "").replace(/\s+/g, ""); let i = 0;
  const num = () => { const m = s.slice(i).match(/^\d*\.?\d+(e[+-]?\d+)?/i); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]); };
  const atom = () => { if (s[i] === "(") { i++; const v = expr(); if (s[i++] !== ")") throw 0; return v; } if (s[i] === "-") { i++; return -atom(); } if (s[i] === "+") { i++; return atom(); } const fn = s.slice(i).match(/^(sqrt|sin|cos|tan|log|ln|abs|pi)/i); if (fn) { i += fn[0].length; const f = fn[0].toLowerCase(); if (f === "pi") return Math.PI; const v = atom(); return { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log, abs: Math.abs }[f](v); } let v = num(); if (s[i] === "%") { i++; v /= 100; } return v; };
  const pow = () => { const b = atom(); if (s[i] === "^" || s.slice(i, i + 2) === "**") { i += s[i] === "^" ? 1 : 2; return b ** pow(); } return b; };
  const term = () => { let v = pow(); while (s[i] === "*" || s[i] === "/" || (s[i] === "(")) { if (s[i] === "(") { v *= pow(); continue; } const op = s[i++]; const r = pow(); v = op === "*" ? v * r : v / r; } return v; };
  const expr = () => { let v = term(); while (s[i] === "+" || s[i] === "-") { const op = s[i++]; const r = term(); v = op === "+" ? v + r : v - r; } return v; };
  const v = expr(); if (i !== s.length || !Number.isFinite(v)) throw 0; return v;
}
const UNITS = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, mile: 1609.344, miles: 1609.344, yd: 0.9144, yard: 0.9144, yards: 0.9144, ft: 0.3048, foot: 0.3048, feet: 0.3048, in: 0.0254, inch: 0.0254, inches: 0.0254 },
  mass: { kg: 1, g: 0.001, mg: 1e-6, lb: 0.45359237, lbs: 0.45359237, pound: 0.45359237, pounds: 0.45359237, oz: 0.028349523, ounce: 0.028349523, ounces: 0.028349523, st: 6.35029318, stone: 6.35029318 },
  volume: { l: 1, liter: 1, liters: 1, litre: 1, litres: 1, ml: 0.001, gal: 3.785411784, gallon: 3.785411784, gallons: 3.785411784, cup: 0.2365882365, cups: 0.2365882365, floz: 0.0295735296, pt: 0.473176473, pint: 0.473176473, pints: 0.473176473, qt: 0.946352946, quart: 0.946352946 },
  speed: { kph: 1, "km/h": 1, kmh: 1, mph: 1.609344, "m/s": 3.6, knot: 1.852, knots: 1.852 },
  time: { s: 1, sec: 1, second: 1, seconds: 1, min: 60, mins: 60, minute: 60, minutes: 60, h: 3600, hr: 3600, hour: 3600, hours: 3600, day: 86400, days: 86400, week: 604800, weeks: 604800 },
};
const fmtNum = (v) => (Math.abs(v) >= 1e12 || (Math.abs(v) < 1e-6 && v !== 0) ? v.toExponential(6) : (+v.toPrecision(12)).toLocaleString(undefined, { maximumFractionDigits: 8 }));
function quickAnswer(q) {
  const t = q.trim().toLowerCase();
  const u = t.match(/^(-?[\d.,]+)\s*([a-z°/]+)\s+(?:to|in|as)\s+([a-z°/]+)$/);
  if (u) {
    const n = parseFloat(u[1].replace(/,/g, "")), a = u[2].replace("°", ""), b = u[3].replace("°", "");
    const temp = { c: "c", celsius: "c", f: "f", fahrenheit: "f", k: "k", kelvin: "k" };
    if (temp[a] && temp[b]) { const toC = { c: (x) => x, f: (x) => ((x - 32) * 5) / 9, k: (x) => x - 273.15 }[temp[a]](n), out = { c: (x) => x, f: (x) => (x * 9) / 5 + 32, k: (x) => x + 273.15 }[temp[b]](toC); return { kind: "Temperature", value: `${fmtNum(+out.toFixed(2))} °${temp[b].toUpperCase()}`, detail: `${fmtNum(n)} °${temp[a].toUpperCase()}` }; }
    for (const [kind, table] of Object.entries(UNITS)) if (table[a] && table[b]) return { kind: kind[0].toUpperCase() + kind.slice(1), value: `${fmtNum((n * table[a]) / table[b])} ${u[3]}`, detail: `${fmtNum(n)} ${u[2]}` };
  }
  if (/[\d)]\s*[-+*/^×÷%]|sqrt|\bpi\b|^\(/.test(t) && /^[\d\s.,+\-*/^()%×÷a-z]+$/.test(t) && !/[a-z]{2,}/.test(t.replace(/sqrt|sin|cos|tan|log|ln|abs|pi/g, ""))) {
    try { const v = calc(t); return { kind: "Calculator", value: fmtNum(v), detail: q.trim() + " =" }; } catch {}
  }
  return null;
}

// =====================================================================
// v91: blocked sites, time on sites, compare with a saved copy
// =====================================================================
const blockedList = () => { try { return JSON.parse(localStorage.getItem("kitsune.webBlocked") || "[]"); } catch { return []; } };
function isBlocked(url) { try { const h = new URL(url).hostname, r = regOf(h); return blockedList().some((b) => b === r || b === h || h.endsWith("." + b)); } catch { return false; } }
function setBlocked(site, on) { const l = new Set(blockedList()); on ? l.add(site) : l.delete(site); try { localStorage.setItem("kitsune.webBlocked", JSON.stringify([...l])); } catch {} }
function blockedPage(url, inNew) {
  if (inNew) { B.tabs.splice(B.active + 1, 0, newTab(null)); B.active++; drawTabs(); }
  const r = regOf(host(url));
  $("#kb-body", B.view).innerHTML = `<div class="kb-err"><h2>You blocked ${esc(r)}</h2><p>Kitsune won't open it while it's on your blocked list.</p><div class="hero-actions"><button class="btn" type="button" id="kb-unblock">Unblock and open</button><button class="btn" type="button" id="kb-blist">Blocked sites…</button></div></div>`;
  $("#kb-unblock", B.view).onclick = () => { setBlocked(r, false); go(url, { push: true }); };
  $("#kb-blist", B.view).onclick = blockedDialog;
}
function blockedDialog() {
  const m = modal({ title: "Blocked sites", body: `<p class="muted" style="margin-top:0">Sites Kitsune's browser won't open, to help you stay focused. Links to them show a reminder instead.</p><form class="toolbar" id="bl-f" style="margin:0 0 10px"><input class="field" id="bl-h" placeholder="site.com" style="flex:1" required><button class="btn">Block</button></form><div class="kb-list" id="bl-l"></div>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
  const draw = () => { const l = blockedList(); $("#bl-l", m.root).innerHTML = l.length ? l.map((h) => `<div class="kb-li-row"><span class="kb-li"><img src="${esc(favicon("https://" + h))}" alt="" referrerpolicy="no-referrer"><span><strong>${esc(h)}</strong></span></span><button type="button" class="btn btn-sm" data-unbl="${esc(h)}">Unblock</button></div>`).join("") : `<p class="hint">Nothing blocked.</p>`; };
  $("#bl-f", m.root).onsubmit = (e) => { e.preventDefault(); let h = $("#bl-h", m.root).value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, ""); if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(h)) return toast("Type a site like example.com."); setBlocked(regOf(h), true); $("#bl-h", m.root).value = ""; draw(); };
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-unbl]"); if (b) { setBlocked(b.dataset.unbl, false); draw(); } });
  draw();
}

// ---------- time on sites: counted while a page is on screen and you're active ----------
let lastActive = Date.now();
["pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) => addEventListener(ev, () => (lastActive = Date.now()), { passive: true, capture: true }));
setInterval(async () => {
  if (document.hidden || !location.hash.startsWith("#web") || Date.now() - lastActive > 120_000 || settings.incognito) return;
  const t = B.tabs?.[B.active]; if (!t?.url || !t.data) return;
  const day = new Date().toISOString().slice(0, 10), h = host(t.url).replace(/^www\./, "");
  const all = (await kvGet("webTime", {})) || {};
  (all[day] ||= {})[h] = (all[day][h] || 0) + 15;
  const days = Object.keys(all).sort(); while (days.length > 35) delete all[days.shift()];
  kvSet("webTime", all);
}, 15_000);
async function timeDialog() {
  const all = (await kvGet("webTime", {})) || {};
  const fmt = (s) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min` : s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`);
  const sum = (days) => { const o = {}; for (const d of days) for (const [h, s] of Object.entries(all[d] || {})) o[h] = (o[h] || 0) + s; return Object.entries(o).sort((a, b) => b[1] - a[1]); };
  const today = new Date().toISOString().slice(0, 10), week = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const m = modal({ title: "Time on sites", wide: true, body: `<div class="seg" id="ts-r"><button type="button" data-r="today" aria-pressed="true">Today</button><button type="button" data-r="week" aria-pressed="false">7 days</button><button type="button" data-r="all" aria-pressed="false">30 days</button></div><div id="ts-l" style="margin-top:12px"></div><p class="hint">Counted only while a page is on screen and you're using Kitsune. Never in incognito. Kept on this device for 30 days.</p>`,
    actions: `<button class="btn btn-ghost" type="button" id="ts-clear" style="margin-right:auto">Clear</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  const draw = (r) => {
    $$("#ts-r [data-r]", m.root).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.r === r)));
    const rows = sum(r === "today" ? [today] : r === "week" ? week : Object.keys(all)), max = rows[0]?.[1] || 1, total = rows.reduce((n, [, s]) => n + s, 0);
    $("#ts-l", m.root).innerHTML = rows.length ? `<p style="margin:0 0 10px"><strong>${fmt(total)}</strong> in all</p><div class="ts-bars">${rows.slice(0, 20).map(([h, s]) => `<div class="ts-row"><img src="${esc(favicon("https://" + h))}" alt="" referrerpolicy="no-referrer"><span class="ts-h">${esc(h)}</span><span class="ts-bar"><i style="width:${Math.max(2, (s / max) * 100)}%"></i></span><span class="ts-v">${fmt(s)}</span></div>`).join("")}</div>` : `<p class="hint">No browsing counted yet.</p>`;
  };
  m.root.addEventListener("click", async (e) => { const b = e.target.closest("[data-r]"); if (b) draw(b.dataset.r); if (e.target.closest("#ts-clear")) { await kvSet("webTime", {}); for (const k of Object.keys(all)) delete all[k]; draw("today"); } });
  draw("today");
}

// ---------- what changed since you saved this page ----------
async function compareSaved() {
  const t = T(); if (!t.url || !t.data?.html) return toast("Open a page first.");
  const saved = ((await kvGet("webOffline", [])) || []).find((x) => x.url === t.url);
  if (!saved) return toast("You haven't saved this page. Use “Save for offline reading” first, then compare later.");
  const blocks = (html) => { const d = new DOMParser().parseFromString(html || "", "text/html"); d.querySelectorAll("script, style, nav, noscript, template").forEach((n) => n.remove()); return [...d.querySelectorAll("h1, h2, h3, h4, p, li, td, blockquote, pre")].map((n) => n.textContent.replace(/\s+/g, " ").trim()).filter((x) => x.length > 2); };
  const was = blocks(saved.data.html), now = blocks(t.data.html), wasSet = new Set(was), nowSet = new Set(now);
  const added = now.filter((x) => !wasSet.has(x)), removed = was.filter((x) => !nowSet.has(x));
  const m = modal({ title: "Changes since you saved it", wide: true, body: `<p class="muted" style="margin-top:0">Your copy is from ${ago(saved.saved)}. ${added.length || removed.length ? `${plural(added.length, "new passage")} and ${plural(removed.length, "passage")} gone.` : "No changes in the text."}</p><div class="cmp">${added.slice(0, 80).map((x) => `<p class="cmp-add">${esc(x.slice(0, 600))}</p>`).join("")}${removed.slice(0, 80).map((x) => `<p class="cmp-del">${esc(x.slice(0, 600))}</p>`).join("")}</div>`,
    actions: `<button class="btn" type="button" id="cmp-save">Save this version instead</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  $("#cmp-save", m.root).onclick = async () => { m.close(); await saveOffline(); };
}

// =====================================================================
// v92: offer to translate foreign pages; your own search shortcuts
// =====================================================================
function offerTranslate() {
  const t = T(); B.view && $("#kb-trbar", B.view)?.remove();
  if (!t?.doc || t.mode === "live") return;
  const lang = (t.doc.documentElement.getAttribute("lang") || "").toLowerCase().split(/[-_]/)[0], mine = (navigator.language || "en").toLowerCase().split("-")[0];
  if (!lang || lang === mine || !/^[a-z]{2,3}$/.test(lang)) return;
  let never = []; try { never = JSON.parse(localStorage.getItem("kitsune.noTrOffer") || "[]"); } catch {}
  if (never.includes(lang)) return;
  let name = lang; try { name = new Intl.DisplayNames([navigator.language || "en"], { type: "language" }).of(lang) || lang; } catch {}
  const bar = document.createElement("div"); bar.id = "kb-trbar"; bar.className = "kb-trbar";
  bar.innerHTML = `${icon("globe")}<span>This page is in <strong>${esc(name)}</strong>.</span><button type="button" class="btn btn-sm btn-accent" data-tr="go">Translate</button><button type="button" class="btn btn-sm" data-tr="never">Never for ${esc(name)}</button><button type="button" class="icon-btn" data-tr="x" aria-label="Dismiss">×</button>`;
  bar.onclick = (e) => { const a = e.target.closest("[data-tr]")?.dataset.tr; if (!a) return; bar.remove(); if (a === "go") translateDialog(); if (a === "never") { never.push(lang); try { localStorage.setItem("kitsune.noTrOffer", JSON.stringify(never)); } catch {} toast(`Kitsune won't offer to translate ${name} pages.`); } };
  $("#kb-body", B.view)?.append(bar);
}

async function shortcutsDialog() {
  let engines = { ...((await store.engines()) || {}) };
  const m = modal({ title: "Search shortcuts", wide: true, body: `<p class="muted" style="margin-top:0">Type a shortcut, a space and your words in the address bar: <kbd>w fox</kbd>. Sites you've searched are learned automatically; add your own with <kbd>%s</kbd> where the words go.</p>
      <form class="sc-add" id="sc-f"><input class="field" id="sc-k" placeholder="Shortcut (e.g. yt)" required maxlength="16"><input class="field" id="sc-n" placeholder="Name (e.g. YouTube)" required><input class="field" id="sc-u" placeholder="https://www.youtube.com/results?search_query=%s" required><button class="btn btn-accent">Add</button></form>
      <div class="kb-list" id="sc-l" style="margin-top:10px"></div>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
  const save = () => kvSet("webEngines", engines);
  const draw = () => { const list = Object.entries(engines).sort((a, b) => (a[1].keyword || "").localeCompare(b[1].keyword || "")); $("#sc-l", m.root).innerHTML = list.length ? list.map(([k, e]) => `<div class="kb-li-row"><input class="field sc-kw" data-sck="${esc(k)}" value="${esc(e.keyword || "")}" aria-label="Shortcut for ${esc(e.name)}" maxlength="16"><span class="kb-li"><img src="${esc(e.icon || favicon(e.template.replace("{q}", "")))}" alt="" referrerpolicy="no-referrer"><span><strong>${esc(e.name)}</strong><small>${esc(e.template.replace("{q}", "%s"))}${e.custom ? " · yours" : " · learned"}</small></span></span><button type="button" class="icon-btn" data-scdel="${esc(k)}" aria-label="Delete">${icon("trash")}</button></div>`).join("") : `<p class="hint">No shortcuts yet.</p>`; };
  $("#sc-f", m.root).onsubmit = async (e) => {
    e.preventDefault();
    const kw = $("#sc-k", m.root).value.trim().toLowerCase().replace(/\s+/g, ""), url = $("#sc-u", m.root).value.trim();
    if (!/^https?:\/\/[^\s]+%s/.test(url)) return toast("The address needs %s where your words go.");
    if (Object.values(engines).some((x) => x.keyword === kw)) return toast(`“${kw}” is already a shortcut.`);
    let h = ""; try { h = new URL(url.replace("%s", "x")).hostname; } catch { return toast("That isn't a web address."); }
    engines["custom:" + kw] = { name: $("#sc-n", m.root).value.trim(), host: h, template: url.replace("%s", "{q}"), keyword: kw, kind: "yours", custom: true, learned: Date.now(), icon: favicon("https://" + h) };
    await save(); e.target.reset(); draw(); toast(`Type “${kw} words” in the address bar.`);
  };
  m.root.addEventListener("change", async (e) => { const i = e.target.closest("[data-sck]"); if (!i) return; const kw = i.value.trim().toLowerCase().replace(/\s+/g, ""); if (kw && Object.entries(engines).some(([k, x]) => k !== i.dataset.sck && x.keyword === kw)) { toast(`“${kw}” is already used.`); return draw(); } engines[i.dataset.sck].keyword = kw; await save(); });
  m.root.addEventListener("click", async (e) => { const d = e.target.closest("[data-scdel]"); if (d) { delete engines[d.dataset.scdel]; await save(); draw(); } });
  draw();
}

// =====================================================================
// v93: always Reader, dark pages at night, video speed
// =====================================================================
const readerSites = () => { try { return new Set(JSON.parse(localStorage.getItem("kitsune.webReader") || "[]")); } catch { return new Set(); } };
function setReaderSite(h, on) { const s = readerSites(); on ? s.add(h) : s.delete(h); try { localStorage.setItem("kitsune.webReader", JSON.stringify([...s])); } catch {} }
function nightActive() {
  try { const s = settings.nightSchedule; if (s?.on) { const mins = (x) => { const [a, b] = String(x).split(":").map(Number); return a * 60 + (b || 0); }; const n = new Date(), now = n.getHours() * 60 + n.getMinutes(), f = mins(s.from || "20:00"), to = mins(s.to || "07:00"); return f <= to ? now >= f && now < to : now >= f || now < to; } } catch {}
  const h = new Date().getHours(); return h >= 20 || h < 7;
}
function videoSpeed() {
  const sr = B.view && $("#kb-page", B.view)?.shadowRoot, rd = B.view && $(".kb-reader", B.view);
  const vids = [...(sr?.querySelectorAll("video, audio") || []), ...(rd?.querySelectorAll("video, audio") || [])];
  if (!vids.length) return toast(T().mode === "live" ? "In Live mode, use the video's own player." : "No video or audio Kitsune can reach on this page.");
  const cur = vids[0].playbackRate || 1;
  const m = modal({ title: "Playback speed", body: `<div class="seg" id="vs-s">${[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3].map((r) => `<button type="button" data-r="${r}" aria-pressed="${r === cur}">${r}×</button>`).join("")}</div><p class="hint" style="margin:8px 0 0">For ${plural(vids.length, "video or track", "videos and tracks")} on this page. Pitch stays natural.</p>`, actions: `<button class="btn btn-accent" type="button" data-close>Done</button>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-r]"); if (!b) return; vids.forEach((v) => { v.playbackRate = +b.dataset.r; v.preservesPitch = true; }); $$("#vs-s [data-r]", m.root).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); });
}

// =====================================================================
// v94: tab colours, footnote popovers
// =====================================================================
const TAB_COLORS = { red: "#e5534b", orange: "#f0883e", yellow: "#d4a72c", green: "#3fa66a", blue: "#4a8fe7", purple: "#9a6ce0", pink: "#e06fae", gray: "#8b8f98" };
async function colourTab(t, anchor) {
  const { menu } = await import("../util.js");
  menu(anchor, [...Object.keys(TAB_COLORS).map((c) => ({ label: (t.color === c ? "✓ " : "") + c[0].toUpperCase() + c.slice(1), icon: "star", run: () => { t.color = c; persistTabs(); drawTabs(); } })), ...(t.color ? [{ label: "No colour", icon: "x", run: () => { t.color = ""; persistTabs(); drawTabs(); } }] : [])]);
}
// a link to a footnote shows the note right there
function footnotePop(root, id, e) {
  const el = root.getElementById(id) || root.querySelector(`[name="${CSS.escape(id)}"]`); if (!el) return false;
  const note = el.closest('li, aside, [role="doc-endnote"], [role="doc-footnote"], .footnote, dd, p') || el;
  const isNote = /^(cite[_-]?note|fn|footnote|note|ftn|endnote|ref|easy-footnote|sdfootnote)/i.test(id) || note.closest('.footnotes, .references, .reflist, ol.references, [role="doc-endnotes"], .footnote, aside');
  if (!isNote) return false;
  const c = note.cloneNode(true); c.querySelectorAll('a[href^="#"]').forEach((a) => { if (/^[\^↑↩︎⤴]|^\s*\^/.test(a.textContent) || /back|return/i.test(a.getAttribute("aria-label") || a.className)) a.remove(); }); c.querySelectorAll(".mw-cite-backlink, .footnote-backref, [role=doc-backlink]").forEach((x) => x.remove());
  const text = c.innerHTML.trim(); if (!c.textContent.trim()) return false;
  document.querySelector("#kb-fn")?.remove();
  const pop = document.createElement("div"); pop.id = "kb-fn"; pop.className = "kb-fn"; pop.setAttribute("role", "note");
  pop.innerHTML = `<div class="kb-fn-body">${text}</div><div class="kb-fn-acts"><button type="button" data-fn="go">Go to note</button><button type="button" data-fn="x" aria-label="Close">×</button></div>`;
  pop.querySelectorAll("script, style, iframe").forEach((x) => x.remove());
  document.body.append(pop);
  const x = Math.min(innerWidth - pop.offsetWidth - 10, Math.max(10, (e?.clientX || 100) - 40)), y = (e?.clientY || 100) + 14;
  Object.assign(pop.style, { left: x + "px", top: (y + pop.offsetHeight > innerHeight - 10 ? Math.max(10, (e?.clientY || 100) - pop.offsetHeight - 14) : y) + "px" });
  const close = () => { pop.remove(); removeEventListener("pointerdown", away, true); removeEventListener("keydown", key, true); };
  const away = (ev) => { if (!pop.contains(ev.target)) close(); };
  const key = (ev) => { if (ev.key === "Escape") close(); };
  setTimeout(() => { addEventListener("pointerdown", away, true); addEventListener("keydown", key, true); });
  pop.addEventListener("click", (ev) => { const a = ev.target.closest("[data-fn]")?.dataset.fn; if (a === "x") close(); if (a === "go") { close(); el.scrollIntoView({ behavior: "smooth", block: "center" }); } const l = ev.target.closest("a[href]"); if (l && /^https?:/.test(l.href)) { ev.preventDefault(); close(); go(l.href, { newTab: true }); } });
  return true;
}

// =====================================================================
// v95: right-click a picture
// =====================================================================
document.addEventListener("contextmenu", async (e) => {
  const path = e.composedPath?.() || []; const im = path.find((n) => n?.tagName === "IMG");
  if (!im || !B.view?.isConnected || !path.some((n) => n?.id === "kb-page" || n?.classList?.contains?.("kb-reader"))) return;
  e.preventDefault();
  let src = im.currentSrc || im.src || ""; const mm = src.match(/\/api\/browse\/img\?url=([^&]+)/); if (mm) src = decodeURIComponent(mm[1]);
  if (!/^https?:/.test(src)) return;
  const t = T(), { menu, saveBlob } = await Promise.all([import("../util.js"), import("../lookup.js")]).then(([U, L]) => ({ menu: U.menu, saveBlob: L.saveBlob }));
  const blobOf = async () => { const r = await fetch("/api/browse/img?url=" + encodeURIComponent(src) + "&ref=" + encodeURIComponent(t.url || "")); if (!r.ok) throw new Error(); return r.blob(); };
  const anchor = document.createElement("span"); Object.assign(anchor.style, { position: "fixed", left: e.clientX + "px", top: e.clientY + "px", width: "1px", height: "1px" }); document.body.append(anchor); setTimeout(() => anchor.remove(), 30_000);
  const link = path.find((n) => n?.tagName === "A" && n.href);
  menu(anchor, [
    { label: "View picture", icon: "zoom", run: () => E.lightbox([{ src: im.currentSrc || im.src, alt: im.alt, full: src }], 0) },
    { label: "Save picture", icon: "download", run: async () => { try { const b = await blobOf(); saveBlob(b, decodeURIComponent(new URL(src).pathname.split("/").pop() || "picture").slice(0, 80) || "picture"); } catch { toast("Couldn't save that picture."); } } },
    { label: "Copy picture", icon: "edit", run: async () => { try { let b = await blobOf(); if (b.type !== "image/png") { const bmp = await createImageBitmap(b); const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height; c.getContext("2d").drawImage(bmp, 0, 0); b = await new Promise((ok) => c.toBlob(ok, "image/png")); } await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); toast("Picture copied."); } catch { toast("Couldn't copy that picture."); } } },
    { label: "Copy picture address", icon: "link", run: () => navigator.clipboard?.writeText(src).then(() => toast("Address copied.")) },
    { label: "Open picture in a new tab", icon: "plus", run: () => go(src, { newTab: true }) },
    { label: "Find this picture elsewhere (TinEye)", icon: "search", run: () => window.open("https://tineye.com/search?url=" + encodeURIComponent(src), "_blank", "noopener") },
    ...(im.alt ? [{ label: "Copy description", icon: "type", run: () => navigator.clipboard?.writeText(im.alt).then(() => toast("Description copied.")) }] : []),
    ...(link && !/^javascript:/i.test(link.href) ? [{ label: "Open link in a new tab", icon: "link", run: () => go(link.href, { newTab: true }) }] : []),
  ]);
});

// =====================================================================
// v96: drag tabs, middle-click to close, pinch zoom on pages, a resizable side panel
// =====================================================================
let dragTab = -1;
document.addEventListener("dragstart", (e) => { const tb = e.target.closest?.("#kb-tabs [data-tab]"); if (!tb) return; dragTab = +tb.dataset.tab; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/uri-list", B.tabs[dragTab]?.url || ""); } catch {} tb.classList.add("dragging"); });
document.addEventListener("dragover", (e) => { const tb = e.target.closest?.("#kb-tabs [data-tab]"); if (!tb || dragTab < 0) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; $$("#kb-tabs .drop-before, #kb-tabs .drop-after").forEach((x) => x.classList.remove("drop-before", "drop-after")); const r = tb.getBoundingClientRect(); tb.classList.add(e.clientX < r.left + r.width / 2 ? "drop-before" : "drop-after"); });
document.addEventListener("drop", (e) => {
  const tb = e.target.closest?.("#kb-tabs [data-tab]"); if (!tb || dragTab < 0) return; e.preventDefault();
  const r = tb.getBoundingClientRect(); let to = +tb.dataset.tab + (e.clientX < r.left + r.width / 2 ? 0 : 1);
  const cur = T(), [moved] = B.tabs.splice(dragTab, 1); if (to > dragTab) to--;
  // pinned tabs stay at the front
  const firstFree = B.tabs.findIndex((x) => !x.pinned); if (!moved.pinned && firstFree >= 0 && to < firstFree) to = firstFree;
  B.tabs.splice(to, 0, moved); B.active = B.tabs.indexOf(cur); dragTab = -1; persistTabs(); drawTabs();
});
document.addEventListener("dragend", () => { dragTab = -1; $$("#kb-tabs .dragging, #kb-tabs .drop-before, #kb-tabs .drop-after").forEach((x) => x.classList.remove("dragging", "drop-before", "drop-after")); });
// middle-click a tab closes it
document.addEventListener("auxclick", (e) => { if (e.button !== 1) return; const tb = e.target.closest?.("#kb-tabs [data-tab]"); if (!tb) return; e.preventDefault(); tb.querySelector("[data-close]")?.click(); });
// pinch (or ctrl + wheel) on a page changes its text size, remembered for the site
let pinchAcc = 0, pinchT = 0;
document.addEventListener("wheel", (e) => {
  if (!(e.ctrlKey || e.metaKey) || !B.view?.isConnected) return;
  const inPage = e.composedPath().some((n) => n?.id === "kb-page" || n?.classList?.contains?.("kb-reader")); if (!inPage) return;
  e.preventDefault(); pinchAcc += e.deltaY;
  if (Math.abs(pinchAcc) > 30) { const d = pinchAcc > 0 ? -0.1 : 0.1; pinchAcc = 0; const t = T(); t.zoom = Math.max(0.6, Math.min(2, +((t.zoom || 1) + d).toFixed(2))); const pg = $("#kb-page", B.view), rd = $(".kb-reader", B.view); pg?.style.setProperty("--kbz", t.zoom); rd?.style.setProperty("--kbz", t.zoom); clearTimeout(pinchT); pinchT = setTimeout(() => { setSiteZoom(host(t.url || ""), t.zoom); toast(`Text size ${Math.round(t.zoom * 100)}%`, { ms: 1200 }); }, 350); }
}, { passive: false, capture: true });
// the peek panel can be made wider or narrower by dragging its edge
function peekGrip(p) {
  if (!p || p.querySelector(".kb-peek-grip")) return;
  const g = document.createElement("div"); g.className = "kb-peek-grip"; g.title = "Drag to resize"; g.setAttribute("aria-hidden", "true"); p.prepend(g);
  try { const w = +localStorage.getItem("kitsune.peekW"); if (w) p.style.width = Math.min(w, innerWidth * 0.92) + "px"; } catch {}
  g.addEventListener("pointerdown", (e) => { e.preventDefault(); g.setPointerCapture(e.pointerId); const right = p.getBoundingClientRect().right; const mv = (ev) => { p.style.width = Math.max(280, Math.min(innerWidth * 0.92, right - ev.clientX)) + "px"; }; const up = () => { g.removeEventListener("pointermove", mv); try { localStorage.setItem("kitsune.peekW", parseInt(p.style.width)); } catch {} }; g.addEventListener("pointermove", mv); g.addEventListener("pointerup", up, { once: true }); });
}
{ const orig = peek; peek = function (url) { const pr = orig(url); peekGrip(B.view && $("#kb-peek", B.view)); return pr; }; }
