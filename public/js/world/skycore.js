// The Skyward Isles: floating archipelago data, map builder, constellations, chimes and sky goods.
export const SW = 96, SH = 64, ST = 32;
export const STILE = { sky: 0, cloud: 1, meadow: 2, plaza: 3, bridge: 4, ruin: 5, flower: 6, tree: 7 };

export const SKY_ISLANDS = [
  { id: "harbor", name: "Galeharbor", cx: 22, cy: 32, rx: 13, ry: 10, base: STILE.cloud, accent: STILE.plaza, c: "#c9e6ff" },
  { id: "loom", name: "Loom-in-the-Clouds", cx: 48, cy: 15, rx: 12, ry: 9, base: STILE.meadow, accent: STILE.flower, c: "#9be3b4" },
  { id: "conservatory", name: "Starlight Conservatory", cx: 74, cy: 24, rx: 13, ry: 10, base: STILE.plaza, accent: STILE.meadow, c: "#d8c9ff" },
  { id: "spire", name: "The Amber Spire", cx: 62, cy: 48, rx: 13, ry: 10, base: STILE.ruin, accent: STILE.plaza, c: "#ffd89a" },
  { id: "aerolith", name: "The Windmill Sanctum", cx: 24, cy: 52, rx: 12, ry: 9, base: STILE.meadow, accent: STILE.cloud, c: "#b8e4ff" },
  { id: "terrace", name: "The Aurora Terrace", cx: 48, cy: 52, rx: 10, ry: 8, base: STILE.plaza, accent: STILE.flower, c: "#a8ffd8" },
  { id: "kiteyard", name: "The Kite Yard", cx: 16, cy: 9, rx: 12, ry: 7, base: STILE.meadow, accent: STILE.flower, c: "#f4c8dd" },
  { id: "lanternloft", name: "The Lantern Loft", cx: 80, cy: 6, rx: 11, ry: 6, base: STILE.plaza, accent: STILE.flower, c: "#ffd9a0" },
];

export const SKY_SPAWN = [22, 34];
export const SKY_DOCK = [13, 32];

export const SKY_BUILDINGS = [
  { id: "harborhall", x: 19, y: 24, w: 6, h: 4, roof: "#3a6ea5", name: "Harbor Post" },
  { id: "loomhouse", x: 45, y: 8, w: 6, h: 4, roof: "#4fa876", name: "The Cloud Loom" },
  { id: "dome", x: 71, y: 15, w: 6, h: 5, roof: "#5b4894", name: "Starlight Dome" },
  { id: "spirearch", x: 59, y: 40, w: 6, h: 4, roof: "#c97a2c", name: "Amber Shrine" },
  { id: "sanctum", x: 21, y: 45, w: 6, h: 4, roof: "#2f7fa8", name: "Windmill Sanctum" },
  { id: "aurorapavilion", x: 45, y: 45, w: 6, h: 4, roof: "#3a7a6a", name: "Aurora Pavilion" },
  { id: "kiteworks", x: 10, y: 4, w: 6, h: 4, roof: "#b8586e", name: "The Kite Works" },
  { id: "windwatch", x: 17, y: 4, w: 6, h: 4, roof: "#4a7a9a", name: "Wind-Reader's Watch" },
  { id: "lanternarchive", x: 78, y: 2, w: 6, h: 4, roof: "#b8863a", name: "The Lantern Archive" },
];

const L = (c, a, st, sk, h, f) => ({ c, a, st, sk, h, e: "#222", f });
export const SKY_NPCS = [
  {
    id: "kestrel", key: "Kestrel", name: "Captain Kestrel", x: 22, y: 30,
    look: L("#2c4a70", "#fff1d0", 4, 2, "#3a2218", "uniform"),
    lines: [
      "Welcome aboard the Skyward Isles. Mind the drop—it's a long way back to Platform Zero.",
      "Four Wind-Bells keep the high currents calm. Every one of them went silent last winter.",
      "Ring all four bells and the Aurora returns to the upper sky.",
    ],
  },
  {
    id: "loomis", key: "Loomis", name: "Loomis the Weaver", x: 48, y: 14,
    look: L("#488a68", "#f6f0e4", 5, 1, "#d9b88a", "apron"),
    lines: [
      "We spin cumulus fluff at dawn before it dries into rain.",
      "Bring me Star-Shards and mon—I'll weave hats and cloud-down furniture you won't find downstairs.",
      "The Loom Bell only rings for someone who's fished the open cloud-sea.",
    ],
  },
  {
    id: "astrid", key: "Astrid", name: "Astrid", x: 74, y: 22,
    look: L("#4a3678", "#e8e4ff", 6, 0, "#1c1828", "robe"),
    lines: [
      "The sky remembers every story told below. You just need the right lens to read it.",
      "Six constellations have drifted out of alignment. Step up to the Telescope whenever you're ready.",
      "Chart three of them and the Conservatory Bell will hear you.",
    ],
  },
  {
    id: "zephyr", key: "Zephyr", name: "Zephyr", x: 62, y: 46,
    look: L("#b86b2c", "#fff0d0", 3, 3, "#5a3218", "coat"),
    lines: [
      "The Amber Spire is older than the Old Capital. Its chimes still answer a steady ear.",
      "Try Cloud-Fishing off any island's cliff edge—the sky-fish bite best where the wind curls.",
      "Match the chime sequence in the Spire Trial to wake the final Wind-Bell.",
    ],
  },
  {
    id: "gale", key: "Gale", name: "Gale the Windwright", x: 24, y: 50,
    look: L("#2f7fa8", "#e8f4ff", 5, 1, "#1c3a54", "coat"),
    lines: [
      "The Windmill Sanctum catches the southern trade-gusts before they ever touch Hollow Pine.",
      "Bring twelve Star-Shards across the islands and the Sanctum Bell will sing all the way to Galeharbor.",
    ],
  },
  {
    id: "lyra_sky", key: "Lyra", name: "Terrace Keeper Lyra", x: 48, y: 50,
    look: L("#3a7a6a", "#a8ffd8", 5, 2, "#d9c89a", "robe"),
    lines: [
      "Every aurora ribbon begins right here at the Aurora Pavilion.",
      "Chart five constellations at Astrid's Telescope to ring the Aurora Bell.",
    ],
  },
  {
    id: "sela", key: "Sela", name: "Sela the Kitemaker", x: 13, y: 11,
    look: L("#b8586e", "#ffe8f0", 6, 1, "#5a2c3a", "apron"),
    lines: [
      "Every kite leaving this yard is paper, ribbon, and a promise the wind keeps—until it doesn't.",
      "The Paper Kitefish schools off our east edge, riding the same gusts as my kites. Catch one and the yard bell will finally sing.",
      "Vane reads the wind before I ever cut the paper. Ask her what today's sky is holding.",
    ],
  },
  {
    id: "vane", key: "Vane", name: "Vane the Wind-Reader", x: 23, y: 13,
    look: L("#4a7a9a", "#e8f0ff", 3, 4, "#d8d4c8", "coat"),
    lines: [
      "The wind writes in three scripts—gust, gap, and grudge. This morning it is all gap.",
      "Every bell in the isles went silent in a single winter. Whatever hushed them came from above the chart, not below it.",
      "Fish where the kites dip. The shy ones only show themselves under paper wings.",
    ],
  },
  {
    id: "mirabel", key: "Mirabel", name: "Mirabel the Moth-Keeper", x: 77, y: 7,
    look: L("#7a5aa8", "#ffe9c8", 6, 2, "#d8cbe8", "robe"),
    lines: [
      "Every moth on this loft is a filed constellation—wing-dust and starlight, catalogued and released.",
      "The loft lanterns run on moth-light. When the bells went silent, the moths drifted off-chart.",
      "Chart The Paper Lantern at Astrid's Telescope and our Loft Bell will finally have something to sing about.",
    ],
  },
  {
    id: "rooke", key: "Rooke", name: "Rooke the Cloud-Shepherd", x: 84, y: 8,
    look: L("#c99a4a", "#f4ecd8", 5, 1, "#8a6a3a", "coat"),
    lines: [
      "A cloud flock grazes best on thin high mist—too rich and they sour into rain by supper.",
      "I herd them with a whistle and a promise. Same as anyone keeps anything, up here.",
      "Fish off the east rail where the lantern glow pools. The Ember Mothfish bites only under its own light.",
    ],
  },
];

export const SKY_BELLS = [
  { id: "harbor", name: "Galeharbor Bell", island: "harbor", x: 27, y: 29, who: "kestrel", need: "5 Star-Shards", check: (st) => (st.shards || 0) >= 5, desc: "Bring 5 Star-Shards found drifting across the islands." },
  { id: "loom", name: "Cloud Loom Bell", island: "loom", x: 54, y: 14, who: "loomis", need: "3 Sky Fish", check: (st) => (st.caught || 0) >= 3, desc: "Catch 3 Sky Fish from any island's cloud-edge." },
  { id: "conservatory", name: "Conservatory Bell", island: "conservatory", x: 80, y: 22, who: "astrid", need: "3 Constellations", check: (st) => Object.keys(st.stars || {}).length >= 3, desc: "Chart 3 constellations at Astrid's Telescope." },
  { id: "spire", name: "Amber Spire Bell", island: "spire", x: 68, y: 46, who: "zephyr", need: "Spire Chime Trial", check: (st) => !!st.chimeWon, desc: "Complete Zephyr's Wind-Chime Trial at the Amber Spire." },
  { id: "sanctum", name: "Sanctum Bell", island: "aerolith", x: 29, y: 50, who: "gale", need: "12 Star-Shards", check: (st) => (st.shards || 0) >= 12, desc: "Gather 12 Star-Shards across the archipelago." },
  { id: "aurora_bell", name: "Aurora Bell", island: "terrace", x: 53, y: 50, who: "lyra_sky", need: "5 Constellations", check: (st) => Object.keys(st.stars || {}).length >= 5, desc: "Chart 5 constellations at Astrid's Telescope." },
  { id: "kiteyard", name: "Kite Yard Bell", island: "kiteyard", x: 26, y: 11, who: "sela", need: "Paper Kitefish", check: (st) => !!st.fish?.paperkite, desc: "Catch the Paper Kitefish where the kites dip, off the yard's east edge." },
  { id: "lanternloft", name: "Lantern Loft Bell", island: "lanternloft", x: 87, y: 7, who: "mirabel", need: "The Paper Lantern Charted", check: (st) => !!st.stars?.lantern, desc: "Chart The Paper Lantern constellation at Astrid's Telescope." },
];

export const SKY_FISH = [
  ["cloudminnow", "Cloud Minnow", 6, 0.44],
  ["cumulusray", "Cumulus Ray", 14, 0.30],
  ["starlighteel", "Starlight Eel", 18, 0.24],
  ["thundercarp", "Thunder Carp", 24, 0.18],
  ["cometkoi", "Comet Koi", 34, 0.12],
  ["auroradragonet", "Aurora Dragonet", 48, 0.08],
  ["windgull", "Nimbus Gullfish", 28, 0.16],
  ["zephyrmanta", "Zephyr Manta", 54, 0.06],
  ["gale_swallow", "Gale Swallowfish", 36, 0.14],
  ["nimbus_pike", "Nimbus Pike", 44, 0.10],
  ["astral_ray", "Astral Ray", 62, 0.06],
  ["celestial_whale", "Cloud Leviathan", 76, 0.04],
  ["paperkite", "Paper Kitefish", 40, 0.10],
  ["embermoth", "Ember Mothfish", 46, 0.08],
];

export const CONSTELLATIONS = [
  { id: "ninetail", name: "The Nine-Tail", pts: [[0, -56], [-18, -28], [16, -24], [-30, 8], [0, 12], [32, 6], [-20, 44], [20, 46]] },
  { id: "lantern", name: "The Paper Lantern", pts: [[0, -54], [-22, -26], [22, -26], [-26, 12], [26, 12], [0, 46]] },
  { id: "train", name: "The Sleeper Train", pts: [[-54, 10], [-28, 10], [-28, -16], [0, -16], [0, 10], [28, 10], [52, -10]] },
  { id: "glasscat", name: "The Glass Cat", pts: [[-24, -44], [-10, -22], [10, -22], [24, -44], [20, 10], [0, 38], [-20, 10]] },
  { id: "kettle", name: "The Tea Kettle", pts: [[-34, -8], [-16, -28], [16, -28], [34, -6], [22, 26], [-22, 26]] },
  { id: "compass", name: "The Sky Compass", pts: [[0, -56], [14, -14], [56, 0], [14, 14], [0, 56], [-14, 14], [-56, 0], [-14, -14]] },
  { id: "windmills", name: "The Cloud Mill", pts: [[0, -48], [14, -14], [48, 0], [14, 14], [0, 48], [-14, 14], [-48, 0], [-14, -14]] },
  { id: "foxcrown", name: "The Nine-Tail Crown", pts: [[-42, 20], [-28, -28], [0, -10], [28, -28], [42, 20]] },
  { id: "meridian", name: "The Meridian", pts: [[0, -54], [0, 54], [-36, 0], [36, 0], [-24, -24], [24, 24]] },
  { id: "hourglass", name: "The Hourglass", pts: [[-32, -44], [32, -44], [0, 0], [-32, 44], [32, 44]] },
];

export const SKY_GOODS = [
  { id: "hat:stargazer", kind: "hat", key: "stargazer", name: "Stargazer's veil", desc: "Woven from midnight silk and star-thread.", shards: 4, mon: 60 },
  { id: "hat:cloudwalker", kind: "hat", key: "cloudwalker", name: "Cloudwalker's plume", desc: "Light as updrafts.", shards: 6, mon: 90 },
  { id: "furn:cloudbed", kind: "furn", key: "cloudbed", name: "Cloud-down Futon", desc: "For your house downstairs.", shards: 3, mon: 45 },
  { id: "furn:starlamp", kind: "furn", key: "starlamp", name: "Starlight Lantern", desc: "Hums softly at night.", shards: 4, mon: 65 },
  { id: "furn:orrery", kind: "furn", key: "orrery", name: "Brass Orrery", desc: "Miniature spinning sky-chart.", shards: 8, mon: 120 },
  { id: "furn:starorrery", kind: "furn", key: "starorrery", name: "Star-Heart Orrery", desc: "Tracks all ten constellations.", shards: 10, mon: 150 },
  { id: "furn:handrail", kind: "furn", key: "handrail", name: "Brass Handrail", desc: "Polished gale-deck rail.", shards: 5, mon: 75 },
  { id: "tonic:updraft", kind: "tonic", key: "updraft", name: "Updraft Tonic", desc: "+15% speed in the Skyward Isles.", shards: 3, mon: 30 },
];

export function ensureSky(s) {
  const sk = (s.sky ||= {});
  sk.shards ??= 0;
  sk.totalShards ??= 0;
  sk.picked ??= {};
  sk.bells ??= {};
  sk.stars ??= {};
  sk.fish ??= {};
  sk.caught ??= 0;
  sk.chimeWon ??= 0;
  sk.aurora ??= 0;
  sk.tonic ??= 0;
  sk.day ??= "";
  const today = new Date().toDateString();
  if (sk.day !== today) {
    sk.day = today;
    sk.picked = {};
  }
  return sk;
}

export function buildSkyMap() {
  const g = new Uint8Array(SW * SH).fill(STILE.sky);
  const solid = new Uint8Array(SW * SH).fill(1);
  const put = (x, y, v) => {
    if (x >= 0 && y >= 0 && x < SW && y < SH) {
      g[y * SW + x] = v;
      solid[y * SW + x] = v === STILE.sky || v === STILE.tree ? 1 : 0;
    }
  };

  for (const isl of SKY_ISLANDS) {
    for (let y = isl.cy - isl.ry - 2; y <= isl.cy + isl.ry + 2; y++) {
      for (let x = isl.cx - isl.rx - 2; x <= isl.cx + isl.rx + 2; x++) {
        const a = Math.atan2(y - isl.cy, x - isl.cx);
        const wobble = 1 + Math.sin(a * 4 + isl.cx) * 0.08 + Math.cos(a * 3 + isl.cy) * 0.06;
        const d = ((x - isl.cx) / isl.rx) ** 2 + ((y - isl.cy) / isl.ry) ** 2;
        if (d <= wobble) {
          const isPlaza = ((x - isl.cx) / (isl.rx * 0.45)) ** 2 + ((y - isl.cy) / (isl.ry * 0.45)) ** 2 <= 1;
          const isAccent = !isPlaza && ((x * 7 + y * 13) % 11 === 0);
          put(x, y, isPlaza ? STILE.plaza : isAccent ? isl.accent : isl.base);
        }
      }
    }
  }

  const bridge = ([ax, ay], [bx, by]) => {
    let x = ax, y = ay;
    const stamp = (px, py) => {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const tx = px + dx, ty = py + dy;
        if (tx >= 0 && ty >= 0 && tx < SW && ty < SH && g[ty * SW + tx] === STILE.sky) {
          put(tx, ty, STILE.bridge);
        }
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
  bridge([17, 23], [14, 14]);
  bridge([74, 16], [78, 10]);

  // Dock pier on west edge of Galeharbor
  for (let x = SKY_DOCK[0] - 2; x <= SKY_DOCK[0] + 4; x++) {
    for (let y = SKY_DOCK[1] - 1; y <= SKY_DOCK[1] + 1; y++) {
      put(x, y, STILE.bridge);
    }
  }

  // Reserve buildings, NPCs, bells, dock, spawn
  const keep = new Uint8Array(SW * SH);
  const reserve = (cx, cy, r = 2) => {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x >= 0 && y >= 0 && x < SW && y < SH) keep[y * SW + x] = 1;
      }
    }
  };
  reserve(SKY_SPAWN[0], SKY_SPAWN[1], 3);
  reserve(SKY_DOCK[0], SKY_DOCK[1], 3);
  for (const n of SKY_NPCS) reserve(n.x, n.y, 2);
  for (const bell of SKY_BELLS) reserve(bell.x, bell.y, 2);
  for (const b of SKY_BUILDINGS) {
    for (let y = b.y - 1; y <= b.y + b.h + 1; y++) {
      for (let x = b.x - 1; x <= b.x + b.w; x++) {
        if (x >= 0 && y >= 0 && x < SW && y < SH) keep[y * SW + x] = 1;
      }
    }
    for (let y = b.y; y < b.y + b.h; y++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        solid[y * SW + x] = 1;
      }
    }
  }

  // Scatter decorative cloud-trees on island rims
  let seed = 4219;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const shards = [];
  for (let y = 2; y < SH - 2; y++) {
    for (let x = 2; x < SW - 2; x++) {
      const i = y * SW + x;
      const v = g[i];
      if (v === STILE.sky || v === STILE.bridge || v === STILE.plaza || keep[i] || solid[i]) continue;
      const q = rnd();
      if (q < 0.08 && !keep[i]) {
        put(x, y, STILE.tree);
      } else if (q > 0.91 && shards.length < 32 && !shards.some((s) => Math.hypot(s.x - x, s.y - y) < 5)) {
        shards.push({ id: shards.length, x, y });
      }
    }
  }

  return { g, solid, shards };
}
