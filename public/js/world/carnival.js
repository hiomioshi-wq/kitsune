// The Lantern Carnival: a walkable fairground of striped tents, four midway games, a fortune wagon
// and a prize counter, reached from the world HUD. Tickets are won at the games and spent on mon, hats
// and furniture. State lives in s.carnival; every game except the prizes has a daily allowance.
const CW = 96, CH = 64, T = 32;
export const TILE = { midway: 0, path: 1, grass: 2, tent: 3, fence: 4, pond: 5, plaza: 6 };
const TC = { [TILE.midway]: ["#c9a06a", "#c09862"], [TILE.path]: ["#c79a63", "#bd9059"], [TILE.grass]: ["#7cc66d", "#74bf66"], [TILE.tent]: ["#b5533c", "#a84a38"], [TILE.fence]: ["#8a6a44", "#8a6a44"], [TILE.pond]: ["#3f9fd0", "#3a97c8"], [TILE.plaza]: ["#d8cfc0", "#cfc5b5"] };
const TENTS = [[6, 6, "Sideshow"], [22, 6, "Fun House"], [36, 6, "Mirror Maze"], [60, 6, "Punch & Judy"], [74, 6, "Popcorn"], [8, 42, "Costume Tent"], [22, 42, "Rest Tent"]].map(([x, y, name], i) => ({ x, y, w: 10, h: 7, name, c: ["#e0483c", "#3f8fd0", "#e6b422", "#67d6a4", "#c0569a", "#8a78e8", "#ff8a3c"][i] }));
const BOOTHS = [["fortune", "Madam Fortuna's wagon", "Spin the wheel", 18, 26], ["ring", "Ring Toss", "Play a round", 32, 26], ["striker", "High Striker", "Swing the mallet", 44, 26], ["gallery", "Shooting Gallery", "Take aim", 56, 26], ["prizes", "Prize Counter", "Spend tickets", 72, 26]];
const SPOT = [47, 57], FERRIS = [49, 14];
const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; }, rngFor = (k) => { let h = hash(k); return () => { h = (Math.imul(h ^ (h >>> 13), 1274126177) + 7) >>> 0; return h / 4294967296; }; };

export function ensureCarnival(s) { const st = (s.carnival ||= {}); st.tix ??= 0; const d = new Date().toDateString(); if (st.day?.d !== d) st.day = { d, ring: 0, striker: 0, gallery: 0, fortune: 0 }; return st; }

export function buildCarnival() {
  const g = new Uint8Array(CW * CH), solid = new Uint8Array(CW * CH);
  const put = (x, y, w, h, v) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < CW && j < CH) g[j * CW + i] = v; };
  put(0, 0, CW, CH, TILE.grass);
  put(0, 22, CW, 8, TILE.midway);
  put(46, 28, 3, 32, TILE.path);
  put(42, 52, 12, 10, TILE.plaza);
  put(0, 33, CW, 3, TILE.path);
  put(64, 42, 14, 10, TILE.pond);
  for (const t of TENTS) put(t.x, t.y, t.w, t.h, TILE.tent);
  for (let i = 0; i < CW * CH; i++) solid[i] = g[i] === TILE.tent || g[i] === TILE.pond ? 1 : 0;
  for (let x = 0; x < CW; x++) { solid[x] = 1; solid[(CH - 1) * CW + x] = 1; }
  for (let y = 0; y < CH; y++) { solid[y * CW] = 1; solid[y * CW + CW - 1] = 1; }
  return { g, solid };
}

const FORTUNES = ["A letter you forgot to send is on its way back to you.", "The ninth lantern lights itself this week.", "Trust the tide, doubt the timetable.", "Something you lent out in autumn returns with interest.", "A moth is trying to tell you something. Listen twice.", "Your lucky number is the number of doors you'll pass tomorrow.", "The ferris wheel stops where you need it to.", "Rain on the midway, sun on the shore. Choose the shore."];
const BARKER = ["Ring Toss pays two tickets a ring. Ask the stragglers.", "The Striker's bell only rings for honest swings.", "Don't shoot the moths! They're the cleanup crew.", "Madam Fortuna never lies, but she does ramble.", "The Prize Counter takes tickets only. No shells, no mon, no excuses.", "The ferris wheel is free to look at. Looking is the whole ride."];

export function mountCarnival(host, api) {
  const s = api.state, st = ensureCarnival(s), map = buildCarnival(), keys = new Set();
  host.innerHTML = `<canvas class="cv-c"></canvas><div class="cv-hud"><strong>🎟️ <span id="cv-t"></span> tickets</strong><div class="cv-btns"><button type="button" data-h="prizes">Prizes</button><button type="button" data-h="leave">Leave <kbd>Esc</kbd></button></div></div><button type="button" class="by-prompt" id="cv-prompt" hidden></button><div class="wd-pad cv-pad" id="cv-pad"><i></i></div><button type="button" class="wd-act cv-act" id="cv-act">E</button><div class="cv-toast" id="cv-toast" hidden></div><section class="cv-page" id="cv-page" hidden></section>`;
  const c = host.querySelector(".cv-c"), g = c.getContext("2d"), pageEl = host.querySelector("#cv-page"), promptEl = host.querySelector("#cv-prompt"), toastEl = host.querySelector("#cv-toast");
  let px = (SPOT[0] + .5) * T, py = (SPOT[1] + .5) * T, dir = "up", step = 0, moving = false, alive = true, raf = 0, last = performance.now(), cw = 0, ch = 0, zoom = 1.4, target = null, joy = null, pageOff = null, toastT = 0, saveT = 0, barkerCd = 0, sparks = [], barker = { x: 30 * T, y: 24.6 * T, line: 0 };
  const blocked = (x, y) => [[-9, 2], [9, 2], [-9, 13], [9, 13]].some(([a, q]) => { const X = Math.floor((x + a) / T), Y = Math.floor((y + q) / T); return X < 0 || Y < 0 || X >= CW || Y >= CH || map.solid[Y * CW + X]; });
  const save = () => api.save(), say = (t) => { toastEl.textContent = t; toastEl.hidden = false; toastT = performance.now() + 2800; }, hud = () => { host.querySelector("#cv-t").textContent = st.tix; }, burst = (x, y, n = 14) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: ["#ffd27a", "#ff8a3c", "#fff", "#c0569a"][i % 4] }); } };
  function page(title, html, bind) { pageOff?.(); pageOff = null; pageEl.hidden = false; pageEl.innerHTML = `<header><button class="btn" type="button" id="cv-back">Back</button><h2>${esc(title)}</h2><span>🎟️ ${st.tix}</span></header><div class="cv-body">${html}</div>`; pageEl.querySelector("#cv-back").onclick = closePage; pageOff = bind?.(pageEl) || null; api.ping("open"); }
  const closePage = () => { pageOff?.(); pageOff = null; pageEl.hidden = true; pageEl.innerHTML = ""; save(); host.focus({ preventScroll: true }); };

  function ringToss() {
    if (st.day.ring >= 3) return say("Three rounds is your lot today. The barker is giving you a look.");
    st.day.ring++;
    let pos = 0, vel = 88, rings = 3, hits = 0, timer = 0;
    const zone = () => 18 + Math.random() * 54;
    let z = zone(), zw = 17;
    page("Ring Toss", `<p class="muted">Drop the ring while the marker is inside the striped zone. Each hit pays 2 tickets; all three pays a bonus.</p><div class="by-jobtop"><strong id="rt-n">Rings left: 3</strong><strong id="rt-s">0 hits</strong></div><div class="cv-bar"><i id="rt-m"></i><u id="rt-z"></u></div><button class="btn btn-accent" type="button" id="rt-drop">Drop the ring</button>`, (e) => {
      const mark = e.querySelector("#rt-m"), zoneEl = e.querySelector("#rt-z");
      const paint = () => { mark.style.left = `${pos}%`; zoneEl.style.left = `${z}%`; zoneEl.style.width = `${zw}%`; };
      e.querySelector("#rt-drop").onclick = () => {
        if (pos >= z && pos <= z + zw) { hits++; st.tix += 2; api.ping("done"); burst(px, py, 12); zw = Math.max(8, zw - 4); } else api.ping("close");
        rings--; e.querySelector("#rt-n").textContent = `Rings left: ${rings}`; e.querySelector("#rt-s").textContent = `${hits} hits`;
        z = zone();
        if (!rings) { clearInterval(timer); const bonus = hits === 3 ? 3 : 0; if (bonus) st.tix += bonus; save(); hud(); page("Round over", `<p class="by-big">${hits} of 3</p><p>+${hits * 2 + bonus} tickets${bonus ? " (all-three bonus!)" : ""}</p><button class="btn btn-accent" type="button" id="again">Play again</button>`, (q) => { q.querySelector("#again").onclick = () => ringToss(); }); }
      };
      timer = setInterval(() => { pos += vel * .05; if (pos > 100 || pos < 0) { pos = Math.max(0, Math.min(100, pos)); vel *= -1; } paint(); }, 50);
      paint();
      return () => clearInterval(timer);
    });
  }

  function striker() {
    if (st.day.striker >= 3) return say("Your arms are done for today.");
    st.day.striker++;
    let t = 0, swung = false, timer = 0;
    page("High Striker", `<p class="muted">Swing while the puck is highest. Every 20 points on the scale is a ticket; the bell at 90 pays two more.</p><div class="by-jobtop"><strong id="hs-v">0</strong><strong id="hs-n"></strong></div><div class="cv-bar"><i id="hs-m"></i><u id="hs-bell"></u></div><button class="btn btn-accent" type="button" id="hs-swing">Swing!</button>`, (e) => {
      const mark = e.querySelector("#hs-m");
      const paint = (v) => { mark.style.left = `${v}%`; e.querySelector("#hs-v").textContent = Math.round(v); };
      e.querySelector("#hs-swing").onclick = () => {
        if (swung) return; swung = true; clearInterval(timer);
        const v = Math.abs(Math.sin(t)) * 100, tix = Math.round(v / 20) + (v >= 90 ? 2 : 0);
        st.tix += tix; save(); hud(); api.ping(v >= 90 ? "done" : "choice"); burst(px, py, v >= 90 ? 24 : 10);
        page("The puck settles", `<p class="by-big">${Math.round(v)} of 100</p><p>${v >= 90 ? "The bell rings across the whole midway! " : ""}+${tix} tickets</p><button class="btn btn-accent" type="button" id="again">Another swing</button>`, (q) => { q.querySelector("#again").onclick = () => striker(); });
      };
      timer = setInterval(() => { t += .13; paint(Math.abs(Math.sin(t)) * 100); }, 50);
      paint(0);
      return () => clearInterval(timer);
    });
  }

  function gallery() {
    if (st.day.gallery >= 3) return say("The moths have asked for a break.");
    st.day.gallery++;
    let time = 25, hits = 0, oops = 0, up = new Map(), spawn = 0, timer = 0, ended = false;
    page("Shooting Gallery", `<p class="muted">Hit the paper stars, spare the moths. A star is a ticket; a moth costs you one.</p><div class="by-jobtop"><strong id="sg-t"></strong><strong id="sg-n"></strong></div><div class="cv-holes">${Array.from({ length: 9 }, (_, i) => `<button type="button" data-h="${i}" aria-label="Gallery hole ${i + 1}"></button>`).join("")}</div>`, (e) => {
      const holes = [...e.querySelectorAll("[data-h]")], paint = () => { e.querySelector("#sg-t").textContent = `${Math.ceil(time)}s`; e.querySelector("#sg-n").textContent = `${hits} stars · ${oops} moths`; };
      holes.forEach((x, i) => (x.onpointerdown = (v) => { v.preventDefault(); const q = up.get(i); if (!q) return; up.delete(i); x.textContent = ""; if (q.moth) { oops++; st.tix = Math.max(0, st.tix - 1); api.ping("close"); } else { hits++; st.tix++; api.ping("choice"); } paint(); }));
      timer = setInterval(() => {
        time -= .1; spawn -= .1;
        if (spawn <= 0) { spawn = Math.max(.4, 1 - hits * .03); const free = holes.map((_, i) => i).filter((i) => !up.has(i)); if (free.length) { const i = free[Math.floor(Math.random() * free.length)], moth = Math.random() < .25; up.set(i, { moth, life: Math.max(.6, 1.15 - hits * .02) }); holes[i].textContent = moth ? "🦋" : "⭐"; } }
        for (const [i, q] of [...up]) { q.life -= .1; if (q.life <= 0) { up.delete(i); holes[i].textContent = ""; } }
        e.querySelector("#sg-t").textContent = `${Math.ceil(time)}s`;
        if (time <= 0 && !ended) { ended = true; clearInterval(timer); save(); hud(); api.ping("done"); page("Time at the gallery", `<p class="by-big">${hits} stars, ${oops} moths</p><p>+${Math.max(0, hits - oops)} tickets net</p><button class="btn btn-accent" type="button" id="again">Back to the range</button>`, (q) => { q.querySelector("#again").onclick = () => gallery(); }); }
      }, 100);
      paint();
      return () => { ended = true; clearInterval(timer); };
    });
  }

  function fortune() {
    if (st.day.fortune >= 1) return say("Madam Fortuna folds her hands. Once a day, no exceptions, dear.");
    st.day.fortune++;
    const r = rngFor("carnival-fortune" + st.day.d);
    const seg = Math.floor(r() * 8), grand = r() < .06 && !s.hats.includes("carnivalhat");
    let spin = 0, spinAt = 0, landed = false;
    page("Madam Fortuna's Wheel", `<p class="muted">Eight segments. The wheel decides; Fortuna only narrates.</p><div class="cv-wheel" id="fw"><b id="fw-p">🎡</b></div><button class="btn btn-accent" type="button" id="fw-go">Spin</button>`, (e) => {
      const wheel = e.querySelector("#fw");
      e.querySelector("#fw-go").onclick = () => {
        if (landed) return; landed = true; e.querySelector("#fw-go").disabled = true; api.ping("blip");
        spinAt = performance.now(); spin = 1440 + seg * 45;
        const t0 = setInterval(() => { const p = Math.min(1, (performance.now() - spinAt) / 2600); wheel.style.transform = `rotate(${spin * (1 - Math.pow(1 - p, 3))}deg)`; if (p >= 1) { clearInterval(t0); settle(); } }, 40);
        return () => clearInterval(t0);
      };
      const settle = () => {
        let value = "", line = "";
        if (grand) { api.giveHat("carnivalhat"); value = "The Ringmaster's Hat!"; api.ping("done"); }
        else if (seg < 2) { const v = [40, 80][seg]; api.addMon(v); value = `+${v} mon`; api.ping("done"); }
        else if (seg < 5) { const v = [5, 10, 15][seg - 2]; st.tix += v; save(); hud(); value = `+${v} tickets`; api.ping("done"); }
        else { line = FORTUNES[seg - 5]; value = "A fortune"; api.ping("choice"); }
        page("The wheel stops", `<p class="by-big">${value}</p>${line ? `<p class="ca-egg">“${esc(line)}”</p>` : ""}<button class="btn btn-accent" type="button" id="again">Back to the midway</button>`, (q) => { q.querySelector("#again").onclick = closePage; });
      };
    });
  }

  function prizes() {
    const GOODS = [["mon", "60 mon", 10], ["party", "Level Fun party hat", 25], ["tentlamp", "Carnival Tent Lamp", 60], ["carnivalhat", "The Ringmaster's Hat", 150]];
    page("Prize Counter", `<p class="muted">Tickets in hand: ${st.tix}. Everything behind the glass is a fair trade.</p><div class="by-list">${GOODS.map(([id, name, cost]) => { const owned = id === "mon" ? false : id === "party" ? s.hats.includes("party") : id === "tentlamp" ? !!s.furn.carnivaltent : s.hats.includes("carnivalhat"); return `<div><i>🎁</i><span><strong>${esc(name)}</strong><small>${cost} tickets</small></span>${owned ? "<em>Yours</em>" : `<button class="btn btn-accent" type="button" data-pr="${id}" ${st.tix >= cost ? "" : "disabled"}>Redeem</button>`}</div>`; }).join("")}</div>`, (e) => {
      e.querySelectorAll("[data-pr]").forEach((x) => (x.onclick = () => {
        const g2 = GOODS.find((q) => q[0] === x.dataset.pr);
        if (st.tix < g2[2]) return;
        st.tix -= g2[2]; save(); hud(); api.ping("done");
        if (g2[0] === "mon") api.addMon(60);
        else if (g2[0] === "party") api.giveHat("party");
        else if (g2[0] === "tentlamp") api.giveFurn("carnivaltent");
        else api.giveHat("carnivalhat");
        say(`Redeemed: ${g2[1]}`);
        prizes();
      }));
    });
  }

  const GAMES = { ring: ringToss, striker, gallery, fortune, prizes };
  function findTarget() {
    for (const [id, name, verb, x, y] of BOOTHS) if (Math.hypot((x + .5) * T - px, (y + .5) * T - py) < 44) return { label: `${name}: ${verb}`, go: GAMES[id] };
    if (Math.hypot((SPOT[0] + .5) * T - px, (SPOT[1] + .5) * T - py) < 52) return { label: "Back to Kitsune World", go: leave };
    return null;
  }
  function leave() { save(); api.leave(); }
  const act = () => { if (!pageEl.hidden) return; target?.go(); };

  function update(dt, now) {
    let ax = 0, ay = 0;
    if (pageEl.hidden) { if (keys.has("a") || keys.has("arrowleft")) ax--; if (keys.has("d") || keys.has("arrowright")) ax++; if (keys.has("w") || keys.has("arrowup")) ay--; if (keys.has("s") || keys.has("arrowdown")) ay++; if (joy && Math.hypot(joy.x, joy.y) > .18) { ax = joy.x; ay = joy.y; } }
    moving = !!(ax || ay);
    if (moving) { const m = Math.max(1, Math.hypot(ax, ay)), v = (keys.has("shift") ? 260 : 175) * dt, nx = px + ax / m * v, ny = py + ay / m * v; if (!blocked(nx, py)) px = nx; if (!blocked(px, ny)) py = ny; dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down"; step += dt * 13; }
    const blx = 30 * T + Math.sin(now / 3000) * 23 * T;
    if (Math.hypot(blx - px, 24.6 * T - py) > 46) { barker.x = blx; barker.y = 24.6 * T; }
    else if (pageEl.hidden && (barkerCd -= dt) <= 0) { barkerCd = 12; say(`Barker Pin: ${BARKER[barker.line++ % BARKER.length]}`); api.ping("blip"); }
    if (pageEl.hidden) { const t = findTarget(); if (t?.label !== target?.label) { promptEl.hidden = !t; if (t) promptEl.innerHTML = `<kbd>E</kbd> ${esc(t.label)}`; } target = t; } else { promptEl.hidden = true; target = null; }
    for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.life -= dt * 1.3; } sparks = sparks.filter((p) => p.life > 0);
    if (toastT && now > toastT) { toastEl.hidden = true; toastT = 0; }
    if ((saveT += dt) > 8) { saveT = 0; save(); }
  }

  const label = (t, x, y) => { g.font = "800 11px system-ui"; g.textAlign = "center"; const w = g.measureText(t).width + 10; g.fillStyle = "rgba(20,18,32,.88)"; g.fillRect(x - w / 2, y - 12, w, 16); g.fillStyle = "#fff4d6"; g.fillText(t, x, y); };

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    update(dt, now);
    const vw = cw / zoom, vh = ch / zoom, camX = Math.max(0, Math.min(CW * T - vw, px - vw / 2)), camY = Math.max(0, Math.min(CH * T - vh, py - vh / 2)), x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(CW - 1, Math.ceil((camX + vw) / T)), y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(CH - 1, Math.ceil((camY + vh) / T));
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#241536"; g.fillRect(0, 0, cw, ch); g.scale(zoom, zoom); g.translate(-Math.round(camX), -Math.round(camY));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = map.g[y * CW + x]; g.fillStyle = TC[v][(x + y) % 2]; g.fillRect(x * T, y * T, T + .5, T + .5); if (v === TILE.pond && (x * 3 + y) % 7 === 0) { g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.5; g.beginPath(); const o = Math.sin(now / 600 + x) * 3; g.moveTo(x * T + 6 + o, y * T + 16); g.quadraticCurveTo(x * T + 13 + o, y * T + 10, x * T + 22 + o, y * T + 16); g.stroke(); } }
    const things = [];
    // lantern strings over the midway
    things.push([24 * T, () => { g.strokeStyle = "#3a2415"; g.lineWidth = 2; for (let x = 6; x < 92; x += 12) { g.beginPath(); g.moveTo(x * T, 21.2 * T); g.quadraticCurveTo((x + 6) * T, 22.8 * T, (x + 12) * T, 21.2 * T); g.stroke(); for (let k = 1; k < 6; k++) { const lx = (x + k * .2 * 12) * T, ly = 21.2 * T + Math.sin(Math.PI * k / 6) * 1.4 * T; g.fillStyle = k % 2 ? "#ffd27a" : "#ff8a3c"; g.beginPath(); g.arc(lx, ly, 3.2 + Math.sin(now / 300 + x + k) * .8, 0, 7); g.fill(); } } }]);
    // striped tents
    for (const t of TENTS) things.push([(t.y + t.h) * T, () => { const x = t.x * T, y = t.y * T, w = t.w * T, h = t.h * T; g.fillStyle = "#f4ead8"; g.fillRect(x, y + h * .45, w, h * .55); g.fillStyle = t.c; g.strokeStyle = "#231d2c"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 6, y + h * .5); g.lineTo(x + w * .18, y); g.lineTo(x + w * .82, y); g.lineTo(x + w + 6, y + h * .5); g.closePath(); g.fill(); g.stroke(); for (let k = 1; k < 6; k += 2) { g.fillStyle = "#f4ead8"; g.beginPath(); g.moveTo(x + w * .18 + (w * .64 * k) / 6, y + h * .5); g.lineTo(x + w * .18 + (w * .64 * (k + 1)) / 6, y); g.lineTo(x + w * .18 + (w * .64 * (k + 1)) / 6, y + h * .5); g.closePath(); g.fill(); } label(t.name, x + w / 2, y + h * .3); }]);
    // ferris wheel
    things.push([FERRIS[1] * T + 70, () => { const fx = FERRIS[0] * T, fy = FERRIS[1] * T, R = 62, a0 = now / 2400; g.strokeStyle = "#d9a84e"; g.lineWidth = 3; g.beginPath(); g.arc(fx, fy, R, 0, 7); g.stroke(); g.beginPath(); g.arc(fx, fy, R * .18, 0, 7); g.stroke(); g.beginPath(); g.moveTo(fx, fy + R); g.lineTo(fx - 10, fy + R + 40); g.lineTo(fx + 10, fy + R + 40); g.closePath(); g.stroke(); for (let k = 0; k < 8; k++) { const a = a0 + k * Math.PI / 4, cx = fx + Math.cos(a) * R, cy = fy + Math.sin(a) * R; g.strokeStyle = "#d9a84e"; g.lineWidth = 2; g.beginPath(); g.moveTo(fx, fy); g.lineTo(cx, cy); g.stroke(); g.fillStyle = ["#e0483c", "#3f8fd0", "#e6b422", "#67d6a4"][k % 4]; g.beginPath(); g.roundRect(cx - 7, cy, 14, 12, 3); g.fill(); g.stroke(); } label("The Lantern Wheel", fx, fy - R - 14); }]);
    // booths
    for (const [id, name, , bx, by] of BOOTHS) things.push([(by + 2) * T, () => { const x = bx * T, y = by * T, w = 8 * T, h = 2.4 * T, m = x + w / 2; g.fillStyle = "#6a4528"; g.fillRect(x + 4, y + h * .5, w - 8, h * .5); g.strokeStyle = "#231d2c"; g.lineWidth = 2.5; const aw = ["#c0569a", "#e0483c", "#3f8fd0", "#67d6a4", "#8fd0a8"][BOOTHS.findIndex((q) => q[0] === id)]; for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? "#f4ead8" : aw; g.beginPath(); g.moveTo(x + (w * k) / 6, y + h * .5); g.lineTo(x + (w * (k + 1)) / 6, y + h * .5); g.lineTo(x + (w * (k + .5)) / 6, y); g.closePath(); g.fill(); g.stroke(); } g.fillStyle = "#fff4d6"; g.beginPath(); g.arc(m + Math.sin(now / 400) * 2, y + h * .42, 3.4, 0, 7); g.fill(); label(name, m, y + h * .72); }]);
    // barker
    things.push([barker.y + 16, () => { g.fillStyle = "rgba(0,0,0,.2)"; g.beginPath(); g.ellipse(barker.x, barker.y + 14, 11, 4, 0, 0, 7); g.fill(); g.fillStyle = "#e6b422"; g.strokeStyle = "#231d2c"; g.lineWidth = 2; g.beginPath(); g.arc(barker.x, barker.y - 6 + Math.abs(Math.sin(now / 140)) * -2, 9, 0, 7); g.fill(); g.stroke(); g.fillStyle = "#c0569a"; g.beginPath(); g.moveTo(barker.x - 12, barker.y - 8); g.lineTo(barker.x, barker.y - 26); g.lineTo(barker.x + 12, barker.y - 8); g.closePath(); g.fill(); g.stroke(); }]);
    // fox
    things.push([py + 14, () => api.drawFox(g, px, py, dir, step, api.fur, api.tails, s.hat, now, moving)]);
    things.sort((a, q) => a[0] - q[0]); for (const t of things) t[1]();
    for (const p of sparks) { g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.fillRect(p.x - 2, p.y - 2, 4, 4); } g.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  const resize = () => { const r = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); cw = Math.max(1, r.width * dpr); ch = Math.max(1, r.height * dpr); c.width = cw; c.height = ch; zoom = (r.width < 640 ? 1.15 : 1.4) * dpr; };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const onDown = (e) => { if (!host.isConnected || document.querySelector(".modal") || e.metaKey || e.ctrlKey || e.altKey) return; if (e.target?.closest?.("input,textarea,button")) return; const k = e.key.toLowerCase(); e.stopPropagation(); if (k === "escape") { e.preventDefault(); if (!pageEl.hidden) closePage(); return; } if (!pageEl.hidden) return; if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) { e.preventDefault(); keys.add(k); return; } if (e.repeat) return; if (k === "e" || k === " " || k === "enter") { e.preventDefault(); act(); } }, onUp = (e) => keys.delete(e.key.toLowerCase()), onBlur = () => keys.clear();
  window.addEventListener("keydown", onDown, true); window.addEventListener("keyup", onUp, true); window.addEventListener("blur", onBlur);
  host.querySelectorAll("[data-h]").forEach((x) => (x.onclick = () => { if (x.dataset.h === "prizes") prizes(); else leave(); host.focus({ preventScroll: true }); }));
  promptEl.onclick = () => act(); host.querySelector("#cv-act").onclick = () => act();
  const pad = host.querySelector("#cv-pad"), knob = pad.querySelector("i");
  pad.onpointerdown = (e) => { pad.setPointerCapture(e.pointerId); joy = { x: 0, y: 0 }; pad.onpointermove(e); };
  pad.onpointermove = (e) => { if (!joy) return; const r = pad.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), m = Math.max(1, Math.hypot(x, y)); joy = { x: x / m, y: y / m }; knob.style.transform = `translate(${joy.x * 30}px,${joy.y * 30}px)`; };
  pad.onpointerup = pad.onpointercancel = () => { joy = null; knob.style.transform = ""; };
  host.tabIndex = 0; host.focus({ preventScroll: true }); hud(); say("Welcome to the Lantern Carnival!"); raf = requestAnimationFrame(frame);
  host.__carnival = { prizes, st, get pos() { return [px, py]; } };
  return () => { alive = false; cancelAnimationFrame(raf); pageOff?.(); ro.disconnect(); window.removeEventListener("keydown", onDown, true); window.removeEventListener("keyup", onUp, true); window.removeEventListener("blur", onBlur); };
}
