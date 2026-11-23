// Kitsune Browser, v118: a listening queue. Line up articles from anywhere (this page, open tabs, your read-later list) and
// Kitsune reads them to you one after another, like a podcast made from the web. A small player stays on screen while you
// browse, remembers where you stopped, has speed, voice and sleep-timer controls, and shows on your phone's lock screen.
import { $, esc, toast, modal } from "./util.js";
import { kvGet, kvSet } from "./store.js";

const S = { queue: [], i: 0, chunks: [], at: 0, playing: false, rate: 1, voice: "", timer: null, sleepAt: 0, loading: false, token: 0, bar: null };
let loaded = false;
const SILENT = "data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAgICAgICAgICAgICAgICA";
let keep = null;

async function load() { if (loaded) return; loaded = true; const d = (await kvGet("listenQueue", null)) || {}; S.queue = d.queue || []; S.i = d.i || 0; S.at = d.at || 0; S.rate = d.rate || 1; S.voice = d.voice || ""; }
const save = () => kvSet("listenQueue", { queue: S.queue, i: S.i, at: S.at, rate: S.rate, voice: S.voice });

// ---------- turning an article into spoken chunks ----------
async function articleText(url) {
  const F = await import("./feedlib.js"); const html = await F.fullArticle(url);
  const d = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html"); d.querySelectorAll("pre, table, figure, script, style").forEach((n) => n.remove());
  const parts = [...d.querySelectorAll("h1,h2,h3,h4,p,li,blockquote")].map((n) => (n.textContent || "").replace(/\s+/g, " ").trim()).filter((t) => t.length > 1);
  return parts.join("\n");
}
function chunkify(text) {
  const out = [];
  for (const para of text.split("\n")) {
    const sentences = para.match(/[^.!?。！？]+[.!?。！？]+["”’)]*\s*|[^.!?。！？]+$/g) || [para]; let cur = "";
    for (const s of sentences) { if ((cur + s).length > 240 && cur) { out.push(cur.trim()); cur = s; } else cur += s; }
    if (cur.trim()) out.push(cur.trim());
  }
  return out;
}

// ---------- speech ----------
const voices = () => (typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : []);
function say(text, onEnd) {
  const u = new SpeechSynthesisUtterance(text); u.rate = S.rate;
  const v = voices().find((x) => x.voiceURI === S.voice || x.name === S.voice); if (v) { u.voice = v; u.lang = v.lang; }
  u.onend = onEnd; u.onerror = (e) => { if (e.error !== "canceled" && e.error !== "interrupted") onEnd(); };
  speechSynthesis.speak(u);
}
async function prepare(i) {
  const it = S.queue[i]; if (!it) return false;
  if (!it.chunks) { S.loading = true; draw(); try { it.chunks = chunkify(await articleText(it.url)); } catch (e) { it.error = e.message; it.chunks = []; } S.loading = false; }
  return it.chunks.length > 0;
}
async function play() {
  await load(); if (!S.queue.length) return toast("The listening queue is empty.");
  if (typeof speechSynthesis === "undefined") return toast("This browser can't read text aloud.");
  const my = ++S.token; S.playing = true; ensureBar(); draw(); claimSession();
  while (S.i < S.queue.length && my === S.token) {
    const ok = await prepare(S.i); if (my !== S.token) return;
    if (!ok) { toast(`Couldn't read “${S.queue[S.i].title}”${S.queue[S.i].error ? ": " + S.queue[S.i].error : ""}. Skipping it.`); S.i++; S.at = 0; continue; }
    const it = S.queue[S.i];
    while (S.at < it.chunks.length && my === S.token) {
      draw(); const idx = S.at;
      await new Promise((res) => { speechSynthesis.cancel(); say(it.chunks[idx], () => res()); });
      if (my !== S.token) return;
      if (S.at === idx) S.at++; if (S.at % 6 === 0) save();
      if (S.sleepAt && Date.now() > S.sleepAt) { S.sleepAt = 0; stop(); toast("Sleep timer: stopped listening."); return; }
    }
    S.i++; S.at = 0; save();
  }
  if (my === S.token) { S.playing = false; S.i = 0; S.at = 0; save(); draw(); toast("Finished the listening queue."); }
}
function stop() { S.token++; S.playing = false; try { speechSynthesis.cancel(); } catch {} keep?.pause(); save(); draw(); }
function pauseResume() { S.playing ? stop() : play(); }
function skipChunk(d) { const it = S.queue[S.i]; if (!it?.chunks) return; S.at = Math.max(0, Math.min(it.chunks.length - 1, S.at + d)); if (S.playing) { const was = S.playing; S.token++; speechSynthesis.cancel(); if (was) play(); } else draw(); }
function skipItem(d) { const n = Math.max(0, Math.min(S.queue.length - 1, S.i + d)); if (n === S.i && d > 0) return stop(); S.i = n; S.at = 0; if (S.playing) { S.token++; speechSynthesis.cancel(); play(); } else { save(); draw(); } }

// ---------- lock screen / media keys ----------
function claimSession() {
  try {
    if (!keep) { keep = new Audio(SILENT); keep.loop = true; keep.volume = 0.01; }
    keep.play().catch(() => {});
    if ("mediaSession" in navigator) {
      const it = S.queue[S.i];
      navigator.mediaSession.metadata = new MediaMetadata({ title: it?.title || "Listening queue", artist: it?.site || "Kitsune", album: "Kitsune Browser" });
      navigator.mediaSession.playbackState = "playing";
      const set = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch {} };
      set("play", () => play()); set("pause", () => stop()); set("nexttrack", () => skipItem(1)); set("previoustrack", () => skipItem(-1));
      set("seekforward", () => skipChunk(3)); set("seekbackward", () => skipChunk(-3));
    }
  } catch {}
}

// ---------- the player ----------
function ensureBar() {
  if (S.bar?.isConnected) return;
  const st = document.createElement("style"); st.id = "kbl-style"; st.textContent = `#kb-listen{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:70;width:min(560px,calc(100vw - 20px));background:var(--surface,#1c1d33);color:inherit;border:1px solid var(--line,#3a3e66);border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.4);padding:8px 12px 10px;font:13px system-ui,sans-serif}
  #kb-listen .r1{display:flex;align-items:center;gap:6px}#kb-listen .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}#kb-listen .t small{display:block;font-weight:400;opacity:.65}
  #kb-listen button{border:0;background:none;color:inherit;font-size:18px;cursor:pointer;padding:6px 8px;border-radius:8px}#kb-listen button:hover{background:rgba(127,127,160,.2)}#kb-listen .bar{height:3px;border-radius:2px;background:rgba(127,127,160,.3);margin-top:6px;overflow:hidden}#kb-listen .bar i{display:block;height:100%;background:var(--accent,#f2a03f)}
  @media(min-width:900px){#kb-listen{bottom:20px}}`;
  if (!$("#kbl-style")) document.head.append(st);
  const b = document.createElement("div"); b.id = "kb-listen"; b.setAttribute("role", "region"); b.setAttribute("aria-label", "Listening player");
  b.onclick = (e) => { const a = e.target.closest("[data-l]")?.dataset.l; if (!a) return; if (a === "play") pauseResume(); else if (a === "next") skipItem(1); else if (a === "prev") skipItem(-1); else if (a === "back") skipChunk(-3); else if (a === "fwd") skipChunk(3); else if (a === "queue") queuePanel(); else if (a === "close") { stop(); S.bar?.remove(); S.bar = null; } };
  document.body.append(b); S.bar = b;
}
function draw() {
  const b = S.bar; if (!b?.isConnected) return; const it = S.queue[S.i], n = it?.chunks?.length || 0;
  b.innerHTML = `<div class="r1"><button data-l="prev" aria-label="Previous article">⏮</button><button data-l="back" aria-label="Back a little">⏪</button><button data-l="play" aria-label="${S.playing ? "Pause" : "Play"}" style="font-size:22px">${S.loading ? "…" : S.playing ? "⏸" : "▶"}</button><button data-l="fwd" aria-label="Forward a little">⏩</button><button data-l="next" aria-label="Next article">⏭</button>
    <div class="t">${esc(it?.title || "Nothing queued")}<small>${esc(it?.site || "")}${S.queue.length > 1 ? ` · ${S.i + 1} of ${S.queue.length}` : ""}${S.sleepAt ? " · sleep timer on" : ""}</small></div><button data-l="queue" aria-label="Queue and settings">☰</button><button data-l="close" aria-label="Close player">✕</button></div>
    <div class="bar"><i style="width:${n ? Math.round((S.at / n) * 100) : 0}%"></i></div>`;
  if ("mediaSession" in navigator && it) try { navigator.mediaSession.metadata = new MediaMetadata({ title: it.title, artist: it.site || "Kitsune", album: "Kitsune Browser" }); navigator.mediaSession.playbackState = S.playing ? "playing" : "paused"; } catch {}
}
function queuePanel() {
  const vs = voices().filter((v) => v.lang?.toLowerCase().startsWith((document.documentElement.lang || "en").slice(0, 2).toLowerCase()) || !document.documentElement.lang);
  const m = modal({ title: "Listening queue", wide: true, body: `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px"><label>Speed <select class="field" id="lq-r">${[0.8, 1, 1.15, 1.3, 1.5, 1.75, 2].map((r) => `<option value="${r}" ${r === S.rate ? "selected" : ""}>${r}×</option>`).join("")}</select></label>
      <label>Voice <select class="field" id="lq-v"><option value="">Default</option>${vs.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.voice ? "selected" : ""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select></label>
      <label>Sleep timer <select class="field" id="lq-s"><option value="0">Off</option>${[10, 20, 30, 45, 60].map((n) => `<option value="${n}">${n} min</option>`).join("")}</select></label></div>
    <div id="lq-l">${S.queue.length ? S.queue.map((q, k) => `<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(127,127,160,.2)"><span style="opacity:.6;min-width:22px">${k === S.i ? "▶" : k + 1}</span><span style="flex:1;min-width:0"><b>${esc(q.title)}</b><br><small class="muted">${esc(q.site || "")}</small></span><button class="btn btn-sm" type="button" data-go="${k}">Play</button><button class="btn btn-sm" type="button" data-up="${k}">↑</button><button class="btn btn-sm" type="button" data-rm="${k}">Remove</button></div>`).join("") : `<p class="muted">Nothing here yet. Use “Add this page to the listening queue” in the menu.</p>`}</div>
    <p style="margin-top:12px"><button class="btn" type="button" id="lq-clear">Clear the queue</button></p>` });
  const root = m.root;
  $("#lq-r", root).onchange = (e) => { S.rate = +e.target.value; save(); if (S.playing) skipChunk(0); };
  $("#lq-v", root).onchange = (e) => { S.voice = e.target.value; save(); if (S.playing) skipChunk(0); };
  $("#lq-s", root).onchange = (e) => { S.sleepAt = +e.target.value ? Date.now() + +e.target.value * 60000 : 0; draw(); toast(S.sleepAt ? `Stopping in ${e.target.value} minutes.` : "Sleep timer off."); };
  $("#lq-clear", root).onclick = () => { stop(); S.queue = []; S.i = 0; S.at = 0; save(); m.close(); draw(); };
  root.onclick = (e) => { const t = e.target.closest("button"); if (!t) return; const d = t.dataset;
    if (d.go != null) { S.i = +d.go; S.at = 0; ensureBar(); S.token++; speechSynthesis.cancel(); m.close(); play(); }
    if (d.rm != null) { const k = +d.rm; S.queue.splice(k, 1); if (k < S.i) S.i--; else if (k === S.i) { S.at = 0; if (S.playing) { S.token++; speechSynthesis.cancel(); play(); } } save(); m.close(); queuePanel(); draw(); }
    if (d.up != null && +d.up > 0) { const k = +d.up; [S.queue[k - 1], S.queue[k]] = [S.queue[k], S.queue[k - 1]]; if (S.i === k) S.i--; else if (S.i === k - 1) S.i++; save(); m.close(); queuePanel(); } };
}

// ---------- adding things ----------
async function add(url, title, site, { next = false } = {}) {
  await load(); if (!/^https?:/.test(url)) return false;
  if (S.queue.some((q) => q.url === url)) { toast("That's already in the queue."); return false; }
  const item = { url, title: title || url, site: site || (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } })() };
  if (next && S.queue.length) S.queue.splice(S.i + 1, 0, item); else S.queue.push(item);
  save(); ensureBar(); draw(); return true;
}
export function items({ T, B }) {
  return [
    { label: "Listen to this page now", icon: "play", run: async () => { const t = T(); if (!t.url) return toast("Open a page first."); await load(); S.queue.splice(S.i, 0, { url: t.url, title: t.title, site: t.url && new URL(t.url).hostname.replace(/^www\./, "") }); S.at = 0; save(); ensureBar(); S.token++; try { speechSynthesis.cancel(); } catch {} play(); } },
    { label: "Add this page to the listening queue", icon: "plus", run: async () => { const t = T(); if (!t.url) return; if (await add(t.url, t.title)) toast("Added to the listening queue.", { action: "Play", onAction: () => play() }); } },
    { label: "Add every open tab to the listening queue", icon: "list", run: async () => { let n = 0; for (const t of B.tabs) if (t.url && (await add(t.url, t.title))) n++; toast(n ? `Added ${n} tab${n > 1 ? "s" : ""}.` : "Nothing new to add.", n ? { action: "Play", onAction: () => play() } : {}); } },
    { label: "Add my read-later list to the listening queue", icon: "book", run: async () => { const l = (await kvGet("webLater", [])) || []; let n = 0; for (const x of l) if (x.url && (await add(x.url, x.title))) n++; toast(n ? `Added ${n} pages.` : "Nothing new to add."); } },
    { label: "Listening queue and player…", icon: "sliders", run: async () => { await load(); ensureBar(); draw(); queuePanel(); } },
  ];
}
export const addToQueue = add;
