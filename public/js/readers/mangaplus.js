// Manga reader extras:
//  - Clip a panel: drag a box over the page to save, copy or share just that panel
//  - Auto-turn pages: a hands-free slideshow every few seconds (pauses when you touch the page)
//  - Go to page: type a page number
//  - Rate this volume: stars and a short note, kept with the book in your library
//  - Page notes, a notes-and-bookmarks list, your reading pace, a sleep timer, a random page you've read
import { $, esc, toast, modal } from "../util.js";

// ---------- clip a panel ----------
async function pageBlob(src) {
  try { const r = await fetch(src); if (r.ok) { const b = await r.blob(); if (/^image\//.test(b.type)) return b; } } catch {}
  if (/^https?:/.test(src)) { const r = await fetch("/api/browse/img?url=" + encodeURIComponent(src)); if (r.ok) return r.blob(); }
  throw new Error("This page can't be clipped: its site doesn't let the picture be copied.");
}
export function clipPanel(ctx) {
  const stage = $("#r-stage"), img = [...document.querySelectorAll("#r-pages img")].find((i) => { const r = i.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight; });
  if (!stage || !img) return toast("Open a page first.");
  const ov = document.createElement("div"); ov.style.cssText = "position:fixed;inset:0;z-index:60;cursor:crosshair;background:rgba(0,0,0,.25)";
  ov.innerHTML = `<div style="position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#1c1d33;color:#fff;font:600 13px system-ui;padding:8px 14px;border-radius:99px;pointer-events:none">Drag a box around the panel · Esc to cancel</div><div id="clip-box" style="position:fixed;border:2px dashed #ffd36b;background:rgba(255,211,107,.12);display:none"></div>`;
  document.body.append(ov);
  const box = ov.querySelector("#clip-box"); let sx = 0, sy = 0, drag = false;
  const done = () => { ov.remove(); removeEventListener("keydown", esc2, true); };
  const esc2 = (e) => { if (e.key === "Escape") { e.stopPropagation(); done(); } }; addEventListener("keydown", esc2, true);
  ov.addEventListener("pointerdown", (e) => { drag = true; sx = e.clientX; sy = e.clientY; Object.assign(box.style, { left: sx + "px", top: sy + "px", width: "0", height: "0", display: "block" }); ov.setPointerCapture(e.pointerId); });
  ov.addEventListener("pointermove", (e) => { if (!drag) return; const x = Math.min(sx, e.clientX), y = Math.min(sy, e.clientY); Object.assign(box.style, { left: x + "px", top: y + "px", width: Math.abs(e.clientX - sx) + "px", height: Math.abs(e.clientY - sy) + "px" }); });
  ov.addEventListener("pointerup", async (e) => {
    drag = false; const sel = { x: Math.min(sx, e.clientX), y: Math.min(sy, e.clientY), w: Math.abs(e.clientX - sx), h: Math.abs(e.clientY - sy) }; done();
    if (sel.w < 20 || sel.h < 20) return toast("Drag a bigger box around the panel.");
    // the page under the box, and the box in that page's own pixels
    const target = [...document.querySelectorAll("#r-pages img")].find((i) => { const r = i.getBoundingClientRect(); return sel.x + sel.w / 2 >= r.left && sel.x + sel.w / 2 <= r.right && sel.y + sel.h / 2 >= r.top && sel.y + sel.h / 2 <= r.bottom; }) || img;
    const r = target.getBoundingClientRect(), p = +target.dataset.i;
    try {
      const blob0 = await pageBlob(target.currentSrc || target.src), u0 = URL.createObjectURL(blob0), bmp = new Image(); bmp.src = u0; await bmp.decode(); bmp.width = bmp.naturalWidth || 1000; bmp.height = bmp.naturalHeight || 1500; setTimeout(() => URL.revokeObjectURL(u0), 5000); const kx = bmp.width / r.width, ky = bmp.height / r.height;
      const cx = Math.max(0, (sel.x - r.left) * kx), cy = Math.max(0, (sel.y - r.top) * ky), cw = Math.min(bmp.width - cx, sel.w * kx), ch = Math.min(bmp.height - cy, sel.h * ky);
      if (cw < 10 || ch < 10) return toast("That box isn't over the page.");
      const c = document.createElement("canvas"); c.width = Math.round(cw); c.height = Math.round(ch); c.getContext("2d").drawImage(bmp, cx, cy, cw, ch, 0, 0, c.width, c.height);
      const blob = await new Promise((res) => c.toBlob(res, "image/png")), url = URL.createObjectURL(blob), name = `${(ctx.item().title || "panel").replace(/[^\w\s-]/g, "").trim().slice(0, 40)} p${p + 1} panel.png`;
      const m = modal({ title: `Panel from page ${p + 1}`, body: `<img src="${url}" alt="The clipped panel" style="max-width:100%;max-height:60vh;display:block;margin:0 auto;border-radius:8px">`, actions: `<button class="btn" type="button" id="cp-copy">Copy</button>${navigator.canShare?.({ files: [new File([blob], name, { type: "image/png" })] }) ? `<button class="btn" type="button" id="cp-share">Share</button>` : ""}<button class="btn btn-accent" type="button" id="cp-save">Save</button>`, onClose: () => setTimeout(() => URL.revokeObjectURL(url), 1000) });
      $("#cp-save", m.root).onclick = () => { const a = document.createElement("a"); a.href = url; a.download = name; a.click(); toast("Panel saved."); };
      $("#cp-copy", m.root).onclick = async () => { try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast("Panel copied."); } catch { toast("Couldn't copy here. Save it instead."); } };
      $("#cp-share", m.root)?.addEventListener("click", () => navigator.share({ files: [new File([blob], name, { type: "image/png" })], title: ctx.item().title }).catch(() => {}));
    } catch (err) { toast(err.message || "Couldn't clip that page."); }
  });
}

// ---------- auto-turn ----------
let auto = null;
export function autoTurn(ctx) {
  if (auto) { clearInterval(auto.t); document.removeEventListener("pointerdown", auto.pause, true); auto = null; return toast("Auto-turn stopped."); }
  const secs = +prompt("Turn the page every how many seconds?", localStorage.getItem("kitsune.autoTurn") || "8"); if (!secs || secs < 2) return;
  try { localStorage.setItem("kitsune.autoTurn", String(secs)); } catch {}
  let paused = 0; const pause = () => { paused = Date.now(); };
  auto = { t: setInterval(() => { if (!ctx.isOpen()) { clearInterval(auto?.t); auto = null; return; } if (document.hidden || Date.now() - paused < secs * 1500) return; if (ctx.atEnd()) { clearInterval(auto.t); auto = null; return toast("Reached the end of the volume."); } ctx.go(1); }, secs * 1000), pause };
  document.addEventListener("pointerdown", pause, true);
  toast(`Turning the page every ${secs} seconds. Touching the page pauses it for a moment; press A to stop.`, { ms: 4000 });
}
export const stopAutoTurn = () => { if (auto) { clearInterval(auto.t); document.removeEventListener("pointerdown", auto.pause, true); auto = null; } };

// ---------- go to page ----------
export function goToPage(ctx) {
  const n = ctx.item().pages, v = prompt(`Go to page (1–${n})`, String(ctx.page() + 1)); if (!v) return;
  const p = Math.round(+v); if (!(p >= 1 && p <= n)) return toast(`Pick a page between 1 and ${n}.`);
  ctx.jump(p - 1);
}

// ---------- rate this volume ----------
export async function rateVolume(item) {
  const { saveItem } = await import("../store.js");
  const cur = item.rating || 0;
  const m = modal({ title: "How was it?", body: `<p style="margin-top:0"><b>${esc(item.title)}</b></p><div id="rv-s" style="font-size:34px;letter-spacing:4px;cursor:pointer;user-select:none">${[1, 2, 3, 4, 5].map((n) => `<span data-n="${n}" role="button" aria-label="${n} star${n > 1 ? "s" : ""}">${n <= cur ? "★" : "☆"}</span>`).join("")}</div><label class="lbl" style="margin-top:10px">A note for future you (optional)</label><textarea class="field" id="rv-n" style="width:100%;min-height:80px" placeholder="Best panel, a favourite line, who you'd lend it to…">${esc(item.review || "")}</textarea>`, actions: `<button class="btn" type="button" data-close>Skip</button><button class="btn btn-accent" type="button" id="rv-ok">Save</button>` });
  let stars = cur; const paint = () => m.root.querySelectorAll("#rv-s [data-n]").forEach((s) => (s.textContent = +s.dataset.n <= stars ? "★" : "☆"));
  $("#rv-s", m.root).onclick = (e) => { const s = e.target.closest("[data-n]"); if (s) { stars = +s.dataset.n; paint(); } };
  $("#rv-ok", m.root).onclick = async () => { item.rating = stars; item.review = $("#rv-n", m.root).value.trim().slice(0, 2000); if (stars) item.status = "completed"; await saveItem(item); m.close(); toast(stars ? `Rated ${stars} star${stars > 1 ? "s" : ""}.` : "Saved your note."); };
}

// ---------- page notes ----------
// A note pinned to one page of one volume: kept in your library on this device, listed with your bookmarks.
export async function loadNotes(id) { const { kvGet } = await import("../store.js"); return ((await kvGet("pageNotes", {})) || {})[id] || {}; }
async function saveNotes(id, notes) { const { kvGet, kvSet } = await import("../store.js"); const all = (await kvGet("pageNotes", {})) || {}; const removed = Object.keys(all[id] || {}).filter((p) => !notes[p]); if (removed.length) { const { gone } = await import("../syncgone.js"); for (const p of removed) await gone("notes", id + ":" + p); } if (Object.keys(notes).length) all[id] = notes; else delete all[id]; await kvSet("pageNotes", all); }
export async function notePage(ctx) {
  const it = ctx.item(), p = ctx.page(), notes = await loadNotes(it.id);
  const m = modal({ title: `Note on page ${p + 1}`, body: `<p class="muted" style="margin-top:0">${esc(it.title)}</p><textarea class="field" id="pn-t" style="width:100%;min-height:120px" placeholder="A thought, a translation, a theory, who this character is…">${esc(notes[p]?.text || "")}</textarea>`, actions: `${notes[p] ? `<button class="btn" type="button" id="pn-del">Delete note</button>` : ""}<button class="btn" type="button" data-close>Cancel</button><button class="btn btn-accent" type="button" id="pn-ok">Save note</button>` });
  const ta = $("#pn-t", m.root); setTimeout(() => ta.focus(), 50);
  const fin = async (n) => { await saveNotes(it.id, n); ctx.setNotes(n); m.close(); };
  $("#pn-ok", m.root).onclick = async () => { const text = ta.value.trim().slice(0, 4000); if (text) notes[p] = { text, at: Date.now() }; else delete notes[p]; await fin(notes); toast(text ? `Note saved on page ${p + 1}.` : "Note removed."); };
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) $("#pn-ok", m.root).click(); });
  $("#pn-del", m.root)?.addEventListener("click", async () => { delete notes[p]; await fin(notes); toast("Note deleted."); });
}
export async function notesList(ctx) {
  const it = ctx.item(), notes = await loadNotes(it.id), marks = ctx.marks() || [];
  const rows = [...Object.entries(notes).map(([p, n]) => ({ p: +p, kind: "note", text: n.text })), ...marks.map((b) => ({ p: b.pos, kind: "mark", text: b.label || "" }))].sort((a, b) => a.p - b.p);
  const m = modal({ title: "Notes and bookmarks", wide: true, body: rows.length ? `<div style="display:grid;gap:6px">${rows.map((r) => `<button type="button" class="btn" data-p="${r.p}" style="justify-content:flex-start;text-align:left;white-space:normal;height:auto;padding:8px 12px"><b style="min-width:70px">${r.kind === "note" ? "📝" : "🔖"} p${r.p + 1}</b><span>${esc(r.text) || '<span class="muted">Bookmark</span>'}</span></button>`).join("")}</div>` : `<p class="muted">Nothing yet. Press K on a page to write a note, or B to bookmark it.</p>`, actions: Object.keys(notes).length ? `<button class="btn" type="button" id="nl-copy">Copy notes</button><button class="btn" type="button" id="nl-save">Save as text</button>` : "" });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { m.close(); ctx.jump(+b.dataset.p); } });
  const txt = () => `${it.title}${it.series ? " (" + it.series + ")" : ""}\n\n` + Object.entries(notes).sort((a, b) => a[0] - b[0]).map(([p, n]) => `Page ${+p + 1}\n${n.text}`).join("\n\n") + "\n";
  $("#nl-copy", m.root)?.addEventListener("click", () => navigator.clipboard.writeText(txt()).then(() => toast("Notes copied."), () => toast("Couldn't copy.")));
  $("#nl-save", m.root)?.addEventListener("click", () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt()], { type: "text/plain" })); a.download = `${(it.title || "notes").replace(/[^\w\s-]/g, "").trim().slice(0, 50)} notes.txt`; a.click(); toast("Notes saved."); });
}

// ---------- reading pace ----------
const fmt = (s) => (s < 60 ? `${Math.round(s)} sec` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`);
export function pace(ctx) {
  const it = ctx.item(), p = ctx.page(), n = it.pages, turns = ctx.turns();
  // Seconds per page this sitting, ignoring long pauses (over 3 minutes on one page means you stepped away).
  const gaps = turns.slice(1).map((t, i) => (t - turns[i]) / 1000).filter((g) => g > 0.4 && g < 180);
  const per = gaps.length >= 3 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : (it.manga === false ? 40 : 18), guess = gaps.length < 3;
  const left = Math.max(0, n - 1 - p), secs = left * per, done = new Date(Date.now() + secs * 1000);
  const pct = Math.round(((p + 1) / n) * 100);
  modal({ title: "Your pace", body: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${[["Page", `${p + 1} of ${n}`], ["Through the volume", `${pct}%`], ["Pages left", left], ["Pages this sitting", ctx.seen()], ["Time per page", `${per.toFixed(per < 10 ? 1 : 0)} sec${guess ? " (estimate)" : ""}`], ["Time left", left ? fmt(secs) : "Done!"], ["You'll finish around", left ? done.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Now"], ["Sitting so far", fmt(Math.max(1, (Date.now() - (turns[0] || Date.now())) / 1000))]].map(([k, v]) => `<div style="border:1px solid rgba(127,127,160,.3);border-radius:10px;padding:10px"><div class="muted" style="font-size:12px">${k}</div><b style="font-size:18px">${v}</b></div>`).join("")}</div><div style="margin-top:12px;height:8px;border-radius:99px;background:rgba(127,127,160,.25);overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--accent,#e0702f)"></div></div>${guess ? `<p class="muted" style="font-size:12px">Turn a few more pages and this uses your real pace.</p>` : ""}` });
}

// ---------- sleep timer ----------
let sleep = null;
export function sleepTimer(ctx) {
  if (sleep) { clearTimeout(sleep.t); clearTimeout(sleep.w); sleep = null; return toast("Sleep timer off."); }
  const v = prompt("Close the reader after how many minutes? (Or type “end” to stop at the end of this volume.)", localStorage.getItem("kitsune.sleepMin") || "20"); if (!v) return;
  if (/^e/i.test(v.trim())) { sleep = { end: true }; return toast("The reader will close when you reach the last page."); }
  const min = +v; if (!(min >= 1 && min <= 600)) return toast("Pick between 1 and 600 minutes.");
  try { localStorage.setItem("kitsune.sleepMin", String(min)); } catch {}
  sleep = { t: setTimeout(() => { sleep = null; if (ctx.isOpen()) { ctx.close(); toast("Sleep timer: closed the reader. Your page is saved. Goodnight."); } }, min * 60000), w: min > 1 ? setTimeout(() => ctx.isOpen() && toast("Sleep timer: one minute left.", { ms: 4000 }), (min - 1) * 60000) : 0 };
  toast(`The reader will close in ${min} minute${min > 1 ? "s" : ""}. Press the timer again to cancel.`);
}
export function sleepAtEnd(ctx) { if (sleep?.end && ctx.atEnd()) { sleep = null; setTimeout(() => { if (ctx.isOpen()) { ctx.close(); toast("You reached the end. Goodnight."); } }, 2500); } }
export const stopSleep = () => { if (sleep) { clearTimeout(sleep.t); clearTimeout(sleep.w); sleep = null; } };
export const sleepOn = () => !!sleep;

// ---------- random page / spoiler-free peek ----------
export function randomPage(ctx) { const n = ctx.item().pages; let p = ctx.page(); if (n < 2 || ctx.maxSeen() < 1) return toast("Read a few pages first."); while (p === ctx.page()) p = Math.floor(Math.random() * Math.min(n, ctx.maxSeen() + 1)); ctx.jump(p); toast(`Page ${p + 1}: a random page you've already read.`); }

// ---------- volume switcher ----------
// Every volume of this series you have, with how far you got, so you can hop straight to one.
export async function volumeSwitcher(ctx) {
  const { seriesGroups, allProgress, progressPct, coverSrc } = await import("../store.js");
  const it = ctx.item(), g = seriesGroups().find((x) => x.items.some((i) => i.id === it.id));
  if (!g || g.items.length < 2) return toast("This is the only volume of this series in your library.");
  const prog = await allProgress();
  const m = modal({ title: g.title || "Volumes", wide: true, body: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:12px">${g.items.map((v) => { const pc = progressPct(prog[v.id]); let cv = ""; try { cv = coverSrc(v) || ""; } catch {} return `<button type="button" data-v="${esc(v.id)}" style="all:unset;cursor:pointer;display:grid;gap:4px;${v.id === it.id ? "outline:3px solid var(--accent,#e0702f);outline-offset:3px;border-radius:8px" : ""}"><div style="aspect-ratio:2/3;border-radius:8px;overflow:hidden;background:#2b2f55">${cv ? `<img src="${esc(cv)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover">` : ""}</div><div style="height:4px;border-radius:99px;background:rgba(127,127,160,.3)"><div style="height:100%;width:${pc}%;border-radius:99px;background:var(--accent,#e0702f)"></div></div><small style="font-size:12px;line-height:1.25">${esc(v.title)}</small><small class="muted" style="font-size:11px">${v.id === it.id ? "Reading now" : pc >= 100 ? "Finished" : pc ? pc + "% read" : "Not started"}</small></button>`; }).join("")}</div>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; m.close(); if (b.dataset.v !== it.id) ctx.openItem(g.items.find((v) => v.id === b.dataset.v)); });
}

// ---------- sitting goal ----------
// "Read 20 more pages" or "read until 11pm": a quiet bar fills as you go, and a toast says when you're there.
let goal = null;
export function sittingGoal(ctx) {
  if (goal) { goal = null; document.getElementById("r-goal")?.remove(); return toast("Goal cleared."); }
  const v = prompt("Set a goal for this sitting: a number of pages (like 30), or a time to stop (like 22:30).", "30"); if (!v) return;
  const t = v.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (t) { const d = new Date(); d.setHours(+t[1], +t[2], 0, 0); if (d < Date.now()) d.setDate(d.getDate() + 1); goal = { kind: "time", start: Date.now(), until: +d }; }
  else { const n = Math.round(+v); if (!(n >= 1 && n <= 5000)) return toast("Type a number of pages or a time like 22:30."); goal = { kind: "pages", start: ctx.seen(), n }; }
  bar(ctx); toast(goal.kind === "pages" ? `Goal: ${goal.n} pages. Press U to clear it.` : `Goal: read until ${new Date(goal.until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`);
  if (goal.kind === "time") goal.iv = setInterval(() => (ctx.isOpen() ? bar(ctx) : (clearInterval(goal?.iv), (goal = null))), 15000);
}
function bar(ctx) {
  if (!goal) return;
  let el = document.getElementById("r-goal"); const host = document.querySelector("#reader .r-bar");
  if (!el && host) { el = document.createElement("div"); el.id = "r-goal"; el.style.cssText = "position:absolute;left:0;right:0;bottom:-3px;height:3px;background:rgba(255,255,255,.08);pointer-events:none"; el.innerHTML = '<div style="height:100%;width:0;background:#ffd36b;transition:width .3s"></div>'; host.style.position ||= "relative"; host.append(el); }
  const pct = goal.kind === "pages" ? (ctx.seen() - goal.start) / goal.n : (Date.now() - goal.start) / (goal.until - goal.start);
  if (el) el.firstChild.style.width = Math.min(100, pct * 100) + "%";
  if (pct >= 1 && !goal.hit) { goal.hit = true; toast(goal.kind === "pages" ? `🎉 ${goal.n} pages: goal reached.` : "⏰ That's your stopping time. Good place to pause?", { ms: 5000 }); }
}
export const goalTick = (ctx) => goal && bar(ctx);
export const stopGoal = () => { if (goal) { clearInterval(goal.iv); goal = null; } };

// ---------- shared: load a page as a drawable picture ----------
async function pageImage(item, i) {
  const { pageSrc } = await import("../store.js");
  const b = await pageBlob(await pageSrc(item, i)), u = URL.createObjectURL(b), im = new Image(); im.src = u;
  try { await im.decode(); } finally { setTimeout(() => URL.revokeObjectURL(u), 3000); }
  return im;
}
const fileBase = (it) => (it.title || "pages").replace(/[^\w\s-]/g, "").trim().slice(0, 50);
function preview(title, blob, name) {
  const url = URL.createObjectURL(blob);
  const m = modal({ title, wide: true, body: `<img src="${url}" alt="${esc(title)}" style="max-width:100%;max-height:65vh;display:block;margin:0 auto;border-radius:8px">`, actions: `<button class="btn" type="button" id="pv-copy">Copy</button><button class="btn btn-accent" type="button" id="pv-save">Save</button>`, onClose: () => setTimeout(() => URL.revokeObjectURL(url), 1000) });
  $("#pv-save", m.root).onclick = () => { const a = document.createElement("a"); a.href = url; a.download = name; a.click(); toast("Saved."); };
  $("#pv-copy", m.root).onclick = async () => { try { const png = blob.type === "image/png" ? blob : await new Promise(async (ok) => { const im = new Image(); im.src = url; await im.decode(); const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext("2d").drawImage(im, 0, 0); c.toBlob(ok, "image/png"); }); await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]); toast("Copied."); } catch { toast("Couldn't copy here. Save it instead."); } };
}

// ---------- save the whole spread as one picture ----------
export async function saveSpread(ctx) {
  const it = ctx.item(), pages = ctx.visible(), order = ctx.dir() === "rtl" ? [...pages].reverse() : pages;
  toast("Putting the spread together…");
  try {
    const ims = await Promise.all(order.map((i) => pageImage(it, i))), h = Math.max(...ims.map((im) => im.naturalHeight)), ws = ims.map((im) => Math.round(im.naturalWidth * (h / im.naturalHeight)));
    const c = document.createElement("canvas"); c.width = ws.reduce((a, b) => a + b, 0); c.height = h; const g = c.getContext("2d"); let x = 0;
    ims.forEach((im, k) => { g.drawImage(im, x, 0, ws[k], h); x += ws[k]; });
    const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.92));
    preview(pages.length > 1 ? `Pages ${pages.map((q) => q + 1).join(" and ")}` : `Page ${pages[0] + 1}`, blob, `${fileBase(it)} p${pages.map((q) => q + 1).join("-")}.jpg`);
  } catch (e) { toast(e.message || "Couldn't put the spread together."); }
}

// ---------- contact sheet ----------
// Every page of the volume as small tiles on one sheet, numbered: a map of the book, or something to share.
export async function contactSheet(ctx) {
  const it = ctx.item(), n = Math.min(it.pages, 120), cols = n <= 12 ? 4 : n <= 40 ? 6 : 8, tw = 220, th = 330, pad = 14, head = 70;
  const c = document.createElement("canvas"); c.width = cols * (tw + pad) + pad; c.height = head + Math.ceil(n / cols) * (th + pad + 18) + pad;
  const g = c.getContext("2d"); g.fillStyle = "#14152a"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#fff"; g.font = "600 28px system-ui, sans-serif"; g.fillText((it.title || "").slice(0, 70), pad, 44);
  g.fillStyle = "#9a9cc0"; g.font = "15px system-ui, sans-serif"; g.fillText(`${it.pages} pages${it.pages > n ? ` (first ${n} shown)` : ""} · Kitsune`, pad, 64);
  let done = 0; const t = toast(`Making a contact sheet: 0 of ${n}…`, { ms: 60000 });
  const one = async (i) => {
    const x = pad + (i % cols) * (tw + pad), y = head + Math.floor(i / cols) * (th + pad + 18);
    try { const im = await pageImage(it, i), k = Math.min(tw / im.naturalWidth, th / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; g.drawImage(im, x + (tw - w) / 2, y + (th - h) / 2, w, h); }
    catch { g.fillStyle = "#2b2f55"; g.fillRect(x, y, tw, th); }
    g.fillStyle = "#c9cae6"; g.font = "600 14px system-ui, sans-serif"; g.textAlign = "center"; g.fillText(String(i + 1), x + tw / 2, y + th + 15); g.textAlign = "start";
    done++; const el = document.querySelector(".toast:last-child, #toast"); if (el && /contact sheet/.test(el.textContent)) el.textContent = `Making a contact sheet: ${done} of ${n}…`;
  };
  const q = [...Array(n).keys()]; await Promise.all(Array.from({ length: 4 }, async () => { while (q.length) await one(q.shift()); }));
  t?.close?.();
  const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
  preview("Contact sheet", blob, `${fileBase(it)} contact sheet.jpg`);
}

// ---------- pages you lingered on ----------
export async function lingered(ctx) {
  const { kvGet, pageSrc } = await import("../store.js"), it = ctx.item();
  const all = { ...(((await kvGet("pageDwell", {})) || {})[it.id] || {}) }; for (const [k, v] of Object.entries(ctx.dwell())) all[k] = (all[k] || 0) + v;
  const top = Object.entries(all).filter(([, v]) => v >= 4000).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!top.length) return toast("Read a little more first: this lists the pages you spend longest on.");
  const srcs = await Promise.all(top.map(([q]) => pageSrc(it, +q).catch(() => "")));
  const fmt = (ms) => (ms < 60000 ? Math.round(ms / 1000) + " sec" : Math.round(ms / 60000) + " min");
  const m = modal({ title: "Pages you lingered on", wide: true, body: `<p class="muted" style="margin-top:0">The pages of this volume you've spent longest looking at. Often the best ones.</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px">${top.map(([q, v], k) => `<button type="button" data-p="${q}" style="all:unset;cursor:pointer;display:grid;gap:4px"><div style="aspect-ratio:2/3;border-radius:8px;overflow:hidden;background:#2b2f55">${srcs[k] ? `<img src="${esc(srcs[k])}" alt="Page ${+q + 1}" style="width:100%;height:100%;object-fit:cover">` : ""}</div><small><b>Page ${+q + 1}</b> · ${fmt(v)}</small></button>`).join("")}</div>` });
  m.root.addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { m.close(); ctx.jump(+b.dataset.p); } });
}
export async function keepDwell(id, dwell) {
  if (!Object.keys(dwell).length) return;
  const { kvGet, kvSet, settings } = await import("../store.js"); if (settings?.incognito) return;
  const all = (await kvGet("pageDwell", {})) || {}, cur = all[id] || {}; for (const [k, v] of Object.entries(dwell)) cur[k] = Math.min(36e5, (cur[k] || 0) + v); all[id] = cur;
  const ids = Object.keys(all); if (ids.length > 300) delete all[ids[0]];
  await kvSet("pageDwell", all);
}
