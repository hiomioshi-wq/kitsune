// Kitsune Browser, v105: the big compatibility pass.
//  - fixDoc: more lazy-loading conventions, CSS background images, external SVG icon sprites, Cloudflare-protected emails,
//    TeX scripts, right-to-left pages, tables that overflow, "skip to content" traps and fixed headers that cover the text.
//  - rewriteUrl: sends links to versions of a site that work without scripts (old Reddit, desktop Wikipedia, un-AMP'd links).
//  - viewSpecial: RSS, Atom, OPML and sitemaps as readable pages, CSV and TSV as sortable tables, calendars as event lists.
//  - rescueCard: the text a script-built page shipped inside its own data, shown right in the page.
import { esc } from "./util.js";

const LAZY_SRC = ["data-src", "data-original", "data-lazy-src", "data-lazy", "data-echo", "data-image", "data-full-url", "data-hi-res-src", "data-pagespeed-lazy-src", "data-lazyload", "data-img", "data-url-img", "data-lazy-original", "data-orig-src", "data-actualsrc", "data-defer-src", "data-flickity-lazyload", "data-large-file", "data-mediumsrc"];
const LAZY_SET = ["data-srcset", "data-lazy-srcset", "data-original-set", "data-lazy-srcset", "data-sizes-srcset"];
const PLACEHOLDER = /^(data:image\/(gif|svg\+xml|png);base64,[A-Za-z0-9+/=]{0,200}$|data:image\/svg\+xml[^"]{0,300}$|about:blank|)$/i;

// Pages that hide everything until their scripts run an animation or remove a loading screen.
export const COMPAT_CSS = `
[data-aos],[data-sal],[data-scroll],[data-animate],[data-reveal],[data-wow],.wow,.reveal-on-scroll,.scroll-reveal,.sr-hidden,.fade-in,.fadein,.fade-up,.fadeInUp,.fadeIn,.animate-on-scroll,.js-reveal,.js-fade,.lazyload,.lazyloading,.lazy-load,.elementor-invisible,[class*="et_pb_animation"],[class*="aos-init"],.gsap-hidden,.is-hidden-until-ready,.hidden-until-loaded{opacity:1!important;visibility:visible!important;transform:none!important;animation:none!important}
#preloader,.preloader,#loader,.loader-wrapper,.page-loader,.loading-screen,.page-preloader,#page-loader,#loading,.site-loader,.splash-screen,#splash,.page-transition,.transition-overlay,.pace,.pace-active,.nprogress-busy #nprogress{display:none!important}
body.loading,body.is-loading,body.preload,body.preloading,.kb-body{opacity:1!important;visibility:visible!important}
body.loading,body.is-loading,body.preload,body.preloading{overflow:visible!important;height:auto!important}
img.lazy,img.lazyload,img.lazyloaded,img[data-src],img[data-lazy-src]{opacity:1!important}
.kb-body pre{max-width:100%;overflow:auto}
`;

const DOM_LIMIT = 70000;

export async function fixDoc(doc, abs, hasUrl = true) {
  let n = 0;
  // 0. old pages: <a name="x"> anchors become ids so #x links work; and absurdly large pages are trimmed
  doc.querySelectorAll("a[name]:not([id])").forEach((a) => { const nm = a.getAttribute("name"); if (nm && !doc.getElementById(nm)) a.id = nm; });
  { let total = doc.getElementsByTagName("*").length;
    if (total > DOM_LIMIT && doc.body) {
      while (total > DOM_LIMIT && doc.body.lastElementChild) { const last = doc.body.lastElementChild; total -= last.getElementsByTagName("*").length + 1; last.remove(); n++; }
      const note = doc.createElement("p"); note.style.cssText = "padding:12px;text-align:center;opacity:.7"; note.textContent = "This page was very large, so Kitsune stopped here. Open it in your usual browser for the rest."; doc.body.append(note);
    } }
  // 1. lazy-loaded media
  doc.querySelectorAll("img, source, video, audio, iframe").forEach((el) => {
    const cur = (el.getAttribute("src") || "").trim(), tag = el.tagName;
    if (!cur || PLACEHOLDER.test(cur) || /(^|\/)(blank|spacer|pixel|placeholder|transparent|loading|lazy)[^/]*\.(gif|png|svg|jpg)/i.test(cur)) {
      const real = LAZY_SRC.map((a) => el.getAttribute(a)).find((v) => v && !PLACEHOLDER.test(v.trim()));
      if (real && /^[\w:./%?&=#+,~@!$*;()\-\s]+$/.test(real.trim().split(/\s+/)[0])) { el.setAttribute("src", real.trim().split(/\s+/)[0]); n++; }
    }
    if (tag === "IMG" || tag === "SOURCE") {
      const set = LAZY_SET.map((a) => el.getAttribute(a)).find(Boolean);
      if (set && (!el.getAttribute("srcset") || PLACEHOLDER.test(el.getAttribute("srcset").trim().split(/\s+/)[0]))) { el.setAttribute("srcset", set); n++; }
    }
    if (tag === "IMG") { el.removeAttribute("loading"); el.setAttribute("referrerpolicy", "no-referrer"); }
    if (tag === "VIDEO" && !el.getAttribute("poster")) { const p = el.getAttribute("data-poster"); if (p) el.setAttribute("poster", p); }
  });
  // 2. background images kept in data attributes
  doc.querySelectorAll("[data-bg], [data-background], [data-background-image], [data-bgset], [data-lazy-background], [data-bg-src]").forEach((el) => {
    const raw = el.getAttribute("data-bg") || el.getAttribute("data-background") || el.getAttribute("data-background-image") || el.getAttribute("data-lazy-background") || el.getAttribute("data-bg-src") || (el.getAttribute("data-bgset") || "").split(/[\s,]+/)[0];
    if (!raw || /gradient\(/.test(el.getAttribute("style") || "")) return;
    const u = (raw.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/) || [])[1] || raw.trim(); if (!/^[\w:./%?&=#+,~@!$*;()\-]+$/.test(u)) return;
    el.setAttribute("style", `${el.getAttribute("style") || ""};background-image:url("${abs(u)}");background-size:cover;background-position:center`); n++;
  });
  // 3. Cloudflare "email protection": the address is XOR-encoded in a data attribute
  const decode = (hex) => { try { const k = parseInt(hex.slice(0, 2), 16); let s = ""; for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ k); return decodeURIComponent(escape(s)); } catch { return ""; } };
  doc.querySelectorAll("[data-cfemail]").forEach((el) => { const e = decode(el.getAttribute("data-cfemail") || ""); if (!e || !/@/.test(e)) return; if (el.tagName === "A") el.setAttribute("href", "mailto:" + e); el.textContent = e; n++; });
  doc.querySelectorAll('a[href*="/cdn-cgi/l/email-protection#"]').forEach((a) => { const e = decode((a.getAttribute("href").split("#")[1] || "")); if (e && /@/.test(e)) { a.setAttribute("href", "mailto:" + e); if (/protected/i.test(a.textContent)) a.textContent = e; n++; } });
  // 4. TeX the page would have typeset with a script: show it as readable code
  doc.querySelectorAll('script[type^="math/tex"]').forEach((s) => { const c = doc.createElement("code"); c.className = "kb-tex"; c.textContent = /mode=display/.test(s.getAttribute("type") || "") ? `\\[ ${s.textContent} \\]` : `\\( ${s.textContent} \\)`; s.replaceWith(c); n++; });
  // 5. right-to-left pages keep their direction
  const dir = doc.documentElement.getAttribute("dir") || doc.body?.getAttribute("dir"); if (dir && doc.body && !doc.body.getAttribute("dir")) doc.body.setAttribute("dir", dir);
  // 6. external SVG icon sprites: <use href="/icons.svg#name"> is blocked across origins, so the symbols are inlined
  const uses = [...doc.querySelectorAll("use")].filter((u) => /^[^#]+#.+/.test(u.getAttribute("href") || u.getAttribute("xlink:href") || ""));
  if (uses.length && hasUrl) {
    const files = new Map();
    for (const u of uses) { const h = u.getAttribute("href") || u.getAttribute("xlink:href"), f = h.split("#")[0]; if (!/^data:/.test(f)) files.set(abs(f), 1); }
    const sheets = await Promise.all([...files.keys()].slice(0, 6).map(async (f) => { try { const r = await fetch("/api/browse/css?url=" + encodeURIComponent(f)); return r.ok ? [f, await r.text()] : null; } catch { return null; } }));
    const holder = doc.createElement("div"); holder.setAttribute("hidden", ""); holder.style.display = "none";
    const have = new Set();
    for (const s of sheets.filter(Boolean)) { const sd = new DOMParser().parseFromString(s[1], "image/svg+xml"); sd.querySelectorAll("symbol, linearGradient, radialGradient, clipPath, mask, pattern").forEach((sym) => { const id = sym.getAttribute("id"); if (id && !have.has(id) && !doc.getElementById(id)) { have.add(id); sym.querySelectorAll("script").forEach((x) => x.remove()); sym.querySelectorAll("*").forEach((el) => { for (const a of [...el.attributes]) if (/^on/i.test(a.name)) el.removeAttribute(a.name); }); for (const a of [...sym.attributes]) if (/^on/i.test(a.name)) sym.removeAttribute(a.name); holder.insertAdjacentHTML("beforeend", `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">${new XMLSerializer().serializeToString(sym)}</svg>`); } }); }
    if (have.size) { doc.body?.prepend(holder); uses.forEach((u) => { const h = u.getAttribute("href") || u.getAttribute("xlink:href"); const id = h.split("#")[1]; if (have.has(id)) { u.setAttribute("href", "#" + id); u.removeAttribute("xlink:href"); } }); n += have.size; }
  }
  return n;
}

export function rewriteUrl(raw) {
  let u; try { u = new URL(raw); } catch { return { url: raw }; }
  const h = u.hostname.replace(/^www\./, ""), p = u.pathname;
  if (/^(www\.|new\.|np\.)?reddit\.com$/.test(u.hostname) && !/^\/(media|gallery|video)/.test(p) && !/^\/r\/[^/]+\/s\//.test(p)) { u.hostname = "old.reddit.com"; return { url: u.href, note: "Opened on old.reddit.com, which works without scripts." }; }
  const mw = h.match(/^([a-z-]+)\.m\.(wikipedia|wikimedia|wiktionary|wikisource|wikibooks)\.org$/); if (mw) { u.hostname = `${mw[1]}.${mw[2]}.org`; return { url: u.href }; }
  const g = u.href.match(/^https:\/\/(?:www\.)?google\.[a-z.]+\/amp\/s\/(.+)$/); if (g) return { url: "https://" + g[1], note: "Opened the page itself instead of its Google AMP copy." };
  if (/\/amp\/?$/.test(p) && !/^\/amp\/?$/.test(p)) { u.pathname = p.replace(/\/amp\/?$/, "/"); return { url: u.href, note: "Opened the normal version of an AMP link." }; }
  if (u.searchParams.has("amp") || u.searchParams.get("outputType") === "amp") { u.searchParams.delete("amp"); u.searchParams.delete("outputType"); return { url: u.href }; }
  const ys = (h === "youtube.com" || h === "m.youtube.com") && p.match(/^\/shorts\/([\w-]{6,})/); if (ys) return { url: `https://www.youtube.com/watch?v=${ys[1]}` };
  if (h === "m.youtube.com") { u.hostname = "www.youtube.com"; return { url: u.href }; }
  if (h === "mobile.twitter.com") { u.hostname = "twitter.com"; return { url: u.href }; }
  return { url: raw };
}

const TEXT = (el, sel) => (el.querySelector(sel)?.textContent || "").trim();
const plain = (h) => { const d = new DOMParser().parseFromString(`<div>${h}</div>`, "text/html"); return (d.body.textContent || "").replace(/\s+/g, " ").trim(); };
const when = (s) => { const d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); };
const frame = (inner, title, count) => `<div class="kb-view kb-special" style="max-width:48rem;margin:0 auto;padding:16px 18px 40px"><div class="kb-jsonbar" style="display:flex;gap:10px;align-items:center;margin-bottom:14px"><strong>${esc(title)}</strong><span class="muted" style="flex:1">${count}</span><button class="btn btn-sm" type="button" id="kbx-raw">Raw</button></div>${inner}</div>`;

export function viewSpecial(t, r, body, go) {
  const type = (r.ctype || "").toLowerCase(), name = r.url.split(/[?#]/)[0].toLowerCase(), text = r.text || "";
  const raw = () => { const b = body.querySelector("#kbx-raw"); if (b) b.onclick = () => { body.innerHTML = `<div class="kb-view kb-text"><pre>${esc(text.slice(0, 400000))}</pre></div>`; }; };
  const links = () => body.querySelectorAll("a[data-go]").forEach((a) => (a.onclick = (e) => { e.preventDefault(); go(a.dataset.go); }));
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "");
  const set = (html, title) => { t.title = title.slice(0, 120); body.innerHTML = html; raw(); links(); return true; };

  // ---- XML: feeds, OPML, sitemaps ----
  if (r.kind === "xml") {
    const d = new DOMParser().parseFromString(text, "text/xml"); if (d.querySelector("parsererror")) return false;
    const rootTag = d.documentElement.localName.toLowerCase();
    if (rootTag === "rss" || rootTag === "feed" || rootTag === "rdf") {
      const atom = rootTag === "feed", ch = atom ? d.documentElement : d.querySelector("channel") || d.documentElement;
      const ftitle = TEXT(ch, "title") || "Feed", fdesc = plain(TEXT(ch, atom ? "subtitle" : "description")).slice(0, 300);
      const items = [...d.querySelectorAll(atom ? "entry" : "item")].slice(0, 200);
      const card = (it) => {
        const title = TEXT(it, "title") || "Untitled"; let link = safeUrl(atom ? (it.querySelector('link[rel="alternate"], link:not([rel])')?.getAttribute("href") || "") : TEXT(it, "link") || TEXT(it, "guid"));
        const date = when(TEXT(it, "pubDate") || TEXT(it, "published") || TEXT(it, "updated") || TEXT(it, "date")), sum = plain(TEXT(it, "description") || TEXT(it, "summary") || TEXT(it, "encoded") || TEXT(it, "content")).slice(0, 320);
        const enc = it.querySelector("enclosure[url], link[rel=enclosure]"), encUrl = safeUrl(enc?.getAttribute("url") || enc?.getAttribute("href") || ""), encType = enc?.getAttribute("type") || "";
        const by = TEXT(it, "author > name") || TEXT(it, "creator") || TEXT(it, "author");
        return `<article style="padding:12px 0;border-bottom:1px solid var(--border,#8884)"><h3 style="margin:0 0 4px;font-size:1.05em">${link ? `<a href="${esc(link)}" data-go="${esc(link)}">${esc(title)}</a>` : esc(title)}</h3><div class="muted" style="font-size:.85em">${esc([date, by].filter(Boolean).join(" · "))}</div>${sum ? `<p style="margin:6px 0 0">${esc(sum)}${sum.length >= 320 ? "…" : ""}</p>` : ""}${encUrl ? `<p style="margin:6px 0 0"><a href="${esc(encUrl)}" data-go="${esc(encUrl)}">${/audio/.test(encType) ? "Audio" : /video/.test(encType) ? "Video" : "Attachment"}: ${esc(encUrl.split("/").pop().split("?")[0].slice(0, 60))}</a></p>` : ""}</article>`;
      };
      return set(frame(`${fdesc ? `<p class="muted">${esc(fdesc)}</p>` : ""}${items.map(card).join("") || "<p>No entries.</p>"}`, ftitle, `${items.length} entries`), ftitle);
    }
    if (rootTag === "urlset" || rootTag === "sitemapindex") {
      const locs = [...d.querySelectorAll("loc")].map((x) => x.textContent.trim()).slice(0, 3000);
      return set(frame(`<input class="field" id="kbx-q" placeholder="Filter…" style="width:100%;margin-bottom:10px"><div id="kbx-l"></div>`, rootTag === "urlset" ? "Sitemap" : "Sitemap index", `${locs.length} addresses`), "Sitemap") && (() => {
        const draw = () => { const q = body.querySelector("#kbx-q").value.toLowerCase(); body.querySelector("#kbx-l").innerHTML = locs.filter((l) => safeUrl(l) && (!q || l.toLowerCase().includes(q))).slice(0, 400).map((l) => `<div style="padding:4px 0;word-break:break-all"><a href="${esc(safeUrl(l))}" data-go="${esc(safeUrl(l))}">${esc(l.replace(/^https?:\/\/(www\.)?/, ""))}</a></div>`).join(""); links(); };
        body.querySelector("#kbx-q").oninput = draw; draw(); return true;
      })();
    }
    if (rootTag === "opml") {
      const rows = [...d.querySelectorAll("outline")].map((o) => ({ t: o.getAttribute("title") || o.getAttribute("text") || "", x: o.getAttribute("xmlUrl") || "", h: o.getAttribute("htmlUrl") || "" })).filter((o) => o.t);
      return set(frame(rows.map((o) => { const x = safeUrl(o.x), h = safeUrl(o.h); return `<div style="padding:6px 0"><b>${esc(o.t)}</b>${x ? ` · <a href="${esc(x)}" data-go="${esc(x)}">feed</a>` : ""}${h ? ` · <a href="${esc(h)}" data-go="${esc(h)}">site</a>` : ""}</div>`; }).join(""), "Subscriptions (OPML)", `${rows.length} items`), "OPML");
    }
    return false;
  }
  if (r.kind !== "text") return false;

  // ---- CSV / TSV ----
  if (/csv|tab-separated/.test(type) || /\.(csv|tsv)$/.test(name)) {
    const delim = /tsv|tab-separated/.test(type) || /\.tsv$/.test(name) ? "\t" : (text.slice(0, 2000).split(";").length > text.slice(0, 2000).split(",").length ? ";" : ",");
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length && rows.length < 5001; i++) { const ch = text[i]; if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; } else if (ch === '"' && !cell.trim()) { q = true; cell = ""; } else if (ch === delim) { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; } else cell += ch; }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    rows.forEach((rw) => rw.forEach((c, i) => { rw[i] = c.trim() === c ? c : c.replace(/^\s+|\s+$/g, ""); }));
    if (rows.length < 2 || rows[0].length < 2) return false;
    const head = rows[0], data = rows.slice(1).filter((x) => x.some((c) => c.trim()));
    set(frame(`<input class="field" id="kbx-q" placeholder="Filter rows…" style="width:100%;margin-bottom:10px"><div style="overflow:auto;max-height:75vh"><table class="kb-csv" style="border-collapse:collapse;width:100%"><thead id="kbx-h"></thead><tbody id="kbx-b"></tbody></table></div>`, name.split("/").pop() || "Table", `${data.length} rows × ${head.length} columns`), name.split("/").pop() || "Table");
    let sortCol = -1, asc = true, q2 = "";
    const draw = () => {
      let v = data.filter((rw) => !q2 || rw.some((c) => c.toLowerCase().includes(q2))); if (sortCol >= 0) v = [...v].sort((a, b) => { const x = a[sortCol] || "", y = b[sortCol] || "", nx = parseFloat(x.replace(/[,$%]/g, "")), ny = parseFloat(y.replace(/[,$%]/g, "")); const c = !isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y); return asc ? c : -c; });
      body.querySelector("#kbx-h").innerHTML = `<tr>${head.map((hd, i) => `<th data-c="${i}" style="position:sticky;top:0;background:var(--surface,#222);cursor:pointer;text-align:left;padding:6px 10px;border-bottom:2px solid var(--border,#888)">${esc(hd)}${sortCol === i ? (asc ? " ▲" : " ▼") : ""}</th>`).join("")}</tr>`;
      body.querySelector("#kbx-b").innerHTML = v.slice(0, 1000).map((rw) => `<tr>${head.map((_, i) => `<td style="padding:5px 10px;border-bottom:1px solid var(--border,#8884)">${/^https?:\/\/\S+$/.test(rw[i] || "") ? `<a href="${esc(rw[i])}" data-go="${esc(rw[i])}">${esc(rw[i])}</a>` : esc(rw[i] || "")}</td>`).join("")}</tr>`).join(""); links();
    };
    body.querySelector("#kbx-q").oninput = (e) => { q2 = e.target.value.toLowerCase(); draw(); };
    body.querySelector("#kbx-h").onclick = (e) => { const th = e.target.closest("[data-c]"); if (!th) return; const c = +th.dataset.c; asc = sortCol === c ? !asc : true; sortCol = c; draw(); };
    draw(); return true;
  }
  // ---- calendar files ----
  if (/calendar/.test(type) || /\.ics$/.test(name)) {
    const ev = text.split("BEGIN:VEVENT").slice(1).map((b) => { const g = (k) => ((b.match(new RegExp(`^${k}[^:\\n]*:(.*)$`, "m")) || [])[1] || "").replace(/\\n/g, " ").replace(/\\,/g, ",").trim(); const ds = g("DTSTART"); const d = ds ? new Date(`${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}${ds.length > 8 ? `T${ds.slice(9, 11)}:${ds.slice(11, 13)}` : ""}`) : null; return { s: g("SUMMARY"), d, l: g("LOCATION"), x: g("DESCRIPTION").slice(0, 240) }; }).filter((e) => e.s);
    if (!ev.length) return false;
    return set(frame(ev.sort((a, b) => (a.d || 0) - (b.d || 0)).map((e) => `<article style="padding:10px 0;border-bottom:1px solid var(--border,#8884)"><b>${esc(e.s)}</b><div class="muted">${e.d && !isNaN(e.d) ? esc(e.d.toLocaleString(undefined, { dateStyle: "full", timeStyle: /T/.test("") ? undefined : undefined })) : ""}${e.l ? " · " + esc(e.l) : ""}</div>${e.x ? `<p style="margin:4px 0 0">${esc(e.x)}</p>` : ""}</article>`).join(""), "Calendar", `${ev.length} events`), "Calendar");
  }
  // ---- vCard contacts ----
  if (/vcard/i.test(type) || /\.vcf$/.test(name)) {
    const cards = text.split("BEGIN:VCARD").slice(1).map((b) => { const g = (k) => { const m = [...b.matchAll(new RegExp(`^${k}([^:\\n]*):(.*)$`, "gm"))]; return (m[0]?.[2] || "").replace(/\\,/g, ",").replace(/\\n/g, " ").trim() || (m.filter((x) => /^CHARSET=UTF-8/i.test(x[1])).pop()?.[2] || ""); }; return { n: g("FN") || g("N"), t: g("TITLE"), o: g("ORG"), e: g("EMAIL"), p: g("TEL"), u: g("URL"), a: g("ADR") }; }).filter((c) => c.n || c.e);
    if (!cards.length) return false;
    return set(frame(cards.slice(0, 400).map((c) => `<article style="padding:12px 0;border-bottom:1px solid var(--border,#8884)"><b>${esc(c.n || "Unnamed")}</b>${c.t || c.o ? `<div class="muted">${esc([c.t, c.o].filter(Boolean).join(" · "))}</div>` : ""}<div style="margin:4px 0 0">${c.e ? `<div>✉ <a href="mailto:${esc(c.e)}">${esc(c.e)}</a></div>` : ""}${c.p ? `<div>☎ <a href="tel:${esc(c.p.replace(/[^+\d]/g, ""))}">${esc(c.p)}</a></div>` : ""}${c.u ? `<div>🔗 <a href="${esc(/^https?:/.test(c.u) ? c.u : "https://" + c.u)}" data-go="${esc(/^https?:/.test(c.u) ? c.u : "https://" + c.u)}">${esc(c.u)}</a></div>` : ""}${c.a ? `<div class="muted">📍 ${esc(c.a.replace(/;/g, ", ").replace(/(, )+/g, ", "))}</div>` : ""}</div></article>`).join(""), "Contacts", `${cards.length} cards`), "Contacts");
  }
  // ---- subtitle files as a readable transcript ----
  if (/(x-)?subrip|vtt/.test(type) || /\.(srt|vtt)$/.test(name)) {
    const cues = text.replace(/^WEBVTT.*$/m, "").split(/\r?\n\r?\n/).map((b) => { const m = b.match(/(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/); if (!m) return null; const txt = b.slice(b.indexOf(m[0]) + m[0].length).replace(/<[^>]+>/g, "").split(/\r?\n/).filter((x) => x.trim() && !/^\d+$/.test(x.trim())); return { a: m[1].replace(",", "."), t: txt.join(" ") }; }).filter(Boolean);
    if (cues.length < 1) return false;
    return set(frame(cues.slice(0, 4000).map((c) => `<div style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid var(--border,#8882)"><span class="muted" style="font-variant-numeric:tabular-nums;min-width:74px">${esc(c.a)}</span><span style="flex:1">${esc(c.t)}</span></div>`).join(""), "Transcript", `${cues.length} lines · ends at ${cues[cues.length - 1].a}`), "Transcript");
  }
  // ---- GeoJSON as a list of places ----
  if (/geojson/.test(type) || /\.geojson$/.test(name)) {
    let j; try { j = JSON.parse(text); } catch { return false; }
    const feats = (j.features || []).filter((f) => f.geometry?.coordinates).slice(0, 500);
    if (!feats.length) return false;
    return set(frame(feats.map((f) => { const c = f.geometry.coordinates, [lon, lat] = Array.isArray(c[0]) ? (f.geometry.type === "MultiPoint" ? c[0] : c[0][0]) : c; return `<article style="padding:10px 0;border-bottom:1px solid var(--border,#8884)"><b>${esc(f.properties?.name || f.properties?.title || "Place")}</b><div class="muted">${esc(f.geometry.type)}${lat != null && lon != null ? ` · ${(+lat).toFixed(4)}, ${(+lon).toFixed(4)}` : ""}</div>${lat != null && lon != null ? `<a href="https://www.openstreetmap.org/?mlat=${+lat}&mlon=${+lon}#map=13/${+lat}/${+lon}" data-go="https://www.openstreetmap.org/?mlat=${+lat}&mlon=${+lon}#map=13/${+lat}/${+lon}">Open in OpenStreetMap</a>` : ""}</article>`; }).join(""), "GeoJSON", `${feats.length} features`), "GeoJSON");
  }
  return false;
}

// What a script-built page shipped in its own data, as a card inside the page.
export function rescueCard(e, host) {
  const lists = e.lists.filter(([, v]) => v && (!Array.isArray(v) || v.length));
  if (!e.blocks.length && !lists.length) return "";
  return `<details open class="kb-rescue" style="margin:14px auto;max-width:46rem;padding:12px 16px;border:1px solid var(--border,#8886);border-radius:10px;background:var(--surface,#8881)"><summary style="cursor:pointer;font-weight:600">Text found inside this page</summary>${e.title ? `<h3>${esc(e.title)}</h3>` : ""}${e.author || e.date ? `<p class="muted">${esc([e.author, (e.date || "").slice(0, 10)].filter(Boolean).join(" · "))}</p>` : ""}${e.description ? `<p><em>${esc(e.description)}</em></p>` : ""}${lists.map(([k, v]) => Array.isArray(v) ? `<h4>${esc(k)}</h4><ul>${v.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join("")}${e.blocks.slice(0, 30).map((b) => `<p>${esc(b)}</p>`).join("")}</details>`;
}
