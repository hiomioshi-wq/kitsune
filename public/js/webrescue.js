// Kitsune Browser, v111: rescue. When a page comes back blocked, empty or made only of scripts, Kitsune asks the site
// another way, using public interfaces the site itself publishes:
//   - the oEmbed link a page advertises in its head
//   - the platform underneath: MediaWiki (thousands of wikis), WordPress (about four in ten websites), PeerTube,
//     Lemmy, Gitea / Forgejo, GitLab, Shopify shops, Blogger, Ghost and Substack pages via their feeds
//   - the site's own RSS / Atom feed, when the article you asked for is in it
// And Medium articles, which Medium only serves to apps through its official RSS feeds.
import { esc } from "./util.js";

const get = async (url) => { const r = await fetch("/api/browse?url=" + encodeURIComponent(url)); if (!r.ok) throw new Error(r.status); return r.json(); };
const json = async (url) => { const j = await get(url); if (!j.text || (j.status && j.status >= 400)) throw new Error("bad"); return JSON.parse(j.text); };
const when = (s) => { const d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };
const CSS = `<style>body{font:17px/1.7 Georgia,serif;max-width:46rem;margin:0 auto;padding:20px 18px 60px}h1{font-size:1.6em;line-height:1.2}.meta{font:14px system-ui,sans-serif;opacity:.7;margin:.3em 0 1.2em}img,video{max-width:100%;height:auto}pre{overflow:auto;padding:12px;background:#8881;border-radius:6px}.note{font:13px system-ui,sans-serif;opacity:.6;margin-top:36px;border-top:1px solid #8884;padding-top:10px}table{border-collapse:collapse;display:block;overflow:auto}td,th{padding:4px 10px;border:1px solid #8884}.tag{display:inline-block;font:12px system-ui,sans-serif;padding:2px 8px;margin:0 4px 4px 0;border:1px solid #8886;border-radius:99px}</style>`;
const page = (title, body, note, base) => `<!doctype html><html lang="en"><head><meta charset="utf-8">${base ? `<base href="${esc(base)}">` : ""}<title>${esc(title)}</title>${CSS}</head><body>${body}<p class="note">${esc(note)}</p></body></html>`;
const textLen = (html) => { const d = new DOMParser().parseFromString(html, "text/html"); d.querySelectorAll("script,style,noscript,template,svg").forEach((n) => n.remove()); return (d.body?.textContent || "").replace(/\s+/g, " ").trim().length; };
const norm = (u) => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/+$/, "")).toLowerCase(); } catch { return u; } };

// ---------- is this page worth rescuing? ----------
export function needsRescue(r) {
  if (!r || r.adapted || r.file) return false;
  if (r.status && [401, 403, 406, 429, 451, 503].includes(r.status)) return true;
  if (r.kind !== "html" || !r.html) return false;
  const html = r.html;
  if (/cf-browser-verification|challenge-platform|captcha|access denied|are you a robot|enable javascript and cookies|request blocked/i.test(html.slice(0, 60000)) && textLen(html) < 3000) return true;
  const scripts = (html.match(/<script\b/gi) || []).length;
  return scripts >= 3 && textLen(html) < 500;
}

// ---------- strategies ----------
async function viaOembed(u, r) {
  const m = r?.html?.match(/<link[^>]+type=["']application\/json\+oembed["'][^>]*>/i); if (!m) return null;
  const href = m[0].match(/href=["']([^"']+)/i)?.[1]; if (!href) return null;
  const o = await json(new URL(href.replace(/&amp;/g, "&"), u).href);
  const frame = o.html && /<iframe/i.test(o.html) ? o.html.replace(/<script[\s\S]*?<\/script>/gi, "") : "";
  return page(o.title || u.hostname, `<h1>${esc(o.title || "")}</h1><div class="meta">${esc(o.author_name || "")}${o.provider_name ? " · " + esc(o.provider_name) : ""}</div>${o.thumbnail_url ? `<p><img src="${esc(o.thumbnail_url)}" alt=""></p>` : ""}${frame}`, "Shown from the oEmbed details the page publishes.");
}

async function viaMediaWiki(u) {
  let title = u.searchParams.get("title") || (u.pathname.match(/^\/(?:[a-z-]{2,5}\/)?(?:wiki|w|title|index\.php)\/(.+)$/) || [])[1]; if (!title) return null; title = decodeURIComponent(title).replace(/_/g, " ");
  for (const path of ["/api.php", "/w/api.php", "/wiki/api.php", "/mediawiki/api.php"]) {
    const base = `${u.origin}${path}?action=parse&format=json&redirects=1&disableeditsection=1&page=${encodeURIComponent(title)}`;
    let meta; try { meta = await json(base + "&prop=sections|displaytitle"); } catch { continue; } if (!meta.parse) continue;
    const secs = ["0", ...(meta.parse.sections || []).filter((x) => x.level === "2" && /^\d+$/.test(x.index)).map((x) => x.index)].slice(0, 40), parts = [];
    for (let i = 0; i < secs.length; i += 6) parts.push(...(await Promise.all(secs.slice(i, i + 6).map((n) => json(base + "&prop=text&section=" + n).then((x) => x.parse?.text?.["*"] || "").catch(() => "")))));
    const html = parts.join("").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/data-src="/g, 'src="'); if (!html) return null;
    const t = (meta.parse.displaytitle || title).replace(/<[^>]+>/g, "");
    return page(t, `<h1>${esc(t)}</h1>${html}`, `Shown from ${u.hostname}'s own MediaWiki API.`, u.origin + "/");
  }
  return null;
}

async function viaWordPress(u) {
  const slug = u.pathname.replace(/\/+$/, "").split("/").pop(); if (!slug || /\./.test(slug)) return null;
  for (const type of ["posts", "pages"]) {
    let list; try { list = await json(`${u.origin}/wp-json/wp/v2/${type}?slug=${encodeURIComponent(slug)}&_embed=author`); } catch { return null; }
    const p = Array.isArray(list) && list[0]; if (!p?.content?.rendered) continue;
    const t = p.title.rendered.replace(/<[^>]+>/g, "");
    return page(t, `<h1>${p.title.rendered}</h1><div class="meta">${esc(p._embedded?.author?.[0]?.name || "")} · ${esc(when(p.date))}</div>${p.content.rendered}`, `Shown from the site's WordPress REST API.`, u.origin + "/");
  }
  return null;
}

async function viaPeerTube(u) {
  const id = u.pathname.match(/^\/(?:w|videos\/watch)\/([\w-]{6,})/)?.[1]; if (!id) return null;
  const v = await json(`${u.origin}/api/v1/videos/${id}`); if (!v.name) return null;
  const embed = `${u.origin}${v.embedPath || "/videos/embed/" + v.uuid}`;
  return page(v.name, `<h1>${esc(v.name)}</h1><div class="meta">${esc(v.channel?.displayName || v.account?.displayName || "")} · ${esc(when(v.publishedAt))} · ${(v.views || 0).toLocaleString()} views</div><iframe src="${esc(embed)}" width="640" height="360" title="${esc(v.name)}" allowfullscreen></iframe><div style="white-space:pre-wrap">${esc(v.description || v.truncatedDescription || "")}</div>`, "Shown from the PeerTube server's API.");
}

async function viaLemmy(u) {
  const id = u.pathname.match(/^\/post\/(\d+)/)?.[1]; if (!id) return null;
  const [p, c] = await Promise.all([json(`${u.origin}/api/v3/post?id=${id}`), json(`${u.origin}/api/v3/comment/list?post_id=${id}&sort=Top&limit=60&max_depth=6`).catch(() => ({ comments: [] }))]);
  const v = p.post_view; if (!v) return null; const md = (s) => esc(s || "").replace(/\n/g, "<br>");
  return page(v.post.name, `<h1>${esc(v.post.name)}</h1><div class="meta">${esc(v.creator.name)} in ${esc(v.community.name)} · ${v.counts.score} points</div>${v.post.url ? `<p><a href="${esc(v.post.url)}">${esc(v.post.url)}</a></p>` : ""}<p>${md(v.post.body)}</p>${(c.comments || []).map((x) => `<div style="margin-left:${Math.min(6, x.comment.path.split(".").length - 2) * 14}px;border-left:2px solid #8884;padding-left:10px;margin-top:10px"><div class="meta">${esc(x.creator.name)} · ${x.counts.score}</div><p>${md(x.comment.content)}</p></div>`).join("")}`, "Shown from the Lemmy server's API.");
}

async function viaForge(u, o) {
  const p = u.pathname.split("/").filter(Boolean); if (p.length !== 2) return null;
  try { // Gitea / Forgejo
    const r = await json(`${u.origin}/api/v1/repos/${p[0]}/${p[1]}`); if (r.full_name) {
      let rd = ""; try { rd = (await get(`${u.origin}/${p[0]}/${p[1]}/raw/branch/${r.default_branch || "main"}/README.md`)).text || ""; } catch {}
      return page(r.full_name, `<h1>${esc(r.full_name)}</h1><div class="meta">${esc(r.description || "")} · ★ ${r.stars_count}</div><hr>${rd && o.markdown ? o.markdown(rd.slice(0, 120000)) : ""}`, `Shown from ${u.hostname}'s Gitea/Forgejo API.`, u.href + "/");
    }
  } catch {}
  try { // GitLab
    const r = await json(`${u.origin}/api/v4/projects/${encodeURIComponent(p.join("/"))}`); if (r.path_with_namespace) {
      let rd = ""; try { rd = (await get(`${u.origin}/${p[0]}/${p[1]}/-/raw/${r.default_branch || "main"}/README.md`)).text || ""; } catch {}
      return page(r.path_with_namespace, `<h1>${esc(r.path_with_namespace)}</h1><div class="meta">${esc(r.description || "")} · ★ ${r.star_count}</div><hr>${rd && o.markdown ? o.markdown(rd.slice(0, 120000)) : ""}`, `Shown from ${u.hostname}'s GitLab API.`, u.href + "/");
    }
  } catch {}
  return null;
}

async function viaShopify(u) {
  const h = u.pathname.match(/\/products\/([^/?#]+)/)?.[1]; if (!h) return null;
  const j = await json(`${u.origin}/products/${h}.json`); const p = j.product; if (!p) return null;
  const price = p.variants?.[0]?.price, cur = "";
  return page(p.title, `<h1>${esc(p.title)}</h1><div class="meta">${esc(p.vendor || "")}${price ? ` · ${esc(price)}${cur}` : ""}${p.product_type ? " · " + esc(p.product_type) : ""}</div>${(p.images || []).slice(0, 6).map((i) => `<p><img src="${esc(i.src)}" alt="${esc(i.alt || "")}" loading="lazy"></p>`).join("")}${p.body_html || ""}${p.variants?.length > 1 ? `<h2>Options</h2><table>${p.variants.slice(0, 50).map((v) => `<tr><td>${esc(v.title)}</td><td>${esc(v.price)}</td><td>${v.available === false ? "sold out" : ""}</td></tr>`).join("")}</table>` : ""}`, "Shown from the shop's public product data (Shopify).");
}

// The article from the site's own feed, if it is in there.
async function viaFeed(u, r) {
  const F = await import("./feedlib.js"), cands = [];
  if (r?.html) { const d = new DOMParser().parseFromString(r.html, "text/html"); d.querySelectorAll('link[rel~="alternate"]').forEach((l) => { if (/rss|atom|json/i.test(l.getAttribute("type") || "") && l.getAttribute("href")) cands.push(new URL(l.getAttribute("href"), u).href); }); }
  for (const p of ["/feed", "/rss", "/feed.xml", "/atom.xml", "/index.xml", "/rss.xml", "/feeds/posts/default"]) cands.push(u.origin + p);
  const want = norm(u.href);
  for (const f of [...new Set(cands)].slice(0, 8)) {
    let feed; try { feed = await F.loadFeed(f); } catch { continue; }
    const it = feed.items.find((i) => norm(i.link) === want); if (!it) continue;
    return page(it.title, `<h1>${esc(it.title)}</h1><div class="meta">${esc([it.author, feed.title, it.date ? new Date(it.date).toLocaleDateString() : ""].filter(Boolean).join(" · "))}</div>${F.clean(it.html || "", u.href)}`, "Shown from the site's own feed, because the page itself couldn't be read.");
  }
  return null;
}

// ---------- Medium, through its official RSS ----------
export async function medium(u) {
  const host = u.hostname.replace(/^www\./, ""); if (host !== "medium.com" && !host.endsWith(".medium.com")) return null;
  const id = u.pathname.match(/-([0-9a-f]{10,12})\/?$/)?.[1] || u.pathname.match(/^\/p\/([0-9a-f]{10,12})/)?.[1];
  const seg = u.pathname.split("/").filter(Boolean);
  const feedUrl = host.endsWith(".medium.com") && host !== "medium.com" ? `https://${host}/feed` : seg[0]?.startsWith("@") ? `https://medium.com/feed/${seg[0]}` : seg[0] && seg[0] !== "p" ? `https://medium.com/feed/${seg[0]}` : null;
  if (!feedUrl) return null;
  const F = await import("./feedlib.js"); let feed; try { feed = await F.loadFeed(feedUrl); } catch { return null; }
  if (!id) return { html: page(feed.title || "Medium", `<h1>${esc(feed.title || "")}</h1>${feed.items.map((i) => `<p><a href="${esc(i.link)}"><b>${esc(i.title)}</b></a><br><span class="meta">${esc(when(i.date))}</span></p>`).join("")}`, "Medium's latest stories from its official RSS feed."), url: u.href };
  const it = feed.items.find((i) => i.link.includes(id) || i.id.includes(id));
  if (!it) return { html: page("Medium", `<h1>This story isn't in the feed</h1><p>Medium doesn't let apps read its pages, and its feed only carries the ten newest stories from <a href="${esc(feedUrl.replace("/feed", ""))}">${esc(feed.title || "this writer")}</a>. Open the story in your own browser to read it.</p>`, "Medium's official RSS feed."), url: u.href };
  return { html: page(it.title, `<h1>${esc(it.title)}</h1><div class="meta">${esc([it.author, feed.title, when(it.date)].filter(Boolean).join(" · "))}</div>${F.clean(it.html || "", u.href)}`, "Shown from Medium's official RSS feed, which carries the full story."), url: u.href };
}

export async function rescue(url, r, opts = {}) {
  let u; try { u = new URL(r?.url || url); } catch { return null; }
  const tries = [() => viaOembed(u, r), () => viaMediaWiki(u), () => viaPeerTube(u), () => viaLemmy(u), () => viaShopify(u), () => viaForge(u, opts), () => viaWordPress(u), () => viaFeed(u, r)];
  for (const t of tries) { try { const html = await t(); if (html) return { html, url: u.href, status: 200, kind: "html", adapted: true, rescued: true }; } catch {} }
  return null;
}
