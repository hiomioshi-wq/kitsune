// Moonwake Bay's east district: bug catching with a net, the Butterfly Conservatory, the Mooncrumb Bakery job
// and the Gift Wagon with its plushie shelf. Bugs wander the whole town — the meadow flowers, the grass and the sand.
import { BW, BH, TILE, RAR_C, RARITY } from "./baycore.js";
import { WEAR, EGGS } from "./baycare.js";

export const BUGS = [
  ["ladybug", "Ladybug", "🐞", "flower", 0], ["ant", "Sugar ant", "🐜", "grass", 0], ["fly", "Beach fly", "🪰", "sand", 0], ["hopper", "Grasshopper", "🦗", "grass", 0],
  ["white", "Cabbage white", "🦋", "flower", 0], ["snail", "Garden snail", "🐌", "flower", 0], ["roach", "Driftwood roach", "🪳", "sand", 0], ["mosquito", "Marsh mosquito", "🦟", "sand", 0],
  ["bee", "Bumblebee", "🐝", "flower", 1], ["june", "June beetle", "🪲", "grass", 1], ["wolfspider", "Beach wolf spider", "🕷️", "sand", 1], ["mantis", "Orchid mantis", "🦗", "flower", 1],
  ["cricket", "Night cricket", "🦗", "flower", 2], ["firefly", "Firefly", "🪰", "flower", 2], ["scorpion", "Dune scorpion", "🦂", "sand", 2], ["stag", "Stag beetle", "🪲", "grass", 2],
  ["luna", "Luna moth", "🦋", "flower", 3], ["atlas", "Atlas beetle", "🪲", "flower", 3], ["rose", "Rose tarantula", "🕷️", "grass", 3], ["hornet", "Paper hornet", "🐝", "flower", 3],
  ["monarch", "Monarch", "🦋", "flower", 4], ["moonmoth", "Moon moth", "🦋", "flower", 4], ["glasswing", "Glasswing", "🦋", "flower", 4], ["comet", "Comet damselfly", "🦋", "sand", 4],
];
const bug = (id) => BUGS.find((x) => x[0] === id);
export const bugName = (u) => (bug(u.sp) || BUGS[0])[1];

// ---- Seashell School: trick training ----
export const TRICKS = [["sit", "Sit", "🦵"], ["spin", "Spin", "🌀"], ["speak", "Speak", "💬"], ["fetch", "Fetch", "🥏"], ["dance", "Dance", "💃"], ["backflip", "Backflip", "🤸"]];
const PRACTICE_AT = [0, 2, 5, 9, 14, 20], LESSON_COST = (lvl) => 8 + lvl * 6;
const trickList = (p) => TRICKS.map((t) => [t, p.tricks?.[t[0]] || 0]);
const trickSum = (p) => trickList(p).reduce((a, [t, l]) => a + l, 0);

export function schoolPage(ctx, pick = null) {
  const { b, page, esc, say, ping, save, pay, checkGoals } = ctx;
  const p = b.pets.find((q) => q.id === b.active);
  if (!p) return page("Seashell School", `<p>Adopt a critter first, then bring it back for lessons.</p>`);
  p.tricks ||= {};
  const name = p.name || "Your critter";
  if (pick) {
    const t = TRICKS.find((x) => x[0] === pick), lvl = p.tricks[pick] || 0;
    if (lvl >= 5) return schoolPage(ctx);
    return trickLesson(ctx, p, t, lvl);
  }
  const day = new Date().toDateString();
  b.day.trickDay ||= {};
  const showsToday = b.day.trickDay.d === day ? b.day.trickDay.n || 0 : 0;
  const sum = trickSum(p);
  page("Seashell School", `<p class="muted">${esc(name)} learns one trick at a time. Each lesson is a little routine to copy; the higher the level, the longer the routine. Mastered tricks go into the end-of-term showcase.</p><div class="by-list">${trickList(p).map(([t, lvl]) => { const at = PRACTICE_AT[lvl + 1] ?? Infinity, done = (p.tricks._p?.[t[0]] || 0); return `<div class="${lvl >= 5 ? "ok" : ""}"><i>${t[2]}</i><span><strong>${esc(t[1])} · level ${lvl}${lvl >= 5 ? " (mastered)" : ""}</strong><small>${lvl >= 5 ? "Ready for the showcase" : `${done} practice · ${at - done} more to level ${lvl + 1} · lesson ${LESSON_COST(lvl)} shells`}</small></span>${lvl >= 5 ? "<em>★</em>" : `<button class="btn btn-accent" type="button" data-l="${t[0]}" ${b.shells >= LESSON_COST(lvl) ? "" : "disabled"}>Train</button>`}</div>`; }).join("")}</div><h3>Showcase</h3><div class="by-list"><div><i>🎭</i><span><strong>Perform all mastered tricks</strong><small>${sum ? `Worth about ${15 + sum * 6} shells` : "No mastered tricks yet"}${showsToday ? ` · ${showsToday}/3 today` : ""}</small></span><button class="btn btn-accent" type="button" id="wk-show" ${sum && showsToday < 3 ? "" : "disabled"}>Perform</button></div></div>`, (e) => {
    e.querySelectorAll("[data-l]").forEach((x) => (x.onclick = () => schoolPage(ctx, x.dataset.l)));
    e.querySelector("#wk-show").onclick = () => {
      if (b.day.trickDay.d !== day) b.day.trickDay = { d: day, n: 0 };
      if (!sum || b.day.trickDay.n >= 3) return;
      b.day.trickDay.n++;
      const v = pay(b, 15 + sum * 6);
      b.t.shows = (b.t.shows || 0) + 1;
      save(); ping("done"); say(`${name} takes a bow! +${v} shells`); checkGoals();
      schoolPage(ctx);
    };
  });
}

function trickLesson(ctx, p, t, lvl) {
  const { b, page, esc, say, ping, save, pay, checkGoals } = ctx;
  const name = p.name || "Your critter";
  p.tricks._p ||= {};
  const steps = 3 + lvl, seq = Array.from({ length: steps }, () => Math.floor(Math.random() * 4));
  const ARROWS = ["←", "↑", "→", "↓"];
  let phase = "watch", show = 0, made = 0, t0 = 0, cost = LESSON_COST(lvl);
  const paintShow = (e) => {
    e.querySelector("#wk-seq").innerHTML = seq.map((a, i) => `<b class="${i < show ? "lit" : ""}">${ARROWS[a]}</b>`).join("");
    e.querySelector("#wk-st").textContent = phase === "watch" ? (show < seq.length ? "Watch the routine…" : "Your turn!") : phase === "do" ? `Copy it: ${made}/${seq.length}` : "";
  };
  page(`${t[1]} lesson`, `<p class="muted">${esc(name)}, level ${lvl}. Watch the routine, then copy it with the arrow buttons (or your keyboard). One slip and the lesson starts over; the fee is only taken when it's learned.</p><div class="by-jobtop"><strong id="wk-st"></strong><strong id="wk-fee">${cost} shells</strong></div><div class="wk-seq" id="wk-seq"></div><div class="by-flav">${ARROWS.map((a, i) => `<button type="button" data-a="${i}" ${phase === "watch" ? "disabled" : ""}>${a}</button>`).join("")}</div><button class="btn" type="button" id="wk-quit">Stop the lesson</button>`, (e) => {
    const stEl = e.querySelector("#wk-st"), btns = [...e.querySelectorAll("[data-a]")];
    const setPhase = (ph) => { phase = ph; btns.forEach((x) => (x.disabled = ph === "watch")); paintShow(e); };
    const start = () => {
      setPhase("watch"); made = 0; show = 0;
      t0 = setInterval(() => {
        show++;
        ping("blip");
        paintShow(e);
        if (show >= seq.length) { clearInterval(t0); t0 = 0; setPhase("do"); }
      }, 780);
    };
    const doStep = (i) => {
      if (phase !== "do") return;
      if (i === seq[made]) { made++; ping("blip"); if (made >= seq.length) { clearInterval(t0); t0 = 0; const was = lvl; p.tricks._p[t[0]] = (p.tricks._p[t[0]] || 0) + 1; let grew = ""; if ((p.tricks._p[t[0]] || 0) >= PRACTICE_AT[was + 1]) { p.tricks[t[0]] = was + 1; p.tricks._p[t[0]] = 0; grew = ` ${t[1]} is now level ${was + 1}!`; } b.shells -= cost; const v = pay(b, 10 + lvl * 4); save(); ping("done"); say(`Lesson learned!${grew} +${v} shells back as a gold star`); checkGoals(); return schoolPage(ctx); } }
      else { ping("close"); made = 0; start(); }
      stEl.textContent = `Copy it: ${made}/${seq.length}`;
    };
    btns.forEach((x) => (x.onclick = () => doStep(+x.dataset.a)));
    const keyH = (ev) => { if (ev.repeat) return; const i = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].indexOf(ev.key); if (i < 0) return; ev.preventDefault(); ev.stopPropagation(); doStep(i); };
    window.addEventListener("keydown", keyH, true);
    e.querySelector("#wk-quit").onclick = () => schoolPage(ctx);
    start();
    return () => { clearInterval(t0); window.removeEventListener("keydown", keyH, true); };
  });
}

export const NETS = [["frond", "Palm Frond Net", 0, "The one everyone starts with"], ["woven", "Woven Net", 150, "A steadier hoop, kinder to butterflies"], ["brass", "Brass Ring Net", 450, "Heavy, honest, hard to miss with"], ["moon", "Moon-Silk Net", 1200, "Woven by the Conservatory's own moths"]];
const CATCH_BASE = [.92, .8, .6, .38, .18], NET_BONUS = [0, .08, .15, .25];
const BUG_VAL = [8, 14, 24, 40, 75], BUG_TIX = [0, 0, 1, 2, 4];

export const PLUSH = [["otter", "Otter plush", "🦦"], ["crab", "Crab plush", "🦀"], ["seal", "Seal plush", "🦭"], ["bunny", "Bunny plush", "🐰"], ["panda", "Red panda plush", "🦝"], ["capy", "Capybara plush", "🐹"], ["turtle", "Turtle plush", "🐢"], ["jelly", "Jellyfish plush", "🪼"], ["axolotl", "Axolotl plush", "🦎"], ["tanuki", "Tanuki plush", "🦡"], ["foxkit", "Sea fox plush", "🦊"], ["golden", "Golden Moonwake plush", "👑"]];
export const GIFT_TIERS = [["drift", "Driftwood Gift", 120, 300, "A rough little parcel"], ["moon", "Moonwake Gift", 320, 300, "Tied with moonlight ribbon"], ["star", "Starlight Gift", 850, 300, "It hums faintly"]];
const GIFT_WAIT = 5 * 60 * 1000;

const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; }, rngFor = (k) => { let h = hash(k); return () => { h = (Math.imul(h ^ (h >>> 13), 1274126177) + 7) >>> 0; return h / 4294967296; }; };

export function ensureWild(b) { const w = (b.wild ||= {}); w.net ||= 0; w.bugs ||= {}; w.plush ||= {}; w.gifts ||= []; if (w.nid === undefined) w.nid = 1; const d = new Date().toDateString(); if (w.day?.d !== d) w.day = { d, done: {} }; return w; }
export const featuredBug = (day) => { const r = rngFor("wild-feature" + day), pool = BUGS.filter((x) => x[4] >= 2); return pool[Math.floor(r() * pool.length)]; };
export const CONTEST_STEPS = [3, 5, 8, 12];
const CONTEST_PAY = [40, 70, 110, 160], CONTEST_TIX = [4, 6, 8, 12];
export const contestTarget = (day) => { const r = rngFor("wild-contest" + day), pool = BUGS.filter((x) => x[4] <= 2); return pool[Math.floor(r() * pool.length)]; };
const ensureContest = (w, day) => (w.day.contest ||= { hits: 0, claimed: {} });

// ---- the bugs themselves (per-visit, not saved) ----
let live = [], uid = 1, spawnT = 2, swingFx = null, lastSwing = 0;

function spawnOne(day, map, px, py) {
  const r = Math.random, q = r(), rar = q < .48 ? 0 : q < .76 ? 1 : q < .9 ? 2 : q < .98 ? 3 : 4, feat = featuredBug(day);
  let pool = BUGS.filter((x) => x[4] === rar);
  if (r() < .1) pool = [feat];
  const d = pool[Math.floor(r() * pool.length)] || BUGS[0];
  const want = d[3] === "flower" ? TILE.flower : d[3] === "sand" ? TILE.sand : TILE.grass;
  for (let tries = 0; tries < 50; tries++) {
    const X = 2 + Math.floor(r() * (BW - 4)), Y = 2 + Math.floor(r() * (BH - 6)), i = Y * BW + X;
    if (map.g[i] !== want || map.solid[i]) continue;
    const x = (X + .5) * 32, y = (Y + .5) * 32;
    if (Math.hypot(x - px, y - py) < 150) continue;
    live.push({ u: uid++, sp: d[0], x, y, a: r() * 6.28, state: "idle", t: 1 + r() * 2, life: 45 + r() * 45, flap: r() * 7 });
    return;
  }
}

export function wildStep(dt, b, ctx) {
  const w = ensureWild(b), day = b.day?.d || new Date().toDateString();
  spawnT -= dt;
  if (live.length < 9 && spawnT <= 0) { spawnT = 2.5 + Math.random() * 3; spawnOne(day, ctx.map, ctx.px, ctx.py); }
  for (const u of live) {
    u.life -= dt; u.flap += dt * (u.state === "fly" || u.state === "flee" ? 14 : 3);
    const dist = Math.hypot(u.x - ctx.px, u.y - ctx.py);
    if (dist < 66 && u.state !== "flee") { u.state = "flee"; u.t = 1.3; u.a = Math.atan2(u.y - ctx.py, u.x - ctx.px) + (Math.random() - .5); }
    if (u.state === "flee") {
      const v = 135 * dt; const nx = u.x + Math.cos(u.a) * v, ny = u.y + Math.sin(u.a) * v;
      if (ctx.canWalk(nx, ny)) { u.x = Math.max(24, Math.min(BW * 32 - 24, nx)); u.y = Math.max(24, Math.min((BH - 3) * 32, ny)); } else u.a += 2.4;
      u.t -= dt; if (u.t <= 0) { u.state = "idle"; u.t = .6 + Math.random() * 1.4; }
    } else if (u.state === "fly") {
      const v = 42 * dt; const nx = u.x + Math.cos(u.a) * v, ny = u.y + Math.sin(u.a) * v;
      if (ctx.canWalk(nx, ny)) { u.x = nx; u.y = ny; } else { u.a = Math.random() * 6.28; u.state = "idle"; u.t = .4 + Math.random() * .8; }
      u.t -= dt; if (u.t <= 0) { u.state = "idle"; u.t = .8 + Math.random() * 2.2; }
    } else { u.t -= dt; if (u.t <= 0) { u.state = "fly"; u.t = .5 + Math.random() * 1.2; u.a = Math.random() * 6.28; } }
  }
  live = live.filter((u) => u.life > 0 && u.x > 0 && u.y > 0);
}

export function nearestBug(px, py, r = 48) { let best = null, bd = r; for (const u of live) { const d = Math.hypot(u.x - px, u.y - py); if (d < bd) { bd = d; best = u; } } return best; }

export function swingNet(ctx, u) {
  const { b, say, ping, burst, save, checkGoals, pay } = ctx, w = ensureWild(b), d = bug(u.sp) || BUGS[0];
  const now = performance.now();
  if (now - lastSwing < 550) return;
  lastSwing = now;
  swingFx = { x: u.x, y: u.y, at: now };
  const chance = Math.min(.97, CATCH_BASE[d[4]] + NET_BONUS[w.net] + (u.state === "idle" ? .1 : -.15));
  if (Math.random() < chance) {
    const isNew = !w.bugs[u.sp];
    w.bugs[u.sp] = (w.bugs[u.sp] || 0) + 1;
    b.t.caught = (b.t.caught || 0) + 1;
    const v = pay(b, BUG_VAL[d[4]]);
    const tix = BUG_TIX[d[4]];
    if (tix) { b.tickets = (b.tickets || 0) + tix; }
    const target = contestTarget(w.day.d || new Date().toDateString());
    let contestLine = "";
    if (d[0] === target[0]) { const ct = ensureContest(w, w.day.d); ct.hits = (ct.hits || 0) + 1; contestLine = ` · Contest catch ${ct.hits}!`; }
    burst(u.x, u.y, isNew ? 22 : 10);
    ping("done");
    say(`${isNew ? "New bug! " : ""}${d[1]} caught! +${v} shells${tix ? `, +${tix} ticket${tix > 1 ? "s" : ""}` : ""}${contestLine}`);
    live = live.filter((q) => q !== u);
  } else {
    u.state = "flee"; u.t = 1.4; u.a = Math.atan2(u.y - ctx.py || 1, u.x - ctx.px || 1) + (Math.random() - .5) * .8;
    ping("close");
    say(d[4] >= 2 ? `The ${d[1]} slipped away! A better net helps with the shy ones.` : "It slipped away!");
  }
  save(); checkGoals();
}

export function drawWild(g, b, now, inView) {
  for (const u of live) {
    if (!inView(u.x, u.y)) continue;
    const d = bug(u.sp) || BUGS[0];
    g.save();
    g.translate(u.x, u.y + Math.sin(u.flap) * 2.2);
    g.fillStyle = "rgba(0,0,0,.18)";
    g.beginPath(); g.ellipse(0, 9, 8, 3, 0, 0, 7); g.fill();
    if (d[0] === "firefly") { const gl = g.createRadialGradient(0, -2, 1, 0, -2, 16); gl.addColorStop(0, "rgba(255,230,120,.7)"); gl.addColorStop(1, "rgba(255,230,120,0)"); g.fillStyle = gl; g.beginPath(); g.arc(0, -2, 16, 0, 7); g.fill(); }
    if (d[4] >= 2) { g.strokeStyle = RAR_C[d[4]]; g.lineWidth = 1.8; g.beginPath(); g.arc(0, -1, 13, 0, 7); g.stroke(); }
    g.font = `${u.state === "flee" ? 19 : 17}px system-ui`; g.textAlign = "center";
    if (u.state === "flee") { g.rotate(Math.sin(u.flap * 3) * .2); }
    g.fillText(d[2], 0, 5);
    g.restore();
  }
  if (swingFx && now - swingFx.at < 420) {
    const p = (now - swingFx.at) / 420;
    g.save(); g.translate(swingFx.x, swingFx.y);
    g.strokeStyle = `rgba(255,255,255,${1 - p})`; g.lineWidth = 2.5;
    g.beginPath(); g.arc(0, 0, 14 + p * 34, -2.2 + p * 2.6, -.7 + p * 2.6); g.stroke();
    g.restore();
  }
}

// ---- Butterfly Conservatory ----
export function conservatoryPage(ctx, tab = "journal") {
  const { b, page, esc, say, ping, save, pay, checkGoals } = ctx, w = ensureWild(b), day = new Date().toDateString(), feat = featuredBug(day);
  const caught = Object.keys(w.bugs).length;
  const tabs = (cur) => `<div class="dy-tabs">${[["journal", `Bug book (${caught})`], ["marigold", "Marigold"], ["contest", "Contest"], ["net", "Nets"]].map(([k, l]) => `<button type="button" class="${k === cur ? "on" : ""}" data-t="${k}">${l}</button>`).join("")}</div>`;
  if (tab === "journal") {
    page("Butterfly Conservatory", `${tabs("journal")}<p class="muted">Marigold says the <strong style="color:${RAR_C[feat[4]]}">${esc(feat[1])}</strong> flutters somewhere in town today. ${b.t.caught || 0} bugs caught in all.</p><div class="by-dex">${BUGS.map((d) => `<div title="${esc(d[1])}" style="--r:${RAR_C[d[4]]}"><b>${d[2]}</b><small>${w.bugs[d[0]] ? esc(d[1]) : "???"}</small><small>${w.bugs[d[0]] ? `×${w.bugs[d[0]]} · ${RARITY[d[4]]}` : RARITY[d[4]]}</small></div>`).join("")}</div>`, (e) => e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => conservatoryPage(ctx, x.dataset.t))));
  } else if (tab === "contest") {
    const target = contestTarget(day), ct = ensureContest(w, day);
    page("Butterfly Conservatory", `${tabs("contest")}<p class="muted">Today's contest bug is the <strong style="color:${RAR_C[target[4]]}">${esc(target[1])}</strong> ${target[2]}. Every one you catch today counts toward Marigold's prize steps.</p><div class="by-list">${CONTEST_STEPS.map((n, i) => { const ok = (ct.hits || 0) >= n, claimed = ct.claimed?.[i]; return `<div class="${claimed ? "ok" : ""}"><i>${target[2]}</i><span><strong>${n} × ${esc(target[1])}</strong><small>${CONTEST_PAY[i]} shells · ${CONTEST_TIX[i]} tickets · ${claimed ? "Claimed" : `${Math.min(ct.hits || 0, n)}/${n} caught`}</small></span>${claimed ? "<em>Done</em>" : `<button class="btn btn-accent" type="button" data-ct="${i}" ${ok ? "" : "disabled"}>Claim</button>`}</div>`; }).join("")}</div>`, (e) => { e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => conservatoryPage(ctx, x.dataset.t))); e.querySelectorAll("[data-ct]").forEach((x) => (x.onclick = () => { const i = +x.dataset.ct; ct.claimed ||= {}; if (ct.claimed[i] || (ct.hits || 0) < CONTEST_STEPS[i]) return; ct.claimed[i] = 1; const v = pay(b, CONTEST_PAY[i]); b.tickets = (b.tickets || 0) + CONTEST_TIX[i]; save(); ping("done"); say(`Contest step ${i + 1}! +${v} shells, +${CONTEST_TIX[i]} tickets`); checkGoals(); conservatoryPage(ctx, "contest"); })); });
  } else if (tab === "net") {
    page("Butterfly Conservatory", `${tabs("net")}<div class="by-list">${NETS.map((n, i) => { const own = w.net >= i, next = i === w.net + 1; return `<div class="${own ? "ok" : ""}"><i>🥅</i><span><strong>${esc(n[1])}</strong><small>${esc(n[3])} · catch ${Math.round((CATCH_BASE[2] + NET_BONUS[i]) * 100)}% on rare bugs</small></span>${own ? "<em>Yours</em>" : next ? `<button class="btn btn-accent" type="button" data-buy="${i}" ${b.shells >= n[2] ? "" : "disabled"}>${n[2]} shells</button>` : "<em>Later</em>"}</div>`; }).join("")}</div>`, (e) => { e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => conservatoryPage(ctx, x.dataset.t))); e.querySelectorAll("[data-buy]").forEach((x) => (x.onclick = () => { const i = +x.dataset.buy, n = NETS[i]; if (b.shells < n[2] || i !== w.net + 1) return; b.shells -= n[2]; w.net = i; save(); ping("done"); say(`${n[1]} is yours.`); checkGoals(); conservatoryPage(ctx, "net"); })); });
  } else {
    const r = rngFor("wild-trade" + day), trades = [0, 1, 2].map((n) => { const want = BUGS.filter((x) => x[4] <= (n === 2 ? 2 : 1)), d = want[Math.floor(r() * want.length)], count = 1 + Math.floor(r() * 3); return { n, want: d, count, shells: BUG_VAL[d[4]] * count * 2 + 20, tix: 2 + d[4] * 2 }; });
    page("Butterfly Conservatory", `${tabs("marigold")}<p class="muted">Marigold trades shells and arcade tickets for bugs from your book. Her asks change every day.</p><div class="by-list">${trades.map((t) => { const have = w.bugs[t.want[0]] || 0, done = w.day.done[t.n]; return `<div class="${done ? "ok" : ""}"><i>${t.want[2]}</i><span><strong>${esc(t.want[1])} ×${t.count}</strong><small>${have} in your book · ${t.shells} shells, ${t.tix} tickets</small></span>${done ? "<em>Done</em>" : `<button class="btn btn-accent" type="button" data-tr="${t.n}" ${have >= t.count ? "" : "disabled"}>Turn in</button>`}</div>`; }).join("")}</div>`, (e) => { e.querySelectorAll("[data-t]").forEach((x) => (x.onclick = () => conservatoryPage(ctx, x.dataset.t))); e.querySelectorAll("[data-tr]").forEach((x) => (x.onclick = () => { const t = trades[+x.dataset.tr]; if (w.day.done[t.n] || (w.bugs[t.want[0]] || 0) < t.count) return; w.bugs[t.want[0]] -= t.count; w.day.done[t.n] = 1; const v = pay(b, t.shells); b.tickets = (b.tickets || 0) + t.tix; save(); ping("done"); say(`Marigold is delighted. +${v} shells, +${t.tix} tickets`); checkGoals(); conservatoryPage(ctx, "marigold"); })); });
  }
}

// ---- Mooncrumb Bakery ----
const PASTRIES = [["cro", "Croissant", "🥐"], ["bun", "Moon bun", "🍞"], ["tart", "Star tart", "🥧"], ["muf", "Wave muffin", "🧁"], ["coo", "Shell cookie", "🍪"]];
export function bakeryPage(ctx) {
  const { b, page, esc, say, ping, save, checkGoals, finishJob } = ctx;
  let time = 40, served = 0, wasted = 0, oven = null, orders = [], timer = 0;
  const nextOrder = () => PASTRIES[Math.floor(Math.random() * PASTRIES.length)];
  orders = [nextOrder(), nextOrder(), nextOrder()];
  page("Mooncrumb Bakery", `<p class="muted">Bake what the front of the queue asks for. Load the oven, pull it in the green window, and it's a perfect pastry. Level ${ctx.jobLevel ? ctx.jobLevel(b, "bake") : 1}.</p><div class="by-jobtop"><strong id="wk-t"></strong><strong id="wk-n"></strong></div><div class="wg-front" id="wk-front"></div><div class="wg-oven" id="wk-oven"><i id="wk-bar"></i><u id="wk-zone"></u><b id="wk-p"></b></div><div class="by-flav">${PASTRIES.map((p) => `<button type="button" data-p="${p[0]}">${p[2]}<small>${esc(p[1])}</small></button>`).join("")}</div><button class="btn btn-accent" type="button" id="wk-pull" disabled>Take it out</button>`, (e) => {
    const front = e.querySelector("#wk-front"), bar = e.querySelector("#wk-bar"), zone = e.querySelector("#wk-zone"), pn = e.querySelector("#wk-p"), pullB = e.querySelector("#wk-pull");
    const paint = () => {
      e.querySelector("#wk-t").textContent = `${Math.ceil(time)}s`;
      e.querySelector("#wk-n").textContent = `${served} baked · ${wasted} spoiled`;
      front.innerHTML = `<small>Now baking for</small><strong>${orders[0][2]} ${esc(orders[0][1])}</strong><span>${orders.slice(1, 3).map((o) => `${o[2]} ${esc(o[1])}`).join(" · ")}</span>`;
      if (oven) { bar.style.width = `${Math.min(100, oven.p)}%`; bar.style.background = oven.p > 82 ? "#e05a3c" : oven.p >= 42 ? "#6cd98a" : "#d9a442"; pn.textContent = `${Math.round(oven.p)}% · ${oven.p > 82 ? "burning!" : oven.p >= 42 ? "perfect window" : "still raw"}`; pullB.disabled = false; }
      else { bar.style.width = "0%"; pn.textContent = "oven cold"; pullB.disabled = true; }
    };
    e.querySelectorAll("[data-p]").forEach((x) => (x.onclick = () => { if (oven) return say("One tray at a time — take it out first!"); const p = PASTRIES.find((q) => q[0] === x.dataset.p); oven = { type: p, p: 0 }; ping("blip"); paint(); }));
    pullB.onclick = () => {
      if (!oven) return;
      const p = oven.p, want = orders[0];
      if (p >= 42 && p <= 82 && oven.type[0] === want[0]) { served++; b.t.baked = (b.t.baked || 0) + 1; orders.shift(); orders.push(nextOrder()); time += .7; ping("choice"); }
      else { wasted++; time -= 2; ping("close"); }
      oven = null; paint();
    };
    paint();
    timer = setInterval(() => {
      time -= .1;
      if (oven) { oven.p += 100 * .1 / 2.6; if (oven.p > 130) { wasted++; oven = null; time -= 1.5; ping("close"); } }
      paint();
      if (time <= 0) {
        clearInterval(timer); timer = 0;
        const got = served ? finishJob("bake", served, 6 + served * 9) : 0;
        checkGoals();
        page("Batch over", `<p class="by-big">${served} perfect pastries</p><p>${got ? `+${got} shells` : "The moon buns had their revenge."}</p><button class="btn btn-accent" type="button" id="again">Bake again</button>`, (q) => { q.querySelector("#again").onclick = () => bakeryPage(ctx); });
      }
    }, 100);
    return () => clearInterval(timer);
  });
}

// ---- Gift Wagon ----
const giftReady = (g) => Date.now() - g.at >= GIFT_WAIT;
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

function openGift(b, tier) {
  const w = ensureWild(b), r = Math.random();
  const shells = [60, 180, 420][tier], tix = [10, 25, 60][tier], jackpot = [200, 600, 1500][tier];
  if (tier === 2 && r < .02 && !w.plush.golden) { w.plush.golden = 1; return { k: "plush", id: "golden" }; }
  const q = r;
  if (q < .32) { const v = shells + Math.floor(Math.random() * 40); b.shells += v; b.t.earned = (b.t.earned || 0) + v; return { k: "shells", v }; }
  if (q < .48) { b.tickets = (b.tickets || 0) + tix; return { k: "tickets", v: tix }; }
  if (q < .66) {
    const pool = PLUSH.slice(tier === 0 ? 0 : 6, tier === 0 ? 6 : 12).filter((p) => !w.plush[p[0]]);
    const all = PLUSH.filter((p) => !w.plush[p[0]]);
    const pick = (pool.length ? pool : all)[Math.floor(Math.random() * (pool.length ? pool.length : all.length))];
    if (pick) { w.plush[pick[0]] = 1; return { k: "plush", id: pick[0] }; }
    const v = shells; b.shells += v; return { k: "shells", v };
  }
  if (q < .78) { const free = WEAR.filter((x) => !b.wear?.[x[0]]); if (free.length) { const pick = free[Math.floor(Math.random() * free.length)]; b.wear ||= {}; b.wear[pick[0]] = 1; return { k: "wear", id: pick[0], name: pick[1] }; } }
  if (q < .9) { const t = ["cove", "reef", "star"][tier]; const id = `e${b.nid++}`; b.eggs ||= []; b.eggs.push({ id, t, have: 0 }); b.egg ||= id; return { k: "egg", name: (EGGS.find((x) => x[0] === t) || ["", "an egg"])[1] }; }
  const v = jackpot; b.shells += v; b.t.earned = (b.t.earned || 0) + v;
  return { k: "jackpot", v };
}

export function giftsPage(ctx) {
  const { b, page, esc, say, ping, save, checkGoals } = ctx, w = ensureWild(b);
  const plushN = Object.keys(w.plush).length;
  page("The Gift Wagon", `<p class="muted">A gift needs five minutes to wrap itself properly. Leave it in the wagon, come back and unwrap. ${b.t.gifts || 0} gifts opened so far.</p><div class="by-crates">${GIFT_TIERS.map((t) => `<button type="button" class="by-crate" data-buy="${t[0]}" ${b.shells >= t[2] ? "" : "disabled"}><span>🎁</span><strong>${esc(t[1])}</strong><small>${t[2]} shells · wraps in 5:00</small><small>${esc(t[4])}</small></button>`).join("")}</div><h3>In the wagon</h3>${w.gifts.length ? `<div class="by-list">${w.gifts.map((g) => { const t = GIFT_TIERS.findIndex((x) => x[0] === g.tier), ready = giftReady(g); return `<div><i>🎁</i><span><strong>${esc(GIFT_TIERS[t][1])}</strong><small>${ready ? "Ready to unwrap!" : `Wraps itself in ${mmss(g.at + GIFT_WAIT - Date.now())}`}</small></span>${ready ? `<button class="btn btn-accent" type="button" data-un="${g.id}">Unwrap</button>` : `<em>${mmss(g.at + GIFT_WAIT - Date.now())}</em>`}</div>`; }).join("")}</div>` : `<p class="muted">The wagon's empty.</p>`}<h3>Plushie shelf</h3><p class="muted">${plushN} of ${PLUSH.length} plushies. Gifts are the only place they come from.</p><div class="by-dex">${PLUSH.map((p) => `<div title="${esc(p[1])}" style="--r:${p[0] === "golden" ? "#ffc84a" : "#b8c0c8"}"><b>${w.plush[p[0]] ? p[2] : "❔"}</b><small>${w.plush[p[0]] ? esc(p[1]) : "???"}</small></div>`).join("")}</div>`, (e) => {
    e.querySelectorAll("[data-buy]").forEach((x) => (x.onclick = () => { const t = GIFT_TIERS.find((q) => q[0] === x.dataset.buy); if (b.shells < t[2]) return; b.shells -= t[2]; w.gifts.push({ id: "g" + w.nid++, tier: t[0], at: Date.now() }); save(); ping("choice"); say(`The ${t[1]} starts wrapping itself. Back in five minutes.`); checkGoals(); giftsPage(ctx); }));
    e.querySelectorAll("[data-un]").forEach((x) => (x.onclick = () => {
      const g = w.gifts.find((q) => q.id === x.dataset.un);
      if (!g || !giftReady(g)) return;
      const tier = GIFT_TIERS.findIndex((q) => q[0] === g.tier);
      w.gifts = w.gifts.filter((q) => q !== g);
      b.t.gifts = (b.t.gifts || 0) + 1;
      const res = openGift(b, tier);
      save(); ping("done");
      const label = res.k === "shells" ? `+${res.v} shells` : res.k === "jackpot" ? `Jackpot! +${res.v} shells` : res.k === "tickets" ? `+${res.v} arcade tickets` : res.k === "egg" ? `A ${res.name}!` : res.k === "wear" ? `A ${res.name} for your critter!` : `${(PLUSH.find((p) => p[0] === res.id) || ["", "a plushie"])[1]}!`;
      say(`Unwrapped: ${label}`);
      checkGoals();
      giftsPage(ctx);
    }));
    const iv = setInterval(() => {
      if (!e.isConnected) { clearInterval(iv); return; }
      const ready = w.gifts.some(giftReady);
      if (ready && !e.querySelector("[data-un]")) giftsPage(ctx);
    }, 1000);
    return () => clearInterval(iv);
  });
}
