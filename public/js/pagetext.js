// Page text: real optical character recognition for comics and manga, running on this device (Tesseract, the open-source
// engine behind most OCR). It reads the words in speech bubbles and captions and puts them back over the page as
// selectable text, translates them in place, remembers them so you can search inside comics, and feeds the word list.
// Nothing is uploaded: the engine and its language data are downloaded once and cached by the browser.
import { $, $$, esc, toast, plural } from "./util.js";
import { kvGet, kvSet, pageSrc, lib, getItem } from "./store.js";

const TESS = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
export const LANGS = [["eng", "English", "en"], ["jpn", "Japanese", "ja"], ["jpn_vert", "Japanese (vertical)", "ja"], ["kor", "Korean", "ko"], ["chi_sim", "Chinese (simplified)", "zh-CN"], ["chi_tra", "Chinese (traditional)", "zh-TW"], ["fra", "French", "fr"], ["spa", "Spanish", "es"], ["deu", "German", "de"], ["ita", "Italian", "it"], ["por", "Portuguese", "pt"], ["rus", "Russian", "ru"], ["ind", "Indonesian", "id"], ["vie", "Vietnamese", "vi"], ["tha", "Thai", "th"]];
const TO = [["en", "English"], ["es", "Spanish"], ["fr", "French"], ["de", "German"], ["it", "Italian"], ["pt", "Portuguese"], ["ja", "Japanese"], ["ko", "Korean"], ["zh-CN", "Chinese"], ["ru", "Russian"], ["id", "Indonesian"], ["ar", "Arabic"]];
const PSMS = [["11", "Scattered text (speech bubbles)"], ["6", "One block of text"], ["3", "A full page of text"]];
const CJK = /[　-鿿가-힯＀-￯]/;
const CJK_GAP = /(?<=[　-鿿가-힯＀-￯])\s+(?=[　-鿿가-힯＀-￯])/g;
const langCode = (l) => (LANGS.find((x) => x[0] === l) || [])[2] || "en";

// ---------- the engine ----------
let worker = null, workerLang = "", progressCb = null, chain = Promise.resolve();
function loadEngine() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = TESS; s.crossOrigin = "anonymous";
    s.onload = () => (window.Tesseract ? res(window.Tesseract) : rej(new Error("The text engine didn't start.")));
    s.onerror = () => rej(new Error("The text engine couldn't be downloaded. Check your connection and try again."));
    document.head.append(s);
  });
}
async function getWorker(lang) {
  const T = await loadEngine();
  if (worker && workerLang === lang) return worker;
  if (worker) { await worker.terminate().catch(() => {}); worker = null; }
  worker = await T.createWorker(lang, 1, { logger: (m) => progressCb?.(m) });
  workerLang = lang; return worker;
}
export const resetEngine = async () => { if (worker) { await worker.terminate().catch(() => {}); worker = null; workerLang = ""; } };

// Make the page easier for the engine: a sensible size and stretched contrast.
async function pageCanvas(item, i) {
  const im = new Image(); im.src = await pageSrc(item, i); await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight; let s = Math.min(2.5, Math.max(0.5, 2600 / Math.max(W, H))); if (W * s > 4200) s = 4200 / W;
  const c = document.createElement("canvas"); c.width = Math.round(W * s); c.height = Math.round(H * s);
  const g = c.getContext("2d", { willReadFrequently: true }); g.imageSmoothingQuality = "high"; g.drawImage(im, 0, 0, c.width, c.height);
  let px; try { px = g.getImageData(0, 0, c.width, c.height); } catch { throw new Error("This page comes from another site, which doesn't let the browser read it. Page text works on your own files and on pages saved to this device."); }
  const d = px.data, hist = new Uint32Array(256);
  for (let k = 0; k < d.length; k += 4) { const y = (d[k] * 0.299 + d[k + 1] * 0.587 + d[k + 2] * 0.114) | 0; d[k] = d[k + 1] = d[k + 2] = y; hist[y]++; }
  const n = d.length / 4; let acc = 0, lo = 0, hi = 255; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.02) { lo = v; break; } } acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.02) { hi = v; break; } }
  if (hi - lo > 40) { const k2 = 255 / (hi - lo); for (let k = 0; k < d.length; k += 4) { const y = Math.max(0, Math.min(255, ((d[k] - lo) * k2) | 0)); d[k] = d[k + 1] = d[k + 2] = y; } }
  g.putImageData(px, 0, 0); return c;
}

// ---------- turning recognised lines into speech bubbles ----------
function bubbles(rawLines, W, H, lang) {
  const L = rawLines.map((l) => ({ ...l, w: l.x1 - l.x0, h: l.y1 - l.y0 })), p = L.map((_, i) => i);
  const find = (a) => (p[a] === a ? a : (p[a] = find(p[a])));
  for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
    const A = L[a], B = L[b], pad = 1.1 * Math.max(Math.min(A.w, A.h), Math.min(B.w, B.h));
    if (A.x0 - pad < B.x1 && B.x0 - pad < A.x1 && A.y0 - pad < B.y1 && B.y0 - pad < A.y1) p[find(a)] = find(b);
  }
  const groups = new Map(); L.forEach((l, i) => { const r = find(i); (groups.get(r) || groups.set(r, []).get(r)).push(l); });
  const vertLang = /vert|jpn|chi|kor/.test(lang);
  return [...groups.values()].map((g) => {
    const x0 = Math.min(...g.map((l) => l.x0)), y0 = Math.min(...g.map((l) => l.y0)), x1 = Math.max(...g.map((l) => l.x1)), y1 = Math.max(...g.map((l) => l.y1));
    const vertical = vertLang && g.filter((l) => l.h > l.w * 1.3).length > g.length / 2;
    const med = g.map((l) => Math.min(l.w, l.h)).sort((a, b) => a - b)[g.length >> 1] || 10;
    g.sort(vertical ? (a, b) => b.x0 - a.x0 || a.y0 - b.y0 : (a, b) => (Math.abs(a.y0 - b.y0) > med * 0.6 ? a.y0 - b.y0 : a.x0 - b.x0));
    const t = g.map((l) => l.text).join(CJK.test(g[0].text) ? "" : " ").replace(/\s+/g, " ").replace(CJK_GAP, "").trim();
    return { t, b: [x0 / W, y0 / H, x1 / W, y1 / H], v: vertical, c: Math.round(g.reduce((s, l) => s + l.conf, 0) / g.length) };
  }).filter((b) => b.t.length > 0).sort((a, b) => a.b[1] - b.b[1] || a.b[0] - b.b[0]);
}

async function ocrPage(item, i, lang, psm) {
  const run = async () => {
    const canvas = await pageCanvas(item, i), w = await getWorker(lang);
    await w.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: "1" });
    const linesOf = (data) => (data.lines || (data.blocks || []).flatMap((b) => b.paragraphs || []).flatMap((p) => p.lines || []));
    let { data } = await w.recognize(canvas, {}, { blocks: true }), all = linesOf(data);
    if (psm === "11" && all.length < 4) {
      await w.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
      const extra = linesOf((await w.recognize(canvas, {}, { blocks: true })).data), inside = (l, o) => { const cx = (l.bbox.x0 + l.bbox.x1) / 2, cy = (l.bbox.y0 + l.bbox.y1) / 2; return cx > o.bbox.x0 - 6 && cx < o.bbox.x1 + 6 && cy > o.bbox.y0 - 6 && cy < o.bbox.y1 + 6; };
      all = all.concat(extra.filter((l) => !all.some((o) => inside(l, o))));
    }
    const raw = all.map((l) => ({ text: (l.text || "").trim(), conf: l.confidence ?? 0, x0: l.bbox.x0, y0: l.bbox.y0, x1: l.bbox.x1, y1: l.bbox.y1 }))
      .filter((l) => l.text && l.conf >= 40 && (CJK.test(l.text) ? l.text.length >= 1 : (l.text.match(/[\p{L}\p{N}]/gu) || []).length / l.text.length >= 0.6 && l.text.length >= 2 && (l.conf >= 58 || l.text.length >= 9) && /\p{L}{2,}/u.test(l.text)));
    return { lang, psm, bubbles: bubbles(raw, canvas.width, canvas.height, lang), at: Date.now() };
  };
  const p = chain.then(run, run); chain = p.catch(() => {}); return p;
}

// ---------- the stored text ----------
const store = new Map();
async function book(id) { if (!store.has(id)) store.set(id, (await kvGet("ocr:" + id, null)) || { pages: {} }); return store.get(id); }
const flush = (id) => kvSet("ocr:" + id, store.get(id));
export async function pageResult(id, i) { return (await book(id)).pages[i] || null; }
export async function readPage(item, i, lang, psm, force = false) {
  const b = await book(item.id); if (b.pages[i] && !force) return b.pages[i];
  const r = await ocrPage(item, i, lang, psm); b.pages[i] = r; flush(item.id); return r;
}
export const pageString = (r) => (r?.bubbles || []).map((b) => b.t).join("\n");
export async function volumeText(item) { const b = await book(item.id); return Object.keys(b.pages).map(Number).sort((a, c) => a - c).map((i) => `— Page ${i + 1} —\n${pageString(b.pages[i])}`).join("\n\n"); }

// Search the text of every comic you have read: one volume, or the whole library.
export async function searchComics(q, itemId = null) {
  const needle = q.trim().toLowerCase(); if (needle.length < 2) return [];
  const out = [];
  for (const it of itemId ? [getItem(itemId)].filter(Boolean) : lib.items.filter((i) => i.type === "manga")) {
    const b = await book(it.id), hits = []; let n = 0;
    for (const k of Object.keys(b.pages).map(Number).sort((a, c) => a - c)) for (const bub of b.pages[k].bubbles) {
      const low = bub.t.toLowerCase(); let at = low.indexOf(needle);
      while (at >= 0) { n++; if (hits.length < 6) hits.push({ page: k, before: (at > 40 ? "…" : "") + bub.t.slice(Math.max(0, at - 40), at), match: bub.t.slice(at, at + needle.length), after: bub.t.slice(at + needle.length, at + needle.length + 60) }); at = low.indexOf(needle, at + needle.length); }
    }
    if (n) out.push({ it, n, hits });
  }
  return out.sort((a, c) => c.n - a.n);
}
// Read every comic on this device in one go, for searching. Pages the browser can't inspect are skipped.
export async function indexLibrary({ lang, psm = "11", onProgress, job = { stop: false } } = {}) {
  if (!lang) lang = (await kvGet("pagetextPrefs", {})).lang || "eng";
  const items = lib.items.filter((i) => i.type === "manga" && ["blobs", "server", "pdf", "urls"].includes(i.source?.kind));
  let pages = 0, skipped = 0;
  for (const it of items) {
    const b = await book(it.id);
    for (let i = 0; i < it.pages; i++) {
      if (job.stop) return { pages, skipped, stopped: true };
      if (b.pages[i]) continue;
      onProgress?.({ title: it.title, page: i + 1, of: it.pages, pages });
      try { await readPage(it, i, lang, psm); pages++; } catch { skipped++; break; }
    }
  }
  return { pages, skipped, stopped: false };
}
export async function indexedCount(id) { return Object.keys((await book(id)).pages).length; }
export async function forgetVolume(id) { store.set(id, { pages: {} }); flush(id); }

// ---------- the on-page layer ----------
const PT = { ctx: null, on: false, tr: false, auto: false, lang: "eng", psm: "11", to: "en", batch: null, mo: null };
let prefsLoaded = false;
const savePrefs = () => kvSet("pagetextPrefs", { lang: PT.lang, psm: PT.psm, to: PT.to, auto: PT.auto });
const reader = () => $("#reader");

function fit(el) {
  let lo = 5, hi = 44;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; el.style.fontSize = m + "px"; if (el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1) lo = m; else hi = m - 1; }
  el.style.fontSize = lo + "px";
}
function paintAll() {
  const box = $("#r-pages"); if (!box) return;
  $$(".pt-layer", box).forEach((n) => n.remove());
  reader().classList.toggle("pt-on", PT.on); reader().classList.toggle("pt-tr", PT.on && PT.tr); reader().classList.toggle("pt-sel", PT.on && !PT.tr);
  if (!PT.on) return;
  for (const img of $$("img[data-i]", box)) {
    const i = Number(img.dataset.i), r = store.get(PT.ctx.item.id)?.pages[i]; if (!r || !img.complete || !img.naturalWidth) continue;
    const layer = document.createElement("div"); layer.className = "pt-layer"; layer.dataset.i = i;
    layer.style.cssText = `left:${img.offsetLeft}px;top:${img.offsetTop}px;width:${img.offsetWidth}px;height:${img.offsetHeight}px`;
    for (const b of r.bubbles) {
      const text = PT.tr ? r.tr?.[PT.to]?.[b.t] : b.t; if (PT.tr && !text) continue;
      const d = document.createElement("div"); d.className = "pt-b"; d.textContent = text;
      const pad = PT.tr ? 0.012 : 0; d.style.cssText = `left:${(b.b[0] - pad) * 100}%;top:${(b.b[1] - pad) * 100}%;width:${(b.b[2] - b.b[0] + pad * 2) * 100}%;height:${(b.b[3] - b.b[1] + pad * 2) * 100}%;${b.v && !PT.tr ? "writing-mode:vertical-rl;" : ""}`;
      layer.append(d);
    }
    box.append(layer); $$(".pt-b", layer).forEach(fit);
  }
}
const repaintSoon = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => { paintAll(); fillText(); }, 60); }; })();

async function translatePage(i) {
  const r = store.get(PT.ctx.item.id)?.pages[i]; if (!r) return;
  const from = langCode(r.lang), to = PT.to; if (from === to) return setStatus("That page is already in this language. Pick a different language to translate into.");
  const { translate } = await import("./lookup.js"); r.tr ||= {}; r.tr[to] ||= {};
  const todo = r.bubbles.filter((b) => !r.tr[to][b.t]); let done = 0;
  const work = async () => { while (todo.length && PT.tr) { const b = todo.shift(); try { r.tr[to][b.t] = (await translate(b.t, from, to)).text; done++; paintAll(); } catch (e) { todo.length = 0; setStatus(e.message); } } };
  setStatus(todo.length ? `Translating ${plural(todo.length, "bubble")}…` : ""); await Promise.all([work(), work()]);
  flush(PT.ctx.item.id); if (done) setStatus(`Translated ${plural(done, "bubble")}. Free translation is a guide, not a polished script.`);
}

function setStatus(t) { const s = $("#pt-status"); if (s) s.textContent = t || ""; }
const shown = () => PT.ctx.pages();
async function fillText() {
  const box = $("#pt-text"); if (!box || !PT.ctx) return;
  const b = await book(PT.ctx.item.id), pages = shown(), out = [];
  for (const i of pages) { const r = b.pages[i]; out.push(r ? (r.bubbles.length ? r.bubbles.map((x) => `<p class="pt-line">${esc(PT.tr && r.tr?.[PT.to]?.[x.t] ? r.tr[PT.to][x.t] : x.t)}</p>`).join("") : `<p class="muted">No text found on page ${i + 1}.</p>`) : `<p class="muted">Page ${i + 1} hasn’t been read yet.</p>`); }
  box.innerHTML = out.join("");
  const n = await indexedCount(PT.ctx.item.id); const c = $("#pt-count"); if (c) c.textContent = `${n} of ${PT.ctx.item.pages} pages read`;
}
async function readHere(force = false) {
  const it = PT.ctx.item, pages = shown(); let any = false;
  for (const i of pages) {
    if (!force && (await book(it.id)).pages[i]) continue;
    setStatus(`Reading page ${i + 1}… the first page also downloads the engine and language.`);
    progressCb = (m) => { if (m.status && m.progress != null) setStatus(`Page ${i + 1}: ${m.status} ${Math.round(m.progress * 100)}%`); };
    try { await readPage(it, i, PT.lang, PT.psm, force); any = true; paintAll(); fillText(); } catch (e) { setStatus(e.message); toast(e.message); return; }
  }
  progressCb = null; paintAll(); fillText();
  if (PT.tr) for (const i of pages) await translatePage(i);
  if (PT.auto) readAhead(pages.at(-1));
  if (any || PT.tr) { const found = (await Promise.all(pages.map((i) => pageResult(it.id, i)))).reduce((a, r) => a + (r?.bubbles.length || 0), 0); if (!PT.tr) setStatus(found ? `Found ${plural(found, "bubble")} of text. Switch on “Select text” to copy it from the page.` : "No text found. Try another language or layout, or a sharper scan."); }
}

let speaking = false;
async function speak() {
  const btn = $("#pt-say");
  if (speaking || speechSynthesis.speaking) { speaking = false; speechSynthesis.cancel(); if (btn) btn.textContent = "Read aloud"; return; }
  if (!("speechSynthesis" in window)) return toast("This browser can't read text aloud.");
  const it = PT.ctx.item, pages = shown(), b = await book(it.id), parts = [];
  for (const i of pages) { const r = b.pages[i]; if (!r) continue; for (const x of r.bubbles) parts.push({ t: (PT.tr && r.tr?.[PT.to]?.[x.t]) || x.t, i, orig: x.t, lang: PT.tr && r.tr?.[PT.to]?.[x.t] ? PT.to : langCode(r.lang) }); }
  if (!parts.length) return setStatus("Read the page first, then it can be read aloud.");
  speaking = true; btn.textContent = "Stop reading aloud";
  const finish = () => { speaking = false; if ($("#pt-say")) $("#pt-say").textContent = "Read aloud"; $$(".pt-b.pt-now").forEach((n) => n.classList.remove("pt-now")); };
  parts.forEach((p, k) => {
    const u = new SpeechSynthesisUtterance(p.t); u.lang = p.lang; u.rate = 0.95;
    u.onstart = () => { $$(".pt-b.pt-now").forEach((n) => n.classList.remove("pt-now")); const lay = $(`.pt-layer[data-i="${p.i}"]`); const idx = store.get(it.id).pages[p.i].bubbles.findIndex((x) => x.t === p.orig); lay?.children[idx]?.classList.add("pt-now"); };
    if (k === parts.length - 1) { u.onend = finish; u.onerror = finish; }
    speechSynthesis.speak(u);
  });
}

let ahead = 0;
async function readAhead(from) {
  const it = PT.ctx?.item; if (!it || PT.batch) return; const my = ++ahead;
  for (let i = from + 1; i <= Math.min(it.pages - 1, from + 3); i++) {
    if (my !== ahead || !PT.ctx || PT.ctx.item.id !== it.id || PT.batch) return;
    if ((await book(it.id)).pages[i]) continue;
    try { await readPage(it, i, PT.lang, PT.psm); fillText(); } catch { return; }
  }
}

async function readVolume() {
  if (PT.batch) { PT.batch.stop = true; return; }
  const it = PT.ctx.item, job = (PT.batch = { stop: false }), btn = $("#pt-vol");
  let done = 0; const bk = await book(it.id), todo = Array.from({ length: it.pages }, (_, i) => i).filter((i) => !bk.pages[i]);
  if (!todo.length) { PT.batch = null; return setStatus("Every page of this volume has been read already."); }
  btn.textContent = "Stop reading";
  for (const i of todo) {
    if (job.stop || !PT.ctx || PT.ctx.item.id !== it.id) break;
    progressCb = (m) => { if (m.status === "recognizing text" && m.progress != null) setStatus(`Reading page ${i + 1} of ${it.pages} (${done + 1} of ${todo.length}) · ${Math.round(m.progress * 100)}%`); };
    try { await readPage(it, i, PT.lang, PT.psm); done++; if (shown().includes(i)) { paintAll(); fillText(); } } catch (e) { setStatus(e.message); break; }
  }
  progressCb = null; PT.batch = null; if ($("#pt-vol")) $("#pt-vol").textContent = "Read the whole volume";
  setStatus(job.stop ? `Stopped after ${plural(done, "page")}. They’re saved, so you can carry on later.` : `Read ${plural(done, "page")}. This volume is now searchable.`); fillText();
}

// ---------- the panel ----------
function openPanel() {
  let p = $("#pt-panel");
  if (!p) {
    p = document.createElement("div"); p.id = "pt-panel"; p.className = "r-panel pt-panel"; p.hidden = true;
    p.innerHTML = `<div class="pt-head"><h3 style="margin:0">Page text</h3><button class="icon-btn" type="button" id="pt-x" aria-label="Close page text">✕</button></div>
      <p class="r-keys" style="margin:0 0 8px">Reads the words in speech bubbles on this device. Nothing is uploaded.</p>
      <div class="r-set"><h4>Language of the page</h4><select class="field" id="pt-lang">${LANGS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
      <div class="r-set"><h4>Layout</h4><select class="field" id="pt-psm">${PSMS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
      <div class="r-set"><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-accent btn-sm" type="button" id="pt-read">Read this page</button><button class="btn btn-sm" type="button" id="pt-vol">Read the whole volume</button><button class="btn btn-sm" type="button" id="pt-say">Read aloud</button></div><p class="r-keys" id="pt-count" style="margin:6px 0 0"></p></div>
      <div class="r-set"><label class="check"><input type="checkbox" id="pt-on"> Select text on the page (turning pages then uses keys or swipes)</label>
        <label class="check"><input type="checkbox" id="pt-tr"> Show a translation on the page</label>
        <select class="field" id="pt-to" aria-label="Translate into">${TO.map(([v, l]) => `<option value="${v}">Translate into ${l}</option>`).join("")}</select>
        <label class="check"><input type="checkbox" id="pt-auto"> Read each page as I turn to it</label></div>
      <p class="status" id="pt-status" aria-live="polite" style="margin:0"></p>
      <div class="pt-selbar" id="pt-sel" hidden><span id="pt-selt"></span><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn btn-sm" type="button" id="pt-def">Look up</button><button class="btn btn-sm" type="button" id="pt-trans">Translate</button><button class="btn btn-sm" type="button" id="pt-save">Save to vocabulary</button></div><p class="r-keys" id="pt-defout" style="margin:6px 0 0"></p></div>
      <div class="r-set"><h4>Text on this page</h4><div class="pt-text" id="pt-text"></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn btn-sm" type="button" id="pt-copy">Copy</button><button class="btn btn-sm" type="button" id="pt-dl">Save volume text</button><button class="btn btn-sm" type="button" id="pt-forget">Forget this volume’s text</button></div></div>
      <div class="r-set"><h4>Search this volume</h4><input class="field" type="search" id="pt-q" placeholder="A word from a bubble" autocomplete="off"><div id="pt-hits" class="pt-hits"></div></div>`;
    reader().append(p); wirePanel(p);
  }
  $("#r-panel") && ($("#r-panel").hidden = true);
  p.hidden = false; $("#pt-lang").value = PT.lang; $("#pt-psm").value = PT.psm; $("#pt-to").value = PT.to; $("#pt-auto").checked = PT.auto; $("#pt-on").checked = PT.on; $("#pt-tr").checked = PT.tr;
  fillText(); startWatch();
}
function wirePanel(p) {
  $("#pt-x").onclick = () => (p.hidden = true);
  $("#pt-lang").onchange = (e) => { PT.lang = e.target.value; savePrefs(); };
  $("#pt-psm").onchange = (e) => { PT.psm = e.target.value; savePrefs(); };
  $("#pt-to").onchange = (e) => { PT.to = e.target.value; savePrefs(); if (PT.tr) { paintAll(); for (const i of shown()) translatePage(i); } fillText(); };
  $("#pt-auto").onchange = (e) => { PT.auto = e.target.checked; savePrefs(); if (PT.auto) readHere(); };
  $("#pt-read").onclick = () => readHere(true);
  $("#pt-vol").onclick = readVolume;
  $("#pt-say").onclick = speak;
  $("#pt-on").onchange = (e) => { PT.on = e.target.checked; if (!PT.on) { PT.tr = false; $("#pt-tr").checked = false; } paintAll(); if (PT.on && !shown().every((i) => store.get(PT.ctx.item.id)?.pages[i])) readHere(); };
  $("#pt-tr").onchange = async (e) => { PT.tr = e.target.checked; if (PT.tr) { PT.on = true; $("#pt-on").checked = true; await readHere(); for (const i of shown()) await translatePage(i); } paintAll(); fillText(); };
  $("#pt-copy").onclick = async () => { const t = $("#pt-text").innerText.trim(); try { await navigator.clipboard.writeText(t); toast("Copied the text on this page."); } catch { toast("Couldn't copy. Select the text and copy it."); } };
  $("#pt-dl").onclick = async () => { const t = await volumeText(PT.ctx.item); if (!t) return toast("Read some pages first."); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/plain" })); a.download = PT.ctx.item.title.replace(/[^\w.-]+/g, "_") + "-text.txt"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  $("#pt-forget").onclick = async () => { await forgetVolume(PT.ctx.item.id); paintAll(); fillText(); setStatus("This volume’s text was removed from this device."); };
  let qT; $("#pt-q").oninput = (e) => { clearTimeout(qT); qT = setTimeout(async () => { const q = e.target.value, out = $("#pt-hits"); if (q.trim().length < 2) { out.innerHTML = ""; return; } const r = (await searchComics(q, PT.ctx.item.id))[0]; out.innerHTML = r ? r.hits.map((h) => `<button class="ft-hit" type="button" data-p="${h.page}">p. ${h.page + 1} · ${esc(h.before)}<mark>${esc(h.match)}</mark>${esc(h.after)}</button>`).join("") + (r.n > r.hits.length ? `<p class="r-keys">${r.n - r.hits.length} more</p>` : "") : `<p class="r-keys">Nothing found in the pages read so far.</p>`; }, 220); };
  $("#pt-hits").onclick = (e) => { const b = e.target.closest("[data-p]"); if (b) PT.ctx.jump(Number(b.dataset.p)); };
  const selText = () => { const s = getSelection(); if (!s || s.isCollapsed || !s.anchorNode) return ""; const n = s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode; return n?.closest?.(".pt-b, .pt-text") ? s.toString().replace(/\s+/g, " ").trim() : ""; };
  document.addEventListener("selectionchange", () => { if (p.hidden) return; const t = selText(), bar = $("#pt-sel"); if (!t) return; bar.hidden = false; $("#pt-selt").textContent = "“" + (t.length > 120 ? t.slice(0, 120) + "…" : t) + "”"; bar.dataset.t = t; });
  $("#pt-def").onclick = async () => { const t = $("#pt-sel").dataset.t || ""; const w = t.split(/\s+/)[0]; try { const { define } = await import("./lookup.js"); const d = await define(w, langCode(PT.lang).split("-")[0]); $("#pt-defout").innerHTML = `<b>${esc(d.word)}</b> — ${esc(d.senses[0].pos || "")}: ${esc(d.senses[0].defs[0] || "")}`; $("#pt-sel").dataset.def = d.senses[0].defs[0] || ""; $("#pt-sel").dataset.pos = d.senses[0].pos || ""; $("#pt-sel").dataset.w = d.word; } catch (e) { $("#pt-defout").textContent = e.message; } };
  $("#pt-trans").onclick = async () => { const t = $("#pt-sel").dataset.t || ""; try { const { translate } = await import("./lookup.js"); $("#pt-defout").textContent = (await translate(t, langCode(PT.lang), PT.to)).text; } catch (e) { $("#pt-defout").textContent = e.message; } };
  $("#pt-save").onclick = async () => { const s = $("#pt-sel"), t = s.dataset.t || ""; if (!t) return; try { const { saveWord } = await import("./lookup.js"); await saveWord({ word: s.dataset.w || t, def: s.dataset.def || $("#pt-defout").textContent || "", pos: s.dataset.pos || "", context: t, itemId: PT.ctx.item.id, book: PT.ctx.item.title }); toast("Saved to your vocabulary."); } catch (e) { toast(e.message); } };
}

function startWatch() {
  const box = $("#r-pages"); if (!box) return; PT.mo?.disconnect();
  PT.mo = new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) if (n.tagName === "IMG") n.addEventListener("load", repaintSoon, { once: true });
    if (muts.some((m) => [...m.addedNodes].some((n) => n.tagName === "IMG"))) { repaintSoon(); if (PT.auto) setTimeout(() => PT.ctx && readHere(), 250); }
  });
  PT.mo.observe(box, { childList: true });
}
addEventListener("resize", () => { if (PT.on) repaintSoon(); });

export async function togglePageText(ctx) {
  if (!prefsLoaded) { Object.assign(PT, await kvGet("pagetextPrefs", {})); prefsLoaded = true; }
  if (PT.ctx?.item.id !== ctx.item.id) { PT.on = false; PT.tr = false; PT.batch && (PT.batch.stop = true); }
  PT.ctx = ctx; const p = $("#pt-panel");
  if (p && !p.hidden) { p.hidden = true; return; }
  if (p && p.dataset.item !== ctx.item.id) { p.remove(); }
  openPanel(); $("#pt-panel").dataset.item = ctx.item.id;
}
export function closePageText() { PT.mo?.disconnect(); if (PT.batch) PT.batch.stop = true; PT.on = false; PT.tr = false; PT.ctx = null; $("#pt-panel")?.remove(); reader()?.classList.remove("pt-on", "pt-tr", "pt-sel"); }
export const pageTextOpen = () => { const p = $("#pt-panel"); return !!p && !p.hidden; };
