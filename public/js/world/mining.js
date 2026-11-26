// The Deep Mines: walkable procedurally generated mine shafts, ore veins, pickaxe upgrades and smelting — expanded with Opal & Amber veins, strike-cracked geodes, the Comet Pick & Starlight Lamp tiers, the Cometfall Hollow milestone, and now The Vitrified Deep & The Hourglass Floor strata, Vitrine veins, stamina-feeding Hourglass Sand, and the Depth 46 milestone.
import { ORES } from "./square.js";

const esc = (x) => String(x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MW = 36, MH = 24, T = 32;

export const PICKS = [
  { lv: 0, name: "Copper Pickaxe", pow: 1, reach: 44, cost: 0, ore: {} },
  { lv: 1, name: "Iron Pickaxe", pow: 2, reach: 48, cost: 120, ore: { Copper: 6, Tin: 4 } },
  { lv: 2, name: "Moonstone Pickaxe", pow: 3, reach: 54, cost: 340, ore: { Silver: 6, Gold: 4, Moonstone: 1 } },
  { lv: 3, name: "Starfall Pickaxe", pow: 5, reach: 60, cost: 750, ore: { Jade: 5, Ruby: 4, Moonstone: 3 } },
  { lv: 4, name: "Obsidian Pickaxe", pow: 7, reach: 64, cost: 1300, ore: { Ruby: 6, Moonstone: 5, Starfall: 2 } },
  { lv: 5, name: "Meridian Drill-Pick", pow: 10, reach: 70, cost: 2200, ore: { Starfall: 5, Voidglass: 3 } },
  { lv: 6, name: "Sunstone Auger", pow: 14, reach: 74, cost: 3600, ore: { Voidglass: 5, Sunstone: 4 } },
  { lv: 7, name: "Aetherium Bore", pow: 20, reach: 80, cost: 5800, ore: { Mithril: 5, Chronos: 4, Aetherium: 2 } },
  { lv: 8, name: "Comet Pick", pow: 28, reach: 84, cost: 8800, ore: { Chronos: 5, Aetherium: 4 } },
];

export const LAMPS = [
  { lv: 0, name: "Tallow Lamp", max: 40, cost: 0 },
  { lv: 1, name: "Foxfire Headlamp", max: 65, cost: 180 },
  { lv: 2, name: "Aurora Core", max: 100, cost: 480 },
  { lv: 3, name: "Starlight Beacon", max: 145, cost: 900 },
  { lv: 4, name: "Meridian Solar Core", max: 210, cost: 1650 },
  { lv: 5, name: "Chronos Lantern", max: 300, cost: 2800 },
  { lv: 6, name: "Aetherial Beacon", max: 420, cost: 4500 },
  { lv: 7, name: "Starlight Lamp", max: 600, cost: 7200 },
];

export const STRATA = [
  { min: 1, name: "Shallow Shale", wall: "#1b1824", flA: "#353042", flB: "#302b3c" },
  { min: 4, name: "Mossy Basalt", wall: "#14201c", flA: "#283d35", flB: "#22342d" },
  { min: 8, name: "Crystal Cavern", wall: "#16142a", flA: "#2e2a54", flB: "#262248" },
  { min: 13, name: "Magma Rift", wall: "#261214", flA: "#462226", flB: "#3b1b1e" },
  { min: 19, name: "Abyssal Void", wall: "#0b0918", flA: "#1e193a", flB: "#17132f" },
  { min: 26, name: "Cometfall Hollow", wall: "#0d0e1c", flA: "#232a52", flB: "#1b2142" },
  { min: 34, name: "The Vitrified Deep", wall: "#0a1216", flA: "#1c3f46", flB: "#163339" },
  { min: 46, name: "The Hourglass Floor", wall: "#1c150c", flA: "#4d3d1f", flB: "#3f321a" },
];
export const stratumFor = (d) => [...STRATA].reverse().find((s) => d >= s.min) || STRATA[0];

export const VEINS = [
  { id: "Copper", name: "Copper Vein", c: "#c9774a", hp: 2, minD: 1, w: 30, mon: 6 },
  { id: "Tin", name: "Tin Vein", c: "#b9c2c8", hp: 2, minD: 1, w: 26, mon: 6 },
  { id: "Silver", name: "Silver Vein", c: "#e4e8f0", hp: 3, minD: 2, w: 18, mon: 12 },
  { id: "Gold", name: "Gold Vein", c: "#ffcf3f", hp: 4, minD: 3, w: 13, mon: 20 },
  { id: "Jade", name: "Jade Seam", c: "#4fc98a", hp: 4, minD: 4, w: 9, mon: 26 },
  { id: "Ruby", name: "Ruby Geode", c: "#e0344a", hp: 5, minD: 5, w: 6, mon: 36 },
  { id: "Moonstone", name: "Moonstone Crystal", c: "#bcd6ff", hp: 6, minD: 6, w: 4, mon: 50 },
  { id: "Opal", name: "Opal Vein", c: "#7fd8e8", hp: 5, minD: 7, w: 3, mon: 60 },
  { id: "Starfall", name: "Starfall Ore", c: "#ffd27a", hp: 8, minD: 8, w: 4, mon: 75 },
  { id: "Amber", name: "Amber Seam", c: "#ffb84d", hp: 6, minD: 9, w: 3, mon: 85 },
  { id: "Voidglass", name: "Voidglass Seam", c: "#b58cff", hp: 10, minD: 10, w: 3, mon: 110 },
  { id: "Sunstone", name: "Sunstone Core", c: "#ff9a3a", hp: 12, minD: 12, w: 3, mon: 155 },
  { id: "Mithril", name: "Mithril Vein", c: "#7fe8ff", hp: 14, minD: 15, w: 3, mon: 210 },
  { id: "Chronos", name: "Chronos Shard", c: "#ffd84d", hp: 16, minD: 18, w: 2, mon: 280 },
  { id: "Aetherium", name: "Aetherium Crystal", c: "#5cf0c0", hp: 20, minD: 22, w: 2, mon: 380 },
  { id: "Vitrine", name: "Vitrine Vein", c: "#c4ecf0", hp: 26, minD: 32, w: 2, mon: 520 },
  { id: "HourglassSand", name: "Hourglass Sand", c: "#e8c578", hp: 30, minD: 42, w: 2, mon: 0, stam: 2 },
];

export function ensureMine(s) {
  const m = (s.mine ||= {});
  m.pick ??= 0;
  m.lamp ??= 0;
  m.best ??= 1;
  m.total ??= 0;
  m.smelted ??= 0;
  m.bombs ??= 2;
  m.deep10 ??= 0;
  m.deep20 ??= 0;
  m.deep26 ??= 0;
  m.deep46 ??= 0;
  m.ore150 ??= 0;
  s.square ||= {};
  s.square.ore ||= {};
  return m;
}

export function buildMineFloor(depth) {
  const g = new Uint8Array(MW * MH).fill(1); // 1 = wall, 0 = floor, 2 = ladder down, 3 = lift up
  const nodes = [];
  let seed = 5119 + depth * 7919;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

  // Carve winding cavern rooms
  let cx = 5, cy = 12;
  const carve = (x, y, r) => {
    for (let j = y - r; j <= y + r; j++) {
      for (let i = x - r; i <= x + r; i++) {
        if (i > 0 && j > 0 && i < MW - 1 && j < MH - 1 && Math.hypot(i - x, j - y) <= r + 0.35) {
          g[j * MW + i] = 0;
        }
      }
    }
  };
  carve(cx, cy, 3);
  for (let step = 0; step < 34; step++) {
    cx = Math.max(3, Math.min(MW - 4, cx + Math.round((rnd() - 0.35) * 4)));
    cy = Math.max(3, Math.min(MH - 4, cy + Math.round((rnd() - 0.5) * 4)));
    carve(cx, cy, 2 + Math.floor(rnd() * 2));
  }

  g[12 * MW + 5] = 3; // Lift up at spawn
  let lx = cx, ly = cy;
  if (Math.hypot(lx - 5, ly - 12) < 8) { lx = MW - 6; ly = 12; for (let x = Math.min(cx, lx); x <= Math.max(cx, lx); x++) carve(x, ly, 2); }
  g[ly * MW + lx] = 2; // Ladder down

  const pool = VEINS.filter((v) => depth >= v.minD);
  const totW = pool.reduce((a, v) => a + v.w, 0);
  const pickVein = () => {
    let q = rnd() * totW;
    for (const v of pool) { q -= v.w; if (q <= 0) return v; }
    return pool[0];
  };

  for (let y = 2; y < MH - 2; y++) {
    for (let x = 2; x < MW - 2; x++) {
      if (g[y * MW + x] !== 0) continue;
      if (Math.hypot(x - 5, y - 12) < 3 || Math.hypot(x - lx, y - ly) < 2) continue;
      if (rnd() < 0.14) {
        const v = pickVein();
        nodes.push({ id: nodes.length, x, y, v, hp: v.hp + Math.floor(depth / 4), max: v.hp + Math.floor(depth / 4) });
      }
    }
  }
  const caches = [], shrines = [];
  for (let y = 2; y < MH - 2; y++) {
    for (let x = 2; x < MW - 2; x++) {
      if (g[y * MW + x] !== 0) continue;
      if (Math.hypot(x - 5, y - 12) < 3 || Math.hypot(x - lx, y - ly) < 2) continue;
      if (nodes.some((n) => n.x === x && n.y === y)) continue;
      const r = rnd();
      if (depth >= 2 && r < 0.012 && caches.length < 2) caches.push({ id: caches.length, x, y, open: false });
      else if (r > 0.988 && shrines.length < 1) shrines.push({ id: shrines.length, x, y, used: false });
    }
  }
  return { g, nodes, caches, shrines, spawn: [5, 12], ladder: [lx, ly], stratum: stratumFor(depth), gs: 7919 + depth * 104729 };
}

export function mountMine(host, api) {
  const s = api.state, m = ensureMine(s), ore = s.square.ore, keys = new Set();
  host.innerHTML = `<canvas class="by-c"></canvas>
    <div class="by-hud sky-hud">
      <strong>⛏️ Depth <span id="mn-d">1</span> · <span id="mn-str">Shallow Shale</span> · 🏮 <span id="mn-oil">40</span></strong>
      <span id="mn-bag"></span>
      <div class="by-btns">
        <button type="button" id="mn-bomb">Blast <kbd>B</kbd></button>
        <button type="button" id="mn-gear">Forge & Gear <kbd>J</kbd></button>
        <button type="button" id="mn-leave">Surface <kbd>Esc</kbd></button>
      </div>
    </div>
    <button type="button" class="by-prompt" id="mn-prompt" hidden></button>
    <div class="wd-pad by-pad" id="mn-pad"><i></i></div>
    <button type="button" class="wd-act by-act" id="mn-act">E</button>
    <div class="by-toast" id="mn-toast" hidden></div>
    <section class="by-page" id="mn-page" hidden></section>`;

  const c = host.querySelector(".by-c"), g = c.getContext("2d");
  const promptEl = host.querySelector("#mn-prompt"), toastEl = host.querySelector("#mn-toast"), pageEl = host.querySelector("#mn-page");

  let depth = 1, floor = buildMineFloor(1);
  let px = (floor.spawn[0] + 0.5) * T, py = (floor.spawn[1] + 0.5) * T;
  let oil = LAMPS[m.lamp].max, dir = "down", step = 0, moving = false, alive = true, raf = 0, last = performance.now();
  let cw = 0, ch = 0, zoom = 1.5, target = null, joy = null, toastT = 0, sparks = [], floats = [];

  const sayToast = (t) => { toastEl.textContent = t; toastEl.hidden = false; toastT = performance.now() + 2600; };
  const hud = () => {
    host.querySelector("#mn-d").textContent = depth;
    host.querySelector("#mn-str").textContent = floor.stratum.name;
    host.querySelector("#mn-oil").textContent = Math.max(0, oil);
    host.querySelector("#mn-bag").textContent = `${PICKS[m.pick].name} · ${m.total} mined · 💣 ${m.bombs}`;
  };
  const burst = (x, y, cCol, n = 14) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = 35 + Math.random() * 110;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: cCol });
    }
  };
  const grnd = () => ((floor.gs = (Math.imul(floor.gs, 1664525) + 1013904223) >>> 0) / 4294967296);

  const blocked = (x, y) => [[-9, 2], [9, 2], [-9, 13], [9, 13]].some(([a, b]) => {
    const X = Math.floor((x + a) / T), Y = Math.floor((y + b) / T);
    if (X < 0 || Y < 0 || X >= MW || Y >= MH || floor.g[Y * MW + X] === 1) return true;
    return floor.nodes.some((n) => n.hp > 0 && n.x === X && n.y === Y);
  });

  const descend = () => {
    depth++;
    m.best = Math.max(m.best, depth);
    floor = buildMineFloor(depth);
    px = (floor.spawn[0] + 0.5) * T;
    py = (floor.spawn[1] + 0.5) * T;
    if (depth >= 10 && !m.deep10) { m.deep10 = 1; api.addMon(150); sayToast("Reached Depth 10! (+150 mon)"); }
    else if (depth >= 20 && !m.deep20) { m.deep20 = 1; api.addMon(400); sayToast("Reached Depth 20! (+400 mon)"); }
    else if (depth >= 26 && !m.deep26) { m.deep26 = 1; api.addMon(800); api.giveFurn("crystalcluster"); sayToast(`Reached Depth 26 in ${floor.stratum.name}! Earned a Crystal Cluster & +800 mon.`); }
    else if (depth >= 46 && !m.deep46) { m.deep46 = 1; api.addMon(1600); api.giveFurn("crystalcluster"); sayToast(`Reached Depth 46 in ${floor.stratum.name}! Earned a Crystal Cluster & +1600 mon.`); }
    else sayToast(`Descended to Depth ${depth} (${floor.stratum.name}).`);
    api.ping("open"); api.save(); hud();
  };

  function blastCharge() {
    if (m.bombs <= 0) return sayToast("No blasting charges left! Buy more in Forge & Gear.");
    m.bombs--;
    let hits = 0;
    for (const n of floor.nodes) {
      if (n.hp <= 0) continue;
      const nx = (n.x + 0.5) * T, ny = (n.y + 0.5) * T;
      if (Math.hypot(nx - px, ny - py) <= T * 2.8) {
        n.hp = 0; hits++;
        const qty = 1 + (Math.random() < 0.5 ? 1 : 0);
        ore[n.v.id] = (ore[n.v.id] || 0) + qty;
        m.total += qty;
        burst(nx, ny, n.v.c, 16);
        floats.push({ x: nx, y: ny - 14, t: `+${qty} ${n.v.id}`, c: n.v.c, life: 1.2 });
      }
    }
    burst(px, py, "#ff9a3a", 24);
    api.ping(hits ? "done" : "blip");
    api.save(); hud();
    sayToast(hits ? `Blasted ${hits} ore vein${hits > 1 ? "s" : ""}!` : "Detonated a charge—no veins in range.");
  }

  function crackGeode(x, y) {
    const pool = VEINS.filter((v) => depth >= v.minD && v.mon > 0);
    const a = pool[Math.floor(grnd() * pool.length)];
    const b = pool[(pool.indexOf(a) + 1 + Math.floor(grnd() * (pool.length - 1))) % pool.length];
    const bonus = 12 + depth * 3;
    [a, b].forEach((v, i) => { ore[v.id] = (ore[v.id] || 0) + 1; m.total++; floats.push({ x, y: y - 14 - i * 13, t: `+1 ${v.id}`, c: v.c, life: 1.2 }); });
    api.addMon(bonus);
    burst(x, y, "#cfe9ff", 18);
    api.ping("choice"); api.save();
    return `Cracked open a geode! +1 ${a.id}, +1 ${b.id} & +${bonus} mon.`;
  }

  function strikeNode(n) {
    if (oil <= 0) return sayToast("Your lamp is out of stamina! Find an Oil Shrine, surface, or upgrade your lamp.");
    oil--;
    n.hp -= PICKS[m.pick].pow;
    const nx = (n.x + 0.5) * T, ny = (n.y + 0.5) * T;
    burst(nx, ny, n.v.c, 12);
    const gMsg = depth >= 5 && grnd() < 0.05 ? crackGeode(nx, ny) : "";
    if (n.hp <= 0) {
      if (n.v.stam) {
        oil = Math.min(LAMPS[m.lamp].max, oil + n.v.stam);
        floats.push({ x: nx, y: ny - 14, t: `+${n.v.stam} 🏮`, c: n.v.c, life: 1.2 });
      } else {
        const qty = 1 + (Math.random() < 0.35 ? 1 : 0);
        ore[n.v.id] = (ore[n.v.id] || 0) + qty;
        m.total += qty;
        floats.push({ x: nx, y: ny - 14, t: `+${qty} ${n.v.id}`, c: n.v.c, life: 1.2 });
      }
      api.ping("done");
      if (m.total >= 50 && !(s.hats || []).includes("minerhat")) {
        api.giveHat("minerhat");
        api.giveFurn("crystalcluster");
        sayToast("50 ores mined! Earned the Miner's Helmet & Crystal Cluster.");
      } else if (m.total >= 150 && !m.ore150) {
        m.ore150 = 1; api.addMon(300);
        sayToast("150 ores mined! Deep Miner bonus (+300 mon).");
      }
      api.save();
    } else {
      api.ping("blip");
    }
    if (gMsg) sayToast(gMsg);
    hud();
  }

  function closePage() { pageEl.hidden = true; pageEl.innerHTML = ""; api.save(); hud(); host.focus({ preventScroll: true }); }
  function gearPage() {
    pageEl.hidden = false;
    const nextPick = PICKS[m.pick + 1], nextLamp = LAMPS[m.lamp + 1];
    const canPick = nextPick && api.mon() >= nextPick.cost && Object.entries(nextPick.ore).every(([k, n]) => (ore[k] || 0) >= n);
    const canLamp = nextLamp && api.mon() >= nextLamp.cost;
    pageEl.innerHTML = `<header><button class="btn" type="button" id="mn-back">Back</button><h2>Mine Forge & Upgrades</h2><span>${api.mon()} mon</span></header>
      <div class="by-body">
        <p>${VEINS.map((v) => `<span style="color:${v.c}">◆</span> ${v.id} <b>${ore[v.id] || 0}</b>`).join(" · ")}</p>
        <h3>Equipment & Supplies</h3>
        <div class="by-list">
          <div><i>⛏️</i><span><strong>${PICKS[m.pick].name}</strong><small>Power ${PICKS[m.pick].pow}${nextPick ? ` · Next: ${nextPick.name} (${nextPick.cost} mon, ${Object.entries(nextPick.ore).map(([k, n]) => `${n} ${k}`).join(", ")})` : " · Max tier"}</small></span>${nextPick ? `<button class="btn btn-accent" type="button" id="up-pick" ${canPick ? "" : "disabled"}>Upgrade</button>` : "<em>Max</em>"}</div>
          <div><i>🏮</i><span><strong>${LAMPS[m.lamp].name}</strong><small>Stamina ${LAMPS[m.lamp].max}${nextLamp ? ` · Next: ${nextLamp.name} (${nextLamp.cost} mon)` : " · Max tier"}</small></span>${nextLamp ? `<button class="btn btn-accent" type="button" id="up-lamp" ${canLamp ? "" : "disabled"}>Upgrade</button>` : "<em>Max</em>"}</div>
          <div><i>💣</i><span><strong>Blasting Charge</strong><small>Owned: ${m.bombs} · Shatters all veins within 2.8 tiles (press B)</small></span><button class="btn btn-accent" type="button" id="buy-bomb" ${api.mon() >= 50 ? "" : "disabled"}>Buy (50 mon)</button></div>
        </div>
        <h3>Smelt & Sell Ores</h3>
        <div class="by-list">${VEINS.map((v) => `<div><i style="background:${v.c};width:18px;height:18px;border-radius:50%;display:inline-block"></i><span><strong>${v.id}</strong><small>Owned: ${ore[v.id] || 0} · Smelts for ${v.mon} mon</small></span><div style="display:flex;gap:6px"><button class="btn" type="button" data-smelt="${v.id}" ${(ore[v.id] || 0) > 0 ? "" : "disabled"}>Smelt 1</button><button class="btn" type="button" data-smeltall="${v.id}" ${(ore[v.id] || 0) > 0 ? "" : "disabled"}>Smelt All</button></div></div>`).join("")}</div>
      </div>`;
    pageEl.querySelector("#mn-back").onclick = closePage;
    pageEl.querySelector("#buy-bomb")?.addEventListener("click", () => {
      if (api.mon() < 50) return;
      api.addMon(-50); m.bombs++; api.ping("done"); api.save(); gearPage();
    });
    pageEl.querySelector("#up-pick")?.addEventListener("click", () => {
      if (!canPick) return;
      api.addMon(-nextPick.cost);
      for (const [k, n] of Object.entries(nextPick.ore)) ore[k] -= n;
      m.pick++; api.ping("done"); api.save(); gearPage();
    });
    pageEl.querySelector("#up-lamp")?.addEventListener("click", () => {
      if (!canLamp) return;
      api.addMon(-nextLamp.cost);
      m.lamp++; oil = LAMPS[m.lamp].max; api.ping("done"); api.save(); gearPage();
    });
    pageEl.querySelectorAll("[data-smelt]").forEach((b) => (b.onclick = () => {
      const v = VEINS.find((q) => q.id === b.dataset.smelt);
      if (!v || !(ore[v.id] > 0)) return;
      ore[v.id]--; m.smelted++; api.addMon(v.mon); api.ping("choice"); api.save(); gearPage();
    }));
    pageEl.querySelectorAll("[data-smeltall]").forEach((b) => (b.onclick = () => {
      const v = VEINS.find((q) => q.id === b.dataset.smeltall), n = ore[v?.id] || 0;
      if (!v || n <= 0) return;
      ore[v.id] = 0; m.smelted += n; api.addMon(v.mon * n); api.ping("done"); api.save(); gearPage();
    }));
  }

  function findTarget() {
    if (Math.hypot((floor.spawn[0] + 0.5) * T - px, (floor.spawn[1] + 0.5) * T - py) < 42) return { label: "Take Lift to Surface", go: leave };
    if (Math.hypot((floor.ladder[0] + 0.5) * T - px, (floor.ladder[1] + 0.5) * T - py) < 42) return { label: `Descend to Depth ${depth + 1}`, go: descend };
    for (const ch of floor.caches || []) {
      if (!ch.open && Math.hypot((ch.x + 0.5) * T - px, (ch.y + 0.5) * T - py) < 42) {
        return { label: "Open Geode Cache", go: () => {
          ch.open = true;
          const bonus = 25 + depth * 6;
          api.addMon(bonus); m.bombs++;
          oil = Math.min(LAMPS[m.lamp].max, oil + 12);
          burst((ch.x + 0.5) * T, (ch.y + 0.5) * T, "#ffd84d", 18);
          api.ping("done"); api.save(); hud();
          sayToast(`Geode Cache! +${bonus} mon, +1 Blasting Charge, +12 Lamp.`);
        } };
      }
    }
    for (const sh of floor.shrines || []) {
      if (!sh.used && Math.hypot((sh.x + 0.5) * T - px, (sh.y + 0.5) * T - py) < 42) {
        return { label: "Refill Lamp at Oil Shrine", go: () => {
          sh.used = true;
          oil = Math.min(LAMPS[m.lamp].max, oil + 25);
          burst((sh.x + 0.5) * T, (sh.y + 0.5) * T, "#ff9a3a", 16);
          api.ping("choice"); hud();
          sayToast("Refilled +25 Lamp stamina!");
        } };
      }
    }
    const reach = PICKS[m.pick].reach;
    let best = null, bd = reach;
    for (const n of floor.nodes) {
      if (n.hp <= 0) continue;
      const d = Math.hypot((n.x + 0.5) * T - px, (n.y + 0.5) * T - py);
      if (d < bd) { bd = d; best = n; }
    }
    if (best) return { label: `Mine ${best.v.name} (${best.hp}/${best.max})`, go: () => strikeNode(best) };
    return null;
  }

  const leave = () => { if (!alive) return; alive = false; cleanup(); api.save(); api.leave(); };
  const act = () => { if (pageEl.hidden && target) target.go(); };

  function update(dt, now) {
    let ax = 0, ay = 0;
    if (pageEl.hidden) {
      if (keys.has("a") || keys.has("arrowleft")) ax--;
      if (keys.has("d") || keys.has("arrowright")) ax++;
      if (keys.has("w") || keys.has("arrowup")) ay--;
      if (keys.has("s") || keys.has("arrowdown")) ay++;
      if (joy && Math.hypot(joy.x, joy.y) > 0.18) { ax = joy.x; ay = joy.y; }
    }
    moving = !!(ax || ay);
    if (moving) {
      const m_ = Math.max(1, Math.hypot(ax, ay)), v = (keys.has("shift") ? 260 : 180) * dt;
      const nx = px + (ax / m_) * v, ny = py + (ay / m_) * v;
      if (!blocked(nx, py)) px = nx;
      if (!blocked(px, ny)) py = ny;
      dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? "left" : "right") : ay < 0 ? "up" : "down";
      step += dt * 13;
    }
    for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.life -= dt * 1.4; }
    sparks = sparks.filter((p) => p.life > 0);
    for (const f of floats) { f.y -= 24 * dt; f.life -= dt; }
    floats = floats.filter((f) => f.life > 0);
    if (toastT && now > toastT) { toastEl.hidden = true; toastT = 0; }
    if (pageEl.hidden) {
      const nt = findTarget();
      if (nt?.label !== target?.label) { promptEl.hidden = !nt; if (nt) promptEl.innerHTML = `<kbd>E</kbd> ${esc(nt.label)}`; }
      target = nt;
    } else { promptEl.hidden = true; target = null; }
  }

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt, now);
    const vw = cw / zoom, vh = ch / zoom;
    const camX = Math.max(0, Math.min(MW * T - vw, px - vw / 2));
    const camY = Math.max(0, Math.min(MH * T - vh, py - vh / 2));

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#0e0c14"; g.fillRect(0, 0, cw, ch);
    g.scale(zoom, zoom); g.translate(-Math.round(camX), -Math.round(camY));

    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        const v = floor.g[y * MW + x], st = floor.stratum;
        g.fillStyle = v === 1 ? st.wall : (x + y) % 2 ? st.flA : st.flB;
        g.fillRect(x * T, y * T, T + 0.5, T + 0.5);
        if (v === 2) {
          g.fillStyle = "#8a5a32"; g.fillRect(x * T + 8, y * T + 4, 4, 24); g.fillRect(x * T + 20, y * T + 4, 4, 24);
          for (let r = 8; r < 28; r += 6) g.fillRect(x * T + 8, y * T + r, 16, 3);
        } else if (v === 3) {
          g.fillStyle = "#5a6478"; g.fillRect(x * T + 4, y * T + 4, 24, 24);
          g.fillStyle = "#ffd27a"; g.fillRect(x * T + 12, y * T + 8, 8, 16);
        }
      }
    }

    const things = [];
    for (const n of floor.nodes) {
      if (n.hp <= 0) continue;
      const nx = (n.x + 0.5) * T, ny = (n.y + 0.5) * T;
      things.push([ny + 10, () => {
        g.fillStyle = "#524c60"; g.beginPath(); g.arc(nx, ny + 2, 13, 0, 7); g.fill();
        g.fillStyle = n.v.c; g.beginPath(); g.arc(nx - 4, ny - 2, 5, 0, 7); g.arc(nx + 4, ny + 3, 4, 0, 7); g.fill();
        if (n.hp < n.max) { g.fillStyle = "#111"; g.fillRect(nx - 12, ny - 18, 24, 4); g.fillStyle = n.v.c; g.fillRect(nx - 11, ny - 17, 22 * (n.hp / n.max), 2); }
      }]);
    }
    for (const ch of floor.caches || []) {
      if (ch.open) continue;
      const nx = (ch.x + 0.5) * T, ny = (ch.y + 0.5) * T;
      things.push([ny + 10, () => { g.fillStyle = "#8a5a2a"; g.fillRect(nx - 10, ny - 8, 20, 16); g.fillStyle = "#ffd84d"; g.fillRect(nx - 10, ny - 3, 20, 4); }]);
    }
    for (const sh of floor.shrines || []) {
      const nx = (sh.x + 0.5) * T, ny = (sh.y + 0.5) * T;
      things.push([ny + 10, () => { g.fillStyle = "#4a4658"; g.fillRect(nx - 9, ny - 6, 18, 16); g.fillStyle = sh.used ? "#555" : "#ff9a3a"; g.beginPath(); g.arc(nx, ny - 8, 6, 0, 7); g.fill(); }]);
    }
    things.push([py + 14, () => api.drawFox(g, px, py, dir, step, api.fur, api.tails, s.hat, now, moving)]);
    things.sort((a, b) => a[0] - b[0]);
    for (const t of things) t[1]();
    for (const p of sparks) { g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.fillRect(p.x - 2, p.y - 2, 4, 4); }
    g.globalAlpha = 1;
    g.font = "800 12px system-ui"; g.textAlign = "center";
    for (const f of floats) { g.fillStyle = f.c; g.fillText(f.t, f.x, f.y); }
    raf = requestAnimationFrame(frame);
  }

  const resize = () => {
    const r = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cw = Math.max(1, r.width * dpr); ch = Math.max(1, r.height * dpr);
    c.width = cw; c.height = ch; zoom = (r.width < 640 ? 1.25 : 1.5) * dpr;
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const onDown = (e) => {
    if (!host.isConnected || document.querySelector(".modal") || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase(); e.stopPropagation();
    if (k === "escape") { e.preventDefault(); if (!pageEl.hidden) closePage(); else leave(); return; }
    if (!pageEl.hidden) { if (k === "j") { e.preventDefault(); closePage(); } return; }
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) { e.preventDefault(); keys.add(k); return; }
    if (e.repeat) return;
    if (k === "e" || k === " " || k === "enter") { e.preventDefault(); act(); }
    else if (k === "b") { e.preventDefault(); blastCharge(); }
    else if (k === "j") gearPage();
  };
  const onUp = (e) => keys.delete(e.key.toLowerCase()), onBlur = () => keys.clear();
  window.addEventListener("keydown", onDown, true); window.addEventListener("keyup", onUp, true); window.addEventListener("blur", onBlur);

  const pad = host.querySelector("#mn-pad"), knob = pad.querySelector("i");
  pad.onpointerdown = (e) => { pad.setPointerCapture(e.pointerId); joy = { x: 0, y: 0 }; pad.onpointermove(e); };
  pad.onpointermove = (e) => { if (!joy) return; const r = pad.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), m = Math.max(1, Math.hypot(x, y)); joy = { x: x / m, y: y / m }; knob.style.transform = `translate(${joy.x * 30}px,${joy.y * 30}px)`; };
  pad.onpointerup = pad.onpointercancel = () => { joy = null; knob.style.transform = ""; };

  host.querySelector("#mn-act").onclick = act;
  promptEl.onclick = act;
  host.querySelector("#mn-bomb").onclick = blastCharge;
  host.querySelector("#mn-gear").onclick = gearPage;
  host.querySelector("#mn-leave").onclick = leave;

  function cleanup() {
    cancelAnimationFrame(raf); ro.disconnect();
    window.removeEventListener("keydown", onDown, true); window.removeEventListener("keyup", onUp, true); window.removeEventListener("blur", onBlur);
  }
  hud(); host.focus({ preventScroll: true }); raf = requestAnimationFrame(frame);
  return () => { alive = false; cleanup(); };
}
