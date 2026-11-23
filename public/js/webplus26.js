// Kitsune Browser, v145: six more page tools.
//  - a reading-time map, section by section, and a reading goal per site that counts the minutes you really spend
//  - every number on a page highlighted at once; the page's quotes and abbreviations collected; footnotes renumbered in order
import { $, esc, toast, modal, plural, fmtDuration, fmtMinutes, today } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const page = (root, t) => (root && root.querySelectorAll ? root : t?.doc);
const wordCount = (s) => ((s || "").match(/\S+/g) || []).length;

function readingMap(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const blocks = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,td,dd,blockquote,pre,figcaption")].filter((b) => !b.querySelector("p,li,td,dd,blockquote,figcaption"));
  const secs = [{ lvl: 0, title: "Before the first heading", words: 0, el: null }];
  for (const b of blocks) {
    if (/^H[1-6]$/.test(b.tagName)) secs.push({ lvl: +b.tagName[1], title: (b.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80) || "(untitled)", words: 0, el: b });
    else secs.at(-1).words += wordCount(b.textContent);
  }
  if (secs.length < 2) return toast("This page has no headings to break down.");
  const WPM = 238; let at = 0;
  const rows = secs.map((s) => { const min = s.words ? Math.max(1, Math.round(s.words / WPM)) : 0; const r = { ...s, min, at: Math.round(at / WPM) }; at += s.words; return r; });
  const shown = rows.slice(0, 250);
  const m = modal({ title: "Reading time by section", wide: true, body: `<p class="hint" style="margin-top:0">${plural(at, "word")} · about ${fmtMinutes(Math.round(at / WPM) * 60)} in all · click a section to jump to it.</p><div class="kb-list">${shown.map((r, i) => `<button type="button" class="kb-li" data-i="${i}" style="margin-left:${Math.max(0, r.lvl - 1) * 18}px${r.el ? "" : ";opacity:.7"}"><span style="flex:1;min-width:0"><strong>${esc(r.title)}</strong><small>${r.min ? `${plural(r.min, "minute")}${r.at ? ` · after ${fmtDuration(r.at * 60)}` : ""}` : "no text"}</small></span></button>`).join("")}</div>${rows.length > shown.length ? `<p class="hint">${rows.length - shown.length} more sections not shown.</p>` : ""}`, actions: `<button class="btn" type="button" id="rm-c">Copy</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (!b) return; const el = shown[+b.dataset.i]?.el; if (!el?.scrollIntoView) return; el.scrollIntoView({ behavior: "smooth", block: "start" }); const o = el.style.outline; el.style.outline = "3px solid #ffd43b"; setTimeout(() => (el.style.outline = o), 1800); });
  $("#rm-c", m.root).onclick = () => navigator.clipboard?.writeText(rows.map((r) => `${"  ".repeat(Math.max(0, r.lvl - 1))}${r.title} — ${r.min ? plural(r.min, "minute") : "no text"}`).join("\n")).then(() => toast("Reading plan copied."), () => toast("Couldn't copy."));
}

function numberSpots(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  if (!window.Highlight || !CSS?.highlights) return toast("This browser can't highlight inside pages.");
  try { CSS.highlights.delete("kb-nums"); } catch {}
  const RE = /\d[\d,.]*\d|\d/g; const ranges = []; let n = 0, big = 0;
  const walk = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, { acceptNode: (x) => (x.parentElement?.closest("script,style,noscript,svg,textarea,select,code,pre,samp,kbd") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  let x; while ((x = walk.nextNode())) { const s = x.nodeValue; let mm; RE.lastIndex = 0; while ((mm = RE.exec(s))) { if (ranges.length >= 3000) break; const r = document.createRange(); r.setStart(x, mm.index); r.setEnd(x, mm.index + mm[0].length); ranges.push(r); n++; const v = parseFloat(mm[0].replace(/,/g, "")); if (v > big && v < 1e12) big = v; } }
  if (!n) return toast("No numbers found on this page.");
  if (!doc.querySelector("#kbnums-style")) { const st = document.createElement("style"); st.id = "kbnums-style"; st.textContent = "::highlight(kb-nums){background:rgba(255,213,74,.6)}"; (doc.querySelector(".kb-html") || doc.body || doc).append(st); }
  try { CSS.highlights.set("kb-nums", new Highlight(...ranges)); } catch { return toast("Couldn't highlight numbers here."); }
  toast(`Highlighted ${plural(n, "number")}.${big ? ` The biggest is ${big.toLocaleString()}.` : ""}`, { action: "Clear", onAction: () => { try { CSS.highlights.delete("kb-nums"); } catch {} } });
}

const FN_UNDO = new WeakMap();
function renumberFootnotes(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const marks = [...doc.querySelectorAll('a[href^="#"]')].filter((a) => { const h = a.getAttribute("href") || "", id = a.id || "", cl = a.className || "", txt = (a.textContent || "").trim(); if (a.closest("nav, header") || !/note|fn|ref|cite|\d/i.test(h.slice(1)) || /#cite_ref|#fnref/i.test(h) || /backlink/i.test(cl + " " + id) || a.getAttribute("role") === "doc-backlink") return false; if (txt.length > 6) return false; return /^\[?\d{1,3}[a-z]?\]?$|^\[?[ivxl]{1,6}\]?$|^[*†‡§¶]+$/i.test(txt) || /fn|ref|note/i.test(id + " " + cl); });
  if (!marks.length) return toast("No footnote markers found on this page.");
  const order = new Map(); let k = 0, changed = 0;
  for (const a of marks) { const h = a.getAttribute("href"); if (!order.has(h)) order.set(h, ++k); const label = `[${order.get(h)}]`; if (!FN_UNDO.has(a)) FN_UNDO.set(a, a.textContent); if (a.textContent !== label && [...a.childNodes].every((c) => c.nodeType === 3)) { a.textContent = label; changed++; } }
  if (!changed) return toast("Footnote markers are already numbered in order.");
  toast(`Renumbered ${plural(order.size, "footnote")} (${marks.length} marker${marks.length === 1 ? "" : "s"}).`, { action: "Undo", onAction: () => { for (const a of marks) if (FN_UNDO.has(a)) { a.textContent = FN_UNDO.get(a); FN_UNDO.delete(a); } } });
}

function glossary(root, t) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const seen = new Map();
  for (const el of doc.querySelectorAll("abbr[title], acronym[title], dfn[title]")) { const term = (el.textContent || "").replace(/\s+/g, " ").trim(), def = (el.getAttribute("title") || "").replace(/\s+/g, " ").trim(); if (!term || !def || term.length > 40 || seen.has(term.toLowerCase())) continue; seen.set(term.toLowerCase(), { term, def }); }
  const list = [...seen.values()].slice(0, 300);
  if (!list.length) return toast("No abbreviations or definitions on this page.");
  const m = modal({ title: `Abbreviations on this page (${list.length})`, wide: true, body: `<div class="kb-list">${list.map((x) => `<div class="kb-li" style="align-items:baseline"><b style="min-width:4.5em">${esc(x.term)}</b><span class="muted">${esc(x.def)}</span></div>`).join("")}</div>`, actions: `<button class="btn" type="button" id="gl-c">Copy as Markdown</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  $("#gl-c", m.root).onclick = () => navigator.clipboard?.writeText(list.map((x) => `**${x.term}** — ${x.def}`).join("\n")).then(() => toast("Glossary copied."), () => toast("Couldn't copy."));
}

function quotes(root, t, go) {
  const doc = page(root, t); if (!doc?.querySelectorAll) return toast("Open a page in Page or Reader mode first.");
  const list = [...doc.querySelectorAll("blockquote, q")].map((q) => ({ text: (q.textContent || "").replace(/\s+/g, " ").trim(), cite: q.getAttribute("cite") || q.closest("figure")?.querySelector("figcaption")?.textContent?.replace(/\s+/g, " ").trim() || "", el: q })).filter((x) => x.text.length > 25 && !x.el.closest("nav, header, footer, aside") && !x.el.parentElement?.closest("blockquote")).slice(0, 100);
  if (!list.length) return toast("No quotes on this page.");
  const m = modal({ title: `Quotes on this page (${list.length})`, wide: true, body: list.map((x, i) => `<blockquote style="margin:0 0 10px;padding:8px 12px;border-left:3px solid var(--accent,#f2a03f);background:rgba(127,127,160,.08);border-radius:0 8px 8px 0">“${esc(x.text.slice(0, 400))}${x.text.length > 400 ? "…" : ""}”${x.cite ? `<footer class="muted" style="font-size:12px;margin-top:4px">${/^https?:/.test(x.cite) ? `<button type="button" class="btn btn-sm" data-c="${esc(x.cite)}">Source: ${esc(x.cite.replace(/^https?:\/\//, "").slice(0, 60))}</button>` : esc(x.cite)}</footer>` : ""}<button class="btn btn-sm" type="button" data-q="${i}" style="margin-top:6px">Show on page</button></blockquote>`).join(""), actions: `<button class="btn" type="button" id="qt-c">Copy as Markdown</button><button class="btn btn-accent" type="button" data-close>Done</button>` });
  m.root.addEventListener("click", (e) => { const c = e.target.closest("[data-c]"); if (c) { m.close(); go?.(c.dataset.c, { newTab: true }); return; } const b = e.target.closest("[data-q]"); if (b) { const el = list[+b.dataset.q]?.el; m.close(); el?.scrollIntoView?.({ behavior: "smooth", block: "center" }); } });
  $("#qt-c", m.root).onclick = () => navigator.clipboard?.writeText(list.map((x) => `> ${x.text}${x.cite ? `\n> — ${x.cite}` : ""}`).join("\n\n")).then(() => toast("Quotes copied."), () => toast("Couldn't copy."));
}

async function readingGoal(T) {
  const t = T?.(); let h = ""; try { h = new URL(t?.url).hostname.replace(/^www\./, ""); } catch {}
  if (!h) return toast("Open a page first.");
  const db = (await kvGet("webReadGoal", null)) || { sites: {} }; db.sites ||= {}; const site = db.sites[h] ||= { goal: 15, days: {} }; site.days ||= {};
  const day = today(); site.days[day] ||= 0;
  let secs = 0, told = site.days[day] >= (site.goal || 0) * 60, run = false, id = null;
  const m = modal({ title: "Reading goal", body: `<p class="hint" style="margin-top:0">A stopwatch that counts the minutes you spend reading on <b>${esc(h)}</b>, remembered for this site, day by day. It only counts while Kitsune is open and visible.</p><div id="rg-t" style="font:600 40px ui-monospace,monospace;text-align:center;margin:8px 0">0:00</div><p class="hint" style="text-align:center" id="rg-s"></p><label style="display:flex;gap:8px;align-items:center;justify-content:center;margin:6px 0">Daily goal <input class="field" id="rg-g" type="number" min="0" max="960" value="${site.goal || 15}" style="width:70px"> minutes</label>`, actions: `<button class="btn" type="button" id="rg-p">Start</button><button class="btn btn-accent" type="button" data-close>Done</button>`, onClose: () => { clearInterval(id); const g = +$("#rg-g", m.root)?.value; if (g >= 0) site.goal = g; kvSet("webReadGoal", db); } });
  const stat = () => { const done = site.days[day], goal = (site.goal || 0) * 60; $("#rg-s", m.root).innerHTML = `Today on ${esc(h)}: <b>${fmtMinutes(done)}</b>${goal ? ` of ${fmtMinutes(goal)}${done >= goal ? " · goal reached ✓" : ""}` : ""}`; };
  $("#rg-p", m.root).onclick = () => { run = !run; $("#rg-p", m.root).textContent = run ? "Pause" : "Start"; if (run) $("#rg-t", m.root).textContent = fmtDuration(secs); };
  $("#rg-g", m.root).onchange = () => { const g = +$("#rg-g", m.root).value; if (g >= 0) site.goal = g; kvSet("webReadGoal", db); stat(); };
  id = setInterval(() => { if (document.hidden || !run) return; secs++; site.days[day]++; if (!told && site.goal > 0 && site.days[day] >= site.goal * 60) { told = true; toast(`Reading goal reached on ${h}: ${fmtMinutes(site.goal * 60)} today. Well read!`); } $("#rg-t", m.root).textContent = fmtDuration(secs); stat(); if (site.days[day] % 15 === 0) kvSet("webReadGoal", db); }, 1000);
  stat();
}

export function items({ T, root, go }) {
  return [
    { label: "Reading time by section…", icon: "clock", run: () => readingMap(root?.(), T?.()) },
    { label: "Reading goal for this site…", icon: "chart", run: () => readingGoal(T) },
    { label: "Highlight every number on this page", icon: "highlight", run: () => numberSpots(root?.(), T?.()) },
    { label: "Quotes on this page…", icon: "spark", run: () => quotes(root?.(), T?.(), go) },
    { label: "Abbreviations and definitions on this page…", icon: "book", run: () => glossary(root?.(), T?.()) },
    { label: "Renumber this page's footnotes", icon: "list", run: () => renumberFootnotes(root?.(), T?.()) },
  ];
}
