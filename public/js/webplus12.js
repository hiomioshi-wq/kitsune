// Kitsune Browser, v121:
//  - your search words stay highlighted on the pages you open from a search
//  - a tab overview: every open tab as a card, with switching and closing
//  - a back-to-top button on long pages
//  - copy a rich link (title as a clickable link, for documents and chats)
//  - read just the selected text in a clean, printable view
import { $, esc, toast, modal } from "./util.js";

const on = (k) => localStorage.getItem(k) === "1";
const flip = (k) => { const v = !on(k); try { v ? localStorage.setItem(k, "1") : localStorage.removeItem(k); } catch {} return v; };
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const STOP = new Set("the and for with that this from what how why who are was were you your his her its our not but can will a an of to in on at by is it be as or".split(" "));

// ---------- search words on result pages ----------
const QP = ["q", "query", "p", "wd", "text", "search", "keyword", "k"];
function queryOf(url) {
  try { const u = new URL(url); for (const k of QP) { const v = u.searchParams.get(k); if (v && v.trim().length > 1) return v.trim(); } } catch {} return "";
}
export function afterRender({ root, t, hostEl, B }) {
  try { searchWords(root, t); } catch {}
  try { backToTop(hostEl, B); } catch {}
}
function searchWords(root, t) {
  if (!t?.url || on("kitsune.webNoTerms")) return;
  const q = queryOf(t.url);
  if (q) { t._sq = { q, host: hostOf(t.url), at: Date.now() }; return; }
  const s = t._sq; if (!s || Date.now() - s.at > 20 * 60_000) return;
  const terms = [...new Set(s.q.toLowerCase().replace(/["'“”]/g, "").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w) && !w.includes(":")))].slice(0, 8);
  if (!terms.length || !root?.querySelector) return;
  if (!root.querySelector("#kbterms-style")) { const st = document.createElement("style"); st.id = "kbterms-style"; st.textContent = "::highlight(kb-terms){background:rgba(255,213,74,.55);color:inherit}"; (root.querySelector(".kb-html") || root).append(st); }
  const re = new RegExp("(" + terms.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
  const ranges = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement?.closest("script,style,noscript,head") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  let n; while ((n = walker.nextNode()) && ranges.length < 600) { re.lastIndex = 0; let m; while ((m = re.exec(n.nodeValue)) && ranges.length < 600) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); ranges.push(r); } }
  if (!ranges.length) return;
  try { CSS.highlights.set("kb-terms", new Highlight(...ranges)); } catch { return; }
  toast(`Your search words are highlighted (${ranges.length}).`, { ms: 4000, action: "Clear", onAction: () => { try { CSS.highlights.delete("kb-terms"); } catch {} } });
}

// ---------- back to top ----------
function backToTop(sc, B) {
  if (!sc || on("kitsune.webNoTopBtn")) return; $("#kb-top", B.view)?.remove();
  const b = document.createElement("button"); b.id = "kb-top"; b.type = "button"; b.setAttribute("aria-label", "Back to the top"); b.textContent = "↑";
  b.style.cssText = "position:absolute;left:14px;bottom:14px;z-index:20;width:40px;height:40px;border-radius:50%;border:1px solid var(--line,#3a3e66);background:var(--surface,#1c1d33);color:inherit;font:700 18px system-ui;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .2s;box-shadow:0 6px 18px rgba(0,0,0,.3)";
  b.onclick = () => sc.scrollTo({ top: 0, behavior: "smooth" });
  ($("#kb-body", B.view) || B.view).append(b);
  const paint = () => { const show = sc.scrollTop > sc.clientHeight * 2; b.style.opacity = show ? ".9" : "0"; b.style.pointerEvents = show ? "auto" : "none"; };
  sc.addEventListener("scroll", paint, { passive: true }); paint();
}

// ---------- tab overview ----------
function overview({ B, showTab }) {
  const draw = () => B.tabs.map((t, i) => {
    const desc = t.data?.html?.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,180})/i)?.[1] || "";
    return `<div class="tov-card ${i === B.active ? "on" : ""}" data-i="${i}" role="button" tabindex="0" style="position:relative;border:1px solid ${i === B.active ? "var(--accent,#f2a03f)" : "rgba(127,127,160,.35)"};border-radius:12px;padding:10px 12px;cursor:pointer;min-height:110px;display:flex;flex-direction:column;gap:4px;background:rgba(127,127,160,.06)">
      <div style="display:flex;gap:8px;align-items:center">${t.url ? `<img src="${esc((() => { try { return new URL("/favicon.ico", t.url).href; } catch { return ""; } })())}" alt="" width="16" height="16" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<b style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.custom || t.title || "New tab")}</b>${t.pinned ? "📌" : ""}<button type="button" data-x="${i}" aria-label="Close tab" style="border:0;background:none;color:inherit;font-size:16px;cursor:pointer">×</button></div>
      <small class="muted" style="word-break:break-all">${esc(t.url ? hostOf(t.url) : "Start page")}</small>
      <small style="opacity:.75;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(desc)}</small></div>`;
  }).join("");
  const m = modal({ title: `All tabs (${B.tabs.length})`, wide: true, body: `<input class="field" id="tov-q" type="search" placeholder="Filter tabs" style="width:100%;margin-bottom:10px"><div id="tov-g" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px">${draw()}</div>` });
  const g = $("#tov-g", m.root);
  $("#tov-q", m.root).oninput = (e) => { const q = e.target.value.toLowerCase(); g.querySelectorAll(".tov-card").forEach((c) => { const t = B.tabs[+c.dataset.i]; c.style.display = !q || `${t.title} ${t.custom || ""} ${t.url || ""}`.toLowerCase().includes(q) ? "" : "none"; }); };
  m.root.onclick = (e) => {
    const x = e.target.closest("[data-x]"); if (x) { e.stopPropagation(); $(`#kb-tabs [data-close="${x.dataset.x}"]`, B.view)?.click(); setTimeout(() => { if (B.tabs.length) { g.innerHTML = draw(); m.root.querySelector(".modal-head h2, h2") && (m.root.querySelector("h2").textContent = `All tabs (${B.tabs.length})`); } else m.close(); }, 60); return; }
    const c = e.target.closest(".tov-card"); if (c) { B.active = +c.dataset.i; m.close(); showTab(); }
  };
}

// ---------- rich link, selection reader ----------
async function richLink(t) {
  if (!t.url) return toast("Open a page first.");
  const title = t.custom || t.title || t.url, html = `<a href="${esc(t.url)}">${esc(title)}</a>`, text = `${title} ${t.url}`;
  try { await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]); toast("Copied a rich link: paste it into a document or chat and the title becomes the link."); }
  catch { try { await navigator.clipboard.writeText(text); toast("Copied the title and link."); } catch { toast("Couldn't copy."); } }
}
function selectionReader(getSel, t) {
  const sel = getSel(); if (!sel?.rangeCount || sel.isCollapsed) return toast("Select the part of the page you want to read first.");
  const box = document.createElement("div"); for (let i = 0; i < sel.rangeCount; i++) box.append(sel.getRangeAt(i).cloneContents());
  box.querySelectorAll("script,style,iframe,form,button,input,nav").forEach((n) => n.remove());
  const m = modal({ title: "Just this part", wide: true, body: `<p class="muted" style="margin-top:0">${esc(t.title || "")} · ${esc(hostOf(t.url))}</p><article id="sr-a" style="font:18px/1.7 Georgia,serif;max-width:40rem;margin:0 auto">${box.innerHTML}</article><p style="margin-top:14px"><button class="btn" type="button" id="sr-p">Print or save as PDF</button> <button class="btn" type="button" id="sr-c">Copy text</button></p>` });
  m.root.querySelectorAll("#sr-a img").forEach((i) => { i.style.maxWidth = "100%"; i.style.height = "auto"; });
  $("#sr-c", m.root).onclick = () => navigator.clipboard?.writeText($("#sr-a", m.root).innerText).then(() => toast("Copied."));
  $("#sr-p", m.root).onclick = () => { const w = open("", "_blank"); if (!w) return toast("Allow pop-ups to print."); w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(t.title || "")}</title><style>body{font:12pt/1.6 Georgia,serif;max-width:40rem;margin:2cm auto}img{max-width:100%}</style><h1>${esc(t.title || "")}</h1><p><small>${esc(t.url)}</small></p>${$("#sr-a", m.root).innerHTML}`); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); };
}

export function items({ T, B, showTab, getSel }) {
  return [
    { label: "Tab overview (all tabs as cards)…", icon: "grid", run: () => overview({ B, showTab }) },
    { label: "Copy as a rich link (title links to the page)", icon: "link", run: () => richLink(T()) },
    { label: "Read just the selected part…", icon: "book", run: () => selectionReader(getSel, T()) },
    { label: on("kitsune.webNoTerms") ? "Highlight my search words on results: off (turn on)" : "Highlight my search words on results: on (turn off)", icon: "search", run: () => { const off = flip("kitsune.webNoTerms"); toast(off ? "Search words won't be highlighted." : "Pages you open from a search show your search words highlighted."); } },
    { label: on("kitsune.webNoTopBtn") ? "Back-to-top button: off (turn on)" : "Back-to-top button: on (turn off)", icon: "back", run: () => { const off = flip("kitsune.webNoTopBtn"); toast(off ? "Back-to-top button off." : "Long pages get a back-to-top button."); } },
  ];
}
