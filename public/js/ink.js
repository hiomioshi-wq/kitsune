// Ink studio: a drawing canvas for comic and manga art.
// Pressure brushes with taper and a stabiliser, layers with blend modes, flood fill that tucks under line art,
// real screentones, focus and speed lines, symmetry, undo, and drafts that save themselves.
import { $, $$, esc, toast, uid, clamp } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const SVG = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  pen: SVG(`<path d="M4 20l3-1 11-11-2-2L5 17z"/><path d="M14 6l2-2 4 4-2 2"/>`),
  brush: SVG(`<path d="M20 4c-4 2-8 6-10 10"/><path d="M10 14c-3 0-5 2-5 5 0 .6-.4 1-1 1 2 1 6 1 8-1 1.5-1.5 1.5-3.5-2-5z"/>`),
  pencil: SVG(`<path d="M4 20l2-6 10-10 4 4-10 10z"/><path d="M6 14l4 4"/><path d="M4 20l2-.5"/>`),
  marker: SVG(`<path d="M7 17l-3 3h5l1-1"/><path d="M8 16l9-9 3 3-9 9z"/><path d="M15 5l4 4"/>`),
  air: SVG(`<circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6" stroke-dasharray="1.5 2.5"/><circle cx="12" cy="12" r="9.5" stroke-dasharray="1 3.5"/>`),
  eraser: SVG(`<path d="M8 20h12"/><path d="M4 15l9-9 6 6-7 7H7z"/><path d="M9 10l6 6"/>`),
  fill: SVG(`<path d="M5 11l7-7 7 7-7 7z"/><path d="M19 15c1 1.6 1.5 2.6 1.5 3.3a1.5 1.5 0 0 1-3 0c0-.7.5-1.7 1.5-3.3z"/>`),
  tone: SVG(`${[6, 12, 18].flatMap((x) => [6, 12, 18].map((y) => `<circle cx="${x}" cy="${y}" r="${1 + ((x + y) % 12) / 8}" fill="currentColor" stroke="none"/>`)).join("")}`),
  lines: SVG(`<circle cx="12" cy="12" r="2.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19"/>`),
  pick: SVG(`<path d="M14 4l6 6-2 2-6-6z"/><path d="M13 7l-8 8v4h4l8-8"/>`),
  hand: SVG(`<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V12"/><path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v7"/><path d="M17 10a1.5 1.5 0 0 1 3 0v4a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.5 14.5a1.6 1.6 0 0 1 2.4-2l2.1 2"/>`),
  undo: SVG(`<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>`),
  redo: SVG(`<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>`),
  eye: SVG(`<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>`),
  eyeOff: SVG(`<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.4-1"/>`),
  lock: SVG(`<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`),
  plus: SVG(`<path d="M12 5v14M5 12h14"/>`), up: SVG(`<path d="M12 19V5M6 11l6-6 6 6"/>`), down: SVG(`<path d="M12 5v14M6 13l6 6 6-6"/>`),
  merge: SVG(`<path d="M12 4v10M7 9l5 5 5-5"/><path d="M5 20h14"/>`), dup: SVG(`<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>`),
  trash: SVG(`<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>`), image: SVG(`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>`),
  flip: SVG(`<path d="M12 3v18"/><path d="M8 7L3 12l5 5z"/><path d="M16 7l5 5-5 5z"/>`), grid: SVG(`<path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/>`),
  sym: SVG(`<path d="M12 2v20" stroke-dasharray="2 2"/><path d="M9 7c-3 0-5 2-5 5s2 5 5 5"/><path d="M15 7c3 0 5 2 5 5s-2 5-5 5"/>`),
  close: SVG(`<path d="M6 6l12 12M18 6L6 18"/>`), download: SVG(`<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>`), check: SVG(`<path d="M5 12l5 5 9-10"/>`),
  panel: SVG(`<path d="M4 6h16M4 12h16M4 18h16"/>`), clear: SVG(`<path d="M5 5l14 14"/><rect x="3" y="3" width="18" height="18" rx="2"/>`),
};

const BRUSHES = {
  pen: { name: "G-pen", hint: "Crisp ink lines that taper with pressure.", size: 7, press: 0.85, taper: true },
  brush: { name: "Ink brush", hint: "Bold, expressive strokes with a wide range.", size: 24, press: 1, taper: true },
  pencil: { name: "Pencil", hint: "Grainy sketching. Press lightly for faint lines.", size: 5, press: 0.4, grain: true, alphaPress: true },
  marker: { name: "Marker", hint: "Flat, even colour. Lower the opacity to layer it.", size: 32, press: 0.15, flat: true },
  air: { name: "Airbrush", hint: "Soft shading that builds up as you go over it.", size: 120, press: 0.3, soft: true },
  eraser: { name: "Eraser", hint: "Rubs out on the current layer.", size: 36, press: 0.5, erase: true },
};
const TOOLS = [...Object.keys(BRUSHES), "fill", "tone", "lines", "pick", "hand"];
const TOOL_NAMES = { fill: "Fill", tone: "Screentone", lines: "Speed lines", pick: "Eyedropper", hand: "Move the view" };
const TOOL_KEYS = { pen: "P", brush: "B", pencil: "N", marker: "M", air: "A", eraser: "E", fill: "G", tone: "T", lines: "L", pick: "I", hand: "H" };
const PALETTE = ["#111111", "#3a3a3a", "#6b6b6b", "#a3a3a3", "#d9d9d9", "#ffffff", "#c8463c", "#e8913c", "#e8c34a", "#5aa05a", "#3c7fc8", "#7a52b3", "#e07aa5", "#8a5a3c", "#f2d0b4", "#1f3b5c"];
const BLENDS = [["source-over", "Normal"], ["multiply", "Multiply"], ["screen", "Screen"], ["overlay", "Overlay"], ["darken", "Darken"], ["lighten", "Lighten"]];
const HISTORY_BYTES = 180 * 1024 * 1024;

const S = {};
const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mkCanvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const ctx2d = (c) => c.getContext("2d", { willReadFrequently: false });
const reduceMotion = () => document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- documents (drafts) ----------
export async function listDocs() { return Object.values((await kvGet("inkDocs", {})) || {}).sort((a, b) => b.updated - a.updated); }
const deleted = new Set(); // a save already under way must not bring back a drawing you just deleted
export async function deleteDoc(id) { deleted.add(id); const all = { ...((await kvGet("inkDocs", {})) || {}) }; delete all[id]; await kvSet("inkDocs", all); await kvSet("ink:" + id, null); }

async function loadDoc(id) {
  const meta = ((await kvGet("inkDocs", {})) || {})[id];
  const data = await kvGet("ink:" + id, null);
  if (!meta || !data?.layers) return null;
  const layers = [];
  for (const L of data.layers) {
    const c = mkCanvas(meta.w, meta.h);
    if (L.blob) { try { const bmp = await createImageBitmap(L.blob); ctx2d(c).drawImage(bmp, 0, 0); bmp.close?.(); } catch {} }
    layers.push({ id: L.id || uid("ly-"), name: L.name, visible: L.visible !== false, opacity: L.opacity ?? 1, blend: L.blend || "source-over", locked: !!L.locked, ref: !!L.ref, canvas: c, blob: L.blob, dirty: false });
  }
  return { meta, layers };
}

let saveT = 0;
function scheduleSave() { clearTimeout(saveT); saveT = setTimeout(saveNow, 1200); S.saved = false; paintStatus(); }
async function saveNow() {
  clearTimeout(saveT);
  if (!S.doc) return;
  const doc = S.doc, layers = S.layers.slice();
  const out = [];
  for (const L of layers) {
    if (L.dirty || !L.blob) { L.blob = await new Promise((r) => L.canvas.toBlob(r, "image/png")); L.dirty = false; }
    out.push({ id: L.id, name: L.name, visible: L.visible, opacity: L.opacity, blend: L.blend, locked: L.locked, ref: L.ref, blob: L.blob });
  }
  const t = mkCanvas(150, Math.round((150 * doc.h) / doc.w));
  const tg = ctx2d(t); if (doc.paper !== "none") { tg.fillStyle = doc.paper; tg.fillRect(0, 0, t.width, t.height); }
  layers.filter((L) => L.visible && !L.ref).forEach((L) => { tg.globalAlpha = L.opacity; tg.globalCompositeOperation = L.blend; tg.drawImage(L.canvas, 0, 0, t.width, t.height); });
  doc.thumb = t.toDataURL("image/jpeg", 0.7);
  doc.updated = Date.now();
  if (deleted.has(doc.id)) return;
  await kvSet("ink:" + doc.id, { layers: out });
  const all = { ...((await kvGet("inkDocs", {})) || {}) }; all[doc.id] = { ...doc }; await kvSet("inkDocs", all);
  if (S.doc === doc) { S.saved = true; paintStatus(); }
}

// ---------- the editor ----------
/** Open the ink studio. `id` reopens a draft; `w`/`h` size a new one; `onDone(blob)` receives the flattened art. */
export async function openInk({ id = null, w = 1200, h = 1800, title = "", onDone = null, doneLabel = "Done", paper = "#ffffff" } = {}) {
  closeInk(true);
  let loaded = id ? await loadDoc(id) : null;
  Object.assign(S, {
    tool: "pen", color: "#111111", recent: [], size: {}, opacity: 100, smooth: 45, pressOn: true,
    sym: false, grid: false, view: { s: 1, x: 0, y: 0, flip: false }, hist: [], fut: [], histBytes: 0,
    fillTol: 24, fillSample: "all", fillGrow: 2, toneDensity: 30, toneSpacing: 9, toneAngle: 45, lineCount: 140, lineMode: "focus",
    pointers: new Map(), penSeen: false, onDone, saved: true, uiHidden: false,
  });
  Object.keys(BRUSHES).forEach((k) => (S.size[k] = BRUSHES[k].size));
  try { Object.assign(S, JSON.parse(localStorage.getItem("kitsune.ink") || "{}"), { pointers: new Map() }); } catch {}
  if (loaded) { S.doc = loaded.meta; S.layers = loaded.layers; }
  else {
    S.doc = { id: uid("ink-"), title: title || "Untitled drawing", w, h, paper, created: Date.now(), updated: Date.now() };
    S.layers = [newLayer("Sketch"), newLayer("Inks")];
    S.layers[0].opacity = 0.55;
  }
  S.active = S.layers.length - 1;
  S.stroke = mkCanvas(S.doc.w, S.doc.h); S.sg = ctx2d(S.stroke);
  S.backup = mkCanvas(S.doc.w, S.doc.h);

  const root = document.createElement("div");
  root.id = "ink"; root.className = "ink"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Ink studio");
  root.innerHTML = shellHtml(doneLabel);
  document.body.appendChild(root);
  document.documentElement.classList.add("ink-open");
  S.root = root; S.cv = $("#ink-cv", root); S.g = S.cv.getContext("2d");
  wire();
  resize(); fit();
  drawTools(); drawSide();
  if (!loaded) scheduleSave();
  requestAnimationFrame(() => $(".ink-tool[aria-pressed=true]", root)?.focus());
  return S.doc.id;
}

export function closeInk(silent = false) {
  if (!S.root) return;
  saveNow();
  removeEventListener("resize", onResize); removeEventListener("keydown", onKey, true); removeEventListener("keyup", onKeyUp, true);
  S.root.remove(); S.root = null;
  document.documentElement.classList.remove("ink-open");
  if (!silent) toast("Drawing saved to your drafts.");
}

const newLayer = (name) => ({ id: uid("ly-"), name, visible: true, opacity: 1, blend: "source-over", locked: false, ref: false, canvas: mkCanvas(S.doc.w, S.doc.h), dirty: true });
const L = () => S.layers[S.active];
const brush = () => BRUSHES[S.tool];
const sizeOf = () => S.size[S.tool] ?? 10;

function shellHtml(doneLabel) {
  return `
  <header class="ink-bar">
    <button class="ink-ib" type="button" data-a="close" aria-label="Close the ink studio" title="Close (Esc)">${ICONS.close}</button>
    <input class="ink-title" id="ink-title" value="${esc(S.doc.title)}" aria-label="Drawing title" maxlength="80">
    <span class="ink-status" id="ink-status" aria-live="polite"></span>
    <span class="ink-sp"></span>
    <button class="ink-ib" type="button" data-a="undo" aria-label="Undo" title="Undo (⌘Z)">${ICONS.undo}</button>
    <button class="ink-ib" type="button" data-a="redo" aria-label="Redo" title="Redo (⇧⌘Z)">${ICONS.redo}</button>
    <button class="ink-zoom" type="button" data-a="fit" id="ink-zoom" title="Fit to screen (0)">100%</button>
    <button class="ink-ib" type="button" data-a="flip" aria-pressed="false" aria-label="Flip the view" title="Flip the view to check your drawing (F)">${ICONS.flip}</button>
    <button class="ink-ib" type="button" data-a="sym" aria-pressed="false" aria-label="Symmetry" title="Mirror strokes left to right (S)">${ICONS.sym}</button>
    <button class="ink-ib" type="button" data-a="grid" aria-pressed="false" aria-label="Guides" title="Thirds, centre and safe margins (')">${ICONS.grid}</button>
    <button class="ink-ib sm-hide" type="button" data-a="export" aria-label="Save as PNG" title="Save as PNG">${ICONS.download}</button>
    <button class="ink-ib ink-sidebtn" type="button" data-a="side" aria-label="Brushes, colour and layers" title="Brushes, colour and layers">${ICONS.panel}</button>
    <button class="btn btn-accent btn-sm ink-done" type="button" data-a="done">${ICONS.check}${esc(doneLabel)}</button>
  </header>
  <nav class="ink-tools" id="ink-tools" aria-label="Tools"></nav>
  <div class="ink-stage" id="ink-stage"><canvas id="ink-cv" aria-label="Drawing canvas. Draw with a pen, mouse or finger."></canvas><div class="ink-cursor" id="ink-cursor" aria-hidden="true"></div></div>
  <aside class="ink-side" id="ink-side"></aside>
  <input type="file" id="ink-file" accept="image/*" hidden>`;
}

function paintStatus() {
  const s = S.root && $("#ink-status", S.root); if (!s) return;
  s.textContent = S.saved ? "Saved" : "Saving…";
  $("[data-a=undo]", S.root).disabled = !S.hist.length;
  $("[data-a=redo]", S.root).disabled = !S.fut.length;
}

function drawTools() {
  $("#ink-tools", S.root).innerHTML = TOOLS.map((t, i) => `${i === 6 ? `<span class="ink-tsep"></span>` : ""}<button class="ink-tool" type="button" data-tool="${t}" aria-pressed="${S.tool === t}" aria-label="${esc(BRUSHES[t]?.name || TOOL_NAMES[t])} (${TOOL_KEYS[t]})" title="${esc(BRUSHES[t]?.name || TOOL_NAMES[t])} (${TOOL_KEYS[t]})">${ICONS[t]}</button>`).join("")
    + `<span class="ink-tsep"></span><button class="ink-swatch" type="button" data-a="swap" aria-label="Switch between this colour and white (X)" title="Switch with white (X)" style="--c:${S.color}"></button>`;
}

function drawSide() {
  const side = $("#ink-side", S.root), b = brush(), t = S.tool;
  const layerRows = S.layers.map((ly, i) => ({ ly, i })).reverse().map(({ ly, i }) => `
    <div class="ink-layer ${i === S.active ? "on" : ""}" data-li="${i}">
      <button type="button" class="ink-eye" data-vis="${i}" aria-label="${ly.visible ? "Hide" : "Show"} ${esc(ly.name)}" aria-pressed="${ly.visible}">${ly.visible ? ICONS.eye : ICONS.eyeOff}</button>
      <canvas class="ink-lthumb" width="40" height="${Math.round((40 * S.doc.h) / S.doc.w)}" data-thumb="${i}"></canvas>
      <button type="button" class="ink-lname" data-pickl="${i}">${esc(ly.name)}${ly.ref ? ` <em>reference</em>` : ""}${ly.blend !== "source-over" ? ` <em>${esc(BLENDS.find((x) => x[0] === ly.blend)?.[1] || "")}</em>` : ""}</button>
      ${ly.locked ? `<span class="ink-lk" title="Locked">${ICONS.lock}</span>` : ""}
    </div>`).join("");
  const ly = L();
  side.innerHTML = `
    <section class="ink-sec"><h4>Colour</h4>
      <div class="ink-color"><label class="ink-cbig" style="--c:${S.color}"><input type="color" id="ink-col" value="${S.color}" aria-label="Pick any colour"></label>
        <div class="ink-pal">${PALETTE.map((c) => `<button type="button" data-col="${c}" style="--c:${c}" aria-label="${c}" aria-pressed="${S.color === c}"></button>`).join("")}</div></div>
      ${S.recent.length ? `<div class="ink-recent"><span>Recent</span>${S.recent.map((c) => `<button type="button" data-col="${c}" style="--c:${c}" aria-label="${c}"></button>`).join("")}</div>` : ""}
    </section>
    <section class="ink-sec"><h4>${esc(b?.name || TOOL_NAMES[t])}</h4><p class="ink-hint">${esc(b?.hint || {
      fill: "Fills the enclosed area you tap. It looks at all layers by default, so you can fill colour on its own layer under your inks.",
      tone: "Tap inside a shape to fill it with a dot screentone, like printed manga.",
      lines: "Drag out from the focus point to set the clear centre; release to draw. Or switch to parallel lines and drag in the direction of motion.",
      pick: "Tap anywhere to pick up its colour. Hold Alt with a brush to do the same.",
      hand: "Drag to move around. Pinch or ⌘-scroll to zoom. Hold Space with any tool to move.",
    }[t] || "")}</p>
      ${b || t === "lines" ? `<label class="ink-range"><span>Size <b id="ink-sv">${sizeOf()}px</b></span><input type="range" id="ink-size" min="1" max="${t === "air" ? 400 : 200}" value="${sizeOf()}"></label>` : ""}
      ${b && !b.erase ? `<label class="ink-range"><span>Opacity <b>${S.opacity}%</b></span><input type="range" id="ink-op" min="5" max="100" value="${S.opacity}"></label>` : ""}
      ${b ? `<label class="ink-range"><span>Stabiliser <b>${S.smooth}%</b></span><input type="range" id="ink-smooth" min="0" max="90" value="${S.smooth}"></label>
        <label class="check ink-check"><input type="checkbox" id="ink-press" ${S.pressOn ? "checked" : ""}> Pen pressure changes the size</label>` : ""}
      ${t === "fill" || t === "tone" ? `<label class="ink-range"><span>Tolerance <b>${S.fillTol}</b></span><input type="range" id="ink-tol" min="0" max="120" value="${S.fillTol}"></label>
        <div class="seg ink-seg" id="ink-sample"><button type="button" data-v="all" aria-pressed="${S.fillSample === "all"}">See all layers</button><button type="button" data-v="layer" aria-pressed="${S.fillSample === "layer"}">This layer only</button></div>
        <label class="ink-range"><span>Grow under lines <b>${S.fillGrow}px</b></span><input type="range" id="ink-grow" min="0" max="6" value="${S.fillGrow}"></label>` : ""}
      ${t === "tone" ? `<label class="ink-range"><span>Tone <b>${S.toneDensity}%</b></span><input type="range" id="ink-tden" min="5" max="80" value="${S.toneDensity}"></label>
        <label class="ink-range"><span>Dot spacing <b>${S.toneSpacing}px</b></span><input type="range" id="ink-tsp" min="4" max="24" value="${S.toneSpacing}"></label>
        <label class="ink-range"><span>Angle <b>${S.toneAngle}°</b></span><input type="range" id="ink-tang" min="0" max="90" step="15" value="${S.toneAngle}"></label>
        <div class="ink-tonepv" style="--d:${S.toneDensity};--s:${S.toneSpacing}px" aria-hidden="true"></div>` : ""}
      ${t === "lines" ? `<div class="seg ink-seg" id="ink-lmode"><button type="button" data-v="focus" aria-pressed="${S.lineMode === "focus"}">Focus lines</button><button type="button" data-v="speed" aria-pressed="${S.lineMode === "speed"}">Parallel lines</button></div>
        <label class="ink-range"><span>How many <b>${S.lineCount}</b></span><input type="range" id="ink-lcount" min="20" max="400" step="10" value="${S.lineCount}"></label>` : ""}
    </section>
    <section class="ink-sec ink-layers-sec"><h4>Layers <span class="ink-count">${S.layers.length}</span></h4>
      <div class="ink-lbar">
        <button type="button" data-a="ladd" aria-label="New layer" title="New layer">${ICONS.plus}</button>
        <button type="button" data-a="ldup" aria-label="Duplicate layer" title="Duplicate layer">${ICONS.dup}</button>
        <button type="button" data-a="lup" aria-label="Move layer up" title="Move up" ${S.active >= S.layers.length - 1 ? "disabled" : ""}>${ICONS.up}</button>
        <button type="button" data-a="ldown" aria-label="Move layer down" title="Move down" ${S.active <= 0 ? "disabled" : ""}>${ICONS.down}</button>
        <button type="button" data-a="lmerge" aria-label="Merge down" title="Merge into the layer below" ${S.active <= 0 ? "disabled" : ""}>${ICONS.merge}</button>
        <button type="button" data-a="limg" aria-label="Import an image as a layer" title="Import an image (a sketch, photo or reference)">${ICONS.image}</button>
        <button type="button" data-a="lclear" aria-label="Clear layer" title="Clear this layer">${ICONS.clear}</button>
        <button type="button" data-a="ldel" aria-label="Delete layer" title="Delete layer" ${S.layers.length <= 1 ? "disabled" : ""}>${ICONS.trash}</button>
      </div>
      <div class="ink-llist" id="ink-llist">${layerRows}</div>
      <div class="ink-lprops">
        <label class="ink-range"><span>Layer opacity <b>${Math.round(ly.opacity * 100)}%</b></span><input type="range" id="ink-lop" min="0" max="100" value="${Math.round(ly.opacity * 100)}"></label>
        <div class="ink-lrow"><select class="field" id="ink-blend" aria-label="Blend mode">${BLENDS.map(([v, n]) => `<option value="${v}" ${ly.blend === v ? "selected" : ""}>${n}</option>`).join("")}</select>
          <button type="button" class="btn btn-sm" data-a="lrename">Rename</button></div>
        <label class="check ink-check"><input type="checkbox" id="ink-llock" ${ly.locked ? "checked" : ""}> Lock this layer</label>
        <label class="check ink-check"><input type="checkbox" id="ink-lref" ${ly.ref ? "checked" : ""}> Reference only (left out when you finish)</label>
      </div>
    </section>
    <section class="ink-sec ink-paper"><h4>Paper</h4><div class="seg ink-seg" id="ink-paper">${[["#ffffff", "White"], ["#f6f0e2", "Cream"], ["none", "Clear"]].map(([v, n]) => `<button type="button" data-v="${v}" aria-pressed="${S.doc.paper === v}">${n}</button>`).join("")}</div>
      <p class="ink-hint">${S.doc.w} × ${S.doc.h} px</p></section>`;
  paintThumbs(); paintStatus();
}

function paintThumbs() {
  $$("[data-thumb]", S.root).forEach((c) => {
    const ly = S.layers[Number(c.dataset.thumb)]; if (!ly) return;
    const g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(ly.canvas, 0, 0, c.width, c.height);
  });
}
let thumbT = 0;
const thumbsSoon = () => { clearTimeout(thumbT); thumbT = setTimeout(paintThumbs, 250); };

// ---------- view ----------
function resize() {
  const st = $("#ink-stage", S.root), dpr = Math.min(2, devicePixelRatio || 1);
  S.dpr = dpr; S.vw = st.clientWidth; S.vh = st.clientHeight;
  S.cv.width = Math.round(S.vw * dpr); S.cv.height = Math.round(S.vh * dpr);
  S.cv.style.width = S.vw + "px"; S.cv.style.height = S.vh + "px";
  render();
}
const onResize = () => { if (S.root) { resize(); } };
function fit() {
  const pad = 28, s = Math.min((S.vw - pad * 2) / S.doc.w, (S.vh - pad * 2) / S.doc.h);
  S.view.s = s; S.view.x = (S.vw - S.doc.w * s) / 2; S.view.y = (S.vh - S.doc.h * s) / 2;
  render();
}
function zoomAt(f, cx, cy) {
  const v = S.view, ns = clamp(v.s * f, 0.05, 16);
  v.x = cx - ((cx - v.x) * ns) / v.s; v.y = cy - ((cy - v.y) * ns) / v.s; v.s = ns;
  render();
}
function toDoc(clientX, clientY) {
  const r = S.cv.getBoundingClientRect(), v = S.view;
  let x = (clientX - r.left - v.x) / v.s; const y = (clientY - r.top - v.y) / v.s;
  if (v.flip) x = S.doc.w - x;
  return [x, y];
}

let raf = 0;
function render() { if (!raf) raf = requestAnimationFrame(paint); }
function paint() {
  raf = 0;
  if (!S.root) return;
  const g = S.g, v = S.view, { w, h } = S.doc;
  g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  g.clearRect(0, 0, S.vw, S.vh);
  g.save();
  g.translate(v.x, v.y); g.scale(v.s, v.s);
  if (v.flip) { g.translate(w, 0); g.scale(-1, 1); }
  g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = 24 * S.dpr; g.shadowOffsetY = 6 * S.dpr;
  if (S.doc.paper === "none") { g.fillStyle = S.checker ||= g.createPattern(checker(), "repeat"); } else g.fillStyle = S.doc.paper;
  g.fillRect(0, 0, w, h);
  g.shadowColor = "transparent";
  g.imageSmoothingEnabled = v.s < 2;
  S.layers.forEach((ly, i) => {
    if (!ly.visible) return;
    g.globalAlpha = ly.opacity; g.globalCompositeOperation = ly.blend;
    if (i === S.active && S.live && !S.live.erase) {
      // the stroke in progress sits on its layer at the brush opacity
      const tmp = S.mix ||= mkCanvas(w, h), tg = ctx2d(tmp);
      tg.globalCompositeOperation = "copy"; tg.globalAlpha = 1; tg.drawImage(ly.canvas, 0, 0);
      tg.globalCompositeOperation = "source-over"; tg.globalAlpha = S.opacity / 100; tg.drawImage(S.stroke, 0, 0);
      g.drawImage(tmp, 0, 0);
    } else g.drawImage(ly.canvas, 0, 0);
  });
  g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  // overlays
  const px = 1 / v.s;
  if (S.grid) {
    g.strokeStyle = "rgba(60,140,220,.55)"; g.lineWidth = px;
    g.beginPath(); [1, 2].forEach((k) => { g.moveTo((w * k) / 3, 0); g.lineTo((w * k) / 3, h); g.moveTo(0, (h * k) / 3); g.lineTo(w, (h * k) / 3); }); g.stroke();
    g.setLineDash([6 * px, 6 * px]); g.strokeStyle = "rgba(220,80,80,.6)"; const m = Math.round(Math.min(w, h) * 0.05); g.strokeRect(m, m, w - 2 * m, h - 2 * m); g.setLineDash([]);
    g.strokeStyle = "rgba(60,140,220,.35)"; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  }
  if (S.sym) { g.strokeStyle = "rgba(242,160,63,.85)"; g.lineWidth = 1.5 * px; g.setLineDash([8 * px, 6 * px]); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); g.setLineDash([]); }
  if (S.linePrev) drawLines(g, S.linePrev, true);
  g.restore();
  const z = $("#ink-zoom", S.root); if (z) z.textContent = Math.round(v.s * 100) + "%";
}
function checker() { const c = mkCanvas(24, 24), g = ctx2d(c); g.fillStyle = "#fff"; g.fillRect(0, 0, 24, 24); g.fillStyle = "#e6e6e6"; g.fillRect(0, 0, 12, 12); g.fillRect(12, 12, 12, 12); return c; }

// ---------- brush engine ----------
function stamp(g, x, y, r, b, press) {
  if (r <= 0.05) return;
  if (b.soft) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r), a = 0.06 + 0.1 * press;
    gr.addColorStop(0, `rgba(${S.rgb},${a})`); gr.addColorStop(1, `rgba(${S.rgb},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  } else if (b.grain) {
    // graphite: specks inside the nib, fewer where you press lightly
    g.fillStyle = `rgb(${S.rgb})`;
    const n = Math.max(3, Math.round(r * r * 0.9)), keep = 0.35 + 0.6 * press;
    for (let i = 0; i < n; i++) {
      if (Math.random() > keep) continue;
      const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * r;
      g.globalAlpha = 0.35 + Math.random() * 0.55 * press;
      g.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.1, 1.1);
    }
    g.globalAlpha = 1;
  } else if (b.flat) {
    g.fillStyle = `rgb(${S.rgb})`;
    g.save(); g.translate(x, y); g.rotate(-0.55); g.fillRect(-r * 0.32, -r, r * 0.64, r * 2); g.restore();
  } else {
    g.fillStyle = `rgb(${S.rgb})`;
    g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
  }
}

function radiusFor(pt, b) {
  const base = sizeOf() / 2;
  let p = pt.p;
  if (!pt.pen) p = b.taper ? clamp(1.05 - pt.speed * 0.035, 0.38, 1) : 0.75; // mouse and finger: faster strokes run thinner
  let r = S.pressOn || !pt.pen ? base * (1 - b.press + b.press * p) : base;
  if (b.taper) r *= Math.min(1, 0.3 + pt.dist / (sizeOf() * 2.5)); // a soft start, like a real nib touching down
  return Math.max(0.3, r);
}

function grow(box, x, y, r) { box[0] = Math.min(box[0], x - r - 2); box[1] = Math.min(box[1], y - r - 2); box[2] = Math.max(box[2], x + r + 2); box[3] = Math.max(box[3], y + r + 2); }

function strokeTo(pt) {
  const st = S.live, b = st.brush, g = st.erase ? ctx2d(L().canvas) : S.sg;
  if (st.erase) { g.globalCompositeOperation = "destination-out"; }
  const r1 = radiusFor(pt, b), last = st.last;
  const press = pt.pen ? pt.p : 0.7;
  const doStamp = (x, y, r) => {
    stamp(g, x, y, r, st.erase ? { ...b, soft: false } : b, press);
    grow(st.box, x, y, r);
    if (S.sym) { stamp(g, S.doc.w - x, y, r, st.erase ? { ...b, soft: false } : b, press); grow(st.box, S.doc.w - x, y, r); }
  };
  if (!last) { doStamp(pt.x, pt.y, r1); st.last = { ...pt, r: r1 }; st.carry = 0; }
  else {
    const dx = pt.x - last.x, dy = pt.y - last.y, d = Math.hypot(dx, dy);
    const spacing = b.soft ? Math.max(1, r1 * 0.25) : b.grain ? Math.max(0.6, r1 * 0.5) : Math.max(0.3, Math.min(last.r, r1) * 0.16);
    let t = st.carry || spacing;
    while (t <= d) { const k = t / d; doStamp(last.x + dx * k, last.y + dy * k, last.r + (r1 - last.r) * k); t += spacing; }
    st.carry = t - d;
    st.last = { ...pt, r: r1 };
  }
  if (st.erase) g.globalCompositeOperation = "source-over";
  render();
}

function beginStroke(e, x, y) {
  const ly = L();
  if (ly.locked) { toast("This layer is locked. Unlock it in Layers to draw on it."); return; }
  if (!ly.visible) { toast("This layer is hidden. Show it to draw on it."); return; }
  const b = brush();
  S.rgb = hexRgb(S.color).join(",");
  ctx2d(S.backup).globalCompositeOperation = "copy"; ctx2d(S.backup).drawImage(ly.canvas, 0, 0); ctx2d(S.backup).globalCompositeOperation = "source-over";
  S.sg.clearRect(0, 0, S.doc.w, S.doc.h);
  const pen = e.pointerType === "pen";
  S.live = { brush: b, erase: !!b.erase, box: [Infinity, Infinity, -Infinity, -Infinity], last: null, carry: 0, pen, start: { x, y }, sm: { x, y }, dist: 0, t: performance.now(), straight: e.shiftKey, prevPt: { x, y } };
  if (!S.live.straight) strokeTo({ x, y, p: pen ? e.pressure || 0.5 : 0.5, pen, speed: 0, dist: 0 });
  if (b.erase) { /* erasing draws straight into the layer at the eraser's own strength */ }
}

function moveStroke(e, x, y) {
  const st = S.live; if (!st) return;
  const pen = st.pen;
  if (st.straight) {
    // Shift: a straight line from where you started, redrawn as you move
    const ly = L();
    if (st.erase) { const g = ctx2d(ly.canvas); g.globalCompositeOperation = "copy"; g.drawImage(S.backup, 0, 0); g.globalCompositeOperation = "source-over"; }
    else S.sg.clearRect(0, 0, S.doc.w, S.doc.h);
    st.last = null; st.carry = 0;
    const p = pen ? e.pressure || 0.5 : 0.75;
    strokeTo({ x: st.start.x, y: st.start.y, p, pen: true, speed: 0, dist: 999 });
    strokeTo({ x, y, p, pen: true, speed: 0, dist: 999 });
    return;
  }
  // stabiliser: the line follows the pointer on a leash, smoothing out wobbles
  st.raw = { x, y, p: pen ? e.pressure || 0.5 : 0.5 };
  const k = S.smooth / 100, sm = st.sm;
  sm.x += (x - sm.x) * (1 - k * 0.92); sm.y += (y - sm.y) * (1 - k * 0.92);
  const now = performance.now(), dt = Math.max(1, now - st.t);
  const step = Math.hypot(sm.x - st.prevPt.x, sm.y - st.prevPt.y);
  if (step > 0.5) st.dir = [(sm.x - st.prevPt.x) / step, (sm.y - st.prevPt.y) / step];
  st.dist += step; st.t = now;
  const speed = (step / dt) * 16 * S.view.s;
  st.speed = (st.speed || 0) * 0.7 + speed * 0.3;
  st.prevPt = { x: sm.x, y: sm.y };
  strokeTo({ x: sm.x, y: sm.y, p: pen ? (e.pressure || 0.5) : 0.5, pen, speed: st.speed, dist: st.dist });
}

function endStroke() {
  const st = S.live; if (!st) return;
  const b = st.brush;
  if (!st.straight) {
    // catch up with the pointer, then let mouse strokes trail off like a lifted nib
    // the leash lets go: finish exactly where the pointer lifted, so outlines close
    if (st.last && st.raw) { const d = Math.hypot(st.raw.x - st.last.x, st.raw.y - st.last.y); st.dist += d; strokeTo({ x: st.raw.x, y: st.raw.y, p: st.raw.p, pen: st.pen, speed: st.speed || 0, dist: st.dist }); }
    // a mouse has no pressure to lift off, so tapering brushes trail off along the last direction
    if (!st.pen && b.taper && st.last && st.dir && st.dist > sizeOf() * 2) {
      const l = st.last, len = Math.min(sizeOf() * 3, st.dist * 0.25), n = 10;
      const g = st.erase ? ctx2d(L().canvas) : S.sg;
      if (st.erase) g.globalCompositeOperation = "destination-out";
      for (let i = 1; i <= n; i++) {
        const k = i / n, x = l.x + st.dir[0] * len * k, y = l.y + st.dir[1] * len * k, r = l.r * (1 - k) ** 1.4;
        const steps = Math.ceil((len / n) / Math.max(0.3, r * 0.16));
        for (let j = 0; j < steps; j++) { const kk = (i - 1 + j / steps) / n; const xx = l.x + st.dir[0] * len * kk, yy = l.y + st.dir[1] * len * kk, rr = l.r * (1 - kk) ** 1.4; stamp(g, xx, yy, rr, b, 0.7); grow(st.box, xx, yy, rr); if (S.sym) { stamp(g, S.doc.w - xx, yy, rr, b, 0.7); grow(st.box, S.doc.w - xx, yy, rr); } }
        void x; void y; void r;
      }
      if (st.erase) g.globalCompositeOperation = "source-over";
    }
  }
  const ly = L();
  if (!st.erase) {
    const g = ctx2d(ly.canvas); g.globalAlpha = S.opacity / 100; g.drawImage(S.stroke, 0, 0); g.globalAlpha = 1;
    S.sg.clearRect(0, 0, S.doc.w, S.doc.h);
  }
  S.live = null;
  pushPixels(ly, st.box);
  if (!b.erase) rememberColor();
  render();
}

function rememberColor() { S.recent = [S.color, ...S.recent.filter((c) => c !== S.color)].slice(0, 8); }

// ---------- history ----------
function clipBox(box) {
  const x = Math.max(0, Math.floor(box[0])), y = Math.max(0, Math.floor(box[1]));
  const x2 = Math.min(S.doc.w, Math.ceil(box[2])), y2 = Math.min(S.doc.h, Math.ceil(box[3]));
  return x2 > x && y2 > y ? [x, y, x2 - x, y2 - y] : null;
}
function pushPixels(ly, box, before = null) {
  const b = clipBox(box); if (!b) return;
  const [x, y, w, h] = b;
  const bef = before || ctx2d(S.backup).getImageData(x, y, w, h);
  const aft = ctx2d(ly.canvas).getImageData(x, y, w, h);
  pushHist({ kind: "px", ly, x, y, bef, aft, bytes: w * h * 8 });
  ly.dirty = true;
}
function pushHist(entry) {
  S.hist.push(entry); S.histBytes += entry.bytes || 0;
  for (const f of S.fut) S.histBytes -= f.bytes || 0;
  S.fut = [];
  while ((S.histBytes > HISTORY_BYTES || S.hist.length > 80) && S.hist.length > 1) S.histBytes -= S.hist.shift().bytes || 0;
  scheduleSave(); thumbsSoon();
}
function applyHist(e, dir) {
  if (e.kind === "px") { ctx2d(e.ly.canvas).putImageData(dir < 0 ? e.bef : e.aft, e.x, e.y); e.ly.dirty = true; }
  else if (e.kind === "layers") { S.layers = (dir < 0 ? e.bef : e.aft).slice(); S.active = clamp(dir < 0 ? e.befActive : e.aftActive, 0, S.layers.length - 1); }
  else if (e.kind === "multi") (dir < 0 ? [...e.parts].reverse() : e.parts).forEach((p) => applyHist(p, dir));
  else if (e.kind === "prop") { Object.assign(e.ly, dir < 0 ? e.bef : e.aft); }
}
function undo() { const e = S.hist.pop(); if (!e) return; applyHist(e, -1); S.fut.push(e); after(); }
function redo() { const e = S.fut.pop(); if (!e) return; applyHist(e, 1); S.hist.push(e); after(); }
function after() { scheduleSave(); drawSide(); render(); }
function layerChange(fn) {
  const bef = S.layers.slice(), befActive = S.active;
  const extra = fn();
  const step = { kind: "layers", bef, aft: S.layers.slice(), befActive, aftActive: S.active, bytes: 0 };
  pushHist(extra ? { kind: "multi", parts: [step, ...extra], bytes: extra.reduce((a, p) => a + (p.bytes || 0), 0) } : step);
  drawSide(); render();
}

// ---------- fill and screentone ----------
function composite(sampleAll) {
  const c = mkCanvas(S.doc.w, S.doc.h), g = ctx2d(c);
  if (sampleAll) S.layers.forEach((ly) => { if (ly.visible) { g.globalAlpha = ly.opacity; g.globalCompositeOperation = ly.blend; g.drawImage(ly.canvas, 0, 0); } });
  else g.drawImage(L().canvas, 0, 0);
  return g.getImageData(0, 0, c.width, c.height).data;
}
function floodMask(px, py) {
  const W = S.doc.w, H = S.doc.h;
  const d = composite(S.fillSample === "all");
  const i0 = (py * W + px) * 4, tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], ta = d[i0 + 3], tol = S.fillTol;
  const match = (i) => { const p = i * 4; return Math.abs(d[p + 3] - ta) <= tol && (ta === 0 && d[p + 3] <= tol ? true : Math.abs(d[p] - tr) <= tol && Math.abs(d[p + 1] - tg) <= tol && Math.abs(d[p + 2] - tb) <= tol); };
  const mask = new Uint8Array(W * H);
  const stack = [px, py];
  let minX = px, maxX = px, minY = py, maxY = py, count = 0;
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    let xl = x; while (xl >= 0 && !mask[y * W + xl] && match(y * W + xl)) xl--;
    xl++;
    let xr = x; while (xr < W && !mask[y * W + xr] && match(y * W + xr)) xr++;
    xr--;
    if (xr < xl) continue;
    for (let i = xl; i <= xr; i++) mask[y * W + i] = 1;
    count += xr - xl + 1;
    if (xl < minX) minX = xl; if (xr > maxX) maxX = xr; if (y < minY) minY = y; if (y > maxY) maxY = y;
    for (const ny of [y - 1, y + 1]) {
      if (ny < 0 || ny >= H) continue;
      let inRun = false;
      for (let i = xl; i <= xr; i++) {
        const ok = !mask[ny * W + i] && match(ny * W + i);
        if (ok && !inRun) { stack.push(i, ny); inRun = true; } else if (!ok) inRun = false;
      }
    }
  }
  // grow a little so the fill tucks under anti-aliased line edges
  for (let k = 0; k < S.fillGrow; k++) {
    const add = [];
    for (let y = Math.max(0, minY - 1); y <= Math.min(H - 1, maxY + 1); y++) for (let x = Math.max(0, minX - 1); x <= Math.min(W - 1, maxX + 1); x++) {
      const i = y * W + x; if (mask[i]) continue;
      if ((x > 0 && mask[i - 1]) || (x < W - 1 && mask[i + 1]) || (y > 0 && mask[i - W]) || (y < H - 1 && mask[i + W])) add.push(i);
    }
    add.forEach((i) => (mask[i] = 1));
    minX = Math.max(0, minX - 1); minY = Math.max(0, minY - 1); maxX = Math.min(W - 1, maxX + 1); maxY = Math.min(H - 1, maxY + 1);
  }
  return { mask, box: [minX, minY, maxX + 1, maxY + 1], count };
}
function fillAt(x, y, tone) {
  const ly = L();
  if (ly.locked) return toast("This layer is locked.");
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= S.doc.w || y >= S.doc.h) return;
  const { mask, box, count } = floodMask(x, y);
  if (!count) return;
  const W = S.doc.w;
  const [bx, by, bx2, by2] = box, bw = bx2 - bx, bh = by2 - by;
  const g = ctx2d(ly.canvas), before = g.getImageData(bx, by, bw, bh), img = g.getImageData(bx, by, bw, bh), dt = img.data;
  const [r, gg, b] = hexRgb(S.color), op = S.opacity / 100;
  const ang = (S.toneAngle * Math.PI) / 180, ca = Math.cos(ang), sa = Math.sin(ang), sp = S.toneSpacing;
  const rad = Math.sqrt(S.toneDensity / 100 / Math.PI); // dot radius as a fraction of the cell, so the tone matches its percentage
  for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) {
    const gx = bx + xx, gy = by + yy;
    if (!mask[gy * W + gx]) continue;
    let a = op;
    if (tone) {
      const u = (gx * ca + gy * sa) / sp, v = (-gx * sa + gy * ca) / sp;
      const fu = u - Math.round(u), fv = v - Math.round(v), dist = Math.hypot(fu, fv);
      a = clamp((rad - dist) * sp + 0.5, 0, 1) * op;
      if (a <= 0) continue;
    }
    const p = (yy * bw + xx) * 4, ea = dt[p + 3] / 255, na = a + ea * (1 - a);
    dt[p] = Math.round((r * a + dt[p] * ea * (1 - a)) / na); dt[p + 1] = Math.round((gg * a + dt[p + 1] * ea * (1 - a)) / na); dt[p + 2] = Math.round((b * a + dt[p + 2] * ea * (1 - a)) / na);
    dt[p + 3] = Math.round(na * 255);
  }
  g.putImageData(img, bx, by);
  pushPixels(ly, [bx, by, bx2, by2], before);
  rememberColor();
  render();
}

// ---------- focus and speed lines ----------
function makeLines(mode, a, b) {
  const n = S.lineCount, w = S.doc.w, h = S.doc.h, diag = Math.hypot(w, h);
  const out = [];
  if (mode === "focus") {
    const inner = Math.max(8, Math.hypot(b.x - a.x, b.y - a.y));
    for (let i = 0; i < n; i++) {
      const t = ((i + Math.random() * 0.8) / n) * Math.PI * 2;
      const r0 = inner * (1 + Math.random() * 0.45), wd = (sizeOf() / 2) * (0.35 + Math.random() * 1.3);
      out.push({ cx: a.x, cy: a.y, t, r0, r1: diag, wd });
    }
    return { mode, lines: out };
  }
  const ang = Math.atan2(b.y - a.y, b.x - a.x), len = Math.max(60, Math.hypot(b.x - a.x, b.y - a.y));
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  for (let i = 0; i < n; i++) {
    const off = (Math.random() - 0.5) * diag * 1.1, along = (Math.random() - 0.5) * diag * 0.9;
    const l = len * (0.5 + Math.random() * 1.4), wd = (sizeOf() / 2) * (0.3 + Math.random());
    out.push({ x: w / 2 + nx * off + Math.cos(ang) * along, y: h / 2 + ny * off + Math.sin(ang) * along, ang, l, wd });
  }
  return { mode, lines: out };
}
function drawLines(g, set, preview) {
  g.fillStyle = preview ? "rgba(242,160,63,.55)" : S.color;
  g.beginPath();
  if (set.mode === "focus") for (const L of set.lines) {
    const c = Math.cos(L.t), s = Math.sin(L.t), px = -s, py = c;
    const ox = L.cx + c * L.r1, oy = L.cy + s * L.r1;
    g.moveTo(L.cx + c * L.r0, L.cy + s * L.r0);
    g.lineTo(ox + px * L.wd, oy + py * L.wd); g.lineTo(ox - px * L.wd, oy - py * L.wd); g.closePath();
  } else for (const L of set.lines) {
    // a long thin lens: pointed at both ends, widest a third of the way along
    const c = Math.cos(L.ang), s = Math.sin(L.ang), px = -s * L.wd, py = c * L.wd;
    const mx = L.x + c * L.l * 0.33, my = L.y + s * L.l * 0.33;
    g.moveTo(L.x, L.y); g.lineTo(mx + px, my + py); g.lineTo(L.x + c * L.l, L.y + s * L.l); g.lineTo(mx - px, my - py); g.closePath();
  }
  g.fill();
}

// ---------- eyedropper ----------
function pickAt(x, y) {
  x = Math.floor(x); y = Math.floor(y);
  if (x < 0 || y < 0 || x >= S.doc.w || y >= S.doc.h) return;
  const c = mkCanvas(1, 1), g = ctx2d(c);
  if (S.doc.paper !== "none") { g.fillStyle = S.doc.paper; g.fillRect(0, 0, 1, 1); }
  S.layers.forEach((ly) => { if (ly.visible) { g.globalAlpha = ly.opacity; g.globalCompositeOperation = ly.blend; g.drawImage(ly.canvas, x, y, 1, 1, 0, 0, 1, 1); } });
  const [r, gg, b, a] = g.getImageData(0, 0, 1, 1).data;
  if (!a) return toast("Nothing to pick up there.");
  setColor("#" + [r, gg, b].map((v) => v.toString(16).padStart(2, "0")).join(""));
}
function setColor(c) { S.color = c; drawTools(); drawSide(); }

// ---------- export ----------
export function flatten(doc, layers, { withRef = false } = {}) {
  const c = mkCanvas(doc.w, doc.h), g = ctx2d(c);
  if (doc.paper !== "none") { g.fillStyle = doc.paper; g.fillRect(0, 0, doc.w, doc.h); }
  layers.forEach((ly) => { if (ly.visible && (withRef || !ly.ref)) { g.globalAlpha = ly.opacity; g.globalCompositeOperation = ly.blend; g.drawImage(ly.canvas, 0, 0); } });
  return c;
}
const toBlob = (c) => new Promise((r) => c.toBlob(r, "image/png"));
async function exportPng() {
  const blob = await toBlob(flatten(S.doc, S.layers));
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `${(S.doc.title || "drawing").replace(/[^\w\s-]/g, "").trim() || "drawing"}.png`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 20_000);
  toast("Saved as PNG.");
}
async function done() {
  await saveNow();
  const cb = S.onDone;
  const blob = cb ? await toBlob(flatten(S.doc, S.layers)) : null;
  const id = S.doc.id;
  closeInk(true);
  if (cb) cb(blob, id); else toast("Drawing saved to your drafts in Create.");
}

// ---------- input ----------
let spaceDown = false;
function wire() {
  const root = S.root, cv = S.cv;
  addEventListener("resize", onResize);
  addEventListener("keydown", onKey, true);
  addEventListener("keyup", onKeyUp, true);
  root.addEventListener("click", onClick);
  $("#ink-title", root).addEventListener("change", (e) => { S.doc.title = e.target.value.trim() || "Untitled drawing"; scheduleSave(); });
  $("#ink-side", root).addEventListener("input", onSideInput);
  $("#ink-side", root).addEventListener("change", onSideChange);
  $("#ink-file", root).addEventListener("change", importImage);
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
  cv.addEventListener("pointerdown", onDown);
  cv.addEventListener("pointermove", onMove);
  cv.addEventListener("pointerup", onUp);
  cv.addEventListener("pointercancel", onUp);
  cv.addEventListener("pointerleave", () => ($("#ink-cursor", S.root).hidden = true));
  cv.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX - r.left, e.clientY - r.top);
    else { S.view.x -= e.deltaX; S.view.y -= e.deltaY; render(); }
  }, { passive: false });
  cv.addEventListener("dblclick", (e) => { if (S.tool === "hand") fit(); else e.preventDefault(); });
}

function onDown(e) {
  if (e.pointerType === "pen") S.penSeen = true;
  S.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
  try { S.cv.setPointerCapture(e.pointerId); } catch {}
  const touches = [...S.pointers.values()].filter((p) => p.type === "touch");
  // Two fingers always move and zoom; with a pen around, fingers never draw (palm rejection).
  if (touches.length >= 2 || (e.pointerType === "touch" && S.penSeen)) {
    if (S.live) { cancelStroke(); }
    S.gesture = gestureState();
    return;
  }
  const [x, y] = toDoc(e.clientX, e.clientY);
  if (e.button === 1 || spaceDown || S.tool === "hand") { S.pan = { x: e.clientX, y: e.clientY, vx: S.view.x, vy: S.view.y }; S.cv.style.cursor = "grabbing"; return; }
  if (e.button === 2) return;
  if (S.tool === "pick" || (e.altKey && BRUSHES[S.tool])) return pickAt(x, y);
  if (S.tool === "fill") return fillAt(x, y, false);
  if (S.tool === "tone") return fillAt(x, y, true);
  if (S.tool === "lines") {
    if (L().locked) return toast("This layer is locked.");
    S.lineDrag = { a: { x, y } }; S.linePrev = makeLines(S.lineMode, { x, y }, { x: x + 120, y }); render(); return;
  }
  beginStroke(e, x, y);
}
function cancelStroke() {
  const ly = L();
  if (S.live?.erase) { const g = ctx2d(ly.canvas); g.globalCompositeOperation = "copy"; g.drawImage(S.backup, 0, 0); g.globalCompositeOperation = "source-over"; }
  S.sg.clearRect(0, 0, S.doc.w, S.doc.h);
  S.live = null; render();
}
function gestureState() {
  const ps = [...S.pointers.values()];
  if (ps.length < 2) return { cx: ps[0].x, cy: ps[0].y, d: 0, vx: S.view.x, vy: S.view.y, s: S.view.s };
  const [a, b] = ps;
  return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y), vx: S.view.x, vy: S.view.y, s: S.view.s };
}
function onMove(e) {
  const cur = $("#ink-cursor", S.root);
  if (S.pointers.has(e.pointerId)) S.pointers.set(e.pointerId, { ...S.pointers.get(e.pointerId), x: e.clientX, y: e.clientY });
  if (S.gesture) {
    const g0 = S.gesture, g1 = gestureState(), r = S.cv.getBoundingClientRect();
    const f = g0.d && g1.d ? g1.d / g0.d : 1, ns = clamp(g0.s * f, 0.05, 16);
    const ax = g0.cx - r.left, ay = g0.cy - r.top;
    S.view.s = ns; S.view.x = g1.cx - r.left - ((ax - g0.vx) * ns) / g0.s; S.view.y = g1.cy - r.top - ((ay - g0.vy) * ns) / g0.s;
    render(); return;
  }
  if (S.pan) { S.view.x = S.pan.vx + e.clientX - S.pan.x; S.view.y = S.pan.vy + e.clientY - S.pan.y; render(); return; }
  // brush outline
  if (BRUSHES[S.tool] && e.pointerType !== "touch") {
    const r = S.cv.getBoundingClientRect(), d = Math.max(4, sizeOf() * S.view.s);
    cur.hidden = false; cur.style.width = cur.style.height = d + "px";
    cur.style.transform = `translate(${e.clientX - r.left - d / 2}px, ${e.clientY - r.top - d / 2}px)`;
  } else cur.hidden = true;
  if (S.lineDrag) { const [x, y] = toDoc(e.clientX, e.clientY); S.linePrev = makeLines(S.lineMode, S.lineDrag.a, { x, y }); S.lineDrag.b = { x, y }; render(); return; }
  if (!S.live) return;
  const evs = e.getCoalescedEvents?.() || [e];
  for (const ev of evs.length ? evs : [e]) { const [x, y] = toDoc(ev.clientX, ev.clientY); moveStroke(ev, x, y); }
}
function onUp(e) {
  S.pointers.delete(e.pointerId);
  if (S.gesture) { if (!S.pointers.size) S.gesture = null; else S.gesture = gestureState(); return; }
  if (S.pan) { S.pan = null; S.cv.style.cursor = ""; return; }
  if (S.lineDrag) {
    const ly = L(), set = S.linePrev; S.lineDrag = null; S.linePrev = null;
    if (set) {
      const g = ctx2d(ly.canvas), before = g.getImageData(0, 0, S.doc.w, S.doc.h);
      g.save(); g.globalAlpha = S.opacity / 100; drawLines(g, set, false); g.restore();
      pushPixels(ly, [0, 0, S.doc.w, S.doc.h], before);
    }
    render(); return;
  }
  if (S.live) endStroke();
}

function onKey(e) {
  if (!S.root) return;
  const typing = e.target.matches?.("input:not([type=range]):not([type=checkbox]):not([type=color]), textarea, select");
  const mod = e.metaKey || e.ctrlKey, k = e.key;
  if (document.querySelector(".modal")) return; // a dialog on top handles its own keys
  if (k === "Escape" && !typing) { e.preventDefault(); e.stopPropagation(); closeInk(); return; }
  if (typing) return;
  e.stopPropagation(); // the app's own shortcuts wait while you draw
  if (mod && (k === "z" || k === "Z")) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && (k === "y" || k === "Y")) { e.preventDefault(); redo(); return; }
  if (mod && k === "s") { e.preventDefault(); saveNow(); toast("Saved."); return; }
  if (mod) return;
  if (k === " ") { e.preventDefault(); spaceDown = true; S.cv.style.cursor = "grab"; return; }
  const tool = Object.entries(TOOL_KEYS).find(([, v]) => v === k.toUpperCase())?.[0];
  if (tool && k.length === 1) { e.preventDefault(); setTool(tool); return; }
  if (k === "[" || k === "]") { e.preventDefault(); if (S.size[S.tool] != null || S.tool === "lines") { const cur = sizeOf(); S.size[S.tool] = clamp(Math.round(k === "]" ? cur * 1.15 + 1 : cur / 1.15 - 0.5), 1, 400); drawSide(); } return; }
  if (k === "x" || k === "X") { e.preventDefault(); swapColor(); return; }
  if (k === "f" || k === "F") { e.preventDefault(); toggle("flip"); return; }
  if (k === "s" || k === "S") { e.preventDefault(); toggle("sym"); return; }
  if (k === "'") { e.preventDefault(); toggle("grid"); return; }
  if (k === "0") { e.preventDefault(); fit(); return; }
  if (k === "1") { e.preventDefault(); zoomAt(1 / S.view.s, S.vw / 2, S.vh / 2); return; }
  if (k === "+" || k === "=") { e.preventDefault(); zoomAt(1.25, S.vw / 2, S.vh / 2); return; }
  if (k === "-") { e.preventDefault(); zoomAt(0.8, S.vw / 2, S.vh / 2); return; }
  if (k === "Tab") { e.preventDefault(); S.root.classList.toggle("ink-zen"); requestAnimationFrame(resize); return; }
}
function onKeyUp(e) { if (e.key === " ") { spaceDown = false; if (S.cv) S.cv.style.cursor = ""; } }

let lastWhite = "#111111";
function swapColor() { if (S.color.toLowerCase() === "#ffffff") setColor(lastWhite); else { lastWhite = S.color; setColor("#ffffff"); } }
function setTool(t) { S.tool = t; persistPrefs(); drawTools(); drawSide(); }
function toggle(what) {
  if (what === "flip") S.view.flip = !S.view.flip;
  else S[what] = !S[what];
  $(`[data-a=${what}]`, S.root)?.setAttribute("aria-pressed", String(what === "flip" ? S.view.flip : S[what]));
  render();
}
function persistPrefs() {
  try { localStorage.setItem("kitsune.ink", JSON.stringify({ tool: S.tool, color: S.color, recent: S.recent, size: S.size, opacity: S.opacity, smooth: S.smooth, pressOn: S.pressOn, fillTol: S.fillTol, fillSample: S.fillSample, fillGrow: S.fillGrow, toneDensity: S.toneDensity, toneSpacing: S.toneSpacing, toneAngle: S.toneAngle, lineCount: S.lineCount, lineMode: S.lineMode })); } catch {}
}

async function onClick(e) {
  const t = e.target.closest("button"); if (!t || !S.root.contains(t)) return;
  if (t.dataset.tool) return setTool(t.dataset.tool);
  if (t.dataset.col) { setColor(t.dataset.col); persistPrefs(); return; }
  if (t.dataset.vis != null) { const ly = S.layers[Number(t.dataset.vis)]; pushHist({ kind: "prop", ly, bef: { visible: ly.visible }, aft: { visible: !ly.visible }, bytes: 0 }); ly.visible = !ly.visible; drawSide(); render(); return; }
  if (t.dataset.pickl != null) { S.active = Number(t.dataset.pickl); drawSide(); return; }
  const seg = t.closest(".ink-seg");
  if (seg && t.dataset.v) {
    if (seg.id === "ink-sample") S.fillSample = t.dataset.v;
    if (seg.id === "ink-lmode") S.lineMode = t.dataset.v;
    if (seg.id === "ink-paper") { S.doc.paper = t.dataset.v; scheduleSave(); render(); }
    persistPrefs(); drawSide(); return;
  }
  const a = t.dataset.a; if (!a) return;
  if (a === "close") return closeInk();
  if (a === "done") return done();
  if (a === "undo") return undo();
  if (a === "redo") return redo();
  if (a === "fit") return fit();
  if (a === "flip" || a === "sym" || a === "grid") return toggle(a);
  if (a === "export") return exportPng();
  if (a === "swap") return swapColor();
  if (a === "side") { S.root.classList.toggle("ink-side-open"); return; }
  if (a === "ladd") return layerChange(() => { const ly = newLayer(`Layer ${S.layers.length + 1}`); S.layers.splice(S.active + 1, 0, ly); S.active++; });
  if (a === "ldup") return layerChange(() => { const src = L(), ly = newLayer(src.name + " copy"); Object.assign(ly, { opacity: src.opacity, blend: src.blend }); ctx2d(ly.canvas).drawImage(src.canvas, 0, 0); S.layers.splice(S.active + 1, 0, ly); S.active++; });
  if (a === "lup" && S.active < S.layers.length - 1) return layerChange(() => { const ls = S.layers; [ls[S.active], ls[S.active + 1]] = [ls[S.active + 1], ls[S.active]]; S.active++; });
  if (a === "ldown" && S.active > 0) return layerChange(() => { const ls = S.layers; [ls[S.active], ls[S.active - 1]] = [ls[S.active - 1], ls[S.active]]; S.active--; });
  if (a === "lmerge" && S.active > 0) return layerChange(() => {
    const top = L(), below = S.layers[S.active - 1], g = ctx2d(below.canvas);
    const bef = g.getImageData(0, 0, S.doc.w, S.doc.h);
    g.globalAlpha = top.opacity; g.globalCompositeOperation = top.blend; g.drawImage(top.canvas, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    const aft = g.getImageData(0, 0, S.doc.w, S.doc.h);
    S.layers.splice(S.active, 1); S.active--; below.dirty = true;
    return [{ kind: "px", ly: below, x: 0, y: 0, bef, aft, bytes: S.doc.w * S.doc.h * 8 }];
  });
  if (a === "lclear") { const ly = L(), g = ctx2d(ly.canvas), bef = g.getImageData(0, 0, S.doc.w, S.doc.h); g.clearRect(0, 0, S.doc.w, S.doc.h); pushPixels(ly, [0, 0, S.doc.w, S.doc.h], bef); drawSide(); render(); return; }
  if (a === "ldel" && S.layers.length > 1) return layerChange(() => { S.layers.splice(S.active, 1); S.active = Math.max(0, S.active - 1); });
  if (a === "limg") return $("#ink-file", S.root).click();
  if (a === "lrename") {
    const { modal } = await import("./util.js");
    const ly = L();
    const m = modal({ title: "Rename layer", body: `<form id="ink-rn" class="form"><input class="field" id="ink-rn-v" value="${esc(ly.name)}" maxlength="40" required autofocus></form>`, actions: `<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" form="ink-rn">Rename</button>` });
    $("#ink-rn", m.root).onsubmit = (ev) => { ev.preventDefault(); const v = $("#ink-rn-v", m.root).value.trim(); if (v) { pushHist({ kind: "prop", ly, bef: { name: ly.name }, aft: { name: v }, bytes: 0 }); ly.name = v; drawSide(); } m.close(); };
  }
}

function onSideInput(e) {
  const t = e.target, v = Number(t.value), lab = t.closest(".ink-range")?.querySelector("b");
  if (t.id === "ink-size") { S.size[S.tool] = v; if (lab) lab.textContent = v + "px"; }
  if (t.id === "ink-op") { S.opacity = v; if (lab) lab.textContent = v + "%"; }
  if (t.id === "ink-smooth") { S.smooth = v; if (lab) lab.textContent = v + "%"; }
  if (t.id === "ink-tol") { S.fillTol = v; if (lab) lab.textContent = v; }
  if (t.id === "ink-grow") { S.fillGrow = v; if (lab) lab.textContent = v + "px"; }
  if (t.id === "ink-tden") { S.toneDensity = v; if (lab) lab.textContent = v + "%"; $(".ink-tonepv", S.root)?.style.setProperty("--d", v); }
  if (t.id === "ink-tsp") { S.toneSpacing = v; if (lab) lab.textContent = v + "px"; $(".ink-tonepv", S.root)?.style.setProperty("--s", v + "px"); }
  if (t.id === "ink-tang") { S.toneAngle = v; if (lab) lab.textContent = v + "°"; }
  if (t.id === "ink-lcount") { S.lineCount = v; if (lab) lab.textContent = v; }
  if (t.id === "ink-lop") { L().opacity = v / 100; if (lab) lab.textContent = v + "%"; render(); }
  if (t.id === "ink-col") { S.color = t.value; t.parentElement.style.setProperty("--c", t.value); $(".ink-swatch", S.root)?.style.setProperty("--c", t.value); }
}
function onSideChange(e) {
  const t = e.target, ly = L();
  if (t.id === "ink-lop") { scheduleSave(); }
  if (t.id === "ink-blend") { pushHist({ kind: "prop", ly, bef: { blend: ly.blend }, aft: { blend: t.value }, bytes: 0 }); ly.blend = t.value; drawSide(); render(); }
  if (t.id === "ink-llock") { ly.locked = t.checked; scheduleSave(); drawSide(); }
  if (t.id === "ink-lref") { ly.ref = t.checked; scheduleSave(); drawSide(); }
  if (t.id === "ink-press") S.pressOn = t.checked;
  if (t.id === "ink-col") { rememberColor(); drawSide(); }
  persistPrefs();
}

async function importImage(e) {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  try {
    const bmp = await createImageBitmap(f);
    layerChange(() => {
      const ly = newLayer(f.name.replace(/\.[^.]+$/, "").slice(0, 30) || "Image");
      const s = Math.min(S.doc.w / bmp.width, S.doc.h / bmp.height);
      const w = bmp.width * s, h = bmp.height * s;
      ctx2d(ly.canvas).drawImage(bmp, (S.doc.w - w) / 2, (S.doc.h - h) / 2, w, h);
      ly.opacity = 0.5; ly.ref = true;
      S.layers.splice(S.active + 1, 0, ly); S.active++;
    });
    toast("Added as a reference layer at half opacity. It's left out when you finish, unless you untick Reference only.");
  } catch { toast("That image couldn't be opened."); }
}

void reduceMotion;

/** Bring an image in as a normal (not reference) layer, filling the canvas. */
export async function importBlob(blob, name = "Image") {
  if (!S.root || !blob) return;
  const bmp = await createImageBitmap(blob);
  layerChange(() => {
    const ly = newLayer(name);
    const s = Math.max(S.doc.w / bmp.width, S.doc.h / bmp.height), w = bmp.width * s, h = bmp.height * s;
    ctx2d(ly.canvas).drawImage(bmp, (S.doc.w - w) / 2, (S.doc.h - h) / 2, w, h);
    S.layers.splice(0, 0, ly); S.active = S.layers.length - 1;
  });
  scheduleSave();
}

/** For tests and the console: the live editor state. */
export const inkState = () => S;
