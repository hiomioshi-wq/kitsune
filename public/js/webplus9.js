// Kitsune Browser, v114: vertical tabs, swipe to go back and forward, pull down to reload, footnote pop-ups,
// a "minutes left" reading estimate, and tab previews on hover.
import { $, esc, toast } from "./util.js";

const on = (k) => localStorage.getItem(k) === "1";
const flip = (k) => { const v = !on(k); try { v ? localStorage.setItem(k, "1") : localStorage.removeItem(k); } catch {} return v; };

const STYLE = `
.kb.kb-vt { grid-template-columns: 220px minmax(0, 1fr); grid-template-rows: auto 3px minmax(0, 1fr); }
.kb.kb-vt > .kb-tabs { grid-column: 1; grid-row: 1 / 4; flex-direction: column; overflow-x: hidden; overflow-y: auto; padding: 8px; gap: 3px; border-right: 1px solid var(--line); }
.kb.kb-vt > :not(.kb-tabs) { grid-column: 2; }
.kb.kb-vt .kb-tab { flex: none; min-width: 0; border-radius: 10px; }
.kb.kb-vt .kb-newtab { align-self: flex-start; }
@media (max-width: 760px) { .kb.kb-vt { grid-template-columns: 1fr; grid-template-rows: auto auto 3px minmax(0, 1fr); } .kb.kb-vt > .kb-tabs { grid-row: auto; flex-direction: row; overflow-x: auto; border-right: 0; } .kb.kb-vt > :not(.kb-tabs) { grid-column: 1; } }
.kb-swipe { position: absolute; top: 50%; z-index: 30; width: 44px; height: 44px; margin-top: -22px; border-radius: 50%; display: grid; place-items: center; background: var(--accent, #f2a03f); color: #111; font: 700 20px system-ui; pointer-events: none; opacity: 0; transition: opacity .1s; }
.kb-pull { position: absolute; left: 50%; top: 8px; z-index: 30; margin-left: -18px; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: var(--surface, #222); border: 1px solid var(--line); font: 18px system-ui; pointer-events: none; opacity: 0; }
.kb-left { position: absolute; right: 14px; top: 10px; z-index: 19; font: 600 11px system-ui, sans-serif; padding: 3px 8px; border-radius: 99px; background: color-mix(in srgb, var(--surface, #222) 85%, transparent); border: 1px solid var(--line); opacity: .85; pointer-events: none; }
.kb-tabpeek { position: fixed; z-index: 60; width: 280px; padding: 10px 12px; border-radius: 12px; background: var(--surface, #1c1d33); border: 1px solid var(--line); box-shadow: 0 10px 30px rgba(0,0,0,.35); font-size: 13px; pointer-events: none; }
.kb-tabpeek b { display: block; margin-bottom: 2px; } .kb-tabpeek small { opacity: .65; word-break: break-all; } .kb-tabpeek p { margin: 6px 0 0; opacity: .8; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
`;
const FN_STYLE = `.kbfn-pop{position:absolute;z-index:50;max-width:min(420px,90%);padding:10px 12px;border-radius:10px;background:#fff;color:#222;border:1px solid #8886;box-shadow:0 8px 24px rgba(0,0,0,.25);font:14px/1.5 system-ui,sans-serif}.kbfn-pop a{color:#2a6fd6}:host(.kb-dark) .kbfn-pop{background:#1f2030;color:#e8e8f0}`;

let wired = false;
export function init({ B, go }) {
  if (!document.getElementById("kb9-style")) { const s = document.createElement("style"); s.id = "kb9-style"; s.textContent = STYLE; document.head.append(s); }
  const kb = $("#kb", B.view); kb?.classList.toggle("kb-vt", on("kitsune.webVTabs"));
  const body = $("#kb-body", B.view); if (!body || body.dataset.kb9) return; body.dataset.kb9 = "1";

  // ---- swipe back / forward and pull to reload (touch only) ----
  const arrow = document.createElement("div"); arrow.className = "kb-swipe"; body.append(arrow);
  const pull = document.createElement("div"); pull.className = "kb-pull"; pull.textContent = "↻"; body.append(pull);
  let sx = 0, sy = 0, mode = null, scroller = null;
  body.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1 || on("kitsune.webNoGestures")) return; const t = e.touches[0], r = body.getBoundingClientRect();
    sx = t.clientX; sy = t.clientY; mode = null; scroller = e.target.closest?.(".kb-view, [style*=overflow]") || body.querySelector(".kb-view") || null;
    if (sx - r.left < 28) mode = "back"; else if (r.right - sx < 28) mode = "fwd"; else if ((scroller?.scrollTop ?? 0) <= 0) mode = "pull";
  }, { passive: true });
  body.addEventListener("touchmove", (e) => {
    if (!mode) return; const t = e.touches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (mode === "pull") { if (dy < 0 || Math.abs(dx) > dy) { mode = null; pull.style.opacity = 0; return; } pull.style.opacity = Math.min(1, dy / 90); pull.style.transform = `translateY(${Math.min(70, dy / 2)}px) rotate(${dy * 2}deg)`; return; }
    const d = mode === "back" ? dx : -dx; if (Math.abs(dy) > 60) { mode = null; arrow.style.opacity = 0; return; }
    arrow.textContent = mode === "back" ? "←" : "→"; arrow.style[mode === "back" ? "left" : "right"] = Math.min(40, d / 3) - 10 + "px"; arrow.style[mode === "back" ? "right" : "left"] = "auto"; arrow.style.opacity = Math.min(1, d / 100);
  }, { passive: true });
  body.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (mode === "back" && dx > 100) $('[data-b="back"]', B.view)?.click();
    if (mode === "fwd" && -dx > 100) $('[data-b="fwd"]', B.view)?.click();
    if (mode === "pull" && dy > 110 && Math.abs(dx) < dy / 2) $('[data-b="reload"]', B.view)?.click();
    arrow.style.opacity = 0; pull.style.opacity = 0; pull.style.transform = ""; mode = null;
  }, { passive: true });

  // ---- tab previews on hover ----
  if (!wired) {
    wired = true; let peek = null, tm = null;
    document.addEventListener("mouseover", (e) => {
      const tab = e.target.closest?.(".kb-tab"); if (!tab || on("kitsune.webNoTabPeek")) return;
      clearTimeout(tm); tm = setTimeout(() => {
        const i = [...tab.parentElement.querySelectorAll(".kb-tab")].indexOf(tab), t = B.tabs[i]; if (!t?.url || i === B.active) return;
        peek?.remove(); peek = document.createElement("div"); peek.className = "kb-tabpeek";
        const desc = t.data?.html?.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,300})/i)?.[1] || "";
        peek.innerHTML = `<b>${esc(t.title || "")}</b><small>${esc(t.url)}</small>${desc ? `<p>${esc(desc)}</p>` : ""}`;
        const r = tab.getBoundingClientRect(); document.body.append(peek);
        const vt = tab.closest(".kb-vt"); Object.assign(peek.style, vt ? { left: r.right + 8 + "px", top: r.top + "px" } : { left: Math.min(innerWidth - 290, r.left) + "px", top: r.bottom + 6 + "px" });
      }, 450);
    });
    document.addEventListener("mouseout", (e) => { if (e.target.closest?.(".kb-tab")) { clearTimeout(tm); peek?.remove(); peek = null; } });
  }
}

// ---- after each page: footnotes and minutes left ----
export function afterRender({ root, scroller, B }) {
  try { footnotes(root); } catch {}
  try { minutesLeft(scroller, B); } catch {}
}
function footnotes(root) {
  if (!root?.querySelectorAll || on("kitsune.webNoFootnotes") || root.__kbFn) return; root.__kbFn = true;
  if (!root.querySelector("#kbfn-style")) { const s = document.createElement("style"); s.id = "kbfn-style"; s.textContent = FN_STYLE; (root.querySelector(".kb-html") || root).append(s); }
  const isRef = (a) => { const h = a.getAttribute("href"); if (!h || h.length < 2 || h[0] !== "#") return false; const txt = (a.textContent || "").trim(); return /^\[?\d{1,3}[a-z]?\]?$|^[*†‡§]$|^\[?[a-z]\]?$/i.test(txt) || !!a.closest("sup") || /footnote|fnref|cite_ref|noteref/i.test(a.id + " " + a.className + " " + (a.getAttribute("role") || "")); };
  let pop = null, tm = null; const close = () => { pop?.remove(); pop = null; };
  const show = (a) => {
    close(); const rawId = a.getAttribute("href").slice(1); const id = (() => { try { return decodeURIComponent(rawId); } catch { return rawId; } })(); let target; try { target = root.getElementById ? root.getElementById(id) : root.querySelector("#" + CSS.escape(id)); } catch { return; } if (!target) return;
    const box = target.closest("li, p, div, aside, dd") || target, clone = box.cloneNode(true);
    clone.querySelectorAll('a[href^="#cite_ref"], a[href^="#fnref"], .mw-cite-backlink, [role="doc-backlink"], .footnote-back, .reversefootnote').forEach((n) => n.remove());
    const text = (clone.innerHTML || "").trim(); if (!text) return;
    pop = document.createElement("div"); pop.className = "kbfn-pop"; pop.innerHTML = text;
    const host = a.closest(".kb-html") || root.firstElementChild || root; host.append(pop);
    const ar = a.getBoundingClientRect(), hr = host.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(hr.width - pop.offsetWidth - 8, ar.left - hr.left - 20)) + "px"; pop.style.top = ar.bottom - hr.top + 6 + "px";
  };
  root.addEventListener("mouseover", (e) => { const a = e.target.closest?.("a[href^='#']"); if (!a || !isRef(a)) return; clearTimeout(tm); tm = setTimeout(() => show(a), 250); }, { passive: true });
  root.addEventListener("mouseout", (e) => { if (e.target.closest?.("a[href^='#']")) { clearTimeout(tm); setTimeout(() => { if (pop && !pop.matches(":hover")) close(); }, 250); } }, { passive: true });
  root.addEventListener("click", (e) => { const a = e.target.closest?.("a[href^='#']"); if (a && isRef(a) && matchMedia("(hover: none)").matches) { e.preventDefault(); pop ? close() : show(a); } else if (pop && !e.target.closest(".kbfn-pop")) close(); });
}
function minutesLeft(scroller, B) {
  $(".kb-left", B.view)?.remove(); if (!scroller || on("kitsune.webNoMinutesLeft")) return;
  const src = scroller.shadowRoot?.querySelector(".kb-body, .kb-html") || scroller.shadowRoot || scroller, words = (src.textContent || "").split(/\s+/).length; if (words < 600) return;
  const el = document.createElement("div"); el.className = "kb-left"; $("#kb-body", B.view)?.append(el);
  const paint = () => { const max = scroller.scrollHeight - scroller.clientHeight, p = max > 0 ? scroller.scrollTop / max : 0, left = Math.ceil((words * (1 - p)) / 230); el.textContent = p > 0.98 ? "Done ✓" : `${left} min left`; el.style.display = p < 0.02 ? "none" : ""; };
  scroller.addEventListener("scroll", paint, { passive: true }); paint();
}

export function items({ B }) {
  return [
    { label: on("kitsune.webVTabs") ? "Vertical tabs: on (turn off)" : "Vertical tabs", icon: "list", run: () => { const v = flip("kitsune.webVTabs"); $("#kb", B.view)?.classList.toggle("kb-vt", v); toast(v ? "Tabs are down the side now." : "Tabs are back on top."); } },
    { label: on("kitsune.webNoGestures") ? "Swipe gestures: off (turn on)" : "Swipe gestures: on (turn off)", icon: "back", run: () => { const off = flip("kitsune.webNoGestures"); toast(off ? "Swipe gestures off." : "Swipe from an edge to go back or forward, and pull down at the top to reload."); } },
    { label: on("kitsune.webNoFootnotes") ? "Footnote pop-ups: off (turn on)" : "Footnote pop-ups: on (turn off)", icon: "info", run: () => { const off = flip("kitsune.webNoFootnotes"); toast(off ? "Footnote pop-ups off." : "Hover or tap a footnote number to read it in place. Reload to apply."); } },
    { label: on("kitsune.webNoMinutesLeft") ? "Minutes-left estimate: off (turn on)" : "Minutes-left estimate: on (turn off)", icon: "clock", run: () => { const off = flip("kitsune.webNoMinutesLeft"); toast(off ? "Minutes-left estimate off." : "Shown on long pages. Reload to apply."); } },
    { label: on("kitsune.webNoTabPeek") ? "Tab previews on hover: off (turn on)" : "Tab previews on hover: on (turn off)", icon: "pages", run: () => { const off = flip("kitsune.webNoTabPeek"); toast(off ? "Tab previews off." : "Hover a tab to see what's in it."); } },
  ];
}
