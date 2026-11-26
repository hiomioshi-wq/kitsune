// The Glass Desert: a walkable realm of fused dunes, mirror caravans, a buried city and an oasis teahouse,
// reached from the world HUD. Beads are won at the Glassworks and the Sand-Surf runs and spent at the
// Mirror Caravan. State lives in s.desert; every game but the caravan has a daily allowance.
const GW = 112, GH = 64, T = 32;
export const TILE = { dune: 0, sand: 1, glass: 2, rock: 3, ruin: 4, oasis: 5, mesa: 6, crystal: 7 };
const TC = { [TILE.dune]: ["#e0c184", "#d8b878"], [TILE.sand]: ["#ecd096", "#e4c78c"], [TILE.glass]: ["#cfe8ec", "#c2dde4"], [TILE.rock]: ["#b89a6e", "#ae9064"], [TILE.ruin]: ["#d8ccae", "#ccbe9e"], [TILE.oasis]: ["#4fa8c0", "#489eb4"], [TILE.mesa]: ["#c99a5a", "#c99a5a"], [TILE.crystal]: ["#dcecf4", "#d0e2ec"] };
const MESAS = [[8, 6, 12, 8], [30, 4, 10, 7], [88, 8, 14, 9], [56, 50, 12, 7], [92, 46, 10, 8]].map(([x, y, w, h], i) => ({ x, y, w, h, c: ["#c98f4a", "#bd8242", "#d29c52", "#c98f4a", "#bd8242"][i] }));
const CRYSTALS = [[20, 30], [26, 36], [70, 18], [76, 24], [48, 40], [42, 14], [102, 30]].map(([x, y], i) => ({ x, y, i }));
const RUIN_SPOTS = [[64, 30], [70, 34], [58, 34], [76, 28], [62, 24], [68, 40]];
const SPOTS = [["foundry", "The Glassworks", "Shape a pane", 50, 20], ["surf", "Sand-Surf Run", "Ride a dune", 22, 38], ["caravan", "The Mirror Caravan", "Trade beads", 40, 52], ["ruinspot", "The Buried City", "Search the sands", 70, 30], ["oasis", "Oasis Teahouse", "Rest in the shade", 20, 54]];
const SPAWN = [54, 58];
const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hash = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); return h >>> 0; }, rngFor = (k) => { let h = hash(k); return () => { h = (Math.imul(h ^ (h >>> 13), 1274126177) + 7) >>> 0; return h / 4294967296; }; };

export function ensureDesert(s) { const st = (s.desert ||= {}); st.beads ??= 0; const d = new Date().toDateString(); if (st.day?.d !== d) st.day = { d, foundry: 0, surf: 0, ruins: 0 }; return st; }

export function buildDesert() {
  const g = new Uint8Array(GW * GH), solid = new Uint8Array(GW * GH);
  const put = (x, y, w, h, v) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < GW && j < GH) g[j * GW + i] = v; };
  put(0, 0, GW, GH, TILE.sand);
  for (let y = 0; y < GH; y++) { const w = Math.sin(y * .7) * 8; put(Math.max(0, Math.floor(w)), y, 4, 1, TILE.dune); put(Math.min(GW - 5, 60 + Math.floor(w * 2)), y, 5, 1, TILE.dune); }
  put(36, 20, 40, 16, TILE.glass);
  for (const m of MESAS) put(m.x, m.y, m.w, m.h, TILE.mesa);
  for (const c of CRYSTALS) put(c.x, c.y, 3, 3, TILE.crystal);
  put(14, 46, 12, 10, TILE.oasis);
  for (const [x, y] of RUIN_SPOTS) put(Math.max(0, x - 2), Math.max(0, y - 2), 5, 5, TILE.ruin);
  put(46, 52, 22, 8, TILE.rock);
  for (let i = 0; i < GW * GH; i++) solid[i] = g[i] === TILE.mesa || g[i] === TILE.crystal ? 1 : 0;
  for (let x = 0; x < GW; x++) { solid[x] = 1; solid[(GH - 1) * GW + x] = 1; }
  for (let y = 0; y < GH; y++) { solid[y * GW] = 1; solid[y * GW + GW - 1] = 1; }
  return { g, solid };
}

const WRAITH = ["Mind the glare at noon. The desert keeps every mirror it's ever swallowed.", "The Buried City moves one dune a year. Nobody knows in which direction it thinks it's going.", "Vitrine pays in beads because beads can't be counterfeited — glass remembers the hand that shaped it.", "The Oasis teahouse serves cold tea on purpose. The cold is the whole point.", "Sand-Surf pays better with a rest behind you. The dunes respect patience, briefly."];

export function mountDesert(host, api) {
  const s = api.state, st = ensureDesert(s), map = buildDesert(), keys = new Set();
  host.innerHTML = `<canvas class="dz-c"></canvas><div class="cv-hud"><strong>🔷 <span id="dz-b"></span> beads</strong><div class="cv-btns"><button type="button" data-h="caravan">Caravan</button><button type="button" data-h="leave">Leave <kbd>Esc</kbd></button></div></div><button type="button" class="by-prompt" id="dz-prompt" hidden></button><div class="wd-pad cv-pad" id="dz-pad"><i></i></div><button type="button" class="wd-act cv-act" id="dz-act">E</button><div class="cv-toast" id="dz-toast" hidden></div><section class="cv-page" id="dz-page" hidden></section>`;
  const c = host.querySelector(".dz-c"), g = c.getContext("2d"), pageEl = host.querySelector("#dz-page"), promptEl = host.querySelector("#dz-prompt"), toastEl = host.querySelector("#dz-toast");
  let px = (SPAWN[0] + .5) * T, py = (SPAWN[1] + .5) * T, dir = "up", step = 0, moving = false, alive = true, raf = 0, last = performance.now(), cw = 0, ch = 0, zoom = 1.35, target = null, joy = null, pageOff = null, toastT = 0, saveT = 0, wraithCd = 0, sparks = [], wraith = { x: 60 * T, y: 32 * T, line: 0 };
  const blocked = (x, y) => [[-9, 2], [9, 2], [-9, 13], [9, 13]].some(([a, q]) => { const X = Math.floor((x + a) / T), Y = Math.floor((y + q) / T); return X < 0 || Y < 0 || X >= GW || Y >= GH || map.solid[Y * GW + X]; });
  const save = () => api.save(), say = (t) => { toastEl.textContent = t; toastEl.hidden = false; toastT = performance.now() + 2800; }, hud = () => { host.querySelector("#dz-b").textContent = st.beads; }, burst = (x, y, n = 14) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 120; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: ["#bfe6f2", "#ffd27a", "#fff", "#e0c184"][i % 4] }); } };
  function page(title, html, bind) { pageOff?.(); pageOff = null; pageEl.hidden = false; pageEl.innerHTML = `<header><button class="btn" type="button" id="dz-back">Back</button><h2>${esc(title)}</h2><span>🔷 ${st.beads}</span></header><div class="cv-body">${html}</div>`; pageEl.querySelector("#dz-back").onclick = closePage; pageOff = bind?.(pageEl) || null; api.ping("open"); }
  const closePage = () => { pageOff?.(); pageOff = null; pageEl.hidden = true; pageEl.innerHTML = ""; save(); host.focus({ preventScroll: true }); };
  const cooled = () => st.cool > Date.now();
  const payBeads = (n) => { const v = cooled() ? Math.round(n * 1.5) : n; st.beads += v; hud(); return v; };

  function foundry() {
    if (st.day.foundry >= 3) return say("The furnace needs a rest. Three panes a day keeps the glass honest.");
    st.day.foundry++;
    let pos = 0, vel = 96, panes = 0, hits = 0, timer = 0;
    const zone = () => 20 + Math.random() * 50;
    let z = zone(), zw = 15;
    page("The Glassworks", `<p class="muted">Vitrine's furnace breathes in cycles. Pull the pane while the marker rides the amber zone — every good pane pays beads, and a rest behind the oasis makes the desert generous.</p><div class="by-jobtop"><strong id="gf-n">Panes left: 3</strong><strong id="gf-s">0 shaped</strong></div><div class="cv-bar"><i id="gf-m"></i><u id="gf-z"></u></div><button class="btn btn-accent" type="button" id="gf-pull">Pull the pane</button>`, (e) => {
      const mark = e.querySelector("#gf-m"), zoneEl = e.querySelector("#gf-z");
      const paint = () => { mark.style.left = `${pos}%`; zoneEl.style.left = `${z}%`; zoneEl.style.width = `${zw}%`; };
      e.querySelector("#gf-pull").onclick = () => {
        if (pos >= z && pos <= z + zw) { hits++; const v = payBeads(6 + hits * 2); api.ping("done"); burst(px, py, 12); zw = Math.max(7, zw - 2); say(`A clean pane. +${v} beads`); } else api.ping("close");
        panes++; e.querySelector("#gf-n").textContent = `Panes left: ${3 - panes}`; e.querySelector("#gf-s").textContent = `${hits} shaped`;
        z = zone(); save();
        if (panes >= 3) { clearInterval(timer); page("The furnace banks", `<p class="by-big">${hits} of 3 shaped well</p><p>· the glass remembers your hands ·</p><button class="btn btn-accent" type="button" id="again">Work again</button>`, (q) => { q.querySelector("#again").onclick = () => foundry(); }); }
      };
      timer = setInterval(() => { pos += vel * .05; if (pos > 100 || pos < 0) { pos = Math.max(0, Math.min(100, pos)); vel *= -1; } paint(); }, 50);
      paint();
      return () => clearInterval(timer);
    });
  }

  function surf() {
    if (st.day.surf >= 3) return say("The dunes need to settle. Three runs a day keeps the boards waxed.");
    st.day.surf++;
    let lane = 1, hp = 3, beads = 0, t = 0, rocks = [], last2 = performance.now(), done = false, raf2 = 0;
    page("Sand-Surf Run", `<p class="muted">Ride the glass-flat on a waxed board. Dodge the rocks and thornbush, gather the loose beads. Three spills end the run.</p><div class="by-jobtop"><strong id="sf-b">🔷 0</strong><strong id="sf-h">${"♥".repeat(3)}</strong></div><div class="dz-surf" id="sf"><i id="sf-me">🦊</i></div><div class="by-flav"><button type="button" data-l="-1">◀ Left</button><button type="button" data-l="1">Right ▶</button></div>`, (e) => {
      const box = e.querySelector("#sf"), me = e.querySelector("#sf-me");
      const place = () => (me.style.left = `${lane * 33.33 + 16.66}%`), move = (d) => { lane = Math.max(0, Math.min(2, lane + d)); place(); };
      const key = (v) => { const k = v.key.toLowerCase(); if (k === "a" || k === "arrowleft") { v.preventDefault(); move(-1); } else if (k === "d" || k === "arrowright") { v.preventDefault(); move(1); } };
      window.addEventListener("keydown", key, true);
      e.querySelectorAll("[data-l]").forEach((x) => (x.onpointerdown = (v) => { v.preventDefault(); move(+x.dataset.l); }));
      place();
      const tick = (now) => {
        if (done) return;
        const dt = Math.min(.05, (now - last2) / 1000); last2 = now;
        t += dt; const v = 44 + t * 2.2;
        if (Math.random() < dt * (1.1 + t * .04)) { const l = Math.floor(Math.random() * 3), bead = Math.random() < .3, d = document.createElement("b"); d.textContent = bead ? "🔷" : (Math.random() < .5 ? "🪨" : "🌵"); d.style.left = `${l * 33.33 + 16.66}%`; box.appendChild(d); rocks.push({ l, y: -8, bead, d }); }
        for (const r of rocks) { r.y += v * dt; r.d.style.top = `${r.y}%`; if (!r.hit && r.y > 72 && r.y < 88 && r.l === lane) { r.hit = true; r.d.remove(); if (r.bead) { const val = payBeads(2); beads += val; api.ping("choice"); } else { hp--; api.ping("close"); e.querySelector("#sf-h").textContent = "♥".repeat(Math.max(0, hp)); } e.querySelector("#sf-b").textContent = `🔷 ${beads}`; } if (r.y > 104) r.d.remove(); }
        rocks = rocks.filter((r) => !r.hit && r.y <= 104);
        if (hp <= 0) { done = true; window.removeEventListener("keydown", key, true); save(); api.ping("done"); st.beads += beads; hud(); return page("Run over", `<p class="by-big">🔷 ${beads} beads gathered</p><button class="btn btn-accent" type="button" id="again">Ride again</button>`, (q) => { q.querySelector("#again").onclick = () => surf(); }); }
        raf2 = requestAnimationFrame(tick);
      };
      raf2 = requestAnimationFrame(tick);
      return () => { done = true; cancelAnimationFrame(raf2); window.removeEventListener("keydown", key, true); };
    });
  }

  function caravan() {
    const day = new Date().toDateString(), r = rngFor("caravan" + day);
    const GOODS = [["mon60", "60 mon", 8], ["mon200", "200 mon", 22], ["mirrorkhat", "Mirrorweave Turban", 45], ["glasschime", "Glass Wind-Chime for your house", 30], ["starlamp", "Starlight Lantern for your house", 26]];
    page("The Mirror Caravan", `<p class="muted">Vitrine the Mirror-Merchant stocks the day's shelves at dawn and sells to whoever brings beads. Every mirror she carries shows the customer slightly braver than they arrived.</p><div class="by-list">${GOODS.map(([id, name, cost]) => { const own = id === "mirrorkhat" ? s.hats.includes("mirrorkhat") : id === "glasschime" || id === "starlamp" ? !!s.furn[id] : false; return `<div class="${own ? "ok" : ""}"><i>🔷</i><span><strong>${esc(name)}</strong><small>${cost} beads</small></span>${own ? "<em>Yours</em>" : `<button class="btn btn-accent" type="button" data-buy="${id}" ${st.beads >= cost ? "" : "disabled"}>Trade</button>`}</div>`; }).join("")}</div><p class="muted">"${WRAITH[Math.floor(r() * WRAITH.length)]}"</p>`, (e) => {
      e.querySelectorAll("[data-buy]").forEach((x) => (x.onclick = () => {
        const id = x.dataset.buy, cost = { mon60: 8, mon200: 22, mirrorkhat: 45, glasschime: 30, starlamp: 26 }[id];
        if (st.beads < cost) return;
        st.beads -= cost; save(); hud(); api.ping("done");
        if (id === "mon60") api.addMon(60);
        else if (id === "mon200") api.addMon(200);
        else if (id === "mirrorkhat") api.giveHat("mirrorkhat");
        else api.giveFurn(id);
        say("Vitrine wraps it in a cloth that shows tomorrow's weather.");
        caravan();
      }));
    });
  }

  function ruinspot() {
    if (st.day.ruins >= 1) return say("The Buried City gives one find a day. The sands are firm about it.");
    const day = new Date().toDateString(), r = rngFor("ruins" + day), at = RUIN_SPOTS[Math.floor(r() * RUIN_SPOTS.length)];
    const d = Math.hypot((at[0] + .5) * T - px, (at[1] + .5) * T - py);
    if (d > 60) return say(`The city is buried near ${d < 400 ? "a dune not far from here" : "the far side of the glass flat"}. Walk the ruin field and listen for the hollow sound.`);
    st.day.ruins = 1; const v = payBeads(14); save(); api.ping("done"); burst(px, py, 24);
    page("The Buried City", `<p class="muted">You clear the sand from a doorway nobody has used since the city learned to walk. Inside: one perfect pane of the old glass, showing a customer slightly braver than they arrived.</p><p class="by-big">+${v} beads</p><button class="btn btn-accent" type="button" id="dz-ok">Take the pane</button>`, (e) => { e.querySelector("#dz-ok").onclick = closePage; });
  }

  function oasis() {
    const ready = !st.cool || st.cool < Date.now();
    page("Oasis Teahouse", `<p class="muted">The teahouse serves cold tea on purpose — the cold is the whole point. A rest in the shade makes the desert generous: for ten minutes, the Glassworks and Sand-Surf pay half again.</p><div class="by-list"><div class="${cooled() ? "ok" : ""}"><i>🧊</i><span><strong>Cooled rest</strong><small>${cooled() ? `Generosity flowing · ${Math.ceil((st.cool - Date.now()) / 60000)} min left` : "Grants +50% beads for 10 minutes"}</small></span><button class="btn btn-accent" type="button" id="dz-rest" ${ready ? "" : "disabled"}>${ready ? "Rest" : "Rested recently"}</button></div></div>`, (e) => {
      e.querySelector("#dz-rest").onclick = () => { st.cool = Date.now() + 10 * 60 * 1000; save(); api.ping("done"); say("The tea is cold and the shade is deep. The desert approves."); oasis(); };
    });
  }

  const GAMES = { foundry, surf, caravan, ruinspot, oasis };
  function findTarget() {
    for (const [id, name, verb, x, y] of SPOTS) if (Math.hypot((x + .5) * T - px, (y + .5) * T - py) < 44) return { label: `${name}: ${verb}`, go: GAMES[id] };
    if (Math.hypot(wraith.x - px, wraith.y - py) < 44) return { label: "Listen to the dust wraith", go: () => { say(`The dust wraith: ${WRAITH[wraith.line++ % WRAITH.length]}`); api.ping("blip"); } };
    if (Math.hypot((SPAWN[0] + .5) * T - px, (SPAWN[1] + .5) * T - py) < 52) return { label: "Back to Kitsune World", go: leave };
    return null;
  }
  function leave() { save(); api.leave(); }
  const act = () => { if (!pageEl.hidden) return; target?.go(); };

  function update(dt, now) {
    let ax = 0, ay = 0;
    if (pageEl.hidden) { if (keys.has("a") || keys.has("arrowleft")) ax--; if (keys.has("d") || keys.has("arrowright")) ax++; if (keys.has("w") || keys.has("arrowup")) ay--; if (keys.has("s") || keys.has("arrowdown")) ay++; if (joy && Math.hypot(joy.x, joy.y) > .18) { ax = joy.x; ay = joy.y; } }
    moving = !!(ax || ay);
    if (moving) { const m = Math.max(1, Math.hypot(ax, ay)), v = (keys.has("shift") ? 260 : 175) * dt, nx = px + ax / m * v, ny = py + ay / m * v; if (!blocked(nx, py)) px = nx; if (!blocked(px, ny)) py = ny; dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down"; step += dt * 13; }
    wraith.x = (56 + Math.sin(now / 4200) * 30) * T; wraith.y = (26 + Math.cos(now / 5100) * 10) * T;
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
    const vw = cw / zoom, vh = ch / zoom, camX = Math.max(0, Math.min(GW * T - vw, px - vw / 2)), camY = Math.max(0, Math.min(GH * T - vh, py - vh / 2)), x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(GW - 1, Math.ceil((camX + vw) / T)), y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(GH - 1, Math.ceil((camY + vh) / T));
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = "#e4c78c"; g.fillRect(0, 0, cw, ch); g.scale(zoom, zoom); g.translate(-Math.round(camX), -Math.round(camY));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = map.g[y * GW + x]; g.fillStyle = TC[v][(x + y) % 2]; g.fillRect(x * T, y * T, T + .5, T + .5); if (v === TILE.glass && (x * 5 + y * 3) % 11 === 0) { g.fillStyle = "rgba(255,255,255,.7)"; const gl = Math.sin(now / 300 + x + y) * 2; g.fillRect(x * T + 8 + gl, y * T + 14, 10, 2); } if (v === TILE.dune) { g.fillStyle = "rgba(0,0,0,.12)"; g.beginPath(); g.arc(x * T + 16, y * T + 22, 14, Math.PI, 0); g.fill(); } if (v === TILE.oasis && (x * 3 + y) % 9 === 0) { g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1.5; g.beginPath(); const o = Math.sin(now / 500 + x) * 3; g.moveTo(x * T + 6 + o, y * T + 16); g.quadraticCurveTo(x * T + 13 + o, y * T + 10, x * T + 22 + o, y * T + 16); g.stroke(); } }
    const things = [];
    for (const m of MESAS) things.push([(m.y + m.h) * T, () => { const x = m.x * T, y = m.y * T, w = m.w * T, h = m.h * T; g.fillStyle = m.c; g.strokeStyle = "#6a4528"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + 8, y + h * .4); g.lineTo(x + w * .3, y + h * .25); g.lineTo(x + w * .7, y + h * .2); g.lineTo(x + w - 8, y + h * .45); g.lineTo(x + w, y + h); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = "rgba(0,0,0,.2)"; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + w * k / 4, y + h * .3); g.lineTo(x + w * k / 4, y + h); g.stroke(); } }]);
    for (const cc of CRYSTALS) things.push([(cc.y + 3) * T, () => { const x = cc.x * T, y = cc.y * T; for (const [ox, h2] of [[4, 26], [16, 40], [30, 20]]) { g.fillStyle = "#cfeaf4"; g.strokeStyle = "#7fa8b8"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + ox, y + 34); g.lineTo(x + ox + 6, y + 34 - h2); g.lineTo(x + ox + 12, y + 34); g.closePath(); g.fill(); g.stroke(); g.fillStyle = `rgba(255,255,255,${.3 + Math.sin(now / 250 + cc.i + ox) * .25})`; g.fillRect(x + ox + 3, y + 34 - h2 * .5, 2, 6); } }]);
    things.push([14 * T + 160, () => { const x = 14 * T, y = 46 * T; g.fillStyle = "#4f7a3a"; g.strokeStyle = "#2e4a22"; g.lineWidth = 2.5; for (const [px2, h2] of [[30, 40], [130, 52], [240, 38]]) { g.fillRect(x + px2, y + 60 - h2, 6, h2); g.beginPath(); g.arc(x + px2 + 3, y + 58 - h2, 16, 0, 7); g.fill(); g.stroke(); } }]);
    for (const [x, y] of RUIN_SPOTS) things.push([(y + 3) * T, () => { const x2 = x * T, y2 = y * T; g.fillStyle = "#d8ccae"; g.strokeStyle = "#8a7a58"; g.lineWidth = 2; for (const [ox, h2] of [[6, 34], [44, 22], [86, 30]]) { g.fillRect(x2 + ox, y2 + 40 - h2, 10, h2); g.strokeRect(x2 + ox, y2 + 40 - h2, 10, h2); } g.fillStyle = "#c9b98e"; g.fillRect(x2 + 2, y2 + 38, 100, 6); g.strokeRect(x2 + 2, y2 + 38, 100, 6); }]);
    for (const [id, name, , bx, by] of SPOTS) things.push([(by + 2) * T, () => { const x = bx * T, y = by * T, w = 7 * T, h = 2.2 * T, m = x + w / 2; g.fillStyle = "#6a4528"; g.fillRect(x + 6, y + h * .45, w - 12, h * .55); g.strokeStyle = "#231d2c"; g.lineWidth = 2.5; const aw = { foundry: "#e05a3c", surf: "#3fae6a", caravan: "#7fd8e8", ruinspot: "#c9a86a", oasis: "#35a86a" }[id]; for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? "#f4ead8" : aw; g.beginPath(); g.moveTo(x + (w * k) / 6, y + h * .5); g.lineTo(x + (w * (k + 1)) / 6, y + h * .5); g.lineTo(x + (w * (k + .5)) / 6, y); g.closePath(); g.fill(); g.stroke(); } if (id === "caravan") for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(207,234,244,.85)"; g.fillRect(x + 14 + k * 24, y + h * .55, 10, 12); g.strokeRect(x + 14 + k * 24, y + h * .55, 10, 12); } label(name, m, y + h * .72); }]);
    things.push([wraith.y + 16, () => { g.fillStyle = "rgba(0,0,0,.15)"; g.beginPath(); g.ellipse(wraith.x, wraith.y + 12, 10, 4, 0, 0, 7); g.fill(); g.fillStyle = "rgba(216,204,174,.8)"; g.strokeStyle = "#8a7a58"; g.lineWidth = 2; const bob = Math.sin(now / 160) * 2; g.beginPath(); g.moveTo(wraith.x - 8, wraith.y + 10); g.quadraticCurveTo(wraith.x - 12, wraith.y - 14 + bob, wraith.x, wraith.y - 22 + bob); g.quadraticCurveTo(wraith.x + 12, wraith.y - 14 + bob, wraith.x + 8, wraith.y + 10); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#e05a3c"; g.beginPath(); g.arc(wraith.x - 3, wraith.y - 12 + bob, 1.8, 0, 7); g.arc(wraith.x + 3, wraith.y - 12 + bob, 1.8, 0, 7); g.fill(); }]);
    things.push([py + 14, () => api.drawFox(g, px, py, dir, step, api.fur, api.tails, s.hat, now, moving)]);
    things.sort((a, q) => a[0] - q[0]); for (const t of things) t[1]();
    for (const p of sparks) { g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.fillRect(p.x - 2, p.y - 2, 4, 4); } g.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  const resize = () => { const r = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); cw = Math.max(1, r.width * dpr); ch = Math.max(1, r.height * dpr); c.width = cw; c.height = ch; zoom = (r.width < 640 ? 1.1 : 1.35) * dpr; };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const onDown = (e) => { if (!host.isConnected || document.querySelector(".modal") || e.metaKey || e.ctrlKey || e.altKey) return; if (e.target?.closest?.("input,textarea,button")) return; const k = e.key.toLowerCase(); e.stopPropagation(); if (k === "escape") { e.preventDefault(); if (!pageEl.hidden) closePage(); return; } if (!pageEl.hidden) return; if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) { e.preventDefault(); keys.add(k); return; } if (e.repeat) return; if (k === "e" || k === " " || k === "enter") { e.preventDefault(); act(); } }, onUp = (e) => keys.delete(e.key.toLowerCase()), onBlur = () => keys.clear();
  window.addEventListener("keydown", onDown, true); window.addEventListener("keyup", onUp, true); window.addEventListener("blur", onBlur);
  host.querySelectorAll("[data-h]").forEach((x) => (x.onclick = () => { if (x.dataset.h === "caravan") caravan(); else leave(); host.focus({ preventScroll: true }); }));
  promptEl.onclick = () => act(); host.querySelector("#dz-act").onclick = () => act();
  const pad = host.querySelector("#dz-pad"), knob = pad.querySelector("i");
  pad.onpointerdown = (e) => { pad.setPointerCapture(e.pointerId); joy = { x: 0, y: 0 }; pad.onpointermove(e); };
  pad.onpointermove = (e) => { if (!joy) return; const r = pad.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), m = Math.max(1, Math.hypot(x, y)); joy = { x: x / m, y: y / m }; knob.style.transform = `translate(${joy.x * 30}px,${joy.y * 30}px)`; };
  pad.onpointerup = pad.onpointercancel = () => { joy = null; knob.style.transform = ""; };
  host.tabIndex = 0; host.focus({ preventScroll: true }); hud(); say("The Glass Desert glares back, politely."); raf = requestAnimationFrame(frame);
  host.__desert = { caravan, st, get pos() { return [px, py]; } };
  return () => { alive = false; cancelAnimationFrame(raf); pageOff?.(); ro.disconnect(); window.removeEventListener("keydown", onDown, true); window.removeEventListener("keyup", onUp, true); window.removeEventListener("blur", onBlur); };
}
