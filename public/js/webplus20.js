// Kitsune Browser, v129:
//  - sticky notes on pages: little coloured notes you place on a page, drag, edit and delete; they come back when you return
//  - compare two tabs: the differences between the text of this page and another open tab, paragraph by paragraph
import { $, esc, toast, modal } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const key = (u) => String(u || "").replace(/#.*$/, "");
const COLORS = { yellow: "#fff3a6", pink: "#ffd1e3", green: "#d4f5c9", blue: "#d3e6ff" };
let all = null;
const load = async () => (all ||= (await kvGet("webStickies", {})) || {});
const save = () => kvSet("webStickies", all);

const STYLE = `.kb-sticky{position:absolute;z-index:30;width:220px;min-height:90px;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.25);font:14px/1.4 system-ui,sans-serif;color:#222;display:flex;flex-direction:column}
.kb-sticky header{display:flex;gap:4px;align-items:center;padding:4px 6px;cursor:grab;user-select:none;border-bottom:1px solid rgba(0,0,0,.08);font-size:11px;opacity:.75}.kb-sticky header span{flex:1}
.kb-sticky header button{border:0;background:none;cursor:pointer;font-size:13px;padding:0 3px;color:#333}.kb-sticky .c{width:12px;height:12px;border-radius:50%;border:1px solid rgba(0,0,0,.25);padding:0}
.kb-sticky div[contenteditable]{padding:8px 10px;outline:none;flex:1;white-space:pre-wrap;word-break:break-word}.kb-sticky.min div[contenteditable]{display:none}.kb-sticky.min{min-height:0;width:140px}`;

function noteEl(n, onChange, onDelete) {
  const el = document.createElement("aside"); el.className = "kb-sticky"; el.dataset.id = n.id;
  el.style.cssText = `left:${n.x}%;top:${n.y}px;background:${COLORS[n.c] || COLORS.yellow}`;
  el.innerHTML = `<header><span>${new Date(n.t).toLocaleDateString()}</span>${Object.entries(COLORS).map(([k, v]) => `<button class="c" data-c="${k}" style="background:${v}" aria-label="${k}"></button>`).join("")}<button data-min aria-label="Fold">–</button><button data-del aria-label="Delete note">×</button></header><div contenteditable="true" spellcheck="true">${esc(n.text || "")}</div>`;
  if (n.min) el.classList.add("min");
  const ed = el.querySelector("[contenteditable]"); let tm; ed.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { n.text = ed.innerText.slice(0, 4000); onChange(); }, 400); };
  el.querySelector("header").onclick = (e) => { const c = e.target.closest("[data-c]"); if (c) { n.c = c.dataset.c; el.style.background = COLORS[n.c]; onChange(); } if (e.target.closest("[data-min]")) { n.min = !n.min; el.classList.toggle("min", n.min); onChange(); } if (e.target.closest("[data-del]")) { if (!n.text || confirm("Delete this note?")) { el.remove(); onDelete(); } } };
  // drag
  el.querySelector("header").addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return; e.preventDefault(); const host = el.offsetParent || el.parentElement, W = host.clientWidth, sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
    const mv = (ev) => { el.style.left = Math.max(0, Math.min(W - 60, ox + ev.clientX - sx)) + "px"; el.style.top = Math.max(0, oy + ev.clientY - sy) + "px"; };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); n.x = +((el.offsetLeft / W) * 100).toFixed(2); n.y = el.offsetTop; el.style.left = n.x + "%"; onChange(); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
  });
  return el;
}
export async function renderStickies(root, t) {
  if (!root?.querySelector || !t?.url) return; await load();
  const list = all[key(t.url)] || []; const html = root.querySelector(".kb-html"); if (!html) return;
  root.querySelectorAll(".kb-sticky").forEach((x) => x.remove()); if (!list.length) return;
  if (!root.querySelector("#kbsticky-style")) { const st = document.createElement("style"); st.id = "kbsticky-style"; st.textContent = STYLE; html.append(st); }
  if (getComputedStyle(html).position === "static") html.style.position = "relative";
  for (const n of list) html.append(noteEl(n, save, () => { all[key(t.url)] = (all[key(t.url)] || []).filter((x) => x.id !== n.id); if (!all[key(t.url)].length) delete all[key(t.url)]; save(); }));
}
async function addSticky(root, t, sc) {
  if (!t?.url || !root?.querySelector(".kb-html")) return toast("Open a page first.");
  await load(); const html = root.querySelector(".kb-html");
  const y = Math.round((sc?.scrollTop || 0) + (sc?.clientHeight || 600) * 0.25 - (html.offsetTop || 0));
  const n = { id: Date.now().toString(36), x: 55, y: Math.max(10, y), text: "", c: "yellow", t: Date.now() };
  (all[key(t.url)] ||= []).push(n); save(); await renderStickies(root, t);
  root.querySelector(`.kb-sticky[data-id="${n.id}"] [contenteditable]`)?.focus();
  toast("Sticky note added. Drag it by its top bar; it'll be here when you come back.", { ms: 3500 });
}
async function allStickies(go) {
  await load(); const pages = Object.entries(all).filter(([, l]) => l.length); if (!pages.length) return toast("You have no sticky notes yet.");
  const m = modal({ title: "All my sticky notes", wide: true, body: pages.map(([u, l]) => `<div style="padding:8px 0;border-bottom:1px solid rgba(127,127,160,.25)"><a href="#" data-u="${esc(u)}"><b>${esc(u.replace(/^https?:\/\//, "").slice(0, 80))}</b></a>${l.map((n) => `<p style="margin:6px 0 0;padding:6px 8px;border-radius:6px;background:${COLORS[n.c] || COLORS.yellow};color:#222;white-space:pre-wrap">${esc(n.text || "(empty)")}</p>`).join("")}</div>`).join("") + `<p><button class="btn btn-sm" type="button" id="st-md">Copy all as Markdown</button></p>` });
  m.root.onclick = (e) => { const a = e.target.closest("[data-u]"); if (a) { e.preventDefault(); m.close(); go(a.dataset.u, { newTab: true }); } };
  $("#st-md", m.root).onclick = () => navigator.clipboard?.writeText(pages.map(([u, l]) => `## ${u}\n\n${l.map((n) => `> ${(n.text || "").replace(/\n/g, "\n> ")}`).join("\n\n")}`).join("\n\n")).then(() => toast("Copied."));
}

// ---------- compare two tabs ----------
const paras = (t) => { const d = t.data?.html ? new DOMParser().parseFromString(t.data.html, "text/html") : null; if (!d) return []; d.querySelectorAll("script,style,nav,header,footer,aside,noscript").forEach((n) => n.remove()); return [...d.querySelectorAll("h1,h2,h3,h4,p,li,td,pre,blockquote")].map((n) => (n.textContent || "").replace(/\s+/g, " ").trim()).filter((s) => s.length > 2).slice(0, 1500); };
function lcsDiff(A, B) {
  if (A.length * B.length > 2.5e6) return null;
  const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n && j < m) { if (A[i] === B[j]) { out.push([" ", A[i]]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) out.push(["-", A[i++]]); else out.push(["+", B[j++]]); }
  while (i < n) out.push(["-", A[i++]]); while (j < m) out.push(["+", B[j++]]); return out;
}
function compareTabs(T, B) {
  const a = T(); if (!a.data?.html) return toast("Open a page first.");
  const others = B.tabs.filter((x) => x !== a && x.data?.html); if (!others.length) return toast("Open another page in a second tab to compare with.");
  const m = modal({ title: "Compare with another tab", wide: true, body: `<label class="lbl">Compare this page with</label><select class="field" id="cmp-t">${others.map((x, i) => `<option value="${i}">${esc((x.custom || x.title || x.url).slice(0, 80))}</option>`).join("")}</select><label class="check" style="margin:8px 0"><input type="checkbox" id="cmp-same"> Show unchanged paragraphs too</label><p class="status" id="cmp-s"></p><div id="cmp-o" style="max-height:60vh;overflow:auto;font-size:14px"></div>` });
  const run = () => {
    const b = others[+$("#cmp-t", m.root).value], d = lcsDiff(paras(a), paras(b)), same = $("#cmp-same", m.root).checked;
    if (!d) return ($("#cmp-s", m.root).textContent = "Those pages are too long to compare here.");
    const add = d.filter((x) => x[0] === "+").length, del = d.filter((x) => x[0] === "-").length;
    $("#cmp-s", m.root).textContent = add || del ? `${del} paragraph${del === 1 ? "" : "s"} only on this page, ${add} only on the other.` : "The text of the two pages is the same.";
    $("#cmp-o", m.root).innerHTML = d.filter((x) => same || x[0] !== " ").map(([k, s]) => `<p style="margin:4px 0;padding:4px 8px;border-radius:6px;background:${k === "+" ? "rgba(63,166,106,.18)" : k === "-" ? "rgba(229,83,75,.18)" : "transparent"}"><b>${k === "+" ? "Other" : k === "-" ? "This" : "Both"}</b> · ${esc(s)}</p>`).join("");
  };
  $("#cmp-t", m.root).onchange = run; $("#cmp-same", m.root).onchange = run; run();
}

export function items({ T, B, go, root, scroller }) {
  return [
    { label: "Add a sticky note to this page", icon: "edit", run: () => addSticky(root(), T(), scroller()) },
    { label: "All my sticky notes…", icon: "list", run: () => allStickies(go) },
    { label: "Compare this page with another tab…", icon: "pages", run: () => compareTabs(T, B) },
  ];
}
