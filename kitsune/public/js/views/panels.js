// Panel studio: lay out comic pages from your own art, letter them, and publish them as a work.
import { $, $$, esc, icon, toast, modal, uid, clamp } from "../util.js";
import { kvGet, kvSet, saveItem } from "../store.js";
import { setCrumbs } from "../main.js";

const W = 1200, H = 1800; // page size in pixels (2:3)
// Panel layouts in page fractions [x, y, w, h], before gutters.
const LAYOUTS = {
  single: { name: "Splash", panels: [[0, 0, 1, 1]] },
  rows2: { name: "Two rows", panels: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]] },
  rows3: { name: "Three rows", panels: [[0, 0, 1, 1 / 3], [0, 1 / 3, 1, 1 / 3], [0, 2 / 3, 1, 1 / 3]] },
  grid4: { name: "Four grid", panels: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
  topBig: { name: "Big top", panels: [[0, 0, 1, 0.58], [0, 0.58, 0.5, 0.42], [0.5, 0.58, 0.5, 0.42]] },
  bottomBig: { name: "Big bottom", panels: [[0, 0, 0.5, 0.42], [0.5, 0, 0.5, 0.42], [0, 0.42, 1, 0.58]] },
  manga5: { name: "Manga five", panels: [[0.42, 0, 0.58, 0.3], [0, 0, 0.42, 0.3], [0, 0.3, 1, 0.34], [0.55, 0.64, 0.45, 0.36], [0, 0.64, 0.55, 0.36]] },
  six: { name: "Six grid", panels: [0, 1, 2].flatMap((r) => [[0, r / 3, 0.5, 1 / 3], [0.5, r / 3, 0.5, 1 / 3]]) },
};
const PAPER = { white: ["#ffffff", "#111111"], cream: ["#f6f0e2", "#1d1a16"], black: ["#0d0d0f", "#f2f2f2"] };
const BUBBLES = { speech: "Speech", thought: "Thought", caption: "Caption", sfx: "Sound effect" };

const blankPage = () => ({ id: uid("pg-"), layout: "manga5", gutter: 24, margin: 48, border: 6, paper: "white", art: {}, bubbles: [] });
const state = { project: null, page: 0, sel: null, drag: null, images: new Map() };

async function loadProject() {
  const p = await kvGet("panelDraft", null);
  return p?.pages?.length ? p : { id: uid("pj-"), title: "", pages: [blankPage()] };
}
let saveT;
const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => kvSet("panelDraft", state.project), 400); };

function panelRects(pg) {
  const L = LAYOUTS[pg.layout] || LAYOUTS.single, m = pg.margin, g = pg.gutter / 2;
  const iw = W - 2 * m, ih = H - 2 * m;
  return L.panels.map(([x, y, w, h]) => ({
    x: m + x * iw + (x > 0 ? g : 0), y: m + y * ih + (y > 0 ? g : 0),
    w: w * iw - (x > 0 ? g : 0) - (x + w < 0.999 ? g : 0), h: h * ih - (y > 0 ? g : 0) - (y + h < 0.999 ? g : 0),
  }));
}

async function bitmapFor(blob) {
  if (!blob) return null;
  if (state.images.has(blob)) return state.images.get(blob);
  const bmp = await createImageBitmap(blob);
  state.images.set(blob, bmp);
  return bmp;
}

function wrapLines(g, text, maxW) {
  const out = [];
  for (const para of String(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const t = line ? line + " " + word : word;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}

function drawBubble(g, b, ink, paper) {
  const fs = b.size || 34;
  g.font = b.kind === "sfx" ? `400 ${fs * 1.8}px "Dela Gothic One", Impact, sans-serif` : `700 ${fs}px "Zen Kaku Gothic New", system-ui, sans-serif`;
  if (b.kind === "sfx") {
    g.save(); g.translate(b.x, b.y); g.rotate((b.rot || -8) * Math.PI / 180);
    g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
    g.lineWidth = fs * 0.35; g.strokeStyle = paper; g.strokeText(b.text, 0, 0);
    g.fillStyle = b.color || ink; g.fillText(b.text, 0, 0); g.restore();
    const w = g.measureText(b.text).width; b._box = { x: b.x - w / 2, y: b.y - fs, w, h: fs * 2 };
    return;
  }
  const lines = wrapLines(g, b.text, b.w - fs * 1.2);
  const lh = fs * 1.25, th = lines.length * lh;
  const bw = b.w, bh = Math.max(th + fs * 1.4, fs * 2.4);
  const x = b.x - bw / 2, y = b.y - bh / 2;
  g.lineWidth = 4; g.strokeStyle = "#111"; g.fillStyle = "#fff";
  if (b.kind === "caption") {
    g.fillStyle = "#fff9e6"; g.fillRect(x, y, bw, bh); g.strokeRect(x, y, bw, bh);
  } else if (b.kind === "thought") {
    g.beginPath();
    const n = 12;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.moveTo(b.x + Math.cos(a) * bw / 2 + 28, b.y + Math.sin(a) * bh / 2); g.arc(b.x + Math.cos(a) * bw / 2, b.y + Math.sin(a) * bh / 2, 28, 0, Math.PI * 2); }
    g.fill(); g.stroke();
    g.beginPath(); g.ellipse(b.x, b.y, bw / 2, bh / 2, 0, 0, Math.PI * 2); g.fill();
    const tx = b.x + (b.tail || 0.6) * bw * 0.5, ty = b.y + bh / 2 + 30;
    [[0, 16], [26, 10], [46, 6]].forEach(([d, r]) => { g.beginPath(); g.arc(tx + d * Math.sign(b.tail || 1), ty + d, r, 0, Math.PI * 2); g.fill(); g.stroke(); });
  } else {
    const tailX = b.x + (b.tail ?? 0.4) * bw * 0.5, tailTip = [tailX + (b.tail ?? 0.4) * 60, y + bh + 70];
    g.beginPath(); g.ellipse(b.x, b.y, bw / 2, bh / 2, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(tailX - 22, b.y + bh / 2 - 12); g.lineTo(...tailTip); g.lineTo(tailX + 22, b.y + bh / 2 - 8); g.fill(); g.stroke();
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(b.x, b.y, bw / 2 - 3, bh / 2 - 3, 0, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "#111"; g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((l, i) => g.fillText(l, b.x, b.y - th / 2 + lh * (i + 0.5)));
  b._box = { x, y, w: bw, h: bh };
}

// Draws a page onto a canvas context; used for the editor and for export.
async function drawPage(g, pg, { editing = false } = {}) {
  const [paper, ink] = PAPER[pg.paper] || PAPER.white;
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  const rects = panelRects(pg);
  for (const [i, r] of rects.entries()) {
    const art = pg.art[i];
    g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
    g.fillStyle = pg.paper === "black" ? "#1a1a1d" : "#f4f4f4"; g.fillRect(r.x, r.y, r.w, r.h);
    const bmp = await bitmapFor(art?.blob);
    if (bmp) {
      const s = Math.max(r.w / bmp.width, r.h / bmp.height) * (art.zoom || 1);
      const dw = bmp.width * s, dh = bmp.height * s;
      g.drawImage(bmp, r.x + (r.w - dw) / 2 + (art.dx || 0) * r.w, r.y + (r.h - dh) / 2 + (art.dy || 0) * r.h, dw, dh);
    } else if (editing) {
      g.fillStyle = "#9a9db0"; g.font = '500 30px "Zen Kaku Gothic New", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(`Panel ${i + 1} · click to add art`, r.x + r.w / 2, r.y + r.h / 2);
    }
    g.restore();
    if (pg.border) { g.lineWidth = pg.border; g.strokeStyle = ink; g.strokeRect(r.x, r.y, r.w, r.h); }
    if (editing && state.sel?.type === "panel" && state.sel.i === i) { g.lineWidth = 8; g.strokeStyle = "#f2a03f"; g.setLineDash([18, 12]); g.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); g.setLineDash([]); }
  }
  for (const [i, b] of pg.bubbles.entries()) {
    drawBubble(g, b, ink, paper);
    if (editing && state.sel?.type === "bubble" && state.sel.i === i && b._box) { g.lineWidth = 4; g.strokeStyle = "#f2a03f"; g.setLineDash([12, 8]); g.strokeRect(b._box.x - 8, b._box.y - 8, b._box.w + 16, b._box.h + 16); g.setLineDash([]); }
  }
}

export async function render(view) {
  setCrumbs([["Create", "create"], ["Panel studio", ""]]);
  state.project = await loadProject();
  state.page = 0; state.sel = null;
  await document.fonts?.load?.('700 30px "Zen Kaku Gothic New"').catch(() => {});
  await document.fonts?.load?.('400 40px "Dela Gothic One"').catch(() => {});
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Create</p><h1 class="h1">Panel studio</h1>
      <p class="lede">Lay out comic pages from your own art. Pick a layout, click a panel to add a picture, then letter it with bubbles and sound effects. Drafts save as you go.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" id="ps-export">${icon("download")}Save page as image</button><button class="btn btn-accent" type="button" id="ps-publish">${icon("upload")}Publish as a work</button></div></div>
    <div class="ps">
      <div class="ps-pages" id="ps-pages"></div>
      <div class="ps-stage"><canvas id="ps-canvas" width="${W}" height="${H}" aria-label="Comic page editor"></canvas></div>
      <aside class="ps-side" id="ps-side"></aside>
    </div>
    <input type="file" id="ps-file" accept="image/*" hidden>`;
  const canvas = $("#ps-canvas", view), g = canvas.getContext("2d");
  const pg = () => state.project.pages[state.page];
  const redraw = async () => { await drawPage(g, pg(), { editing: true }); };
  const thumbs = async () => {
    $("#ps-pages", view).innerHTML = state.project.pages.map((p, i) => `<button class="ps-thumb ${i === state.page ? "on" : ""}" type="button" data-pg="${i}"><canvas width="120" height="180"></canvas><span>${i + 1}</span></button>`).join("") + `<button class="ps-thumb add" type="button" id="ps-add">${icon("plus")}<span>Page</span></button>`;
    for (const [i, p] of state.project.pages.entries()) {
      const c = document.createElement("canvas"); c.width = W; c.height = H; await drawPage(c.getContext("2d"), p);
      $$("#ps-pages canvas", view)[i]?.getContext("2d").drawImage(c, 0, 0, 120, 180);
    }
  };
  const side = () => {
    const p = pg(), s = state.sel;
    const b = s?.type === "bubble" ? p.bubbles[s.i] : null, a = s?.type === "panel" ? p.art[s.i] : null;
    $("#ps-side", view).innerHTML = `
      <h4>Page ${state.page + 1} layout</h4>
      <div class="ps-layouts">${Object.entries(LAYOUTS).map(([k, L]) => `<button type="button" data-layout="${k}" aria-pressed="${p.layout === k}" title="${L.name}"><svg viewBox="0 0 20 30">${L.panels.map(([x, y, w, h]) => `<rect x="${x * 18 + 1.4}" y="${y * 28 + 1.4}" width="${w * 18 - 0.8}" height="${h * 28 - 0.8}" />`).join("")}</svg></button>`).join("")}</div>
      <label class="ps-range">Gutter <input type="range" min="0" max="60" value="${p.gutter}" data-pg-set="gutter"></label>
      <label class="ps-range">Border <input type="range" min="0" max="16" value="${p.border}" data-pg-set="border"></label>
      <label class="ps-range">Margin <input type="range" min="0" max="120" value="${p.margin}" data-pg-set="margin"></label>
      <div class="seg" id="ps-paper">${Object.keys(PAPER).map((k) => `<button type="button" data-paper="${k}" aria-pressed="${p.paper === k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join("")}</div>
      <h4>Lettering</h4>
      <div class="ps-add">${Object.entries(BUBBLES).map(([k, l]) => `<button class="btn btn-sm" type="button" data-bubble="${k}">${icon("plus")}${l}</button>`).join("")}</div>
      ${b ? `<h4>Selected ${BUBBLES[b.kind].toLowerCase()}</h4>
        <textarea class="field" id="ps-text" rows="3">${esc(b.text)}</textarea>
        <label class="ps-range">Text size <input type="range" min="18" max="80" value="${b.size || 34}" data-b-set="size"></label>
        ${b.kind === "sfx" ? `<label class="ps-range">Tilt <input type="range" min="-40" max="40" value="${b.rot ?? -8}" data-b-set="rot"></label>` : `<label class="ps-range">Width <input type="range" min="160" max="900" value="${b.w}" data-b-set="w"></label>`}
        ${b.kind === "speech" || b.kind === "thought" ? `<label class="ps-range">Tail <input type="range" min="-1" max="1" step="0.1" value="${b.tail ?? 0.4}" data-b-set="tail"></label>` : ""}
        <button class="btn btn-sm btn-ghost" type="button" id="ps-del" style="color:var(--bad)">${icon("trash")}Remove</button>`
      : a ? `<h4>Panel ${s.i + 1} art</h4>
        <label class="ps-range">Zoom <input type="range" min="1" max="3" step="0.05" value="${a.zoom || 1}" data-a-set="zoom"></label>
        <label class="ps-range">Left / right <input type="range" min="-0.5" max="0.5" step="0.01" value="${a.dx || 0}" data-a-set="dx"></label>
        <label class="ps-range">Up / down <input type="range" min="-0.5" max="0.5" step="0.01" value="${a.dy || 0}" data-a-set="dy"></label>
        <div style="display:flex;gap:6px"><button class="btn btn-sm" type="button" id="ps-replace">Replace art</button><button class="btn btn-sm btn-ghost" type="button" id="ps-clear" style="color:var(--bad)">Clear</button></div>`
      : `<p class="hint">Click a panel to add art. Click a bubble to edit it; drag to move it.</p>`}
      <h4>Pages</h4>
      <div class="ps-add"><button class="btn btn-sm" type="button" id="ps-dup">Duplicate page</button>${state.project.pages.length > 1 ? `<button class="btn btn-sm" type="button" id="ps-left">Move earlier</button><button class="btn btn-sm btn-ghost" type="button" id="ps-rm" style="color:var(--bad)">Delete page</button>` : ""}</div>
      <button class="btn btn-sm btn-ghost" type="button" id="ps-new" style="margin-top:6px">Start a new project</button>`;
  };
  const refresh = async (all = false) => { await redraw(); side(); persist(); if (all) thumbs(); };

  // canvas interaction
  const toPage = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };
  canvas.addEventListener("pointerdown", (e) => {
    const [x, y] = toPage(e), p = pg();
    const bi = [...p.bubbles.keys()].reverse().find((i) => { const b = p.bubbles[i]._box; return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; });
    if (bi != null) { state.sel = { type: "bubble", i: bi }; state.drag = { i: bi, ox: x - p.bubbles[bi].x, oy: y - p.bubbles[bi].y }; canvas.setPointerCapture(e.pointerId); return refresh(); }
    const pi = panelRects(p).findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    if (pi < 0) { state.sel = null; return refresh(); }
    state.sel = { type: "panel", i: pi };
    if (!p.art[pi]) { $("#ps-file", view).click(); }
    refresh();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!state.drag) return;
    const [x, y] = toPage(e), b = pg().bubbles[state.drag.i];
    b.x = clamp(x - state.drag.ox, 0, W); b.y = clamp(y - state.drag.oy, 0, H); redraw();
  });
  canvas.addEventListener("pointerup", () => { if (state.drag) { state.drag = null; persist(); thumbs(); } });
  $("#ps-file", view).onchange = async (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f || state.sel?.type !== "panel") return;
    pg().art[state.sel.i] = { blob: f, zoom: 1, dx: 0, dy: 0 };
    refresh(true);
  };

  // side panel controls
  $("#ps-side", view).addEventListener("input", (e) => {
    const t = e.target, p = pg();
    if (t.dataset.pgSet) { p[t.dataset.pgSet] = Number(t.value); redraw(); persist(); }
    if (t.dataset.bSet && state.sel?.type === "bubble") { p.bubbles[state.sel.i][t.dataset.bSet] = Number(t.value); redraw(); persist(); }
    if (t.dataset.aSet && state.sel?.type === "panel") { p.art[state.sel.i][t.dataset.aSet] = Number(t.value); redraw(); persist(); }
    if (t.id === "ps-text" && state.sel?.type === "bubble") { p.bubbles[state.sel.i].text = t.value; redraw(); persist(); }
  });
  $("#ps-side", view).addEventListener("change", () => thumbs());
  $("#ps-side", view).addEventListener("click", async (e) => {
    const p = pg(), t = e.target.closest("button"); if (!t) return;
    if (t.dataset.layout) { p.layout = t.dataset.layout; p.art = {}; state.sel = null; return refresh(true); }
    if (t.dataset.paper) { p.paper = t.dataset.paper; return refresh(true); }
    if (t.dataset.bubble) {
      const k = t.dataset.bubble;
      p.bubbles.push({ kind: k, text: { speech: "Hello there!", thought: "I wonder…", caption: "Meanwhile, at the shrine…", sfx: "DOON" }[k], x: W / 2, y: k === "caption" ? 140 : H / 3, w: k === "caption" ? 520 : 380, size: 34, tail: 0.4 });
      state.sel = { type: "bubble", i: p.bubbles.length - 1 }; return refresh(true);
    }
    if (t.id === "ps-del") { p.bubbles.splice(state.sel.i, 1); state.sel = null; return refresh(true); }
    if (t.id === "ps-replace") return $("#ps-file", view).click();
    if (t.id === "ps-clear") { delete p.art[state.sel.i]; return refresh(true); }
    if (t.id === "ps-dup") { const copy = { ...p, id: uid("pg-"), art: { ...p.art }, bubbles: p.bubbles.map((b) => ({ ...b })) }; state.project.pages.splice(state.page + 1, 0, copy); state.page++; return refresh(true); }
    if (t.id === "ps-left" && state.page > 0) { const ps = state.project.pages; [ps[state.page - 1], ps[state.page]] = [ps[state.page], ps[state.page - 1]]; state.page--; return refresh(true); }
    if (t.id === "ps-rm") { state.project.pages.splice(state.page, 1); state.page = Math.max(0, state.page - 1); state.sel = null; return refresh(true); }
    if (t.id === "ps-new") { state.project = { id: uid("pj-"), title: "", pages: [blankPage()] }; state.page = 0; state.sel = null; return refresh(true); }
  });
  $("#ps-pages", view).addEventListener("click", (e) => {
    if (e.target.closest("#ps-add")) { state.project.pages.push(blankPage()); state.page = state.project.pages.length - 1; state.sel = null; return refresh(true); }
    const b = e.target.closest("[data-pg]"); if (b) { state.page = Number(b.dataset.pg); state.sel = null; refresh(true); }
  });

  const renderBlob = async (p) => { const c = document.createElement("canvas"); c.width = W; c.height = H; await drawPage(c.getContext("2d"), p); return new Promise((r) => c.toBlob(r, "image/png")); };
  $("#ps-export", view).onclick = async () => {
    const blob = await renderBlob(pg());
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `page-${state.page + 1}.png`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 20_000);
  };
  $("#ps-publish", view).onclick = async () => {
    const { LICENSES } = await import("./create.js");
    const m = modal({ title: "Publish as a work", body: `<form class="form" id="pp">
      <div class="row2"><div><label class="lbl" for="pp-t">Title</label><input class="field" id="pp-t" required value="${esc(state.project.title || "")}" autofocus></div>
        <div><label class="lbl" for="pp-c">Your name or pen name</label><input class="field" id="pp-c" required value="${esc(localStorage.getItem("kitsune.creatorName") || "")}"></div></div>
      <div><label class="lbl" for="pp-l">Licence</label><select class="field" id="pp-l">${Object.entries(LICENSES).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
      <div><label class="lbl" for="pp-d">Reading direction</label><select class="field" id="pp-d"><option value="ltr">Left to right</option><option value="rtl">Right to left (manga)</option></select></div>
      <p class="hint">${state.project.pages.length} page${state.project.pages.length === 1 ? "" : "s"} will be rendered at ${W}×${H}.</p></form>`,
      actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="pp">Publish</button>` });
    $("#pp", m.root).onsubmit = async (e) => {
      e.preventDefault();
      const title = $("#pp-t", m.root).value.trim(), creator = $("#pp-c", m.root).value.trim();
      try { localStorage.setItem("kitsune.creatorName", creator); } catch {}
      const blobs = [];
      for (const p of state.project.pages) blobs.push(await renderBlob(p));
      state.project.title = title; persist();
      const item = await saveItem({ id: uid("v-"), type: "manga", title, series: title, author: creator, source: { kind: "blobs", blobs }, pages: blobs.length, dir: $("#pp-d", m.root).value,
        work: { creator, license: $("#pp-l", m.root).value, created: Math.floor(Date.now() / 1000) }, origin: "Made in Panel studio", tags: ["my works"], status: "unread", rating: 0, link: null, added: Math.floor(Date.now() / 1000) });
      m.close();
      toast(`Published “${title}”.`, { action: "Share", onAction: async () => (await import("./create.js")).shareWork(item) });
      location.hash = "create";
    };
  };

  await refresh(true);
}
