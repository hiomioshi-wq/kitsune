// Kitsune Browser, v104: save the page as a file, files linked on a page, find feeds, browse a site's sitemap and robots.txt, email a link.
import { $, esc, toast, modal, plural } from "./util.js";

const download = (name, text, type = "text/plain") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
const slug = (s) => (s || "page").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "page";

function toMarkdown(root) {
  const out = [];
  const inline = (n) => {
    if (n.nodeType === 3) return n.nodeValue.replace(/\s+/g, " ");
    if (n.nodeType !== 1) return "";
    const tag = n.tagName.toLowerCase(), kids = () => [...n.childNodes].map(inline).join("");
    if (/^(script|style|nav|footer|aside|form|svg|noscript|button|iframe)$/.test(tag)) return "";
    if (tag === "a") { const h = n.getAttribute("href"), t = kids().trim(); return h && t && /^https?:/.test(h) ? `[${t}](${h})` : t; }
    if (tag === "strong" || tag === "b") return `**${kids().trim()}**`;
    if (tag === "em" || tag === "i") return `*${kids().trim()}*`;
    if (tag === "code") return "`" + kids() + "`";
    if (tag === "img") { const s = n.getAttribute("src"); return s && /^https?:/.test(s) ? `![${n.getAttribute("alt") || ""}](${s})` : ""; }
    if (tag === "br") return "  \n";
    return kids();
  };
  const block = (n) => {
    if (n.nodeType !== 1) return;
    const tag = n.tagName.toLowerCase();
    if (/^(script|style|nav|footer|aside|form|svg|noscript|iframe|header)$/.test(tag)) return;
    if (/^h[1-6]$/.test(tag)) return out.push(`${"#".repeat(+tag[1])} ${inline(n).trim()}`);
    if (tag === "p" || tag === "figcaption") { const t = inline(n).trim(); if (t) out.push(t); return; }
    if (tag === "blockquote") return out.push(inline(n).trim().split("\n").map((l) => "> " + l).join("\n"));
    if (tag === "pre") return out.push("```\n" + n.textContent.replace(/\n+$/, "") + "\n```");
    if (tag === "ul" || tag === "ol") return out.push([...n.children].filter((x) => x.tagName === "LI").map((li, i) => `${tag === "ol" ? i + 1 + "." : "-"} ${inline(li).trim()}`).join("\n"));
    if (tag === "table") { const rows = [...n.rows].map((r) => [...r.cells].map((c) => c.textContent.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|"))); if (rows.length) out.push([rows[0], rows[0].map(() => "---"), ...rows.slice(1)].map((r) => `| ${r.join(" | ")} |`).join("\n")); return; }
    if (tag === "hr") return out.push("---");
    const hasBlock = [...n.children].some((x) => /^(p|div|h[1-6]|ul|ol|pre|blockquote|table|section|article|main|figure)$/i.test(x.tagName));
    if (hasBlock) [...n.childNodes].forEach((k) => (k.nodeType === 1 ? block(k) : (k.nodeValue || "").trim() && out.push(k.nodeValue.trim()))); else { const t = inline(n).trim(); if (t) out.push(t); }
  };
  block(root); return out.join("\n\n").replace(/\n{3,}/g, "\n\n");
}

export function items(c) {
  const { T, root, host, go } = c;
  const needPage = () => { const r = root(); if (!r || !T().url) { toast("Open a page first."); return null; } return r; };
  const get = async (url) => { const r = await fetch("/api/browse?url=" + encodeURIComponent(url)); if (!r.ok) throw new Error(r.status); return r.json(); };

  const saveAs = () => {
    const r = needPage(); if (!r) return; const t = T(), name = slug(t.title || host(t.url));
    const m = modal({ title: "Save this page as a file", body: `<div class="kb-list"><button type="button" class="kb-li" data-k="md"><b>Markdown (.md)</b><br><small class="muted">Headings, links, lists and tables kept. Opens in any notes app.</small></button><button type="button" class="kb-li" data-k="txt"><b>Plain text (.txt)</b></button><button type="button" class="kb-li" data-k="html"><b>Simple web page (.html)</b><br><small class="muted">The text and structure, with no scripts and no site styles.</small></button></div>` });
    m.root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-k]"); if (!b) return; m.close();
      const head = `${t.title || host(t.url)}\n${t.url}\nSaved ${new Date().toLocaleDateString()}\n\n`;
      if (b.dataset.k === "md") download(name + ".md", `# ${t.title || host(t.url)}\n\n<${t.url}>\n\n` + toMarkdown(r), "text/markdown");
      else if (b.dataset.k === "txt") download(name + ".txt", head + (r.innerText || r.textContent || "").replace(/\n{3,}/g, "\n\n"), "text/plain");
      else { const clone = r.cloneNode(true); clone.querySelectorAll("script,style,iframe,form,nav,svg,button").forEach((n) => n.remove()); clone.querySelectorAll("*").forEach((n) => [...n.attributes].forEach((a) => { if (!/^(href|src|alt|colspan|rowspan)$/.test(a.name)) n.removeAttribute(a.name); })); download(name + ".html", `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.title || "")}</title><style>body{font:18px/1.7 Georgia,serif;max-width:42rem;margin:2rem auto;padding:0 1rem}img{max-width:100%}pre{overflow:auto}</style><p><a href="${esc(t.url)}">${esc(t.url)}</a></p>${clone.innerHTML}`, "text/html"); }
      toast("Saved.");
    });
  };

  const email = () => { const t = T(); if (!t.url) return toast("Open a page first."); location.href = `mailto:?subject=${encodeURIComponent(t.title || host(t.url))}&body=${encodeURIComponent(`${t.title || ""}\n${t.url}`)}`; };

  const files = () => {
    const r = needPage(); if (!r) return; const base = T().url;
    const re = /\.(pdf|epub|mobi|azw3?|cbz|cbr|zip|rar|7z|mp3|m4a|m4b|ogg|flac|wav|mp4|webm|mkv|docx?|xlsx?|pptx?|csv|txt|rtf|djvu)(\?|#|$)/i;
    const seen = new Map(); r.querySelectorAll("a[href]").forEach((a) => { let u; try { u = new URL(a.getAttribute("href"), base).href; } catch { return; } if (!/^https?:/.test(u) || !re.test(new URL(u).pathname + "?") || seen.has(u)) return; const tail = u.split("/").pop().split("?")[0]; seen.set(u, (a.textContent || "").replace(/\s+/g, " ").trim() || (() => { try { return decodeURIComponent(tail); } catch { return tail; } })()); });
    if (!seen.size) return toast("No linked files (PDF, ebooks, audio, documents) on this page.");
    const rows = [...seen]; const m = modal({ title: `Files linked here (${rows.length})`, wide: true, body: `<p class="muted">Ebooks and comics open as a card where you can add them to your library.</p><div class="kb-list" style="max-height:55vh;overflow:auto">${rows.map(([u, n], i) => `<div class="kb-li" style="display:flex;gap:8px;align-items:center"><span style="flex:1;overflow:hidden;text-overflow:ellipsis"><b>${esc(n.slice(0, 70))}</b><br><small class="muted">${esc(u.split("?")[0].split(".").pop().toUpperCase())} · ${esc(host(u))}</small></span><button class="btn" data-o="${i}">Open</button></div>`).join("")}</div>`, actions: `<button class="btn" type="button" id="fl-c">Copy all links</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-o]"); if (b) { m.close(); go(rows[+b.dataset.o][0]); } }); $("#fl-c", m.root).onclick = () => navigator.clipboard?.writeText(rows.map(([u]) => u).join("\n")).then(() => toast("Links copied."));
  };

  const feeds = async () => {
    const t = T(); if (!t.url) return toast("Open a page first."); const d = t.data?.html ? new DOMParser().parseFromString(t.data.html, "text/html") : null, found = new Map();
    d?.querySelectorAll?.('link[rel~="alternate"][type*="rss"], link[rel~="alternate"][type*="atom"], link[rel~="alternate"][type*="feed+json"]').forEach((l) => { try { found.set(new URL(l.getAttribute("href"), t.url).href, l.getAttribute("title") || "Feed"); } catch {} });
    const o = new URL(t.url).origin, m = modal({ title: "Feeds for this site", wide: true, body: `<p class="muted" id="fd-s">Looking…</p><div class="kb-list" id="fd-l"></div>` });
    const draw = () => { $("#fd-l", m.root).innerHTML = [...found].map(([u, n]) => `<button type="button" class="kb-li" data-u="${esc(u)}"><b>${esc(n)}</b><br><small class="muted">${esc(u)}</small></button>`).join(""); };
    draw(); m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { m.close(); go(b.dataset.u); } });
    for (const p of ["/feed", "/feed/", "/rss", "/rss.xml", "/atom.xml", "/feed.xml", "/index.xml", "/feeds/posts/default"]) {
      if ([...found.keys()].some((u) => u.endsWith(p))) continue;
      try { const r = await get(o + p); if (r.kind === "xml" && /<(rss|feed|rdf)[\s>]/i.test((r.text || "").slice(0, 2000))) { found.set(o + p, "Feed found at " + p); draw(); } } catch {}
      if (!document.body.contains(m.root)) return;
    }
    $("#fd-s", m.root).textContent = found.size ? "Choose one to open it. In the menu, “Follow in Comics” turns a feed into a series." : "No feeds found.";
  };

  const sitemap = async () => {
    const t = T(); if (!t.url) return toast("Open a page first."); const o = new URL(t.url).origin;
    const m = modal({ title: `Sitemap of ${host(t.url)}`, wide: true, body: `<p class="muted" id="sm-s">Reading robots.txt and the sitemap…</p><input class="field" id="sm-q" placeholder="Filter…" style="margin-bottom:8px"><div class="kb-list" id="sm-l" style="max-height:50vh;overflow:auto"></div>` });
    let urls = [];
    const draw = () => { const q = $("#sm-q", m.root).value.toLowerCase(); $("#sm-l", m.root).innerHTML = urls.filter((u) => !q || u.toLowerCase().includes(q)).slice(0, 300).map((u) => `<button type="button" class="kb-li" data-u="${esc(u)}">${esc(u.replace(/^https?:\/\/(www\.)?/, ""))}</button>`).join(""); };
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { m.close(); go(b.dataset.u); } }); $("#sm-q", m.root).oninput = draw;
    try {
      let maps = []; try { const rb = await get(o + "/robots.txt"); maps = [...(rb.text || "").matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((x) => x[1]); } catch {}
      if (!maps.length) maps = [o + "/sitemap.xml", o + "/sitemap_index.xml"];
      const queue = maps.slice(0, 4);
      while (queue.length && urls.length < 2000) {
        const u = queue.shift(); let r; try { r = await get(u); } catch { continue; } const x = r.text || r.html || ""; if (!/<(urlset|sitemapindex)/i.test(x)) continue;
        const locs = [...x.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((y) => y[1].replace(/&amp;/g, "&"));
        if (/<sitemapindex/i.test(x)) queue.push(...locs.slice(0, 4 - 0)); else urls.push(...locs);
        draw();
      }
      $("#sm-s", m.root).textContent = urls.length ? `${plural(urls.length, "page")} listed${urls.length >= 2000 ? " (showing the first part)" : ""}.` : "This site doesn’t publish a sitemap Kitsune can read.";
    } catch { $("#sm-s", m.root).textContent = "Couldn’t read the sitemap."; }
  };

  const robots = () => { const t = T(); if (!t.url) return toast("Open a page first."); go(new URL(t.url).origin + "/robots.txt"); };

  return [
    { label: "Save this page as a file (Markdown, text, HTML)", icon: "download", run: saveAs },
    { label: "Files linked on this page (PDF, ebooks, audio…)", icon: "folder", run: files },
    { label: "Find feeds for this site", icon: "link", run: feeds },
    { label: "Browse this site’s sitemap", icon: "list", run: sitemap },
    { label: "Open this site’s robots.txt", icon: "type", run: robots },
    { label: "Email this link", icon: "link", run: email },
  ];
}
