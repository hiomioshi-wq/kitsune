// Kitsune Browser, v107: site adapters. Some sites turn away every app (Stack Overflow, npm, the Internet Archive's
// item pages are scripts only). Where a site publishes an open API, Kitsune reads that instead and builds a clean page.
import { esc } from "./util.js";

const api = async (url) => { const r = await fetch("/api/browse?url=" + encodeURIComponent(url)); if (!r.ok) throw new Error(r.status); const j = await r.json(); if (!j.text) throw new Error("empty"); return JSON.parse(j.text); };
const when = (s) => { const d = new Date(typeof s === "number" ? s * 1000 : s); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };
const CSS = `<style>body{font:17px/1.65 Georgia,serif;max-width:46rem;margin:0 auto;padding:20px 18px 60px}h1{font-size:1.5em;line-height:1.25}.meta{font:14px system-ui,sans-serif;opacity:.7;margin:.3em 0 1em}.tag{display:inline-block;font:12px system-ui,sans-serif;padding:2px 8px;margin:0 4px 4px 0;border:1px solid #8886;border-radius:99px}.card{padding:12px 0;border-bottom:1px solid #8884}.ans{margin-top:26px;padding-top:12px;border-top:2px solid #8886}.ok{color:#2e8b57;font:600 13px system-ui,sans-serif}pre{overflow:auto;padding:10px;background:#8881;border-radius:6px}code{font-size:.92em}img{max-width:100%}.note{font:13px system-ui,sans-serif;opacity:.6;margin-top:36px}table{border-collapse:collapse}td,th{padding:4px 10px;border-bottom:1px solid #8884;text-align:left}</style>`;
const doc = (title, body, note) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>${CSS}</head><body>${body}<p class="note">${esc(note)}</p></body></html>`;
const SE_HOSTS = { "stackoverflow.com": "stackoverflow", "superuser.com": "superuser", "serverfault.com": "serverfault", "askubuntu.com": "askubuntu", "mathoverflow.net": "mathoverflow.net" };
const seSite = (h) => SE_HOSTS[h] || (/^([a-z0-9-]+)\.stackexchange\.com$/.exec(h) || [])[1] || null;
const NOTE_SE = "Shown from the Stack Exchange open API, because the site doesn’t allow apps to read its pages. Comments and votes beyond the score aren’t included.";

const adapters = [
  // ---- Stack Exchange network ----
  async (u) => {
    const site = seSite(u.hostname.replace(/^www\./, "")); if (!site) return null;
    const q = u.pathname.match(/^\/(?:questions|q)\/(\d+)/), a = u.pathname.match(/^\/a\/(\d+)/);
    if (q || a) {
      let id = q?.[1];
      if (!id && a) { const x = await api(`https://api.stackexchange.com/2.3/answers/${a[1]}?site=${site}`); id = x.items?.[0]?.question_id; }
      if (!id) return null;
      const [qq, aa] = await Promise.all([api(`https://api.stackexchange.com/2.3/questions/${id}?site=${site}&filter=withbody`), api(`https://api.stackexchange.com/2.3/questions/${id}/answers?site=${site}&order=desc&sort=votes&filter=withbody&pagesize=30`)]);
      const it = qq.items?.[0]; if (!it) return null;
      const ans = (aa.items || []).sort((x, y) => (y.is_accepted - x.is_accepted) || (y.score - x.score));
      const body = `<h1>${it.title}</h1><div class="meta">Asked ${esc(when(it.creation_date))} by ${it.owner?.display_name || "someone"} · score ${it.score} · ${it.view_count?.toLocaleString?.() || ""} views</div><div>${(it.tags || []).map((t) => `<a class="tag" href="https://${u.hostname}/questions/tagged/${encodeURIComponent(t)}">${esc(t)}</a>`).join("")}</div>${it.body}<h2>${ans.length} answer${ans.length === 1 ? "" : "s"}</h2>${ans.map((x) => `<div class="ans">${x.is_accepted ? '<div class="ok">✓ Accepted answer</div>' : ""}<div class="meta">Score ${x.score} · ${x.owner?.display_name || "someone"} · ${esc(when(x.creation_date))}</div>${x.body}</div>`).join("")}`;
      return { html: doc(it.title.replace(/<[^>]+>/g, ""), body, NOTE_SE), url: `https://${u.hostname}/questions/${id}` };
    }
    if (/^\/questions\/?$/.test(u.pathname) || /^\/questions\/tagged\//.test(u.pathname) || u.pathname === "/") {
      const tag = (u.pathname.match(/^\/questions\/tagged\/([^/]+)/) || [])[1];
      const decTag = (() => { try { return decodeURIComponent(tag || ""); } catch { return tag || ""; } })();
      const x = await api(`https://api.stackexchange.com/2.3/questions?order=desc&sort=${tag ? "activity" : "hot"}&site=${site}&pagesize=30${tag ? `&tagged=${encodeURIComponent(decTag)}` : ""}`);
      const body = `<h1>${tag ? `Questions tagged ${esc(decTag)}` : "Hot questions"} on ${esc(u.hostname)}</h1>${(x.items || []).map((i) => `<div class="card"><a href="https://${u.hostname}/questions/${i.question_id}"><b>${i.title}</b></a><div class="meta">${i.score} votes · ${i.answer_count} answers · ${(i.tags || []).map(esc).join(", ")}</div></div>`).join("")}`;
      return { html: doc("Questions on " + u.hostname, body, NOTE_SE), url: u.href };
    }
    return null;
  },
  // ---- YouTube: a card with the open oEmbed details ----
  async (u) => {
    const h = u.hostname.replace(/^(www|m)\./, ""); let id = null;
    if (h === "youtu.be") id = u.pathname.slice(1); else if (h === "youtube.com") id = u.pathname === "/watch" ? u.searchParams.get("v") : (u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/) || [])[1];
    if (!id || !/^[\w-]{6,}$/.test(id)) return null;
    const o = await api(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}&format=json`);
    const body = `<h1>${esc(o.title)}</h1><div class="meta">${o.author_url ? `<a href="${esc(o.author_url)}">${esc(o.author_name)}</a>` : esc(o.author_name || "")}</div><p><a href="https://www.youtube.com/watch?v=${esc(id)}"><img src="https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg" alt="Video thumbnail"></a></p><iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}" title="${esc(o.title)}" width="560" height="315"></iframe>`;
    return { html: doc(o.title, body, "YouTube’s pages need their scripts, so this is the video’s open details with a player."), url: `https://www.youtube.com/watch?v=${id}` };
  },
  // ---- Internet Archive item pages ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "archive.org") return null; const m = u.pathname.match(/^\/details\/([^/?#]+)/); if (!m || /^(texts|audio|movies|software|image|web|etree)$/.test(m[1])) return null;
    const id = m[1], j = await api(`https://archive.org/metadata/${encodeURIComponent(id)}`), md = j.metadata || {}; if (!md.title) return null;
    const files = (j.files || []).filter((f) => f.source === "original" || /\.(pdf|epub|mobi|djvu|txt|mp3|m4b|ogg|mp4|cbz|zip)$/i.test(f.name)).filter((f) => !/_(thumb|meta|files|reviews)\./.test(f.name)).slice(0, 80);
    const mb = (n) => (n ? (+n / 1e6).toFixed(1) + " MB" : "");
    const body = `<h1>${esc(md.title)}</h1><div class="meta">${esc([].concat(md.creator || []).join(", "))}${md.date ? " · " + esc(String(md.date).slice(0, 10)) : ""}${md.mediatype ? " · " + esc(md.mediatype) : ""}</div><p><img src="https://archive.org/services/img/${encodeURIComponent(id)}" alt="" style="max-height:260px"></p>${md.description ? `<div>${[].concat(md.description).join("<br>")}</div>` : ""}${md.subject ? `<p>${[].concat(md.subject).slice(0, 15).map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</p>` : ""}<h2>Files</h2><table>${files.map((f) => `<tr><td><a href="https://archive.org/download/${encodeURIComponent(id)}/${f.name.split("/").map(encodeURIComponent).join("/")}">${esc(f.name)}</a></td><td>${esc(f.format || "")}</td><td>${mb(f.size)}</td></tr>`).join("")}</table>`;
    return { html: doc(md.title, body, "Shown from the Internet Archive’s open metadata. Open a PDF or EPUB link to add it to your library."), url: u.href };
  },
  // ---- npm ----
  async (u, o) => {
    if (u.hostname.replace(/^www\./, "") !== "npmjs.com") return null; const m = u.pathname.match(/^\/package\/((?:@[^/]+\/)?[^/]+)/); if (!m) return null;
    const j = await api(`https://registry.npmjs.org/${m[1].replace("/", "%2F")}`), v = j["dist-tags"]?.latest, ver = j.versions?.[v] || {};
    const repo = (typeof j.repository === "string" ? j.repository : j.repository?.url || "").replace(/^git\+/, "").replace(/\.git$/, "");
    const body = `<h1>${esc(j.name)} <small>${esc(v || "")}</small></h1><div class="meta">${esc(j.description || "")}<br>${esc(typeof j.license === "string" ? j.license : j.license?.type || "")} · updated ${esc(when(j.time?.modified))}${j.homepage ? ` · <a href="${esc(j.homepage)}">homepage</a>` : ""}${/^https?:/.test(repo) ? ` · <a href="${esc(repo)}">repository</a>` : ""}</div><p><code>npm install ${esc(j.name)}</code></p>${ver.dependencies ? `<p><b>Dependencies:</b> ${Object.keys(ver.dependencies).slice(0, 30).map((d) => `<a class="tag" href="https://www.npmjs.com/package/${esc(d)}">${esc(d)}</a>`).join("")}</p>` : ""}<hr>${j.readme ? o.markdown(j.readme.slice(0, 120000)) : "<p>No README.</p>"}`;
    return { html: doc(j.name, body, "Shown from the npm registry, which doesn’t allow apps to read npmjs.com pages."), url: u.href };
  },
  // ---- PyPI ----
  async (u, o) => {
    if (u.hostname.replace(/^www\./, "") !== "pypi.org") return null; const m = u.pathname.match(/^\/project\/([^/]+)/); if (!m) return null;
    const j = await api(`https://pypi.org/pypi/${encodeURIComponent(m[1])}/json`), i = j.info || {};
    const md = /markdown/i.test(i.description_content_type || "") ? o.markdown((i.description || "").slice(0, 120000)) : `<pre style="white-space:pre-wrap">${esc((i.description || i.summary || "").slice(0, 60000))}</pre>`;
    const body = `<h1>${esc(i.name)} <small>${esc(i.version)}</small></h1><div class="meta">${esc(i.summary || "")}<br>${esc(i.license || "")}${i.author ? " · " + esc(i.author) : ""}${i.home_page ? ` · <a href="${esc(i.home_page)}">homepage</a>` : ""}</div><p><code>pip install ${esc(i.name)}</code></p>${(i.requires_python ? `<p>Python ${esc(i.requires_python)}</p>` : "")}<hr>${md}`;
    return { html: doc(i.name, body, "Shown from PyPI’s open JSON API."), url: u.href };
  },

  // ---- Hacker News ----
  async (u) => {
    if (u.hostname !== "news.ycombinator.com" || u.pathname !== "/item") return null; const id = u.searchParams.get("id"); if (!/^\d+$/.test(id || "")) return null;
    const j = await api(`https://hn.algolia.com/api/v1/items/${id}`);
    const tree = (c, d = 0) => `<div style="margin-left:${Math.min(d, 8) * 14}px;border-left:2px solid #8884;padding:2px 0 2px 10px;margin-top:10px"><div class="meta">${esc(c.author || "[deleted]")} · ${esc(when(c.created_at))}</div>${c.text || "<i>[deleted]</i>"}${(c.children || []).map((k) => tree(k, d + 1)).join("")}</div>`;
    const body = `<h1>${j.url ? `<a href="${esc(j.url)}">${esc(j.title || "")}</a>` : esc(j.title || "")}</h1><div class="meta">${j.points ?? ""} points · ${esc(j.author || "")} · ${esc(when(j.created_at))}${j.url ? " · " + esc(new URL(j.url).hostname) : ""}</div>${j.text || ""}<h2>Comments</h2>${(j.children || []).map((k) => tree(k)).join("") || "<p>No comments.</p>"}`;
    return { html: doc(j.title || "Hacker News", body, "Shown from the Hacker News search API (Algolia)."), url: u.href };
  },
  // ---- GitHub issues, pull requests and repo pages ----
  async (u, o) => {
    if (u.hostname.replace(/^www\./, "") !== "github.com") return null; const p = u.pathname.split("/").filter(Boolean); if (p.length < 2) return null;
    const [ow, rp, kind, num] = p;
    if ((kind === "issues" || kind === "pull") && /^\d+$/.test(num || "")) {
      const [i, cs] = await Promise.all([api(`https://api.github.com/repos/${ow}/${rp}/issues/${num}`), api(`https://api.github.com/repos/${ow}/${rp}/issues/${num}/comments?per_page=50`)]);
      const md = (s) => o.markdown((s || "").slice(0, 60000));
      const body = `<h1>${esc(i.title)} <small>#${i.number}</small></h1><div class="meta">${esc(i.state)}${i.pull_request ? " pull request" : " issue"} · ${esc(i.user?.login || "")} · ${esc(when(i.created_at))} · ${i.comments} comments</div><p>${(i.labels || []).map((l) => `<span class="tag">${esc(l.name)}</span>`).join("")}</p>${md(i.body)}${cs.map((c) => `<div class="ans"><div class="meta">${esc(c.user?.login || "")} · ${esc(when(c.created_at))}</div>${md(c.body)}</div>`).join("")}`;
      return { html: doc(`${i.title} · ${ow}/${rp}#${i.number}`, body, "Shown from the GitHub API."), url: u.href };
    }
    if (p.length === 2) {
      const r = await api(`https://api.github.com/repos/${ow}/${rp}`); let rd = "";
      try { const x = await api(`https://api.github.com/repos/${ow}/${rp}/readme`); rd = x.content ? new TextDecoder().decode(Uint8Array.from(atob(x.content.replace(/\s/g, "")), (c) => c.charCodeAt(0))) : ""; } catch {}
      const body = `<h1>${esc(r.full_name)}</h1><div class="meta">${esc(r.description || "")}<br>★ ${r.stargazers_count?.toLocaleString?.()} · ${r.forks_count?.toLocaleString?.()} forks · ${esc(r.language || "")} · ${esc(r.license?.spdx_id || "")}${r.homepage ? ` · <a href="${esc(r.homepage)}">homepage</a>` : ""}</div><p><a href="https://github.com/${esc(ow)}/${esc(rp)}/issues">Issues</a> (${r.open_issues_count}) · <code>git clone ${esc(r.clone_url)}</code></p><hr>${rd ? o.markdown(rd.slice(0, 120000)) : "<p>No README.</p>"}`;
      return { html: doc(r.full_name, body, "Shown from the GitHub API."), url: u.href };
    }
    return null;
  },
  // ---- Bluesky posts and profiles ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "bsky.app") return null;
    const pm = u.pathname.match(/^\/profile\/([^/]+)\/post\/([\w]+)/), fm = u.pathname.match(/^\/profile\/([^/]+)\/?$/);
    if (pm) {
      const did = pm[1].startsWith("did:") ? pm[1] : (await api(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(pm[1])}`)).did;
      const t = await api(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(`at://${did}/app.bsky.feed.post/${pm[2]}`)}&depth=6`);
      const one = (n, d = 0) => { const p = n.post; if (!p) return ""; const imgs = (p.embed?.images || []).map((i) => `<img src="${esc(i.fullsize || i.thumb)}" alt="${esc(i.alt || "")}">`).join("");
        return `<div style="margin-left:${Math.min(d, 6) * 14}px;border-left:2px solid #8884;padding:2px 0 2px 10px;margin-top:12px"><div class="meta"><b>${esc(p.author.displayName || p.author.handle)}</b> @${esc(p.author.handle)} · ${esc(when(p.record?.createdAt))} · ♥ ${p.likeCount || 0} · ↻ ${p.repostCount || 0}</div><p style="white-space:pre-wrap">${esc(p.record?.text || "")}</p>${imgs}${(n.replies || []).map((r) => one(r, d + 1)).join("")}</div>`; };
      return { html: doc("Bluesky post", one(t.thread), "Shown from Bluesky’s public API."), url: u.href };
    }
    if (fm) {
      const [p, f] = await Promise.all([api(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(fm[1])}`), api(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(fm[1])}&limit=30&filter=posts_no_replies`)]);
      const body = `<h1>${esc(p.displayName || p.handle)}</h1><div class="meta">@${esc(p.handle)} · ${p.followersCount?.toLocaleString?.()} followers · ${p.postsCount?.toLocaleString?.()} posts</div><p style="white-space:pre-wrap">${esc(p.description || "")}</p>${(f.feed || []).map((x) => `<div class="card"><div class="meta">${esc(when(x.post.record?.createdAt))} · <a href="https://bsky.app/profile/${esc(x.post.author.handle)}/post/${esc(x.post.uri.split("/").pop())}">open</a></div><p style="white-space:pre-wrap">${esc(x.post.record?.text || "")}</p></div>`).join("")}`;
      return { html: doc(p.displayName || p.handle, body, "Shown from Bluesky’s public API."), url: u.href };
    }
    return null;
  },
  // ---- Wikidata items ----
  async (u) => {
    if (u.hostname !== "www.wikidata.org" && u.hostname !== "wikidata.org") return null; const m = u.pathname.match(/^\/wiki\/(Q\d+)/); if (!m) return null;
    const j = await api(`https://www.wikidata.org/wiki/Special:EntityData/${m[1]}.json`), e = j.entities?.[m[1]]; if (!e) return null;
    const pick = (o) => (o?.en || o?.["en-gb"] || o?.["en-ca"] || o?.mul || Object.values(o || {})[0])?.value || ""; const cl = e.claims || {}, ids = Object.keys(cl).slice(0, 60);
    const names = true ? (await api(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${[m[1], ...ids].join("|")}&props=labels&languages=en|en-gb|mul&format=json&origin=*`)).entities || {} : {};
    const lab = pick(names[m[1]]?.labels) || pick(e.labels) || m[1]; const val = (s) => { const v = s.mainsnak?.datavalue?.value; if (v == null) return ""; if (typeof v === "string") return /^https?:/.test(v) ? `<a href="${esc(v)}">${esc(v)}</a>` : esc(v); if (v.id) return `<a href="https://www.wikidata.org/wiki/${esc(v.id)}">${esc(v.id)}</a>`; if (v.time) return esc(v.time.replace(/^\+/, "").slice(0, 10)); if (v.amount) return esc(v.amount.replace(/^\+/, "")); if (v.text) return esc(v.text); return ""; };
    const body = `<h1>${esc(lab)} <small>${m[1]}</small></h1><div class="meta">${esc(pick(e.descriptions))}</div>${e.sitelinks?.enwiki ? `<p><a href="https://en.wikipedia.org/wiki/${encodeURIComponent(e.sitelinks.enwiki.title.replace(/ /g, "_"))}">Wikipedia article: ${esc(e.sitelinks.enwiki.title)}</a></p>` : ""}<table>${ids.map((p) => `<tr><th><a href="https://www.wikidata.org/wiki/Property:${p}">${esc(pick(names[p]?.labels) || p)}</a></th><td>${cl[p].slice(0, 8).map(val).filter(Boolean).join(", ")}</td></tr>`).join("")}</table>`;
    return { html: doc(lab, body, "Shown from Wikidata’s open data."), url: u.href };
  },
  // ---- Open Library works ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "openlibrary.org") return null; const m = u.pathname.match(/^\/works\/(OL\d+W)/); if (!m) return null;
    const w = await api(`https://openlibrary.org/works/${m[1]}.json`), d = typeof w.description === "string" ? w.description : w.description?.value || "";
    const au = (await Promise.all((w.authors || []).slice(0, 5).map((a) => api(`https://openlibrary.org${a.author.key}.json`).then((x) => x.name).catch(() => "")))).filter(Boolean);
    const body = `<h1>${esc(w.title)}</h1><div class="meta">${esc(au.join(", "))}${w.first_publish_date ? " · first published " + esc(w.first_publish_date) : ""}</div>${w.covers?.[0] ? `<p><img src="https://covers.openlibrary.org/b/id/${w.covers[0]}-M.jpg" alt=""></p>` : ""}<p style="white-space:pre-wrap">${esc(d)}</p>${w.subjects ? `<p>${w.subjects.slice(0, 20).map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</p>` : ""}`;
    return { html: doc(w.title, body, "Shown from Open Library’s open data."), url: u.href };
  },
  // ---- RubyGems ----
  async (u, o) => {
    if (u.hostname.replace(/^www\./, "") !== "rubygems.org") return null; const m = u.pathname.match(/^\/gems\/([^/]+)/); if (!m) return null;
    const g = await api(`https://rubygems.org/api/v1/gems/${encodeURIComponent(m[1])}.json`);
    const deps = (g.dependencies?.runtime || []).map((d) => `<a class="tag" href="https://rubygems.org/gems/${esc(d.name)}">${esc(d.name)}</a>`).join("");
    const body = `<h1>${esc(g.name)} <small>${esc(g.version)}</small></h1><div class="meta">${esc(g.info || "")}<br>${esc((g.licenses || []).join(", "))} · ${(g.downloads || 0).toLocaleString()} downloads${g.homepage_uri ? ` · <a href="${esc(g.homepage_uri)}">homepage</a>` : ""}${g.source_code_uri ? ` · <a href="${esc(g.source_code_uri)}">source</a>` : ""}</div><p><code>gem install ${esc(g.name)}</code></p>${deps ? `<p><b>Dependencies:</b> ${deps}</p>` : ""}<p>${esc(g.authors || "")}</p>`;
    return { html: doc(g.name, body, "Shown from the RubyGems API."), url: u.href };
  },
  // ---- Docker Hub ----
  async (u, o) => {
    if (u.hostname !== "hub.docker.com") return null; const m = u.pathname.match(/^\/(?:_|r)\/([^/]+)(?:\/([^/]+))?/); if (!m) return null;
    const repo = u.pathname.startsWith("/_/") ? `library/${m[1]}` : `${m[1]}/${m[2] || ""}`; if (repo.endsWith("/")) return null;
    const r = await api(`https://hub.docker.com/v2/repositories/${repo}`);
    const body = `<h1>${esc(repo.replace(/^library\//, ""))}</h1><div class="meta">${esc(r.description || "")}<br>${(r.pull_count || 0).toLocaleString()} pulls · ${(r.star_count || 0).toLocaleString()} stars · updated ${esc(when(r.last_updated))}</div><p><code>docker pull ${esc(repo.replace(/^library\//, ""))}</code></p><hr>${r.full_description ? o.markdown(r.full_description.slice(0, 120000)) : ""}`;
    return { html: doc(repo, body, "Shown from the Docker Hub API."), url: u.href };
  },
  // ---- dev.to articles ----
  async (u, o) => {
    if (u.hostname !== "dev.to") return null; const m = u.pathname.match(/^\/([\w.-]+)\/([\w-]+)\/?$/); if (!m || /^(t|tags|search|top|latest|listings|podcasts|videos|api|settings)$/.test(m[1])) return null;
    const a = await api(`https://dev.to/api/articles/${m[1]}/${m[2]}`); if (!a.title) return null;
    const body = `<h1>${esc(a.title)}</h1><div class="meta">${esc(a.user?.name || "")} · ${esc(when(a.published_at))} · ${a.public_reactions_count} reactions · ${a.reading_time_minutes} min</div>${a.cover_image ? `<p><img src="${esc(a.cover_image)}" alt=""></p>` : ""}${(a.tag_list || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}${a.body_html || o.markdown(a.body_markdown || "")}`;
    return { html: doc(a.title, body, "Shown from the DEV API."), url: u.href };
  },
  // ---- Mastodon (any server) status pages ----
  async (u) => {
    const m = u.pathname.match(/^\/@([\w.-]+)(?:@[\w.-]+)?\/(\d{6,})$/); if (!m) return null;
    const s = await api(`https://${u.hostname}/api/v1/statuses/${m[2]}`), c = await api(`https://${u.hostname}/api/v1/statuses/${m[2]}/context`).catch(() => ({ descendants: [] }));
    if (!s.account) return null;
    const one = (x, d) => `<div style="margin-left:${d * 14}px;border-left:2px solid #8884;padding:2px 0 2px 10px;margin-top:12px"><div class="meta"><b>${esc(x.account.display_name || x.account.username)}</b> @${esc(x.account.acct)} · ${esc(when(x.created_at))} · ♥ ${x.favourites_count} · ↻ ${x.reblogs_count}</div>${x.spoiler_text ? `<p><i>${esc(x.spoiler_text)}</i></p>` : ""}${x.content}${(x.media_attachments || []).filter((a) => a.type === "image").map((a) => `<img src="${esc(a.url)}" alt="${esc(a.description || "")}">`).join("")}</div>`;
    return { html: doc(`Post by ${s.account.display_name || s.account.username}`, one(s, 0) + (c.descendants || []).slice(0, 60).map((x) => one(x, 1)).join(""), "Shown from the Mastodon server’s public API."), url: u.href };
  },
  // ---- X / Twitter posts and profiles (through the open fxtwitter API) ----
  async (u) => {
    const h = u.hostname.replace(/^(www|mobile)\./, ""); if (!/^(twitter\.com|x\.com|nitter\.net|fxtwitter\.com|vxtwitter\.com)$/.test(h)) return null;
    const sm = u.pathname.match(/^\/(\w+)\/status\/(\d+)/), pm = u.pathname.match(/^\/(\w{1,15})\/?$/);
    if (sm) {
      const j = (await api(`https://api.fxtwitter.com/${sm[1]}/status/${sm[2]}`)).tweet; if (!j) return null;
      const media = (j.media?.all || []).map((m) => m.type === "photo" ? `<img src="${esc(m.url)}" alt="">` : `<p><a href="${esc(m.url)}">▶ video</a></p>`).join("");
      const q = j.quote ? `<blockquote><b>${esc(j.quote.author?.name || "")}</b> @${esc(j.quote.author?.screen_name || "")}<br>${esc(j.quote.text || "")}</blockquote>` : "";
      const body = `<div class="meta"><b>${esc(j.author.name)}</b> @${esc(j.author.screen_name)} · ${esc(j.created_at || "")}</div><p style="white-space:pre-wrap;font-size:1.15em">${esc(j.text || "")}</p>${media}${q}<div class="meta">♥ ${(j.likes || 0).toLocaleString()} · ↻ ${(j.retweets || 0).toLocaleString()} · 💬 ${(j.replies || 0).toLocaleString()}${j.views ? " · " + j.views.toLocaleString() + " views" : ""}</div>`;
      return { html: doc(`${j.author.name} on X`, body, "Shown from the open fxtwitter API, because X doesn’t allow apps to read its pages."), url: u.href };
    }
    if (pm && !/^(home|explore|search|i|settings|login|notifications|messages|compose|hashtag)$/i.test(pm[1])) {
      const j = (await api(`https://api.fxtwitter.com/${pm[1]}`)).user; if (!j) return null;
      const body = `<h1>${esc(j.name)}</h1><div class="meta">@${esc(j.screen_name)} · ${(j.followers || 0).toLocaleString()} followers · ${(j.tweets || 0).toLocaleString()} posts${j.location ? " · " + esc(j.location) : ""}</div>${j.avatar_url ? `<p><img src="${esc(j.avatar_url)}" alt="" style="width:96px;border-radius:50%"></p>` : ""}<p style="white-space:pre-wrap">${esc(j.description || "")}</p>`;
      return { html: doc(j.name, body, "Shown from the open fxtwitter API. Posts themselves open when you follow a status link."), url: u.href };
    }
    return null;
  },
  // ---- Homebrew formulae ----
  async (u) => {
    if (u.hostname !== "formulae.brew.sh") return null; const m = u.pathname.match(/^\/(formula|cask)\/([^/]+)/); if (!m) return null;
    const f = await api(`https://formulae.brew.sh/api/${m[1]}/${encodeURIComponent(m[2])}.json`), name = f.name || f.token;
    const body = `<h1>${esc(Array.isArray(name) ? name[0] : name)} <small>${esc(f.versions?.stable || f.version || "")}</small></h1><div class="meta">${esc(f.desc || "")}${f.homepage ? ` · <a href="${esc(f.homepage)}">homepage</a>` : ""}${f.license ? " · " + esc(f.license) : ""}</div><p><code>brew install ${m[1] === "cask" ? "--cask " : ""}${esc(m[2])}</code></p>${f.dependencies?.length ? `<p><b>Dependencies:</b> ${f.dependencies.map((d) => `<a class="tag" href="https://formulae.brew.sh/formula/${esc(d)}">${esc(d)}</a>`).join("")}</p>` : ""}${f.caveats ? `<pre>${esc(f.caveats)}</pre>` : ""}`;
    return { html: doc(String(name), body, "Shown from the Homebrew formulae API."), url: u.href };
  },
  // ---- GitLab and Codeberg repositories ----
  async (u, o) => {
    const h = u.hostname.replace(/^www\./, ""); if (h !== "gitlab.com" && h !== "codeberg.org") return null;
    const p = u.pathname.split("/").filter(Boolean).filter((x) => x !== "-"); if (p.length < 2 || (p[2] && !/^(tree|blob)$/.test(p[2]))) return null;
    let name, desc, stats, readme = "", home = "";
    if (h === "gitlab.com") {
      const id = encodeURIComponent(p.slice(0, 2).join("/")), r = await api(`https://gitlab.com/api/v4/projects/${id}`); name = r.path_with_namespace; desc = r.description; stats = `★ ${r.star_count} · ${r.forks_count} forks`; home = r.web_url;
      try { const br = r.default_branch || "main"; const rd = await (await fetch("/api/browse?url=" + encodeURIComponent(`https://gitlab.com/${p[0]}/${p[1]}/-/raw/${br}/README.md`))).json(); readme = rd.text || ""; } catch {}
    } else {
      const r = await api(`https://codeberg.org/api/v1/repos/${p[0]}/${p[1]}`); name = r.full_name; desc = r.description; stats = `★ ${r.stars_count} · ${r.forks_count} forks`; home = r.html_url;
      try { const rd = await (await fetch("/api/browse?url=" + encodeURIComponent(`https://codeberg.org/${p[0]}/${p[1]}/raw/branch/${r.default_branch || "main"}/README.md`))).json(); readme = rd.text || ""; } catch {}
    }
    const body = `<h1>${esc(name)}</h1><div class="meta">${esc(desc || "")}<br>${esc(stats)}</div><hr>${readme ? o.markdown(readme.slice(0, 120000)) : "<p>No README found.</p>"}`;
    return { html: doc(name, body, `Shown from ${h}’s API.`), url: u.href };
  },
  // ---- Hugging Face models and datasets ----
  async (u, o) => {
    if (u.hostname.replace(/^www\./, "") !== "huggingface.co") return null; const p = u.pathname.split("/").filter(Boolean);
    let kind = "models", rest = p; if (p[0] === "datasets" || p[0] === "spaces") { kind = p[0]; rest = p.slice(1); } else if (p[0] === "docs" || p[0] === "blog" || p[0] === "papers" || p.length < 1) return null;
    const repo = rest.slice(0, 2).join("/"); if (rest.length < 1 || (rest.length > 2 && !/^(tree|blob)$/.test(rest[2]))) return null;
    const j = await api(`https://huggingface.co/api/${kind}/${repo}`); if (!j.id) return null;
    let md = ""; try { const r = await (await fetch("/api/browse?url=" + encodeURIComponent(`https://huggingface.co/${kind === "models" ? "" : kind + "/"}${repo}/raw/main/README.md`))).json(); md = (r.text || "").replace(/^---[\s\S]*?\n---\n/, ""); } catch {}
    const body = `<h1>${esc(j.id)}</h1><div class="meta">${j.pipeline_tag ? esc(j.pipeline_tag) + " · " : ""}${(j.downloads || 0).toLocaleString()} downloads · ♥ ${j.likes || 0}${j.library_name ? " · " + esc(j.library_name) : ""}</div><p>${(j.tags || []).slice(0, 25).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</p><hr>${md ? o.markdown(md.slice(0, 120000)) : "<p>No model card.</p>"}`;
    return { html: doc(j.id, body, "Shown from the Hugging Face Hub API."), url: u.href };
  },
  // ---- oEmbed sites: Vimeo, SoundCloud, Spotify, TikTok ----
  async (u) => {
    const h = u.hostname.replace(/^(www|m|open|player)\./, ""); const map = { "vimeo.com": "https://vimeo.com/api/oembed.json?url=", "soundcloud.com": "https://soundcloud.com/oembed?format=json&url=", "spotify.com": "https://open.spotify.com/oembed?url=", "tiktok.com": "https://www.tiktok.com/oembed?url=" };
    const ep = map[h]; if (!ep || u.pathname.length < 3) return null;
    const o = await api(ep + encodeURIComponent(u.href)); if (!o.html && !o.title) return null;
    const frame = o.html && /<iframe/i.test(o.html) ? o.html.replace(/<script[\s\S]*?<\/script>/gi, "") : "";
    const body = `<h1>${esc(o.title || "")}</h1><div class="meta">${o.author_url ? `<a href="${esc(o.author_url)}">${esc(o.author_name || "")}</a>` : esc(o.author_name || "")} · ${esc(o.provider_name || h)}</div>${o.thumbnail_url ? `<p><img src="${esc(o.thumbnail_url)}" alt=""></p>` : ""}${frame || (o.description ? `<p>${esc(o.description)}</p>` : "")}`;
    return { html: doc(o.title || h, body, `Shown from ${o.provider_name || h}’s open oEmbed details with a player.`), url: u.href };
  },
  // ---- NuGet ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "nuget.org") return null; const m = u.pathname.match(/^\/packages\/([^/]+)/); if (!m) return null;
    const j = await api(`https://azuresearch-usnc.nuget.org/query?q=packageid:${encodeURIComponent(m[1])}&take=1&prerelease=false`), p = j.data?.[0]; if (!p) return null;
    const body = `<h1>${esc(p.id)} <small>${esc(p.version)}</small></h1><div class="meta">${esc(p.summary || p.description || "")}<br>${(p.totalDownloads || 0).toLocaleString()} downloads · ${esc((p.authors || []).join(", "))}${p.projectUrl ? ` · <a href="${esc(p.projectUrl)}">project</a>` : ""}</div><p><code>dotnet add package ${esc(p.id)}</code></p><p>${(p.tags || []).slice(0, 20).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</p><p>${esc(p.description || "")}</p>`;
    return { html: doc(p.id, body, "Shown from the NuGet search API."), url: u.href };
  },
  // ---- Hex.pm (Elixir / Erlang) ----
  async (u) => {
    if (u.hostname !== "hex.pm") return null; const m = u.pathname.match(/^\/packages\/([^/]+)/); if (!m) return null;
    const p = await api(`https://hex.pm/api/packages/${encodeURIComponent(m[1])}`), md = p.meta || {};
    const body = `<h1>${esc(p.name)} <small>${esc(p.latest_stable_version || p.latest_version || "")}</small></h1><div class="meta">${esc(md.description || "")}<br>${(p.downloads?.all || 0).toLocaleString()} downloads · ${esc((md.licenses || []).join(", "))}</div><p><code>{:${esc(p.name)}, "~> ${esc(p.latest_stable_version || "")}"}</code></p><p>${Object.entries(md.links || {}).map(([k, v]) => `<a class="tag" href="${esc(v)}">${esc(k)}</a>`).join("")}</p>`;
    return { html: doc(p.name, body, "Shown from the Hex API."), url: u.href };
  },
  // ---- Maven Central ----
  async (u) => {
    if (u.hostname !== "search.maven.org" && u.hostname !== "mvnrepository.com") return null; const m = u.pathname.match(/^\/artifact\/([^/]+)\/([^/]+)/); if (!m) return null;
    const j = await api(`https://search.maven.org/solrsearch/select?q=g:${encodeURIComponent(m[1])}+AND+a:${encodeURIComponent(m[2])}&core=gav&rows=25&wt=json`), ds = j.response?.docs || []; if (!ds.length) return null;
    const body = `<h1>${esc(m[1])}:${esc(m[2])}</h1><div class="meta">${j.response.numFound} versions on Maven Central</div><pre>&lt;dependency&gt;\n  &lt;groupId&gt;${esc(m[1])}&lt;/groupId&gt;\n  &lt;artifactId&gt;${esc(m[2])}&lt;/artifactId&gt;\n  &lt;version&gt;${esc(ds[0].v)}&lt;/version&gt;\n&lt;/dependency&gt;</pre><table>${ds.map((d) => `<tr><td>${esc(d.v)}</td><td>${esc(when(d.timestamp))}</td></tr>`).join("")}</table>`;
    return { html: doc(`${m[1]}:${m[2]}`, body, "Shown from Maven Central’s search API."), url: u.href };
  },
  // ---- Project Gutenberg book pages (the site itself is often unreachable) ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "gutenberg.org") return null; const m = u.pathname.match(/^\/(?:ebooks|cache\/epub)\/(\d+)/); if (!m) return null;
    const b = await api(`https://gutendex.com/books/${m[1]}`); if (!b.title) return null;
    const f = b.formats || {}, links = [["EPUB", f["application/epub+zip"]], ["Plain text", f["text/plain; charset=utf-8"] || f["text/plain"]], ["HTML", f["text/html"]], ["Kindle", f["application/x-mobipocket-ebook"]]].filter((x) => x[1]);
    const body = `<h1>${esc(b.title)}</h1><div class="meta">${esc((b.authors || []).map((a) => a.name).join("; "))} · ${(b.download_count || 0).toLocaleString()} downloads · ${esc((b.languages || []).join(", "))}</div>${f["image/jpeg"] ? `<p><img src="${esc(f["image/jpeg"])}" alt="" style="max-height:260px"></p>` : ""}<p>${links.map(([k, v]) => `<a class="tag" href="${esc(v)}">${k}</a>`).join("")}</p><p>${(b.subjects || []).slice(0, 12).map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</p>`;
    return { html: doc(b.title, body, "Shown from the Gutendex catalogue, because gutenberg.org often turns apps away. The download links open as cards you can add to your library."), url: u.href };
  },
  // ---- Lemmy posts ----
  async (u) => {
    if (!/^(lemmy\.world|lemmy\.ml|programming\.dev|lemm\.ee|sh\.itjust\.works|feddit\.org|beehaw\.org|lemmy\.ca|sopuli\.xyz)$/.test(u.hostname)) return null; const m = u.pathname.match(/^\/post\/(\d+)/); if (!m) return null;
    const [p, c] = await Promise.all([api(`https://${u.hostname}/api/v3/post?id=${m[1]}`), api(`https://${u.hostname}/api/v3/comment/list?post_id=${m[1]}&sort=Top&limit=60&max_depth=6`).catch(() => ({ comments: [] }))]);
    const v = p.post_view, md = (s) => esc(s || "").replace(/\n/g, "<br>");
    const body = `<h1>${esc(v.post.name)}</h1><div class="meta">${esc(v.creator.name)} in ${esc(v.community.name)} · ${esc(when(v.post.published))} · ${v.counts.score} points · ${v.counts.comments} comments</div>${v.post.url ? `<p><a href="${esc(v.post.url)}">${esc(v.post.url)}</a></p>` : ""}${v.post.thumbnail_url ? `<p><img src="${esc(v.post.thumbnail_url)}" alt=""></p>` : ""}<p>${md(v.post.body)}</p><h2>Comments</h2>${(c.comments || []).map((x) => { const d = Math.max(0, (x.comment.path.split(".").length - 2)); return `<div style="margin-left:${Math.min(d, 6) * 14}px;border-left:2px solid #8884;padding:2px 0 2px 10px;margin-top:10px"><div class="meta">${esc(x.creator.name)} · ${x.counts.score}</div><p>${md(x.comment.content)}</p></div>`; }).join("")}`;
    return { html: doc(v.post.name, body, "Shown from the Lemmy server’s public API."), url: u.href };
  },
  // ---- xkcd ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "xkcd.com") return null; const m = u.pathname.match(/^\/(\d+)\/?$/) || (u.pathname === "/" ? [null, ""] : null); if (!m) return null;
    const j = await api(`https://xkcd.com/${m[1] ? m[1] + "/" : ""}info.0.json`);
    const body = `<h1>${esc(j.safe_title)} <small>#${j.num}</small></h1><p><img src="${esc(j.img)}" alt="${esc(j.alt)}" title="${esc(j.alt)}"></p><p class="meta">${esc(j.alt)}</p><p><a href="https://xkcd.com/${j.num - 1}/">← Previous</a>${j.num < 99999 ? ` · <a href="https://xkcd.com/${j.num + 1}/">Next →</a>` : ""} · <a href="https://www.explainxkcd.com/wiki/index.php/${j.num}">Explain</a></p>`;
    return { html: doc(j.safe_title, body, "Shown from xkcd’s open JSON."), url: `https://xkcd.com/${j.num}/` };
  },
  // ---- Hacker News front page ----
  async (u) => {
    if (u.hostname !== "news.ycombinator.com" || !/^\/(news|front|newest|ask|show|best)?\/?$/.test(u.pathname)) return null;
    const tag = { ask: "ask_hn", show: "show_hn" }[u.pathname.replace(/\//g, "")] || "front_page";
    const j = await api(`https://hn.algolia.com/api/v1/search${u.pathname.startsWith("/newest") ? "_by_date" : ""}?tags=${tag}&hitsPerPage=40`);
    const body = `<h1>Hacker News</h1>${(j.hits || []).map((h, i) => `<div class="card"><a href="${esc(h.url || "https://news.ycombinator.com/item?id=" + h.objectID)}"><b>${i + 1}. ${esc(h.title || "")}</b></a><div class="meta">${h.points} points · ${esc(h.author)} · <a href="https://news.ycombinator.com/item?id=${esc(h.objectID)}">${h.num_comments} comments</a></div></div>`).join("")}`;
    return { html: doc("Hacker News", body, "Shown from the Hacker News search API (Algolia)."), url: u.href };
  },
  // ---- PubMed articles ----
  async (u) => {
    if (u.hostname !== "pubmed.ncbi.nlm.nih.gov") return null; const m = u.pathname.match(/^\/(\d+)/); if (!m) return null;
    const r = await fetch("/api/browse?url=" + encodeURIComponent(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${m[1]}&retmode=xml`)); if (!r.ok) return null; const t = (await r.json()).text || "";
    const x = new DOMParser().parseFromString(t.replace(/<!DOCTYPE[^>]*>/i, ""), "text/xml"), q = (s) => x.querySelector(s)?.textContent?.trim() || "";
    const title = q("ArticleTitle"); if (!title) return null;
    const abs = [...x.querySelectorAll("AbstractText")].map((a) => `${a.getAttribute("Label") ? `<b>${esc(a.getAttribute("Label"))}.</b> ` : ""}${esc(a.textContent)}`).join("</p><p>");
    const au = [...x.querySelectorAll("Author")].slice(0, 30).map((a) => `${a.querySelector("ForeName")?.textContent || ""} ${a.querySelector("LastName")?.textContent || a.querySelector("CollectiveName")?.textContent || ""}`.trim()).join(", ");
    const doi = x.querySelector('ArticleId[IdType="doi"]')?.textContent;
    const body = `<h1>${esc(title)}</h1><div class="meta">${esc(au)}<br>${esc(q("Journal > Title"))} · ${esc(q("PubDate > Year"))} · PMID ${m[1]}${doi ? ` · <a href="https://doi.org/${esc(doi)}">doi:${esc(doi)}</a>` : ""}</div><h2>Abstract</h2><p>${abs || "No abstract."}</p><p>${[...x.querySelectorAll("Keyword")].slice(0, 15).map((k) => `<span class="tag">${esc(k.textContent)}</span>`).join("")}</p>`;
    return { html: doc(title, body, "Shown from NCBI’s open E-utilities."), url: u.href };
  },
  // ---- Steam store pages ----
  async (u) => {
    if (u.hostname !== "store.steampowered.com") return null; const m = u.pathname.match(/^\/app\/(\d+)/); if (!m) return null;
    const j = (await api(`https://store.steampowered.com/api/appdetails?appids=${m[1]}&l=english`))[m[1]]; if (!j?.success) return null; const d = j.data;
    const body = `<h1>${esc(d.name)}</h1><div class="meta">${esc((d.developers || []).join(", "))} · ${esc(d.release_date?.date || "")} · ${esc(d.price_overview?.final_formatted || (d.is_free ? "Free" : ""))}${d.metacritic ? " · Metacritic " + d.metacritic.score : ""}</div><p><img src="${esc(d.header_image)}" alt=""></p><p>${(d.genres || []).map((g) => `<span class="tag">${esc(g.description)}</span>`).join("")}</p><p>${esc(d.short_description || "")}</p>${d.about_the_game || ""}${(d.screenshots || []).slice(0, 6).map((s) => `<p><img src="${esc(s.path_thumbnail)}" alt=""></p>`).join("")}`;
    return { html: doc(d.name, body, "Shown from the Steam store’s open details."), url: u.href };
  },
  // ---- App Store apps ----
  async (u) => {
    if (u.hostname !== "apps.apple.com") return null; const m = u.pathname.match(/\/id(\d+)/); if (!m) return null;
    const j = (await api(`https://itunes.apple.com/lookup?id=${m[1]}`)).results?.[0]; if (!j) return null;
    const body = `<h1>${esc(j.trackName)}</h1><div class="meta">${esc(j.artistName)} · ${esc(j.formattedPrice || "")} · ${esc(j.primaryGenreName || "")} · ★ ${j.averageUserRating ? j.averageUserRating.toFixed(1) : "–"} (${(j.userRatingCount || 0).toLocaleString()})</div><p><img src="${esc(j.artworkUrl512 || j.artworkUrl100)}" alt="" style="width:120px;border-radius:24px"></p><p style="white-space:pre-wrap">${esc(j.description || "")}</p>${(j.screenshotUrls || []).slice(0, 5).map((s) => `<img src="${esc(s)}" alt="" style="max-height:340px;margin-right:6px">`).join("")}<h2>What’s new</h2><p style="white-space:pre-wrap">${esc(j.releaseNotes || "")}</p>`;
    return { html: doc(j.trackName, body, "Shown from Apple’s open iTunes lookup."), url: u.href };
  },
  // ---- Kitsu anime and manga ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "kitsu.app" && u.hostname.replace(/^www\./, "") !== "kitsu.io") return null; const m = u.pathname.match(/^\/(anime|manga)\/([^/]+)/); if (!m) return null;
    const j = await api(`https://kitsu.io/api/edge/${m[1]}?filter[slug]=${encodeURIComponent(m[2])}&include=categories`), a = j.data?.[0]?.attributes; if (!a) return null;
    const cats = (j.included || []).map((c) => c.attributes?.title).filter(Boolean);
    const body = `<h1>${esc(a.canonicalTitle)}</h1><div class="meta">${esc(a.titles?.ja_jp || "")}<br>${esc(a.subtype || m[1])} · ${esc(a.status || "")} · ${esc((a.startDate || "").slice(0, 4))}${a.averageRating ? " · " + esc(a.averageRating) + "% rating" : ""}${a.chapterCount ? " · " + a.chapterCount + " chapters" : ""}${a.episodeCount ? " · " + a.episodeCount + " episodes" : ""}</div>${a.posterImage?.medium ? `<p><img src="${esc(a.posterImage.medium)}" alt="" style="max-height:300px"></p>` : ""}<p>${cats.map((c) => `<span class="tag">${esc(c)}</span>`).join("")}</p><p style="white-space:pre-wrap">${esc(a.synopsis || "")}</p>`;
    return { html: doc(a.canonicalTitle, body, "Shown from Kitsu’s open API."), url: u.href };
  },
  // ---- TVMaze shows ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "tvmaze.com") return null; const m = u.pathname.match(/^\/shows\/(\d+)/); if (!m) return null;
    const s = await api(`https://api.tvmaze.com/shows/${m[1]}?embed=episodes`), eps = s._embedded?.episodes || [];
    const body = `<h1>${esc(s.name)}</h1><div class="meta">${esc(s.status || "")} · ${esc((s.premiered || "").slice(0, 4))} · ${esc((s.genres || []).join(", "))}${s.rating?.average ? " · ★ " + s.rating.average : ""}</div>${s.image?.medium ? `<p><img src="${esc(s.image.medium.replace(/^http:/, "https:"))}" alt=""></p>` : ""}${s.summary || ""}<h2>Episodes</h2><table>${eps.slice(0, 200).map((e) => `<tr><td>${e.season}×${e.number}</td><td>${esc(e.name)}</td><td>${esc(e.airdate || "")}</td></tr>`).join("")}</table>`;
    return { html: doc(s.name, body, "Shown from TVMaze’s open API."), url: u.href };
  },
  // ---- GitHub user profiles ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "github.com") return null; const m = u.pathname.match(/^\/([\w-]+)\/?$/); if (!m || /^(topics|explore|search|trending|marketplace|login|signup|settings|about|features|pricing|sponsors|orgs|collections|events|issues|pulls|notifications)$/i.test(m[1])) return null;
    const [p, r] = await Promise.all([api(`https://api.github.com/users/${m[1]}`), api(`https://api.github.com/users/${m[1]}/repos?sort=updated&per_page=30`).catch(() => [])]);
    const body = `<h1>${esc(p.name || p.login)}</h1><div class="meta">@${esc(p.login)} · ${(p.followers || 0).toLocaleString()} followers · ${p.public_repos} repos${p.location ? " · " + esc(p.location) : ""}${p.blog ? ` · <a href="${esc(/^https?:/.test(p.blog) ? p.blog : "https://" + p.blog)}">${esc(p.blog)}</a>` : ""}</div><p><img src="${esc(p.avatar_url)}" alt="" style="width:96px;border-radius:50%"></p><p>${esc(p.bio || "")}</p><h2>Repositories</h2>${r.map((x) => `<div class="card"><a href="${esc(x.html_url)}"><b>${esc(x.name)}</b></a> ★ ${x.stargazers_count}<div class="meta">${esc(x.description || "")} ${esc(x.language || "")}</div></div>`).join("")}`;
    return { html: doc(p.name || p.login, body, "Shown from the GitHub API."), url: u.href };
  },
  // ---- npm search ----
  async (u) => {
    if (u.hostname.replace(/^www\./, "") !== "npmjs.com" || u.pathname !== "/search") return null; const q = u.searchParams.get("q"); if (!q) return null;
    const j = await api(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=30`);
    const body = `<h1>npm packages for “${esc(q)}”</h1>${(j.objects || []).map((o) => `<div class="card"><a href="https://www.npmjs.com/package/${esc(o.package.name)}"><b>${esc(o.package.name)}</b></a> <small>${esc(o.package.version)}</small><div class="meta">${esc(o.package.description || "")}</div></div>`).join("")}`;
    return { html: doc("npm: " + q, body, "Shown from the npm registry’s search API."), url: u.href };
  },
  // ---- Lobsters stories ----
  async (u) => {
    if (u.hostname !== "lobste.rs") return null; const m = u.pathname.match(/^\/s\/(\w+)/); if (!m) return null;
    const s = await api(`https://lobste.rs/s/${m[1]}.json`); if (!s.title) return null;
    const body = `<h1>${s.url ? `<a href="${esc(s.url)}">${esc(s.title)}</a>` : esc(s.title)}</h1><div class="meta">${s.score} points · ${esc(s.submitter_user?.username || s.submitter_user || "")} · ${esc(when(s.created_at))}</div><p>${(s.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</p>${s.description || ""}<h2>${(s.comments || []).length} comments</h2>${(s.comments || []).map((c) => `<div style="margin-left:${Math.min(c.depth || 0, 6) * 14}px;border-left:2px solid #8884;padding:2px 0 2px 10px;margin-top:10px"><div class="meta">${esc(c.commenting_user?.username || c.commenting_user || "")} · ${c.score}</div>${c.comment || ""}</div>`).join("")}`;
    return { html: doc(s.title, body, "Shown from Lobsters’ open JSON."), url: u.href };
  },
  // ---- Museum objects: the Met, Art Institute of Chicago ----
  async (u) => {
    const h = u.hostname.replace(/^www\./, "");
    if (h === "metmuseum.org") { const m = u.pathname.match(/\/art\/collection\/search\/(\d+)/); if (!m) return null; const o = await api(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${m[1]}`); if (!o.title) return null;
      return { html: doc(o.title, `<h1>${esc(o.title)}</h1><div class="meta">${esc(o.artistDisplayName || "Unknown")} · ${esc(o.objectDate || "")} · ${esc(o.department || "")}</div>${o.primaryImage ? `<p><img src="${esc(o.primaryImage)}" alt=""></p>` : ""}<p>${esc(o.medium || "")}<br>${esc(o.dimensions || "")}<br>${esc(o.creditLine || "")}</p>`, "Shown from the Met’s open access API."), url: u.href }; }
    if (h === "artic.edu") { const m = u.pathname.match(/\/artworks\/(\d+)/); if (!m) return null; const o = (await api(`https://api.artic.edu/api/v1/artworks/${m[1]}`)).data; if (!o?.title) return null;
      return { html: doc(o.title, `<h1>${esc(o.title)}</h1><div class="meta">${esc(o.artist_display || "")} · ${esc(o.date_display || "")}</div>${o.image_id ? `<p><img src="https://www.artic.edu/iiif/2/${esc(o.image_id)}/full/843,/0/default.jpg" alt="${esc(o.thumbnail?.alt_text || "")}"></p>` : ""}<p>${esc(o.medium_display || "")}</p>${o.description || ""}`, "Shown from the Art Institute of Chicago’s open API."), url: u.href }; }
    return null;
  },
];

export async function tryAdapter(raw, opts = {}) {
  let u; try { u = new URL(raw); } catch { return null; }
  let extra = []; try { extra = (await import("./webadapters2.js")).adapters; } catch {}
  try { extra = extra.concat((await import("./webadapters3.js")).adapters); } catch {}
  try { extra = extra.concat((await import("./webadapters4.js")).adapters); } catch {}
  try { extra = extra.concat((await import("./webadapters5.js")).adapters); } catch {}
  try { extra = extra.concat((await import("./webadapters6.js")).adapters); } catch {}
  for (const a of [...adapters, ...extra]) { try { const r = await a(u, opts); if (r?.html) return { ...r, status: 200, kind: "html", adapted: true }; } catch {} }
  return null;
}
