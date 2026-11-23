// Persistent audiobook player (LibriVox).
import { $, $$, esc, icon, toast, fmtDuration, modal, api, ls, coverHtml } from "../util.js";
import { settings, saveSettings, getProgress, setProgress, logStat, getItem, saveItem, coverSrc, sessionTimer } from "../store.js";

const A = { item: null, ch: 0, audio: null, timer: null, sleepAt: 0, sleepEnd: false, sleepT: 0, lastSave: 0 };
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

function audioEl() {
  if (!A.audio) {
    A.audio = new Audio();
    A.audio.preload = "metadata";
    A.audio.addEventListener("timeupdate", onTime);
    A.audio.addEventListener("ended", onEnded);
    A.audio.addEventListener("play", () => { draw(); A.timer ??= sessionTimer(A.item?.id, "listen"); });
    A.audio.addEventListener("pause", () => { draw(); A.timer?.stop(); A.timer = null; save(); });
    A.audio.addEventListener("error", () => toast("This chapter didn't load. Check your connection, then press play again."));
    A.audio.addEventListener("loadedmetadata", draw);
  }
  return A.audio;
}

async function chaptersOf(item) {
  if (item.source.chapters?.length) return item.source.chapters;
  const b = await api("audio/" + item.source.lid);
  item.source.chapters = b.chapters; await saveItem(item);
  return b.chapters;
}

export async function playItem(item, opts = {}) {
  const chapters = await chaptersOf(item).catch((e) => { toast(e.message); return null; });
  if (!chapters?.length) return;
  const saved = await getProgress(item.id);
  const same = A.item?.id === item.id;
  A.item = item;
  A.ch = opts.chapter ?? (same ? A.ch : saved?.pos ?? 0);
  const a = audioEl();
  const url = chapters[A.ch].url;
  if (a.src !== url) {
    a.src = url;
    const t = opts.t ?? (opts.chapter == null && saved && saved.pos === A.ch ? Math.max(0, (saved.t || 0) - 3) : 0);
    a.addEventListener("loadedmetadata", () => { if (t) a.currentTime = t; }, { once: true });
  } else if (opts.t != null) a.currentTime = opts.t;
  a.playbackRate = settings.audio.rate;
  ls.set("player", { id: item.id });
  try { await a.play(); } catch { draw(); }
  mediaSession();
  draw();
}

function onTime() {
  const a = A.audio;
  const seek = $("#pl-seek");
  if (seek && !seek.matches(":active")) { seek.max = a.duration || 0; seek.value = a.currentTime; }
  const c = $("#pl-cur"); if (c) c.textContent = fmtDuration(a.currentTime);
  if (Date.now() - A.lastSave > 10_000) save();
  if (A.sleepAt && Date.now() >= A.sleepAt) { a.pause(); A.sleepAt = 0; toast("Sleep timer: paused."); }
}
function save() {
  if (!A.item || !A.audio) return;
  A.lastSave = Date.now();
  const chapters = A.item.source.chapters || [];
  getProgress(A.item.id).then((p) => {
    const done = new Set(p?.done || []);
    if (A.audio.duration && A.audio.currentTime > A.audio.duration - 15) done.add(A.ch);
    setProgress(A.item.id, { pos: A.ch, total: chapters.length, t: Math.floor(A.audio.currentTime), done: [...done] });
  });
}
function onEnded() {
  save();
  if (A.sleepEnd) { A.sleepEnd = false; toast("Sleep timer: stopped at the end of the chapter."); draw(); return; }
  const chapters = A.item.source.chapters;
  if (A.ch + 1 < chapters.length) playItem(A.item, { chapter: A.ch + 1 });
  else { toast(`Finished ${A.item.title}.`); setProgress(A.item.id, { pos: chapters.length - 1, total: chapters.length, t: 0 }); draw(); }
}

function draw() {
  const p = $("#player");
  if (!A.item) { p.hidden = true; return; }
  const a = audioEl(), ch = A.item.source.chapters?.[A.ch];
  p.hidden = false;
  p.innerHTML = `
    <button class="card-hit" type="button" id="pl-open" aria-label="Show chapters" style="position:static;width:48px;height:48px;padding:0;border-radius:6px;overflow:hidden">${coverHtml(coverSrc(A.item), A.item.title)}</button>
    <div class="player-main"><strong>${esc(A.item.title)}</strong><span>${esc(ch ? `${ch.title} · ${A.ch + 1}/${A.item.source.chapters.length}` : "")}${A.sleepAt || A.sleepEnd ? " · sleep timer on" : ""}</span>
      <div class="player-seek"><span id="pl-cur">${fmtDuration(a.currentTime)}</span><input type="range" id="pl-seek" min="0" max="${a.duration || 0}" step="1" value="${a.currentTime}" aria-label="Seek"><span>${fmtDuration(a.duration || ch?.secs || 0)}</span></div></div>
    <div class="player-ctl">
      <button class="icon-btn hide-sm" type="button" id="pl-prev" aria-label="Previous chapter">${icon("back")}</button>
      <button class="icon-btn hide-sm" type="button" id="pl-rew" aria-label="Back 15 seconds">${icon("rew")}</button>
      <button class="icon-btn play" type="button" id="pl-play" aria-label="${a.paused ? "Play" : "Pause"}">${icon(a.paused ? "play" : "pause")}</button>
      <button class="icon-btn" type="button" id="pl-fwd" aria-label="Forward 30 seconds">${icon("fwd")}</button>
      <button class="icon-btn hide-sm" type="button" id="pl-next" aria-label="Next chapter">${icon("next")}</button>
      <button class="icon-btn rate hide-sm" type="button" id="pl-rate" aria-label="Playback speed">${settings.audio.rate}×</button>
      <button class="icon-btn hide-sm" type="button" id="pl-sleep" aria-label="Sleep timer" aria-pressed="${!!(A.sleepAt || A.sleepEnd)}">${icon("sleep")}</button>
      <button class="icon-btn hide-sm" type="button" id="pl-bm" aria-label="Bookmark this moment">${icon("bookmark")}</button>
      <button class="icon-btn" type="button" id="pl-x" aria-label="Close player">${icon("x")}</button>
    </div>`;
  $("#pl-play").onclick = () => (a.paused ? a.play().catch(() => {}) : a.pause());
  $("#pl-rew").onclick = () => (a.currentTime = Math.max(0, a.currentTime - 15));
  $("#pl-fwd").onclick = () => (a.currentTime = Math.min(a.duration || 1e9, a.currentTime + 30));
  $("#pl-prev").onclick = () => (a.currentTime > 5 || A.ch === 0 ? (a.currentTime = 0) : playItem(A.item, { chapter: A.ch - 1 }));
  $("#pl-next").onclick = () => A.ch + 1 < A.item.source.chapters.length && playItem(A.item, { chapter: A.ch + 1 });
  $("#pl-seek").oninput = (e) => (a.currentTime = Number(e.target.value));
  $("#pl-rate").onclick = () => { settings.audio.rate = RATES[(RATES.indexOf(settings.audio.rate) + 1) % RATES.length]; a.playbackRate = settings.audio.rate; saveSettings(); draw(); };
  $("#pl-sleep").onclick = sleepMenu;
  $("#pl-bm").onclick = async () => {
    const { getMarks, setMarks } = await import("../store.js");
    const list = await getMarks("bookmarks", A.item.id);
    const t = Math.floor(a.currentTime), ch = A.item.source.chapters[A.ch];
    list.push({ pos: A.ch, t, label: `${ch?.title || "Chapter " + (A.ch + 1)} · ${fmtDuration(t)}`, created: Math.floor(Date.now() / 1000) });
    await setMarks("bookmarks", A.item.id, list);
    toast("Bookmarked this moment. Find it in your Notebook.");
  };
  $("#pl-open").onclick = showChapters;
  $("#pl-x").onclick = () => { save(); a.pause(); A.item = null; ls.set("player", null); draw(); };
}

async function sleepMenu(e) {
  const { menu } = await import("../util.js");
  menu(e.currentTarget, [
    ...[5, 15, 30, 45, 60].map((m) => ({ label: `In ${m} minutes`, run: () => { A.sleepAt = Date.now() + m * 60_000; A.sleepEnd = false; toast(`Pausing in ${m} minutes.`); draw(); } })),
    { label: "At the end of this chapter", run: () => { A.sleepEnd = true; A.sleepAt = 0; toast("Stopping at the end of this chapter."); draw(); } },
    ...(A.sleepAt || A.sleepEnd ? [{ label: "Turn off sleep timer", run: () => { A.sleepAt = 0; A.sleepEnd = false; draw(); } }] : []),
  ]);
}

async function showChapters() {
  const p = await getProgress(A.item.id);
  const done = new Set(p?.done || []);
  const m = modal({ title: A.item.title, wide: true, body: `<div class="chapters">${A.item.source.chapters.map((c, i) => `<button class="chapter ${i === A.ch ? "current" : ""}" type="button" data-ch="${i}"><span class="n">${done.has(i) ? `<span class="done">${icon("check")}</span>` : c.n}</span><div style="min-width:0"><strong style="display:block">${esc(c.title)}</strong><span class="muted" style="font-size:12px">${esc(c.readers.join(", "))}</span></div><span class="t">${fmtDuration(c.secs)}</span></button>`).join("")}</div>
    <a class="btn btn-ghost" style="margin-top:12px" href="#item/${encodeURIComponent(A.item.id)}" data-close>Details</a>` });
  $$("[data-ch]", m.root).forEach((b) => (b.onclick = () => { m.close(); playItem(A.item, { chapter: Number(b.dataset.ch) }); }));
  $(".chapter.current", m.root)?.scrollIntoView({ block: "center" });
}

function mediaSession() {
  if (!("mediaSession" in navigator) || !A.item) return;
  const ch = A.item.source.chapters[A.ch];
  const art = coverSrc(A.item);
  navigator.mediaSession.metadata = new MediaMetadata({ title: ch?.title || A.item.title, artist: A.item.author || "", album: A.item.title, artwork: art ? [{ src: art, sizes: "512x512" }] : [] });
  const a = A.audio;
  const set = (k, fn) => { try { navigator.mediaSession.setActionHandler(k, fn); } catch {} };
  set("play", () => a.play()); set("pause", () => a.pause());
  set("seekbackward", () => (a.currentTime -= 15)); set("seekforward", () => (a.currentTime += 30));
  set("previoustrack", () => A.ch > 0 && playItem(A.item, { chapter: A.ch - 1 }));
  set("nexttrack", () => A.ch + 1 < A.item.source.chapters.length && playItem(A.item, { chapter: A.ch + 1 }));
}

export async function restorePlayer() {
  const p = ls.get("player", null);
  if (!p?.id) return;
  const item = getItem(p.id);
  if (!item || item.type !== "audio") return;
  A.item = item;
  const saved = await getProgress(item.id);
  A.ch = saved?.pos || 0;
  const chapters = await chaptersOf(item).catch(() => null);
  if (!chapters) { A.item = null; return; }
  const a = audioEl();
  a.src = chapters[A.ch].url;
  a.playbackRate = settings.audio.rate;
  a.addEventListener("loadedmetadata", () => { if (saved?.t) a.currentTime = Math.max(0, saved.t - 3); }, { once: true });
  mediaSession();
  draw();
}

addEventListener("pagehide", save);
document.addEventListener("keydown", (e) => {
  if (!A.item || e.target.matches?.("input, textarea, select") || document.querySelector(".modal")) return;
  if (e.key === "k" && !e.metaKey && !e.ctrlKey) { const a = audioEl(); a.paused ? a.play().catch(() => {}) : a.pause(); }
});
