// Kitsune Browser, v146: five more page tools.
//  - every time a page mentions ("9:30 ET", "14:00 GMT+2", "8 a.m.", "noon") shown as your own local time, jump-to included
//  - one pull-quote per heading (the first sentence under it); a read-only list of every form field with its label;
//    the years and dates on a page laid out as a timeline with their sentences; and nested lists flattened to one indented text file
import { $, esc, toast, modal, plural } from "./util.js";

const page = (root, t) => (root && root.querySelectorAll ? root : t?.doc);
const copy = (text, msg) => navigator.clipboard?.writeText(text).then(() => toast(msg || "Copied."), () => toast("Couldn't copy."));
const download = (name, text, type = "text/plain") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
const jump = (el) => { if (!el?.scrollIntoView) return; el.scrollIntoView({ behavior: "smooth", block: "center" }); const o = el.style.outline; el.style.outline = "3px solid #ffd43b"; setTimeout(() => (el.style.outline = o), 1800); };
const eachText = (doc, fn, cap = 5000) => { if (!doc || !document.createTreeWalker) return; const w = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement?.closest("script,style,noscript,svg,textarea,select,code,pre,samp,kbd") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) }); let x, i = 0; while ((x = w.nextNode()) && i++ < cap) fn(x); };

// ---------- local time everywhere ----------
const TZ_ABBR = "UTC|GMT|EST|EDT|CST|CDT|MST|MDT|PST|PDT|AKST|AKDT|HST|BST|CET|CEST|WET|WEST|EET|EEST|MSK|IST|JST|KST|SGT|HKT|AEST|AEDT|ACST|AWST|NZST|NZDT|BRT|ART|CAT|SAST|WAT|EAT|ET|CT|MT|PT";
const ZONES = { UTC: "UTC", GMT: "UTC", EST: "America/New_York", EDT: "America/New_York", ET: "America/New_York", CST: "America/Chicago", CDT: "America/Chicago", CT: "America/Chicago", MST: "America/Denver", MDT: "America/Denver", MT: "America/Denver", PST: "America/Los_Angeles", PDT: "America/Los_Angeles", PT: "America/Los_Angeles", AKST: "America/Anchorage", AKDT: "America/Anchorage", HST: "Pacific/Honolulu", BST: "Europe/London", CET: "Europe/Paris", CEST: "Europe/Paris", WET: "Europe/Lisbon", WEST: "Europe/Lisbon", EET: "Europe/Helsinki", EEST: "Europe/Helsinki", MSK: "Europe/Moscow", IST: "Asia/Kolkata", JST: "Asia/Tokyo", KST: "Asia/Seoul", SGT: "Asia/Singapore", HKT: "Asia/Hong_Kong", AEST: "Australia/Sydney", AEDT: "Australia/Sydney", ACST: "Australia/Adelaide", AWST: "Australia/Perth", NZST: "Pacific/Auckland", NZDT: "Pacific/Auckland", BRT: "America/Sao_Paulo", ART: "America/Argentina/Buenos_Aires", CAT: "Africa/Harare", SAST: "Africa/Johannesburg", WAT: "Africa/Lagos", EAT: "Africa/Nairobi" };
const PICK_ZONES = [["UTC", "UTC (the page means UTC)"], ["America/New_York", "New York (ET)"], ["America/Chicago", "Chicago (CT)"], ["America/Denver", "Denver (MT)"], ["America/Los_Angeles", "Los Angeles (PT)"], ["Europe/London", "London"], ["Europe/Paris", "Paris"], ["Europe/Moscow", "Moscow"], ["Asia/Kolkata", "India"], ["Asia/Tokyo", "Tokyo"], ["Asia/Seoul", "Seoul"], ["Asia/Singapore", "Singapore"], ["Asia/Hong_Kong", "Hong Kong"], ["Australia/Sydney", "Sydney"], ["Pacific/Auckland", "Auckland"], ["America/Sao_Paulo", "São Paulo"], ["Africa/Johannesburg", "Johannesburg"]];
const TIME_RE = new RegExp("\\b(\\d{1,2})(?:([.:])(\\d{2}))?\\s*([ap]\\.?\\s?m\\.?)?\\s*(?:\\(\\s*)?((?:UTC|GMT)\\s?[+-]\\s?\\d{1,2}(?::?\\d{2})?|" + TZ_ABBR + ")?\\)?(?![a-z])", "gi");
const NOON_RE = new RegExp("\\b(noon|midnight)\\b\\s*(?:\\(\\s*)?(" + TZ_ABBR + ")?\\)?(?![a-z])", "gi");
const partsCache = new Map();
const zoneParts = (ms, tz) => { if (!partsCache.has(tz)) partsCache.set(tz, new Intl.DateTimeFormat("en", { timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })); const o = {}; for (const p of partsCache.get(tz).formatToParts(new Date(ms))) o[p.type] = p.value; return o; };
const wallToUtc = (tz, y, mo, d, h, mi) => { const asUTC = Date.UTC(y, mo - 1, d, h, mi); const off = (ms) => { const p = zoneParts(ms, tz); return Date.UTC(+p.year, +p.month - 1, +p.day, +(p.hour % 24), +p.minute, +p.second) - ms; }; let ms = asUTC - off(asUTC); for (let k = 0; k < 2; k++) { const o = off(ms); if (asUTC - o === ms) break; ms = asUTC - o; } return ms; };

function localTimes(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const hits = [];
  eachText(doc, (n) => { const s = n.nodeValue || ""; let m; TIME_RE.lastIndex = 0; NOON_RE.lastIndex = 0;
    while ((m = TIME_RE.exec(s)) && hits.length < 150) { if (!(m[3] || m[4] || m[5])) continue; if (m[2] === "." && !m[4] && !m[5]) continue; let h = +m[1], mi = +(m[3] || 0), zone = m[5] || ""; if (m[4]) { if (h > 12) continue; h = /^p/i.test(m[4]) ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h; } else if (h > 23) continue; if (mi > 59) continue; const raw = m[0].endsWith("(") ? m[0].slice(0, -1).trim() : m[0]; hits.push({ raw, h, mi, zone, ctx: s.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, " ").trim(), el: n.parentElement }); }
    while ((m = NOON_RE.exec(s)) && hits.length < 150) hits.push({ raw: m[0], h: /^mid/i.test(m[1]) ? 0 : 12, mi: 0, zone: m[2] || "", ctx: s.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, " ").trim(), el: n.parentElement });
  });
  if (!hits.length) return toast("No clock times on this page.");
  const srcZone = (z) => { const s = z.toUpperCase().replace(/\s+/g, ""); const om = s.match(/^(?:UTC|GMT)([+-])(\d{1,2})(\d{2})?$/); if (om) return { off: (om[1] === "-" ? -1 : 1) * (+om[2] * 60 + (om[3] ? +om[3] : 0)), name: s }; return { tz: ZONES[s] || "UTC", name: s }; };
  const msOf = (hit, assume) => { try { if (!hit.zone) { const now = zoneParts(Date.now(), assume); return wallToUtc(assume, +now.year, +now.month, +now.day, hit.h, hit.mi); } const z = srcZone(hit.zone); if (z.off != null) { const b = new Date(Date.now() - z.off * 60000); return Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate(), hit.h, hit.mi) - z.off * 60000; } const now = zoneParts(Date.now(), z.tz); return wallToUtc(z.tz, +now.year, +now.month, +now.day, hit.h, hit.mi); } catch { return null; } };
  const fmt = (ms) => new Date(ms).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
  const row = (x, i, assume) => { const ms = msOf(x, assume); return `<div class="kb-li" style="align-items:baseline;gap:10px"><b style="white-space:nowrap">${esc(x.raw)}</b><span style="flex:1;min-width:0">${ms == null ? `<span class="muted">couldn't convert this one</span>` : `${x.zone ? "→" : "≈"} <b>${esc(fmt(ms))}</b> <span class="muted">your time</span>`} <small class="muted" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.ctx)}</small></span><button class="btn" type="button" data-i="${i}">Show</button></div>`; };
  const draw = (assume) => ($("#lt-l", m.root).innerHTML = hits.map((x, i) => row(x, i, assume)).join(""));
  const m = modal({ title: `Times on this page (${hits.length})`, wide: true, body: `<p class="hint" style="margin-top:0">${plural(hits.length, "time mention")} turned into your own time zone. Times with a zone tag (ET, BST, GMT+2…) are exact, reading abbreviations the common way; ≈ marks bare times, which are read as whatever zone you pick:</p><label class="lbl">Bare times mean</label><select class="field" id="lt-z">${PICK_ZONES.map(([v, n2]) => `<option value="${esc(v)}" ${v === "UTC" ? "selected" : ""}>${esc(n2)}</option>`).join("")}</select><div class="kb-list" id="lt-l" style="margin-top:10px"></div>`, actions: `<button class="btn" type="button" id="lt-c">Copy</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  draw("UTC");
  $("#lt-z", m.root).onchange = () => draw($("#lt-z", m.root).value);
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) jump(hits[+b.dataset.i]?.el); });
  $("#lt-c", m.root).onclick = () => { const assume = $("#lt-z", m.root).value; copy(hits.map((x) => { const ms = msOf(x, assume); return `${x.raw} → ${ms == null ? "?" : fmt(ms)} (your time)`; }).join("\n"), "Times copied."); };
}

// ---------- pull-quote harvester ----------
function pullQuotes(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const heads = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => !h.closest("nav,aside,footer") && (h.textContent || "").trim()).slice(0, 150);
  if (!heads.length) return toast("This page has no headings to summarise.");
  const sent = (txt) => { const s = txt.replace(/\s+/g, " ").trim(); const m = s.match(/^([\s\S]*?[.!?])(?:[\s"”’'\)\]]|$)/); return (m ? m[1] : s.slice(0, 180) + (s.length > 180 ? "…" : "")).slice(0, 400); };
  const cards = [];
  for (const h of heads) { let el = h.nextElementSibling; while (el && !/^H[1-6]$/.test(el.tagName) && !el.querySelector("h1,h2,h3,h4,h5,h6")) { if (/^(P|LI|DD|TD|BLOCKQUOTE|FIGCAPTION)$/.test(el.tagName)) { const s = sent(el.textContent || ""); if (s.replace(/\W/g, "").length > 12) { cards.push({ title: (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90), quote: s, el: h }); break; } } el = el.nextElementSibling; } }
  if (!cards.length) return toast("No readable text under this page's headings.");
  const m = modal({ title: `Pull-quote summary (${cards.length})`, wide: true, body: `<p class="hint" style="margin-top:0">The first sentence under each heading, as a summary card of the whole page. Click one to see its section in place.</p><div class="kb-list">${cards.map((c, i) => `<button type="button" class="kb-li" data-i="${i}" style="text-align:left;align-items:baseline"><span style="flex:1;min-width:0"><strong>${esc(c.title)}</strong><br><span class="muted">“${esc(c.quote)}”</span></span></button>`).join("")}</div>`, actions: `<button class="btn" type="button" id="pq-c">Copy as Markdown</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) jump(cards[+b.dataset.i]?.el); });
  $("#pq-c", m.root).onclick = () => copy(cards.map((c) => `## ${c.title}\n${c.quote}`).join("\n\n"), "Summary copied.");
}

// ---------- form field audit ----------
function formAudit(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const fields = [...doc.querySelectorAll("input,select,textarea")].filter((f) => (f.getAttribute("type") || "").toLowerCase() !== "hidden").slice(0, 400);
  if (!fields.length) return toast("No form fields on this page.");
  const labelOf = (f) => { const id = (f.getAttribute("id") || "").replace(/["\\]/g, ""); const lab = (id && doc.querySelector(`label[for="${id}"]`)) || f.closest("label"); if (lab) return (lab.textContent || "").replace(/\s+/g, " ").trim().slice(0, 70); return (f.getAttribute("aria-label") || f.getAttribute("title") || f.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 70); };
  const rows = fields.map((f, i) => ({ i, kind: f.tagName === "INPUT" ? (f.getAttribute("type") || "text").toLowerCase() : f.tagName.toLowerCase(), lab: labelOf(f), name: f.getAttribute("name") || "", req: f.hasAttribute("required"), el: f }));
  const unlabeled = rows.filter((r) => !r.lab).length;
  const m = modal({ title: `Form fields on this page (${rows.length})`, wide: true, body: `<p class="hint" style="margin-top:0">Read-only: nothing you have typed is read, changed or sent anywhere. Click a row to see the field in place.${unlabeled ? " " + (unlabeled === 1 ? "One field has no label." : plural(unlabeled, "field") + " have no label.") : ""}</p><div class="kb-list">${rows.map((r) => `<button type="button" class="kb-li" data-i="${r.i}" style="align-items:baseline;gap:8px"><code style="padding:1px 6px;border-radius:6px;background:rgba(127,127,160,.15)">${esc(r.kind)}</code><span style="flex:1;min-width:0">${r.lab ? esc(r.lab) : `<span class="muted">(no label)</span>`}${r.name ? ` <small class="muted">name: ${esc(r.name)}</small>` : ""}${r.req ? ` <small style="color:#c0392b">required</small>` : ""}</span></button>`).join("")}</div>`, actions: `<button class="btn" type="button" id="fa-c">Copy list</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) jump(rows[+b.dataset.i]?.el); });
  $("#fa-c", m.root).onclick = () => copy(rows.map((r) => `${r.kind}\t${r.lab || "(no label)"}${r.name ? `\tname=${r.name}` : ""}${r.req ? "\trequired" : ""}`).join("\n"), "Field list copied.");
}

// ---------- timeline extractor ----------
const MON = {}; "jan feb mar apr may jun jul aug sep oct nov dec".split(" ").forEach((mm, i) => (MON[mm] = i + 1));
const DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})\b|\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b|\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})\b|\b([A-Za-z]{3,9})\.?,?\s+(\d{4})\b|\b(1[4-9]\d{2}|20\d{2})\b/g;
function timeline(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const mo = (w) => MON[(w || "").slice(0, 3).toLowerCase()] || 0;
  const sent = (txt, at, len, raw) => { const s = Math.max(txt.lastIndexOf(".", Math.max(0, at - 1)), txt.lastIndexOf("!", Math.max(0, at - 1)), txt.lastIndexOf("?", Math.max(0, at - 1))) + 1; let e = at + len; const mm = /[.!?](?:[\s"”’'\)\]]|$)/.exec(txt.slice(e)); if (mm) e += mm.index + 1; return txt.slice(s, Math.min(txt.length, e)).replace(/\s+/g, " ").trim().slice(0, 240) || raw; };
  const hits = [], seen = new Set();
  eachText(doc, (n) => { const s = n.nodeValue || ""; if (!/\d{3,4}/.test(s)) return; let m; DATE_RE.lastIndex = 0;
    while ((m = DATE_RE.exec(s)) && hits.length < 250) { const raw = m[0]; let y = 0, mo2 = 0, d = 0; if (m[1]) { y = +m[1]; mo2 = +m[2]; d = +m[3]; if (mo2 < 1 || mo2 > 12 || d < 1 || d > 31) { DATE_RE.lastIndex = m.index + 1; continue; } } else if (m[4]) { if (!(mo2 = mo(m[4])) || !(y = +m[6]) || (d = +m[5]) > 31) { DATE_RE.lastIndex = m.index + 1; continue; } } else if (m[7]) { if (!(mo2 = mo(m[8])) || !(y = +m[9]) || (d = +m[7]) > 31) { DATE_RE.lastIndex = m.index + 1; continue; } } else if (m[10]) { if (!(mo2 = mo(m[10]))) { DATE_RE.lastIndex = m.index + 1; continue; } y = +m[11]; } else y = +m[12]; if (y < 1400 || y > 2099) { DATE_RE.lastIndex = m.index + 1; continue; }
      const block = n.parentElement?.closest("p,li,dd,td,th,blockquote,figcaption,caption,h1,h2,h3,h4,h5,h6"); let sentence = raw, srctxt = s, at = m.index;
      if (block) { const bt = (block.textContent || "").replace(/\s+/g, " ").trim(); const bi = bt.indexOf(raw.replace(/\s+/g, " ").trim()); if (bi >= 0) { sentence = sent(bt, bi, raw.length, raw); srctxt = bt; at = bi; } }
      if (sentence === raw) sentence = sent(srctxt, at, raw.length, raw);
      const key = `${y}|${mo2}|${d}|${sentence.slice(0, 60).toLowerCase()}`; if (seen.has(key)) continue; seen.add(key);
      hits.push({ y, mo: mo2, d, sentence, el: n.parentElement });
    }
  });
  if (!hits.length) return toast("No years or dates found on this page.");
  hits.sort((a, b) => a.y - b.y || a.mo - b.mo || a.d - b.d);
  let lastY = null, body = "";
  hits.forEach((h, i) => { if (h.y !== lastY) { lastY = h.y; body += `<div style="padding:6px 8px 2px;font-weight:700;border-bottom:1px solid rgba(127,127,160,.25)">${h.y}</div>`; } const when = h.mo ? new Date(h.y, h.mo - 1, h.d || 1).toLocaleDateString(undefined, { month: "short", ...(h.d ? { day: "numeric" } : {}) }) : ""; body += `<button type="button" class="kb-li" data-i="${i}" style="align-items:baseline;gap:10px"><b style="white-space:nowrap;min-width:4.5em">${esc(when || String(h.y))}</b><span class="muted" style="flex:1;min-width:0">${esc(h.sentence)}</span></button>`; });
  const m = modal({ title: `Timeline from this page (${plural(hits.length, "year or date")})`, wide: true, body: `<p class="hint" style="margin-top:0">Every year and date the page mentions, earliest first, with the sentence it appears in. Click one to see it in place.</p><div class="kb-list">${body}</div>`, actions: `<button class="btn" type="button" id="tl-c">Copy</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) jump(hits[+b.dataset.i]?.el); });
  $("#tl-c", m.root).onclick = () => copy(hits.map((h) => `${h.y}${h.mo ? `-${String(h.mo).padStart(2, "0")}${h.d ? "-" + String(h.d).padStart(2, "0") : ""}` : ""} ${h.sentence}`).join("\n"), "Timeline copied.");
}

// ---------- list flattener ----------
function flatLists(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const tops = [...doc.querySelectorAll("ul,ol,menu")].filter((u) => !u.closest("li,nav,footer")).slice(0, 30);
  if (!tops.length) return toast("No lists on this page.");
  const own = (li) => [...li.childNodes].filter((n) => !(n.nodeType === 1 && /^(UL|OL|MENU)$/.test(n.tagName))).map((n) => n.textContent || "").join("").replace(/\s+/g, " ").trim();
  const walk = (u, d, out) => { let n = 0; for (const li of u.children) { if (li.tagName !== "LI") continue; const txt = own(li); if (txt) { out.push(`${"  ".repeat(Math.min(d, 8))}- ${txt.slice(0, 260)}`); n++; if (out.length > 800) break; } for (const k of li.children) if (/^(UL|OL|MENU)$/.test(k.tagName)) n += walk(k, d + 1, out); } return n; };
  const blocks = []; let total = 0;
  for (const u of tops) { const out = []; const n = walk(u, 0, out); if (n) { total += n; blocks.push({ n, text: out.join("\n"), el: u }); if (blocks.length >= 10) break; } }
  if (!total) return toast("This page's lists are all empty.");
  const text = blocks.map((b, i) => `List ${i + 1} — ${plural(b.n, "item")}\n${b.text}`).join("\n\n");
  const m = modal({ title: `Lists flattened (${plural(total, "item")} in ${plural(blocks.length, "list")})`, wide: true, body: `<p class="hint" style="margin-top:0">Every list on the page as one indented text file — two spaces per level of nesting, whatever its depth.</p><pre style="max-height:60vh;overflow:auto;white-space:pre-wrap;font-size:13px">${esc(text)}</pre>`, actions: `<button class="btn" type="button" id="fl-c">Copy</button><button class="btn" type="button" id="fl-d">Download .txt</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  $("#fl-c", m.root).onclick = () => copy(text, "Lists copied as text.");
  $("#fl-d", m.root).onclick = () => download("lists.txt", text);
}

export function items({ T, root }) {
  return [
    { label: "Show the times on this page in my time zone…", icon: "clock", run: () => localTimes(root?.(), T?.()) },
    { label: "Pull-quote summary of every section…", icon: "spark", run: () => pullQuotes(root?.(), T?.()) },
    { label: "List every form field on this page (read-only)…", icon: "info", run: () => formAudit(root?.(), T?.()) },
    { label: "Dates on this page as a timeline…", icon: "chart", run: () => timeline(root?.(), T?.()) },
    { label: "Flatten this page's lists into indented text…", icon: "list", run: () => flatLists(root?.(), T?.()) },
  ];
}
