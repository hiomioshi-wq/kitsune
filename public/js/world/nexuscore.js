// The Astral Nexus — Core Data, Procedural Star-Rift Generator, Relics, Caravans & Nine-Tail Zodiac.

export const NX_W = 46;
export const NX_H = 34;
export const NX_T = 32;

export const NX_TIERS = [
  { id: "atrium", name: "Starlight Atrium", minFloor: 1, bg: "#090d22", floor: "#161d3c", wall: "#2b396e", accent: "#7fd0ff", foeColor: "#ff6b8a", bossName: "Starlight Sentinel" },
  { id: "clockwork", name: "Clockwork Vault", minFloor: 3, bg: "#141008", floor: "#282012", wall: "#5c4622", accent: "#ffd84d", foeColor: "#ff8a3a", bossName: "Chrono-Automaton" },
  { id: "archive", name: "Sunken Archive", minFloor: 5, bg: "#06161c", floor: "#0e2b36", wall: "#1e5668", accent: "#5cf0c0", foeColor: "#b58cff", bossName: "Drowned Archivist" },
  { id: "forge", name: "Cinderbell Forge", minFloor: 8, bg: "#1c080a", floor: "#341216", wall: "#6e242c", accent: "#ff9a3a", foeColor: "#ffd27a", bossName: "Cinder Colossus" },
  { id: "prism", name: "Emerald Prism", minFloor: 11, bg: "#071a12", floor: "#103324", wall: "#226b4c", accent: "#35d68a", foeColor: "#ff5a7a", bossName: "Prism Sovereign" },
  { id: "horizon", name: "Infinite Horizon", minFloor: 15, bg: "#0d061c", floor: "#1e103a", wall: "#46287c", accent: "#ff4fd8", foeColor: "#7fe8ff", bossName: "The Tenth Lantern" },
];

// id, name, icon, costMotes, costMon, kind, val, desc
export const NX_RELICS = [
  ["swiftpaw", "anklet", "☄️", 40, 120, "speed", 12, "+12% Overworld & Rift movement speed"],
  ["magnetorb", "charm", "💠", 55, 160, "reach", 14, "+14px Overworld Foxfire magnet radius"],
  ["goldthread", "spool", "🪙", 70, 220, "mon", 20, "+20% Mon from Foxfire & Rift caches"],
  ["tidestone", "pearl", "🐚", 65, 190, "fish", 18, "+18% wider Fishing reel bar in Kitsune World"],
  ["twinwisp", "orb", "✨", 85, 260, "wisps", 1, "+1 Orbital Starlight Wisp in Rift runs"],
  ["rapidbolt", "quill", "⚡", 95, 300, "rate", 25, "+25% Star-Bolt fire rate in Rift runs"],
  ["aegisbell", "bell", "🔔", 110, 340, "hp", 2, "+2 Max Hearts inside Star-Rifts"],
  ["phasecloak", "cloak", "🌙", 125, 380, "dash", 30, "-30% Astral Dash cooldown & longer invulnerability"],
  ["moteprism", "prism", "💎", 140, 440, "motes", 35, "+35% Astral Motes harvested from Rifts"],
  ["caravanhorn", "horn", "📯", 150, 480, "trade", 30, "+30% Grand Caravan hourly tariff yield"],
  ["sunheart", "core", "☀️", 180, 600, "dmg", 1, "+1 Star-Bolt & Wisp base damage"],
  ["omnicrown", "crown", "👑", 260, 900, "all", 15, "+15% Overworld speed, Mote yield & Caravan income"],
];

// id, from/to name, unlockCostMon, baseMonPerHr, baseMotesPerHr, guardPower, blurb
export const NX_ROUTES = [
  ["pine_shore", "Hollow Pine ↔ Saltwick Shore", 80, 35, 6, 1, "Tea crates north, pine timber south."],
  ["pine_clock", "Hollow Pine ↔ Brask", 140, 55, 9, 2, "Brass springs and three-second-late pocketwatches."],
  ["clock_lake", "Brask ↔ Drowned Reservoir", 210, 80, 13, 3, "Waterproofed ink and library return slips."],
  ["pine_peaks", "Hollow Pine ↔ The High Post", 290, 110, 18, 4, "Sled-dogs hauling frost-sealed parcels."],
  ["shore_market", "Saltwick ↔ The Night Market", 380, 145, 24, 5, "Saltwick pearls for umbrella silk and night spice."],
  ["market_station", "Night Market ↔ Platform Zero", 500, 190, 32, 6, "Midnight sleeper freight on unnumbered rails."],
  ["station_oz", "Platform Zero ↔ Emerald City", 660, 250, 42, 7, "Poppy honey, green glass, and royal dispatches."],
  ["oz_shrine", "Emerald City ↔ Lantern Shrine", 880, 340, 58, 9, "Pure foxfire wicks carried under guard."],
];

// id, name, costMotes, rewardKind, rewardId, rewardLabel, bonusDesc
export const NX_ZODIAC = [
  ["tail1", "First Tail · The Courier", 45, "mon", "250", "+250 Mon", "Unlocks +5% permanent Rift Mote find"],
  ["tail2", "Second Tail · The Lantern", 70, "hat", "riftwalker", "Riftwalker's Hood", "Unlocks Riftwalker's Hood for your fox"],
  ["tail3", "Third Tail · The Pendulum", 95, "furn", "riftlantern", "Astral Rift Lantern", "Unlocks Astral Rift Lantern for your house"],
  ["tail4", "Fourth Tail · The Reservoir", 125, "mon", "500", "+500 Mon", "+1 starting Heart in every Rift run"],
  ["tail5", "Fifth Tail · The Gale", 160, "hat", "starweaver", "Starweaver's Mantle", "Unlocks Starweaver's Mantle for your fox"],
  ["tail6", "Sixth Tail · The Umbrella", 200, "furn", "celestialglobe", "Celestial Orrery Globe", "Unlocks Celestial Orrery Globe for your house"],
  ["tail7", "Seventh Tail · The Sleeper", 250, "mon", "900", "+900 Mon", "+1 free Orbital Wisp in all Rift runs"],
  ["tail8", "Eighth Tail · The Emerald", 310, "furn", "astralspire", "Miniature Nexus Spire", "Unlocks Miniature Nexus Spire for your house"],
  ["tail9", "Ninth Tail · The Sovereign", 400, "hat", "astralcrown", "Astral Sovereign Crown", "Unlocks Astral Sovereign Crown & +10% World Speed"],
];

export function ensureNexus(s) {
  const nx = (s.nexus ||= {});
  nx.motes ??= 30;
  nx.bestFloor ??= 0;
  nx.clears ??= 0;
  nx.kills ??= 0;
  nx.relics ||= {};
  nx.equipped ||= [];
  nx.routes ||= {};
  nx.zodiac ||= {};
  nx.lastClaim ||= Date.now();
  return nx;
}

export function nexusStats(s) {
  const nx = ensureNexus(s);
  const out = { speed: 0, reach: 0, mon: 0, fish: 0, wisps: 1, rate: 0, hp: 5, dash: 0, motes: 0, trade: 0, dmg: 1 };
  for (const id of nx.equipped) {
    if (!nx.relics[id]) continue;
    const r = NX_RELICS.find((x) => x[0] === id);
    if (!r) continue;
    const [, , , , , kind, val] = r;
    if (kind === "all") {
      out.speed += val;
      out.motes += val;
      out.trade += val;
    } else if (kind in out) {
      out[kind] += val;
    }
  }
  if (nx.zodiac.tail1) out.motes += 5;
  if (nx.zodiac.tail4) out.hp += 1;
  if (nx.zodiac.tail7) out.wisps += 1;
  if (nx.zodiac.tail9) out.speed += 10;
  return out;
}

export function pendingCaravanYield(s, now = Date.now()) {
  const nx = ensureNexus(s);
  const st = nexusStats(s);
  const elapsedHrs = Math.min(12, Math.max(0, (now - (nx.lastClaim || now)) / 3_600_000));
  let monPerHr = 0;
  let motesPerHr = 0;
  for (const r of NX_ROUTES) {
    const lv = nx.routes[r[0]] || 0;
    if (!lv) continue;
    const mult = 1 + (lv - 1) * 0.45;
    monPerHr += r[3] * mult;
    motesPerHr += r[4] * mult;
  }
  const tradeMult = 1 + st.trade / 100;
  return {
    mon: Math.floor(monPerHr * elapsedHrs * tradeMult),
    motes: Math.floor(motesPerHr * elapsedHrs * tradeMult),
    monPerHr: Math.round(monPerHr * tradeMult),
    motesPerHr: Math.round(motesPerHr * tradeMult),
    hours: elapsedHrs,
  };
}

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export function tierForFloor(floor) {
  let best = NX_TIERS[0];
  for (const t of NX_TIERS) if (floor >= t.minFloor) best = t;
  return best;
}

export function buildRiftFloor(floor, seedBase = Date.now()) {
  const r = rng((seedBase ^ (floor * 7919)) >>> 0);
  const tier = tierForFloor(floor);
  const g = new Uint8Array(NX_W * NX_H); // 1 = wall, 0 = floor
  g.fill(1);

  const rooms = [];
  const carveRect = (x0, y0, w, h) => {
    for (let y = Math.max(1, y0); y < Math.min(NX_H - 1, y0 + h); y++) {
      for (let x = Math.max(1, x0); x < Math.min(NX_W - 1, x0 + w); x++) {
        g[y * NX_W + x] = 0;
      }
    }
  };

  // Start room in center
  const startRoom = { cx: Math.floor(NX_W / 2), cy: Math.floor(NX_H / 2), w: 8, h: 8 };
  carveRect(startRoom.cx - 4, startRoom.cy - 4, 8, 8);
  rooms.push(startRoom);

  for (let i = 0; i < 11; i++) {
    const rw = 6 + Math.floor(r() * 5);
    const rh = 6 + Math.floor(r() * 4);
    const cx = 4 + Math.floor(r() * (NX_W - 8));
    const cy = 4 + Math.floor(r() * (NX_H - 8));
    carveRect(cx - Math.floor(rw / 2), cy - Math.floor(rh / 2), rw, rh);
    const prev = rooms[rooms.length - 1];
    let x = prev.cx, y = prev.cy;
    while (x !== cx) {
      carveRect(x - 1, y - 1, 3, 3);
      x += x < cx ? 1 : -1;
    }
    while (y !== cy) {
      carveRect(x - 1, y - 1, 3, 3);
      y += y < cy ? 1 : -1;
    }
    rooms.push({ cx, cy, w: rw, h: rh });
  }

  const openTiles = [];
  for (let y = 2; y < NX_H - 2; y++) {
    for (let x = 2; x < NX_W - 2; x++) {
      if (g[y * NX_W + x] === 0 && Math.hypot(x - startRoom.cx, y - startRoom.cy) > 5) {
        openTiles.push([x, y]);
      }
    }
  }

  const pickFar = (used, minGap = 6) => {
    for (let tries = 0; tries < 200; tries++) {
      const p = openTiles[Math.floor(r() * openTiles.length)];
      if (!p) break;
      if (used.every((u) => Math.hypot(u[0] - p[0], u[1] - p[1]) >= minGap)) {
        used.push(p);
        return p;
      }
    }
    const fallback = openTiles[Math.floor(r() * openTiles.length)] || [startRoom.cx + 3, startRoom.cy];
    used.push(fallback);
    return fallback;
  };

  const used = [[startRoom.cx, startRoom.cy]];
  const pylons = [0, 1, 2].map((id) => {
    const [x, y] = pickFar(used, 8);
    return { id, x: (x + 0.5) * NX_T, y: (y + 0.5) * NX_T, lit: false };
  });

  const caches = Array.from({ length: 4 }, (_, id) => {
    const [x, y] = pickFar(used, 5);
    return { id, x: (x + 0.5) * NX_T, y: (y + 0.5) * NX_T, opened: false };
  });

  const portalPos = pickFar(used, 7);
  const portal = { x: (portalPos[0] + 0.5) * NX_T, y: (portalPos[1] + 0.5) * NX_T, active: false };

  const foeCount = Math.min(18, 6 + floor * 2);
  const foes = Array.from({ length: foeCount }, (_, id) => {
    const [x, y] = pickFar(used, 3);
    const elite = id === 0 && floor >= 2;
    const hp = (elite ? 7 : 3) + Math.floor(floor * 1.35);
    return {
      id,
      x: (x + 0.5) * NX_T,
      y: (y + 0.5) * NX_T,
      hp,
      maxHp: hp,
      speed: (elite ? 95 : 78) + Math.min(55, floor * 4),
      elite,
      boss: false,
      cd: r() * 1.5,
      hitT: 0,
    };
  });

  return {
    floor,
    tier,
    g,
    spawn: [(startRoom.cx + 0.5) * NX_T, (startRoom.cy + 0.5) * NX_T],
    pylons,
    caches,
    portal,
    foes,
    bossSpawned: false,
    bossCleared: false,
  };
}
