// Kitsune Browser, v119: links that point at a sentence (the #:~:text= links other browsers make), renaming tabs,
// the full back/forward history of a tab, and copying all your tabs as a Markdown list.
import { $, esc, toast, modal } from "./util.js";

const enc = (s) => encodeURIComponent(s).replace(/-/g, "%2D");
export function fragmentFor(text) {
  const t = text.replace(/\s+/g, " ").trim(); if (!t) return "";
  if (t.length <= 300) return "text=" + enc(t);
  const w = t.split(" "); return "text=" + enc(w.slice(0, 6).join(" ")) + "," + enc(w.slice(-6).join(" "));
}
export async function copyFragment(text, t) {
  const f = fragmentFor(text); if (!f) return toast("Select some text first.");
  const base = t.url.replace(/#.*$/, ""), link = `${base}#:~:${f}`;
  try { await navigator.clipboard.writeText(link); toast("Copied a link that jumps to that text."); } catch { prompt("Copy this link", link); }
}

// ---------- honouring #:~:text= links ----------
const FRAG = /#:~:(.+)$/;
export function parseFragments(url) {
  const m = String(url).match(FRAG); if (!m) return [];
  return m[1].split("&").filter((p) => p.startsWith("text=")).map((p) => {
    const parts = p.slice(5).split(",").map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
    let prefix = "", suffix = "";
    if (parts.length && parts[0].endsWith("-")) prefix = parts.shift().slice(0, -1);
    if (parts.length && parts[parts.length - 1].startsWith("-")) suffix = parts.pop().slice(1);
    return { prefix, start: parts[0] || "", end: parts[1] || "", suffix };
  }).filter((f) => f.start);
}
function textIndex(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement?.closest("script, style, noscript, template") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  let norm = "", map = [], lastSpace = true, n;
  while ((n = walker.nextNode())) {
    const s = n.nodeValue;
    for (let i = 0; i < s.length; i++) {
      const c = s[i], space = /\s/.test(c);
      if (space) { if (!lastSpace) { norm += " "; map.push([n, i]); lastSpace = true; } }
      else { norm += c.toLowerCase(); map.push([n, i]); lastSpace = false; }
    }
  }
  return { norm, map };
}
const norm1 = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
export function applyFragment(root, t) {
  const frags = parseFragments(t.url); if (!frags.length || !root?.querySelector) return;
  if (!root.querySelector("#kbfrag-style")) { const st = document.createElement("style"); st.id = "kbfrag-style"; st.textContent = "::highlight(kb-frag){background:#ffd54a;color:#000}"; (root.querySelector(".kb-html") || root).append(st); }
  const { norm, map } = textIndex(root), ranges = [];
  for (const f of frags) {
    const start = norm1(f.start), end = f.end ? norm1(f.end) : "";
    let from = 0, hit = -1;
    while (true) {
      const i = norm.indexOf(start, from); if (i < 0) break;
      const okPrefix = !f.prefix || norm.slice(Math.max(0, i - f.prefix.length - 2), i).includes(norm1(f.prefix));
      if (okPrefix) { hit = i; break; } from = i + 1;
    }
    if (hit < 0) continue;
    let stop = hit + start.length;
    if (end) { const j = norm.indexOf(end, stop); if (j < 0) continue; stop = j + end.length; }
    const a = map[hit], b = map[Math.min(stop - 1, map.length - 1)]; if (!a || !b) continue;
    try { const r = document.createRange(); r.setStart(a[0], a[1]); r.setEnd(b[0], Math.min(b[1] + 1, b[0].nodeValue.length)); if (!r.collapsed) ranges.push(r); } catch {}
  }
  if (!ranges.length) return toast("That link points at some text, but it isn't on this page any more.");
  try { CSS.highlights.set("kb-frag", new Highlight(...ranges)); } catch {}
  const el = ranges[0].startContainer.parentElement; setTimeout(() => el?.scrollIntoView({ block: "center", behavior: "smooth" }), 80);
  addEventListener("click", () => { try { CSS.highlights.delete("kb-frag"); } catch {} }, { once: true });
}

// ---------- menu ----------
export function items({ T, B, go, selText, drawTabs, persistTabs }) {
  return [
    { label: "Copy link to the selected text", icon: "link", run: () => { const g = selText(); if (!g) return toast("Select some text on the page first."); copyFragment(g.s, T()); } },
    { label: "Rename tab…", icon: "edit", run: () => { const t = T(), n = prompt("Name for this tab (leave empty for the page's own title)", t.custom || t.title || ""); if (n == null) return; t.custom = n.trim(); drawTabs(); persistTabs(); } },
    { label: "History of this tab…", icon: "clock", run: () => {
      const t = T(); if (!t.hist?.length) return toast("This tab has no history yet.");
      const m = modal({ title: "History of this tab", body: `<div id="th-l">${t.hist.map((u, i) => `<button type="button" class="btn" data-i="${i}" style="display:block;width:100%;text-align:left;margin-bottom:4px;${i === t.idx ? "outline:2px solid var(--accent,#f2a03f)" : ""}"><b>${i === t.idx ? "▶ " : ""}${esc(new URL(u).hostname.replace(/^www\./, ""))}</b> <small class="muted" style="word-break:break-all">${esc(u.replace(/^https?:\/\/[^/]+/, "").slice(0, 120) || "/")}</small></button>`).join("")}</div>` });
      m.root.onclick = (e) => { const b = e.target.closest("[data-i]"); if (!b) return; const i = +b.dataset.i; t.idx = i; m.close(); go(t.hist[i], { push: false }); };
    } },
    { label: "Copy all tabs as a Markdown list", icon: "list", run: () => { const md = B.tabs.filter((t) => t.url).map((t) => `- [${(t.custom || t.title || t.url).replace(/[\[\]]/g, "")}](${t.url})`).join("\n"); navigator.clipboard?.writeText(md).then(() => toast(`Copied ${md.split("\n").length} tabs as Markdown.`)); } },
  ];
}
