// Manga reader comfort: a searchable quick menu (/), tidy control groups, a page preview on the slider,
// bookmark and note marks along it, a long-press menu for touch screens, and a "welcome back" note.
import { $, esc, modal } from "../util.js";
import { pageSrc } from "../store.js";

const GROUPS = [
  ["Save and share", ["r-cover", "r-save", "r-copy", "r-clip", "r-spread", "r-sheet"]],
  ["Move around", ["r-goto", "r-random", "r-vols", "r-auto-turn", "r-wheel"]],
  ["Notes and memory", ["r-note", "r-notes", "r-cast", "r-linger", "r-rate"]],
  ["Time", ["r-pace", "r-goalbtn", "r-sleep"]],
  ["View", ["r-fitcycle", "r-rotate", "r-autohide"]],
];
const KEYS = { "r-bm": "B", "r-thumbs-btn": "T", "r-text": "O", "r-zoom": "Z", "r-guided": "G", "r-mag": "M" };

function groupControls() {
  const first = $("#r-cover"); const box = first?.parentElement; if (!box || box.dataset.grouped) return; box.dataset.grouped = "1"; box.style.display = "grid"; box.style.gap = "10px";
  for (const [name, ids] of GROUPS) {
    const btns = ids.map((id) => document.getElementById(id)).filter(Boolean); if (!btns.length) continue;
    const g = document.createElement("div"), l = document.createElement("div"), row = document.createElement("div");
    l.textContent = name; l.style.cssText = "font:600 11px system-ui;opacity:.65;margin-bottom:4px"; row.style.cssText = "display:flex;gap:6px;flex-wrap:wrap"; row.append(...btns); g.append(l, row); box.append(g);
  }
}

export function quickMenu() {
  const seen = new Set(), list = [];
  const add = (b) => { if (!b?.id || seen.has(b.id) || b.id === "r-quick") return; const label = (b.textContent.trim() || b.getAttribute("aria-label") || b.title || "").replace(/\s+/g, " "); if (!label) return; seen.add(b.id); const k = label.match(/\(([A-Z])\)/)?.[1] || KEYS[b.id] || ""; list.push({ id: b.id, label: label.replace(/\s*\([A-Z]\)/, ""), k }); };
  ["r-bm", "r-thumbs-btn", "r-text", "r-zoom", "r-guided", "r-mag"].forEach((id) => add(document.getElementById(id)));
  GROUPS.flatMap((g) => g[1]).forEach((id) => add(document.getElementById(id)));
  const m = modal({ title: "Quick menu", body: `<input class="field" type="text" id="qm-q" placeholder="What do you want to do?" aria-label="Search reader actions" style="width:100%"><div id="qm-l" role="listbox" aria-label="Reader actions" style="display:grid;gap:2px;margin-top:8px;max-height:52vh;overflow:auto"></div>` });
  const q = $("#qm-q", m.root), l = $("#qm-l", m.root); let at = 0, shown = [];
  const draw = () => { const s = q.value.toLowerCase().trim(); shown = list.filter((x) => !s || x.label.toLowerCase().includes(s)); at = Math.min(at, Math.max(0, shown.length - 1)); l.innerHTML = shown.map((x, k) => `<button type="button" role="option" aria-selected="${k === at}" data-i="${k}" style="all:unset;box-sizing:border-box;cursor:pointer;display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:8px;${k === at ? "background:rgba(127,127,160,.22)" : ""}"><span>${esc(x.label)}</span>${x.k ? `<kbd style="font:12px var(--f-mono,monospace);opacity:.7">${x.k}</kbd>` : ""}</button>`).join("") || `<p class="muted">Nothing matches.</p>`; l.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }); };
  const run = (x) => { if (!x) return; m.close(); document.getElementById(x.id)?.click(); };
  q.oninput = () => { at = 0; draw(); };
  q.addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { e.preventDefault(); at = Math.min(shown.length - 1, at + 1); draw(); } else if (e.key === "ArrowUp") { e.preventDefault(); at = Math.max(0, at - 1); draw(); } else if (e.key === "Enter") { e.preventDefault(); run(shown[at]); } });
  l.onclick = (e) => { const b = e.target.closest("[data-i]"); if (b) run(shown[+b.dataset.i]); };
  draw();
}

function sliderExtras(ctx) {
  const s = $("#r-slider"); if (!s) return () => {};
  const wrap = document.createElement("div"); wrap.style.cssText = "position:relative;flex:1;min-width:0;display:flex;align-items:center"; s.before(wrap); wrap.append(s); s.style.width = "100%";
  const marks = document.createElement("div"); marks.setAttribute("aria-hidden", "true"); marks.style.cssText = "position:absolute;left:8px;right:8px;top:-3px;height:5px;pointer-events:none"; wrap.append(marks);
  const tip = document.createElement("div"); tip.hidden = true; tip.style.cssText = "position:absolute;bottom:26px;width:96px;transform:translateX(-50%);background:#1c1d33;border:1px solid #3a3e66;border-radius:8px;padding:4px;pointer-events:none;z-index:9;text-align:center;font:600 12px system-ui;color:#fff"; tip.innerHTML = `<img alt="" style="display:block;width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:5px;background:#2b2f55"><span></span>`; wrap.append(tip);
  const n = () => ctx.item().pages, rtl = () => getComputedStyle(s).direction === "rtl", frac = (p) => (n() > 1 ? p / (n() - 1) : 0), place = (p) => (rtl() ? 1 - frac(p) : frac(p));
  let sig = "";
  const ticks = () => { const m = ctx.marks() || [], t = Object.keys(ctx.notes() || {}), k = `${m.map((b) => b.pos)}|${t}|${rtl()}`; if (k === sig) return; sig = k; marks.innerHTML = [...m.map((b) => [b.pos, "#ffd36b"]), ...t.map((p) => [+p, "#7fd6c2"])].map(([p, c]) => `<i style="position:absolute;left:${(place(p) * 100).toFixed(2)}%;width:3px;height:5px;border-radius:2px;margin-left:-1px;background:${c}"></i>`).join(""); };
  let want = -1, seq = 0;
  const show = (p, x) => { tip.hidden = false; tip.style.left = Math.max(52, Math.min(wrap.clientWidth - 52, x)) + "px"; tip.lastChild.textContent = `Page ${p + 1}`; if (p === want) return; want = p; const my = ++seq; pageSrc(ctx.item(), p).then((src) => { if (my === seq) tip.firstChild.src = src; }).catch(() => {}); };
  const hide = () => { tip.hidden = true; };
  s.addEventListener("pointermove", (e) => { if (e.pointerType === "touch" && !e.buttons) return; const r = s.getBoundingClientRect(), f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); show(Math.round((rtl() ? 1 - f : f) * (n() - 1)), e.clientX - r.left); });
  s.addEventListener("pointerleave", hide); s.addEventListener("pointerup", () => setTimeout(hide, 500)); s.addEventListener("pointercancel", hide);
  ticks(); return ticks;
}

function longPress(ctx) {
  const st = $("#r-stage"); if (!st) return; let t = 0, x = 0, y = 0, fired = false;
  const cancel = () => clearTimeout(t);
  st.addEventListener("pointerdown", (e) => { cancel(); fired = false; if (e.pointerType !== "touch" || !e.isPrimary || ctx.zoomed()) return; x = e.clientX; y = e.clientY; t = setTimeout(() => { fired = true; ctx.noClick(); navigator.vibrate?.(12); sheet(ctx); }, 550); });
  st.addEventListener("pointermove", (e) => { if (Math.abs(e.clientX - x) + Math.abs(e.clientY - y) > 10) cancel(); });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) st.addEventListener(ev, cancel);
  st.addEventListener("contextmenu", (e) => { if (fired || e.pointerType === "touch") e.preventDefault(); });
}
function sheet(ctx) {
  const m = modal({ title: `Page ${ctx.page() + 1}`, body: `<div style="display:grid;gap:6px">${[["r-bm", "Bookmark or unbookmark"], ["r-note", "Write a note"], ["r-clip", "Clip a panel"], ["r-save", "Save this page"], ["r-cast", "Cast notebook"], ["r-rotate", "Rotate page"]].map(([id, l]) => `<button class="btn" type="button" data-b="${id}">${l}</button>`).join("")}</div>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-b]"); if (b) { m.close(); document.getElementById(b.dataset.b)?.click(); } });
}

function welcomeBack(ctx, saved) {
  if (!saved?.updated || !(saved.pos > 0) || ctx.page() !== saved.pos) return; const days = Math.floor((Date.now() / 1000 - saved.updated) / 86400); if (days < 5) return;
  const notes = Object.entries(ctx.notes() || {}).filter(([p]) => +p <= saved.pos).sort((a, b) => b[0] - a[0]), last = notes[0];
  const c = document.createElement("div"); c.id = "r-welcome"; c.setAttribute("role", "status"); c.style.cssText = "position:absolute;left:50%;bottom:64px;transform:translateX(-50%);z-index:8;width:min(420px,calc(100% - 24px));background:#1c1d33;color:#fff;border:1px solid #3a3e66;border-radius:12px;padding:12px 14px;font:14px/1.4 system-ui;box-shadow:0 8px 28px rgba(0,0,0,.45)";
  c.innerHTML = `<b>Welcome back.</b> You left off on page ${saved.pos + 1}, ${days} days ago.${last ? `<div style="opacity:.8;margin-top:4px">Your note on page ${+last[0] + 1}: ${esc(last[1].text.slice(0, 120))}</div>` : ""}<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn btn-sm" type="button" data-w="back" style="background:#2b2f55;border-color:#3a3e66;color:#fff">Back 5 pages</button><button class="btn btn-sm" type="button" data-w="cast" style="background:#2b2f55;border-color:#3a3e66;color:#fff">Cast notebook</button><button class="btn btn-sm" type="button" data-w="x" style="background:#2b2f55;border-color:#3a3e66;color:#fff">Keep reading</button></div>`;
  c.addEventListener("click", (e) => { e.stopPropagation(); const w = e.target.closest("[data-w]")?.dataset.w; if (!w) return; c.remove(); if (w === "back") ctx.jump(Math.max(0, saved.pos - 5)); if (w === "cast") $("#r-cast")?.click(); });
  $("#r-stage")?.parentElement?.append(c); setTimeout(() => c.remove(), 20000);
}

export function attach(ctx, saved) {
  groupControls(); const ticks = sliderExtras(ctx); longPress(ctx); welcomeBack(ctx, saved);
  return { ticks };
}
