// The Atlas: your library as a night sky. Each title is a star, each series or author a constellation.
// Finished titles burn gold, the ones you're reading glow in your accent, unread ones are faint. Drag to pan,
// scroll or pinch to zoom, search to fly to a star.
import { $, $$, esc, icon } from "../util.js";
import { lib, allProgress, progressPct, coverSrc, getItem } from "../store.js";
import { setCrumbs } from "../main.js";
import { openItem } from "./common.js";

const GOLD = 137.508 * (Math.PI / 180);
const groupKey = (i) => String(i.series || i.author || i.title || "").trim().toLowerCase() || i.id;

function layoutSky(items, prog) {
  const groups = new Map();
  for (const it of items) {
    const k = groupKey(it);
    if (!groups.has(k)) groups.set(k, { name: it.series || it.author || it.title, items: [] });
    groups.get(k).items.push(it);
  }
  const list = [...groups.values()].sort((a, b) => b.items.length - a.items.length);
  const stars = [], cons = [];
  list.forEach((g, gi) => {
    const R = 170 * Math.sqrt(gi) + (gi ? 60 : 0), th = gi * GOLD;
    const cx = Math.cos(th) * R, cy = Math.sin(th) * R;
    const m = g.items.length;
    const rad = m === 1 ? 0 : 24 + Math.sqrt(m) * 22;
    const pts = g.items.map((it, k) => {
      // A loose spiral inside the constellation keeps neighbouring volumes near each other.
      const a = k * 2.4 + gi, r = m === 1 ? 0 : rad * (0.35 + 0.65 * ((k + 1) / m));
      const p = prog[it.id], pct = progressPct(p);
      const state = pct >= 100 || (p && p.pos >= p.total - 2) ? "done" : pct > 0 ? "reading" : "unread";
      const s = { it, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, pct, state, g: gi };
      stars.push(s);
      return s;
    });
    cons.push({ name: g.name, x: cx, y: cy - rad - 22, pts, n: m });
  });
  return { stars, cons };
}

export async function render(view) {
  setCrumbs([["Atlas", "atlas"]]);
  const prog = await allProgress();
  const items = lib.items.slice();
  if (!items.length) {
    view.innerHTML = `<div class="empty"><svg class="empty-fox"><use href="#fox"/></svg><p><strong>The sky is empty.</strong> Add a book or a manga and its star appears here.</p><a class="btn btn-accent" href="#books/free">Find something to read</a></div>`;
    return;
  }
  const { stars, cons } = layoutSky(items, prog);
  const xs = stars.map((s) => s.x), ys = stars.map((s) => s.y);
  const pad = 160;
  const home = { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad - 30, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 + 30 };
  const counts = { done: 0, reading: 0, unread: 0 };
  stars.forEach((s) => counts[s.state]++);
  // Faint background stars, the same every visit.
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const far = Array.from({ length: 260 }, () => ({ x: home.x - 600 + rnd() * (home.w + 1200), y: home.y - 600 + rnd() * (home.h + 1200), r: rnd() * 1.4 + 0.3, o: rnd() * 0.6 + 0.15, d: rnd() * 6 }));

  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Your library, mapped</p><h1 class="h1">Atlas</h1>
      <p class="lede">${items.length} ${items.length === 1 ? "star" : "stars"} in ${cons.length} ${cons.length === 1 ? "constellation" : "constellations"}. Gold for finished, glowing for in progress, faint for waiting.</p></div></div>
    <div class="atlas" id="atlas">
      <div class="atlas-tools">
        <div class="seg atlas-filter" role="group" aria-label="Show">${[["all", `All ${items.length}`], ["reading", `Reading ${counts.reading}`], ["done", `Finished ${counts.done}`], ["unread", `Unread ${counts.unread}`]].map(([v, l], i) => `<button type="button" data-f="${v}" aria-pressed="${i === 0}">${l}</button>`).join("")}</div>
        <label class="atlas-search">${icon("search")}<input type="search" id="atlas-q" placeholder="Find a star…" list="atlas-list" aria-label="Find a title"><datalist id="atlas-list">${stars.map((s) => `<option value="${esc(s.it.title)}">`).join("")}</datalist></label>
      </div>
      <svg class="atlas-sky" id="atlas-sky" viewBox="${home.x} ${home.y} ${home.w} ${home.h}" role="group" aria-label="Star map of your library">
        <defs>
          <radialGradient id="at-neb1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient>
          <radialGradient id="at-neb2"><stop offset="0" stop-color="#6b5cff" stop-opacity=".2"/><stop offset="1" stop-color="#6b5cff" stop-opacity="0"/></radialGradient>
          <filter id="at-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>
        </defs>
        <circle cx="${home.x + home.w * 0.3}" cy="${home.y + home.h * 0.35}" r="${Math.max(home.w, home.h) * 0.45}" fill="url(#at-neb1)"/>
        <circle cx="${home.x + home.w * 0.75}" cy="${home.y + home.h * 0.7}" r="${Math.max(home.w, home.h) * 0.4}" fill="url(#at-neb2)"/>
        <g class="at-far">${far.map((f) => `<circle cx="${f.x.toFixed(1)}" cy="${f.y.toFixed(1)}" r="${f.r.toFixed(2)}" opacity="${f.o.toFixed(2)}" style="--d:${f.d.toFixed(1)}s"/>`).join("")}</g>
        <g class="at-lines">${cons.filter((c) => c.n > 1).map((c) => `<polyline data-g="${c.pts[0].g}" points="${c.pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}"/>`).join("")}</g>
        <g class="at-names">${cons.filter((c) => c.n > 1).map((c) => `<text x="${c.x.toFixed(1)}" y="${c.y.toFixed(1)}" text-anchor="middle" data-g="${c.pts[0].g}">${esc(String(c.name).length > 30 ? String(c.name).slice(0, 28) + "…" : c.name)}</text>`).join("")}</g>
        <g class="at-stars">${stars.map((s, k) => { const r = s.state === "done" ? 7 : s.state === "reading" ? 6 : 4;
          return `<g class="at-star ${s.state}" data-k="${k}" data-id="${esc(s.it.id)}" transform="translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(s.it.title)}, ${s.state === "done" ? "finished" : s.state === "reading" ? `${s.pct}% read` : "unread"}">
            <circle class="at-halo" r="${r * 3}" filter="url(#at-glow)"/>${s.state === "unread" ? "" : `<path class="at-spark" d="M0 ${-r * 2.6} L${r * 0.35} 0 L0 ${r * 2.6} L${-r * 0.35} 0 Z M${-r * 2.6} 0 L0 ${r * 0.35} L${r * 2.6} 0 L0 ${-r * 0.35} Z"/>`}<circle class="at-core" r="${r}"/>
            ${s.state === "reading" ? `<circle class="at-ring" r="${r + 5}" stroke-dasharray="${((s.pct / 100) * 2 * Math.PI * (r + 5)).toFixed(1)} 999" transform="rotate(-90)"/>` : ""}</g>`; }).join("")}</g>
      </svg>
      <div class="atlas-zoom"><button class="btn btn-icon" type="button" data-z="in" aria-label="Zoom in">${icon("plus")}</button><button class="btn btn-icon" type="button" data-z="out" aria-label="Zoom out"><svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button><button class="btn btn-icon" type="button" data-z="home" aria-label="Show everything">${icon("expand")}</button></div>
      <div class="atlas-card" id="atlas-card" hidden></div>
      <p class="atlas-hint">Drag to look around · scroll or pinch to zoom · tap a star</p>
    </div>`;

  const sky = $("#atlas-sky", view), card = $("#atlas-card", view), wrap = $("#atlas", view);
  let vb = { ...home }, anim = 0;
  const setVB = (v) => { vb = v; sky.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`); sky.style.setProperty("--z", String(home.w / v.w)); };
  const fly = (to, ms = 700) => {
    cancelAnimationFrame(anim);
    if ((document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches)) return setVB(to);
    const from = { ...vb }, t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / ms), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setVB({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
      if (p < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  };
  const toSky = (cx, cy) => { const r = sky.getBoundingClientRect(), s = Math.max(vb.w / r.width, vb.h / r.height);
    const ox = (r.width * s - vb.w) / 2, oy = (r.height * s - vb.h) / 2; return { x: vb.x - ox + (cx - r.left) * s, y: vb.y - oy + (cy - r.top) * s }; };
  const zoomAt = (f, cx, cy) => {
    const minW = 140, maxW = home.w * 2.5;
    const w = Math.max(minW, Math.min(maxW, vb.w / f)), k = w / vb.w, h = vb.h * k;
    const p = cx == null ? { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 } : toSky(cx, cy);
    setVB({ x: p.x - (p.x - vb.x) * k, y: p.y - (p.y - vb.y) * k, w, h });
  };
  setVB(vb);

  sky.addEventListener("wheel", (e) => { e.preventDefault(); cancelAnimationFrame(anim); zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY); }, { passive: false });
  const ptrs = new Map(); let last = null, pinch = null, moved = 0;
  sky.addEventListener("pointerdown", (e) => { ptrs.set(e.pointerId, e); last = { x: e.clientX, y: e.clientY }; moved = 0; cancelAnimationFrame(anim);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); } });
  sky.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, e);
    if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); zoomAt(d / pinch, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2); pinch = d; moved = 99; return; }
    const r = sky.getBoundingClientRect(), s = Math.max(vb.w / r.width, vb.h / r.height);
    const dx = e.clientX - last.x, dy = e.clientY - last.y; moved += Math.abs(dx) + Math.abs(dy);
    last = { x: e.clientX, y: e.clientY };
    if (moved > 4) { if (!sky.hasPointerCapture?.(e.pointerId)) sky.setPointerCapture?.(e.pointerId); setVB({ ...vb, x: vb.x - dx * s, y: vb.y - dy * s }); wrap.classList.add("dragging"); }
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size) setTimeout(() => wrap.classList.remove("dragging"), 0); };
  sky.addEventListener("pointerup", up); sky.addEventListener("pointercancel", up);

  const show = (g, pin = false) => {
    const s = stars[Number(g.dataset.k)], it = s.it;
    $$(".at-star.sel", sky).forEach((x) => x.classList.remove("sel")); g.classList.add("sel");
    sky.classList.add("focus-g"); sky.dataset.g = String(s.g);
    $$("[data-g]", sky).forEach((x) => x.classList.toggle("hot", x.dataset.g === String(s.g)));
    card.innerHTML = `${coverSrc(it) ? `<img src="${esc(coverSrc(it))}" alt="">` : ""}<div><p class="eyebrow">${esc(it.type === "manga" ? "Manga" : it.type === "audio" ? "Audiobook" : "Book")}${it.series ? " · " + esc(it.series) : ""}</p>
      <strong>${esc(it.title)}</strong><span class="muted">${s.state === "done" ? "Finished" : s.state === "reading" ? `${s.pct}% read` : "Not started"}</span>
      <div class="atlas-card-act"><button class="btn btn-accent" type="button" data-open="${esc(it.id)}">${icon("book")} ${s.state === "reading" ? "Continue" : s.state === "done" ? "Read again" : "Start"}</button><a class="btn" href="#item/${encodeURIComponent(it.id)}">Details</a></div></div>`;
    card.hidden = false;
    if (pin) { const w = Math.min(vb.w, 520), h = vb.h * (w / vb.w); fly({ x: s.x - w / 2, y: s.y - h / 2, w, h }); }
  };
  sky.addEventListener("click", (e) => { const g = e.target.closest(".at-star"); if (moved > 6) return; if (g) show(g, true); else { card.hidden = true; sky.classList.remove("focus-g"); $$(".hot", sky).forEach((x) => x.classList.remove("hot")); $$(".sel", sky).forEach((x) => x.classList.remove("sel")); } });
  sky.addEventListener("keydown", (e) => { const g = e.target.closest?.(".at-star"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); show(g, true); } });
  sky.addEventListener("focusin", (e) => { const g = e.target.closest?.(".at-star"); if (g) show(g); });
  card.addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) { const it = getItem(b.dataset.open); if (it) openItem(it); } });
  $$("[data-z]", view).forEach((b) => (b.onclick = () => { if (b.dataset.z === "home") fly(home); else { const r = sky.getBoundingClientRect(); cancelAnimationFrame(anim); zoomAt(b.dataset.z === "in" ? 1.6 : 1 / 1.6); } }));
  $$("[data-f]", view).forEach((b) => (b.onclick = () => { $$("[data-f]", view).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); sky.dataset.f = b.dataset.f; }));
  $("#atlas-q", view).addEventListener("change", (e) => {
    const q = e.target.value.trim().toLowerCase(); if (!q) return;
    const k = stars.findIndex((s) => s.it.title.toLowerCase() === q) >= 0 ? stars.findIndex((s) => s.it.title.toLowerCase() === q) : stars.findIndex((s) => s.it.title.toLowerCase().includes(q));
    if (k >= 0) show($(`.at-star[data-k="${k}"]`, sky), true);
  });
  const onKey = (e) => { if (e.key === "Escape" && !card.hidden) { card.hidden = true; sky.classList.remove("focus-g"); } };
  addEventListener("keydown", onKey);
  return () => { cancelAnimationFrame(anim); removeEventListener("keydown", onKey); };
}
