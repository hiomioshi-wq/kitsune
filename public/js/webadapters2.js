// Kitsune Browser, v110: more site adapters, all through the sites' own public APIs and export links.
// GitHub gists and files, Discourse forums (thousands of community sites), Google Docs, Sheets and Slides shared
// publicly, Mastodon profiles on any server, Telegram public channels, YouTube playlists, Flickr photos,
// and the Fandom and Wikimedia wikis through their MediaWiki API.
import { esc } from "./util.js";

const get = async (url) => { const r = await fetch("/api/browse?url=" + encodeURIComponent(url)); if (!r.ok) throw new Error(r.status); return r.json(); };
const api = async (url) => { const j = await get(url); if (!j.text || (j.status && j.status >= 400)) throw new Error("bad"); return JSON.parse(j.text); };
const when = (s) => { const d = new Date(typeof s === "number" ? s * 1000 : s); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };
const CSS = `<style>body{font:17px/1.65 Georgia,serif;max-width:48rem;margin:0 auto;padding:20px 18px 60px}h1{font-size:1.5em;line-height:1.25}.meta{font:14px system-ui,sans-serif;opacity:.7;margin:.3em 0 1em}.tag{display:inline-block;font:12px system-ui,sans-serif;padding:2px 8px;margin:0 4px 4px 0;border:1px solid #8886;border-radius:99px}.post{padding:14px 0;border-bottom:1px solid #8884}.av{width:28px;height:28px;border-radius:50%;vertical-align:middle;margin-right:6px}pre{overflow:auto;padding:12px;background:#8881;border-radius:6px;font:13px/1.5 ui-monospace,Menlo,monospace}code{font-size:.92em}img{max-width:100%;height:auto}.note{font:13px system-ui,sans-serif;opacity:.6;margin-top:36px}table{border-collapse:collapse;font:14px system-ui,sans-serif;display:block;overflow:auto}td,th{padding:4px 10px;border:1px solid #8884;text-align:left;vertical-align:top}.code{counter-reset:ln}.code span{display:block;white-space:pre}.code span::before{counter-increment:ln;content:counter(ln);display:inline-block;width:3.2em;opacity:.4;text-align:right;margin-right:1em;user-select:none}</style>`;
const doc = (title, body, note) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>${CSS}</head><body>${body}<p class="note">${esc(note)}</p></body></html>`;
const codeBlock = (text) => `<pre class="code">${text.split("\n").slice(0, 5000).map((l) => `<span>${esc(l)}</span>`).join("")}</pre>`;
const csvRows = (text) => { const rows = []; let row = [], cell = "", q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; } else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c; } if (cell || row.length) { row.push(cell); rows.push(row); } return rows; };

export const adapters = [
  // ---- Medium, through its official RSS feeds ----
  (u) => import("./webrescue.js").then((m) => m.medium(u)),
  // ---- GitHub gists ----
  async (u, o) => {
    if (u.hostname !== "gist.github.com") return null; const m = u.pathname.match(/^\/(?:[\w-]+\/)?([0-9a-f]{8,})/); if (!m) return null;
    const g = await api(`https://api.github.com/gists/${m[1]}`);
    const files = Object.values(g.files || {});
    const body = `<h1>${esc(g.description || files[0]?.filename || "Gist")}</h1><div class="meta">${esc(g.owner?.login || "anonymous")} · ${esc(when(g.created_at))} · ${files.length} file${files.length === 1 ? "" : "s"}</div>${files.map((f) => `<h2>${esc(f.filename)}</h2>${/markdown/i.test(f.language || "") && o.markdown ? o.markdown(f.content || "") : codeBlock(f.content || "")}`).join("")}`;
    return { html: doc(g.description || "Gist", body, "Shown from the GitHub API."), url: u.href };
  },
  // ---- GitHub files: rendered Markdown, or code with line numbers ----
  async (u, o) => {
    if (u.hostname.replace(/^www\./, "") !== "github.com") return null; const m = u.pathname.match(/^\/([\w.-]+)\/([\w.-]+)\/blob\/(.+)$/); if (!m) return null;
    const raw = `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`, j = await get(raw), text = j.text ?? "";
    if (j.status >= 400 || (!j.text && !j.html)) return null;
    const name = m[3].split("/").pop(), isMd = /\.(md|markdown)$/i.test(name);
    const body = `<div class="meta"><a href="https://github.com/${esc(m[1])}/${esc(m[2])}">${esc(m[1])}/${esc(m[2])}</a> · ${esc(m[3])} · <a href="${esc(raw)}">raw</a></div>${isMd && o.markdown ? o.markdown(text.slice(0, 200000)) : codeBlock(text || j.html || "")}`;
    return { html: doc(name, body, "Shown from GitHub's raw file."), url: u.href };
  },
  // ---- Discourse forums (any site): /t/slug/123 ----
  async (u) => {
    const m = u.pathname.match(/^\/t\/(?:[^/]+\/)?(\d+)(?:\/\d+)?\/?$/); if (!m) return null;
    const t = await api(`${u.origin}/t/${m[1]}.json`); if (!t.post_stream?.posts) return null;
    const av = (p) => p.avatar_template ? `<img class="av" src="${esc(new URL(p.avatar_template.replace("{size}", "48"), u.origin).href)}" alt="" referrerpolicy="no-referrer">` : "";
    const fix = (h) => h.replace(/(src|href)="\/(?!\/)/g, `$1="${u.origin}/`);
    const body = `<h1>${esc(t.title)}</h1><div class="meta">${t.posts_count} posts · ${t.views?.toLocaleString?.() || ""} views · ${esc(when(t.created_at))}</div><div>${(t.tags || []).map((x) => `<span class="tag">${esc(typeof x === "string" ? x : x.name)}</span>`).join("")}</div>${t.post_stream.posts.map((p) => `<div class="post"><div class="meta">${av(p)}<b>${esc(p.name || p.username)}</b> @${esc(p.username)} · ${esc(when(p.created_at))}${p.reply_count ? ` · ${p.reply_count} replies` : ""}</div>${fix(p.cooked || "")}</div>`).join("")}${t.posts_count > t.post_stream.posts.length ? `<p class="meta">Showing the first ${t.post_stream.posts.length} of ${t.posts_count} posts. <a href="${esc(u.origin)}/t/${m[1]}/${t.post_stream.posts.length + 1}">Read on</a></p>` : ""}`;
    return { html: doc(t.title, body, "Shown from the forum's own JSON (Discourse)."), url: u.href };
  },
  // ---- Google Docs, Sheets and Slides shared publicly ----
  async (u) => {
    if (u.hostname !== "docs.google.com") return null; const m = u.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([\w-]{20,})/); if (!m) return null;
    const [, kind, id] = m;
    if (kind === "document") {
      const j = await get(`https://docs.google.com/document/d/${id}/export?format=html`); if (!j.html || j.status >= 400 || /accounts\.google\.com|ServiceLogin/.test(j.url || "")) return null;
      return { html: j.html, url: u.href };
    }
    if (kind === "spreadsheets") {
      const gid = u.hash.match(/gid=(\d+)/)?.[1] || u.searchParams.get("gid") || "0";
      const j = await get(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`); const text = j.text || ""; if (!text || j.status >= 400 || /^\s*</.test(text)) return null;
      const rows = csvRows(text).slice(0, 2000);
      const body = `<h1>Spreadsheet</h1><div class="meta">${rows.length} rows · sheet ${esc(gid)}</div><table>${rows.map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`).join("")}</table>`;
      return { html: doc("Google Sheet", body, "Shown from the sheet's public CSV export. Only sheets shared with anyone who has the link can be read."), url: u.href };
    }
    const pdf = `https://docs.google.com/presentation/d/${id}/export/pdf`;
    return { html: doc("Google Slides", `<h1>Google Slides presentation</h1><p>Slides need Google's own scripts to play. Open the PDF version to read them here, or add it to your library.</p><p><a href="${esc(pdf)}">Open the slides as a PDF</a></p>`, "Only presentations shared with anyone who has the link can be opened."), url: u.href };
  },
  // ---- Mastodon profiles (any server): /@user ----
  async (u) => {
    const m = u.pathname.match(/^\/@([\w.]+)\/?$/); if (!m || /(^|\.)(medium\.com|youtube\.com|tiktok\.com|threads\.net)$/.test(u.hostname)) return null;
    const a = await api(`${u.origin}/api/v1/accounts/lookup?acct=${encodeURIComponent(m[1])}`); if (!a.id) return null;
    const st = await api(`${u.origin}/api/v1/accounts/${a.id}/statuses?limit=30&exclude_replies=true`).catch(() => []);
    const body = `<h1>${esc(a.display_name || a.username)}</h1><div class="meta">@${esc(a.acct)}@${esc(u.hostname)} · ${(a.followers_count || 0).toLocaleString()} followers · ${(a.statuses_count || 0).toLocaleString()} posts</div>${a.avatar ? `<p><img src="${esc(a.avatar)}" alt="" style="width:96px;border-radius:12px"></p>` : ""}<div>${a.note || ""}</div>${st.map((s) => { const x = s.reblog || s; return `<div class="post"><div class="meta">${s.reblog ? `↻ ${esc(x.account.acct)} · ` : ""}${esc(when(x.created_at))} · ♥ ${x.favourites_count} · <a href="${esc(x.url || "")}">open</a></div>${x.spoiler_text ? `<p><i>${esc(x.spoiler_text)}</i></p>` : ""}${x.content || ""}${(x.media_attachments || []).filter((y) => y.type === "image").map((y) => `<img src="${esc(y.preview_url || y.url)}" alt="${esc(y.description || "")}">`).join("")}</div>`; }).join("")}`;
    return { html: doc(a.display_name || a.username, body, "Shown from the Mastodon server's public API."), url: u.href };
  },
  // ---- Telegram public channels: t.me/name shows Telegram's own web preview ----
  async (u) => {
    if (u.hostname !== "t.me" && u.hostname !== "telegram.me") return null; const m = u.pathname.match(/^\/(?:s\/)?([A-Za-z]\w{3,})\/?(\d+)?$/); if (!m || /^(joinchat|addstickers|share|proxy|socks|iv)$/i.test(m[1])) return null;
    const j = await get(`https://t.me/s/${m[1]}${m[2] ? "/" + m[2] : ""}`); if (!j.html || !/tgme_widget_message/.test(j.html)) return null;
    return { html: j.html, url: j.url || u.href };
  },
  // ---- YouTube playlists ----
  async (u) => {
    if (!/(^|\.)youtube\.com$/.test(u.hostname) || u.pathname !== "/playlist") return null; const list = u.searchParams.get("list"); if (!list) return null;
    const o = await api(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/playlist?list=" + list)}&format=json`);
    const body = `<h1>${esc(o.title)}</h1><div class="meta">${esc(o.author_name || "")} · playlist</div><iframe src="https://www.youtube-nocookie.com/embed/videoseries?list=${esc(list)}" title="${esc(o.title)}" width="560" height="315"></iframe>`;
    return { html: doc(o.title, body, "YouTube's pages need their scripts, so this is the playlist's open details with a player."), url: u.href };
  },
  // ---- Flickr photos ----
  async (u) => {
    if (!/(^|\.)flickr\.com$/.test(u.hostname) || !/^\/photos\/[^/]+\/\d+/.test(u.pathname)) return null;
    const o = await api(`https://www.flickr.com/services/oembed?url=${encodeURIComponent(u.href)}&format=json&maxwidth=1600`); if (!o.url && !o.thumbnail_url) return null;
    const body = `<h1>${esc(o.title || "Photo")}</h1><div class="meta">${o.author_url ? `<a href="${esc(o.author_url)}">${esc(o.author_name)}</a>` : esc(o.author_name || "")}${o.license ? " · " + esc(o.license) : ""}</div><p><img src="${esc(o.url || o.thumbnail_url)}" alt="${esc(o.title || "")}"></p>`;
    return { html: doc(o.title || "Flickr photo", body, "Shown from Flickr's open oEmbed details."), url: u.href };
  },
  // ---- Fandom wikis, through each wiki's own MediaWiki API ----
  async (u) => {
    const sub = u.hostname.match(/^([\w-]+)\.fandom\.com$/)?.[1]; if (!sub) return null; const m = u.pathname.match(/^(\/[a-z-]{2,5})?\/wiki\/(.+)$/); if (!m) return null;
    const lang = m[1] || "", title = decodeURIComponent(m[2]);
    // Long articles are fetched a section at a time, so no single reply is too big.
    const base = `https://${sub}.fandom.com${lang}/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&redirects=1&disableeditsection=1`;
    const meta = await api(base + "&prop=sections|displaytitle"); if (!meta.parse) return null;
    const secs = ["0", ...(meta.parse.sections || []).filter((x) => x.level === "2" && /^\d+$/.test(x.index)).map((x) => x.index)].slice(0, 40);
    const parts = [];
    for (let i = 0; i < secs.length; i += 6) parts.push(...(await Promise.all(secs.slice(i, i + 6).map((n) => api(base + "&prop=text&section=" + n).then((x) => x.parse?.text?.["*"] || "").catch(() => "")))));
    const html = parts.join(""); if (!html) return null;
    const j = meta;
    const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/(href)="\/wiki\//g, `$1="https://${sub}.fandom.com${lang}/wiki/`).replace(/data-src="/g, 'src="');
    return { html: doc((j.parse.displaytitle || title).replace(/<[^>]+>/g, ""), `<h1>${j.parse.displaytitle || esc(title)}</h1>${cleaned}`, `Shown from ${sub}.fandom.com's own MediaWiki API. Text is CC BY-SA.`), url: u.href };
  },
];
