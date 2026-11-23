// Manga / comic reader.
import { $, $$, esc, icon, toast, clamp, coverHtml } from "../util.js";
import { settings, saveSettings, pageSrc, getProgress, setProgress, logStat, sessionTimer, getMarks, setMarks, seriesGroups, coverSrc, progressPct, allProgress, kvGet, kvSet, seriesKey } from "../store.js";

const R = { item: null, i: 0, seen: new Set(), timer: null, io: null, lazy: null, zoom: 1, tx: 0, ty: 0, auto: 0, autoRaf: 0, marks: [], loadSeq: 0 };
const el = () => $("#reader");

export async function openManga(item, opts = {}) {
  closeManga(true);
  R.item = item;
  const saved = await getProgress(item.id);
  R.i = opts.from != null ? opts.from : saved && saved.pos < item.pages ? saved.pos : 0;
  if (saved && saved.pos >= item.pages - 1 && opts.from == null) R.i = 0;
  R.seen = new Set();
  R.marks = await getMarks("bookmarks", item.id);
  R.timer = sessionTimer(item.id);
  R.zoom = 1; R.tx = R.ty = 0;
  R.wide = new Set(); R.spKey = null; R.mag = false; R.guided = false; R.panels = null; R.pi = 0;
  // Direction and layout are remembered for the whole series (a webtoon stays a long strip, a manga stays right to left).
  R.sk = seriesKey(item);
  R.sp = (await kvGet("seriesPrefs", {}))[R.sk] || {};
  if (R.item !== item) return;
  build();
  const r = el();
  r.hidden = false;
  document.body.style.overflow = "hidden";
  applyLayout();
  $("#r-close").focus();
  navigator.wakeLock?.request?.("screen").then((l) => (R.wake = l)).catch(() => {});
}

function dir() { return R.sp?.dir || (R.item.dir === "scroll" ? settings.manga.dir : R.item.dir || settings.manga.dir); }
function mode() { return R.sp?.mode || (R.item.dir === "scroll" ? "scroll" : settings.manga.mode); }
function volumeAt(step) {
  const group = seriesGroups().find((g) => g.items.some((i) => i.id === R.item.id));
  const idx = group ? group.items.findIndex((i) => i.id === R.item.id) : -1;
  return idx >= 0 ? group.items[idx + step] || null : null;
}
const nextVolume = () => volumeAt(1), prevVolume = () => volumeAt(-1);
// Fetch the first pages of the next volume while you finish this one, so it opens straight away.
let warmed = null;
async function warmNext() {
  const nx = nextVolume();
  if (!nx || warmed === nx.id || nx.type !== "manga") return;
  warmed = nx.id;
  for (let k = 0; k < Math.min(3, nx.pages || 0); k++) { try { const im = new Image(); im.src = await pageSrc(nx, k); } catch { break; } }
}

function build() {
  const it = R.item;
  el().innerHTML = `
    <div class="r-bar">
      <button class="icon-btn" id="r-close" aria-label="Close reader">${icon("back")}</button>
      <div class="r-title"><strong>${esc(it.title)}</strong><span>${esc(it.series || it.author || "")}</span></div>
      <span class="r-count" id="r-count"></span>
      <button class="icon-btn" id="r-bm" aria-label="Bookmark this page (B)" title="Bookmark (B)">${icon("bookmark")}</button>
      <button class="icon-btn" id="r-thumbs-btn" aria-label="All pages (T)" title="All pages (T)">${icon("grid")}</button>
      <button class="icon-btn" id="r-zoom" aria-label="Zoom (Z)" title="Zoom (Z)">${icon("zoom")}</button>
      <button class="icon-btn" id="r-guided" aria-label="Guided view, panel by panel (G)" title="Guided view (G)" aria-pressed="false">${icon("pages")}</button>
      <button class="icon-btn" id="r-full" aria-label="Full screen (F)" title="Full screen (F)">${icon("expand")}</button>
      <button class="icon-btn" id="r-set-btn" aria-label="Reader settings (S)" aria-expanded="false" title="Settings (S)">${icon("sliders")}</button>
    </div>
    <div class="r-panel" id="r-panel" hidden>
      <div class="r-set"><h4>Layout</h4><div class="seg" data-k="mode">${[["single", "Single"], ["double", "Spread"], ["scroll", "Long strip / webtoon"]].map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}</div></div>
      <div class="r-set"><h4>Direction</h4><div class="seg" data-k="dir">${[["rtl", "Right to left"], ["ltr", "Left to right"]].map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}</div></div>
      <div class="r-set"><h4>Fit</h4><div class="seg" data-k="fit">${[["height", "Screen"], ["tall", "Height"], ["width", "Width"], ["original", "Original"]].map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}</div></div>
      <div class="r-set"><label class="check"><input type="checkbox" id="r-offset"> Shift spreads by one page (when pairs look wrong)</label>
        <label class="check"><input type="checkbox" id="r-gap"> Gaps between pages in long strip</label>
        <label class="check"><input type="checkbox" id="r-lightbg"> Light background</label>
        <label class="check"><input type="checkbox" id="r-trim"> Crop white borders (your own files)</label>
        <label class="check"><input type="checkbox" id="r-series"> Remember layout and direction for this series</label>
        <label class="check"><input type="checkbox" id="r-enhance"> Sharpen low-resolution scans</label></div>
      <div class="r-set"><h4>Tap zones</h4><div class="seg" id="r-zones">${[["sides", "Edges"], ["wide", "Halves"], ["off", "Off"]].map(([v, l]) => `<button type="button" data-z="${v}">${l}</button>`).join("")}</div>
        <label class="check"><input type="checkbox" id="r-invert"> Swap the left and right taps</label>
        <p class="r-keys" style="margin:4px 0 0">Page-turner remotes and media keys turn pages too, and so do volume keys on devices that pass them to the browser.</p></div>
      <div class="r-set"><h4>Brightness <span id="r-bri-v"></span></h4><input type="range" id="r-bri" min="40" max="120" step="5"></div>
      <div class="r-set"><h4>Night warmth <span id="r-warm-v"></span></h4><input type="range" id="r-warm" min="0" max="60" step="5"></div>
      <div class="r-set"><h4>Page turn</h4><div class="seg" id="r-anim">${[["slide", "Slide"], ["fade", "Fade"], ["none", "Instant"]].map(([v, l]) => `<button type="button" data-a="${v}" aria-pressed="${(settings.manga.anim || "slide") === v}">${l}</button>`).join("")}</div></div>
      <div class="r-set"><h4>Colour</h4><div class="seg" id="r-color">${[["normal", "Normal"], ["invert", "Night (invert)"], ["gray", "Grayscale"], ["paper", "Paper"]].map(([v, l]) => `<button type="button" data-c="${v}" aria-pressed="${(settings.manga.color || "normal") === v}">${l}</button>`).join("")}</div></div>
      <div class="r-set"><button class="btn btn-sm" type="button" id="r-mag" aria-pressed="false" style="background:#2b2f55;border-color:#3a3e66;color:#fff;justify-self:start">Magnifier (M)</button></div>
      <div class="r-set"><h4>Focus timer</h4><div class="seg" id="r-focus">${[15, 25, 45].map((n) => `<button type="button" data-min="${n}">${n} min</button>`).join("")}</div></div>
      <div class="r-set"><h4>This volume</h4><button class="btn btn-sm" type="button" id="r-cover" style="background:#2b2f55;border-color:#3a3e66;color:#fff;justify-self:start">Use this page as the cover</button></div>
      <p class="r-keys">Wide two-page drawings show on their own in Spread, so the pairs after them stay right.<br>← → turn · Space next · Home/End first/last · [ ] previous/next volume<br>T pages · B bookmark · Z zoom · F full screen · ? help · Esc close<br>Double-click to zoom · drag to pan · Ctrl+scroll zooms</p>
    </div>
    <div class="r-stage" id="r-stage">
      <div class="r-pages" id="r-pages"></div>
      <button class="r-zone r-zone-l" id="r-zone-l" aria-label="Turn page (left side)"></button>
      <button class="r-zone r-zone-r" id="r-zone-r" aria-label="Turn page (right side)"></button>
      <div class="r-loupe" id="r-loupe" hidden></div>
    </div>
    <div class="r-autoscroll" id="r-auto" hidden>
      <button class="icon-btn" id="r-auto-down" aria-label="Slower">−</button><span id="r-auto-v">Auto 0</span><button class="icon-btn" id="r-auto-up" aria-label="Faster">+</button>
    </div>
    <div class="r-foot"><span class="r-count" id="r-foot-l"></span><input type="range" id="r-slider" min="1" max="${it.pages}" value="1" aria-label="Page"><span class="r-count" id="r-foot-r">${it.pages}</span><button class="r-nextvol" type="button" id="r-nextvol" hidden>Next volume ›</button></div>
    <p class="sr-only" id="r-live" aria-live="polite"></p>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="r-sharpen" color-interpolation-filters="sRGB"><feConvolveMatrix order="3" kernelMatrix="0 -0.6 0 -0.6 3.4 -0.6 0 -0.6 0" preserveAlpha="true"/></filter></svg>
    <div class="r-thumbs" id="r-thumbs" hidden></div>
    <div class="r-end" id="r-end" hidden></div>`;
  wire();
}

function applyLayout() {
  const r = el(), m = settings.manga;
  r.className = `reader mode-${mode()} fit-${m.fit} dir-${dir()} zones-${m.zones || "sides"} ${m.gap ? "gap" : ""} ${m.lightBg ? "light-bg" : ""} ${m.enhance ? "enhance" : ""}`;
  $$("#r-panel [data-k]").forEach((g) => $$("button", g).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === ({ mode: mode(), dir: dir(), fit: m.fit })[g.dataset.k]))));
  $("#r-enhance").checked = !!m.enhance; $("#r-invert").checked = !!m.invertTaps; $("#r-series").checked = m.seriesMemory !== false;
  $$("#r-zones button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.z === (m.zones || "sides"))));
  { const nx = nextVolume(); $("#r-nextvol").hidden = !nx; if (nx) $("#r-nextvol").title = nx.title; }
  $("#r-offset").checked = !!m.offset; $("#r-gap").checked = !!m.gap; $("#r-lightbg").checked = !!m.lightBg; $("#r-trim").checked = !!m.trim;
  $("#r-bri").value = m.brightness; $("#r-warm").value = m.warmth;
  $("#r-bri-v").textContent = m.brightness + "%"; $("#r-warm-v").textContent = m.warmth ? m.warmth + "%" : "off";
  $("#r-pages").style.flexDirection = mode() === "scroll" ? "column" : dir() === "rtl" ? "row-reverse" : "row";
  $("#r-pages").style.filter = filterCss();
  $("#r-auto").hidden = mode() !== "scroll";
  resetZoom();
  render();
}

// ---------- page rendering ----------
// Two-page spreads. The cover stands alone, and so does any wide page
// (a double-page drawing), so the pairs after it stay correct.
function spreads() {
  const n = R.item.pages, off = !!settings.manga.offset;
  const key = `${n}:${off}:${[...R.wide].sort((a, b) => a - b).join(",")}`;
  if (R.spKey === key) return R.sp;
  const out = [];
  let i = 0;
  if (!off) { out.push([0]); i = 1; }
  while (i < n) {
    if (R.wide.has(i) || i + 1 >= n || R.wide.has(i + 1)) { out.push([i]); i++; }
    else { out.push([i, i + 1]); i += 2; }
  }
  R.spKey = key; R.sp = out;
  return out;
}
const spreadIndex = (i) => Math.max(0, spreads().findIndex((s) => s.includes(i)));
function visible() {
  if (mode() !== "double") return [R.i];
  return spreads()[spreadIndex(R.i)];
}
function noteSize(i, w, h) {
  if (w > h * 1.15 && !R.wide.has(i)) {
    R.wide.add(i);
    if (mode() === "double" && visible().length === 2 && $("#r-pages img[data-i='" + i + "']")) render();
  }
}

// Trim white page margins. Only works for pages the browser may inspect
// (your own files and same-site pages); others are shown untouched.
const trimCache = new Map();
async function trimmed(src, key) {
  if (trimCache.has(key)) return trimCache.get(key);
  const im = new Image(); im.src = src; await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight, s = Math.min(1, 500 / Math.max(W, H));
  const c = document.createElement("canvas"); c.width = Math.round(W * s); c.height = Math.round(H * s);
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(im, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data; // throws for other sites' images
  const ink = (x, y) => { const k = (y * c.width + x) * 4; return d[k] < 232 || d[k + 1] < 232 || d[k + 2] < 232; };
  const rowHas = (y) => { let n = 0; for (let x = 0; x < c.width; x++) if (ink(x, y) && ++n > c.width * 0.004) return true; return false; };
  const colHas = (x) => { let n = 0; for (let y = 0; y < c.height; y++) if (ink(x, y) && ++n > c.height * 0.004) return true; return false; };
  let top = 0, bottom = c.height - 1, left = 0, right = c.width - 1;
  while (top < bottom && !rowHas(top)) top++;
  while (bottom > top && !rowHas(bottom)) bottom--;
  while (left < right && !colHas(left)) left++;
  while (right > left && !colHas(right)) right--;
  const pad = Math.round(Math.min(c.width, c.height) * 0.012);
  top = Math.max(0, top - pad); left = Math.max(0, left - pad); bottom = Math.min(c.height - 1, bottom + pad); right = Math.min(c.width - 1, right + pad);
  const kept = ((right - left) * (bottom - top)) / (c.width * c.height);
  if (kept > 0.96 || kept < 0.3) { trimCache.set(key, src); return src; } // nothing worth trimming, or a mostly blank page
  const out = document.createElement("canvas");
  out.width = Math.round((right - left + 1) / s); out.height = Math.round((bottom - top + 1) / s);
  out.getContext("2d").drawImage(im, left / s, top / s, out.width, out.height, 0, 0, out.width, out.height);
  const blob = await new Promise((r) => out.toBlob(r, "image/jpeg", 0.92));
  const url = URL.createObjectURL(blob);
  trimCache.set(key, url);
  if (trimCache.size > 60) { const [k, u] = trimCache.entries().next().value; if (u.startsWith("blob:")) URL.revokeObjectURL(u); trimCache.delete(k); }
  return url;
}

async function setImg(img, i) {
  try {
    let src = await pageSrc(R.item, i);
    if (settings.manga.trim) src = await trimmed(src, R.item.id + ":" + i).catch(() => src);
    img.onload = () => noteSize(i, img.naturalWidth, img.naturalHeight);
    img.src = src;
    img.onerror = () => { img.replaceWith(placeholder(i, "This page didn't load.")); };
  } catch (e) { img.replaceWith(placeholder(i, e.message)); }
}

async function useAsCover() {
  const it = R.item, p = visible()[0];
  try {
    const { makeCoverBlob, saveItem } = await import("../store.js");
    try { it.coverBlob = await makeCoverBlob(await pageSrc(it, p)); delete it.coverPage; }
    catch { delete it.coverBlob; it.coverPage = p; } // pages from other sites can't be copied, so point at the page instead
    await saveItem(it);
    toast(`Page ${p + 1} is now the cover.`);
  } catch (e) { toast(e.message); }
}
const placeholder = (i, msg) => { const d = document.createElement("div"); d.className = "r-ph"; d.dataset.i = i; d.textContent = msg || `Page ${i + 1}`; return d; };

function render() {
  const box = $("#r-pages"), n = R.item.pages;
  R.io?.disconnect(); R.lazy?.disconnect();
  $("#r-end").hidden = true;
  const seq = ++R.loadSeq;
  if (mode() === "scroll") {
    box.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) { const img = document.createElement("img"); img.dataset.i = i; img.alt = `Page ${i + 1}`; img.decoding = "async"; img.style.minHeight = "40vh"; frag.append(img); }
    box.append(frag);
    R.lazy = new IntersectionObserver((ents) => {
      for (const en of ents) if (en.isIntersecting && !en.target.src) { setImg(en.target, Number(en.target.dataset.i)); en.target.addEventListener("load", () => (en.target.style.minHeight = ""), { once: true }); }
    }, { root: $("#r-stage"), rootMargin: "150% 0px" });
    R.io = new IntersectionObserver((ents) => {
      for (const en of ents) if (en.isIntersecting) { R.i = Number(en.target.dataset.i); onPage(); }
    }, { root: $("#r-stage"), rootMargin: "-48% 0px -48% 0px" });
    $$("img", box).forEach((im) => { R.lazy.observe(im); R.io.observe(im); });
    requestAnimationFrame(() => box.children[R.i]?.scrollIntoView({ block: "start" }));
    onPage();
    return;
  }
  const pages = visible();
  box.innerHTML = pages.map((i) => `<img data-i="${i}" alt="Page ${i + 1}" decoding="async">`).join("");
  // Page-turn animation: forward in a right-to-left book comes in from the left.
  const anim = settings.manga.anim || "slide";
  box.classList.remove("turn-from-left", "turn-from-right", "turn-fade");
  if (R.turn && anim !== "none") {
    void box.offsetWidth; // restart the animation
    const fromLeft = (R.turn > 0) === (dir() === "rtl");
    box.classList.add(anim === "fade" ? "turn-fade" : fromLeft ? "turn-from-left" : "turn-from-right");
  }
  R.turn = 0;
  $$("img", box).forEach((img) => setImg(img, Number(img.dataset.i)));
  $("#r-stage").scrollTo(0, 0);
  onPage();
  // preload ahead
  (async () => { for (let k = 1; k <= 4; k++) { const p = pages.at(-1) + k; if (p >= n || seq !== R.loadSeq) break; try { const s = await pageSrc(R.item, p); const im = new Image(); im.onload = () => noteSize(p, im.naturalWidth, im.naturalHeight); im.src = s; } catch {} } })();
}

let saveT;
function onPage() {
  const n = R.item.pages, pages = mode() === "double" ? visible() : [R.i];
  $("#r-count").textContent = `${pages.map((p) => p + 1).join("–")} / ${n}`;
  $("#r-foot-l").textContent = pages[0] + 1;
  $("#r-live").textContent = `Page ${pages.map((p) => p + 1).join(" and ")} of ${n}`;
  if (pages.at(-1) >= n - 3) warmNext();
  $("#r-slider").value = R.i + 1;
  $("#r-bm").setAttribute("aria-pressed", String(R.marks.some((b) => pages.includes(b.pos))));
  let fresh = 0;
  for (const p of pages) if (!R.seen.has(p)) { R.seen.add(p); fresh++; }
  if (fresh) logStat({ pages: fresh, itemId: R.item.id });
  clearTimeout(saveT);
  saveT = setTimeout(() => setProgress(R.item.id, { pos: pages.at(-1), total: n }), 300);
}

function go(delta) {
  // Guided view moves panel by panel before turning the page.
  if (R.guided && mode() === "single" && R.panels?.length) {
    const next = R.pi + delta;
    if (next >= 0 && next < R.panels.length) { R.pi = next; return showPanel(); }
    const np = R.i + delta;
    if (np < 0) return toast("This is the first page.");
    if (np >= R.item.pages) return showEnd();
    R.i = np; R.turn = 0; R.panels = null; render();
    return guidePage(delta < 0);
  }
  if (mode() === "scroll") { const st = $("#r-stage"); st.scrollBy({ top: delta * st.clientHeight * 0.85, behavior: "smooth" }); return; }
  if (R.zoom > 1) resetZoom();
  const n = R.item.pages;
  let next;
  if (mode() === "double") {
    const sp = spreads(), k = spreadIndex(R.i) + delta;
    next = k < 0 ? -1 : k >= sp.length ? n : sp[k][0];
  } else next = R.i + delta;
  if (next < 0) return toast("This is the first page.");
  if (next >= n) return showEnd();
  R.i = next; R.turn = delta; render();
}
const leftAction = () => go((dir() === "rtl") !== !!settings.manga.invertTaps ? 1 : -1);
const rightAction = () => go((dir() === "rtl") !== !!settings.manga.invertTaps ? -1 : 1);
// Arrow keys always follow the page direction; only taps can be swapped.
const keyLeft = () => go(dir() === "rtl" ? 1 : -1);
const keyRight = () => go(dir() === "rtl" ? -1 : 1);
function openVolume(v, which) { if (!v) return toast(which === "next" ? "This is the last volume you have." : "This is the first volume you have."); openManga(v, { from: 0 }); }
function jump(i) { R.i = clamp(i, 0, R.item.pages - 1); if (mode() === "scroll") $("#r-pages").children[R.i]?.scrollIntoView({ block: "start" }); else render(); }

// ---------- end of volume ----------
async function showEnd() {
  setProgress(R.item.id, { pos: R.item.pages - 1, total: R.item.pages });
  const group = seriesGroups().find((g) => g.items.some((i) => i.id === R.item.id));
  const idx = group ? group.items.findIndex((i) => i.id === R.item.id) : -1;
  const next = idx >= 0 ? group.items[idx + 1] : null;
  const end = $("#r-end");
  end.innerHTML = `<div>${next ? coverHtml(coverSrc(next), next.title) : ""}
    <p class="eyebrow" style="color:#8c8eaa">End of ${esc(R.item.title)}</p>
    <h3>${next ? `Next: ${esc(next.title)}` : "You finished this volume."}</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
      ${next ? `<button class="btn btn-accent btn-lg" type="button" id="r-next-vol">${icon("book")}Read next volume</button>` : ""}
      <button class="btn" type="button" id="r-end-back">Back to the last page</button>
      <button class="btn" type="button" id="r-end-close">Close</button></div>
    ${!next && R.item.link ? `<a class="btn" style="margin-top:4px" href="#manga/${R.item.link.anilistId}">See the series</a>` : ""}</div>`;
  end.hidden = false;
  $("#r-next-vol")?.addEventListener("click", () => openManga(next, { from: 0 }));
  $("#r-end-back").onclick = () => (end.hidden = true);
  $("#r-end-close").onclick = () => closeManga();
  $("#r-end a")?.addEventListener("click", () => closeManga());
  ($("#r-next-vol") || $("#r-end-close")).focus();
}

// ---------- thumbnails ----------
async function showThumbs() {
  const t = $("#r-thumbs");
  if (!t.hidden) { t.hidden = true; return; }
  const n = R.item.pages;
  t.innerHTML = `<div class="r-thumbs-grid">${Array.from({ length: n }, (_, i) => `<button type="button" data-p="${i}" class="${i === R.i ? "cur" : ""}"><span class="t"><img data-i="${i}" alt=""></span><span>${R.marks.some((b) => b.pos === i) ? `<span class="bm">★</span> ` : ""}${i + 1}</span></button>`).join("")}</div>`;
  t.hidden = false;
  const io = new IntersectionObserver((ents) => { for (const en of ents) if (en.isIntersecting) { io.unobserve(en.target); setImg(en.target, Number(en.target.dataset.i)); } }, { root: t, rootMargin: "300px" });
  $$("img", t).forEach((im) => io.observe(im));
  t.onclick = (e) => { const b = e.target.closest("[data-p]"); if (b) { t.hidden = true; io.disconnect(); jump(Number(b.dataset.p)); } };
  $(`[data-p="${R.i}"]`, t)?.scrollIntoView({ block: "center" });
}

// ---------- bookmarks ----------
async function toggleBookmark() {
  const p = mode() === "double" ? visible()[0] : R.i;
  const i = R.marks.findIndex((b) => b.pos === p);
  if (i >= 0) { R.marks.splice(i, 1); toast("Bookmark removed."); }
  else { R.marks.push({ pos: p, label: `Page ${p + 1}`, created: Math.floor(Date.now() / 1000) }); R.marks.sort((a, b) => a.pos - b.pos); toast(`Bookmarked page ${p + 1}.`); }
  await setMarks("bookmarks", R.item.id, R.marks);
  onPage();
}

// ---------- zoom & pan ----------
function applyZoom() {
  const box = $("#r-pages");
  box.style.transform = R.zoom > 1 ? `translate(${R.tx}px, ${R.ty}px) scale(${R.zoom})` : "";
  $("#r-zoom").setAttribute("aria-pressed", String(R.zoom > 1));
  $("#r-stage").style.cursor = R.zoom > 1 ? "grab" : "";
}
function resetZoom() { R.zoom = 1; R.tx = R.ty = 0; if ($("#r-pages")) applyZoom(); }
function zoomAt(z, cx, cy) {
  const st = $("#r-stage").getBoundingClientRect();
  const x = (cx ?? st.left + st.width / 2) - st.left, y = (cy ?? st.top + st.height / 2) - st.top;
  const nz = clamp(z, 1, 4);
  R.tx = x - ((x - R.tx) * nz) / R.zoom; R.ty = y - ((y - R.ty) * nz) / R.zoom;
  R.zoom = nz;
  if (nz === 1) R.tx = R.ty = 0;
  applyZoom();
}

// ---------- guided view: find panels and step through them ----------
const panelCache = new Map();
// Finds panels by cutting the page along empty gutters (rows first, then columns in each row).
async function detectPanels(src, key) {
  if (panelCache.has(key)) return panelCache.get(key);
  const im = new Image(); im.src = src; await im.decode();
  const s = Math.min(1, 480 / im.naturalHeight), w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(im, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data; // throws for other sites' images
  // Gutter colour: the most common border colour (white or black pages).
  const corner = (x, y) => { const k = (y * w + x) * 4; return d[k] + d[k + 1] + d[k + 2]; };
  const bg = [corner(1, 1), corner(w - 2, 1), corner(1, h - 2), corner(w - 2, h - 2)].sort((a, b) => a - b)[2];
  const isBg = (x, y) => Math.abs(corner(x, y) - bg) < 60;
  const rowEmpty = (y, x0, x1) => { let n = 0; for (let x = x0; x < x1; x++) if (!isBg(x, y) && ++n > (x1 - x0) * 0.015) return false; return true; };
  const colEmpty = (x, y0, y1) => { let n = 0; for (let y = y0; y < y1; y++) if (!isBg(x, y) && ++n > (y1 - y0) * 0.015) return false; return true; };
  const bands = (len, empty, minSize) => {
    const out = []; let start = -1;
    for (let i = 0; i <= len; i++) {
      const e = i === len || empty(i);
      if (!e && start < 0) start = i;
      if (e && start >= 0) { if (i - start >= minSize) out.push([start, i]); start = -1; }
    }
    return out;
  };
  const panels = [];
  for (const [y0, y1] of bands(h, (y) => rowEmpty(y, 0, w), h * 0.06)) {
    const cols = bands(w, (x) => colEmpty(x, y0, y1), w * 0.08);
    for (const [x0, x1] of cols.length ? cols : [[0, w]]) {
      // A second pass inside tall cells catches stacked panels within a column.
      const sub = bands(y1 - y0, (yy) => rowEmpty(y0 + yy, x0, x1), h * 0.06);
      for (const [a, b] of sub.length > 1 ? sub : [[0, y1 - y0]]) panels.push({ x: x0 / w, y: (y0 + a) / h, w: (x1 - x0) / w, h: (b - a) / h, row: y0 + a });
    }
  }
  // Reading order: top to bottom; within a row, right to left for manga.
  const rtl = dir() === "rtl";
  panels.sort((p, q) => (Math.abs(p.row - q.row) < h * 0.05 ? (rtl ? q.x - p.x : p.x - q.x) : p.row - q.row));
  const result = panels.length > 1 ? panels : [{ x: 0, y: 0, w: 1, h: 1 }];
  panelCache.set(key, result);
  return result;
}

function showPanel() {
  const img = $("#r-pages img"); const st = $("#r-stage");
  if (!img || !R.panels?.length) return;
  const p = R.panels[clamp(R.pi, 0, R.panels.length - 1)];
  img.style.transformOrigin = "0 0";
  img.style.transition = "transform .35s cubic-bezier(.2,.7,.2,1)";
  img.style.transform = "";
  const ir = img.getBoundingClientRect(), sr = st.getBoundingClientRect();
  const pw = p.w * ir.width, ph = p.h * ir.height;
  const s = Math.min((sr.width * 0.96) / pw, (sr.height * 0.92) / ph, 4);
  const cx = (p.x + p.w / 2) * ir.width, cy = (p.y + p.h / 2) * ir.height;
  const tx = sr.left + sr.width / 2 - ir.left - cx * s, ty = sr.top + sr.height / 2 - ir.top - cy * s;
  img.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  $("#r-count").textContent = `${R.i + 1} / ${R.item.pages} · panel ${R.pi + 1}/${R.panels.length}`;
}

async function guidePage(fromEnd = false) {
  const img = $("#r-pages img"); if (!img) return;
  if (!img.complete) await new Promise((r) => img.addEventListener("load", r, { once: true }));
  try { R.panels = await detectPanels(img.currentSrc || img.src, R.item.id + ":" + R.i); }
  catch { R.guided = false; $("#r-guided")?.setAttribute("aria-pressed", "false"); toast("Guided view needs pages the browser can inspect, like your own files. This page is from another site."); return; }
  R.pi = fromEnd ? R.panels.length - 1 : 0;
  showPanel();
}

function toggleGuided(force) {
  R.guided = force ?? !R.guided;
  $("#r-guided")?.setAttribute("aria-pressed", String(R.guided));
  if (R.guided && mode() !== "single") { settings.manga.mode = "single"; saveSettings(); applyLayout(); }
  if (R.guided) { toast("Guided view: tap or press → to go panel by panel. G turns it off."); guidePage(); }
  else { const img = $("#r-pages img"); if (img) img.style.transform = ""; onPage(); }
}

// ---------- colour modes ----------
function filterCss() {
  const m = settings.manga;
  const mode = { invert: "invert(1) hue-rotate(180deg)", gray: "grayscale(1) contrast(1.08)", paper: "sepia(.35) contrast(.95)" }[m.color] || "";
  return `${m.enhance ? "url(#r-sharpen) contrast(1.04)" : ""} brightness(${m.brightness}%) sepia(${m.warmth}%) ${mode}`.trim();
}

// ---------- magnifier ----------
function toggleMagnifier(force) {
  R.mag = force ?? !R.mag;
  $("#r-mag").setAttribute("aria-pressed", String(R.mag));
  $("#r-loupe").hidden = true;
  $("#r-stage").style.cursor = R.mag ? "crosshair" : "";
  toast(R.mag ? "Magnifier on. Move over the page; press M to turn it off." : "Magnifier off.");
}
function moveLoupe(e) {
  if (!R.mag) return;
  const img = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.tagName === "IMG" && x.closest("#r-pages"));
  const loupe = $("#r-loupe");
  if (!img) { loupe.hidden = true; return; }
  const r = img.getBoundingClientRect(), st = $("#r-stage").getBoundingClientRect();
  const Z = 2.6, size = 220;
  loupe.hidden = false;
  loupe.style.left = e.clientX - st.left - size / 2 + "px";
  loupe.style.top = e.clientY - st.top - size / 2 + "px";
  loupe.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  loupe.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
  loupe.style.backgroundPosition = `${-(e.clientX - r.left) * Z + size / 2}px ${-(e.clientY - r.top) * Z + size / 2}px`;
  loupe.style.filter = filterCss();
}

// ---------- auto-scroll (long strip) ----------
function setAuto(v) {
  R.auto = clamp(v, 0, 10);
  $("#r-auto-v").textContent = R.auto ? `Auto ${R.auto}` : "Auto off";
  cancelAnimationFrame(R.autoRaf);
  if (!R.auto) return;
  let last = performance.now();
  const step = (t) => { const st = $("#r-stage"); if (!st || el().hidden) return; st.scrollTop += ((t - last) / 1000) * R.auto * 40; last = t; R.autoRaf = requestAnimationFrame(step); };
  R.autoRaf = requestAnimationFrame(step);
}

// ---------- wiring ----------
function setPref(k, v) {
  if ((k === "dir" || k === "mode") && settings.manga.seriesMemory !== false) {
    R.sp = { ...R.sp, [k]: v };
    const sk = R.sk, sp = R.sp;
    kvGet("seriesPrefs", {}).then((all) => kvSet("seriesPrefs", { ...all, [sk]: sp }));
    return applyLayout();
  }
  if (k === "dir" && R.item.dir && R.item.dir !== "scroll") { R.item.dir = v; import("../store.js").then((s) => s.saveItem(R.item)); }
  else if (k === "mode" && R.item.dir === "scroll" && v !== "scroll") { R.item.dir = null; settings.manga.mode = v; saveSettings(); }
  else { settings.manga[k] = v; saveSettings(); }
  applyLayout();
}

function wire() {
  $("#r-close").onclick = () => closeManga();
  $("#r-zone-l").onclick = leftAction;
  $("#r-zone-r").onclick = rightAction;
  $("#r-slider").oninput = (e) => jump(Number(e.target.value) - 1);
  $("#r-bm").onclick = toggleBookmark;
  $("#r-thumbs-btn").onclick = showThumbs;
  $("#r-full").onclick = toggleFull;
  $("#r-zoom").onclick = () => (R.zoom > 1 ? resetZoom() : zoomAt(2));
  $("#r-set-btn").onclick = () => { const p = $("#r-panel"); p.hidden = !p.hidden; $("#r-set-btn").setAttribute("aria-expanded", String(!p.hidden)); };
  $("#r-panel").addEventListener("click", (e) => { const b = e.target.closest("[data-k] button"); if (b) setPref(b.parentElement.dataset.k, b.dataset.v); });
  $("#r-enhance").onchange = (e) => { settings.manga.enhance = e.target.checked; saveSettings(); applyLayout(); };
  $("#r-invert").onchange = (e) => { settings.manga.invertTaps = e.target.checked; saveSettings(); };
  $("#r-series").onchange = (e) => {
    settings.manga.seriesMemory = e.target.checked; saveSettings();
    if (!e.target.checked) { const sk = R.sk; R.sp = {}; kvGet("seriesPrefs", {}).then((all) => { const rest = { ...all }; Reflect.deleteProperty(rest, sk); kvSet("seriesPrefs", rest); }); applyLayout(); }
  };
  $("#r-zones").onclick = (e) => { const b = e.target.closest("[data-z]"); if (!b) return; settings.manga.zones = b.dataset.z; saveSettings(); applyLayout(); };
  $("#r-nextvol").onclick = () => openVolume(nextVolume(), "next");
  $("#r-offset").onchange = (e) => { settings.manga.offset = e.target.checked; saveSettings(); applyLayout(); };
  $("#r-gap").onchange = (e) => { settings.manga.gap = e.target.checked; saveSettings(); applyLayout(); };
  $("#r-lightbg").onchange = (e) => { settings.manga.lightBg = e.target.checked; saveSettings(); applyLayout(); };
  $("#r-trim").onchange = (e) => { settings.manga.trim = e.target.checked; saveSettings(); applyLayout(); };
  $("#r-bri").oninput = (e) => { settings.manga.brightness = Number(e.target.value); saveSettings(); $("#r-pages").style.filter = filterCss(); $("#r-bri-v").textContent = settings.manga.brightness + "%"; };
  $("#r-warm").oninput = (e) => { settings.manga.warmth = Number(e.target.value); saveSettings(); $("#r-pages").style.filter = filterCss(); $("#r-warm-v").textContent = settings.manga.warmth ? settings.manga.warmth + "%" : "off"; };
  $("#r-color").onclick = (e) => {
    const b = e.target.closest("[data-c]"); if (!b) return;
    settings.manga.color = b.dataset.c; saveSettings();
    $$("#r-color button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("#r-pages").style.filter = filterCss();
  };
  $("#r-mag").onclick = () => toggleMagnifier();
  $("#r-anim").onclick = (e) => { const b = e.target.closest("[data-a]"); if (!b) return; settings.manga.anim = b.dataset.a; saveSettings(); $$("#r-anim button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); };
  $("#r-stage").addEventListener("pointermove", moveLoupe);
  $("#r-stage").addEventListener("pointerleave", () => { if (R.mag) $("#r-loupe").hidden = true; });
  $("#r-cover").onclick = useAsCover;
  $("#r-guided").onclick = () => toggleGuided();
  $("#r-focus").onclick = async (e) => { const x = e.target.closest("[data-min]"); if (x) (await import("../focus.js")).startFocus(Number(x.dataset.min)); };
  $("#r-auto-up").onclick = () => setAuto(R.auto + 1);
  $("#r-auto-down").onclick = () => setAuto(R.auto - 1);

  const stage = $("#r-stage");
  stage.addEventListener("click", (e) => {
    if (e.target.closest(".r-zone") || R.dragged) return;
    el().classList.toggle("chrome-off");
    $("#r-panel").hidden = true;
  });
  stage.addEventListener("dblclick", (e) => { if (mode() === "scroll") return; e.preventDefault(); R.zoom > 1 ? resetZoom() : zoomAt(2.2, e.clientX, e.clientY); });
  stage.addEventListener("wheel", (e) => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(R.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY); }
  }, { passive: false });
  // drag to pan when zoomed; swipe to turn when not
  let start = null;
  stage.addEventListener("pointerdown", (e) => { start = { x: e.clientX, y: e.clientY, tx: R.tx, ty: R.ty, t: Date.now() }; R.dragged = false; if (R.zoom > 1) stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => {
    if (!start || R.zoom <= 1) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) R.dragged = true;
    R.tx = start.tx + dx; R.ty = start.ty + dy; applyZoom();
  });
  stage.addEventListener("pointerup", (e) => {
    if (start && R.zoom <= 1 && mode() !== "scroll" && e.pointerType !== "mouse") {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - start.t < 600) { R.dragged = true; dx > 0 ? leftAction() : rightAction(); }
    }
    start = null;
    setTimeout(() => (R.dragged = false), 0);
  });
}

function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else el().requestFullscreen?.().catch(() => toast("Full screen isn't available here."));
}

export function closeManga(silent = false) {
  if (!R.item) return;
  R.timer?.stop(); R.io?.disconnect(); R.lazy?.disconnect(); setAuto(0);
  R.wake?.release?.().catch(() => {}); R.wake = null;
  const r = el(); r.hidden = true; r.innerHTML = "";
  document.body.style.overflow = "";
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  R.item = null;
  if (!silent) import("../main.js").then((m) => { if (!location.hash || /^#(home|library|item|series)/.test(location.hash)) m.refresh(); });
}

document.addEventListener("keydown", (e) => {
  if (el().hidden || !R.item || e.target.matches?.("input[type=text], input[type=search], textarea")) return;
  const k = e.key;
  if (k === "Escape") { e.preventDefault(); if (!$("#r-thumbs").hidden) $("#r-thumbs").hidden = true; else if (!$("#r-panel").hidden) $("#r-panel").hidden = true; else if (R.zoom > 1) resetZoom(); else closeManga(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (k === "ArrowLeft") { e.preventDefault(); keyLeft(); }
  else if (k === "ArrowRight") { e.preventDefault(); keyRight(); }
  else if (k === "AudioVolumeDown" || k === "MediaTrackNext" || k === "MediaFastForward") { e.preventDefault(); go(1); }
  else if (k === "AudioVolumeUp" || k === "MediaTrackPrevious" || k === "MediaRewind") { e.preventDefault(); go(-1); }
  else if (k === "]") openVolume(nextVolume(), "next");
  else if (k === "[") openVolume(prevVolume(), "prev");
  else if ((k === " " || k === "PageDown") && mode() !== "scroll") { e.preventDefault(); go(e.shiftKey ? -1 : 1); }
  else if (k === "PageUp" && mode() !== "scroll") { e.preventDefault(); go(-1); }
  else if (k === "Home") { e.preventDefault(); jump(0); }
  else if (k === "End") { e.preventDefault(); jump(R.item.pages - 1); }
  else if (k === "t" || k === "T") showThumbs();
  else if (k === "b" || k === "B") toggleBookmark();
  else if (k === "f" || k === "F") toggleFull();
  else if (k === "z" || k === "Z") (R.zoom > 1 ? resetZoom() : zoomAt(2));
  else if (k === "s" || k === "S") $("#r-set-btn").click();
  else if (k === "+" || k === "=") zoomAt(R.zoom * 1.25);
  else if (k === "-") zoomAt(R.zoom / 1.25);
  else if (k === "?") import("../main.js").then((m) => m.showShortcuts());
  else if (k === "m" || k === "M") toggleMagnifier();
  else if (k === "g" || k === "G") toggleGuided();
  else if (k === "n" || k === "N") { settings.manga.color = settings.manga.color === "invert" ? "normal" : "invert"; saveSettings(); $("#r-pages").style.filter = filterCss(); toast(settings.manga.color === "invert" ? "Night colours on." : "Night colours off."); }
});
