// Kitsune Browser, v115: adapters for AniList, IMDb, Substack, Tumblr, YouTube channels, Apple Podcasts and Google News.
// AniList's API only takes POST requests, so those go through the browser's request relay.
import { esc } from "./util.js";

const get = async (url) => { const r = await fetch("/api/browse?url=" + encodeURIComponent(url)); if (!r.ok) throw new Error(r.status); return r.json(); };
const json = async (url) => { const j = await get(url); if (!j.text || (j.status && j.status >= 400)) throw new Error("bad"); return JSON.parse(j.text); };
const when = (s) => { const d = new Date(typeof s === "number" ? s : s); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };
const CSS = `<style>body{font:17px/1.65 Georgia,serif;max-width:48rem;margin:0 auto;padding:20px 18px 60px}h1{font-size:1.5em;line-height:1.25}.meta{font:14px system-ui,sans-serif;opacity:.7;margin:.3em 0 1em}.tag{display:inline-block;font:12px system-ui,sans-serif;padding:2px 8px;margin:0 4px 4px 0;border:1px solid #8886;border-radius:99px}.card{padding:12px 0;border-bottom:1px solid #8884;display:flex;gap:12px}.card img{width:96px;height:auto;align-self:flex-start;border-radius:6px}img{max-width:100%;height:auto}.note{font:13px system-ui,sans-serif;opacity:.6;margin-top:36px}table{border-collapse:collapse;font:14px system-ui,sans-serif}td,th{padding:4px 10px;border-bottom:1px solid #8884;text-align:left}</style>`;
const doc = (title, body, note) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>${CSS}</head><body>${body}<p class="note">${esc(note)}</p></body></html>`;

async function gql(url, query, variables) {
  const h = btoa(JSON.stringify({ "content-type": "application/json", accept: "application/json" }));
  const r = await fetch("/api/browse/raw?url=" + encodeURIComponent(url), { method: "POST", headers: { "content-type": "application/json", "x-kb-req-headers": h }, body: JSON.stringify({ query, variables }) });
  if (!r.ok) throw new Error(r.status); const j = await r.json(); return j.data ?? JSON.parse(j.text || "{}").data;
}

export const adapters = [
  // ---- AniList anime and manga ----
  async (u) => {
    if (u.hostname !== "anilist.co") return null; const m = u.pathname.match(/^\/(anime|manga)\/(\d+)/); if (!m) return null;
    const d = await gql("https://graphql.anilist.co", `query($id:Int,$t:MediaType){Media(id:$id,type:$t){title{romaji english native}description(asHtml:true)format status season seasonYear startDate{year month day}episodes chapters volumes duration averageScore popularity genres tags{name rank isMediaSpoiler}coverImage{extraLarge large color}bannerImage studios(isMain:true){nodes{name}}staff(perPage:6,sort:RELEVANCE){edges{role node{name{full}}}}characters(perPage:10,sort:ROLE){edges{role node{name{full} image{medium}}}}relations{edges{relationType node{id type title{romaji} coverImage{medium}}}}recommendations(perPage:6,sort:RATING_DESC){nodes{mediaRecommendation{id type title{romaji}}}}externalLinks{site url}trailer{id site}}}`, { id: +m[2], t: m[1].toUpperCase() });
    const x = d?.Media; if (!x) return null; const t = x.title.english || x.title.romaji;
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc(x.title.romaji)}${x.title.native ? " · " + esc(x.title.native) : ""}<br>${esc(x.format || "")} · ${esc(x.status || "")} · ${x.seasonYear || x.startDate?.year || ""}${x.episodes ? " · " + x.episodes + " episodes" : ""}${x.chapters ? " · " + x.chapters + " chapters" : ""}${x.volumes ? " · " + x.volumes + " volumes" : ""}${x.averageScore ? " · " + x.averageScore + "% score" : ""}</div>${x.coverImage?.extraLarge ? `<p><img src="${esc(x.coverImage.extraLarge)}" alt="" style="max-height:340px"></p>` : ""}<p>${(x.genres || []).map((g) => `<span class="tag">${esc(g)}</span>`).join("")}</p>${x.description || ""}
      ${x.studios?.nodes?.length ? `<p><b>Studio:</b> ${x.studios.nodes.map((s) => esc(s.name)).join(", ")}</p>` : ""}${x.staff?.edges?.length ? `<p><b>Staff:</b> ${x.staff.edges.map((e) => `${esc(e.node.name.full)} (${esc(e.role)})`).join(", ")}</p>` : ""}
      ${x.characters?.edges?.length ? `<h2>Characters</h2>${x.characters.edges.map((e) => `<div class="card">${e.node.image?.medium ? `<img src="${esc(e.node.image.medium)}" alt="" style="width:56px">` : ""}<div><b>${esc(e.node.name.full)}</b><br><span class="meta">${esc(e.role)}</span></div></div>`).join("")}` : ""}
      ${x.relations?.edges?.length ? `<h2>Related</h2>${x.relations.edges.map((e) => `<p><a href="https://anilist.co/${e.node.type.toLowerCase()}/${e.node.id}">${esc(e.node.title.romaji)}</a> <span class="meta">${esc(e.relationType.replace(/_/g, " ").toLowerCase())}</span></p>`).join("")}` : ""}
      ${x.recommendations?.nodes?.length ? `<h2>If you liked this</h2>${x.recommendations.nodes.filter((n) => n.mediaRecommendation).map((n) => `<p><a href="https://anilist.co/${n.mediaRecommendation.type.toLowerCase()}/${n.mediaRecommendation.id}">${esc(n.mediaRecommendation.title.romaji)}</a></p>`).join("")}` : ""}
      ${x.trailer?.site === "youtube" ? `<p><a href="https://www.youtube.com/watch?v=${esc(x.trailer.id)}">Trailer</a></p>` : ""}${x.externalLinks?.length ? `<p>${x.externalLinks.slice(0, 12).map((l) => `<a class="tag" href="${esc(l.url)}">${esc(l.site)}</a>`).join("")}</p>` : ""}`;
    return { html: doc(t, body, "Shown from AniList's open GraphQL API."), url: u.href };
  },
  // ---- IMDb titles and people (through IMDb's suggestion data) ----
  async (u) => {
    if (u.hostname.replace(/^(www|m)\./, "") !== "imdb.com") return null; const m = u.pathname.match(/^\/(title|name)\/((?:tt|nm)\d+)/); if (!m) return null;
    const j = await json(`https://v2.sg.media-imdb.com/suggestion/${m[2][0]}/${m[2]}.json`), x = (j.d || []).find((e) => e.id === m[2]); if (!x) return null;
    const body = `<h1>${esc(x.l)}</h1><div class="meta">${esc(x.q || x.qid || "")}${x.y ? " · " + x.y : ""}${x.rank ? " · IMDb rank " + x.rank.toLocaleString() : ""}${x.s ? "<br>" + esc(x.s) : ""}</div>${x.i?.imageUrl ? `<p><img src="${esc(x.i.imageUrl)}" alt="" style="max-height:420px"></p>` : ""}${(x.v || []).slice(0, 4).map((v) => `<p><b>${esc(v.l)}</b> ${v.s ? esc(v.s) : ""}</p>`).join("")}<p><a href="https://www.imdb.com/${m[1]}/${m[2]}/fullcredits">Full credits</a> · <a href="https://www.imdb.com/${m[1]}/${m[2]}/reviews">Reviews</a></p>`;
    return { html: doc(x.l, body, "IMDb doesn't let apps read its pages, so this is the brief public listing data: title, year, rank and top cast. Open the page in your own browser for everything else."), url: u.href };
  },
  // ---- Substack posts ----
  async (u) => {
    const m = u.pathname.match(/^\/p\/([\w-]+)\/?$/); if (!m || !/(^|\.)substack\.com$/.test(u.hostname)) return null;
    const p = await json(`${u.origin}/api/v1/posts/${m[1]}`); if (!p.body_html) return null;
    const body = `<h1>${esc(p.title)}</h1>${p.subtitle ? `<p class="meta" style="font-size:16px">${esc(p.subtitle)}</p>` : ""}<div class="meta">${esc((p.publishedBylines || []).map((b) => b.name).join(", "))} · ${esc(when(p.post_date))}${p.reading_time_minutes ? ` · ${p.reading_time_minutes} min` : ""}${p.audience && p.audience !== "everyone" ? " · paid post (only the free part is shown)" : ""}</div>${p.cover_image ? `<p><img src="${esc(p.cover_image)}" alt=""></p>` : ""}${p.body_html}`;
    return { html: doc(p.title, body, "Shown from Substack's public post data."), url: u.href };
  },
  // ---- Tumblr blogs, through their RSS ----
  async (u) => {
    const sub = u.hostname.match(/^([\w-]+)\.tumblr\.com$/)?.[1]; if (!sub || sub === "www" || sub === "api") return null;
    const F = await import("./feedlib.js"), f = await F.loadFeed(`https://${sub}.tumblr.com/rss`);
    const body = `<h1>${esc(f.title || sub)}</h1>${f.items.slice(0, 30).map((i) => `<div style="padding:14px 0;border-bottom:1px solid #8884"><div class="meta">${esc(i.title)} · <a href="${esc(i.link)}">${esc(when(i.date))}</a></div>${F.clean(i.html, i.link)}</div>`).join("")}`;
    return { html: doc(f.title || sub, body, "Shown from the blog's public RSS feed."), url: u.href };
  },
  // ---- YouTube channels: recent videos from the channel's own feed ----
  async (u) => {
    if (!/(^|\.)youtube\.com$/.test(u.hostname) || !/^\/(@[\w.-]+|channel\/UC[\w-]+|c\/[\w.-]+|user\/[\w.-]+)\/?(videos)?$/.test(u.pathname)) return null;
    let id = u.pathname.match(/\/channel\/(UC[\w-]+)/)?.[1];
    if (!id) { const j = await get(u.origin + u.pathname); id = (j.html || "").match(/"(?:channelId|externalId|browseId)":"(UC[\w-]{20,})"/)?.[1] || (j.html || "").match(/channel_id=(UC[\w-]{20,})/)?.[1]; }
    if (!id) return null;
    const F = await import("./feedlib.js"), f = await F.loadFeed(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
    const body = `<h1>${esc(f.title)}</h1><div class="meta">Latest videos · <a href="https://www.youtube.com/channel/${esc(id)}">channel</a></div>${f.items.map((i) => { const vid = (i.link.match(/v=([\w-]{6,})/) || [])[1]; return `<div class="card">${vid ? `<img src="https://i.ytimg.com/vi/${esc(vid)}/mqdefault.jpg" alt="" style="width:160px">` : ""}<div><a href="${esc(i.link)}"><b>${esc(i.title)}</b></a><div class="meta">${esc(when(i.date))}</div></div></div>`; }).join("")}`;
    return { html: doc(f.title, body, "Shown from the channel's public video feed."), url: u.href };
  },
  // ---- Apple Podcasts shows ----
  async (u) => {
    if (u.hostname !== "podcasts.apple.com") return null; const id = u.pathname.match(/\/id(\d+)/)?.[1]; if (!id) return null;
    const r = (await json(`https://itunes.apple.com/lookup?id=${id}&entity=podcast`)).results?.[0]; if (!r?.feedUrl) return null;
    const F = await import("./feedlib.js"), f = await F.loadFeed(r.feedUrl);
    const body = `<h1>${esc(r.collectionName)}</h1><div class="meta">${esc(r.artistName)} · ${esc((r.genres || []).join(", "))}</div>${r.artworkUrl600 ? `<p><img src="${esc(r.artworkUrl600)}" alt="" style="width:160px;border-radius:12px"></p>` : ""}<p><a href="#feeds/add/${encodeURIComponent(r.feedUrl)}">Follow in Feeds</a> · <a href="${esc(r.feedUrl)}">feed address</a></p>${f.items.slice(0, 40).map((i) => `<div style="padding:12px 0;border-bottom:1px solid #8884"><b>${esc(i.title)}</b><div class="meta">${esc(when(i.date))}</div>${i.media?.url ? `<audio controls preload="none" src="${esc(i.media.url)}" style="width:100%"></audio>` : ""}<div>${F.clean((i.html || "").slice(0, 1200), i.link || "")}</div></div>`).join("")}`;
    return { html: doc(r.collectionName, body, "Shown from the show's own public feed, found through Apple's lookup."), url: u.href };
  },
  // ---- Google News headlines ----
  async (u) => {
    if (u.hostname !== "news.google.com" || !/^\/(home|topics\/.*|foryou|$)/.test(u.pathname)) return null;
    const F = await import("./feedlib.js"), lang = u.searchParams.get("hl") || "en-US", gl = u.searchParams.get("gl") || lang.split("-")[1] || "US", ceid = u.searchParams.get("ceid") || `${gl}:${lang.split("-")[0]}`;
    const topic = u.pathname.match(/^\/topics\/([\w-]+)/)?.[1], f = await F.loadFeed(`https://news.google.com/rss${topic ? "/topics/" + topic : ""}?hl=${lang}&gl=${gl}&ceid=${ceid}`);
    const body = `<h1>${esc(f.title || "Google News")}</h1>${f.items.slice(0, 50).map((i) => `<div style="padding:10px 0;border-bottom:1px solid #8884"><a href="${esc(i.link)}"><b>${esc(i.title.replace(/ - [^-]+$/, ""))}</b></a><div class="meta">${esc(i.title.match(/ - ([^-]+)$/)?.[1] || "")} · ${esc(when(i.date))}</div></div>`).join("")}`;
    return { html: doc(f.title || "Google News", body, "Headlines from Google News' public feed. Links go through Google's redirect."), url: u.href };
  },
];
