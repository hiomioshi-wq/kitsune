// The Sunken Deep: walkable underwater realm data, map builder, pearl-diving, vent-trial and abyssal goods.
export const DW = 96, DH = 64, DT = 32;
export const DTILE = { abyss: 0, sand: 1, kelp: 2, ruin: 3, bridge: 4, coral: 5, vent: 6, rock: 7 };

export const DEEP_ZONES = [
  { id: "trench", name: "The Kelp Trench", cx: 22, cy: 32, rx: 13, ry: 10, base: DTILE.sand, accent: DTILE.kelp },
  { id: "annex", name: "Sunken Library Annex", cx: 48, cy: 15, rx: 12, ry: 9, base: DTILE.ruin, accent: DTILE.coral },
  { id: "garden", name: "Bioluminescent Garden", cx: 74, cy: 24, rx: 13, ry: 10, base: DTILE.kelp, accent: DTILE.vent },
  { id: "gate", name: "The Leviathan's Gate", cx: 62, cy: 48, rx: 13, ry: 10, base: DTILE.ruin, accent: DTILE.sand },
  { id: "thermal", name: "The Hydrothermal Spire", cx: 24, cy: 52, rx: 12, ry: 9, base: DTILE.vent, accent: DTILE.coral },
  { id: "observatory", name: "The Abyssal Observatory", cx: 48, cy: 52, rx: 10, ry: 8, base: DTILE.ruin, accent: DTILE.vent },
  { id: "moonwell", name: "The Moonwell Cavern", cx: 85, cy: 50, rx: 9, ry: 9, base: DTILE.ruin, accent: DTILE.kelp },
];

export const DEEP_SPAWN = [22, 34];
export const DEEP_BELL = [13, 32];

export const DEEP_BUILDINGS = [
  { id: "divepost", x: 19, y: 24, w: 6, h: 4, roof: "#2f6f7a", name: "Trench Outpost" },
  { id: "sunkenannex", x: 45, y: 8, w: 6, h: 4, roof: "#4a3f7a", name: "Flooded Stacks" },
  { id: "gardendome", x: 71, y: 15, w: 6, h: 5, roof: "#2f8a6e", name: "Anemone Conservatory" },
  { id: "gatearch", x: 59, y: 40, w: 6, h: 4, roof: "#8a4a3a", name: "Leviathan's Arch" },
  { id: "thermalspire", x: 21, y: 45, w: 6, h: 4, roof: "#b84a2a", name: "Thermal Spire" },
  { id: "abyssdome", x: 45, y: 45, w: 6, h: 4, roof: "#2a4a7a", name: "Abyssal Dome" },
  { id: "moonshrine", x: 82, y: 43, w: 6, h: 4, roof: "#5a5a8e", name: "Moonwell Shrine" },
];

const L = (c, a, st, sk, h, f) => ({ c, a, st, sk, h, e: "#222", f });
export const DEEP_NPCS = [
  {
    id: "barnabyjr", key: "Barnaby Jr", name: "Diver Barnaby Jr.", x: 22, y: 30,
    look: L("#2a5f6f", "#ffe8b0", 3, 2, "#5a3a22", "coat"),
    lines: [
      "Welcome to the Sunken Deep. Mind the trench—the current pulls sideways at dusk.",
      "Four Sunken Lanterns kept the seabed lit before the water went cold.",
      "Relight all four and the Phosphor Tide will wake up.",
    ],
  },
  {
    id: "coralia", key: "Coralia", name: "Coralia the Archivist", x: 48, y: 14,
    look: L("#6a3f7a", "#ffd8e8", 5, 1, "#2a1830", "robe"),
    lines: [
      "The Librarian upstairs thinks they're the only underwater library. We have better shelving.",
      "Bring me Sea Pearls and mon—I trade abyssal hats and sunken furniture.",
      "The Annex Lantern only lights for someone who's caught 3 Abyssal Fish.",
    ],
  },
  {
    id: "lumen", key: "Lumen", name: "Lumen", x: 74, y: 22,
    look: L("#2f8a6e", "#b8fff0", 4, 0, "#1c3a32", "casual"),
    lines: [
      "Every anemone down here glows in its own key.",
      "Align the 3 pressure valves in the Conservatory to clear the Garden vents.",
    ],
  },
  {
    id: "nautilus", key: "Nautilus", name: "Warden Nautilus", x: 62, y: 46,
    look: L("#8a4a3a", "#fff1d0", 6, 3, "#c9b89a", "uniform"),
    lines: [
      "This gate has held back the deep current for six hundred years.",
      "Pass the Sonar Echo Trial at the Arch to awaken the Gate Lantern.",
    ],
  },
  {
    id: "cinderfin", key: "Cinderfin", name: "Cinderfin the Diver", x: 24, y: 50,
    look: L("#b84a2a", "#ffd27a", 5, 2, "#2a1814", "coat"),
    lines: [
      "The vents keep this whole corner of the seabed warm as bathwater.",
      "Gather twelve Sea Pearls and relight the Spire Lantern before the phosphor tide rolls in.",
    ],
  },
  {
    id: "orla_deep", key: "Orla", name: "Diver Orla", x: 48, y: 50,
    look: L("#2a4a7a", "#b8e4ff", 5, 2, "#3a2218", "coat"),
    lines: [
      "From the Abyssal Dome you can see the whole Phosphor Tide curling up from the trench.",
      "Bring twenty Sea Pearls to light the Observatory Lantern.",
    ],
  },
  {
    id: "selune_deep", key: "Selene", name: "Selene the Moonkeeper", x: 85, y: 48,
    look: L("#3a4a7e", "#e8f4ff", 2, 0, "#c9d8ff", "robe"),
    lines: [
      "The surface moon writes to us through this well—Sea Pearls are her replies.",
      "Past the Leviathan's Gate the dark gets honest. Moonlight keeps it polite.",
      "Bring thirty Sea Pearls and the Moonwell Lantern will wake for you.",
    ],
  },
];

export const DEEP_LANTERNS = [
  { id: "trench", name: "Trench Lantern", x: 27, y: 29, need: "5 Sea Pearls", check: (d) => (d.pearls || 0) >= 5, desc: "Collect 5 Sea Pearls drifting along the seabed." },
  { id: "annex", name: "Annex Lantern", x: 54, y: 14, need: "3 Abyssal Fish", check: (d) => (d.caught || 0) >= 3, desc: "Catch 3 Abyssal Fish from any trench edge." },
  { id: "garden", name: "Garden Lantern", x: 80, y: 22, need: "3 Pressure Valves", check: (d) => Object.keys(d.valves || {}).length >= 3, desc: "Balance 3 Pressure Valves at Lumen's Conservatory." },
  { id: "gate", name: "Gate Lantern", x: 68, y: 46, need: "Sonar Echo Trial", check: (d) => !!d.sonarWon, desc: "Complete Warden Nautilus's Sonar Echo Trial." },
  { id: "thermal", name: "Spire Lantern", x: 29, y: 50, need: "12 Sea Pearls", check: (d) => (d.pearls || 0) >= 12, desc: "Collect 12 Sea Pearls across the Sunken Deep." },
  { id: "observatory", name: "Observatory Lantern", x: 53, y: 50, need: "20 Sea Pearls", check: (d) => (d.pearls || 0) >= 20, desc: "Collect 20 Sea Pearls across the Sunken Deep." },
  { id: "moonwell", name: "Moonwell Lantern", x: 90, y: 48, need: "30 Sea Pearls", check: (d) => (d.pearls || 0) >= 30, desc: "Collect 30 Sea Pearls across the Sunken Deep." },
];

export const DEEP_FISH = [
  ["glasssquid", "Glass Squid", 8, 0.42],
  ["lanternangler", "Lantern Angler", 16, 0.28],
  ["abyssalseahorse", "Abyssal Seahorse", 22, 0.22],
  ["pearlray", "Pearl Ray", 28, 0.16],
  ["leviathaneel", "Leviathan Eel", 38, 0.11],
  ["chromenautilus", "Chrome Nautilus", 52, 0.08],
  ["ventcrab", "Vent Crab", 32, 0.15],
  ["abyssalwhale", "Lantern Leviathan", 58, 0.06],
  ["starfish_g", "Astral Starfish", 40, 0.12],
  ["obsidian_crab", "Obsidian King Crab", 48, 0.09],
  ["void_jelly", "Phosphor Jelly", 65, 0.05],
  ["trench_dragon", "Trench Sea-Dragon", 80, 0.04],
  ["moon_koi", "Moonwell Koi", 72, 0.05],
  ["well_wraith", "Moonwell Wraith", 92, 0.03],
];

export const DEEP_GOODS = [
  { id: "hat:divehelm", kind: "hat", key: "divehelm", name: "Abyssal Diver's Helm", desc: "Brass and thick glass.", pearls: 5, mon: 80 },
  { id: "hat:coralcrown", kind: "hat", key: "coralcrown", name: "Coral Crown", desc: "Grown in the Bioluminescent Garden.", pearls: 4, mon: 60 },
  { id: "furn:coralthrone", kind: "furn", key: "coralthrone", name: "Coral Throne", desc: "For your house upstairs.", pearls: 6, mon: 110 },
  { id: "furn:abysslamp", kind: "furn", key: "abysslamp", name: "Angler Lamp", desc: "Glows blue in the dark.", pearls: 4, mon: 70 },
  { id: "furn:glassfountain", kind: "furn", key: "glassfountain", name: "Tide-Glass Fountain", desc: "Carved from abyssal sea-glass.", pearls: 7, mon: 130 },
  { id: "furn:kelprug", kind: "furn", key: "kelprug", name: "Woven Kelp Rug", desc: "Soft bioluminescent weave.", pearls: 5, mon: 90 },
  { id: "furn:mothlantern", kind: "furn", key: "mothlantern", name: "Moon Moth Lantern", desc: "Moths that sip from the Moonwell.", pearls: 8, mon: 140 },
  { id: "tonic:fins", kind: "tonic", key: "fins", name: "Current-Fin Tonic", desc: "+15% swim speed in the Sunken Deep.", pearls: 3, mon: 35 },
];

export function ensureDeep(s) {
  const d = (s.deep ||= {});
  d.pearls ??= 0;
  d.picked ??= {};
  d.lit ??= {};
  d.valves ??= {};
  d.fish ??= {};
  d.caught ??= 0;
  d.sonarWon ??= 0;
  d.phosphor ??= 0;
  d.tonic ??= 0;
  d.day ??= "";
  const today = new Date().toDateString();
  if (d.day !== today) {
    d.day = today;
    d.picked = {};
  }
  return d;
}

export function buildDeepMap() {
  const g = new Uint8Array(DW * DH).fill(DTILE.abyss);
  const solid = new Uint8Array(DW * DH).fill(1);
  const put = (x, y, v) => {
    if (x >= 0 && y >= 0 && x < DW && y < DH) {
      g[y * DW + x] = v;
      solid[y * DW + x] = v === DTILE.abyss || v === DTILE.rock ? 1 : 0;
    }
  };

  for (const z of DEEP_ZONES) {
    for (let y = z.cy - z.ry - 2; y <= z.cy + z.ry + 2; y++) {
      for (let x = z.cx - z.rx - 2; x <= z.cx + z.rx + 2; x++) {
        const a = Math.atan2(y - z.cy, x - z.cx);
        const w = 1 + Math.sin(a * 4 + z.cx) * 0.08 + Math.cos(a * 3 + z.cy) * 0.06;
        const d = ((x - z.cx) / z.rx) ** 2 + ((y - z.cy) / z.ry) ** 2;
        if (d <= w) {
          const isHub = ((x - z.cx) / (z.rx * 0.45)) ** 2 + ((y - z.cy) / (z.ry * 0.45)) ** 2 <= 1;
          const isAcc = !isHub && ((x * 11 + y * 7) % 10 === 0);
          put(x, y, isHub ? DTILE.ruin : isAcc ? z.accent : z.base);
        }
      }
    }
  }

  const bridge = ([ax, ay], [bx, by]) => {
    let x = ax, y = ay;
    const stamp = (px, py) => {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const tx = px + dx, ty = py + dy;
        if (tx >= 0 && ty >= 0 && tx < DW && ty < DH && g[ty * DW + tx] === DTILE.abyss) put(tx, ty, DTILE.bridge);
      }
    };
    while (x !== bx) { stamp(x, y); x += Math.sign(bx - x); }
    while (y !== by) { stamp(x, y); y += Math.sign(by - y); }
    stamp(x, y);
  };

  bridge([28, 25], [40, 18]);
  bridge([57, 15], [64, 21]);
  bridge([72, 31], [66, 40]);
  bridge([32, 36], [51, 46]);
  bridge([22, 40], [24, 45]);
  bridge([34, 52], [50, 50]);
  bridge([72, 48], [85, 50]);

  for (let x = DEEP_BELL[0] - 2; x <= DEEP_BELL[0] + 4; x++) {
    for (let y = DEEP_BELL[1] - 1; y <= DEEP_BELL[1] + 1; y++) put(x, y, DTILE.bridge);
  }

  const keep = new Uint8Array(DW * DH);
  const reserve = (cx, cy, r = 2) => {
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (x >= 0 && y >= 0 && x < DW && y < DH) keep[y * DW + x] = 1;
  };
  reserve(DEEP_SPAWN[0], DEEP_SPAWN[1], 3);
  reserve(DEEP_BELL[0], DEEP_BELL[1], 3);
  for (const n of DEEP_NPCS) reserve(n.x, n.y, 2);
  for (const l of DEEP_LANTERNS) reserve(l.x, l.y, 2);
  for (const b of DEEP_BUILDINGS) {
    for (let y = b.y - 1; y <= b.y + b.h + 1; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) if (x >= 0 && y >= 0 && x < DW && y < DH) keep[y * DW + x] = 1;
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) solid[y * DW + x] = 1;
  }

  let seed = 8821;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const pearls = [];
  for (let y = 2; y < DH - 2; y++) {
    for (let x = 2; x < DW - 2; x++) {
      const i = y * DW + x, v = g[i];
      if (v === DTILE.abyss || v === DTILE.bridge || v === DTILE.ruin || keep[i] || solid[i]) continue;
      const q = rnd();
      if (q < 0.07) put(x, y, DTILE.rock);
      else if (q > 0.91 && pearls.length < 30 && !pearls.some((p) => Math.hypot(p.x - x, p.y - y) < 5)) pearls.push({ id: pearls.length, x, y });
    }
  }
  return { g, solid, pearls };
}
