// Kitsune Browser, v101: compatibility. Rescue the text of pages that are empty without JavaScript (Next.js data,
// JSON-LD, Open Graph), a "try another way" dialog, layout repair, styles on/off, canonical/AMP links, and a
// page compatibility report.
import { $, esc, toast, modal, plural } from "./util.js";

const copy = (t, m) => navigator.clipboard?.writeText(t).then(() => toast(m || "Copied."), () => toast("Couldn’t copy."));
const stripTags = (h) => { const d = new DOMParser().parseFromString(String(h), "text/html"); d.querySelectorAll("script,style").forEach((n) => n.remove()); return (d.body.textContent || "").replace(/\s+/g, " ").trim(); };

// Collect readable things from the data a page ships for its own scripts.
export function embeddedContent(html, url = "") {
  const out = { title: "", description: "", image: "", author: "", date: "", blocks: [], lists: [], kind: "" };
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const meta = (n) => doc.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.getAttribute("content") || "";
  out.title = meta("og:title") || meta("twitter:title") || doc.title || ""; out.description = meta("og:description") || meta("description") || meta("twitter:description") || "";
  out.image = meta("og:image") || meta("twitter:image") || ""; out.author = meta("author") || meta("article:author") || ""; out.date = meta("article:published_time") || "";
  const walk = (v, depth = 0, key = "") => {
    if (depth > 12 || v == null) return;
    if (typeof v === "string") {
      const s = /<\w+[^>]*>/.test(v) ? stripTags(v) : v.trim();
      if (s.length > 90 && /\s/.test(s) && !/^https?:\/\//.test(s) && !/^[\w+/=-]{80,}$/.test(s) && !/[{};]\s*\w+:\s*[\w"']/.test(s.slice(0, 200))) out.blocks.push(s);
      return;
    }
    if (Array.isArray(v)) { v.slice(0, 400).forEach((x) => walk(x, depth + 1, key)); return; }
    if (typeof v === "object") {
      if (/^(Article|NewsArticle|BlogPosting|Recipe|Product|Book|Event|Movie|WebPage|VideoObject)$/.test([].concat(v["@type"] || "").join("|")) || v["@type"]) {
        const t = [].concat(v["@type"] || "")[0]; if (t && !out.kind) out.kind = t;
        if (v.headline || v.name) out.lists.push(["Title", String(v.headline || v.name)]);
        if (v.author) out.author = out.author || [].concat(v.author).map((a) => a?.name || a).join(", ");
        if (v.datePublished) out.date = out.date || v.datePublished;
        if (Array.isArray(v.recipeIngredient)) out.lists.push(["Ingredients", v.recipeIngredient.map(String)]);
        if (Array.isArray(v.recipeInstructions)) out.lists.push(["Method", v.recipeInstructions.map((s) => (typeof s === "string" ? s : s.text || s.name || "")).filter(Boolean)]);
        if (v.offers) { const o = [].concat(v.offers)[0] || {}; if (o.price) out.lists.push(["Price", `${o.priceCurrency || ""} ${o.price}`.trim()]); }
        if (v.aggregateRating) out.lists.push(["Rating", `${v.aggregateRating.ratingValue} (${v.aggregateRating.reviewCount || v.aggregateRating.ratingCount || "?"} reviews)`]);
        if (Array.isArray(v.itemListElement)) out.lists.push(["Items", v.itemListElement.map((x) => x?.name || x?.item?.name || x?.url || "").filter(Boolean).slice(0, 60)]);
      }
      for (const k of Object.keys(v)) { if (/^(@context|image|thumbnail|url|id|slug|css|style|className|class|src|href|path|__N_SSG|buildId|assetPrefix)$/.test(k)) continue; walk(v[k], depth + 1, k); }
    }
  };
  const tryJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => walk(tryJson(s.textContent)));
  const nx = doc.querySelector("script#__NEXT_DATA__"); if (nx) { walk(tryJson(nx.textContent)); }
  doc.querySelectorAll('script[type="application/json"]').forEach((s) => { if (s.id !== "__NEXT_DATA__") walk(tryJson(s.textContent)); });
  const nuxt = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/); if (nuxt) walk(tryJson(nuxt[1]));
  const init = html.match(/window\.__(?:INITIAL_STATE|PRELOADED_STATE|APOLLO_STATE)__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/); if (init) walk(tryJson(init[1]));
  out.blocks = [...new Set(out.blocks)].filter((b) => b.length < 6000).slice(0, 60);
  return out;
}

export function items(c) {
  const { T, root, host, go, setMode, paint, B } = c;
  const needPage = () => { if (!T().url) { toast("Open a page first."); return false; } return true; };

  const rescue = () => {
    const t = T(); if (!needPage()) return; const html = t.data?.html; if (!html) return toast("Nothing loaded to read.");
    const e = embeddedContent(html, t.url);
    if (!e.blocks.length && !e.lists.length && !e.description) return toast("This page has no readable data inside it. Try Live mode.");
    const lists = e.lists.filter(([, v]) => v && (!Array.isArray(v) || v.length));
    const md = [`# ${e.title || host(t.url)}`, e.author && `By ${e.author}`, e.date && e.date.slice(0, 10), e.description, ...lists.map(([k, v]) => (Array.isArray(v) ? `\n## ${k}\n${v.map((x) => `- ${x}`).join("\n")}` : `${k}: ${v}`)), ...e.blocks.map((b) => `\n${b}`)].filter(Boolean).join("\n");
    const m = modal({ title: "Text found inside this page", wide: true, body: `<p class="muted">The page builds itself with JavaScript, so this is what it shipped inside its own data.</p>${e.image ? `<img src="${esc(e.image)}" alt="" style="max-width:100%;max-height:200px;border-radius:8px;margin-bottom:8px">` : ""}<h3 class="h3">${esc(e.title || host(t.url))}</h3>${e.author || e.date ? `<p class="muted">${esc([e.author, e.date.slice(0, 10)].filter(Boolean).join(" · "))}</p>` : ""}${e.description ? `<p><em>${esc(e.description)}</em></p>` : ""}${lists.map(([k, v]) => Array.isArray(v) ? `<h4>${esc(k)}</h4><ul style="padding-left:18px">${v.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join("")}${e.blocks.map((b) => `<p>${esc(b)}</p>`).join("")}`, actions: `<button class="btn" type="button" id="rs-l">Run it live</button><button class="btn" type="button" id="rs-c">Copy as Markdown</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
    $("#rs-c", m.root).onclick = () => copy(md, "Copied.");
    $("#rs-l", m.root).onclick = () => { m.close(); setMode("live"); };
  };

  const another = () => {
    const t = T(); if (!needPage()) return;
    const enc = encodeURIComponent(t.url), opts = [
      ["Run it live (its JavaScript, in a sealed sandbox)", () => setMode("live")],
      ["Reader view", () => setMode("reader")],
      ["Text found inside the page", rescue],
      ["Latest saved copy (Wayback Machine)", () => go("https://web.archive.org/web/2/" + t.url)],
      ["archive.today copy", () => go("https://archive.ph/newest/" + t.url)],
      ["Try with www. toggled", () => { try { const u = new URL(t.url); u.hostname = u.hostname.startsWith("www.") ? u.hostname.slice(4) : "www." + u.hostname; go(u.href); } catch {} }],
      ["Try http instead of https", () => go(t.url.replace(/^https:/, "http:"))],
      ["Try https instead of http", () => go(t.url.replace(/^http:/, "https:"))],
      ["Drop the query string and # part", () => { try { const u = new URL(t.url); u.search = ""; u.hash = ""; go(u.href); } catch {} }],
      ["Go up one folder", () => { try { const u = new URL(t.url); u.pathname = u.pathname.replace(/\/[^/]*\/?$/, "/"); u.search = ""; go(u.href); } catch {} }],
    ];
    const m = modal({ title: "Page not working? Try another way", body: `<div class="kb-list">${opts.map(([l], i) => `<button type="button" class="kb-li" data-o="${i}">${esc(l)}</button>`).join("")}</div>` });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-o]"); if (b) { m.close(); opts[+b.dataset.o][1](); } });
  };

  const style = (id, css) => { const r = root(); if (!r) return false; const old = r.querySelector(`#${id}`); if (old) { old.remove(); return false; } const s = document.createElement("style"); s.id = id; s.textContent = css; r.prepend(s); return true; };
  const fixLayout = () => {
    if (!needPage()) return;
    const on = style("kb-fixlayout", `*{max-width:100%!important;box-sizing:border-box!important;min-width:0!important}img,video,canvas,svg{height:auto!important}table{display:block!important;overflow-x:auto!important}pre,code{white-space:pre-wrap!important;word-break:break-word}.kb-body,.kb-html{overflow-x:hidden!important}*{position:static!important}[style*="width:"]{width:auto!important}`);
    toast(on ? "Layout repaired: everything now fits the screen." : "Layout repair off.");
  };
  const plain = () => {
    if (!needPage()) return; const r = root(); const host_ = r?.getRootNode?.(); const styles = host_ && host_.querySelectorAll ? [...host_.querySelectorAll("style:not(#kb-fixlayout):not(#kb-easy):not(#kb-textonly):not(#kb-linkem)")] : [];
    if (!styles.length) return toast("This page has no styles to turn off.");
    const off = styles[0].media !== "not all"; styles.forEach((s) => { s.media = off ? "not all" : ""; }); toast(off ? "Site styles off: plain HTML." : "Site styles back on.");
  };

  const canonical = () => {
    const t = T(); if (!needPage()) return; const d = t.data?.html ? new DOMParser().parseFromString(t.data.html, "text/html") : null;
    const can = d?.querySelector?.('link[rel="canonical"]')?.getAttribute("href"), amp = d?.querySelector?.('link[rel="amphtml"]')?.getAttribute("href"), alt = d?.querySelector?.('link[rel="alternate"][hreflang]');
    const abs = (u) => { try { return new URL(u, t.url).href; } catch { return ""; } };
    const rows = [can && ["Canonical address", abs(can)], amp && ["AMP version", abs(amp)], ...[...(d?.querySelectorAll?.('link[rel="alternate"][hreflang]') || [])].slice(0, 12).map((l) => [`Language: ${l.getAttribute("hreflang")}`, abs(l.getAttribute("href"))])].filter(Boolean);
    if (!rows.length) return toast("This page doesn’t list other addresses.");
    const m = modal({ title: "Other addresses for this page", wide: true, body: `<div class="kb-list">${rows.map(([k, u]) => `<button type="button" class="kb-li" data-u="${esc(u)}"><b>${esc(k)}</b><br><small class="muted">${esc(u)}</small></button>`).join("")}</div>` });
    m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { m.close(); go(b.dataset.u); } });
  };

  const report = () => {
    const t = T(); if (!needPage()) return; const html = t.data?.html || "", n = (re) => (html.match(re) || []).length;
    const text = (root()?.innerText || "").replace(/\s+/g, " ").trim();
    const rows = [
      ["Scripts the page wanted to run", n(/<script\b/gi)], ["Frames", n(/<iframe\b/gi)], ["Forms", n(/<form\b/gi)], ["Videos", n(/<video\b/gi)], ["Canvas drawings", n(/<canvas\b/gi)], ["Web components", n(/<[a-z]+-[a-z-]+[\s>]/gi)],
      ["Single-page app", /id="__next"|id="root"|id="app"|ng-app|data-reactroot|__NUXT__/i.test(html) ? "Yes" : "No"], ["Embedded data (Next.js, JSON-LD)", /__NEXT_DATA__|ld\+json/i.test(html) ? "Yes" : "No"],
      ["Text visible now", `${plural(text.split(" ").filter(Boolean).length, "word")}`], ["Mode", t.mode],
    ];
    const spa = rows[6][1] === "Yes" && text.length < 400;
    modal({ title: "Page compatibility report", body: `<div class="kb-list">${rows.map(([k, v]) => `<div class="kb-li" style="display:flex;justify-content:space-between"><span>${k}</span><b>${esc(String(v))}</b></div>`).join("")}</div><p style="margin-top:10px">${spa ? "<b>This looks like an app that draws itself.</b> Try “Run it live” or “Text found inside the page”." : "Looks fine in this mode."}</p>`, actions: `<button class="btn" type="button" id="cr-a">Try another way…</button><button class="btn btn-accent" type="button" data-close>Done</button>` }).root.querySelector("#cr-a").onclick = () => { document.querySelector(".modal [data-close]")?.click(); another(); };
  };

  return [
    { label: "Page not working? Try another way…", icon: "globe", run: another },
    { label: "Show text found inside this page (JS-only pages)", icon: "list", run: rescue },
    { label: "Repair layout (fit to screen)", icon: "sliders", run: fixLayout },
    { label: "Site styles on/off (plain HTML)", icon: "type", run: plain },
    { label: "Other addresses: canonical, AMP, languages", icon: "link", run: canonical },
    { label: "Page compatibility report", icon: "list", run: report },
  ];
}
