// Kitsune Browser, v140: the biggest set of site adapters yet. Each one reads the site's own open, public API
// (the same data the site's app uses, with no sign-in) and lays it out as a clean page, for sites whose pages are
// built entirely in JavaScript or don't let apps read them.
// Manga and anime: MangaUpdates, Bangumi, Shikimori, pixiv (artworks, novels, artists).
// Social and writing: Lemmy, Misskey, Telegraph. Video and music: PeerTube, Dailymotion, Deezer, Mixcloud, Apple Music.
// Research: bioRxiv and medRxiv, ORCID, Zenodo. Code: crates.io, Bitbucket. Games and hobbies: Lichess, Chess.com,
// Scratch, Discogs. Reference: Sefaria, OpenStreetMap, Pinterest pins.
import { esc } from "./util.js";

const get = async (url) => { const r = await fetch("/api/browse?url=" + encodeURIComponent(url)); if (!r.ok) throw new Error(r.status); return r.json(); };
const json = async (url) => { const j = await get(url); if (!j.text || (j.status && j.status >= 400)) throw new Error("bad"); return JSON.parse(j.text); };
const text = async (url) => { const j = await get(url); if (j.status && j.status >= 400) throw new Error("bad"); return j.text || j.html || ""; };
const xml = async (url) => new DOMParser().parseFromString(await text(url), "application/xml");
async function post(url, body) {
  const h = btoa(JSON.stringify({ "content-type": "application/json", accept: "application/json" }));
  const r = await fetch("/api/browse/raw?url=" + encodeURIComponent(url), { method: "POST", headers: { "content-type": "application/json", "x-kb-req-headers": h }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status); const j = await r.json(); return j && typeof j.text === "string" && "ctype" in j && "url" in j ? JSON.parse(j.text) : j; // the relay hands back the body itself, or (for some replies) wrapped
}
const when = (s) => { if (s == null || s === "") return ""; const d = new Date(typeof s === "number" && s < 1e12 ? s * 1000 : s); return isNaN(d) ? String(s) : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };
const num = (n) => (n == null ? "" : Number(n).toLocaleString());
const dur = (s) => { s = Math.round(+s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
const para = (s) => esc(s || "").split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
const tags = (list) => (list || []).filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
const proxImg = (src, ref) => location.origin + "/api/browse/img?url=" + encodeURIComponent(src) + (ref ? "&ref=" + encodeURIComponent(ref) : "");
const CSS = `<style>body{font:17px/1.65 Georgia,serif;max-width:48rem;margin:0 auto;padding:20px 18px 60px}h1{font-size:1.5em;line-height:1.25}.meta{font:14px system-ui,sans-serif;opacity:.7;margin:.3em 0 1em}.tag{display:inline-block;font:12px system-ui,sans-serif;padding:2px 8px;margin:0 4px 4px 0;border:1px solid #8886;border-radius:99px}.card{padding:12px 0;border-bottom:1px solid #8884;display:flex;gap:12px}.card img{width:80px;height:auto;align-self:flex-start;border-radius:6px}.cmt{margin:10px 0 10px 0;padding-left:12px;border-left:2px solid #8885}img{max-width:100%;height:auto}.note{font:13px system-ui,sans-serif;opacity:.6;margin-top:36px}table{border-collapse:collapse;font:14px system-ui,sans-serif}td,th{padding:4px 10px;border-bottom:1px solid #8884;text-align:left;vertical-align:top}pre{overflow:auto;padding:10px;background:#8881;border-radius:6px;white-space:pre-wrap}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.grid a{font:13px system-ui,sans-serif;text-decoration:none}.he{direction:rtl;font-size:1.15em}</style>`;
const doc = (title, body, note) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>${CSS}</head><body>${body}<p class="note">${esc(note)}</p></body></html>`;
const out = (u, title, body, note) => ({ html: doc(title, body, note), url: u.href });
const host = (u) => u.hostname.replace(/^(www|m|mobile)\./, "");

const LEMMY = /^(lemmy\.(world|ml|ca|zip|today|blahaj\.zone|dbzer0\.com|sdf\.org|one|eco\.br|nz)|sh\.itjust\.works|programming\.dev|feddit\.(de|org|nl|uk|it|dk)|lemm\.ee|beehaw\.org|sopuli\.xyz|discuss\.tchncs\.de|lemmy\.[a-z0-9.-]+|slrpnk\.net|aussie\.zone|midwest\.social|startrek\.website|infosec\.pub|reddthat\.com|hexbear\.net|lemmygrad\.ml|ttrpg\.network|jlai\.lu|szmer\.info)$/;
const PEERTUBE = /^(framatube\.org|tilvids\.com|peertube\.[a-z0-9.-]+|[a-z0-9-]*tube\.[a-z0-9.-]+|video\.[a-z0-9.-]+|videos\.[a-z0-9.-]+|diode\.zone|kolektiva\.media|spectra\.video|makertube\.net|fedi\.video|tube\.tchncs\.de)$/;
const MISSKEY = /^(misskey\.(io|design|art|cloud|social|backspace\.fm|gg)|[a-z0-9-]+\.misskey\.[a-z.]+|sharkey\.[a-z0-9.-]+|calckey\.[a-z0-9.-]+|firefish\.[a-z0-9.-]+|misskey\.[a-z0-9.-]+)$/;

export const adapters = [
  // ---- MangaUpdates series (www.mangaupdates.com/series/<base-36 id>/<slug>) ----
  async (u) => {
    if (host(u) !== "mangaupdates.com") return null; const m = u.pathname.match(/^\/series\/([a-z0-9]+)/i); if (!m) return null;
    const id = /^\d{9,}$/.test(m[1]) ? m[1] : parseInt(m[1], 36); const x = await json(`https://api.mangaupdates.com/v1/series/${id}`); if (!x?.title) return null;
    const body = `<h1>${esc(x.title)}</h1><div class="meta">${esc(x.type || "")} · ${esc(x.year || "")}${x.status ? " · " + esc(x.status.replace(/\n/g, " ")) : ""}${x.bayesian_rating ? ` · rated ${x.bayesian_rating} by ${num(x.rating_votes)} readers` : ""}${x.completed ? " · complete" : ""}${x.licensed ? " · licensed in English" : ""}</div>
      ${x.image?.url?.original ? `<p><img src="${esc(x.image.url.original)}" alt="" style="max-height:360px"></p>` : ""}<p>${tags((x.genres || []).map((g) => g.genre))}</p>${x.description ? `<div>${x.description}</div>` : ""}
      ${x.associated?.length ? `<p><b>Also known as:</b> ${x.associated.slice(0, 10).map((a) => esc(a.title)).join(" · ")}</p>` : ""}
      ${x.authors?.length ? `<p><b>Story and art:</b> ${x.authors.map((a) => `${esc(a.name)} <span class="meta">(${esc(a.type)})</span>`).join(", ")}</p>` : ""}
      ${x.publishers?.length ? `<p><b>Publishers:</b> ${x.publishers.map((p) => `${esc(p.publisher_name)} <span class="meta">(${esc(p.type)})</span>`).join(", ")}</p>` : ""}
      ${x.publications?.length ? `<p><b>Serialised in:</b> ${x.publications.map((p) => esc(p.publication_name)).join(", ")}</p>` : ""}
      ${x.latest_chapter ? `<p><b>Latest chapter:</b> ${esc(x.latest_chapter)}</p>` : ""}
      ${x.categories?.length ? `<h2>Tags</h2><p>${tags(x.categories.sort((a, b) => b.votes - a.votes).slice(0, 30).map((c) => c.category))}</p>` : ""}
      ${x.recommendations?.length ? `<h2>Readers also like</h2>${x.recommendations.slice(0, 10).map((r) => `<p><a href="https://www.mangaupdates.com/series/${Number(r.series_id).toString(36)}">${esc(r.series_name)}</a></p>`).join("")}` : ""}
      ${x.anime?.start ? `<p><b>Anime:</b> ${esc(x.anime.start)} ${esc(x.anime.end || "")}</p>` : ""}`;
    return out(u, x.title, body, "Shown from MangaUpdates' open API.");
  },
  // ---- Bangumi subjects (bgm.tv / bangumi.tv / chii.in) ----
  async (u) => {
    if (!/^(bgm\.tv|bangumi\.tv|chii\.in)$/.test(host(u))) return null; const m = u.pathname.match(/^\/subject\/(\d+)\/?$/); if (!m) return null;
    const x = await json(`https://api.bgm.tv/v0/subjects/${m[1]}`); if (!x?.name) return null;
    const chars = await json(`https://api.bgm.tv/v0/subjects/${m[1]}/characters`).catch(() => []);
    const t = x.name_cn || x.name, TYPE = { 1: "Book", 2: "Anime", 3: "Music", 4: "Game", 6: "Live action" };
    const body = `<h1>${esc(t)}</h1><div class="meta">${x.name_cn ? esc(x.name) + " · " : ""}${TYPE[x.type] || ""} · ${esc(x.platform || "")} · ${esc(x.date || "")}${x.rating?.score ? ` · ${x.rating.score}/10 from ${num(x.rating.total)} ratings${x.rating.rank ? ", rank " + x.rating.rank : ""}` : ""}${x.eps ? " · " + x.eps + " episodes" : ""}${x.volumes ? " · " + x.volumes + " volumes" : ""}</div>
      ${x.images?.large ? `<p><img src="${esc(x.images.large)}" alt="" style="max-height:380px"></p>` : ""}<p>${tags((x.tags || []).slice(0, 16).map((g) => g.name))}</p>${para(x.summary)}
      ${x.infobox?.length ? `<table>${x.infobox.slice(0, 24).map((r) => `<tr><th>${esc(r.key)}</th><td>${esc(Array.isArray(r.value) ? r.value.map((v) => v.v || v).join(", ") : r.value)}</td></tr>`).join("")}</table>` : ""}
      ${Array.isArray(chars) && chars.length ? `<h2>Characters</h2>${chars.slice(0, 14).map((c) => `<div class="card">${c.images?.grid ? `<img src="${esc(c.images.grid)}" alt="" style="width:48px">` : ""}<div><b>${esc(c.name)}</b><br><span class="meta">${esc(c.relation || "")}${c.actors?.length ? " · " + c.actors.map((a) => esc(a.name)).join(", ") : ""}</span></div></div>`).join("")}` : ""}`;
    return out(u, t, body, "Shown from Bangumi's open API.");
  },
  // ---- Shikimori anime, manga and light novels ----
  async (u) => {
    if (!/^shikimori\.(one|me|org|io)$/.test(host(u))) return null; const m = u.pathname.match(/^\/(animes|mangas|ranobe)\/[a-z]*(\d+)/); if (!m) return null;
    const base = `https://shikimori.one/api/${m[1]}/${m[2]}`, x = await json(base); if (!x?.name) return null;
    const t = x.english?.[0] || x.name, img = x.image?.original ? "https://shikimori.one" + x.image.original : "";
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc([x.russian, x.japanese?.[0]].filter(Boolean).join(" · "))}<br>${esc(x.kind || "")} · ${esc(x.status || "")} · ${esc(x.aired_on || "")}${x.episodes ? " · " + x.episodes + " episodes" : ""}${x.volumes ? " · " + x.volumes + " volumes" : ""}${x.chapters ? " · " + x.chapters + " chapters" : ""}${x.score && x.score !== "0.0" ? " · " + x.score + "/10" : ""}</div>
      ${img ? `<p><img src="${esc(img)}" alt="" style="max-height:360px"></p>` : ""}<p>${tags((x.genres || []).map((g) => g.name))}</p>${x.description_html || para(x.description)}
      ${x.studios?.length ? `<p><b>Studio:</b> ${x.studios.map((s) => esc(s.name)).join(", ")}</p>` : ""}${x.publishers?.length ? `<p><b>Publisher:</b> ${x.publishers.map((s) => esc(s.name)).join(", ")}</p>` : ""}
      ${x.videos?.length ? `<h2>Videos</h2>${x.videos.slice(0, 6).map((v) => `<p><a href="${esc(v.url)}">${esc(v.name || v.kind)}</a></p>`).join("")}` : ""}`;
    return out(u, t, body, "Shown from Shikimori's open API.");
  },
  // ---- pixiv artworks: every page of the work, through the image relay (pixiv's pictures need a pixiv referrer) ----
  async (u) => {
    if (host(u) !== "pixiv.net") return null; const m = u.pathname.match(/^(?:\/[a-z]{2})?\/artworks\/(\d+)/); if (!m) return null;
    const j = await json(`https://www.pixiv.net/ajax/illust/${m[1]}`), x = j?.body; if (!x || j.error) return null;
    if (x.xRestrict) return out(u, x.title || "pixiv", `<h1>${esc(x.title)}</h1><p>This work is marked for adults only, so it can only be viewed on pixiv itself, signed in.</p>`, "pixiv");
    const pages = x.pageCount > 1 ? ((await json(`https://www.pixiv.net/ajax/illust/${m[1]}/pages`).catch(() => null))?.body || []).map((p) => p.urls.regular || p.urls.original) : [x.urls?.regular || x.urls?.original];
    const body = `<h1>${esc(x.title)}</h1><div class="meta"><a href="https://www.pixiv.net/users/${esc(x.userId)}">${esc(x.userName)}</a> · ${esc(when(x.createDate))} · ${num(x.viewCount)} views · ${num(x.likeCount)} likes · ${num(x.bookmarkCount)} bookmarks${x.pageCount > 1 ? " · " + x.pageCount + " pages" : ""}</div>
      <p>${tags((x.tags?.tags || []).map((t) => t.translation?.en ? `${t.tag} (${t.translation.en})` : t.tag))}</p>${x.description ? `<div>${x.description}</div>` : ""}
      ${pages.filter(Boolean).map((s, k) => `<p><img src="${esc(proxImg(s, "https://www.pixiv.net/"))}" alt="Page ${k + 1}" loading="lazy"></p>`).join("")}`;
    return out(u, x.title, body, "Shown from pixiv's public work data. Pictures are relayed because pixiv only shows them to its own pages.");
  },
  // ---- pixiv novels: the whole text, chapter breaks and all ----
  async (u) => {
    if (host(u) !== "pixiv.net") return null; const id = u.pathname === "/novel/show.php" ? u.searchParams.get("id") : (u.pathname.match(/^(?:\/[a-z]{2})?\/novel\/(\d+)/) || [])[1]; if (!id || !/^\d+$/.test(id)) return null;
    const j = await json(`https://www.pixiv.net/ajax/novel/${id}`), x = j?.body; if (!x || j.error) return null;
    if (x.xRestrict) return out(u, x.title || "pixiv", `<h1>${esc(x.title)}</h1><p>This story is marked for adults only, so it can only be read on pixiv itself, signed in.</p>`, "pixiv");
    const html = esc(x.content || "").replace(/\[newpage\]/g, "<hr>").replace(/\[chapter:([^\]]*)\]/g, "<h2>$1</h2>").replace(/\[\[rb:([^>]+?) &gt; ([^\]]+?)\]\]/g, "<ruby>$1<rt>$2</rt></ruby>").replace(/\[\[jumpuri:([^>]+?) &gt; (https?:[^\]]+?)\]\]/g, '<a href="$2">$1</a>').replace(/\[pixivimage:[^\]]+\]/g, "").replace(/\[jump:(\d+)\]/g, "").split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
    const body = `<h1>${esc(x.title)}</h1><div class="meta"><a href="https://www.pixiv.net/users/${esc(x.userId)}">${esc(x.userName)}</a> · ${esc(when(x.createDate))} · ${num(x.characterCount || (x.content || "").length)} characters${x.seriesNavData ? ` · <a href="https://www.pixiv.net/novel/series/${esc(x.seriesNavData.seriesId)}">${esc(x.seriesNavData.title)}</a> #${x.seriesNavData.order}` : ""}</div>
      <p>${tags((x.tags?.tags || []).map((t) => t.tag))}</p>${x.description ? `<blockquote>${x.description}</blockquote>` : ""}<hr>${html}
      ${x.seriesNavData ? `<hr><p>${x.seriesNavData.prev ? `<a href="https://www.pixiv.net/novel/show.php?id=${esc(x.seriesNavData.prev.id)}">‹ ${esc(x.seriesNavData.prev.title)}</a>` : ""}${x.seriesNavData.next ? ` · <a href="https://www.pixiv.net/novel/show.php?id=${esc(x.seriesNavData.next.id)}">${esc(x.seriesNavData.next.title)} ›</a>` : ""}</p>` : ""}`;
    return out(u, x.title, body, "Shown from pixiv's public story data.");
  },
  // ---- pixiv artists ----
  async (u) => {
    if (host(u) !== "pixiv.net") return null; const m = u.pathname.match(/^(?:\/[a-z]{2})?\/users\/(\d+)\/?(artworks|illustrations|manga|novels)?\/?$/); if (!m) return null;
    const [p, top] = await Promise.all([json(`https://www.pixiv.net/ajax/user/${m[1]}?full=1`), json(`https://www.pixiv.net/ajax/user/${m[1]}/profile/top`).catch(() => null)]); const x = p?.body; if (!x) return null;
    const works = Object.values({ ...(top?.body?.illusts || {}), ...(top?.body?.manga || {}) }).filter((w) => !w.xRestrict).sort((a, b) => b.id - a.id).slice(0, 24);
    const novels = Object.values(top?.body?.novels || {}).filter((w) => !w.xRestrict).slice(0, 12);
    const body = `<h1>${esc(x.name)}</h1><div class="meta">${esc(x.region?.name || "")}${x.webpage ? ` · <a href="${esc(x.webpage)}">${esc(x.webpage)}</a>` : ""}</div>${x.imageBig ? `<p><img src="${esc(proxImg(x.imageBig, "https://www.pixiv.net/"))}" alt="" style="width:120px;border-radius:50%"></p>` : ""}${para(x.comment)}
      ${works.length ? `<h2>Recent works</h2><div class="grid">${works.map((w) => `<a href="https://www.pixiv.net/artworks/${esc(w.id)}"><img src="${esc(proxImg(w.url, "https://www.pixiv.net/"))}" alt="" loading="lazy" style="aspect-ratio:1;object-fit:cover;width:100%;border-radius:6px"><br>${esc(w.title)}</a>`).join("")}</div>` : ""}
      ${novels.length ? `<h2>Novels</h2>${novels.map((w) => `<p><a href="https://www.pixiv.net/novel/show.php?id=${esc(w.id)}">${esc(w.title)}</a> <span class="meta">${num(w.textCount)} characters</span></p>`).join("")}` : ""}`;
    return out(u, x.name, body, "Shown from pixiv's public profile data. Works for adults aren't shown.");
  },
  // ---- Telegraph articles (telegra.ph) ----
  async (u) => {
    if (!/^(telegra\.ph|graph\.org)$/.test(u.hostname)) return null; const path = u.pathname.slice(1); if (!path || path.includes("/")) return null;
    const j = await json(`https://api.telegra.ph/getPage/${encodeURIComponent(path)}?return_content=true`); if (!j.ok) return null; const x = j.result;
    const node = (n) => { if (typeof n === "string") return esc(n); const t = n.tag; if (!/^(a|aside|b|blockquote|br|code|em|figcaption|figure|h3|h4|hr|i|iframe|img|li|ol|p|pre|s|strong|u|ul|video)$/.test(t)) return (n.children || []).map(node).join(""); const a = n.attrs || {}; let src = a.src || ""; if (src.startsWith("/")) src = "https://telegra.ph" + src; const at = t === "a" ? ` href="${esc(a.href || "")}"` : t === "img" || t === "video" ? ` src="${esc(src)}"${t === "video" ? " controls" : ""}` : t === "iframe" ? ` src="${esc(src)}" width="560" height="315"` : ""; return /^(br|hr|img)$/.test(t) ? `<${t}${at}>` : `<${t}${at}>${(n.children || []).map(node).join("")}</${t}>`; };
    const body = `<h1>${esc(x.title)}</h1><div class="meta">${x.author_url ? `<a href="${esc(x.author_url)}">${esc(x.author_name || "")}</a>` : esc(x.author_name || "")}${x.views ? " · " + num(x.views) + " views" : ""}</div>${(x.content || []).map(node).join("")}`;
    return out(u, x.title, body, "Shown from Telegraph's open API.");
  },
  // ---- Lemmy posts and communities (the federated link aggregator) ----
  async (u) => {
    if (!LEMMY.test(u.hostname)) return null; const m = u.pathname.match(/^\/post\/(\d+)/), c = u.pathname.match(/^\/c\/([\w.@-]+)\/?$/); if (!m && !c) return null;
    const api = `https://${u.hostname}/api/v3`;
    const md = (s) => para(s).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    if (c) {
      const [ci, posts] = await Promise.all([json(`${api}/community?name=${encodeURIComponent(c[1])}`), json(`${api}/post/list?community_name=${encodeURIComponent(c[1])}&sort=Hot&limit=30`)]); const k = ci.community_view.community;
      const body = `<h1>${esc(k.title)}</h1><div class="meta">!${esc(k.name)} · ${num(ci.community_view.counts?.subscribers)} subscribers</div>${md(k.description)}<h2>Hot</h2>${(posts.posts || []).map((p) => `<div class="card"><div><b><a href="https://${u.hostname}/post/${p.post.id}">${esc(p.post.name)}</a></b><br><span class="meta">${num(p.counts.score)} points · ${num(p.counts.comments)} comments · ${esc(p.creator.name)} · ${esc(when(p.post.published))}</span></div></div>`).join("")}`;
      return out(u, k.title, body, "Shown from this Lemmy server's open API.");
    }
    const [pv, cl] = await Promise.all([json(`${api}/post?id=${m[1]}`), json(`${api}/comment/list?post_id=${m[1]}&sort=Top&limit=150&max_depth=6&type_=All`).catch(() => ({ comments: [] }))]);
    const p = pv.post_view, kids = {}; for (const x of cl.comments || []) { const path = x.comment.path.split("."); const parent = path.length > 2 ? path.at(-2) : "0"; (kids[parent] ||= []).push(x); }
    const tree = (id, d) => (kids[id] || []).map((x) => `<div class="cmt"><div class="meta">${esc(x.creator.name)} · ${num(x.counts.score)} points · ${esc(when(x.comment.published))}</div>${md(x.comment.content)}${d < 6 ? tree(String(x.comment.id), d + 1) : ""}</div>`).join("");
    const isImg = /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(p.post.url || "");
    const body = `<h1>${esc(p.post.name)}</h1><div class="meta">!${esc(p.community.name)} · ${esc(p.creator.name)} · ${esc(when(p.post.published))} · ${num(p.counts.score)} points · ${num(p.counts.comments)} comments</div>${p.post.url ? isImg ? `<p><img src="${esc(p.post.url)}" alt=""></p>` : `<p><a href="${esc(p.post.url)}">${esc(p.post.url)}</a></p>` : ""}${md(p.post.body)}<h2>Comments</h2>${tree("0", 0) || "<p>No comments yet.</p>"}`;
    return out(u, p.post.name, body, "Shown from this Lemmy server's open API.");
  },
  // ---- Misskey and its forks (notes) ----
  async (u) => {
    if (!MISSKEY.test(u.hostname)) return null; const m = u.pathname.match(/^\/notes\/([a-z0-9]+)/i); if (!m) return null;
    const x = await post(`https://${u.hostname}/api/notes/show`, { noteId: m[1] }); if (!x?.id) return null;
    const replies = await post(`https://${u.hostname}/api/notes/children`, { noteId: m[1], limit: 40 }).catch(() => []);
    const one = (n) => `<div class="meta">${esc(n.user?.name || n.user?.username || "")} @${esc(n.user?.username || "")} · ${esc(when(n.createdAt))}</div>${n.cw ? `<p><b>Content warning:</b> ${esc(n.cw)}</p>` : ""}${para(n.text)}${(n.files || []).map((f) => /^image\//.test(f.type) && !f.isSensitive ? `<p><img src="${esc(f.url)}" alt="${esc(f.comment || "")}"></p>` : `<p><a href="${esc(f.url)}">${esc(f.name)}</a></p>`).join("")}${n.renote ? `<blockquote>${one(n.renote)}</blockquote>` : ""}`;
    const body = `<h1>Note by ${esc(x.user?.name || x.user?.username)}</h1>${one(x)}<p class="meta">${num(x.renoteCount)} renotes · ${num(x.repliesCount)} replies · ${num(Object.values(x.reactions || {}).reduce((a, b) => a + b, 0))} reactions</p>${Array.isArray(replies) && replies.length ? `<h2>Replies</h2>${replies.map((r) => `<div class="cmt">${one(r)}</div>`).join("")}` : ""}`;
    return out(u, `Note by ${x.user?.username}`, body, "Shown from this Misskey server's open API.");
  },
  // ---- PeerTube videos (the federated video platform) ----
  async (u) => {
    if (!PEERTUBE.test(u.hostname)) return null; const m = u.pathname.match(/^\/(?:w|videos\/watch)\/([\w-]{8,})/); if (!m) return null;
    const x = await json(`https://${u.hostname}/api/v1/videos/${m[1]}`); if (!x?.uuid) return null;
    const body = `<h1>${esc(x.name)}</h1><div class="meta">${esc(x.channel?.displayName || "")} · ${esc(when(x.publishedAt))} · ${dur(x.duration)} · ${num(x.views)} views · ${num(x.likes)} likes</div><iframe src="https://${esc(u.hostname)}/videos/embed/${esc(x.uuid)}" title="${esc(x.name)}" width="560" height="315" allowfullscreen></iframe><p>${tags(x.tags)}</p>${para(x.description)}`;
    return out(u, x.name, body, "Shown from this PeerTube server's open API.");
  },
  // ---- Dailymotion videos ----
  async (u) => {
    const id = host(u) === "dailymotion.com" ? (u.pathname.match(/^\/video\/([a-z0-9]+)/i) || [])[1] : u.hostname === "dai.ly" ? u.pathname.slice(1) : null; if (!id) return null;
    const x = await json(`https://api.dailymotion.com/video/${id}?fields=title,description,thumbnail_720_url,owner.screenname,created_time,duration,views_total,tags,channel.name`); if (!x?.title) return null;
    const body = `<h1>${esc(x.title)}</h1><div class="meta">${esc(x["owner.screenname"] || "")} · ${esc(when(x.created_time))} · ${dur(x.duration)} · ${num(x.views_total)} views</div><iframe src="https://geo.dailymotion.com/player.html?video=${esc(id)}" title="${esc(x.title)}" width="560" height="315" allowfullscreen></iframe><p>${tags(x.tags)}</p>${para(x.description)}`;
    return out(u, x.title, body, "Shown from Dailymotion's open API.");
  },
  // ---- Deezer tracks, albums, artists and playlists, with 30-second previews ----
  async (u) => {
    if (host(u) !== "deezer.com") return null; const m = u.pathname.match(/^(?:\/[a-z]{2})?\/(track|album|artist|playlist)\/(\d+)/); if (!m) return null;
    const x = await json(`https://api.deezer.com/${m[1]}/${m[2]}`); if (!x || x.error) return null;
    const row = (t, k) => `<div class="card"><div style="flex:1"><b>${k != null ? k + ". " : ""}${esc(t.title)}</b> <span class="meta">${esc(t.artist?.name || "")} · ${dur(t.duration)}</span>${t.preview ? `<br><audio controls preload="none" src="${esc(t.preview)}"></audio>` : ""}</div></div>`;
    let body;
    if (m[1] === "track") body = `<h1>${esc(x.title)}</h1><div class="meta">${esc(x.artist?.name)} · ${esc(x.album?.title)} · ${esc(x.release_date)} · ${dur(x.duration)}${x.bpm ? " · " + x.bpm + " bpm" : ""}</div>${x.album?.cover_xl ? `<p><img src="${esc(x.album.cover_xl)}" alt="" style="max-height:320px"></p>` : ""}${x.preview ? `<p><audio controls src="${esc(x.preview)}"></audio></p>` : ""}${x.contributors?.length ? `<p><b>With:</b> ${x.contributors.map((c) => esc(c.name)).join(", ")}</p>` : ""}`;
    else if (m[1] === "artist") { const top = await json(`https://api.deezer.com/artist/${m[2]}/top?limit=15`).catch(() => ({ data: [] })), al = await json(`https://api.deezer.com/artist/${m[2]}/albums?limit=40`).catch(() => ({ data: [] })); body = `<h1>${esc(x.name)}</h1><div class="meta">${num(x.nb_fan)} fans · ${num(x.nb_album)} albums</div>${x.picture_xl ? `<p><img src="${esc(x.picture_xl)}" alt="" style="max-height:300px"></p>` : ""}<h2>Top tracks</h2>${top.data.map((t, k) => row(t, k + 1)).join("")}<h2>Albums</h2><div class="grid">${al.data.map((a) => `<a href="https://www.deezer.com/album/${a.id}"><img src="${esc(a.cover_medium)}" alt="" loading="lazy"><br>${esc(a.title)} <span class="meta">${esc((a.release_date || "").slice(0, 4))}</span></a>`).join("")}</div>`; }
    else body = `<h1>${esc(x.title)}</h1><div class="meta">${esc(x.artist?.name || x.creator?.name || "")}${x.release_date ? " · " + esc(x.release_date) : ""} · ${num(x.nb_tracks)} tracks · ${dur(x.duration)}${x.label ? " · " + esc(x.label) : ""}</div>${x.cover_xl || x.picture_xl ? `<p><img src="${esc(x.cover_xl || x.picture_xl)}" alt="" style="max-height:320px"></p>` : ""}${x.description ? para(x.description) : ""}${(x.tracks?.data || []).map((t, k) => row(t, k + 1)).join("")}`;
    return out(u, x.title || x.name, body, "Shown from Deezer's open API. Previews are 30 seconds; open Deezer for full tracks.");
  },
  // ---- Mixcloud shows and profiles ----
  async (u) => {
    if (host(u) !== "mixcloud.com") return null; const parts = u.pathname.split("/").filter(Boolean); if (!parts.length || parts.length > 2 || /^(discover|upload|dashboard|settings|select|live)$/.test(parts[0])) return null;
    const x = await json(`https://api.mixcloud.com/${parts.map(encodeURIComponent).join("/")}/`); if (!x?.key) return null;
    if (parts.length === 2) { const body = `<h1>${esc(x.name)}</h1><div class="meta">${esc(x.user?.name || "")} · ${esc(when(x.created_time))} · ${dur(x.audio_length)} · ${num(x.play_count)} plays</div>${x.pictures?.extra_large ? `<p><img src="${esc(x.pictures.extra_large)}" alt="" style="max-height:300px"></p>` : ""}<iframe src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(x.key)}" title="${esc(x.name)}" width="100%" height="120"></iframe><p>${tags((x.tags || []).map((t) => t.name))}</p>${para(x.description)}${x.sections?.length ? `<h2>Tracklist</h2><ol>${x.sections.map((s) => `<li>${esc(s.track?.name || "")} <span class="meta">${esc(s.track?.artist?.name || "")}</span></li>`).join("")}</ol>` : ""}`; return out(u, x.name, body, "Shown from Mixcloud's open API."); }
    const cl = await json(`https://api.mixcloud.com/${encodeURIComponent(parts[0])}/cloudcasts/?limit=30`).catch(() => ({ data: [] }));
    const body = `<h1>${esc(x.name)}</h1><div class="meta">${esc([x.city, x.country].filter(Boolean).join(", "))} · ${num(x.follower_count)} followers · ${num(x.cloudcast_count)} shows</div>${x.pictures?.large ? `<p><img src="${esc(x.pictures.large)}" alt="" style="width:120px;border-radius:50%"></p>` : ""}${para(x.biog)}<h2>Shows</h2>${cl.data.map((c) => `<p><a href="${esc(c.url)}">${esc(c.name)}</a> <span class="meta">${esc(when(c.created_time))} · ${dur(c.audio_length)}</span></p>`).join("")}`;
    return out(u, x.name, body, "Shown from Mixcloud's open API.");
  },
  // ---- Apple Music albums, songs and artists ----
  async (u) => {
    if (u.hostname !== "music.apple.com") return null; const m = u.pathname.match(/^\/([a-z]{2})\/(album|song|artist)\/[^/]*\/?(\d+)/); if (!m) return null;
    const id = m[2] === "album" && u.searchParams.get("i") ? u.searchParams.get("i") : m[3];
    const j = await json(`https://itunes.apple.com/lookup?id=${id}&country=${m[1]}&entity=${m[2] === "artist" ? "album&limit=40" : "song&limit=200"}`), list = j.results || []; const x = list[0]; if (!x) return null;
    const t = x.collectionName && m[2] !== "artist" && !u.searchParams.get("i") ? x.collectionName : x.trackName || x.artistName || x.collectionName, art = (x.artworkUrl100 || "").replace("100x100", "600x600");
    const songs = list.filter((r) => r.wrapperType === "track"), albums = list.filter((r) => r.wrapperType === "collection");
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc(x.artistName || "")}${x.primaryGenreName ? " · " + esc(x.primaryGenreName) : ""}${x.releaseDate ? " · " + esc(when(x.releaseDate)) : ""}${x.trackCount ? " · " + x.trackCount + " tracks" : ""}${x.copyright ? "<br>" + esc(x.copyright) : ""}</div>${art ? `<p><img src="${esc(art)}" alt="" style="max-height:320px"></p>` : ""}
      ${songs.map((s) => `<div class="card"><div style="flex:1"><b>${s.trackNumber ? s.trackNumber + ". " : ""}${esc(s.trackName)}</b> <span class="meta">${dur((s.trackTimeMillis || 0) / 1000)}</span>${s.previewUrl ? `<br><audio controls preload="none" src="${esc(s.previewUrl)}"></audio>` : ""}</div></div>`).join("")}
      ${albums.length ? `<h2>Albums</h2><div class="grid">${albums.map((a) => `<a href="${esc(a.collectionViewUrl)}"><img src="${esc((a.artworkUrl100 || "").replace("100x100", "300x300"))}" alt="" loading="lazy"><br>${esc(a.collectionName)} <span class="meta">${esc((a.releaseDate || "").slice(0, 4))}</span></a>`).join("")}</div>` : ""}`;
    return out(u, t, body, "Shown from Apple's open iTunes lookup data. Previews are short; open Apple Music for full songs.");
  },
  // ---- bioRxiv and medRxiv preprints ----
  async (u) => {
    const srv = { "biorxiv.org": "biorxiv", "medrxiv.org": "medrxiv" }[host(u)]; if (!srv) return null; const m = u.pathname.match(/^\/content\/(10\.\d+\/[\d.]+?)(v\d+)?(\.full|\.abstract|\.full\.pdf)?\/?$/); if (!m) return null;
    const j = await json(`https://api.biorxiv.org/details/${srv}/${m[1]}`), all = j.collection || []; const x = all.at(-1); if (!x) return null;
    const pub = await json(`https://api.biorxiv.org/pubs/${srv}/${m[1]}`).catch(() => null), pj = pub?.collection?.[0];
    const body = `<h1>${esc(x.title)}</h1><div class="meta">${esc(x.authors)}<br>${esc(x.author_corresponding_institution || "")} · ${esc(x.category)} · ${esc(x.date)} · version ${esc(x.version)} · ${esc(x.license || "")}</div>${pj?.published_doi ? `<p><b>Since published</b> in ${esc(pj.published_journal)}: <a href="https://doi.org/${esc(pj.published_doi)}">${esc(pj.published_doi)}</a></p>` : ""}<h2>Abstract</h2>${para(x.abstract)}<p><a href="https://www.${srv}.org/content/${esc(x.doi)}v${esc(x.version)}.full.pdf">Full text (PDF)</a> · <a href="https://doi.org/${esc(x.doi)}">doi:${esc(x.doi)}</a></p>${all.length > 1 ? `<p class="meta">Versions: ${all.map((v) => `v${esc(v.version)} (${esc(v.date)})`).join(", ")}</p>` : ""}<p class="meta">A preprint: it hasn't been peer reviewed yet.</p>`;
    return out(u, x.title, body, `Shown from the ${srv} open API.`);
  },
  // ---- ORCID researcher records ----
  async (u) => {
    if (host(u) !== "orcid.org") return null; const m = u.pathname.match(/^\/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])\/?$/); if (!m) return null;
    const d = await xml(`https://pub.orcid.org/v3.0/${m[1]}/record`), q = (sel, el = d) => [...el.getElementsByTagNameNS("*", sel)], t1 = (sel, el = d) => q(sel, el)[0]?.textContent?.trim() || "";
    const name = [t1("given-names"), t1("family-name")].filter(Boolean).join(" ") || t1("credit-name"); if (!name) return null;
    const aff = (kind) => q(kind + "-summary").map((e) => `${t1("role-title", e) ? t1("role-title", e) + ", " : ""}${t1("name", q("organization", e)[0] || e)} ${t1("year", q("start-date", e)[0] || e) ? "(" + t1("year", q("start-date", e)[0]) + (t1("year", q("end-date", e)[0] || d.createElement("x")) ? "–" + t1("year", q("end-date", e)[0]) : "–") + ")" : ""}`);
    const works = q("work-summary").slice(0, 60).map((w) => { const doi = q("external-id", w).find((e) => t1("external-id-type", e) === "doi"); return `<p>${doi ? `<a href="https://doi.org/${esc(t1("external-id-value", doi))}">${esc(t1("title", w))}</a>` : esc(t1("title", w))} <span class="meta">${esc(t1("journal-title", w))} ${esc(t1("year", w))}</span></p>`; });
    const body = `<h1>${esc(name)}</h1><div class="meta">ORCID ${esc(m[1])}${q("keyword").length ? " · " + q("keyword").map((k) => esc(t1("content", k))).join(", ") : ""}</div>${para(t1("biography"))}${q("researcher-url").length ? `<p>${q("researcher-url").map((r) => `<a class="tag" href="${esc(t1("url", r))}">${esc(t1("url-name", r) || t1("url", r))}</a>`).join("")}</p>` : ""}${aff("employment").length ? `<h2>Employment</h2>${aff("employment").map((a) => `<p>${esc(a)}</p>`).join("")}` : ""}${aff("education").length ? `<h2>Education</h2>${aff("education").map((a) => `<p>${esc(a)}</p>`).join("")}` : ""}${works.length ? `<h2>Works (${q("group").length || works.length})</h2>${[...new Set(works)].join("")}` : ""}`;
    return out(u, name, body, "Shown from ORCID's open public API.");
  },
  // ---- Zenodo records (datasets, software, papers) ----
  async (u) => {
    if (host(u) !== "zenodo.org") return null; const m = u.pathname.match(/^\/(?:records|record)\/(\d+)\/?$/); if (!m) return null;
    const x = await json(`https://zenodo.org/api/records/${m[1]}`), md = x?.metadata; if (!md) return null;
    const body = `<h1>${esc(md.title)}</h1><div class="meta">${(md.creators || []).map((c) => esc(c.name)).join("; ")}<br>${esc(md.resource_type?.title || "")} · ${esc(md.publication_date)} · ${esc(md.license?.id || "")}${md.version ? " · version " + esc(md.version) : ""} · <a href="https://doi.org/${esc(x.doi)}">doi:${esc(x.doi)}</a> · ${num(x.stats?.unique_downloads)} downloads</div><p>${tags(md.keywords)}</p><div>${md.description || ""}</div>${x.files?.length ? `<h2>Files</h2><table>${x.files.map((f) => `<tr><td><a href="${esc(f.links?.self || "")}">${esc(f.key)}</a></td><td>${(f.size / 1048576).toFixed(f.size > 1048576 ? 1 : 3)} MB</td></tr>`).join("")}</table>` : ""}`;
    return out(u, md.title, body, "Shown from Zenodo's open API.");
  },
  // ---- crates.io (Rust packages): details and the README ----
  async (u) => {
    if (u.hostname !== "crates.io") return null; const m = u.pathname.match(/^\/crates\/([\w-]+)(?:\/([\w.+-]+))?\/?$/); if (!m) return null;
    const j = await json(`https://crates.io/api/v1/crates/${m[1]}?include=keywords,categories,downloads`), c = j.crate; if (!c) return null; const v = m[2] || c.default_version || c.max_stable_version || c.newest_version;
    const readme = await text(`https://crates.io/api/v1/crates/${m[1]}/${v}/readme`).catch(() => "");
    const body = `<h1>${esc(c.name)} <small>${esc(v)}</small></h1><div class="meta">${esc(c.description || "")}<br>${num(c.downloads)} downloads · ${num(c.recent_downloads)} recently · updated ${esc(when(c.updated_at))}${c.repository ? ` · <a href="${esc(c.repository)}">repository</a>` : ""}${c.documentation ? ` · <a href="${esc(c.documentation)}">docs</a>` : ` · <a href="https://docs.rs/${esc(c.name)}">docs.rs</a>`}</div><p><code>cargo add ${esc(c.name)}</code></p><p>${tags((j.keywords || []).map((k) => k.keyword))}</p><hr>${/<\w/.test(readme) ? readme : "<p>No README.</p>"}`;
    return out(u, c.name, body, "Shown from crates.io's open API.");
  },
  // ---- Bitbucket repositories ----
  async (u) => {
    if (u.hostname !== "bitbucket.org") return null; const m = u.pathname.match(/^\/([\w.-]+)\/([\w.-]+)\/?(src\/?)?$/); if (!m || /^(product|account|dashboard|blog)$/.test(m[1])) return null;
    const r = await json(`https://api.bitbucket.org/2.0/repositories/${m[1]}/${m[2]}`); if (!r?.full_name) return null; const br = r.mainbranch?.name || "main";
    const [src, readme] = await Promise.all([json(`https://api.bitbucket.org/2.0/repositories/${m[1]}/${m[2]}/src/${br}/?pagelen=100`).catch(() => ({ values: [] })), text(`https://api.bitbucket.org/2.0/repositories/${m[1]}/${m[2]}/src/${br}/README.md`).catch(() => "")]);
    const body = `<h1>${esc(r.full_name)}</h1><div class="meta">${esc(r.description || "")}<br>${esc(r.language || "")} · branch ${esc(br)} · updated ${esc(when(r.updated_on))}</div><table>${(src.values || []).map((f) => `<tr><td>${f.type === "commit_directory" ? "📁" : "📄"} <a href="https://bitbucket.org/${esc(m[1])}/${esc(m[2])}/src/${esc(br)}/${esc(f.path)}">${esc(f.path)}</a></td><td>${f.size ? num(f.size) + " B" : ""}</td></tr>`).join("")}</table>${readme && !/^\s*[{<]/.test(readme) ? `<h2>README</h2><pre>${esc(readme.slice(0, 80000))}</pre>` : ""}`;
    return out(u, r.full_name, body, "Shown from Bitbucket's open API.");
  },
  // ---- Lichess players and games ----
  async (u) => {
    if (u.hostname !== "lichess.org") return null; const pm = u.pathname.match(/^\/@\/([\w-]+)\/?$/), gm = u.pathname.match(/^\/([a-zA-Z0-9]{8})(?:[a-zA-Z0-9]{4})?\/?(white|black)?$/);
    if (pm) {
      const x = await json(`https://lichess.org/api/user/${pm[1]}`); if (!x?.username) return null;
      const body = `<h1>${x.title ? `<span class="tag">${esc(x.title)}</span> ` : ""}${esc(x.username)}</h1><div class="meta">${esc(x.profile?.location || x.profile?.flag || "")} · joined ${esc(when(x.createdAt))} · last seen ${esc(when(x.seenAt))} · ${num(x.count?.all)} games${x.patron ? " · patron" : ""}</div>${para(x.profile?.bio)}<table><tr><th>Speed</th><th>Rating</th><th>Games</th></tr>${Object.entries(x.perfs || {}).filter(([, p]) => p.games).map(([k, p]) => `<tr><td>${esc(k)}</td><td>${p.rating}${p.prov ? "?" : ""}</td><td>${num(p.games)}</td></tr>`).join("")}</table><p><a href="https://lichess.org/@/${esc(x.username)}/all">All games</a></p>`;
      return out(u, x.username, body, "Shown from Lichess's open API.");
    }
    if (!gm || /^(training|analysis|editor|learn|practice|study|broadcast|tv|games|player|team|forum|blog|streamer|video|coach|swiss|tournament|simul|variant|inbox|account|paste|insights|racer|streak|storm)$/i.test(gm[1])) return null;
    const pgn = await text(`https://lichess.org/game/export/${gm[1]}?clocks=false&evals=false&literate=true`); if (!/\[Event /.test(pgn)) return null;
    const h = Object.fromEntries([...pgn.matchAll(/\[(\w+) "([^"]*)"\]/g)].map((x) => [x[1], x[2]])), moves = pgn.replace(/\[[^\]]*\]\s*/g, "").trim();
    const t = `${h.White} vs ${h.Black}`;
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc(h.Event || "")} · ${esc(h.Date || "")} · ${esc(h.TimeControl || "")} · result ${esc(h.Result || "")}${h.Opening ? " · " + esc(h.Opening) : ""}<br>White ${esc(h.WhiteElo || "")} · Black ${esc(h.BlackElo || "")}${h.Termination ? " · " + esc(h.Termination) : ""}</div><iframe src="https://lichess.org/embed/game/${esc(gm[1])}?theme=auto&bg=auto" title="${esc(t)}" width="600" height="397"></iframe><h2>Moves</h2><pre>${esc(moves)}</pre>`;
    return out(u, t, body, "Shown from Lichess's open game export.");
  },
  // ---- Chess.com players ----
  async (u) => {
    if (host(u) !== "chess.com") return null; const m = u.pathname.match(/^\/(?:[a-z]{2}\/)?member\/([\w-]+)\/?$/i); if (!m) return null;
    const [x, s] = await Promise.all([json(`https://api.chess.com/pub/player/${m[1].toLowerCase()}`), json(`https://api.chess.com/pub/player/${m[1].toLowerCase()}/stats`).catch(() => ({}))]); if (!x?.username) return null;
    const body = `<h1>${x.title ? `<span class="tag">${esc(x.title)}</span> ` : ""}${esc(x.name || x.username)}</h1><div class="meta">@${esc(x.username)} · ${num(x.followers)} followers · joined ${esc(when(x.joined))} · last online ${esc(when(x.last_online))}${x.location ? " · " + esc(x.location) : ""}</div>${x.avatar ? `<p><img src="${esc(x.avatar)}" alt="" style="width:110px;border-radius:12px"></p>` : ""}<table><tr><th>Category</th><th>Rating</th><th>Best</th><th>Won / lost / drawn</th></tr>${Object.entries(s).filter(([k, v]) => /^chess/.test(k) && v.last).map(([k, v]) => `<tr><td>${esc(k.replace("chess_", "").replace("chess", "daily 960"))}</td><td>${v.last.rating}</td><td>${v.best?.rating || ""}</td><td>${v.record ? `${v.record.win} / ${v.record.loss} / ${v.record.draw}` : ""}</td></tr>`).join("")}</table>${s.tactics?.highest ? `<p><b>Puzzles:</b> best ${s.tactics.highest.rating}</p>` : ""}${s.puzzle_rush?.best ? `<p><b>Puzzle Rush:</b> best ${s.puzzle_rush.best.score}</p>` : ""}`;
    return out(u, x.username, body, "Shown from Chess.com's open published-data API.");
  },
  // ---- Scratch projects and users ----
  async (u) => {
    if (u.hostname !== "scratch.mit.edu") return null; const pm = u.pathname.match(/^\/projects\/(\d+)/), um = u.pathname.match(/^\/users\/([\w-]+)\/?$/);
    if (pm) {
      const x = await json(`https://api.scratch.mit.edu/projects/${pm[1]}`); if (!x?.title) return null;
      const body = `<h1>${esc(x.title)}</h1><div class="meta">by <a href="https://scratch.mit.edu/users/${esc(x.author?.username)}">${esc(x.author?.username)}</a> · shared ${esc(when(x.history?.shared))} · ${num(x.stats?.views)} views · ${num(x.stats?.loves)} loves · ${num(x.stats?.favorites)} favourites · ${num(x.stats?.remixes)} remixes</div><iframe src="https://scratch.mit.edu/projects/${esc(pm[1])}/embed" title="${esc(x.title)}" width="485" height="402" allowfullscreen></iframe>${x.instructions ? `<h2>Instructions</h2>${para(x.instructions)}` : ""}${x.description ? `<h2>Notes and credits</h2>${para(x.description)}` : ""}`;
      return out(u, x.title, body, "Shown from Scratch's open API.");
    }
    if (!um) return null; const [x, pr] = await Promise.all([json(`https://api.scratch.mit.edu/users/${um[1]}`), json(`https://api.scratch.mit.edu/users/${um[1]}/projects?limit=40`).catch(() => [])]); if (!x?.username) return null;
    const body = `<h1>${esc(x.username)}</h1><div class="meta">${esc(x.profile?.country || "")} · joined ${esc(when(x.history?.joined))}${x.scratchteam ? " · Scratch Team" : ""}</div>${x.profile?.images?.["90x90"] ? `<p><img src="${esc(x.profile.images["90x90"])}" alt="" style="border-radius:8px"></p>` : ""}${x.profile?.bio ? `<h2>About me</h2>${para(x.profile.bio)}` : ""}${x.profile?.status ? `<h2>What I'm working on</h2>${para(x.profile.status)}` : ""}<h2>Projects</h2><div class="grid">${pr.map((p) => `<a href="https://scratch.mit.edu/projects/${p.id}"><img src="${esc(p.image)}" alt="" loading="lazy"><br>${esc(p.title)}</a>`).join("")}</div>`;
    return out(u, x.username, body, "Shown from Scratch's open API.");
  },
  // ---- Discogs releases, masters, artists and labels ----
  async (u) => {
    if (host(u) !== "discogs.com") return null; const m = u.pathname.match(/^\/(?:[a-z]{2}\/)?(release|master|artist|label)\/(\d+)/); if (!m) return null;
    const x = await json(`https://api.discogs.com/${m[1]}s/${m[2]}`); if (!x?.id) return null;
    const img = x.images?.[0]?.uri || "", t = x.title || x.name;
    let body = `<h1>${esc(t)}</h1>`;
    if (m[1] === "artist" || m[1] === "label") body += `${img ? `<p><img src="${esc(img)}" alt="" style="max-height:300px"></p>` : ""}${para((x.profile || "").replace(/\[[a-z]=?([^\]]*)\]/gi, "$1"))}${x.members?.length ? `<p><b>Members:</b> ${x.members.map((a) => esc(a.name)).join(", ")}</p>` : ""}${x.urls?.length ? `<p>${x.urls.slice(0, 10).map((l) => `<a class="tag" href="${esc(l)}">${esc(l.replace(/^https?:\/\/(www\.)?/, "").split("/")[0])}</a>`).join("")}</p>` : ""}${x.sublabels?.length ? `<p><b>Sub-labels:</b> ${x.sublabels.map((s) => esc(s.name)).join(", ")}</p>` : ""}`;
    else body += `<div class="meta">${(x.artists || []).map((a) => esc(a.name)).join(", ")} · ${esc(x.year || x.released || "")} · ${esc(x.country || "")}${x.labels?.length ? " · " + x.labels.map((l) => `${esc(l.name)} ${esc(l.catno)}`).join(", ") : ""}${x.formats?.length ? " · " + x.formats.map((f) => esc([f.name, ...(f.descriptions || [])].join(", "))).join("; ") : ""}${x.community ? ` · ${num(x.community.have)} have, ${num(x.community.want)} want` : ""}</div>${img ? `<p><img src="${esc(img)}" alt="" style="max-height:340px"></p>` : ""}<p>${tags([...(x.genres || []), ...(x.styles || [])])}</p><h2>Tracklist</h2><table>${(x.tracklist || []).map((t) => `<tr><td>${esc(t.position)}</td><td>${esc(t.title)}${t.artists ? ` <span class="meta">${t.artists.map((a) => esc(a.name)).join(", ")}</span>` : ""}</td><td>${esc(t.duration)}</td></tr>`).join("")}</table>${x.extraartists?.length ? `<h2>Credits</h2>${x.extraartists.slice(0, 30).map((a) => `<p>${esc(a.role)}: ${esc(a.name)}</p>`).join("")}` : ""}${x.notes ? `<h2>Notes</h2>${para(x.notes)}` : ""}${x.videos?.length ? `<h2>Videos</h2>${x.videos.slice(0, 8).map((v) => `<p><a href="${esc(v.uri)}">${esc(v.title)}</a></p>`).join("")}` : ""}`;
    return out(u, t, body, "Shown from Discogs' open API.");
  },
  // ---- Sefaria (Jewish texts): the passage in Hebrew and English, side by side ----
  async (u) => {
    if (host(u) !== "sefaria.org" && u.hostname !== "sefaria.org.il") return null; const ref = (() => { try { return decodeURIComponent(u.pathname.slice(1)); } catch { return u.pathname.slice(1); } })(); if (!/^[A-Z][\w,' ()-]*\.\d/.test(ref) || ref.includes("/")) return null;
    const j = await json(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(ref)}?version=english&version=source&return_format=text_only`), vs = j.versions || []; if (!vs.length) return null;
    const he = vs.find((v) => v.language === "he" || v.actualLanguage === "he"), en = vs.find((v) => v.language === "en" || v.actualLanguage === "en");
    const flat = (t) => (Array.isArray(t) ? t.flat(3) : [t]).filter((s) => s != null);
    const H = flat(he?.text || []), E = flat(en?.text || []), n = Math.max(H.length, E.length);
    const body = `<h1>${esc(j.ref || ref)}</h1><div class="meta">${esc(j.heRef || "")}${en?.versionTitle ? " · " + esc(en.versionTitle) : ""}</div><table>${Array.from({ length: n }, (_, k) => `<tr><td style="width:2em" class="meta">${k + 1}</td><td>${esc(E[k] || "")}</td><td class="he" lang="he">${esc(H[k] || "")}</td></tr>`).join("")}</table>${j.prev || j.next ? `<p>${j.prev ? `<a href="https://www.sefaria.org/${esc(j.prev.replace(/ /g, "_"))}">‹ ${esc(j.prev)}</a>` : ""}${j.next ? ` · <a href="https://www.sefaria.org/${esc(j.next.replace(/ /g, "_"))}">${esc(j.next)} ›</a>` : ""}</p>` : ""}`;
    return out(u, j.ref || ref, body, "Shown from Sefaria's open API.");
  },
  // ---- OpenStreetMap nodes, ways and relations: the tags, and a map ----
  async (u) => {
    if (host(u) !== "openstreetmap.org") return null; const m = u.pathname.match(/^\/(node|way|relation)\/(\d+)\/?$/); if (!m) return null;
    const j = await json(`https://api.openstreetmap.org/api/0.6/${m[1]}/${m[2]}${m[1] === "node" ? "" : "/full"}.json`), els = j.elements || [], x = els.find((e) => e.type === m[1] && String(e.id) === m[2]); if (!x) return null;
    const pts = els.filter((e) => e.type === "node" && e.lat != null); const lat = pts.map((p) => p.lat), lon = pts.map((p) => p.lon);
    const bb = pts.length ? [Math.min(...lon), Math.min(...lat), Math.max(...lon), Math.max(...lat)] : null, pad = bb ? Math.max(0.002, (bb[2] - bb[0]) * 0.15, (bb[3] - bb[1]) * 0.15) : 0;
    const t = x.tags?.name || x.tags?.["name:en"] || `${m[1]} ${m[2]}`;
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc(m[1])} ${esc(m[2])} · version ${x.version} · edited ${esc(when(x.timestamp))} by ${esc(x.user || "")}${x.lat != null ? ` · ${x.lat.toFixed(5)}, ${x.lon.toFixed(5)}` : ""}</div>${bb ? `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${bb[0] - pad},${bb[1] - pad},${bb[2] + pad},${bb[3] + pad}&layer=mapnik${x.lat != null ? `&marker=${x.lat},${x.lon}` : ""}" title="Map" width="100%" height="380"></iframe>` : ""}<table>${Object.entries(x.tags || {}).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${/^https?:/.test(v) ? `<a href="${esc(v)}">${esc(v)}</a>` : k === "wikipedia" ? `<a href="https://${esc(v.split(":")[0])}.wikipedia.org/wiki/${esc(v.split(":").slice(1).join(":"))}">${esc(v)}</a>` : esc(v)}</td></tr>`).join("")}</table>${x.members?.length ? `<h2>Members (${x.members.length})</h2><p class="meta">${x.members.slice(0, 40).map((mm) => `<a href="https://www.openstreetmap.org/${mm.type}/${mm.ref}">${mm.type} ${mm.ref}</a>${mm.role ? " (" + esc(mm.role) + ")" : ""}`).join(", ")}</p>` : ""}`;
    return out(u, t, body, "Shown from OpenStreetMap's open API. Map data © OpenStreetMap contributors.");
  },
  // ---- Pinterest pins ----
  async (u) => {
    if (!/^([a-z]{2}\.)?pinterest\.(com|co\.uk|ca|fr|de|es|it|jp|com\.au|com\.mx|ie|nz|at|ch|pt|se|dk|ru|cl|ph|kr|in)$/.test(host(u))) return null; const m = u.pathname.match(/^\/pin\/(?:[\w-]*--)?(\d+)/); if (!m) return null;
    const j = await json(`https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${m[1]}`), x = j?.data?.[0]; if (!x) return null;
    const img = x.images?.["564x"]?.url || x.images?.["237x"]?.url, t = x.title || x.grid_title || x.description?.slice(0, 80) || "Pin";
    const body = `<h1>${esc(t)}</h1><div class="meta">${esc(x.pinner?.full_name || "")}${x.board?.name ? ` · board <a href="https://www.pinterest.com${esc(x.board.url)}">${esc(x.board.name)}</a>` : ""}${x.repin_count ? " · " + num(x.repin_count) + " saves" : ""}</div>${img ? `<p><img src="${esc(img)}" alt="${esc(x.description || "")}"></p>` : ""}${para(x.description)}${x.link ? `<p>From: <a href="${esc(x.link)}">${esc(x.domain || x.link)}</a></p>` : ""}`;
    return out(u, t, body, "Shown from Pinterest's public pin widget data.");
  },
];

// shared with the next adapter pack
export { get, json, text, xml, post, when, num, dur, para, tags, proxImg, out, host };
