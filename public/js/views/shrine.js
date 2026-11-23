// The Fox Shrine: playful ways into your shelf. Night Sky, a daily fortune, blind dates, title clash and first lines.
import { $, $$, esc, toast, coverHtml, today } from "../util.js";
import { setCrumbs } from "../main.js";
import { lib, kvGet, kvSet, allProgress, progressPct, coverSrc, getItem, seriesKey } from "../store.js";
import { ORIGINALS, addOriginal } from "../originals.js";
import { openItem } from "./common.js";
import { isKids } from "../profiles.js";

const TABS = [["sky", "Night sky"], ["fortune", "Daily fortune"], ["date", "Blind date"], ["clash", "Title clash"], ["lines", "First lines"]];
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a, r = Math.random) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const readable = () => lib.items.filter((i) => ["manga", "book", "audio"].includes(i.type) && !(isKids() && i.mature));
const done = (i, p) => i.status === "completed" || progressPct(p) >= 100;
const srcOf = (e) => (e.cover && !getItem(e.id) ? e.cover : coverSrc(e));
const pool = () => { const mine = readable(), have = new Set(mine.map((i) => i.id)); return [...mine, ...ORIGINALS.filter((o) => !have.has(o.id) && o.cover)]; };
async function openEntry(e) { let it = getItem(e.id); if (!it && e.file) { await addOriginal(e); it = getItem(e.id); } if (it) openItem(it); else toast("That title is no longer on your shelf."); }
const cover = (e) => coverHtml(srcOf(e), e.title);

function sky(b) {
  const items = readable();
  if (!items.length) { b.innerHTML = `<div class="empty"><p><strong>The sky is empty.</strong> Add something to your library and its star appears here.</p><a class="btn" href="#books">Find a book</a></div>`; return; }
  b.innerHTML = `<div class="sky-wrap"><canvas id="sky-c" role="img" aria-label="Star map of your library: ${items.length} titles"></canvas>
    <div class="sky-legend"><span><i style="background:#ffd27a"></i>Finished</span><span><i style="background:#ff8f5c"></i>Reading</span><span><i style="background:#9db4ff"></i>Unread</span></div>
    <div class="sky-zoom"><button class="btn" type="button" data-z="1.3" aria-label="Zoom in">+</button><button class="btn" type="button" data-z=".77" aria-label="Zoom out">−</button><button class="btn" type="button" id="sky-fit">Fit</button></div>
    <div class="sky-tip" id="sky-tip" hidden></div><div class="sky-card" id="sky-card" hidden></div></div>
    <label class="sky-find">Find a star <select id="sky-find"><option value="">Choose a title</option>${items.slice().sort((x, y) => x.title.localeCompare(y.title)).map((i) => `<option value="${esc(i.id)}">${esc(i.title)}</option>`).join("")}</select></label>`;
  const c = $("#sky-c", b), g = c.getContext("2d"), tip = $("#sky-tip", b), card = $("#sky-card", b);
  let stars = [], lines = [], dust = [], view = { x: 0, y: 0, k: 1 }, hot = null, picked = null, raf = 0, W = 0, H = 0, dirty = true, alive = true;
  const build = async () => {
    const P = await allProgress(), groups = new Map();
    for (const it of items) { const k = seriesKey(it); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
    [...groups.entries()].sort((x, y) => y[1].length - x[1].length || x[0].localeCompare(y[0])).forEach(([k, list], gi) => {
      const r = rng(hash(k)), ang = gi * 2.39996, rad = 70 * Math.sqrt(gi + .25), cx = Math.cos(ang) * rad, cy = Math.sin(ang) * rad;
      let dir = r() * 6.28, x = cx, y = cy, prev = null;
      list.sort((a, z) => a.title.localeCompare(z.title, undefined, { numeric: true })).forEach((it, j) => {
        if (j) { dir += (r() - .5) * 1.7; const step = 15 + r() * 11; x += Math.cos(dir) * step; y += Math.sin(dir) * step; }
        const p = P[it.id], pct = progressPct(p), size = it.pages || (it.words ? it.words / 250 : 40);
        const s = { it, x, y, r: 1.8 + Math.min(4.4, Math.log10(size + 1) * 1.45), c: done(it, p) ? "#ffd27a" : pct > 0 ? "#ff8f5c" : "#9db4ff", tw: r() * 6.28 };
        stars.push(s); if (prev) lines.push([prev, s]); prev = s;
      });
    });
    const r = rng(77); dust = Array.from({ length: 260 }, () => [r(), r(), r() * 1.2 + .25, r() * .42 + .08]);
    size(); fit();
  };
  const size = () => { const dpr = Math.min(2, devicePixelRatio || 1), box = c.getBoundingClientRect(); W = box.width; H = box.height; c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true; };
  const fit = () => { if (!stars.length) return; const xs = stars.map((s) => s.x), ys = stars.map((s) => s.y), a = Math.min(...xs), z = Math.max(...xs), t = Math.min(...ys), u = Math.max(...ys); view.k = Math.min(3, Math.min((W - 90) / Math.max(1, z - a), (H - 110) / Math.max(1, u - t))); view.x = W / 2 - (a + z) / 2 * view.k; view.y = H / 2 - (t + u) / 2 * view.k; dirty = true; };
  const sx = (s) => s.x * view.k + view.x, sy = (s) => s.y * view.k + view.y;
  const draw = (t) => {
    const f = g.createRadialGradient(W * .5, H * .36, 10, W * .5, H * .5, Math.max(W, H) * .78); f.addColorStop(0, "#28244f"); f.addColorStop(.55, "#131433"); f.addColorStop(1, "#070817"); g.fillStyle = f; g.fillRect(0, 0, W, H);
    for (const [x, y, r, a] of dust) { g.globalAlpha = a; g.fillStyle = "#dfe6ff"; g.beginPath(); g.arc(((x * W + view.x * .05) % W + W) % W, ((y * H + view.y * .05) % H + H) % H, r, 0, 7); g.fill(); }
    g.globalAlpha = .34; g.strokeStyle = "#a9b8ff"; g.lineWidth = 1; g.beginPath(); for (const [p, q] of lines) { g.moveTo(sx(p), sy(p)); g.lineTo(sx(q), sy(q)); } g.stroke();
    for (const s of stars) {
      const x = sx(s), y = sy(s); if (x < -30 || y < -30 || x > W + 30 || y > H + 30) continue;
      const pulse = calm() ? 1 : .86 + Math.sin(t / 900 + s.tw) * .14, on = s === hot || s === picked, r = s.r * Math.max(.8, Math.min(1.7, Math.sqrt(view.k))) * (on ? 1.5 : 1);
      g.fillStyle = s.c; g.globalAlpha = .17 * pulse; g.beginPath(); g.arc(x, y, r * 3.3, 0, 7); g.fill(); g.globalAlpha = pulse; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      if (on) { g.globalAlpha = 1; g.strokeStyle = "#fff"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r + 6, 0, 7); g.stroke(); }
    }
    g.globalAlpha = 1;
  };
  const loop = (t) => { if (!alive) return; if (!calm() || dirty) { draw(t); dirty = false; } raf = requestAnimationFrame(loop); };
  const near = (e) => { const b2 = c.getBoundingClientRect(), mx = e.clientX - b2.left, my = e.clientY - b2.top; let best = null, d = 18 * 18; for (const s of stars) { const q = (sx(s) - mx) ** 2 + (sy(s) - my) ** 2; if (q < d) { d = q; best = s; } } return [best, mx, my]; };
  const pick = (s) => { picked = s; dirty = true; if (!s) { card.hidden = true; return; } card.hidden = false; card.innerHTML = `<div class="sky-cv">${cover(s.it)}</div><div><strong>${esc(s.it.title)}</strong><p class="muted">${s.c === "#ffd27a" ? "Finished" : s.c === "#ff8f5c" ? "Reading" : "Unread"}</p><button class="btn btn-accent" type="button" id="sky-open">Open</button> <button class="btn" type="button" id="sky-x">Close</button></div>`; $("#sky-open", card).onclick = () => openEntry(s.it); $("#sky-x", card).onclick = () => pick(null); };
  const zoomAt = (m, mx = W / 2, my = H / 2) => { const k = Math.max(.25, Math.min(9, view.k * m)); view.x = mx - (mx - view.x) * (k / view.k); view.y = my - (my - view.y) * (k / view.k); view.k = k; dirty = true; };
  let drag = null;
  c.onpointerdown = (e) => { drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: 0 }; c.setPointerCapture(e.pointerId); };
  c.onpointermove = (e) => { if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy)); view.x = drag.vx + dx; view.y = drag.vy + dy; dirty = true; tip.hidden = true; return; } const [s, x, y] = near(e); if (s !== hot) { hot = s; dirty = true; } c.style.cursor = s ? "pointer" : "grab"; tip.hidden = !s; if (s) { tip.textContent = s.it.title; tip.style.left = Math.min(W - 180, x + 14) + "px"; tip.style.top = y + 14 + "px"; } };
  c.onpointerup = (e) => { if (drag && drag.moved < 5) pick(near(e)[0]); drag = null; };
  c.onwheel = (e) => { e.preventDefault(); const r = c.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.12 : .89, e.clientX - r.left, e.clientY - r.top); };
  $$("[data-z]", b).forEach((x) => (x.onclick = () => zoomAt(+x.dataset.z)));
  $("#sky-fit", b).onclick = fit;
  $("#sky-find", b).onchange = (e) => { const s = stars.find((q) => q.it.id === e.target.value); if (!s) return; view.k = Math.max(view.k, 1.8); view.x = W / 2 - s.x * view.k; view.y = H / 2 - s.y * view.k; pick(s); };
  const ro = new ResizeObserver(() => { size(); }); ro.observe(c);
  build().then(() => { raf = requestAnimationFrame(loop); });
  return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
}

const LOTS = [["Great blessing", "大吉", "Whatever you open tonight will be exactly the right book."], ["Blessing", "吉", "A chapter ends well. Do not read the next one at 2am. You will read the next one at 2am."], ["Middle blessing", "中吉", "An old bookmark remembers you fondly."], ["Small blessing", "小吉", "Ten pages today will count for more than you expect."], ["Half blessing", "半吉", "You will finish something, or at least stop pretending you will."], ["Future blessing", "末吉", "The slow first act pays off. Hold on until chapter four."], ["Curse of the long backlog", "凶", "Your pile grows by one. Break it by reading the shortest thing on it."]];
const ASPECTS = { Cliffhangers: ["Merciless", "Survivable", "Avoid before bed", "In your favour"], Snacks: ["Something salted", "Tea, steeped too long", "Toast", "Dumplings, urgently"], "Reading spot": ["By a window", "Under a blanket", "On a train", "The good chair"], Plot: ["Twist incoming", "Trust nobody", "The quiet one did it", "It was love all along"] };
async function fortune(b) {
  const paint = (rec) => {
    const r = rng(hash("lot" + rec.d)), lot = LOTS[rec.n], e = getItem(rec.id) || ORIGINALS.find((o) => o.id === rec.id);
    b.innerHTML = `<div class="omi"><article class="omi-slip"><span class="omi-kanji" lang="ja">${lot[1]}</span><div><p class="eyebrow">Today's fortune</p><h2>${esc(lot[0])}</h2><p>${esc(lot[2])}</p><dl>${Object.entries(ASPECTS).map(([k, v]) => `<div><dt>${k}</dt><dd>${v[Math.floor(r() * v.length)]}</dd></div>`).join("")}<div><dt>Lucky number</dt><dd>${1 + Math.floor(r() * 99)}</dd></div></dl></div></article>
      ${e ? `<aside class="omi-pick"><p class="eyebrow">The shrine suggests</p><div class="omi-cv">${cover(e)}</div><strong>${esc(e.title)}</strong><button class="btn btn-accent" type="button" id="omi-open">Open it</button></aside>` : ""}</div><p class="hint">A new slip can be drawn at midnight.</p>`;
    if (e) $("#omi-open", b).onclick = () => openEntry(e);
  };
  const log = (await kvGet("omikuji", {})) || {};
  if (log.d === today()) return paint(log);
  b.innerHTML = `<div class="omi-draw"><button class="omi-box" type="button" id="omi-go" aria-label="Draw today's fortune"><span>みくじ</span><i></i></button><p><strong>Shake the box.</strong> One slip a day.</p></div>`;
  $("#omi-go", b).onclick = async (ev) => {
    ev.currentTarget.classList.add("shake"); await new Promise((r) => setTimeout(r, calm() ? 0 : 900));
    const P = await allProgress(), left = pool().filter((e) => !done(e, P[e.id])), n = Math.floor(Math.random() * LOTS.length), pick = left[Math.floor(Math.random() * left.length)], rec = { d: today(), n, id: pick?.id || "" };
    kvSet("omikuji", rec); document.dispatchEvent(new CustomEvent("kitsune:done")); paint(rec);
  };
}

const clueOf = (e, P) => {
  const kind = e.type === "manga" ? "Manga" : e.type === "audio" ? "Audiobook" : "Prose", len = e.minutes ? `${e.minutes} minute read` : e.pages ? `${e.pages} pages` : e.words ? `${Math.round(e.words / 250)} minutes or so` : "Length unknown";
  const text = String(e.blurb || e.description || "").replace(/<[^>]+>/g, " ").split(new RegExp(String(e.title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig")).join("something").trim();
  return { kind, len, state: getItem(e.id) ? (P[e.id] ? "You've been here before" : "Waiting on your shelf") : "Not on your shelf yet", text: text ? text.slice(0, 130) + (text.length > 130 ? "…" : "") : "No description. It wants to be a surprise." };
};
async function blind(b) {
  const P = await allProgress(), left = shuffle(pool().filter((e) => !done(e, P[e.id]))).slice(0, 3);
  if (!left.length) { b.innerHTML = `<p class="muted">You've finished everything. Add something new and come back.</p>`; return; }
  b.innerHTML = `<p class="muted">Three titles in brown paper. You get the clues. Unwrap one.</p><div class="bd-row">${left.map((e, i) => { const c = clueOf(e, P); return `<article class="bd"><div class="bd-wrap"><span>№ ${i + 1}</span><b>${esc(c.kind)}</b><small>${esc(c.len)}</small><em>${esc(c.state)}</em><p>“${esc(c.text)}”</p><button class="btn btn-accent" type="button" data-un="${i}">Unwrap</button></div></article>`; }).join("")}</div><button class="btn" type="button" id="bd-more" style="margin-top:16px">Three more</button>`;
  $("#bd-more", b).onclick = () => blind(b);
  $$("[data-un]", b).forEach((x) => (x.onclick = () => { const e = left[+x.dataset.un], a = x.closest(".bd"); a.classList.add("open"); a.innerHTML = `<div class="bd-cv">${cover(e)}</div><strong>${esc(e.title)}</strong><button class="btn btn-accent" type="button">Read it</button>`; $("button", a).onclick = () => openEntry(e); }));
}

function clash(b, off) {
  const start = async (size) => {
    const list = shuffle(pool()).slice(0, size); if (list.length < 2) { b.innerHTML = `<p class="muted">Add at least two titles.</p>`; return; }
    let round = list, next = [], i = 0;
    const key = (e) => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; if (!$("[data-w]", b)) return; e.preventDefault(); e.stopPropagation(); win(e.key === "ArrowLeft" ? 0 : 1); };
    document.addEventListener("keydown", key, true); off.push(() => document.removeEventListener("keydown", key, true));
    const win = (w) => { next.push(round[i + w]); i += 2; if (i === round.length - 1) { next.push(round[i]); i += 1; } if (i >= round.length) { round = next; next = []; i = 0; } if (round.length === 1) champ(round[0]); else show(); };
    const show = () => { const a = round[i], z = round[i + 1], name = round.length === 2 ? "Final" : round.length <= 4 ? "Semi-final" : round.length <= 8 ? "Quarter-final" : `Round of ${round.length}`; b.innerHTML = `<div class="cl-head"><span class="pill">${name}</span><span class="muted">Match ${Math.floor(i / 2) + 1} of ${Math.floor(round.length / 2)}</span></div><div class="cl-arena">${[a, z].map((e, n) => `<button class="cl-card" type="button" data-w="${n}" aria-label="Choose ${esc(e.title)}"><span class="cl-cv">${cover(e)}</span><strong>${esc(e.title)}</strong></button>`).join(`<span class="cl-vs">VS</span>`)}</div><p class="hint">Click one, or press the left or right arrow.</p>`; $$("[data-w]", b).forEach((x) => (x.onclick = () => win(+x.dataset.w))); };
    const champ = async (e) => { const wins = (await kvGet("clashWins", {})) || {}; wins[e.id] = (wins[e.id] || 0) + 1; kvSet("clashWins", wins); document.dispatchEvent(new CustomEvent("kitsune:done")); b.innerHTML = `<div class="cl-champ"><p class="eyebrow">Champion</p><div class="cl-cv">${cover(e)}</div><h2>${esc(e.title)}</h2><p class="muted">${wins[e.id] === 1 ? "First title win." : `${wins[e.id]} title wins.`}</p><button class="btn btn-accent" type="button" id="cl-read">Read it</button> <button class="btn" type="button" id="cl-again">Play again</button></div>`; $("#cl-read", b).onclick = () => openEntry(e); $("#cl-again", b).onclick = menu; };
    show();
  };
  const menu = async () => {
    const wins = (await kvGet("clashWins", {})) || {}, top = Object.entries(wins).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([id, n]) => [getItem(id) || ORIGINALS.find((o) => o.id === id), n]).filter(([e]) => e);
    b.innerHTML = `<p class="muted">A knockout tournament between your titles. One survives.</p><div class="chips">${[8, 16, 32].map((n) => `<button class="chip" type="button" data-n="${n}">${n} titles</button>`).join("")}</div>${top.length ? `<h3 class="h3" style="margin-top:22px">Hall of champions</h3><ol class="cl-hall">${top.map(([e, n]) => `<li><span>${esc(e.title)}</span><span class="mono">${n}</span></li>`).join("")}</ol>` : ""}`;
    $$("[data-n]", b).forEach((x) => (x.onclick = () => start(+x.dataset.n)));
  };
  menu();
}

const firstLine = (t) => { const ps = t.replace(/\r/g, "").split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter((p) => p.length > 45 && /[a-z]/.test(p) && !/Kitsune Original|Creative Commons|All rights reserved/i.test(p)); if (!ps[0]) return ""; const m = ps[0].match(/^.{30,}?[.!?]["”’)]?(?=\s|$)/); return (m ? m[0] : ps[0]).slice(0, 260); };
async function lines(b, off) {
  const list = ORIGINALS.filter((o) => o.type === "book" && o.file);
  b.innerHTML = `<p class="muted">Loading the first lines…</p>`;
  const got = (await Promise.all(list.map(async (o) => { try { const r = await fetch(o.file); if (!r.ok) return null; const line = firstLine(await r.text()); return line ? { o, line } : null; } catch { return null; } }))).filter(Boolean);
  if (!b.isConnected) return;
  if (got.length < 4) { b.innerHTML = `<p class="muted">The stories couldn't be loaded. Check your connection and try again.</p>`; return; }
  const best = (await kvGet("linesBest", 0)) || 0, qs = shuffle(got).slice(0, Math.min(8, got.length)); let at = 0, score = 0, lock = false;
  const answer = (n, opts) => { if (lock) return; lock = true; const right = opts[n] === qs[at]; if (right) score++; document.dispatchEvent(new CustomEvent(right ? "kitsune:choice" : "kitsune:blip")); $$("[data-a]", b).forEach((x, i) => { x.disabled = true; x.classList.toggle("ok", opts[i] === qs[at]); x.classList.toggle("no", i === n && !right); }); setTimeout(() => { if (!b.isConnected) return; at++; lock = false; at < qs.length ? show() : end(); }, right ? 750 : 1400); };
  let keyOpts = null;
  const key = (e) => { if (!/^[1-4]$/.test(e.key) || !keyOpts || e.target.matches?.("input,textarea,select")) return; e.preventDefault(); e.stopPropagation(); answer(+e.key - 1, keyOpts); };
  document.addEventListener("keydown", key, true); off.push(() => document.removeEventListener("keydown", key, true));
  const show = () => { const q = qs[at], opts = shuffle([q, ...shuffle(got.filter((x) => x !== q)).slice(0, 3)]); keyOpts = opts; b.innerHTML = `<div class="fl"><div class="cl-head"><span class="pill">${at + 1} of ${qs.length}</span><span class="muted">Score ${score}</span></div><blockquote>${esc(q.line)}</blockquote><div class="fl-opts">${opts.map((x, i) => `<button class="btn" type="button" data-a="${i}"><kbd>${i + 1}</kbd> ${esc(x.o.title)}</button>`).join("")}</div></div>`; $$("[data-a]", b).forEach((x, i) => (x.onclick = () => answer(i, opts))); };
  const end = () => { keyOpts = null; const nb = Math.max(best, score); kvSet("linesBest", nb); b.innerHTML = `<div class="cl-champ"><p class="eyebrow">Final score</p><h2>${score} of ${qs.length}</h2><p class="muted">${score === qs.length ? "Perfect. You have read these." : score > best ? "New personal best." : `Best: ${nb}.`}</p><button class="btn btn-accent" type="button" id="fl-again">Play again</button></div>`; $("#fl-again", b).onclick = () => { off.splice(0).forEach((f) => f()); lines(b, off); }; };
  show();
}

export async function render(view, _name, params = []) {
  const tab = TABS.some(([k]) => k === params[0]) ? params[0] : "sky";
  setCrumbs([["Fox Shrine", "shrine"], [TABS.find(([k]) => k === tab)[1], "shrine/" + tab]]);
  view.innerHTML = `<div class="shrine"><header><p class="eyebrow">Fox Shrine</p><h1 class="h2">Play with your shelf</h1></header><nav class="chips" aria-label="Shrine sections">${TABS.map(([k, l]) => `<a class="chip${k === tab ? " on" : ""}" ${k === tab ? 'aria-current="page"' : ""} href="#shrine/${k}">${l}</a>`).join("")}</nav><section id="shrine-b"></section></div>`;
  const b = $("#shrine-b", view), off = [];
  if (tab === "sky") { const stop = sky(b); if (stop) off.push(stop); }
  else if (tab === "fortune") await fortune(b);
  else if (tab === "date") await blind(b);
  else if (tab === "clash") clash(b, off);
  else await lines(b, off);
  return () => off.splice(0).forEach((f) => f());
}
