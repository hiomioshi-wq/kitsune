// Kitsune Wrapped: your reading year as full-screen story slides.
// Tap the right side (or →, Space) for the next slide, the left side (or ←) to go back, hold to pause, Esc to close.
import { $, $$, esc, icon, today, coverTint } from "./util.js";
import { lib, kvGet, settings, getItem, coverSrc } from "./store.js";

const SLIDE_MS = 6500;
const hourLabel = (h) => (h === 0 ? "midnight" : h === 12 ? "noon" : h < 12 ? `${h} am` : `${h - 12} pm`);
const active = (v) => v && (v.pages || v.secs > 60 || v.listen > 60);

export async function wrappedData(year = new Date().getFullYear()) {
  const st = await kvGet("stats", { days: {}, finished: [] });
  const yd = Object.entries(st.days || {}).filter(([d]) => d.startsWith(year + "-"));
  const sum = (fn) => yd.reduce((a, [, v]) => a + (fn(v) || 0), 0);
  const counts = {};
  for (const [, v] of yd) for (const id of v.items || []) counts[id] = (counts[id] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ item: getItem(id), n })).filter((x) => x.item).slice(0, 5);
  // Best streak inside the year.
  let best = 0, run = 0;
  for (const d = new Date(year, 0, 1); d.getFullYear() === year && today(d) <= today(); d.setDate(d.getDate() + 1)) {
    if (active(st.days[today(d)])) best = Math.max(best, ++run); else run = 0;
  }
  const months = Array.from({ length: 12 }, (_, m) => yd.filter(([d]) => Number(d.slice(5, 7)) === m + 1).reduce((a, [, v]) => a + (v.pages || 0) + Math.round(((v.secs || 0) + (v.listen || 0)) / 120), 0));
  const hours = st.hours || [];
  const peak = hours.length && Math.max(...hours) > 0 ? hours.indexOf(Math.max(...hours)) : null;
  const finished = (st.finished || []).filter((f) => new Date(f.at * 1000).getFullYear() === year).map((f) => getItem(f.id)).filter(Boolean);
  const types = new Set(top.map((t) => t.item.type));
  return {
    year, top, best, months, peak, finished,
    pages: sum((v) => v.pages), words: sum((v) => v.words),
    minutes: Math.round(sum((v) => (v.secs || 0) + (v.listen || 0)) / 60),
    listenMin: Math.round(sum((v) => v.listen || 0) / 60),
    days: yd.filter(([, v]) => active(v)).length,
    goal: settings.yearGoal || 12,
    vocab: (await kvGet("vocab", [])).length,
    highlights: Object.values(await kvGet("highlights", {})).reduce((a, l) => a + l.length, 0),
    types,
  };
}

// Who you were as a reader this year.
function persona(d) {
  const p = d.peak;
  if (d.listenMin > d.minutes * 0.5 && d.listenMin > 30) return ["The Listener", "Most of your stories came in through your ears. Headphones on, world off."];
  if (p != null && (p >= 22 || p < 4)) return ["The Night Owl", `Your favourite hour was ${hourLabel(p)}. The best chapters happen after everyone else is asleep.`];
  if (p != null && p < 10) return ["The Early Riser", `You did your best reading around ${hourLabel(p)}, before the day got its hands on you.`];
  if (d.best >= 14) return ["The Devoted", `A ${d.best}-day streak. Reading wasn't a hobby this year, it was a habit.`];
  if (d.finished.length >= d.goal) return ["The Finisher", "You set a goal and you cleared it. Every last page."];
  if (d.highlights >= 10) return ["The Annotator", `${d.highlights} highlights. You don't just read books, you talk back to them.`];
  if (d.types.size >= 2) return ["The Wanderer", "Manga, novels, audio: you went wherever the story was."];
  if (p != null && p >= 17) return ["The Evening Reader", `Around ${hourLabel(p)}, the day ends and the reading begins.`];
  return ["The Curious", "You opened doors this year. Some you'll walk back through."];
}

function fmtNum(n) { return Number(n).toLocaleString(); }

function slides(d) {
  const S = [];
  const covers = [...new Set([...d.top.map((t) => t.item), ...d.finished, ...lib.items.slice(0, 20)])].filter((i) => coverSrc(i)).slice(0, 18);
  const hrs = d.minutes / 60;
  // 1. Intro
  S.push({ hue: 28, html: `
    <div class="wr-collage" aria-hidden="true">${covers.map((i, k) => `<img src="${esc(coverSrc(i))}" alt="" loading="eager" style="--k:${k};left:${2 + ((k * 37) % 88)}%;top:${4 + ((k * 53) % 82)}%;--r:${((k * 23) % 30) - 15}deg;--z:${((k * 41) % 200) - 100}px">`).join("")}</div>
    <div class="wr-center"><p class="wr-kicker">Kitsune Wrapped</p><h2 class="wr-mega"><span class="wr-rise">${d.year}</span></h2>
      <p class="wr-lede wr-rise" style="--d:.5s">Your year in pages, hours and stories.</p></div>` });
  // 2. Pages
  if (d.pages || d.words) {
    const novels = Math.max(1, Math.round((d.words || d.pages * 300) / 90000));
    S.push({ hue: 18, html: `<div class="wr-center"><p class="wr-kicker">You read</p>
      <h2 class="wr-mega"><span class="wr-count" data-to="${d.pages}">0</span></h2><p class="wr-unit">pages</p>
      <p class="wr-lede wr-rise" style="--d:1.4s">${d.words ? `That's ${fmtNum(d.words)} words, ` : ""}about ${novels === 1 ? "one whole novel" : `${novels} novels`} back to back.</p></div>` });
  }
  // 3. Time
  if (d.minutes) {
    S.push({ hue: 210, html: `<div class="wr-center"><p class="wr-kicker">You spent</p>
      <h2 class="wr-mega"><span class="wr-count" data-to="${hrs >= 2 ? Math.round(hrs) : d.minutes}">0</span></h2><p class="wr-unit">${hrs >= 2 ? "hours" : "minutes"} inside stories</p>
      <p class="wr-lede wr-rise" style="--d:1.4s">${d.listenMin ? `${fmtNum(d.listenMin)} of those minutes were listening. ` : ""}${hrs >= 24 ? `More than ${Math.floor(hrs / 24)} full ${Math.floor(hrs / 24) === 1 ? "day" : "days"}, start to finish.` : hrs >= 2 ? `About ${Math.round(hrs / 2)} feature-length films' worth.` : "Every minute counts."}</p></div>` });
  }
  // 4. Rhythm: the year month by month
  if (d.days) {
    const mx = Math.max(1, ...d.months);
    const nowM = d.year === new Date().getFullYear() ? new Date().getMonth() : 11;
    const bestM = d.months.indexOf(Math.max(...d.months));
    S.push({ hue: 150, html: `<div class="wr-center"><p class="wr-kicker">Your rhythm</p>
      <h2 class="wr-big"><span class="wr-count" data-to="${d.days}">0</span> days with reading</h2>
      <div class="wr-months" aria-hidden="true">${d.months.map((v, m) => `<span class="${m === bestM && v ? "on" : ""} ${m > nowM ? "future" : ""}" style="--h:${Math.max(4, (v / mx) * 100)}%;--d:${0.4 + m * 0.06}s"><i></i><b>${new Date(2000, m, 1).toLocaleDateString(undefined, { month: "narrow" })}</b></span>`).join("")}</div>
      <p class="wr-lede wr-rise" style="--d:1.4s">${d.months[bestM] ? `${new Date(2000, bestM, 1).toLocaleDateString(undefined, { month: "long" })} was your biggest month.` : ""}${d.best > 1 ? ` Longest streak: ${d.best} days in a row.` : ""}</p></div>` });
  }
  // 5. The one book
  if (d.top[0]) {
    const t = d.top[0];
    S.push({ hue: 330, tint: coverSrc(t.item), html: `<div class="wr-hero">
      <div class="wr-hero-cover wr-pop">${coverSrc(t.item) ? `<img src="${esc(coverSrc(t.item))}" alt="">` : `<div class="wr-nocover">${esc(t.item.title)}</div>`}</div>
      <div class="wr-hero-txt"><p class="wr-kicker">Your book of the year</p><h2 class="wr-title wr-rise" style="--d:.5s">${esc(t.item.title)}</h2>
      <p class="wr-lede wr-rise" style="--d:.8s">${esc(t.item.author || t.item.series || "")}</p>
      <p class="wr-chip wr-rise" style="--d:1.1s">${icon("fire")} You came back to it on ${t.n} ${t.n === 1 ? "day" : "different days"}</p></div></div>` });
  }
  // 6. Top five
  if (d.top.length > 1) {
    S.push({ hue: 265, html: `<div class="wr-center wr-wide"><p class="wr-kicker">Your top ${d.top.length}</p>
      <ol class="wr-top">${d.top.map((t, k) => `<li class="wr-rise" style="--d:${0.25 + k * 0.18}s"><span class="wr-rank">${k + 1}</span>${coverSrc(t.item) ? `<img src="${esc(coverSrc(t.item))}" alt="">` : `<span class="wr-dot"></span>`}<span class="wr-top-t"><strong>${esc(t.item.title)}</strong><small>${t.n} ${t.n === 1 ? "day" : "days"}</small></span></li>`).join("")}</ol></div>` });
  }
  // 7. Finished wall
  S.push({ hue: 42, html: `<div class="wr-center wr-wide"><p class="wr-kicker">Finished this year</p>
    <h2 class="wr-big"><span class="wr-count" data-to="${d.finished.length}">0</span> <span class="wr-of">of ${d.goal}</span></h2>
    ${d.finished.length ? `<div class="wr-wall">${d.finished.slice(0, 24).map((i, k) => `<span class="wr-pop" style="--d:${0.3 + k * 0.07}s">${coverSrc(i) ? `<img src="${esc(coverSrc(i))}" alt="${esc(i.title)}">` : `<em>${esc(i.title)}</em>`}</span>`).join("")}</div>` : ""}
    <p class="wr-lede wr-rise" style="--d:1.2s">${d.finished.length >= d.goal ? "Goal cleared. Take a bow." : d.finished.length ? `${d.goal - d.finished.length} more and you've hit your goal.` : "The year isn't over. One last book?"}</p></div>` });
  // 8. Persona
  const [name, line] = persona(d);
  S.push({ hue: 280, html: `<div class="wr-center"><p class="wr-kicker">This year you were</p>
    <div class="wr-sigil wr-pop" aria-hidden="true">${icon("star")}</div>
    <h2 class="wr-persona wr-rise" style="--d:.4s">${esc(name)}</h2><p class="wr-lede wr-rise" style="--d:.9s">${esc(line)}</p></div>` });
  // 9. Summary
  S.push({ hue: 24, final: true, html: `<div class="wr-center wr-wide"><p class="wr-kicker">${d.year} in Kitsune</p>
    <div class="wr-sum">
      <div><strong>${fmtNum(d.pages)}</strong><span>pages</span></div>
      <div><strong>${hrs >= 2 ? Math.round(hrs) + " h" : d.minutes + " min"}</strong><span>reading</span></div>
      <div><strong>${d.finished.length}</strong><span>finished</span></div>
      <div><strong>${d.best}</strong><span>day streak</span></div>
      <div><strong>${d.days}</strong><span>reading days</span></div>
      <div><strong>${fmtNum(d.highlights)}</strong><span>highlights</span></div>
    </div>
    <p class="wr-persona-s">${esc(name)}</p>
    <div class="wr-actions"><button class="wr-btn wr-btn-main" type="button" data-wr="save">${icon("download")} Save as image</button><button class="wr-btn" type="button" data-wr="replay">${icon("back")} Watch again</button><button class="wr-btn" type="button" data-wr="close">Done</button></div></div>` });
  return S;
}

let W = null;

export async function openWrapped(year) {
  closeWrapped();
  const d = await wrappedData(year);
  const S = slides(d);
  const root = document.createElement("div");
  root.className = "wrapped";
  root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", `Your ${d.year} Wrapped`);
  root.innerHTML = `<div class="wr-bg" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="wr-bars">${S.map(() => `<span><i></i></span>`).join("")}</div>
    <button class="wr-x" type="button" aria-label="Close">${icon("x")}</button>
    <button class="wr-pause" type="button" aria-label="Pause">${icon("pause")}</button>
    <div class="wr-stage">${S.map((s, k) => `<section class="wr-slide" data-k="${k}" aria-hidden="true">${s.html}</section>`).join("")}</div>
    <p class="wr-hint">Tap to continue</p>`;
  document.body.appendChild(root);
  document.body.style.overflow = "hidden";
  const reduce = (document.documentElement.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches);
  W = { root, S, d, k: -1, t0: 0, elapsed: 0, paused: false, raf: 0, reduce, prevFocus: document.activeElement };

  const show = (k) => {
    k = Math.max(0, Math.min(S.length - 1, k));
    W.k = k; W.elapsed = 0; W.t0 = performance.now();
    $$(".wr-slide", root).forEach((s, i) => { s.classList.toggle("on", i === k); s.setAttribute("aria-hidden", String(i !== k)); });
    $$(".wr-bars span", root).forEach((b, i) => { b.classList.toggle("done", i < k); b.querySelector("i").style.transform = `scaleX(${i < k ? 1 : 0})`; });
    const s = S[k];
    root.style.setProperty("--wr-h", s.hue);
    root.style.removeProperty("--wr-tint");
    if (s.tint) coverTint(s.tint).then((t) => { if (t && W?.k === k) root.style.setProperty("--wr-tint", t); });
    root.classList.toggle("is-final", !!s.final);
    countUp($$(".wr-slide", root)[k]);
    $(".wr-hint", root).hidden = k > 0;
  };
  const countUp = (slide) => {
    $$(".wr-count", slide).forEach((n) => {
      const to = Number(n.dataset.to) || 0;
      if (W.reduce || to < 2) { n.textContent = fmtNum(to); return; }
      const t0 = performance.now(), dur = 1300;
      const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); n.textContent = fmtNum(Math.round(to * e)); if (p < 1 && n.isConnected) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  };
  const tick = (t) => {
    if (!W || W.root !== root) return;
    if (!W.paused && !S[W.k].final) {
      const p = Math.min(1, (W.elapsed + (t - W.t0)) / SLIDE_MS);
      const bar = $$(".wr-bars i", root)[W.k];
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (p >= 1) show(W.k + 1);
    } else if (S[W.k].final) { const bar = $$(".wr-bars i", root)[W.k]; if (bar) bar.style.transform = "scaleX(1)"; }
    W.raf = requestAnimationFrame(tick);
  };
  const pause = (on) => {
    if (W.paused === on) return;
    if (on) W.elapsed += performance.now() - W.t0; else W.t0 = performance.now();
    W.paused = on;
    root.classList.toggle("paused", on);
    $(".wr-pause", root).innerHTML = icon(on ? "play" : "pause");
    $(".wr-pause", root).setAttribute("aria-label", on ? "Play" : "Pause");
  };
  W.show = show; W.pause = pause;

  // Tap left third to go back, anywhere else to go on. Holding pauses.
  let downAt = 0, holdT = 0;
  $(".wr-stage", root).addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a")) return;
    downAt = performance.now();
    holdT = setTimeout(() => pause(true), 220);
  });
  $(".wr-stage", root).addEventListener("pointerup", (e) => {
    clearTimeout(holdT);
    if (e.target.closest("button, a")) return;
    const held = performance.now() - downAt > 220;
    if (held) { pause(false); return; }
    const x = e.clientX / innerWidth;
    show(W.k + (x < 0.33 ? -1 : 1));
  });
  $(".wr-stage", root).addEventListener("pointercancel", () => { clearTimeout(holdT); pause(false); });
  $(".wr-x", root).onclick = closeWrapped;
  $(".wr-pause", root).onclick = () => pause(!W.paused);
  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-wr]");
    if (!b) return;
    if (b.dataset.wr === "close") closeWrapped();
    else if (b.dataset.wr === "replay") show(0);
    else if (b.dataset.wr === "save") {
      const { wrappedImage } = await import("./views/stats.js");
      const blob = await wrappedImage({ year: d.year, pages: d.pages, minutes: d.minutes, finished: d.finished.length, goal: d.goal, streak: d.best, days: d.days, top: d.top.slice(0, 3).map((t) => t.item.title), hour: d.peak != null ? hourLabel(d.peak) : null, words: d.vocab });
      (await import("./lookup.js")).saveBlob(blob, `kitsune-wrapped-${d.year}.png`);
    }
  });
  W.onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeWrapped(); }
    else if (e.key === "ArrowRight" || (e.key === " " && !e.target.closest?.("button"))) { e.preventDefault(); show(W.k + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(W.k - 1); }
    else if (e.key.toLowerCase() === "p") pause(!W.paused);
  };
  document.addEventListener("keydown", W.onKey, true);
  W.onVis = () => { if (document.hidden) pause(true); };
  document.addEventListener("visibilitychange", W.onVis);
  show(0);
  $(".wr-x", root).focus({ preventScroll: true });
  W.raf = requestAnimationFrame(tick);
}

export function closeWrapped() {
  if (!W) return;
  cancelAnimationFrame(W.raf);
  document.removeEventListener("keydown", W.onKey, true);
  document.removeEventListener("visibilitychange", W.onVis);
  const { root, prevFocus } = W;
  W = null;
  root.classList.add("closing");
  setTimeout(() => root.remove(), 260);
  if ($("#book").hidden && $("#reader").hidden) document.body.style.overflow = "";
  prevFocus?.focus?.({ preventScroll: true });
}
