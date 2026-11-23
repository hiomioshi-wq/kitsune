// Kitsune Browser, v113: tools for looking under a page's hood. What a site is built with, how its link previews
// will look when shared (Open Graph, Twitter cards, structured data), which of its links are broken, its source with
// colours and line numbers, a page-weight report, and a JWT / URL / Base64 decoder.
import { $, esc, toast, modal } from "./util.js";

const doc = (t) => (t.data?.html ? new DOMParser().parseFromString(t.data.html, "text/html") : null);
const abs = (u, base) => { try { return new URL(u, base).href; } catch { return ""; } };

// ---------- what a site is built with ----------
const TECH = [
  ["WordPress", (h, d) => /wp-content|wp-includes/.test(h) || /WordPress/i.test(gen(d))], ["Drupal", (h, d) => /Drupal/i.test(gen(d)) || /drupal-settings-json|\/sites\/default\/files/.test(h)], ["Joomla", (h, d) => /Joomla/i.test(gen(d))],
  ["Ghost", (h, d) => /Ghost/i.test(gen(d))], ["Hugo", (h, d) => /Hugo/i.test(gen(d))], ["Jekyll", (h, d) => /Jekyll/i.test(gen(d))], ["Gatsby", (h) => /___gatsby/.test(h)], ["Docusaurus", (h, d) => /Docusaurus/i.test(gen(d)) || /docusaurus/.test(h)],
  ["MediaWiki", (h, d) => /MediaWiki/i.test(gen(d))], ["Discourse", (h, d) => /Discourse/i.test(gen(d))], ["Shopify", (h) => /cdn\.shopify\.com|Shopify\.theme/.test(h)], ["Squarespace", (h) => /squarespace\.com|static1\.squarespace/.test(h)],
  ["Wix", (h) => /wix\.com|wixstatic\.com/.test(h)], ["Webflow", (h) => /webflow\.(com|io)|data-wf-page/.test(h)], ["Substack", (h) => /substackcdn\.com/.test(h)], ["Medium", (h) => /medium\.com\/_\/|miro\.medium\.com/.test(h)],
  ["Next.js", (h) => /__NEXT_DATA__|\/_next\/static/.test(h)], ["Nuxt", (h) => /__NUXT__|\/_nuxt\//.test(h)], ["React", (h) => /react(-dom)?(\.production)?(\.min)?\.js|data-reactroot|__REACT/.test(h)], ["Vue", (h) => /vue(\.runtime)?(\.global)?(\.prod)?(\.min)?\.js|data-v-[0-9a-f]{6,}/.test(h)],
  ["Angular", (h) => /ng-version=|angular(\.min)?\.js/.test(h)], ["Svelte / SvelteKit", (h) => /svelte-[a-z0-9]{5,}|__sveltekit/.test(h)], ["Astro", (h) => /astro-island|data-astro-cid/.test(h)], ["Remix", (h) => /__remixContext/.test(h)],
  ["jQuery", (h) => /jquery(-\d[\d.]*)?(\.min)?\.js/i.test(h)], ["Bootstrap", (h) => /bootstrap(\.bundle)?(\.min)?\.(css|js)/.test(h)], ["Tailwind CSS", (h) => /tailwind|class="[^"]*\b(?:px|py|mt|mb)-\d+\b[^"]*\b(?:text|bg)-[a-z]+-\d{3}\b/.test(h)], ["Font Awesome", (h) => /font-?awesome/i.test(h)],
  ["Google Fonts", (h) => /fonts\.googleapis\.com/.test(h)], ["Google Analytics / Tag Manager", (h) => /googletagmanager\.com|google-analytics\.com|gtag\(/.test(h)], ["Plausible", (h) => /plausible\.io\/js/.test(h)], ["Matomo", (h) => /matomo|piwik/i.test(h)],
  ["Meta Pixel", (h) => /connect\.facebook\.net\/[^"']*fbevents/.test(h)], ["Hotjar", (h) => /hotjar\.com/.test(h)], ["Cloudflare", (h) => /cdnjs\.cloudflare\.com|cloudflareinsights|__cf_/.test(h)], ["reCAPTCHA / hCaptcha", (h) => /recaptcha|hcaptcha/.test(h)],
  ["Stripe", (h) => /js\.stripe\.com/.test(h)], ["Intercom", (h) => /intercom(cdn)?\.(io|com)/.test(h)], ["Disqus", (h) => /disqus\.com/.test(h)], ["Service worker / PWA", (h) => /serviceWorker\.register|rel=["']manifest/.test(h)],
];
const gen = (d) => d?.querySelector('meta[name="generator"]')?.getAttribute("content") || "";
function techStack(t) {
  const h = t.data?.html || "", d = doc(t); if (!h) return toast("Open a page first.");
  const found = TECH.filter(([, f]) => { try { return f(h, d); } catch { return false; } }).map(([n]) => n);
  const g = gen(d), scripts = d.querySelectorAll("script[src]").length, styles = d.querySelectorAll('link[rel~="stylesheet"]').length;
  modal({ title: "What this site is built with", body: `${found.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${found.map((n) => `<span class="pill">${esc(n)}</span>`).join("")}</div>` : `<p class="muted">Nothing recognisable. It may be hand-written, or built with tools that leave no trace.</p>`}
    <p class="muted" style="font-size:13px;margin-top:12px">${g ? `Generator tag: <b>${esc(g)}</b> · ` : ""}${scripts} external scripts · ${styles} stylesheets · ${(h.length / 1024).toFixed(0)} KB of HTML</p><p class="hint">Detected from the page's HTML only, so it's a good guess, not a certainty.</p>` });
}

// ---------- link previews and structured data ----------
function metaInspector(t) {
  const d = doc(t); if (!d) return toast("Open a page first.");
  const m = (k) => d.querySelector(`meta[property="${k}"], meta[name="${k}"]`)?.getAttribute("content") || "";
  const title = m("og:title") || m("twitter:title") || d.title || "", desc = m("og:description") || m("twitter:description") || m("description"), img = abs(m("og:image") || m("twitter:image"), t.url), site = m("og:site_name") || new URL(t.url).hostname;
  const all = [...d.querySelectorAll("meta[property], meta[name]")].map((x) => [x.getAttribute("property") || x.getAttribute("name"), x.getAttribute("content") || ""]).filter(([k]) => /^(og:|twitter:|article:|description|keywords|author|robots|theme-color|viewport|generator|application-name)/i.test(k));
  const ld = [...d.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.stringify(JSON.parse(s.textContent), null, 2); } catch { return s.textContent.trim(); } });
  const problems = [!m("og:title") && "No og:title (shares fall back to the page title).", !m("og:image") && "No og:image, so shared links have no picture.", !desc && "No description.", desc.length > 200 && "The description is long; most sites cut it near 160 characters.", !d.querySelector('link[rel="canonical"]') && "No canonical address."].filter(Boolean);
  modal({ title: "Link preview and metadata", wide: true, body: `<p class="eyebrow" style="margin:0 0 6px">How a shared link will look</p>
    <div style="border:1px solid rgba(127,127,160,.35);border-radius:12px;overflow:hidden;max-width:520px">${img ? `<img src="${esc(img)}" alt="" style="width:100%;max-height:270px;object-fit:cover;display:block" referrerpolicy="no-referrer">` : `<div style="height:80px;display:grid;place-items:center;background:rgba(127,127,160,.15)" class="muted">no picture</div>`}<div style="padding:10px 12px"><small class="muted">${esc(site)}</small><div style="font-weight:700">${esc(title)}</div><div class="muted" style="font-size:13px">${esc(desc.slice(0, 200))}</div></div></div>
    ${problems.length ? `<p class="eyebrow" style="margin:16px 0 4px">Worth fixing</p><ul style="margin:0">${problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : `<p class="muted" style="margin-top:12px">✓ The basics are all there.</p>`}
    <p class="eyebrow" style="margin:16px 0 4px">Meta tags (${all.length})</p><table style="font-size:13px;border-collapse:collapse;width:100%">${all.map(([k, v]) => `<tr><td style="padding:3px 8px;border-bottom:1px solid rgba(127,127,160,.2);white-space:nowrap;vertical-align:top"><code>${esc(k)}</code></td><td style="padding:3px 8px;border-bottom:1px solid rgba(127,127,160,.2);word-break:break-word">${esc(v)}</td></tr>`).join("")}</table>
    ${ld.length ? `<p class="eyebrow" style="margin:16px 0 4px">Structured data (${ld.length} JSON-LD block${ld.length > 1 ? "s" : ""})</p>${ld.map((j) => `<pre style="max-height:220px;overflow:auto;padding:10px;border-radius:8px;background:rgba(127,127,160,.12);font:12px/1.5 ui-monospace,Menlo,monospace">${esc(j.slice(0, 20000))}</pre>`).join("")}` : ""}` });
}

// ---------- broken links ----------
async function linkChecker(t, root) {
  const base = t.url; if (!base) return;
  const links = [...new Set([...(root?.querySelectorAll("a[href]") || [])].map((a) => abs(a.getAttribute("href"), base)).filter((u) => /^https?:/.test(u)).map((u) => u.replace(/#.*$/, "")))].slice(0, 80);
  if (!links.length) return toast("This page has no links to check.");
  const m = modal({ title: `Checking ${links.length} links`, wide: true, body: `<p class="status" id="lc-s">Checking…</p><div style="display:flex;gap:6px;margin-bottom:8px"><button class="btn btn-sm" type="button" data-f="all">All</button><button class="btn btn-sm" type="button" data-f="bad">Problems only</button></div><div id="lc-l" style="max-height:55vh;overflow:auto;font-size:13px"></div>` });
  const res = new Map(); let i = 0, filter = "all";
  const draw = () => { const done = res.size, bad = [...res.values()].filter((r) => !r.ok).length; $("#lc-s", m.root).textContent = `${done} of ${links.length} checked · ${bad} problem${bad === 1 ? "" : "s"}${done < links.length ? "…" : ""}`; $("#lc-l", m.root).innerHTML = links.filter((u) => res.has(u) && (filter === "all" || !res.get(u).ok)).map((u) => { const r = res.get(u); return `<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid rgba(127,127,160,.15)"><b style="min-width:46px;color:${r.ok ? "#3fa66a" : "#e5534b"}">${esc(String(r.code))}</b><a href="${esc(u)}" target="_blank" rel="noopener" style="word-break:break-all">${esc(u)}</a>${r.moved ? `<span class="muted">→ ${esc(r.moved)}</span>` : ""}</div>`; }).join(""); };
  m.root.onclick = (e) => { const f = e.target.closest("[data-f]")?.dataset.f; if (f) { filter = f; draw(); } };
  const work = async () => { while (i < links.length && m.root.isConnected) { const u = links[i++]; try { const r = await (await fetch("/api/browse?url=" + encodeURIComponent(u))).json(); const code = r.status || (r.error ? "error" : 200); res.set(u, { code, ok: typeof code === "number" && code < 400, moved: r.url && r.url.replace(/\/$/, "") !== u.replace(/\/$/, "") ? r.url : "" }); } catch { res.set(u, { code: "error", ok: false }); } draw(); } };
  await Promise.all([work(), work(), work(), work()]);
}

// ---------- source with colours ----------
async function sourceView(t) {
  const h = t.data?.html || t.data?.text; if (!h) return toast("Open a page first.");
  const { highlightCode } = await import("./webcode.js").then((m) => ({ highlightCode: m.highlightCode })).catch(() => ({}));
  const lines = h.slice(0, 600000).split("\n");
  const m = modal({ title: "Page source", wide: true, body: `<div style="display:flex;gap:8px;margin-bottom:8px"><input class="field" id="sv-q" type="search" placeholder="Find in source" style="flex:1"><button class="btn btn-sm" type="button" id="sv-copy">Copy</button><button class="btn btn-sm" type="button" id="sv-wrap">Wrap</button></div><p class="status" id="sv-s" style="margin:0 0 6px"></p>
    <pre id="sv-o" class="kbc-hl" style="max-height:62vh;overflow:auto;margin:0;padding:10px;border-radius:8px;background:rgba(127,127,160,.1);font:12px/1.5 ui-monospace,Menlo,monospace"></pre>` });
  const o = $("#sv-o", m.root);
  o.innerHTML = lines.map((l, i) => `<div data-l="${i}"><span style="display:inline-block;width:4em;opacity:.4;text-align:right;margin-right:1em;user-select:none">${i + 1}</span>${highlightCode ? highlightCode(l, "html") : esc(l)}</div>`).join("");
  o.insertAdjacentHTML("beforebegin", `<style>pre.kbc-hl i.c{color:#6a737d}pre.kbc-hl i.s{color:#22863a;font-style:normal}pre.kbc-hl b.k{color:#d73a49}pre.kbc-hl b.a{color:#6f42c1;font-weight:400}#sv-o.wrap div{white-space:pre-wrap;word-break:break-all}#sv-o mark{background:#ffe066;color:#000}</style>`);
  $("#sv-copy", m.root).onclick = () => navigator.clipboard?.writeText(h).then(() => toast("Source copied."));
  $("#sv-wrap", m.root).onclick = () => o.classList.toggle("wrap");
  let tm; $("#sv-q", m.root).oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { const q = e.target.value.toLowerCase(); $$all(o, "div.hit").forEach((d) => d.classList.remove("hit")); if (q.length < 2) { $("#sv-s", m.root).textContent = ""; return; } const hits = lines.map((l, i) => (l.toLowerCase().includes(q) ? i : -1)).filter((i) => i >= 0); $("#sv-s", m.root).textContent = `${hits.length} line${hits.length === 1 ? "" : "s"} match`; hits.slice(0, 500).forEach((i) => { const d = o.children[i]; if (d) d.style.background = "rgba(255,224,102,.25)"; }); o.children[hits[0]]?.scrollIntoView({ block: "center" }); }, 200); };
}
const $$all = (r, s) => [...r.querySelectorAll(s)];

// ---------- page weight ----------
function pageWeight(t) {
  const d = doc(t), h = t.data?.html || ""; if (!d) return toast("Open a page first.");
  const c = (s) => d.querySelectorAll(s).length, inlineJs = [...d.querySelectorAll("script:not([src])")].reduce((a, s) => a + s.textContent.length, 0), inlineCss = [...d.querySelectorAll("style")].reduce((a, s) => a + s.textContent.length, 0);
  const third = new Set([...d.querySelectorAll("script[src], link[href], img[src], iframe[src]")].map((e) => { try { return new URL(e.getAttribute("src") || e.getAttribute("href"), t.url).hostname; } catch { return ""; } }).filter((x) => x && x !== new URL(t.url).hostname));
  const kb = (n) => (n / 1024).toFixed(1) + " KB";
  const rows = [["HTML", kb(h.length)], ["Inline scripts", kb(inlineJs)], ["Inline styles", kb(inlineCss)], ["External scripts", c("script[src]")], ["Stylesheets", c('link[rel~="stylesheet"]')], ["Images", c("img")], ["Iframes", c("iframe")], ["Elements", c("*")], ["Deepest nesting", (() => { let m = 0; const w = (n, dd) => { if (dd > m) m = dd; for (const k of n.children) w(k, dd + 1); }; w(d.documentElement, 0); return m; })()], ["Other sites contacted", third.size]];
  modal({ title: "Page weight", body: `<table style="width:100%;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:4px 0">${k}</td><td style="text-align:right"><b>${esc(String(v))}</b></td></tr>`).join("")}</table>${third.size ? `<p class="eyebrow" style="margin:14px 0 4px">Other sites</p><p class="muted" style="font-size:13px;word-break:break-word">${[...third].slice(0, 60).map(esc).join(" · ")}</p>` : ""}<p class="hint">Counted from the page's HTML. Kitsune itself doesn't run the scripts, so it loads lighter than this.</p>` });
}

// ---------- decoders ----------
function decoder() {
  const m = modal({ title: "Decode: JWT, URL, Base64, timestamps", wide: true, body: `<textarea class="field" id="dc-i" spellcheck="false" placeholder="Paste a JWT, an encoded URL, Base64 text or a Unix timestamp" style="width:100%;min-height:110px;font:12.5px/1.5 ui-monospace,Menlo,monospace"></textarea><div id="dc-o" style="margin-top:10px"></div>` });
  const b64 = (s) => { s = s.replace(/-/g, "+").replace(/_/g, "/"); s += "=".repeat((4 - (s.length % 4)) % 4); return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0))); };
  const pre = (label, text) => `<p class="eyebrow" style="margin:10px 0 4px">${label}</p><pre style="margin:0;padding:10px;border-radius:8px;background:rgba(127,127,160,.12);font:12.5px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-all">${esc(text)}</pre>`;
  $("#dc-i", m.root).oninput = (e) => {
    const s = e.target.value.trim(), out = [];
    if (/^[\w-]+\.[\w-]+\.[\w-]*$/.test(s)) { try { const [h, p] = s.split("."), hj = JSON.parse(b64(h)), pj = JSON.parse(b64(p)); out.push(pre("JWT header", JSON.stringify(hj, null, 2)), pre("JWT payload", JSON.stringify(pj, null, 2))); for (const k of ["iat", "nbf", "exp"]) if (pj[k]) out.push(`<p class="muted" style="margin:4px 0;font-size:13px">${k}: ${new Date(pj[k] * 1000).toLocaleString()}${k === "exp" ? (pj.exp * 1000 < Date.now() ? " (expired)" : " (still valid)") : ""}</p>`); out.push(`<p class="hint">Decoded on this device. The signature isn't checked.</p>`); } catch {} }
    if (/%[0-9a-f]{2}/i.test(s)) { try { out.push(pre("URL-decoded", decodeURIComponent(s.replace(/\+/g, " ")))); } catch {} }
    if (/^https?:\/\//.test(s)) { try { const u = new URL(s); out.push(pre("URL parts", [`protocol: ${u.protocol}`, `host: ${u.host}`, `path: ${u.pathname}`, ...[...u.searchParams].map(([k, v]) => `?${k} = ${v}`), u.hash ? `hash: ${u.hash}` : ""].filter(Boolean).join("\n"))); } catch {} }
    if (/^[A-Za-z0-9+/_-]{8,}={0,2}$/.test(s) && !/^\d+$/.test(s)) { try { const t = b64(s); if (!/[\x00-\x08\x0e-\x1f]/.test(t)) out.push(pre("Base64-decoded", t)); } catch {} }
    if (/^\d{9,13}$/.test(s)) { const n = +s, d = new Date(s.length > 11 ? n : n * 1000); out.push(pre("Timestamp", `${d.toString()}\n${d.toISOString()}`)); }
    if (s && !/[^\x20-\x7e]/.test(s)) out.push(pre("Base64-encoded", btoa(unescape(encodeURIComponent(s)))), pre("URL-encoded", encodeURIComponent(s)));
    $("#dc-o", m.root).innerHTML = out.join("") || (s ? `<p class="muted">Nothing to decode there.</p>` : "");
  };
}

export function items({ T, root }) {
  return [
    { label: "What is this site built with?", icon: "info", run: () => techStack(T()) },
    { label: "Link preview and metadata (Open Graph, JSON-LD)", icon: "share", run: () => metaInspector(T()) },
    { label: "Check for broken links", icon: "link", run: () => linkChecker(T(), root()) },
    { label: "Page source with colours and line numbers", icon: "type", run: () => sourceView(T()) },
    { label: "Page weight (size, scripts, other sites)", icon: "chart", run: () => pageWeight(T()) },
    { label: "Decode: JWT, URL, Base64, timestamps…", icon: "key", run: decoder },
  ];
}
