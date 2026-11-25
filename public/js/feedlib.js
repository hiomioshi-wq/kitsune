// Feeds: subscriptions to RSS, Atom and JSON Feed, kept on this device. This file holds the parts the Feeds page and the
// browser share: finding a site's feed, reading any feed format, cleaning article HTML, OPML import and export, and storage.
import { kvGet, kvSet } from "./store.js";
import { api } from "./util.js";

const abs = (u, b) => { try { const x = new URL(u, b); return /^https?:$/i.test(x.protocol) ? x.href : ""; } catch { return ""; } };
export const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
const txt = (s) => (s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
export const snippet = (html, n = 170) => { const t = txt(html); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t; };

// ---------- storage ----------
export const getSubs = async () => (await kvGet("feedSubs", [])) || [];
export const setSubs = (l) => kvSet("feedSubs", l);
export const getItems = async () => (await kvGet("feedItems", {})) || {};
export const setItems = (m) => kvSet("feedItems", m);
export const getRead = async () => new Set((await kvGet("feedRead", [])) || []);
export const setRead = (set) => kvSet("feedRead", [...set].slice(-6000));
export const getStars = async () => (await kvGet("feedStars", {})) || {};
export const setStars = (m) => kvSet("feedStars", m);

// ---------- reading a feed ----------
function parseJsonFeed(j, url) {
  const feedId = "f" + hash(url), who = (x) => [].concat(x?.authors || x?.author || []).map((a) => a?.name || a || "").filter(Boolean).join(", "), av = (i) => (i.attachments || []).find((a) => /^(audio|video)/.test(a.mime_type || ""));
  return { title: j.title || "", site: j.home_page_url || "", author: who(j), items: (j.items || []).slice(0, 80).map((i) => ({ id: feedId + ":" + hash(String(i.id || i.url || i.external_url || i.title)), title: i.title || snippet(i.content_html || i.content_text || "", 70), link: i.url || i.external_url || "", date: Date.parse(i.date_published || i.date_modified || "") || 0, author: who(i) || who(j), html: (i.content_html || `<p>${(i.content_text || "").replace(/\n/g, "<br>")}</p>`).slice(0, 60000), thumb: i.image || i.banner_image || "", media: av(i) ? { url: av(i).url, type: av(i).mime_type } : undefined })) };
}
function parseXml(text, url) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror") && !doc.querySelector("item, entry")) throw new Error("That isn't a feed Kitsune can read.");
  const feedId = "f" + hash(url), q = (n, s) => n.getElementsByTagName(s)[0];
  const isAtom = !!doc.querySelector("feed");
  const chan = isAtom ? doc.querySelector("feed") : doc.querySelector("channel");
  const own = (s) => [...chan.children].find((c) => c.tagName === s);
  const siteLink = isAtom ? [...chan.children].find((c) => c.tagName === "link" && (!c.getAttribute("rel") || c.getAttribute("rel") === "alternate"))?.getAttribute("href") : own("link")?.textContent;
  const pod = { author: txt(own("itunes:author")?.textContent) || "", cat: [...chan.children].filter((c) => c.tagName === "itunes:category").map((c) => c.getAttribute("text") || "").filter(Boolean).join(", "), art: own("itunes:image")?.getAttribute("href") || "" };
  const items = [...doc.querySelectorAll("item, entry")].slice(0, 80).map((n) => {
    const link = isAtom ? ([...n.getElementsByTagName("link")].find((l) => !l.getAttribute("rel") || l.getAttribute("rel") === "alternate")?.getAttribute("href") || "") : (q(n, "link")?.textContent || "").trim();
    const raw = (q(n, "content:encoded") || q(n, "content") || q(n, "description") || q(n, "summary"))?.textContent || "";
    const guid = (q(n, "guid") || q(n, "id"))?.textContent || link || q(n, "title")?.textContent || "";
    const date = Date.parse((q(n, "pubDate") || q(n, "published") || q(n, "updated") || q(n, "dc:date"))?.textContent || "") || 0;
    const media = q(n, "media:thumbnail")?.getAttribute("url") || [...n.getElementsByTagName("media:content")].find((m) => /image/.test(m.getAttribute("medium") || m.getAttribute("type") || ""))?.getAttribute("url") || [...n.getElementsByTagName("enclosure")].find((e) => /^image/.test(e.getAttribute("type") || ""))?.getAttribute("url") || "";
    const enc = [...n.getElementsByTagName("enclosure")].find((e) => /^(audio|video)/.test(e.getAttribute("type") || "") || /\.(mp3|m4a|ogg|opus|mp4|webm)(\?|$)/i.test(e.getAttribute("url") || "")) || [...n.getElementsByTagName("media:content")].find((m) => /^(audio|video)/.test(m.getAttribute("type") || m.getAttribute("medium") || "") || /\.(mp3|m4a|ogg|opus|mp4|webm)(\?|$)/i.test(m.getAttribute("url") || ""));
    const firstImg = (raw.match(/<img[^>]+src=["']([^"']+)/i) || [])[1] || "";
    return { id: feedId + ":" + hash(guid.trim()), title: txt(q(n, "title")?.textContent) || snippet(raw, 70), link: abs(link, url), date, author: txt(q(n, "dc:creator")?.textContent || q(n, "author")?.textContent || q(n, "name")?.textContent || "") || pod.author, html: raw.slice(0, 60000), thumb: abs(media || q(n, "itunes:image")?.getAttribute("href") || firstImg || pod.art, link || url), media: enc ? { url: enc.getAttribute("url"), type: enc.getAttribute("type") || "" } : undefined };
  });
  return { title: txt(own("title")?.textContent), site: abs(siteLink || "", url), author: pod.author, category: pod.cat, items };
}
export function parseFeed(text, url) {
  const t = text.trim();
  if (t.startsWith("{")) { let j; try { j = JSON.parse(t); } catch { throw new Error("That isn't a feed Kitsune can read."); } if (!Array.isArray(j.items) && !/^https:\/\/jsonfeed\.org\//.test(j.version || "")) throw new Error("That isn't a feed Kitsune can read."); return parseJsonFeed(j, url); }
  return parseXml(t, url);
}

async function fetchText(url) {
  try { return await api("feed?url=" + encodeURIComponent(url)); }
  catch (e) {
    const r = await fetch("/api/browse?url=" + encodeURIComponent(url)); if (!r.ok) throw e; const j = await r.json();
    if (j.kind === "json" && j.text) return j.text; if (j.kind === "xml" && j.text) return j.text;
    throw e;
  }
}
export async function loadFeed(url) { return parseFeed(await fetchText(url), url); }

// Find a feed from a site's address: links in the page's head first, then the usual places.
export async function discover(input) {
  let url = input.trim(); if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try { return { url, ...(await loadFeed(url)) }; } catch {}
  const found = [];
  try {
    const r = await (await fetch("/api/browse?url=" + encodeURIComponent(url))).json();
    if (r.html) {
      const doc = new DOMParser().parseFromString(r.html, "text/html");
      doc.querySelectorAll('link[rel~="alternate"]').forEach((l) => { if (/rss|atom|feed\+json|json/i.test(l.getAttribute("type") || "") && l.getAttribute("href")) found.push(abs(l.getAttribute("href"), r.url || url)); });
      doc.querySelectorAll("a[href]").forEach((a) => { const h = a.getAttribute("href"); if (/(\/|\.)(rss|atom|feed)(\.xml|\.json)?\/?$|\/feed\/?$|\/rss\/?$/i.test(h)) found.push(abs(h, r.url || url)); });
    }
  } catch {}
  const o = new URL(url);
  for (const p of ["/feed", "/feed/", "/rss", "/rss.xml", "/atom.xml", "/feed.xml", "/index.xml", "/feed.json"]) found.push(o.origin + p);
  for (const f of [...new Set(found.filter(Boolean))].slice(0, 10)) { try { return { url: f, ...(await loadFeed(f)) }; } catch {} }
  throw new Error("Couldn't find a feed there. Try the feed's own address.");
}

// ---------- subscribing ----------
export async function subscribe(input, folder = "") {
  const subs = await getSubs(), f = await discover(input);
  if (subs.some((s) => s.url === f.url)) return { sub: subs.find((s) => s.url === f.url), items: f.items, existed: true };
  const sub = { id: "f" + hash(f.url), url: f.url, title: f.title || new URL(f.url).hostname.replace(/^www\./, ""), site: f.site, folder, added: Date.now(), ...(f.author && { author: f.author }), ...(f.category && { category: f.category }) };
  subs.push(sub); await setSubs(subs);
  const items = await getItems(); items[sub.id] = f.items; await setItems(items);
  return { sub, items: f.items, existed: false };
}

// ---------- article HTML, cleaned ----------
export function clean(html, base) {
  const d = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html"), root = d.body.firstElementChild;
  root.querySelectorAll("script,style,iframe,object,embed,form,link,meta,noscript,svg,canvas,audio,video,button,input,select,textarea").forEach((n) => n.remove());
  root.querySelectorAll("*").forEach((n) => { for (const a of [...n.attributes]) { if (/^on/i.test(a.name) || (a.name === "style") || /^javascript:/i.test(a.value.trim())) n.removeAttribute(a.name); } });
  root.querySelectorAll("a[href]").forEach((a) => { const h = abs(a.getAttribute("href"), base); h ? (a.setAttribute("href", h), a.setAttribute("target", "_blank"), a.setAttribute("rel", "noopener noreferrer")) : a.removeAttribute("href"); });
  root.querySelectorAll("img").forEach((i) => { const s = abs(i.getAttribute("src") || i.getAttribute("data-src") || "", base); if (!s) return i.remove(); i.setAttribute("src", s); i.setAttribute("loading", "lazy"); i.setAttribute("referrerpolicy", "no-referrer"); i.removeAttribute("srcset"); i.removeAttribute("width"); i.removeAttribute("height"); });
  return root.innerHTML;
}
// The full article from the site itself, for feeds that only send a teaser.
export async function fullArticle(url) {
  const r = await (await fetch("/api/browse?url=" + encodeURIComponent(url))).json();
  if (!r.html) throw new Error("That page couldn't be read.");
  const d = new DOMParser().parseFromString(r.html, "text/html");
  d.querySelectorAll("script,style,nav,header,footer,aside,form,[role=navigation],[class*=comment],[class*=share],[class*=related],[class*=newsletter],[class*=cookie],[id*=comment],[aria-hidden=true]").forEach((n) => n.remove());
  const cands = [...d.querySelectorAll("article, main, [role=main], [itemprop=articleBody], .post-content, .entry-content, .article-body, #content")];
  const best = cands.map((n) => [n, (n.textContent || "").length]).sort((a, b) => b[1] - a[1])[0]?.[0] || d.body;
  if ((best.textContent || "").trim().length < 400) throw new Error("There wasn't an article to pull out of that page.");
  return clean(best.innerHTML, r.url || url);
}

// ---------- OPML ----------
export function parseOpml(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml"), out = [];
  const walk = (n, folder) => { for (const o of n.children) { if (o.tagName !== "outline") continue; const x = o.getAttribute("xmlUrl") || o.getAttribute("xmlurl"); if (x) out.push({ url: x, title: o.getAttribute("title") || o.getAttribute("text") || "", site: o.getAttribute("htmlUrl") || "", folder }); else walk(o, o.getAttribute("text") || o.getAttribute("title") || folder); } };
  const body = doc.querySelector("body"); if (!body) throw new Error("That file isn't an OPML list.");
  walk(body, ""); return out;
}
export function toOpml(subs) {
  const e = (s) => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const line = (s) => `<outline type="rss" text="${e(s.title)}" title="${e(s.title)}" xmlUrl="${e(s.url)}" htmlUrl="${e(s.site)}"/>`;
  const folders = [...new Set(subs.map((s) => s.folder).filter(Boolean))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0"><head><title>Kitsune feeds</title></head><body>\n${folders.map((f) => `<outline text="${e(f)}" title="${e(f)}">\n${subs.filter((s) => s.folder === f).map(line).join("\n")}\n</outline>`).join("\n")}\n${subs.filter((s) => !s.folder).map(line).join("\n")}\n</body></opml>`;
}

export const STARTERS = [
  ["Standard Ebooks", "https://standardebooks.org/feeds/rss/new-releases", "Books"], ["Hacker News", "https://hnrss.org/frontpage", "Tech"], ["Ars Technica", "https://feeds.arstechnica.com/arstechnica/index", "Tech"],
  ["xkcd", "https://xkcd.com/atom.xml", "Comics"], ["NASA Breaking News", "https://www.nasa.gov/rss/dyn/breaking_news.rss", "Science"], ["Smithsonian Magazine", "https://www.smithsonianmag.com/rss/latest_articles/", "Science"],
  ["The Marginalian", "https://www.themarginalian.org/feed/", "Reading"], ["Public Domain Review", "https://publicdomainreview.org/rss.xml", "Reading"], ["Aeon", "https://aeon.co/feed.rss", "Reading"],
  ["Wikipedia: featured article", "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=featured&feedformat=atom", "Reading"], ["BBC World", "http://feeds.bbci.co.uk/news/world/rss.xml", "News"], ["NPR News", "https://feeds.npr.org/1001/rss.xml", "News"],
  ["Anime News Network", "https://www.animenewsnetwork.com/all/rss.xml", "Anime & manga"], ["Pepper&Carrot", "https://www.peppercarrot.com/en/rss/feed.xml", "Comics"], ["Quanta Magazine", "https://api.quantamagazine.org/feed/", "Science"],
  ["99% Invisible (podcast)", "https://feeds.simplecast.com/BqbsxVfO", "Podcasts"], ["Planet Money (podcast)", "https://feeds.npr.org/510289/podcast.xml", "Podcasts"], ["LibriVox new releases", "https://librivox.org/rss/latest_releases", "Audiobooks"],
];
