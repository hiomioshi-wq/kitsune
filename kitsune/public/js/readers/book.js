// Book reader for Gutenberg texts, EPUBs and plain text files.
import { $, $$, esc, icon, toast, clamp, api, debounce, fmtMinutes, contentNotes, coverTint } from "../util.js";
import { settings, saveSettings, getProgress, setProgress, logStat, sessionTimer, getMarks, setMarks, saveItem, kvGet, kvSet, coverSrc } from "../store.js";
import { openEpub, epubChapters } from "../epub.js";
import { SOUNDSCAPES, playSoundscape, stopSoundscape, setSoundscapeVolume, currentSoundscape } from "../ambience.js";

const FONTS = { literata: '"Literata", Georgia, serif', mincho: '"Shippori Mincho", "Hiragino Mincho ProN", serif', atkinson: '"Atkinson Hyperlegible", system-ui, sans-serif', lexend: '"Lexend", system-ui, sans-serif', dyslexic: '"OpenDyslexic", "Atkinson Hyperlegible", sans-serif', sans: 'var(--f-body)', custom: '"KitsuneUser", "Literata", Georgia, serif' };
let userFontLoaded = null;
async function loadUserFont() {
  const f = await kvGet("userFont", null);
  if (!f?.blob) return null;
  if (userFontLoaded === f.name) return f.name;
  try { const face = new FontFace("KitsuneUser", await f.blob.arrayBuffer()); await face.load(); document.fonts.add(face); userFontLoaded = f.name; return f.name; }
  catch { return null; }
}
// One-tap reading looks: each sets theme, typeface, size, spacing and line width together.
const LOOKS = [
  ["classic", "Classic", "Paper · Literata", { theme: "paper", font: "literata", size: 19, lineHeight: 1.7, width: 36, align: "left" }],
  ["evening", "Evening", "Sepia · roomy", { theme: "sepia", font: "literata", size: 20, lineHeight: 1.85, width: 34, align: "left" }],
  ["night", "Night owl", "Dark · soft", { theme: "night", font: "literata", size: 19, lineHeight: 1.8, width: 36, align: "left" }],
  ["large", "Large print", "Hyperlegible", { theme: "paper", font: "atkinson", size: 24, lineHeight: 1.75, width: 32, align: "left" }],
  ["focus", "Focus", "Ink · Lexend", { theme: "ink", font: "lexend", size: 18, lineHeight: 1.95, width: 30, align: "left" }],
];
const ambVol = () => (settings.book.ambVol ?? 40) / 100;
const THEMES = { paper: ["#f7f4ec", "#2a2730", "Paper"], sepia: ["#f1e5cc", "#4a3a26", "Sepia"], matcha: ["#e8eedf", "#26301f", "Matcha"], night: ["#171a2e", "#d8d6e6", "Night"], ink: ["#000", "#c9c9c9", "Ink"] };
const WPM = 250;

const B = { item: null, blocks: [], words: [], totalWords: 0, toc: [], pos: 0, lastLogged: 0, timer: null, marks: [], hls: [], urls: [], speaking: false, panel: null, page: 0 };
const el = () => $("#book");

export async function openBook(item, opts = {}) {
  closeBook(true);
  B.item = item; B.xray = null; B.xrayTexts = null;
  B.timer = sessionTimer(item.id);
  B.marks = await getMarks("bookmarks", item.id);
  B.hls = await getMarks("highlights", item.id);
  B.speed = { words: 0, secs: 0, ...(await kvGet("readingSpeed", {})) };
  B.speedT = Date.now(); B.autoOn = false;
  B.userFont = await loadUserFont();
  // Settings remembered for just this book are layered over your usual ones while it's open.
  B.globalBook = null;
  const own = (await kvGet("bookPrefs", {}))[item.id];
  if (own) { B.globalBook = { ...settings.book }; Object.assign(settings.book, own); }
  const r = el();
  r.innerHTML = shell();
  r.hidden = false;
  document.body.style.overflow = "hidden";
  applyStyle();
  wire();
  // The reader takes its accent from the book's cover: progress, headings and the glow at the top.
  coverTint(coverSrc(item)).then((t) => { if (t && B.item === item) { r.style.setProperty("--bk-tint", t); r.classList.add("tinted"); } }).catch(() => {});
  $("#b-close").focus();
  $("#b-text").innerHTML = `<p class="r-msg">Opening ${esc(item.title)}…</p>`;
  try {
    await load();
  } catch (e) { if (B.item === item) $("#b-text").innerHTML = `<p class="r-msg">${esc(e.message)}</p>`; return; }
  if (B.item !== item) return;
  try { await endCard(); } catch { /* the end card is optional */ }
  const saved = await getProgress(item.id);
  if (B.item !== item) return;
  const start = opts.para ?? opts.from ?? (saved && saved.pos < B.blocks.length - 1 ? saved.pos : 0);
  B.pos = start; B.lastLogged = start;
  B.sess = { t: Date.now(), from: start };
  requestAnimationFrame(() => { if (B.item !== item) return; layout(); goTo(start, false); renderHighlights(); syncBold(); });
  // Back after a few days away: a short "previously in…" to get you back into the story.
  const away = saved?.updated ? (Date.now() / 1000 - saved.updated) / 86400 : 0;
  if (away >= 3 && start > 3 && opts.para == null && opts.from == null && !opts.find && settings.book.recap !== false) setTimeout(() => { if (B.item === item) showRecap(away); }, 450);
  if (opts.find) setTimeout(() => findInBook(opts.find), 120);
  if (settings.book.ambience && !currentSoundscape()) playSoundscape(settings.book.ambience, ambVol());
  syncFx();
  if (start === 0 && opts.para == null && opts.from == null && !opts.find) await contentGate(item);
}

// Before a first read: show the author's content notes, if the text has them.
async function contentGate(item) {
  if (settings.book.contentNotes === false) return;
  const notes = contentNotes(B.blocks.slice(0, 10).map((b) => b.textContent).join("\n"));
  if (!notes) return;
  const seen = await kvGet("contentNotesSeen", []);
  if (seen.includes(item.id) || B.item !== item) return;
  const gate = document.createElement("div");
  gate.className = "cn-gate";
  gate.setAttribute("role", "dialog"); gate.setAttribute("aria-modal", "true"); gate.setAttribute("aria-labelledby", "cn-h");
  gate.innerHTML = `<div class="cn-box"><span class="cn-k">Content notes</span><h2 id="cn-h">Before you start “${esc(item.title)}”</h2>
    <p>${esc(notes)}</p>
    <div class="cn-act"><button class="btn btn-accent" type="button" id="cn-go">Start reading</button><button class="btn btn-ghost" type="button" id="cn-no">Not now</button></div>
    <label class="check" style="font-size:13px"><input type="checkbox" id="cn-off"> Don't show content notes before stories</label></div>`;
  el().append(gate);
  $("#cn-go", gate).focus();
  const off = () => { if ($("#cn-off", gate).checked) { settings.book.contentNotes = false; saveSettings(); } };
  $("#cn-go", gate).onclick = async () => { off(); gate.remove(); kvSet("contentNotesSeen", [...(await kvGet("contentNotesSeen", [])), item.id].slice(-500)); $("#b-scroll")?.focus(); };
  $("#cn-no", gate).onclick = () => { off(); closeBook(); };
}

function shell() {
  const it = B.item;
  return `
  <div class="b-bar">
    <button class="icon-btn" id="b-close" aria-label="Close book" title="Close book">${icon("back")}</button>
    <div class="r-title"><strong>${esc(it.title)}</strong><span>${esc(it.author || "")}</span></div>
    <span class="r-count" id="b-pct">0%</span>
    <button class="icon-btn" id="b-speak" aria-label="Read aloud (R)" title="Read aloud (R)">${icon("speak")}</button>
    <button class="icon-btn sm-hide" id="b-auto" aria-label="Auto-scroll (A)" title="Auto-scroll at your reading speed (A)">${icon("play")}</button>
    <button class="icon-btn" id="b-bm" aria-label="Bookmark (B)" title="Bookmark (B)">${icon("bookmark")}</button>
    <button class="icon-btn" data-panel="toc" aria-label="Contents (T)" title="Contents (T)">${icon("toc")}</button>
    <button class="icon-btn sm-hide" data-panel="search" aria-label="Search in book (/)" title="Search (/)">${icon("search")}</button>
    <button class="icon-btn sm-hide" data-panel="notes" aria-label="Bookmarks and highlights" title="Notes">${icon("highlight")}</button>
    <button class="icon-btn sm-hide" data-panel="lookup" aria-label="Look up a word (D)" title="Dictionary & Wikipedia (D)">${icon("globe")}</button>
    <button class="icon-btn sm-hide" data-panel="xray" aria-label="X-Ray: people and places (X)" title="X-Ray: people and places (X)">${icon("xray")}</button>
    <button class="icon-btn sm-only" id="b-more" aria-label="More" title="More">${icon("more")}</button>
    <button class="icon-btn" data-panel="style" aria-label="Text and theme" title="Text and theme">${icon("type")}</button>
  </div>
  <div class="b-prog"><i id="b-bar"></i></div>
  <div class="b-body">
    <div class="amb-fx" id="b-fx" aria-hidden="true"></div>
    <div class="b-scroll" id="b-scroll"><article class="b-text" id="b-text" lang="${esc(it.lang || "")}"></article></div>
    <div class="b-pagezones"><button type="button" id="b-prev" aria-label="Previous page"></button><button type="button" id="b-next" aria-label="Next page"></button></div>
    <aside class="b-side" id="b-side" hidden></aside>
    <div class="b-ruler" id="b-ruler" hidden></div>
  </div>
  <div class="b-foot"><span id="b-chapter"></span><input type="range" id="b-scrub" min="0" max="1000" value="0" aria-label="Position in book"><span id="b-left"></span></div>`;
}

// ---------- loading ----------
async function load() {
  const it = B.item, s = it.source;
  let html = "";
  const fromEpub = async (blob, endNote) => {
    const ep = await openEpub(blob);
    const chapters = await epubChapters(ep, async (path, make) => { const u = URL.createObjectURL(await make()); B.urls.push(u); return u; });
    B.epubToc = ep.toc;
    return chapters.map((c) => `<section data-ch="${c.i}" data-href="${esc(c.href)}">${c.html}</section>`).join("") + `<p class="end">${endNote}</p>`;
  };
  if (s.kind === "gutenberg" && s.illustrated) {
    $("#b-text").innerHTML = `<p class="r-msg">Downloading the illustrated edition…</p>`;
    let blob = s.epubBlob;
    if (!blob) {
      const r = await fetch(`/api/books/${s.gid}/epub`);
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error((e.error || "The illustrated edition didn't load.") + " Switch to the plain text edition in the Aa menu."); }
      blob = await r.blob();
      s.epubBlob = blob; saveItem(it).catch(() => {});
    }
    html = await fromEpub(blob, `End of the illustrated Project Gutenberg edition · gutenberg.org/ebooks/${s.gid}`);
  } else if (s.kind === "gutenberg") {
    let text = s.cachedText;
    if (!text) {
      text = await api(`books/${s.gid}/text`);
      s.cachedText = text; saveItem(it).catch(() => {});
    }
    html = textToHtml(text) + `<p class="end">End of this Project Gutenberg text · gutenberg.org/ebooks/${s.gid}</p>`;
  } else if (s.kind === "wikisource") {
    let chapters = s.cachedChapters;
    if (!chapters) {
      const { loadWork } = await import("../wikisource.js");
      const w = await loadWork(s.lang, s.title, (msg) => { const t = $("#b-text"); if (t) t.innerHTML = `<p class="r-msg">${esc(msg)}</p>`; });
      chapters = w.chapters;
      s.cachedChapters = chapters; saveItem(it).catch(() => {});
    }
    html = chapters.map((c, i) => `<section data-ch="${i}">${chapters.length > 1 && !/<h[1-3]/i.test(c.html.slice(0, 400)) ? `<h2>${esc(c.title)}</h2>` : ""}${c.html}</section>`).join("")
      + `<p class="end">From Wikisource, where volunteers transcribe public-domain texts · ${esc(s.title)}</p>`;
  } else if (s.kind === "wiki") {
    // A saved wiki article. Internal links become plain text inside the reader.
    let body = s.cachedHtml;
    if (!body) { const { page } = await import("../mediawiki.js"); body = (await page({ api: s.api, base: s.url.replace(/[^/]+$/, ""), name: s.wiki }, s.page)).html; }
    html = `<h1>${esc(it.title)}</h1>${body.replace(/<a [^>]*data-wiki="[^"]*"[^>]*>(.*?)<\/a>/g, "$1")}<p class="end">From ${esc(s.wiki)} · ${esc(s.license || "see the original for licence")} · ${esc(s.url)}</p>`;
  } else if (s.kind === "script") {
    // A screenplay or stage script: same words, laid out like a script.
    let text = s.text;
    if (!text && s.file) { const r = await fetch(s.file); if (!r.ok) throw new Error("This script didn't load. Check your connection."); text = await r.text(); s.text = text; saveItem(it).catch(() => {}); }
    html = scriptToHtml(text) + `<p class="end">${esc(s.credit || "End")}</p>`;
  } else if (s.kind === "text") {
    html = textToHtml(s.text) + `<p class="end">End</p>`;
  } else if (s.kind === "epub") {
    html = await fromEpub(s.blob, "End");
  } else throw new Error("This book has no text Kitsune can show.");
  if (B.item !== it) throw new Error("superseded"); // another book was opened while this one loaded
  const text = $("#b-text");
  text.innerHTML = html;
  // index readable blocks
  B.blocks = $$("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, dt, dd, figcaption, img", text).filter((b) => !b.closest("blockquote") || b.tagName === "BLOCKQUOTE");
  B.blocks = B.blocks.filter((b) => b.tagName === "IMG" || b.textContent.trim() || b.classList.contains("end"));
  B.blocks.forEach((b, i) => (b.dataset.p = i));
  // Drop caps open real chapters only: a full paragraph after a chapter head that starts with a proper word
  // (not "I", which reads oddly as a drop cap, and not a quote or a number).
  $$("h2:not(.sc-act) + p", text).forEach((p) => {
    const t = p.textContent.trim();
    if (t.length > 30 && /^[A-Za-z][a-z']+\b/.test(t) && !/^[A-Z]{2,}\b/.test(t)) p.classList.add("dropcap");
  });
  B.words = B.blocks.map((b) => (b.textContent.match(/\S+/g) || []).length);
  B.totalWords = B.words.reduce((a, b) => a + b, 0);
  B.cum = []; let c = 0; for (const w of B.words) { B.cum.push(c); c += w; }
  // contents
  if (B.epubToc?.length) {
    B.toc = B.epubToc.map((t) => {
      const [file, anchor] = t.href.split("#");
      const sec = $(`section[data-href="${CSS.escape(file)}"]`, text);
      const target = (anchor && sec?.querySelector(`[id="${CSS.escape(anchor)}"]`)) || sec;
      const blk = target && (target.dataset.p != null ? target : target.querySelector("[data-p]"));
      return blk ? { label: t.label, p: Number(blk.dataset.p) } : null;
    }).filter(Boolean);
  } else {
    B.toc = $$("h1, h2, h3", text).map((h) => ({ label: h.textContent.trim().slice(0, 80), p: Number(h.dataset.p) }));
  }
  markFootnotes();
  text.addEventListener("click", (e) => {
    const fr = e.target.closest(".fnref");
    if (fr) { e.preventDefault(); const body = B.blocks[Number(fr.dataset.fn)]; if (body) showNote(fr, ((t) => (/^\[Footnote/i.test(t) ? t.replace(FN_BODY, "").replace(/\]\s*$/, "") : t.replace(FN_BODY, "")).trim())(body.textContent.trim()),() => goTo(Number(body.dataset.p))); return; }
    const a = e.target.closest("[data-href]");
    if (a && a.tagName === "A") {
      const [file, anchor] = a.dataset.href.split("#");
      const sec = $(`section[data-href="${CSS.escape(file)}"]`, text);
      const t = (anchor && $(`[id="${CSS.escape(anchor)}"]`, text)) || sec;
      const blk = t && (t.dataset.p != null ? t : t.querySelector("[data-p]") || t.closest("[data-p]"));
      if (t && isNoteLink(a, t)) { e.preventDefault(); showNote(a, noteText(t), () => blk && goTo(Number(blk.dataset.p))); return; }
      if (blk) goTo(Number(blk.dataset.p));
    }
    const mk = e.target.closest("mark[data-h]");
    if (mk) editHighlight(Number(mk.dataset.h));
  });
}

// ---------- footnotes ----------
// Plain-text books (Project Gutenberg) write notes as "[1] …" or "[Footnote 1: …]" blocks and refer to them with "[1]".
const FN_BODY = /^\[(?:Footnote\s+)?(\d{1,3}|[A-Z*†‡])(?:\]|:)\s*/i;
function markFootnotes() {
  const bodies = new Map(); // key -> block indexes
  B.blocks.forEach((b, i) => { const m = b.textContent.trim().match(FN_BODY); if (m) { const k = m[1].toUpperCase(); if (!bodies.has(k)) bodies.set(k, []); bodies.get(k).push(i); } });
  if (!bodies.size) return;
  const isBody = new Set([...bodies.values()].flat());
  B.blocks.forEach((b, i) => {
    if (isBody.has(i) || !/\[(\d{1,3}|[A-Z*†‡])\]/i.test(b.textContent)) return;
    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const re = /\[(\d{1,3}|[A-Z*†‡])\]/gi;
      let m, last = 0; const frag = document.createDocumentFragment(); let hit = false;
      while ((m = re.exec(node.data))) {
        const list = bodies.get(m[1].toUpperCase());
        if (!list) continue;
        // The note for this marker is the next one after it (notes restart in each chapter).
        const target = list.find((x) => x > i) ?? list[list.length - 1];
        frag.append(node.data.slice(last, m.index));
        const btn = document.createElement("button");
        btn.type = "button"; btn.className = "fnref"; btn.dataset.fn = String(target); btn.textContent = m[0];
        btn.setAttribute("aria-label", `Footnote ${m[1]}`);
        frag.append(btn); last = m.index + m[0].length; hit = true;
      }
      if (hit) { frag.append(node.data.slice(last)); node.replaceWith(frag); }
    }
  });
}
function isNoteLink(a, t) {
  const type = (a.getAttribute("epub:type") || "") + " " + (a.getAttribute("role") || "");
  if (/noteref/.test(type)) return true;
  return /^\[?[\d*†‡a-z]{1,4}\]?$/i.test(a.textContent.trim()) && noteText(t).length < 1500;
}
function noteText(t) {
  const box = t.closest?.("aside, li, dd, p, div") || t;
  return (box.textContent || "").replace(/^\s*\[?\d{1,3}\]?[.)]?\s*/, "").replace(/\s*[↩︎⤴]+\s*$/, "").trim();
}
function showNote(anchor, text, goThere) {
  document.querySelector(".fn-pop")?.remove();
  const pop = document.createElement("div");
  pop.className = "fn-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Footnote");
  pop.innerHTML = `<p>${esc(text.length > 1200 ? text.slice(0, 1200) + "…" : text)}</p><div class="fn-pop-act"><button class="btn btn-sm" type="button" data-fn-go>Go to note</button><button class="btn btn-sm btn-ghost" type="button" data-fn-x>Close</button></div>`;
  el().appendChild(pop);
  const r = anchor.getBoundingClientRect(), W = Math.min(380, innerWidth - 24);
  pop.style.width = W + "px";
  pop.style.left = Math.max(12, Math.min(innerWidth - W - 12, r.left + r.width / 2 - W / 2)) + "px";
  const below = r.bottom + 10, h = pop.offsetHeight;
  pop.style.top = (below + h < innerHeight - 12 ? below : Math.max(12, r.top - h - 10)) + "px";
  const close = () => { pop.remove(); removeEventListener("keydown", onKey, true); document.removeEventListener("pointerdown", onOut, true); $("#b-scroll")?.removeEventListener("scroll", close); anchor.focus?.({ preventScroll: true }); };
  const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } };
  const onOut = (e) => { if (!pop.contains(e.target) && e.target !== anchor) close(); };
  addEventListener("keydown", onKey, true);
  setTimeout(() => document.addEventListener("pointerdown", onOut, true), 0);
  $("#b-scroll")?.addEventListener("scroll", close, { once: true, passive: true });
  pop.querySelector("[data-fn-go]").onclick = () => { close(); goThere(); };
  pop.querySelector("[data-fn-x]").onclick = close;
  pop.querySelector("[data-fn-go]").focus({ preventScroll: true });
}

// At the end of a book: what to read next. The next part of the same series first, otherwise the top of Up Next.
async function endCard() {
  const end = $("#b-text .end"), it = B.item;
  B.next = null;
  if (!end || !it) return;
  let next = null;
  if (it.series) {
    const o = await import("../originals.js");
    const ser = o.SERIES.find((s) => s.title === it.series);
    const i = ser ? ser.items.findIndex((e) => e.id === it.id) : -1;
    const e = i >= 0 ? ser.items[i + 1] : null;
    if (e) next = { kicker: `Next in ${ser.title}`, title: e.title, cover: e.cover, blurb: e.blurb, go: () => o.addSeriesItem(ser, e) };
  }
  if (!next) {
    const { getQueue, getItem } = await import("../store.js");
    const q = getItem((await getQueue()).find((x) => x !== it.id));
    if (q) next = { kicker: "Up next", title: q.title, cover: typeof q.cover === "string" && /^(\/|https:)/.test(q.cover) ? q.cover : "", blurb: q.author || "", go: async () => q };
  }
  if (!next || B.item !== it) return;
  B.next = next;
  const card = document.createElement("span");
  card.className = "next-card";
  card.innerHTML = `<span class="nc-k">${esc(next.kicker)}</span><button type="button" class="nc-b">${next.cover ? `<img src="${esc(next.cover)}" alt="" loading="lazy">` : ""}<span class="nc-t"><strong>${esc(next.title)}</strong><small>${esc(next.blurb.slice(0, 160))}${next.blurb.length > 160 ? "…" : ""}</small><span class="nc-go">Read next ${icon("next")}</span></span></button>`;
  end.append(card);
  $(".nc-b", card).onclick = () => readNext(next);
}
async function readNext(next) {
  try {
    const ni = await next.go();
    const { openItem } = await import("../views/common.js");
    openItem(ni);
  } catch (e) { toast(e.message || "That didn't open."); }
}

function textToHtml(text) {
  const out = [];
  const lines = text.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  for (let raw of lines) {
    raw = raw.replace(/^\n+|\s+$/g, "");
    if (!raw.trim()) continue;
    const ls = raw.split("\n");
    const one = ls.map((l) => l.trim()).join(" ");
    const isHead = ls.length <= 3 && one.length < 90 && (
      /^(chapter|book|part|letter|volume|act|scene|canto|section|preface|introduction|prologue|epilogue|contents|appendix|stave|fytte)\b/i.test(one) ||
      // A Roman numeral on its own ("IV", "XII.") or before a title ("IV. The Return"), but not a sentence that starts with "I ".
      (/^[IVXLC]+\.?$/.test(one) || /^[IVXLC]+[.:]\s+\S/.test(one)) && one.length < 50 ||
      (one === one.toUpperCase() && /[A-Z]{3}/.test(one) && one.length < 70));
    if (isHead) out.push(`<h2>${esc(one)}</h2>`);
    else if (ls.length > 2 && ls.every((l) => l.trim().length < 64) && ls.some((l) => /^\s{2,}/.test(l) || l.trim().length < 48))
      out.push(`<p class="verse">${esc(ls.map((l) => l.replace(/\s+$/, "")).join("\n").replace(/^\s{0,8}/gm, (m) => m.slice(0, Math.min(m.length, 6))))}</p>`);
    else out.push(`<p>${esc(one).replace(/(^|[\s(])_([A-Za-z][^_]*?[A-Za-z.,!?])_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>")}</p>`);
  }
  return out.join("");
}

// Screenplay layout: scene headings, act breaks, character cues, dialogue, parentheticals, songs.
// Only the presentation changes; every word of the script is kept as written.
function scriptToHtml(text) {
  const ACT = /^(TEASER|COLD OPEN|PROLOGUE|EPILOGUE|PREMISE|TAG|OPENING NUMBER|ACT [A-Z]+|SEASON [A-Z]+( PREMIERE)?|EPISODE [^a-z]*|CUT TO (TITLE|BLACK)[.:]?|END OF EPISODE[^a-z]*|\[END CHAPTER\])$/;
  const SCENE = /^(INT\.|EXT\.|INT\/EXT|I\/E\.?)\s/;
  const isCue = (l) => { const t = l.trim(); const bare = t.replace(/\([^)]*\)/g, "").trim();
    return t.length >= 2 && t.length <= 48 && bare.length >= 2 && !/[a-z]/.test(bare) && /[A-Z]{2}/.test(bare) && !/[.!?…—"”:]$/.test(bare) && !/[!?]/.test(bare) && !SCENE.test(t) && !ACT.test(t); };
  const verse = (ls) => ls.length >= 3 && ls.every((l) => l.trim().length < 64);
  const body = (ls) => (verse(ls) ? ls.map((l) => esc(l.trim())).join("<br>") : esc(ls.map((l) => l.trim()).join(" ")));
  const out = [];
  let expect = false;
  // Very long unbroken lines (some exports lose their line breaks) are split at sentence ends for reading; no words change.
  const blocks = text.replace(/\r\n?/g, "\n").split(/\n\s*\n/).flatMap((b) => {
    if (b.length < 1500) return [b];
    return b.split("\n").flatMap((line) => {
      if (line.length < 1500) return [line];
      const out = []; let cur = "";
      for (const sentence of line.split(/(?<=[.!?”"…])\s+(?=[A-Z“"(])/)) { cur += (cur ? " " : "") + sentence; if (cur.length > 500) { out.push(cur); cur = ""; } }
      if (cur) out.push(cur);
      return out;
    });
  });
  for (const block of blocks) {
    const ls = block.split("\n").filter((l) => l.trim());
    if (!ls.length) continue;
    const first = ls[0].trim();
    if (ls.length === 1 && ACT.test(first)) { out.push(`<h2 class="sc-act">${esc(first)}</h2>`); expect = false; continue; }
    if (SCENE.test(first) && ls.join(" ").length < 140) { out.push(`<h3 class="sc-scene">${esc(ls.map((l) => l.trim()).join(" "))}</h3>`); expect = false; continue; }
    if (ls.length === 1 && /^[“"][^“”"]{2,60}[”"]$/.test(first)) { out.push(`<h4 class="sc-song">${esc(first)}</h4>`); expect = false; continue; }
    if (isCue(first)) {
      out.push(`<p class="sc-cue">${esc(first)}</p>`);
      const rest = ls.slice(1);
      if (!rest.length) { expect = true; continue; }
      let i = 0;
      while (i < rest.length && /^\(.*\)$/.test(rest[i].trim())) out.push(`<p class="sc-par">${esc(rest[i++].trim())}</p>`);
      if (i < rest.length) out.push(`<p class="sc-dia">${body(rest.slice(i))}</p>`);
      expect = false; continue;
    }
    if (expect) {
      if (/^\(.*\)$/.test(first) && ls.length === 1) { out.push(`<p class="sc-par">${esc(first)}</p>`); continue; }
      out.push(`<p class="sc-dia">${body(ls)}</p>`); expect = false; continue;
    }
    out.push(`<p class="sc-act-line">${body(ls)}</p>`);
  }
  return `<div class="script">${out.join("")}</div>`;
}

// ---------- layout & position ----------
const vertical = () => !!settings.book.vertical;
const paged = () => settings.book.layout === "paged" && !vertical();
function applyStyle() {
  const r = el(), b = settings.book;
  r.className = `book t-${b.theme} ${paged() ? "paged" : ""} ${vertical() ? "vertical" : ""} ${b.ruby === false ? "no-ruby" : ""} ${r.style.getPropertyValue("--bk-tint") && b.tint !== false ? "tinted" : ""}`;
  const t = $("#b-text");
  if (b.font === "dyslexic") import("../store.js").then((s) => s.loadDyslexicFont());
  t.style.setProperty("--bk-font", (b.font === "custom" && !B.userFont ? null : FONTS[b.font]) || FONTS.literata);
  t.style.setProperty("--bk-size", b.size + "px");
  t.style.setProperty("--bk-lh", b.lineHeight);
  t.style.setProperty("--bk-w", b.width + "em");
  // The soundscape layer needs the column's size too, to keep its scene in the margins.
  r.style.setProperty("--bk-size", b.size + "px");
  r.style.setProperty("--bk-w", b.width + "em");
  t.classList.toggle("justify", b.align === "justify");
}
function layout() {
  const t = $("#b-text"), sc = $("#b-scroll");
  if (!t) return;
  if (paged()) {
    const W = sc.clientWidth, M = Math.max(28, Math.round(W * 0.06));
    const cols = W > 1100 ? 2 : 1;
    t.style.width = W + "px";
    t.style.paddingLeft = t.style.paddingRight = M + "px";
    t.style.columnGap = 2 * M + "px";
    t.style.columnWidth = (W / cols - 2 * M) + "px";
    t.style.height = sc.clientHeight + "px";
  } else {
    t.style.width = t.style.paddingLeft = t.style.paddingRight = t.style.columnGap = t.style.columnWidth = t.style.height = "";
  }
}
const pageW = () => $("#b-scroll").clientWidth;
const pageCount = () => Math.max(1, Math.round($("#b-text").scrollWidth / pageW()));

function currentBlock() {
  const sc = $("#b-scroll"), r = sc.getBoundingClientRect();
  if (vertical()) {
    // Vertical text runs right to left: the current block is the first one that reaches the right edge.
    let lo = 0, hi = B.blocks.length - 1, ans = hi;
    const edge = r.right - 8;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (B.blocks[mid].getBoundingClientRect().left < edge) { ans = mid; hi = mid - 1; } else lo = mid + 1; }
    return ans;
  }
  if (paged()) {
    for (const b of B.blocks) { const x = b.getBoundingClientRect(); if (x.right > r.left + 4 && x.left < r.right && x.height) return Number(b.dataset.p); }
    return B.pos;
  }
  // binary search for first block whose bottom is below the top edge
  let lo = 0, hi = B.blocks.length - 1, ans = hi;
  const top = r.top + 8;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (B.blocks[mid].getBoundingClientRect().bottom > top) { ans = mid; hi = mid - 1; } else lo = mid + 1; }
  return ans;
}

function goTo(p, smooth = true) {
  const b = B.blocks[clamp(p, 0, B.blocks.length - 1)];
  const sc = $("#b-scroll");
  if (!b || !sc || !b.isConnected) return;
  if (vertical()) {
    b.scrollIntoView({ inline: "start", block: "nearest" });
  } else if (paged()) {
    const left = b.getBoundingClientRect().left - sc.getBoundingClientRect().left + sc.scrollLeft;
    B.page = Math.floor(left / pageW());
    sc.scrollLeft = B.page * pageW();
  } else {
    sc.scrollTop = b.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 24;
  }
  B.pos = Number(b.dataset.p);
  setTimeout(onMove, 30);
}
function turn(d) {
  const sc = $("#b-scroll");
  if (vertical()) { sc.scrollBy({ left: -d * (sc.clientWidth - 80) }); return; }
  if (paged()) {
    const n = pageCount(), cur = Math.round(sc.scrollLeft / pageW());
    const next = clamp(cur + d, 0, n - 1);
    const apply = () => { B.page = next; sc.scrollLeft = B.page * pageW(); onMove(); };
    if (next === cur) return apply();
    pageFlip(d, apply);
  } else sc.scrollBy({ top: d * (sc.clientHeight - 60), behavior: "smooth" });
}

// Pages layout: the page peels over like paper (or slides), using a view transition of the reading area.
let flipping = null;
function pageFlip(d, apply) {
  const fx = settings.book.pageFx || "curl";
  if (fx === "none" || !document.startViewTransition || (document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches) || document.hidden) return apply();
  if (flipping) flipping.skipTransition?.();
  const root = document.documentElement, sc = $("#b-scroll");
  root.dataset.turn = (d > 0 ? "fwd" : "back") + "-" + fx;
  sc.style.viewTransitionName = "bookpage";
  let ran = false;
  const run = () => { if (ran) return; ran = true; apply(); };
  const vt = document.startViewTransition(run);
  flipping = vt;
  vt.ready.catch(() => {}); vt.updateCallbackDone.catch(() => {});
  const cleanup = () => {
    if (flipping !== vt) return;
    flipping = null;
    delete root.dataset.turn;
    sc.style.viewTransitionName = "";
  };
  vt.finished.catch(() => {}).finally(cleanup);
  // If the browser can't take the snapshot quickly (a background tab, a busy page), turn without the animation.
  setTimeout(() => { if (ran) return; vt.skipTransition?.(); setTimeout(() => { run(); cleanup(); }, 60); }, 350);
}

// The reader counts the last couple of lines (the end note) as finished, so save it as the very end.
const savedPos = () => (B.blocks.length && B.pos >= B.blocks.length - 2 ? B.blocks.length - 1 : B.pos);
const save = debounce(() => {
  if (!B.item) return;
  setProgress(B.item.id, { pos: savedPos(), total: B.blocks.length });
  const words = (B.cum[B.pos] || 0) - (B.cum[B.lastLogged] || 0);
  if (words > 0 && words < 20000) { logStat({ words, pages: Math.round(words / 300), itemId: B.item.id }); }
  // Learn your reading speed from steady forward reading (60–900 words a minute).
  const now = Date.now(), secs = (now - (B.speedT || now)) / 1000;
  if (words > 0 && secs > 5 && secs < 900 && !B.autoOn && !B.speaking) {
    const wps = words / secs;
    if (wps >= 1 && wps <= 15) {
      B.speed.words += words; B.speed.secs += secs;
      if (B.speed.secs > 3600 * 4) { B.speed.words /= 2; B.speed.secs /= 2; } // favour recent reading
      kvSet("readingSpeed", B.speed);
    }
  }
  B.speedT = now;
  B.lastLogged = Math.max(B.lastLogged, B.pos);
}, 800);
const wpm = () => (B.speed?.secs > 240 ? Math.round((B.speed.words / B.speed.secs) * 60) : WPM);

// ---------- auto-scroll ----------
function toggleAuto(force) {
  const on = force ?? !B.autoOn;
  if (on && (paged() || vertical())) { toast("Auto-scroll works with horizontal text in the Scroll layout. Switch it in the Aa menu."); return; }
  B.autoOn = on;
  clearInterval(B.autoRaf);
  $("#b-auto")?.setAttribute("aria-pressed", String(on));
  if (!on) return;
  B.autoMul ??= 1;
  toast(`Auto-scroll at your pace (${wpm()} words a minute). [ and ] change speed, A stops.`);
  let last = performance.now(), carry = 0;
  B.autoRaf = setInterval(() => {
    if (!B.autoOn || !B.item) return clearInterval(B.autoRaf);
    const t = performance.now(), sc = $("#b-scroll");
    const pxPerWord = (sc.scrollHeight - sc.clientHeight) / Math.max(1, B.totalWords);
    carry += ((t - last) / 1000) * (wpm() / 60) * pxPerWord * B.autoMul;
    last = t;
    if (carry >= 1) { sc.scrollTop += Math.floor(carry); carry -= Math.floor(carry); }
    if (sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 2) toggleAuto(false);
  }, 33);
}

function onMove() {
  if (!B.blocks.length) return;
  B.pos = currentBlock();
  // Scrolled or paged all the way to the end counts as the end, even if a few short lines share the last screen.
  { const sc = $("#b-scroll"); if (sc && !vertical() && (paged() ? sc.scrollWidth > sc.clientWidth + 40 && sc.scrollLeft >= sc.scrollWidth - sc.clientWidth - 4 : sc.scrollHeight > sc.clientHeight + 40 && sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 4)) B.pos = B.blocks.length - 1; }
  const pct = B.totalWords ? Math.round(((B.cum[B.pos] || 0) / B.totalWords) * 100) : 0;
  const done = B.pos >= B.blocks.length - 2;
  $("#b-pct").textContent = (done ? 100 : pct) + "%";
  const scrub = $("#b-scrub");
  if (scrub && document.activeElement !== scrub) scrub.value = done ? 1000 : Math.round(((B.cum[B.pos] || 0) / Math.max(1, B.totalWords)) * 1000);
  $("#b-bar").style.width = (done ? 100 : pct) + "%";
  const left = B.totalWords - (B.cum[B.pos] || 0);
  const ch = [...B.toc].reverse().find((t) => t.p <= B.pos);
  $("#b-chapter").textContent = ch ? ch.label : "";
  const leftTxt = `${fmtMinutes((left / wpm()) * 60)} left`;
  $("#b-left").textContent = done ? "Finished" : paged() ? `Page ${Math.round($("#b-scroll").scrollLeft / pageW()) + 1} of ${pageCount()} · ${leftTxt}` : leftTxt;
  $("#b-left").title = B.speed?.secs > 240 ? `Based on your reading speed: ${wpm()} words a minute` : "Based on an average of 250 words a minute until Kitsune learns your speed";
  $("#b-bm").setAttribute("aria-pressed", String(B.marks.some((m) => Math.abs(m.pos - B.pos) <= 1)));
  if (B.panel === "toc") $$(".b-toc button").forEach((b) => b.classList.toggle("cur", ch && Number(b.dataset.p) === ch.p));
  save();
}

// ---------- side panel ----------
function openPanel(name) {
  const side = $("#b-side");
  if (B.panel === name && !side.hidden) { side.hidden = true; B.panel = null; relayout(); return; }
  B.panel = name; side.hidden = false; el().classList.remove("immersive");
  side.onchange = side.oninput = null;
  $$("[data-panel]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.panel === name)));
  if (name === "toc") {
    const cur = [...B.toc].reverse().find((t) => t.p <= B.pos);
    side.innerHTML = `<h4>Contents</h4>${B.toc.length ? `<div class="b-toc">${B.toc.map((t) => `<button type="button" data-p="${t.p}" class="${cur === t ? "cur" : ""}"><span>${esc(t.label)}</span><em>${B.totalWords ? Math.round((B.cum[t.p] / B.totalWords) * 100) : 0}%</em></button>`).join("")}</div>` : `<p style="margin:0;color:var(--bk-muted)">This book has no chapter headings Kitsune could find.</p>`}`;
    side.onclick = (e) => { const b = e.target.closest("[data-p]"); if (b) { goTo(Number(b.dataset.p)); if (innerWidth < 760) openPanel("toc"); } };
    $(".b-toc .cur", side)?.scrollIntoView({ block: "center" });
  }
  if (name === "search") {
    side.innerHTML = `<h4>Search in this book</h4><input class="field" id="b-q" type="search" placeholder="Word or phrase" autofocus><p id="b-q-n" style="margin:0;font-size:13px;color:var(--bk-muted)"></p><div class="b-toc" id="b-q-r"></div>`;
    const run = debounce(() => {
      const q = $("#b-q").value.trim().toLowerCase();
      $$(".found", $("#b-text")).forEach((x) => x.classList.remove("found"));
      if (q.length < 2) { $("#b-q-r").innerHTML = ""; $("#b-q-n").textContent = ""; return; }
      const hits = [];
      for (const b of B.blocks) { const t = b.textContent; const i = t.toLowerCase().indexOf(q); if (i >= 0) hits.push({ p: Number(b.dataset.p), s: t.slice(Math.max(0, i - 40), i + q.length + 60) }); if (hits.length >= 300) break; }
      $("#b-q-n").textContent = hits.length ? `${hits.length >= 300 ? "300+" : hits.length} matches` : "No matches.";
      $("#b-q-r").innerHTML = hits.map((h) => `<button type="button" data-p="${h.p}"><span style="white-space:normal">…${esc(h.s)}…</span></button>`).join("");
    }, 250);
    $("#b-q").oninput = run;
    side.onclick = (e) => { const b = e.target.closest("[data-p]"); if (b) { const blk = B.blocks[Number(b.dataset.p)]; $$(".found").forEach((x) => x.classList.remove("found")); blk.classList.add("found"); goTo(Number(b.dataset.p)); } };
    $("#b-q").focus();
  }
  if (name === "notes") drawNotes();
  if (name === "style") drawStyle();
  if (name === "lookup") drawLookup();
  if (name === "xray") drawX();
  relayout();
}

// Open the search panel with a query and jump to the first match.
function findInBook(q) {
  if (B.panel !== "search") openPanel("search");
  const input = $("#b-q"); if (!input) return;
  input.value = q;
  input.dispatchEvent(new Event("input"));
  setTimeout(() => $("#b-q-r [data-p]")?.click(), 400);
}

// ---------- look up words and names ----------
async function drawLookup() {
  const side = $("#b-side"), q = B.lookup || "";
  side.innerHTML = `<h4>Look up</h4>
    <form id="lk-form" style="display:flex;gap:6px"><input class="field" id="lk-q" value="${esc(q)}" placeholder="Word or name"><button class="btn btn-sm" type="submit">Go</button></form>
    <div id="lk-def"><p style="margin:0;font-size:13px;color:var(--bk-muted)">${q ? "Looking up…" : "Select a word in the text and choose Define, or press D."}</p></div>
    <div id="lk-tr"></div>
    <div id="lk-wiki"></div>`;
  $("#lk-form").onsubmit = (e) => { e.preventDefault(); B.lookup = $("#lk-q").value.trim(); B.lookupContext = ""; drawLookup(); };
  side.onclick = null;
  if (!q) return;
  const { define, wikipedia, translate, saveWord, LANGUAGES } = await import("../lookup.js");
  const lang = (B.item.lang || "en").slice(0, 2);
  const single = !/\s/.test(q);
  // translation
  const to = settings.book.translateTo || ((navigator.language || "en").slice(0, 2) !== lang ? (navigator.language || "en").slice(0, 2) : lang === "en" ? "ja" : "en");
  $("#lk-tr").innerHTML = `<h4 style="margin:6px 0 8px">Translate</h4><div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><span style="font-size:13px;color:var(--bk-muted)">${esc(LANGUAGES[lang] || lang)} →</span>
    <select class="field" id="lk-to" style="width:auto;padding:5px 8px">${Object.entries(LANGUAGES).filter(([k]) => k !== lang).map(([k, v]) => `<option value="${k}" ${k === to ? "selected" : ""}>${v}</option>`).join("")}</select></div><p id="lk-tr-out" style="margin:0;font-size:15px;font-family:var(--bk-font)">Translating…</p>`;
  const runTr = (target) => translate(q, lang, target).then((t) => { if (B.lookup === q && $("#lk-tr-out")) $("#lk-tr-out").textContent = t.text; })
    .catch((e) => { if ($("#lk-tr-out")) { $("#lk-tr-out").textContent = e.message; $("#lk-tr-out").style.color = "var(--bk-muted)"; } });
  $("#lk-to").onchange = (e) => { settings.book.translateTo = e.target.value; saveSettings(); $("#lk-tr-out").textContent = "Translating…"; runTr(e.target.value); };
  runTr(to);
  if (single) {
    define(q, lang).then((d) => {
      if (B.lookup !== q || !$("#lk-def")) return;
      $("#lk-def").innerHTML = `<div style="display:grid;gap:10px"><div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><strong style="font-size:20px;font-family:var(--bk-font)">${esc(d.word)}</strong>${d.phonetic ? `<span style="color:var(--bk-muted)">${esc(d.phonetic)}</span>` : ""}
          <button class="btn btn-sm" type="button" id="lk-save" style="margin-left:auto">${icon("plus")}Save word</button></div>
        ${d.senses.map((s) => `<div><em style="color:var(--bk-muted);font-size:13px">${esc(s.pos || "")}</em><ol style="margin:4px 0 0;padding-left:20px;font-size:14px;display:grid;gap:4px">${s.defs.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>`).join("")}
        ${d.source ? `<a href="${esc(d.source)}" target="_blank" rel="noopener" style="font-size:12px;color:var(--bk-accent)">${esc(d.via)} ↗</a>` : ""}</div>`;
      $("#lk-save").onclick = async (e) => {
        const ok = await saveWord({ word: d.word, def: d.senses[0].defs[0], pos: d.senses[0].pos, context: B.lookupContext, itemId: B.item.id, book: B.item.title });
        e.currentTarget.disabled = true; e.currentTarget.textContent = ok ? "Saved ✓" : "Already saved";
        if (ok) toast(`Saved “${d.word}”. Review it in Notebook → Vocabulary.`);
      };
    }).catch((e) => { if ($("#lk-def")) $("#lk-def").innerHTML = `<p style="margin:0;font-size:13px;color:var(--bk-muted)">${esc(e.message)}</p>`; });
  } else $("#lk-def").innerHTML = "";
  wikipedia(q, lang).then((w) => {
    if (B.lookup !== q || !$("#lk-wiki")) return;
    $("#lk-wiki").innerHTML = `<h4 style="margin:6px 0 10px">Wikipedia</h4><div style="display:grid;gap:8px;font-size:14px">
      ${w.thumb ? `<img src="${esc(w.thumb)}" alt="" style="max-height:140px;width:auto;border-radius:6px">` : ""}
      <strong>${esc(w.title)}</strong>${w.description ? `<span style="color:var(--bk-muted);font-size:13px">${esc(w.description)}</span>` : ""}
      <p style="margin:0;line-height:1.55">${esc(w.extract)}</p><a href="${esc(w.url)}" target="_blank" rel="noopener" style="font-size:12px;color:var(--bk-accent)">Read on Wikipedia ↗</a></div>`;
  }).catch(() => { if ($("#lk-wiki") && !single) $("#lk-wiki").innerHTML = `<p style="margin:0;font-size:13px;color:var(--bk-muted)">Nothing on Wikipedia for “${esc(q)}”.</p>`; });
}
function lookUp(text, context = "") {
  const words = text.trim().split(/\s+/);
  B.lookupContext = context;
  B.lookup = (words.length === 1 ? words[0].replace(/[“”"‘’.,;:!?()]+/g, "") : text.trim().slice(0, 480)).trim();
  if (B.panel === "lookup") drawLookup(); else openPanel("lookup");
}

// ---------- X-Ray and recap ----------
async function xrayData() {
  if (!B.xray) {
    const { analyse } = await import("../xray.js");
    B.xrayTexts = B.blocks.map((b) => (b.tagName === "IMG" ? "" : b.textContent));
    B.xray = analyse(B.xrayTexts);
  }
  return B.xray;
}
async function drawX() {
  const side = $("#b-side"), item = B.item;
  side.innerHTML = `<h4>X-Ray</h4><p class="xr-sub">Reading the book for names…</p>`;
  const X = await import("../xray.js"), ents = await xrayData();
  if (B.item !== item || B.panel !== "xray") return;
  if (X.drawXray.st && X.drawXray.st.book !== item.id) X.drawXray.st = null;
  X.drawXray(side, {
    ents, texts: B.xrayTexts, pos: B.pos, total: B.blocks.length,
    goTo: (p) => { $$(".found", $("#b-text")).forEach((x) => x.classList.remove("found")); B.blocks[p]?.classList.add("found"); goTo(p); if (innerWidth < 760) openPanel("xray"); },
    lookUp: (n) => lookUp(n), recap: () => showRecap(null),
  });
  X.drawXray.st.book = item.id;
}
async function showRecap(days) {
  if (!B.item || !B.blocks.length) return;
  $(".b-recap", el())?.remove();
  const X = await import("../xray.js"), ents = await xrayData();
  const pos = B.pos;
  let chapter = ([...B.toc].reverse().find((t) => t.p <= pos)?.label || "").replace(/[\s.:;,]+$/, "");
  if (chapter === chapter.toUpperCase()) chapter = chapter.replace(/\S+/g, (w) => (/^[IVXLCDM]+$/.test(w) ? w : w[0] + w.slice(1).toLowerCase()));
  // The last few lines you read, just before where you are now.
  let last = "";
  for (let p = Math.max(0, pos - 1); p >= 0 && last.length < 420; p--) {
    const b = B.blocks[p]; if (!b || b.tagName === "IMG" || /^H\d$/.test(b.tagName) || b.classList.contains("end")) continue;
    last = b.textContent.trim().replace(/\s+/g, " ") + (last ? " " + last : "");
  }
  if (last.length > 420) last = "…" + last.slice(-420).replace(/^\S*\s/, "");
  const wrap = document.createElement("div");
  wrap.innerHTML = X.recapHtml({
    title: B.item.title, days, chapter, lastText: last,
    pct: Math.round(((B.cum[pos] || 0) / Math.max(1, B.totalWords)) * 100),
    hls: B.hls.filter((h) => h.p <= pos).slice(-3),
    people: X.around(ents, pos).slice(0, 6),
  });
  const card = wrap.firstElementChild;
  el().append(card);
  const close = () => { card.classList.add("out"); setTimeout(() => card.remove(), 220); };
  card.onclick = (e) => {
    const b = e.target.closest("[data-recap]");
    if (b) {
      if (b.dataset.recap === "back") { const want = (B.cum[pos] || 0) - 350; let p = pos; while (p > 0 && B.cum[p] > want) p--; goTo(p); }
      close();
    } else if (e.target === card) close();
  };
  card.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } else if (e.key !== "Tab" && e.key !== "Enter" && e.key !== " ") e.stopPropagation(); });
  $("[data-recap=go]", card).focus();
}

// ---------- bold word starts ----------
// The first part of each word in bold, to lead the eye along the line. Done a little ahead of where you are,
// so even a long book stays quick; the words themselves don't change, so highlights and search still match.
let boldIO = null;
const reanchor = debounce(() => { if (B.item && paged()) { const p = B.pos; layout(); goTo(p, false); } }, 160);
function boldBlock(blk) {
  if (blk.dataset.bw || blk.tagName === "IMG" || blk.tagName === "PRE" || blk.classList.contains("end")) return;
  blk.dataset.bw = "1";
  const walker = document.createTreeWalker(blk, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest("rt, b.bw, code, .fnref, h1, h2, h3, h4") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const s = n.nodeValue;
    if (!/\p{L}{2}/u.test(s)) continue;
    const frag = document.createDocumentFragment(); let last = 0;
    for (const m of s.matchAll(/\p{L}[\p{L}'’]*/gu)) {
      const w = m[0], k = w.length <= 3 ? 1 : Math.ceil(w.length * 0.45);
      frag.append(s.slice(last, m.index));
      const b = document.createElement("b"); b.className = "bw"; b.textContent = w.slice(0, k);
      frag.append(b, w.slice(k));
      last = m.index + w.length;
    }
    frag.append(s.slice(last));
    n.replaceWith(frag);
  }
}
function syncBold() {
  boldIO?.disconnect(); boldIO = null;
  const text = $("#b-text"); if (!text) return;
  const on = settings.book.bold && !vertical() && !/^(ja|zh|ko)/.test(B.item?.lang || "");
  if (!on) {
    if ($("b.bw", text)) { $$("b.bw", text).forEach((b) => b.replaceWith(b.textContent)); $$("[data-bw]", text).forEach((x) => { delete x.dataset.bw; x.normalize(); }); reanchor(); }
    return;
  }
  boldIO = new IntersectionObserver((es) => {
    let did = false;
    for (const e of es) if (e.isIntersecting) { boldBlock(e.target); boldIO?.unobserve(e.target); did = true; }
    if (did) reanchor();
  }, { root: $("#b-scroll"), rootMargin: "1600px" });
  B.blocks.forEach((b) => { if (!b.dataset.bw) boldIO.observe(b); });
}

// ---------- reading ruler ----------
function toggleRuler(force) {
  const r = $("#b-ruler");
  const on = force ?? r.hidden;
  r.hidden = !on;
  settings.book.ruler = on; saveSettings();
  if (on) {
    const body = $(".b-body").getBoundingClientRect();
    placeRuler(body.top + body.height * 0.4);
  }
}
function placeRuler(y) {
  const r = $("#b-ruler"); if (!r || r.hidden) return;
  const body = $(".b-body").getBoundingClientRect();
  const h = Math.round(settings.book.size * settings.book.lineHeight * 1.15);
  r.style.height = h + "px";
  r.style.top = clamp(y - body.top - h / 2, 0, body.height - h) + "px";
}
function relayout() { if (paged()) { const p = B.pos; layout(); requestAnimationFrame(() => goTo(p, false)); } }

function drawNotes() {
  const side = $("#b-side");
  side.innerHTML = `<h4>Bookmarks</h4>${B.marks.length ? B.marks.map((m, i) => `<button class="b-note" type="button" data-bm="${i}"><q>${esc(B.blocks[m.pos]?.textContent.slice(0, 140) || "")}</q><span>${B.totalWords ? Math.round((B.cum[m.pos] / B.totalWords) * 100) : 0}% · ${new Date(m.created * 1000).toLocaleDateString()}</span></button>`).join("") : `<p style="margin:0;font-size:13px;color:var(--bk-muted)">Press B or the bookmark button to save your place.</p>`}
    <h4>Highlights</h4>${B.hls.length ? B.hls.map((h, i) => `<button class="b-note" type="button" data-hl="${i}"><q style="border-color:${{ yellow: "#e8c34a", green: "#6fbf6f", blue: "#6f9fe0", pink: "#e07aa5" }[h.color] || "#e8c34a"}">${esc(h.text)}</q>${h.note ? `<span style="font-family:var(--f-body);color:var(--bk-ink);font-size:13px">${esc(h.note)}</span>` : ""}<span>${new Date(h.created * 1000).toLocaleDateString()}</span></button>`).join("") : `<p style="margin:0;font-size:13px;color:var(--bk-muted)">Select text to highlight it or add a note.</p>`}
    ${B.hls.length ? `<button class="btn btn-sm" type="button" id="b-export" style="justify-self:start">Copy all highlights</button>` : ""}`;
  side.onclick = (e) => {
    const bm = e.target.closest("[data-bm]"), hl = e.target.closest("[data-hl]");
    if (bm) goTo(B.marks[Number(bm.dataset.bm)].pos);
    if (hl) goTo(B.hls[Number(hl.dataset.hl)].p);
  };
  $("#b-export")?.addEventListener("click", async () => {
    const text = `${B.item.title}${B.item.author ? " — " + B.item.author : ""}\n\n` + B.hls.map((h) => `“${h.text}”${h.note ? `\n  Note: ${h.note}` : ""}`).join("\n\n");
    try { await navigator.clipboard.writeText(text); toast("Highlights copied."); } catch { toast("Couldn't copy. Your browser blocked the clipboard."); }
  });
}

function drawStyle() {
  const side = $("#b-side"), b = settings.book;
  const voices = speechSynthesis?.getVoices?.() || [];
  side.innerHTML = `
    <h4>Looks</h4><div class="look-row">${LOOKS.map(([k, name, sub, p]) => { const [bg, fg] = THEMES[p.theme]; const on = Object.entries(p).every(([pk, pv]) => b[pk] === pv); return `<button class="look" type="button" data-look="${k}" aria-pressed="${on}" style="background:${bg};color:${fg};font-family:${FONTS[p.font] || "inherit"}"><b>${name}</b><small>${sub}</small></button>`; }).join("")}</div>
    <h4>Theme</h4><div class="swatch-row">${Object.entries(THEMES).map(([k, [bg, fg, name]]) => `<button class="theme-sw" type="button" data-theme="${k}" aria-pressed="${b.theme === k}" title="${name}" aria-label="${name}" style="background:${bg};color:${fg}">Aa</button>`).join("")}</div>
    <h4>Typeface</h4><div class="seg" data-k="font">${[["literata", "Literata"], ["mincho", "Mincho"], ["atkinson", "Hyperlegible"], ["lexend", "Lexend"], ["dyslexic", "OpenDyslexic"], ["sans", "Sans"], ...(B.userFont ? [["custom", "Yours"]] : [])].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${b.font === v}">${l}</button>`).join("")}</div>
    <h4>Size · <span id="sv-size">${b.size}px</span></h4><input type="range" data-r="size" min="13" max="32" step="1" value="${b.size}">
    <h4>Line spacing · <span id="sv-lineHeight">${b.lineHeight}</span></h4><input type="range" data-r="lineHeight" min="1.2" max="2.2" step="0.05" value="${b.lineHeight}">
    <h4>Line width · <span id="sv-width">${b.width}em</span></h4><input type="range" data-r="width" min="24" max="56" step="1" value="${b.width}">
    <h4>Alignment</h4><div class="seg" data-k="align">${[["left", "Left"], ["justify", "Justified"]].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${b.align === v}">${l}</button>`).join("")}</div>
    <h4>Layout</h4><div class="seg" data-k="layout">${[["scroll", "Scroll"], ["paged", "Pages"]].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${b.layout === v}">${l}</button>`).join("")}</div>
    ${b.layout === "paged" && !b.vertical ? `<h4>Page turn</h4><div class="seg" data-k="pageFx">${[["curl", "Paper"], ["slide", "Slide"], ["none", "Instant"]].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${(b.pageFx || "curl") === v}">${l}</button>`).join("")}</div>` : ""}
    <label class="check" style="font-size:14px"><input type="checkbox" id="b-perbook" ${B.globalBook ? "checked" : ""}> Keep these settings for this book only</label>
    <label class="check" style="font-size:14px"><input type="checkbox" id="b-tint" ${b.tint !== false ? "checked" : ""}> Colour the reader from the book's cover</label>
    ${/^(ja|zh|ko)/.test(B.item?.lang || "") ? "" : `<label class="check" style="font-size:14px"><input type="checkbox" id="b-bold" ${b.bold ? "checked" : ""}> Bold word starts: the first letters of each word in bold, to lead your eye along the line</label>`}
    <label class="check" style="font-size:14px"><input type="checkbox" id="b-recap-on" ${b.recap !== false ? "checked" : ""}> Show a recap when I come back to a book after a few days</label>
    ${/^(ja|zh)/.test(B.item?.lang || "") || b.vertical ? `<h4>Japanese &amp; Chinese</h4>` : ""}
    ${/^(ja|zh)/.test(B.item?.lang || "") || b.vertical ? `<label class="check" style="font-size:14px"><input type="checkbox" id="b-vertical" ${b.vertical ? "checked" : ""}> Vertical text (tategaki), read right to left</label>` : ""}
    ${/^(ja|zh)/.test(B.item?.lang || "") ? `<label class="check" style="font-size:14px"><input type="checkbox" id="b-ruby" ${b.ruby !== false ? "checked" : ""}> Show furigana (reading aids above kanji)</label>` : ""}
    <h4>Soundscape · <span id="sv-amb">${settings.book.ambVol ?? 40}%</span></h4>
    <div class="amb-row" id="b-amb-row">${SOUNDSCAPES.map(([k, name, glyph]) => `<button class="amb" type="button" data-amb="${k}" aria-pressed="${(currentSoundscape() || "") === k}"><span aria-hidden="true">${glyph}</span>${name}</button>`).join("")}</div>
    <input type="range" id="b-amb-vol" min="0" max="100" step="1" value="${settings.book.ambVol ?? 40}" aria-label="Soundscape volume">
    <label class="check" style="font-size:14px"><input type="checkbox" id="b-amb-fx" ${settings.book.ambFx !== false ? "checked" : ""}> Show the soundscape in the margins (rain, firelight, waves, fireflies)</label>
    <h4>Focus</h4>
    <div class="seg" id="b-focus">${[15, 25, 45].map((n) => `<button type="button" data-min="${n}">${n} min timer</button>`).join("")}</div>
    <label class="check" style="font-size:14px"><input type="checkbox" id="b-ruler-on" ${settings.book.ruler ? "checked" : ""}> Reading ruler (L) — dims everything but the line you're on</label>
    <label class="check" style="font-size:14px"><input type="checkbox" id="b-cn-on" ${settings.book.contentNotes !== false ? "checked" : ""}> Show content notes before stories that have them</label>
    ${B.item.source.kind === "gutenberg" ? `<h4>Edition</h4><div class="seg" id="b-edition"><button type="button" data-ed="text" aria-pressed="${!B.item.source.illustrated}">Plain text</button><button type="button" data-ed="illustrated" aria-pressed="${!!B.item.source.illustrated}">Illustrated</button></div>
      <p style="margin:0;font-size:12px;color:var(--bk-muted)">The illustrated edition keeps the book's original pictures and formatting, when Gutenberg has them.</p>` : ""}
    <h4>Read aloud · <span id="sv-rate">${b.rate}×</span></h4><input type="range" data-r="rate" min="0.6" max="2" step="0.1" value="${b.rate}">
    ${voices.length ? `<select class="field" id="b-voice"><option value="">Default voice</option>${voices.map((v) => `<option value="${esc(v.name)}" ${b.voice === v.name ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select>` : ""}
    <button class="btn btn-sm" type="button" id="b-sleep" style="justify-self:start">${icon("sleep")}Sleep timer${B.sleep ? " (on)" : ""}</button>`;
  side.onclick = (e) => {
    const lk = e.target.closest("[data-look]");
    if (lk) { const look = LOOKS.find((x) => x[0] === lk.dataset.look); if (look) { const p = B.pos; Object.assign(b, look[3]); saveSettings(); keepBookLook(); applyStyle(); drawStyle(); layout(); requestAnimationFrame(() => goTo(p, false)); toast(`Look: ${look[1]}.`); } return; }
    const am = e.target.closest("[data-amb]");
    if (am) { setAmbience(am.dataset.amb); return; }
    const th = e.target.closest("[data-theme]");
    if (th) { b.theme = th.dataset.theme; saveSettings(); keepBookLook(); applyStyle(); drawStyle(); return; }
    const sb = e.target.closest("[data-k] [data-v]");
    if (sb) { const p = B.pos; b[sb.parentElement.dataset.k] = sb.dataset.v; saveSettings(); keepBookLook(); applyStyle(); drawStyle(); layout(); requestAnimationFrame(() => goTo(p, false)); }
  };
  $$("[data-r]", side).forEach((r) => (r.oninput = () => {
    const p = B.pos; b[r.dataset.r] = Number(r.value); saveSettings(); keepBookLook(); applyStyle();
    $("#sv-" + r.dataset.r).textContent = r.dataset.r === "size" ? r.value + "px" : r.dataset.r === "width" ? r.value + "em" : r.dataset.r === "rate" ? r.value + "×" : r.value;
    if (r.dataset.r !== "rate") { layout(); goTo(p, false); }
  }));
  $("#b-sleep")?.addEventListener("click", sleepMenu);
  $("#b-perbook")?.addEventListener("change", async (e) => {
    const all = await kvGet("bookPrefs", {});
    if (e.target.checked) { B.globalBook = { ...settings.book }; all[B.item.id] = pickBookLook(settings.book); toast("This book keeps its own look. Changes here won't affect your other books."); }
    else { Reflect.deleteProperty(all, B.item.id); if (B.globalBook) { Object.assign(settings.book, pickBookLook(B.globalBook)); B.globalBook = null; saveSettings(); keepBookLook(); applyStyle(); layout(); drawStyle(); } toast("Back to your usual reading settings."); }
    kvSet("bookPrefs", { ...all });
  });
  $("#b-tint")?.addEventListener("change", (e) => { b.tint = e.target.checked; saveSettings(); keepBookLook(); applyStyle(); });
  $("#b-bold")?.addEventListener("change", (e) => { b.bold = e.target.checked; saveSettings(); keepBookLook(); syncBold(); });
  $("#b-recap-on")?.addEventListener("change", (e) => { b.recap = e.target.checked; saveSettings(); });
  $("#b-amb-fx")?.addEventListener("change", (e) => { settings.book.ambFx = e.target.checked; saveSettings(); syncFx(); });
  $("#b-amb-vol")?.addEventListener("input", (e) => { settings.book.ambVol = Number(e.target.value); $("#sv-amb").textContent = e.target.value + "%"; setSoundscapeVolume(ambVol()); saveSettings(); });
  $("#b-voice")?.addEventListener("change", (e) => { b.voice = e.target.value; saveSettings(); });
  $("#b-ruler-on").onchange = (e) => toggleRuler(e.target.checked);
  $("#b-cn-on").onchange = (e) => { settings.book.contentNotes = e.target.checked; saveSettings(); };
  $("#b-focus").onclick = async (e) => { const x = e.target.closest("[data-min]"); if (x) (await import("../focus.js")).startFocus(Number(x.dataset.min)); };
  $("#b-vertical")?.addEventListener("change", (e) => { const p = B.pos; b.vertical = e.target.checked; saveSettings(); keepBookLook(); applyStyle(); syncBold(); layout(); requestAnimationFrame(() => goTo(p, false)); setTimeout(() => goTo(p, false), 60); });
  $("#b-ruby")?.addEventListener("change", (e) => { b.ruby = e.target.checked; saveSettings(); keepBookLook(); applyStyle(); });
  $("#b-edition")?.addEventListener("click", async (e) => {
    const x = e.target.closest("[data-ed]"); if (!x) return;
    const want = x.dataset.ed === "illustrated";
    if (!!B.item.source.illustrated === want) return;
    const item = B.item, frac = (B.cum[B.pos] || 0) / Math.max(1, B.totalWords);
    item.source.illustrated = want;
    await saveItem(item);
    await openBook(item, { from: 0 });
    // Keep roughly the same place in the other edition.
    const target = frac * B.totalWords;
    let p = 0; while (p < B.cum.length - 1 && B.cum[p + 1] <= target) p++;
    setTimeout(() => goTo(p, false), 200);
  });
}

// ---------- bookmarks ----------
async function toggleBookmark() {
  const i = B.marks.findIndex((m) => Math.abs(m.pos - B.pos) <= 1);
  if (i >= 0) { B.marks.splice(i, 1); toast("Bookmark removed."); }
  else { B.marks.push({ pos: B.pos, created: Math.floor(Date.now() / 1000) }); B.marks.sort((a, b) => a.pos - b.pos); toast("Bookmarked."); }
  await setMarks("bookmarks", B.item.id, B.marks);
  onMove(); if (B.panel === "notes") drawNotes();
}

// ---------- highlights ----------
function wrapText(block, text, attrs) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const nodes = []; let full = "";
  while (walker.nextNode()) { nodes.push({ n: walker.currentNode, s: full.length }); full += walker.currentNode.nodeValue; }
  const at = full.indexOf(text);
  if (at < 0) return false;
  const end = at + text.length;
  for (const { n, s } of nodes) {
    const e = s + n.nodeValue.length;
    if (e <= at || s >= end) continue;
    const a = Math.max(0, at - s), b = Math.min(n.nodeValue.length, end - s);
    const r = document.createRange(); r.setStart(n, a); r.setEnd(n, b);
    const mark = document.createElement("mark");
    Object.entries(attrs).forEach(([k, v]) => mark.setAttribute(k, v));
    try { r.surroundContents(mark); } catch {}
  }
  return true;
}
function renderHighlights() {
  $$("mark[data-h]", $("#b-text")).forEach((m) => m.replaceWith(...m.childNodes));
  B.hls.forEach((h, i) => { const blk = B.blocks[h.p]; if (blk) wrapText(blk, h.text, { "data-h": i, class: h.color && h.color !== "yellow" ? "c-" + h.color : "" }); });
}
function selectionPopup() {
  document.querySelector(".sel-pop")?.remove();
  const sel = getSelection();
  if (!sel || sel.isCollapsed || !B.item) return;
  const text = sel.toString().trim();
  const range = sel.getRangeAt(0);
  const blk = (range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement)?.closest("[data-p]");
  if (!text || !blk || !$("#b-text").contains(blk) || text.length > 1500) return;
  const rect = range.getBoundingClientRect();
  const pop = document.createElement("div");
  pop.className = "sel-pop";
  pop.innerHTML = `${[["yellow", "#ffe08a"], ["green", "#8fd18f"], ["blue", "#8fb8f2"], ["pink", "#f29ac0"]].map(([c, hex]) => `<button type="button" data-c="${c}" aria-label="Highlight ${c}"><span class="dot" style="background:${hex}"></span></button>`).join("")}
    <button type="button" data-a="note">${icon("edit")}Note</button><button type="button" data-a="define">${icon("search")}${/\s/.test(text) ? "Look up" : "Define"}</button><button type="button" data-a="copy">Copy</button>${text.length <= 600 ? `<button type="button" data-a="card" aria-label="Make a quote card image">Card</button>` : ""}<button type="button" data-a="speak" aria-label="Read aloud from here">${icon("speak")}</button>`;
  document.body.append(pop);
  pop.style.left = clamp(rect.left + rect.width / 2 - pop.offsetWidth / 2, 8, innerWidth - pop.offsetWidth - 8) + "px";
  pop.style.top = (rect.top > 60 ? rect.top - pop.offsetHeight - 8 : rect.bottom + 8) + "px";
  const firstLine = text.split("\n")[0].trim();
  const add = async (color, note = "") => {
    B.hls.push({ p: Number(blk.dataset.p), text: firstLine.length > 3 ? firstLine : text, color, note, created: Math.floor(Date.now() / 1000) });
    await setMarks("highlights", B.item.id, B.hls);
    sel.removeAllRanges(); pop.remove(); renderHighlights(); if (B.panel === "notes") drawNotes();
    return B.hls.length - 1;
  };
  pop.addEventListener("mousedown", (e) => e.preventDefault());
  pop.addEventListener("click", async (e) => {
    const c = e.target.closest("[data-c]"), a = e.target.closest("[data-a]")?.dataset.a;
    if (c) { await add(c.dataset.c); toast("Highlighted."); }
    if (a === "note") editHighlight(await add("yellow"));
    if (a === "copy") { try { await navigator.clipboard.writeText(text); toast("Copied."); } catch { toast("Couldn't copy."); } pop.remove(); }
    if (a === "speak") { pop.remove(); sel.removeAllRanges(); speak(Number(blk.dataset.p)); }
    if (a === "define") { pop.remove(); lookUp(text, blk.textContent); }
    if (a === "card") {
      pop.remove();
      const { quoteCard, saveBlob } = await import("../lookup.js");
      const blob = await quoteCard({ text, title: B.item.title, author: B.item.author }, ["paper", "sepia", "matcha"].includes(settings.book.theme) ? settings.book.theme : "night");
      saveBlob(blob, `${B.item.title.slice(0, 40).replace(/[^\w\s-]/g, "")} quote.png`);
      toast("Quote card saved as an image.");
    }
  });
}
async function editHighlight(i) {
  const h = B.hls[i]; if (!h) return;
  const { modal } = await import("../util.js");
  const m = modal({ title: "Highlight", body: `<blockquote style="margin:0 0 14px;padding-left:12px;border-left:3px solid var(--accent);font-family:var(--f-book)">${esc(h.text)}</blockquote>
    <label class="lbl" for="hl-note">Note</label><textarea class="field" id="hl-note" rows="4" style="font-family:var(--f-body);font-size:14px" autofocus>${esc(h.note || "")}</textarea>`,
    actions: `<button class="btn btn-ghost" type="button" id="hl-del" style="margin-right:auto;color:var(--bad)">Remove highlight</button><button class="btn btn-accent" type="button" id="hl-save">Save</button>` });
  $("#hl-save", m.root).onclick = async () => { h.note = $("#hl-note", m.root).value.trim(); await setMarks("highlights", B.item.id, B.hls); m.close(); if (B.panel === "notes") drawNotes(); };
  $("#hl-del", m.root).onclick = async () => { B.hls.splice(i, 1); await setMarks("highlights", B.item.id, B.hls); m.close(); renderHighlights(); if (B.panel === "notes") drawNotes(); };
}

// ---------- read aloud ----------
function speak(from = B.pos) {
  if (!("speechSynthesis" in window)) return toast("Read aloud isn't available in this browser.");
  if (B.speaking) return stopSpeak();
  B.speaking = true; $("#b-speak").setAttribute("aria-pressed", "true");
  let p = from;
  const voice = speechSynthesis.getVoices().find((v) => v.name === settings.book.voice);
  const next = () => {
    if (!B.speaking || !B.item) return;
    $$(".speaking").forEach((x) => x.classList.remove("speaking"));
    while (p < B.blocks.length && (!B.blocks[p].textContent.trim() || B.blocks[p].tagName === "IMG")) p++;
    if (p >= B.blocks.length) return stopSpeak();
    B.speakP = p;
    if (B.sleep && ((B.sleep.at && Date.now() >= B.sleep.at) || (B.sleep.ch != null && p >= B.sleep.ch))) {
      setSleep(null); stopSpeak(); goTo(p);
      return toast("Sleep timer: stopped reading aloud. Your place is saved.");
    }
    const blk = B.blocks[p];
    blk.classList.add("speaking");
    const r = blk.getBoundingClientRect(), sr = $("#b-scroll").getBoundingClientRect();
    if (r.top < sr.top || r.bottom > sr.bottom || (paged() && (r.left < sr.left || r.right > sr.right))) goTo(p);
    const u = new SpeechSynthesisUtterance(blk.textContent);
    u.rate = settings.book.rate; if (voice) u.voice = voice; if (B.item.lang) u.lang = B.item.lang;
    u.onend = () => { p++; next(); };
    u.onerror = () => stopSpeak();
    speechSynthesis.speak(u);
  };
  speechSynthesis.cancel();
  next();
  toast(B.sleep ? "Reading aloud, sleep timer on." : "Reading aloud. Press R or the speaker to stop.", { action: "Sleep timer", onAction: sleepMenu });
}

// Soundscapes: choose one, or "" for off. Remembers the last one so M can bring it back.
// The reader's margins come alive to match the soundscape (rain, firelight, waves, fireflies), unless turned off.
function syncFx() {
  const fx = $("#b-fx");
  if (fx) fx.dataset.fx = settings.book.ambFx === false ? "" : currentSoundscape() || "";
}
function setAmbience(kind) {
  const b = settings.book;
  if (currentSoundscape()) b.ambLast = currentSoundscape();
  b.ambience = kind || "";
  if (kind) {
    if (!playSoundscape(kind, ambVol())) { toast("Soundscapes aren't available in this browser."); b.ambience = ""; }
    else toast(`Soundscape: ${SOUNDSCAPES.find((x) => x[0] === kind)?.[1] || kind}. Press M to toggle.`);
  } else { stopSoundscape(); toast("Soundscape off."); }
  saveSettings();
  syncFx();
  if (B.panel === "style") drawStyle();
}

// Sleep timer for read aloud: stop after some minutes, or at the end of the chapter.
async function sleepMenu() {
  const { menu } = await import("../util.js");
  const btn = $("#b-speak"); if (!btn) return;
  menu(btn, [
    ...[10, 15, 30, 45, 60].map((m) => ({ label: `Stop in ${m} minutes`, icon: "sleep", run: () => setSleep({ at: Date.now() + m * 60_000 }, `Read aloud stops in ${m} minutes.`) })),
    { label: "Stop at the end of this chapter", icon: "toc", run: () => {
      const from = B.speaking ? B.speakP : B.pos;
      const nx = B.toc.find((t) => t.p > from);
      setSleep({ ch: nx ? nx.p : B.blocks.length }, nx ? "Read aloud stops at the end of this chapter." : "Read aloud stops at the end of the book.");
    } },
    ...(B.sleep ? ["-", { label: "Turn off sleep timer", icon: "x", run: () => setSleep(null, "Sleep timer off.") }] : []),
  ]);
}
function setSleep(s, msg) {
  B.sleep = s;
  const btn = $("#b-speak");
  if (btn) { btn.classList.toggle("sleep-on", !!s); btn.title = s ? "Read aloud (R) · sleep timer on" : "Read aloud (R)"; }
  if (msg) toast(msg);
}
function stopSpeak() {
  B.speaking = false;
  try { speechSynthesis.cancel(); } catch {}
  $$(".speaking").forEach((x) => x.classList.remove("speaking"));
  $("#b-speak")?.setAttribute("aria-pressed", "false");
}

// ---------- wiring ----------
function wire() {
  $("#b-close").onclick = () => closeBook();
  $("#b-bm").onclick = toggleBookmark;
  $("#b-speak").onclick = () => speak();
  $("#b-more").onclick = async () => {
    const { menu } = await import("../util.js");
    menu($("#b-more"), [
      { label: B.autoOn ? "Stop auto-scroll" : "Auto-scroll", icon: "play", run: () => toggleAuto() },
      { label: "Search in book", icon: "search", run: () => openPanel("search") },
      { label: "Bookmarks and highlights", icon: "highlight", run: () => openPanel("notes") },
      { label: "Look up a word", icon: "globe", run: () => openPanel("lookup") },
      { label: "X-Ray: people and places", icon: "xray", run: () => openPanel("xray") },
      { label: "Recap: where was I?", icon: "toc", run: () => showRecap(null) },
      { label: B.sleep ? "Sleep timer (on)" : "Sleep timer", icon: "sleep", run: sleepMenu },
      { label: currentSoundscape() ? "Soundscape (on)" : "Soundscape", icon: "headphones", run: () => { if (B.panel !== "style") openPanel("style"); setTimeout(() => $("#b-amb-row")?.scrollIntoView({ block: "center", behavior: "smooth" }), 80); } },
    ]);
  };
  $("#b-speak").oncontextmenu = (e) => { e.preventDefault(); sleepMenu(); };
  $("#b-auto").onclick = () => toggleAuto();
  $$("[data-panel]").forEach((b) => (b.onclick = () => openPanel(b.dataset.panel)));
  $("#b-prev").onclick = () => turn(-1);
  $("#b-next").onclick = () => turn(1);
  $("#b-scrub").oninput = (e) => {
    const target = (Number(e.target.value) / 1000) * B.totalWords;
    let lo = 0, hi = B.cum.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (B.cum[mid] <= target) lo = mid; else hi = mid - 1; }
    goTo(lo, false);
  };
  $(".b-body").addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") placeRuler(e.clientY); });
  $(".b-body").addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") placeRuler(e.clientY); });
  if (settings.book.ruler) setTimeout(() => toggleRuler(true), 50);
  const sc = $("#b-scroll");
  sc.addEventListener("scroll", debounce(onMove, 120), { passive: true });
  // Immersive reading: the bars slide away while you read down, and come back when you scroll up,
  // move the pointer to the top edge, or open a panel.
  let lastY = 0;
  sc.addEventListener("scroll", () => {
    if (paged() || vertical()) return;
    const y = sc.scrollTop, d = y - lastY;
    if (Math.abs(d) < 8) return;
    el().classList.toggle("immersive", d > 0 && y > 140 && $("#b-side").hidden);
    lastY = y;
  }, { passive: true });
  el().addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && e.clientY < 76) el().classList.remove("immersive"); });
  sc.addEventListener("wheel", (e) => {
    if (vertical() && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); sc.scrollLeft -= e.deltaY; }
  }, { passive: false });
  sc.addEventListener("click", (e) => {
    if (getSelection()?.toString() || e.target.closest("a, mark, [data-href]")) return;
    if (!paged()) el().classList.toggle("focus");
  });
  document.addEventListener("selectionchange", onSel);
  addEventListener("resize", onResize);
}
const onSel = debounce(() => { if (B.item) selectionPopup(); }, 300);
const onResize = debounce(() => { if (B.item && paged()) { const p = B.pos; layout(); goTo(p, false); } }, 200);

// A short note on closing: how long this sitting was and how far it got you.
function sessionSummary() {
  const s = B.sess;
  if (!s || !B.cum?.length || !B.totalWords) return;
  const secs = (Date.now() - s.t) / 1000;
  const words = Math.max(0, (B.cum[B.pos] || 0) - (B.cum[s.from] || 0));
  if (secs < 60 && words < 150) return;
  const pct = (p) => Math.round(((B.cum[p] || 0) / B.totalWords) * 100);
  const done = B.pos >= B.blocks.length - 2;
  const parts = [secs < 60 ? "under a minute" : fmtMinutes(secs)];
  if (words) parts.push(`${words.toLocaleString()} words`);
  parts.push(`${pct(s.from)}% → ${done ? 100 : pct(B.pos)}%`);
  const next = done ? B.next : null;
  toast(`${done ? `Finished “${B.item.title}”. ` : ""}This sitting: ${parts.join(" · ")}`, next ? { action: "Read next", onAction: () => readNext(next), ms: 8000 } : { ms: 5000 });
}

const LOOK_KEYS = ["theme", "font", "size", "lineHeight", "width", "align", "layout", "pageFx", "bold"];
const pickBookLook = (b) => Object.fromEntries(LOOK_KEYS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));
// While a book has its own settings, every change is saved to that book, and your usual settings come back on close.
function keepBookLook() {
  if (!B.globalBook || !B.item) return;
  const id = B.item.id, look = pickBookLook(settings.book);
  kvGet("bookPrefs", {}).then((all) => kvSet("bookPrefs", { ...all, [id]: look }));
}
function restoreGlobalLook() {
  if (!B.globalBook) return;
  keepBookLook();
  Object.assign(settings.book, pickBookLook(B.globalBook));
  B.globalBook = null;
  saveSettings();
}
addEventListener("pagehide", restoreGlobalLook);

export function closeBook(silent = false) {
  if (!B.item) return;
  restoreGlobalLook();
  stopSpeak();
  boldIO?.disconnect(); boldIO = null;
  B.autoOn = false; clearInterval(B.autoRaf);
  setProgress(B.item.id, { pos: savedPos(), total: B.blocks.length || 1 });
  B.timer?.stop();
  if (!silent) { sessionSummary(); stopSoundscape(); }
  document.removeEventListener("selectionchange", onSel);
  removeEventListener("resize", onResize);
  document.querySelector(".sel-pop")?.remove();
  B.urls.forEach((u) => URL.revokeObjectURL(u)); B.urls = [];
  const r = el(); r.hidden = true; r.innerHTML = "";
  document.body.style.overflow = "";
  B.item = null; B.panel = null; B.epubToc = null; B.xray = null; B.xrayTexts = null; B.sess = null; B.next = null; B.sleep = null;
  if (!silent) import("../main.js").then((m) => { if (!location.hash || /^#(home|library|item|series|books)/.test(location.hash)) m.refresh(); });
}

document.addEventListener("keydown", (e) => {
  if (el().hidden || !B.item || e.target.matches?.("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (document.querySelector(".cn-gate")) { if (k === "Escape") { e.preventDefault(); closeBook(); } return; }
  if (k === "Escape") { e.preventDefault(); if ($(".b-recap", el())) $(".b-recap", el()).remove(); else if (!$("#b-side").hidden) { $("#b-side").hidden = true; B.panel = null; relayout(); } else closeBook(); }
  else if (vertical() && (k === "ArrowLeft" || k === "ArrowRight")) { e.preventDefault(); turn(k === "ArrowLeft" ? 1 : -1); }
  else if (k === "ArrowRight" || (k === " " && paged()) || k === "PageDown") { if (paged() || k !== "ArrowRight") { e.preventDefault(); turn(1); } }
  else if (k === "ArrowLeft" || k === "PageUp") { if (paged() || k === "PageUp") { e.preventDefault(); turn(-1); } }
  else if (k === "t" || k === "T") openPanel("toc");
  else if (k === "x" || k === "X") openPanel("xray");
  else if (k === "/") { e.preventDefault(); openPanel("search"); }
  else if (k === "b" || k === "B") toggleBookmark();
  else if (k === "r" || k === "R") speak();
  else if (k === "s" || k === "S") sleepMenu();
  else if (k === "m" || k === "M") setAmbience(currentSoundscape() ? "" : (settings.book.ambLast || "rain"));
  else if (k === "l" || k === "L") toggleRuler();
  else if (k === "a" || k === "A") toggleAuto();
  else if (k === "]" && B.autoOn) { B.autoMul = Math.min(3, B.autoMul + 0.15); toast(`Auto-scroll ${Math.round(B.autoMul * 100)}%`); }
  else if (k === "[" && B.autoOn) { B.autoMul = Math.max(0.3, B.autoMul - 0.15); toast(`Auto-scroll ${Math.round(B.autoMul * 100)}%`); }
  else if (k === "d" || k === "D") { const t = getSelection()?.toString().trim(); if (t) { document.querySelector(".sel-pop")?.remove(); lookUp(t); } else openPanel("lookup"); }
  else if (k === "?") import("../main.js").then((m) => m.showShortcuts());
  else if (k === "+" || k === "=") { settings.book.size = Math.min(32, settings.book.size + 1); saveSettings(); keepBookLook(); applyStyle(); relayout(); }
  else if (k === "-") { settings.book.size = Math.max(13, settings.book.size - 1); saveSettings(); keepBookLook(); applyStyle(); relayout(); }
});
