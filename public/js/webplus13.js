// Kitsune Browser, v122:
//  - spoiler and word filter: paragraphs, list items and cards that mention words you choose are blurred until you tap
//  - full screen browsing
//  - a picture gallery of everything on the page, with sizes and saving
//  - tables copied as Markdown
//  - a break reminder while you browse
import { $, esc, toast, modal } from "./util.js";

const words = () => { try { return JSON.parse(localStorage.getItem("kitsune.webFilterWords") || "[]"); } catch { return []; } };
const setWords = (l) => { try { localStorage.setItem("kitsune.webFilterWords", JSON.stringify(l)); } catch {} };

// ---------- spoiler / word filter ----------
export function filterPage(root) {
  const list = words(); if (!list.length || !root?.querySelector) return 0;
  if (!root.querySelector("#kbfilter-style")) { const st = document.createElement("style"); st.id = "kbfilter-style"; st.textContent = `.kb-filtered{filter:blur(7px);cursor:pointer;transition:filter .2s;position:relative}.kb-filtered::after{content:"Hidden: mentions a word you filter · tap to show";position:absolute;inset:auto 0 0 0;font:600 11px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;filter:none}.kb-filtered.kb-shown{filter:none}.kb-filtered.kb-shown::after{display:none}`; (root.querySelector(".kb-html") || root).append(st); }
  const re = new RegExp("\\b(" + list.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "i");
  const blocks = new Set(), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement?.closest("script,style,.kb-filtered,head,title") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  let n; while ((n = walker.nextNode())) { if (re.test(n.nodeValue)) { const b = n.parentElement?.closest("p, li, blockquote, figcaption, h1, h2, h3, h4, td, article, [class*=card], [class*=comment], [class*=post]"); if (b && !b.closest("body > *:only-child > *:only-child")) blocks.add(b); } }
  for (const b of blocks) { b.classList.add("kb-filtered"); b.addEventListener("click", (e) => { if (!b.classList.contains("kb-shown")) { e.preventDefault(); e.stopPropagation(); b.classList.add("kb-shown"); } }, { capture: true }); }
  return blocks.size;
}
function filterDialog(reapply) {
  const m = modal({ title: "Spoiler and word filter", body: `<p class="muted" style="margin-top:0">Paragraphs, list items and cards that mention any of these words are blurred until you tap them. Handy for spoilers. One word or phrase per line.</p><textarea class="field" id="wf-t" style="width:100%;min-height:150px" placeholder="final episode\nwho dies\nchapter 140">${esc(words().join("\n"))}</textarea>`, actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="wf-ok">Save</button>` });
  $("#wf-ok", m.root).onclick = () => { const l = [...new Set($("#wf-t", m.root).value.split("\n").map((x) => x.trim()).filter(Boolean))].slice(0, 200); setWords(l); m.close(); const n = reapply(); toast(l.length ? `Filtering ${l.length} word${l.length === 1 ? "" : "s"}.${n ? ` ${n} part${n === 1 ? "" : "s"} of this page hidden.` : ""}` : "Word filter off."); };
}

// ---------- full screen ----------
function fullScreen(B) {
  const el = $("#kb", B.view); if (!el) return;
  if (document.fullscreenElement) return document.exitFullscreen?.();
  (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.then?.(() => toast("Full screen. Press Esc to leave.", { ms: 2500 })).catch(() => toast("This device won't go full screen here."));
}

// ---------- picture gallery ----------
function gallery(root, t) {
  const imgs = [...new Map([...(root?.querySelectorAll("img") || [])].map((i) => [i.currentSrc || i.src, i]).filter(([s]) => s && !s.startsWith("data:")))].map(([src, i]) => ({ src, alt: i.alt || "", w: i.naturalWidth, h: i.naturalHeight })).filter((x) => !x.w || x.w >= 60 || x.h >= 60);
  if (!imgs.length) return toast("There are no pictures on this page.");
  const m = modal({ title: `Pictures on this page (${imgs.length})`, wide: true, body: `<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap"><button class="btn btn-sm" type="button" data-sz="0">All</button><button class="btn btn-sm" type="button" data-sz="400">Large only</button></div><div id="pg-g" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">${imgs.map((x, i) => `<figure data-w="${x.w}" style="margin:0;border:1px solid rgba(127,127,160,.3);border-radius:8px;overflow:hidden;background:rgba(127,127,160,.08)"><a href="${esc(x.src)}" target="_blank" rel="noopener"><img src="${esc(x.src)}" alt="${esc(x.alt)}" loading="lazy" referrerpolicy="no-referrer" style="width:100%;height:130px;object-fit:cover;display:block"></a><figcaption style="font-size:11px;padding:4px 6px;display:flex;justify-content:space-between;gap:6px"><span>${x.w ? `${x.w}×${x.h}` : ""}</span><button type="button" data-save="${i}" style="border:0;background:none;color:inherit;cursor:pointer;font-size:11px;text-decoration:underline">save</button></figcaption></figure>`).join("")}</div>` });
  m.root.onclick = async (e) => {
    const sz = e.target.closest("[data-sz]"); if (sz) { const min = +sz.dataset.sz; m.root.querySelectorAll("#pg-g figure").forEach((f) => (f.style.display = !min || +f.dataset.w >= min ? "" : "none")); return; }
    const s = e.target.closest("[data-save]"); if (!s) return; const x = imgs[+s.dataset.save];
    try { let r = await fetch(x.src).catch(() => null); if (!r?.ok) r = await fetch("/api/browse/img?url=" + encodeURIComponent(x.src)); if (!r.ok) throw 0; const b = await r.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = (x.src.split("/").pop().split("?")[0] || "picture") .slice(0, 80); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
    catch { open(x.src, "_blank", "noopener"); }
  };
  void t;
}

// ---------- tables as Markdown ----------
function tablesMarkdown(root) {
  const tables = [...(root?.querySelectorAll("table") || [])].filter((tb) => tb.rows.length > 1); if (!tables.length) return toast("There are no tables on this page.");
  const cell = (c) => (c.textContent || "").replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
  const md = tables.slice(0, 20).map((tb, k) => { const rows = [...tb.rows].map((r) => [...r.cells].map(cell)); const n = Math.max(...rows.map((r) => r.length)); const pad = (r) => [...r, ...Array(n - r.length).fill("")]; const cap = tb.caption?.textContent?.trim(); return `${cap ? `**${cap}**\n\n` : tables.length > 1 ? `**Table ${k + 1}**\n\n` : ""}| ${pad(rows[0]).join(" | ")} |\n| ${Array(n).fill("---").join(" | ")} |\n${rows.slice(1).map((r) => `| ${pad(r).join(" | ")} |`).join("\n")}`; }).join("\n\n");
  navigator.clipboard?.writeText(md).then(() => toast(`Copied ${Math.min(tables.length, 20)} table${tables.length === 1 ? "" : "s"} as Markdown.`)).catch(() => toast("Couldn't copy."));
}

// ---------- break reminder ----------
let breakT = null;
function breakReminder() {
  if (breakT) { clearInterval(breakT); breakT = null; try { localStorage.removeItem("kitsune.webBreak"); } catch {} return toast("Break reminder off."); }
  const min = +prompt("Remind me to take a break every how many minutes?", "30"); if (!min || min < 5) return;
  try { localStorage.setItem("kitsune.webBreak", String(min)); } catch {}
  let used = 0; breakT = setInterval(() => { if (document.hidden || !location.hash.startsWith("#web")) return; used++; if (used >= min) { used = 0; toast(`You've been browsing for ${min} minutes. Look at something far away for a moment, and stretch.`, { ms: 12000 }); } }, 60_000);
  toast(`I'll remind you every ${min} minutes of browsing.`);
}

export function items({ T, B, root, refilter }) {
  const n = words().length;
  return [
    { label: n ? `Spoiler and word filter (${n} word${n === 1 ? "" : "s"})…` : "Spoiler and word filter…", icon: "sliders", run: () => filterDialog(refilter) },
    { label: "Full screen (Esc to leave)", icon: "expand", run: () => fullScreen(B) },
    { label: "Picture gallery…", icon: "grid", run: () => gallery(root(), T()) },
    { label: "Copy tables as Markdown", icon: "edit", run: () => tablesMarkdown(root()) },
    { label: breakT ? "Break reminder: on (turn off)" : "Break reminder…", icon: "clock", run: breakReminder },
  ];
}
