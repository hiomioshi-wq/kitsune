// Things you own outside Kitsune: physical books and manga (scan their barcodes), Kindle highlights, Libby history.
import { $, $$, esc, icon, toast, plural, coverHtml } from "../util.js";
import { lib, getItem, saveItem, saveItems, getMarks, setMarks } from "../store.js";
import { setCrumbs } from "../main.js";

const FORMATS = { physical: "Physical copy", kindle: "Kindle", kobo: "Kobo", apple: "Apple Books", play: "Google Play Books", comixology: "Comixology", viz: "VIZ app", bookwalker: "BookWalker", other: "Somewhere else" };
const MANGA_PUBLISHERS = /viz|kodansha|yen press|seven seas|dark horse|tokyopop|square enix|vertical|one peace|denpa|j-novel|ghost ship|airship|udon|shueisha|shogakukan|kadokawa|digital manga/i;
const now = () => Math.floor(Date.now() / 1000);

export async function render(view, _name, params) {
  const tab = params[0] || "scan";
  setCrumbs([["Link & import", "link"], [{ scan: "Scan your shelf", kindle: "Kindle highlights", libby: "Libby history" }[tab] || "Your shelf", ""]]);
  view.innerHTML = `
    <div class="page-head"><div><p class="eyebrow">Things you own</p><h1 class="h1">Your shelf, everywhere</h1>
      <p class="lede">Catalog the physical books and manga on your shelves, and bring in what you read on Kindle and Libby. Nothing is uploaded; it all stays in this browser.</p></div></div>
    <div class="tabs" role="tablist">${[["scan", "Scan your shelf", "zoom"], ["kindle", "Kindle highlights", "highlight"], ["libby", "Libby history", "clock"]].map(([k, l, ic]) => `<button role="tab" type="button" data-otab="${k}" aria-selected="${tab === k}">${icon(ic)}${l}</button>`).join("")}</div>
    <div id="own-body"></div>`;
  $$("[data-otab]", view).forEach((b) => (b.onclick = () => (location.hash = "own/" + b.dataset.otab)));
  const body = $("#own-body", view);
  if (tab === "kindle") return kindle(body);
  if (tab === "libby") return libby(body);
  return scan(body);
}

// ---------- scan your shelf: ISBN barcodes → library entries ----------
function isbnOk(s) {
  s = String(s).replace(/[^0-9X]/gi, "").toUpperCase();
  if (s.length === 13 && /^\d+$/.test(s)) return [...s].reduce((a, d, i) => a + Number(d) * (i % 2 ? 3 : 1), 0) % 10 === 0 ? s : null;
  if (s.length === 10) return [...s].reduce((a, d, i) => a + (d === "X" ? 10 : Number(d)) * (10 - i), 0) % 11 === 0 ? s : null;
  return null;
}

export async function lookupIsbn(isbn) {
  const r = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, { signal: AbortSignal.timeout(15_000) });
  const b = (await r.json())[`ISBN:${isbn}`];
  if (b) return {
    title: b.title + (b.subtitle && /vol|volume|\d/i.test(b.subtitle) ? ": " + b.subtitle : ""), author: (b.authors || []).map((a) => a.name).join(", "),
    publisher: b.publishers?.[0]?.name || "", year: (b.publish_date || "").match(/\d{4}/)?.[0] || "", pages: b.number_of_pages || 0,
    cover: b.cover?.medium || b.cover?.large || null, subjects: (b.subjects || []).map((x) => x.name).slice(0, 12), url: b.url,
  };
  // Not in Open Library: try Google Books.
  const g = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, { signal: AbortSignal.timeout(15_000) }).then((x) => x.json()).catch(() => null);
  const v = g?.items?.[0]?.volumeInfo;
  if (v) return { title: v.title + (v.subtitle ? ": " + v.subtitle : ""), author: (v.authors || []).join(", "), publisher: v.publisher || "", year: (v.publishedDate || "").slice(0, 4), pages: v.pageCount || 0,
    cover: v.imageLinks?.thumbnail?.replace("http:", "https:") || null, subjects: v.categories || [], url: v.infoLink };
  return null;
}

function toItem(isbn, b, format) {
  const isManga = MANGA_PUBLISHERS.test(b.publisher) || b.subjects.some((s) => /manga|comic|graphic novel/i.test(s));
  const vol = b.title.match(/(?:vol(?:ume)?\.?|#)\s*(\d+)/i)?.[1] || b.title.match(/,\s*(\d+)\s*$/)?.[1];
  const series = vol ? b.title.replace(/[,:]?\s*(?:vol(?:ume)?\.?|#)?\s*\d+\s*$/i, "").replace(/[,:]\s*(?:vol(?:ume)?\.?|#)\s*\d+.*$/i, "").trim() : "";
  return {
    id: "isbn-" + isbn, type: isManga ? "manga" : "book", title: b.title, series: series || (isManga ? b.title : ""), volume: vol ? Number(vol) : undefined,
    author: b.author, cover: b.cover || `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`, year: b.year, pages: isManga ? 0 : b.pages,
    source: { kind: "shelf", format, isbn, publisher: b.publisher, url: b.url }, origin: FORMATS[format], tags: ["owned", FORMATS[format].toLowerCase()],
    description: [b.publisher, b.year, b.pages ? b.pages + " pages" : ""].filter(Boolean).join(" · "), status: "unread", rating: 0, added: now(),
  };
}

function scan(body) {
  const canDetect = "BarcodeDetector" in window;
  body.innerHTML = `
    <div class="own-grid">
      <div class="panel">
        <h3 class="h3">Add by barcode</h3>
        <p class="muted" style="margin:0 0 12px;font-size:13.5px">Point your camera at the barcode on the back of a book or manga volume. Each one is looked up and added to your library as something you own.</p>
        ${canDetect ? `<div class="own-cam" id="ow-cam" hidden><video id="ow-video" playsinline muted></video><div class="own-aim"></div></div>
          <div class="linkgrid" style="margin:10px 0"><button class="btn btn-accent" type="button" id="ow-start">${icon("zoom")}Start camera</button>
          <label class="btn" style="cursor:pointer">${icon("upload")}Photo of a barcode<input type="file" accept="image/*" id="ow-photo" hidden></label></div>`
        : `<p class="status">This browser can't read barcodes from the camera (Chrome and Edge on Android, Mac and Windows can). Type or paste ISBNs instead.</p>`}
        <label class="lbl" for="ow-isbn" style="margin-top:8px">Or type ISBNs, one per line</label>
        <textarea class="field" id="ow-isbn" rows="3" placeholder="9781421506630"></textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px">
          <label class="lbl" for="ow-format" style="margin:0">Where it lives</label>
          <select class="field" id="ow-format" style="width:auto">${Object.entries(FORMATS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select>
          <button class="btn btn-accent" type="button" id="ow-add">${icon("plus")}Add</button></div>
        <p class="status" id="ow-s"></p>
      </div>
      <div><div class="section-head"><h3 class="h3">Added this session</h3><span class="muted" id="ow-n" style="font-size:13px"></span></div><div class="list" id="ow-out"></div>
        <p class="muted" style="font-size:13px;margin-top:14px">Owned copies show in your library with a “${esc(FORMATS.physical)}” tag. Manga volumes group into their series automatically.</p></div>
    </div>`;
  const out = $("#ow-out", body), st = $("#ow-s", body);
  let added = 0;
  const seen = new Set();
  const addIsbn = async (raw) => {
    const isbn = isbnOk(raw);
    if (!isbn) { st.className = "status err"; st.textContent = `“${raw}” isn't a valid ISBN.`; return; }
    if (seen.has(isbn)) return; seen.add(isbn);
    const format = $("#ow-format", body).value;
    if (getItem("isbn-" + isbn)) { st.className = "status"; st.textContent = "Already in your library."; return; }
    st.className = "status"; st.textContent = `Looking up ${isbn}…`;
    try {
      const b = await lookupIsbn(isbn);
      if (!b) { st.className = "status err"; st.textContent = `No book found for ${isbn}. You can add it by hand from Library → Add.`; seen.delete(isbn); return; }
      const item = await saveItem(toItem(isbn, b, format));
      added++; $("#ow-n", body).textContent = plural(added, "item");
      out.insertAdjacentHTML("afterbegin", `<a class="row" href="#item/${esc(item.id)}">${coverHtml(item.cover, item.title)}<div class="row-main"><strong>${esc(item.title)}</strong><span class="sub">${esc([item.author, item.type === "manga" ? "Manga" : "Book", FORMATS[format]].filter(Boolean).join(" · "))}</span></div></a>`);
      st.textContent = `Added “${item.title}”.`;
      navigator.vibrate?.(60);
    } catch (e) { st.className = "status err"; st.textContent = "Lookup failed: " + e.message; seen.delete(isbn); }
  };
  $("#ow-add", body).onclick = async () => { for (const line of $("#ow-isbn", body).value.split(/[\s,;]+/).filter(Boolean)) await addIsbn(line); $("#ow-isbn", body).value = ""; };
  if (!canDetect) return;
  const detector = new BarcodeDetector({ formats: ["ean_13", "upc_a"] });
  let stream = null, timer = null;
  const stop = () => { clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); stream = null; $("#ow-cam", body).hidden = true; $("#ow-start", body).innerHTML = `${icon("zoom")}Start camera`; };
  $("#ow-start", body).onclick = async () => {
    if (stream) return stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const v = $("#ow-video", body); v.srcObject = stream; await v.play();
      $("#ow-cam", body).hidden = false; $("#ow-start", body).innerHTML = `${icon("x")}Stop camera`;
      timer = setInterval(async () => { try { for (const c of await detector.detect(v)) if (/^(97[89])?\d{9}[\dX]$/.test(c.rawValue)) addIsbn(c.rawValue); } catch {} }, 400);
    } catch (e) { st.className = "status err"; st.textContent = "Couldn't open the camera: " + e.message; }
  };
  $("#ow-photo", body).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const codes = await detector.detect(await createImageBitmap(f)); if (!codes.length) throw new Error("No barcode found in that photo."); for (const c of codes) await addIsbn(c.rawValue); }
    catch (err) { st.className = "status err"; st.textContent = err.message; }
  };
  window.addEventListener("hashchange", stop, { once: true });
}

// ---------- Kindle "My Clippings.txt" ----------
export function parseClippings(text) {
  const out = [];
  for (const block of text.replace(/\r/g, "").replace(/^﻿/, "").split(/^={5,}\s*$/m)) {
    const lines = block.split("\n").map((l) => l.trim());
    while (lines.length && !lines[0]) lines.shift();
    if (lines.length < 2) continue;
    const head = lines[0].replace(/^﻿/, "");
    const m = head.match(/^(.*)\(([^()]*)\)\s*$/);
    const title = (m ? m[1] : head).trim(), author = m ? m[2].trim() : "";
    const meta = lines[1];
    const kind = /note/i.test(meta) ? "note" : /bookmark/i.test(meta) ? "bookmark" : "highlight";
    const loc = meta.match(/(?:location|loc\.?|位置)\s*(\d+)(?:-(\d+))?/i);
    const page = meta.match(/page\s*(\d+)/i)?.[1];
    const date = meta.split("|").pop().replace(/^\s*added on\s*/i, "").trim();
    const content = lines.slice(2).join("\n").trim();
    out.push({ title, author, kind, loc: loc ? Number(loc[1]) : null, locEnd: loc?.[2] ? Number(loc[2]) : null, page: page ? Number(page) : null, date, text: content });
  }
  return out;
}

function kindle(body) {
  body.innerHTML = `<div class="own-grid"><div class="panel"><h3 class="h3">Import Kindle highlights</h3>
      <p class="muted" style="margin:0 0 12px;font-size:13.5px">Plug your Kindle into a computer, open its <code>documents</code> folder and choose <code>My Clippings.txt</code>. Your highlights and notes appear in Notebook, and each book is added to your library as owned on Kindle.</p>
      <label class="drop">${icon("upload")}<input type="file" id="kc-file" accept=".txt,text/plain"><strong>Choose My Clippings.txt</strong><span>Highlights, notes and bookmarks from every book on the device.</span></label>
      <p class="status" id="kc-s"></p></div>
    <div id="kc-out"></div></div>`;
  $("#kc-file", body).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const st = $("#kc-s", body);
    try {
      const clips = parseClippings(await f.text());
      if (!clips.length) throw new Error("No clippings found. Is this the My Clippings.txt file from a Kindle?");
      const books = new Map();
      for (const c of clips) { const k = c.title.toLowerCase(); if (!books.has(k)) books.set(k, { title: c.title, author: c.author, clips: [] }); books.get(k).clips.push(c); }
      let hlCount = 0;
      const rows = [];
      for (const b of books.values()) {
        // Match an existing library item by title, or add the book as owned on Kindle.
        const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        let item = lib.items.find((i) => norm(i.title) === norm(b.title));
        if (!item) item = await saveItem({ id: "kindle-" + norm(b.title).replace(/ /g, "-").slice(0, 80), type: "book", title: b.title, author: b.author,
          source: { kind: "shelf", format: "kindle" }, origin: "Kindle", tags: ["owned", "kindle"], status: "reading", rating: 0, added: now() });
        const marks = await getMarks("highlights", item.id);
        const have = new Set(marks.map((h) => h.text));
        const hls = b.clips.filter((c) => c.kind === "highlight" && c.text && !have.has(c.text));
        const notes = b.clips.filter((c) => c.kind === "note" && c.text);
        for (const h of hls) {
          // A Kindle note sits at the end location of the highlight it belongs to.
          const note = notes.find((n) => n.loc != null && (n.loc === h.locEnd || n.loc === h.loc));
          marks.push({ p: -1, text: h.text, color: "yellow", note: note?.text || "", loc: h.loc, page: h.page, created: Date.parse(h.date) / 1000 || now(), from: "kindle" });
        }
        for (const n of notes.filter((n) => !hls.some((h) => n.loc === h.locEnd || n.loc === h.loc))) if (!have.has(n.text)) marks.push({ p: -1, text: n.text, color: "blue", note: "", loc: n.loc, created: Date.parse(n.date) / 1000 || now(), from: "kindle" });
        await setMarks("highlights", item.id, marks);
        hlCount += hls.length;
        rows.push({ item, n: hls.length + notes.length });
      }
      st.className = "status"; st.textContent = `Imported ${plural(hlCount, "highlight")} from ${plural(books.size, "book")}.`;
      $("#kc-out", body).innerHTML = `<div class="section-head"><h3 class="h3">Books</h3><a class="link-btn" href="#notebook">Open Notebook ${icon("next")}</a></div><div class="list">${rows.sort((a, b) => b.n - a.n).map((r) => `<a class="row" href="#item/${esc(r.item.id)}"><div class="row-main"><strong>${esc(r.item.title)}</strong><span class="sub">${esc(r.item.author || "")} · ${plural(r.n, "clipping")}</span></div></a>`).join("")}</div>`;
    } catch (err) { st.className = "status err"; st.textContent = err.message; }
  };
}

// ---------- Libby timeline (export from Libby → Shelf → Timeline → Actions → Export) ----------
function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
export function parseLibby(text) {
  const t = text.trim();
  if (t.startsWith("{") || t.startsWith("[")) {
    const j = JSON.parse(t);
    return (j.timeline || j).map((e) => ({ title: e.title?.text || e.title || "", author: e.author || "", isbn: e.isbn || "", activity: e.activity || "", when: e.timestamp || e.date || "",
      library: e.library?.text || e.library || "", format: e.cover?.format || e.format || "", cover: e.cover?.url || null }));
  }
  const rows = parseCsv(t); const h = rows.shift().map((x) => x.trim().toLowerCase());
  const col = (n) => h.indexOf(n);
  return rows.filter((r) => r.length > 2).map((r) => ({ title: r[col("title")] || "", author: r[col("author")] || "", isbn: r[col("isbn")] || "", activity: r[col("activity")] || "",
    when: r[col("timestamp")] || "", library: r[col("library")] || "", format: r[col("format")] || "", cover: col("cover") >= 0 ? r[col("cover")] : null }));
}

function libby(body) {
  body.innerHTML = `<div class="own-grid"><div class="panel"><h3 class="h3">Import your Libby history</h3>
      <p class="muted" style="margin:0 0 12px;font-size:13.5px">In Libby, open <strong>Shelf → Timeline → Actions → Export timeline</strong> and save the JSON or CSV file. Every book you borrowed is added to your library as read, with a link to find it in your library again.</p>
      <label class="drop">${icon("upload")}<input type="file" id="lb-file" accept=".json,.csv,application/json,text/csv"><strong>Choose the timeline file</strong><span>JSON or CSV from Libby</span></label>
      <p class="status" id="lb-s"></p></div><div id="lb-out"></div></div>`;
  $("#lb-file", body).onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const st = $("#lb-s", body);
    try {
      const events = parseLibby(await f.text()).filter((x) => x.title);
      if (!events.length) throw new Error("No books found in that file. Export the timeline from Libby as JSON or CSV.");
      const books = new Map();
      for (const ev of events) { const k = (ev.isbn || ev.title).toLowerCase(); const b = books.get(k) || { ...ev, events: [] }; b.events.push(ev); books.set(k, b); }
      const items = [];
      for (const b of books.values()) {
        const audio = /audio/i.test(b.format);
        const id = "libby-" + (b.isbn || b.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-")).slice(0, 80);
        if (getItem(id)) continue;
        const borrowed = b.events.some((x) => /borrow/i.test(x.activity));
        items.push({ id, type: audio ? "audio" : "book", title: b.title, author: b.author, cover: b.cover || (b.isbn ? `https://covers.openlibrary.org/b/isbn/${b.isbn}-M.jpg?default=false` : null),
          source: { kind: "shelf", format: "libby", isbn: b.isbn, library: b.library }, origin: `Libby${b.library ? " · " + b.library : ""}`, tags: ["libby", audio ? "audiobook" : "ebook"],
          status: borrowed ? "completed" : "plan", rating: 0, added: Math.floor((Date.parse(b.events.at(-1).when) || Date.now()) / 1000) });
      }
      await saveItems(items);
      st.className = "status"; st.textContent = `Added ${plural(items.length, "title")} from ${plural(events.length, "timeline entry", "timeline entries")}.`;
      $("#lb-out", body).innerHTML = items.length ? `<div class="section-head"><h3 class="h3">Added</h3><a class="link-btn" href="#library">Open library ${icon("next")}</a></div><div class="list">${items.slice(0, 60).map((i) => `<a class="row" href="#item/${esc(i.id)}">${coverHtml(i.cover, i.title)}<div class="row-main"><strong>${esc(i.title)}</strong><span class="sub">${esc([i.author, i.origin].filter(Boolean).join(" · "))}</span></div></a>`).join("")}</div>` : "";
    } catch (err) { st.className = "status err"; st.textContent = err.message; }
  };
}
