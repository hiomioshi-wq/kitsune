// Kitsune World 2 (1280x960) map generator, tile sprites, and biome decorations.
import { W2, H2, T2, W2_SPAWN, W2_TILES as t, W2_REGIONS, W2_BUILDINGS, W2_NPCS, W2_BELLS, w2Door, w2NpcPos } from "./world2data.js";

const rng = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

export const W2_COLORS = {
  [t.meadow]: "#63a86b", [t.path]: "#d4b584", [t.water]: "#3484ba", [t.sand]: "#ebd39c",
  [t.tree]: "#52945a", [t.flower]: "#68ad70", [t.snow]: "#eaf3fa", [t.ice]: "#bfe4f7",
  [t.bridge]: "#a06d3b", [t.plaza]: "#c2bed2", [t.pine]: "#dce8f2", [t.marsh]: "#4e7054",
  [t.boardwalk]: "#8a623c", [t.steppe]: "#c9b35c", [t.canyon]: "#c9854c", [t.brass]: "#b88e42",
  [t.coral]: "#f2b8a8", [t.ash]: "#56505e", [t.lava]: "#ea5e28", [t.sakura]: "#7eb87a",
  [t.petal]: "#f4b2cc", [t.crystal]: "#d4e6f8", [t.mesa]: "#b36838", [t.bamboo]: "#78b86a",
  [t.ruin]: "#b4aa96",
};

export function buildWorld2Map() {
  const g = new Uint8Array(W2 * H2).fill(t.meadow);
  const solid = new Uint8Array(W2 * H2);
  const r = rng(20270);
  const at = (x, y) => (x < 0 || y < 0 || x >= W2 || y >= H2 ? t.water : g[y * W2 + x]);
  const put = (x, y, v) => { if (x >= 0 && y >= 0 && x < W2 && y < H2) g[y * W2 + x] = v; };
  const blob = (cx, cy, rx, ry, v, keep) => {
    for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++) {
      for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
        if (x < 1 || y < 1 || x >= W2 - 1 || y >= H2 - 1) continue;
        const a = Math.atan2(y - cy, x - cx);
        const w = 1 + Math.sin(a * 5 + cx) * 0.08 + Math.cos(a * 3 + cy) * 0.07;
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= w && (!keep || keep(at(x, y)))) put(x, y, v);
      }
    }
  };

  for (let y = 0; y < H2; y++) {
    for (let x = 0; x < W2; x++) {
      const e = Math.min(x, y, W2 - 1 - x, H2 - 1 - y);
      const n = 12 + Math.sin(x / 10) * 2.5 + Math.cos(y / 9) * 2.5;
      if (e < n) g[y * W2 + x] = t.water;
    }
  }

  // Ring 1 (+160, +120)
  blob(700, 520, 38, 28, t.meadow);
  blob(800, 498, 42, 24, t.snow);
  blob(800, 500, 22, 10, t.ice, (v) => v === t.snow);
  blob(784, 504, 8, 5, t.water, (v) => v === t.ice || v === t.snow);
  blob(900, 520, 38, 28, t.steppe);
  blob(680, 600, 36, 30, t.marsh);
  for (const [wx, wy, rx, ry] of [[666, 594, 7, 5], [692, 608, 8, 5], [678, 616, 6, 4]]) blob(wx, wy, rx, ry, t.water, (v) => v === t.marsh);
  blob(920, 600, 36, 30, t.canyon);
  blob(920, 600, 16, 12, t.brass, (v) => v === t.canyon);
  blob(700, 680, 36, 28, t.sand);
  blob(700, 688, 18, 11, t.water, (v) => v === t.sand);
  blob(700, 676, 14, 8, t.coral, (v) => v === t.sand);
  blob(800, 696, 40, 26, t.ash);
  blob(780, 702, 8, 4, t.lava, (v) => v === t.ash);
  blob(820, 702, 9, 4, t.lava, (v) => v === t.ash);
  blob(900, 680, 34, 28, t.sakura);
  blob(900, 680, 14, 12, t.petal, (v) => v === t.sakura);
  blob(886, 692, 6, 4, t.water, (v) => v === t.sakura);
  blob(744, 552, 26, 22, t.snow);
  blob(744, 552, 16, 12, t.crystal, (v) => v === t.snow);
  blob(856, 646, 28, 22, t.canyon);
  blob(856, 646, 15, 10, t.sand, (v) => v === t.canyon);

  // Ring 2
  blob(616, 466, 38, 28, t.snow);
  blob(604, 474, 12, 8, t.water, (v) => v === t.snow);
  blob(624, 460, 14, 8, t.ice, (v) => v === t.snow);
  blob(708, 458, 34, 24, t.bamboo);
  blob(896, 458, 36, 24, t.ruin);
  blob(896, 458, 18, 12, t.crystal, (v) => v === t.ruin);
  blob(986, 472, 34, 28, t.ash);
  blob(998, 480, 9, 5, t.water, (v) => v === t.ash);
  blob(606, 556, 32, 30, t.water);
  blob(606, 556, 20, 18, t.marsh, (v) => v === t.water);
  blob(612, 648, 34, 28, t.crystal);
  blob(618, 732, 36, 26, t.water);
  blob(618, 732, 22, 16, t.ruin, (v) => v === t.water);
  blob(708, 744, 38, 24, t.sand);
  blob(708, 744, 14, 8, t.canyon, (v) => v === t.sand);
  blob(806, 750, 36, 22, t.ash);
  blob(806, 758, 16, 6, t.lava, (v) => v === t.ash);
  blob(904, 742, 36, 26, t.water);
  blob(904, 742, 22, 16, t.sakura, (v) => v === t.water);
  blob(904, 742, 10, 8, t.petal, (v) => v === t.sakura);
  blob(988, 556, 32, 30, t.steppe);
  blob(984, 640, 24, 26, t.sand);
  blob(984, 640, 15, 16, t.meadow, (v) => v === t.sand);
  for (let y = 690; y < 770; y++) for (let x = 952; x < 962; x++) put(x, y, t.water);
  blob(996, 732, 28, 28, t.ruin);
  blob(996, 732, 18, 18, t.crystal, (v) => v === t.ruin);

  // Ring 3
  blob(504, 382, 40, 30, t.ash);
  blob(504, 382, 22, 16, t.crystal, (v) => v === t.ash);
  blob(640, 374, 40, 26, t.water);
  blob(640, 374, 26, 16, t.ice, (v) => v === t.water);
  blob(800, 370, 42, 24, t.snow);
  blob(960, 374, 40, 26, t.ruin);
  blob(960, 374, 20, 12, t.brass, (v) => v === t.ruin);
  blob(1096, 386, 38, 32, t.water);
  blob(1096, 386, 20, 16, t.ruin, (v) => v === t.water);
  blob(492, 598, 36, 36, t.marsh);
  blob(1108, 598, 36, 36, t.water);
  blob(1108, 598, 20, 20, t.ice, (v) => v === t.water);
  blob(504, 816, 40, 30, t.water);
  blob(504, 816, 24, 18, t.coral, (v) => v === t.water);
  blob(650, 826, 42, 26, t.sand);
  blob(800, 830, 40, 24, t.ash);
  blob(800, 838, 18, 8, t.lava, (v) => v === t.ash);
  blob(950, 826, 42, 26, t.sakura);
  blob(950, 826, 22, 14, t.petal, (v) => v === t.sakura);
  for (let y = 770; y < 862; y++) for (let x = 1042; x < 1054; x++) put(x, y, t.water);
  blob(1096, 816, 34, 32, t.ruin);
  blob(1096, 816, 22, 20, t.crystal, (v) => v === t.ruin);

  // Ring 4
  blob(384, 292, 42, 32, t.water);
  blob(384, 292, 26, 20, t.crystal, (v) => v === t.water);
  blob(580, 284, 44, 26, t.snow);
  blob(580, 284, 22, 14, t.ice, (v) => v === t.snow);
  blob(800, 278, 44, 24, t.snow);
  blob(800, 278, 20, 12, t.crystal, (v) => v === t.snow);
  blob(1020, 284, 44, 26, t.ruin);
  blob(1020, 284, 22, 14, t.petal, (v) => v === t.ruin);
  blob(1216, 296, 40, 32, t.water);
  blob(1216, 296, 24, 18, t.ash, (v) => v === t.water);
  blob(372, 600, 38, 40, t.marsh);
  blob(372, 600, 20, 22, t.bamboo, (v) => v === t.marsh);
  blob(1228, 600, 38, 40, t.sand);
  blob(1228, 600, 20, 22, t.ice, (v) => v === t.sand);
  blob(384, 908, 42, 32, t.water);
  blob(384, 908, 24, 18, t.coral, (v) => v === t.water);
  blob(600, 916, 44, 26, t.sand);
  blob(600, 916, 20, 12, t.canyon, (v) => v === t.sand);
  blob(800, 920, 44, 24, t.ash);
  blob(800, 928, 20, 8, t.lava, (v) => v === t.ash);
  blob(1000, 916, 44, 26, t.sakura);
  blob(1000, 916, 24, 14, t.petal, (v) => v === t.sakura);
  for (let y = 860; y < 954; y++) for (let x = 1158; x < 1170; x++) put(x, y, t.water);
  blob(1216, 908, 36, 32, t.ruin);
  blob(1216, 908, 22, 20, t.crystal, (v) => v === t.ruin);

  // Ring 5: Sovereign Outer Halo
  blob(232, 180, 44, 34, t.water);
  blob(232, 180, 28, 22, t.crystal, (v) => v === t.water);
  blob(500, 168, 46, 28, t.snow);
  blob(500, 168, 24, 14, t.ice, (v) => v === t.snow);
  blob(800, 164, 48, 26, t.snow);
  blob(800, 164, 22, 14, t.crystal, (v) => v === t.snow);
  blob(1100, 168, 46, 28, t.ruin);
  blob(1100, 168, 22, 14, t.petal, (v) => v === t.ruin);
  blob(1368, 180, 44, 34, t.water);
  blob(1368, 180, 26, 20, t.ash, (v) => v === t.water);
  blob(216, 600, 40, 44, t.bamboo);
  blob(216, 600, 20, 22, t.meadow, (v) => v === t.bamboo);
  blob(1384, 600, 40, 44, t.sand);
  blob(1384, 600, 22, 22, t.crystal, (v) => v === t.sand);
  blob(232, 1020, 44, 34, t.water);
  blob(232, 1020, 26, 20, t.coral, (v) => v === t.water);
  blob(510, 1032, 46, 28, t.sand);
  blob(510, 1032, 22, 14, t.canyon, (v) => v === t.sand);
  blob(800, 1036, 46, 26, t.ash);
  blob(800, 1044, 20, 8, t.lava, (v) => v === t.ash);
  blob(1090, 1032, 46, 28, t.water);
  blob(1090, 1032, 26, 16, t.sakura, (v) => v === t.water);
  for (let y = 960; y < 1070; y++) for (let x = 1302; x < 1316; x++) put(x, y, t.water);
  blob(1368, 1020, 38, 34, t.ruin);
  blob(1368, 1020, 24, 22, t.crystal, (v) => v === t.ruin);

  // Ring 6: Infinite Horizon Biomes
  blob(80, 68, 46, 36, t.water);
  blob(80, 68, 28, 22, t.crystal, (v) => v === t.water);
  blob(420, 52, 48, 30, t.snow);
  blob(420, 52, 24, 15, t.ice, (v) => v === t.snow);
  blob(800, 46, 50, 28, t.snow);
  blob(800, 46, 24, 14, t.crystal, (v) => v === t.snow);
  blob(1180, 52, 48, 30, t.ruin);
  blob(1180, 52, 24, 14, t.petal, (v) => v === t.ruin);
  blob(1520, 68, 46, 36, t.water);
  blob(1520, 68, 26, 20, t.ash, (v) => v === t.water);
  blob(62, 600, 42, 46, t.marsh);
  blob(62, 600, 22, 24, t.bamboo, (v) => v === t.marsh);
  blob(1538, 600, 42, 46, t.sand);
  blob(1538, 600, 22, 24, t.crystal, (v) => v === t.sand);
  blob(80, 1132, 46, 36, t.water);
  blob(80, 1132, 26, 20, t.coral, (v) => v === t.water);
  blob(430, 1146, 48, 30, t.sand);
  blob(430, 1146, 22, 14, t.canyon, (v) => v === t.sand);
  blob(800, 1152, 48, 28, t.ash);
  blob(800, 1160, 20, 8, t.lava, (v) => v === t.ash);
  blob(1170, 1146, 48, 30, t.sakura);
  blob(1170, 1146, 24, 14, t.petal, (v) => v === t.sakura);
  for (let y = 1070; y < 1190; y++) for (let x = 1450; x < 1466; x++) put(x, y, t.water);
  blob(1520, 1132, 40, 36, t.ruin);
  blob(1520, 1132, 24, 22, t.crystal, (v) => v === t.ruin);

  // Hub plazas
  for (const k of Object.keys(W2_REGIONS)) {
    const [, hx, hy] = W2_REGIONS[k];
    blob(hx, hy, 8, 6, ["marsh", "kelp2", "sunken2", "mossveil", "dreamfen"].includes(k) ? t.boardwalk : t.plaza);
  }
  blob(800, 600, 16, 12, t.plaza);

  const isRoad = (v) => [t.path, t.plaza, t.bridge, t.boardwalk, t.brass].includes(v);
  const lay = (x, y, forceMarsh) => {
    if (x < 1 || y < 1 || x >= W2 - 1 || y >= H2 - 1) return;
    const i = y * W2 + x;
    const q = g[i];
    if (q === t.water || q === t.lava) g[i] = t.bridge;
    else if (q === t.marsh || forceMarsh) g[i] = t.boardwalk;
    else if (![t.plaza, t.bridge, t.boardwalk].includes(q)) g[i] = t.path;
  };
  const road = ([ax, ay], [bx, by], forceMarsh = false) => {
    let x = ax, y = ay;
    const w = (p, q) => {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) lay(p + dx, q + dy, forceMarsh);
    };
    while (x !== bx) { w(x, y); x += Math.sign(bx - x); }
    while (y !== by) { w(x, y); y += Math.sign(by - y); }
    w(x, y);
  };
  const H_ = (k) => [W2_REGIONS[k][1], W2_REGIONS[k][2]];

  // Rings 1..4 roads
  road(H_("crossing"), H_("glacier")); road(H_("crossing"), H_("ember")); road(H_("crossing"), H_("marsh"), true);
  road(H_("crossing"), H_("gorge")); road(H_("crossing"), H_("citadel")); road(H_("citadel"), H_("pines"));
  road(H_("pines"), H_("glacier")); road(H_("glacier"), H_("steppe")); road(H_("steppe"), H_("gorge"));
  road(H_("marsh"), H_("lagoon")); road(H_("lagoon"), H_("ember")); road(H_("crossing"), H_("canyon"));
  road(H_("canyon"), H_("orchard")); road(H_("ember"), H_("orchard")); road(H_("gorge"), H_("orchard"));
  road(H_("gorge"), H_("spire")); road(H_("pines"), H_("aurora")); road(H_("aurora"), H_("bamboo2"));
  road(H_("bamboo2"), H_("glacier")); road(H_("glacier"), H_("skylands")); road(H_("skylands"), H_("steppe"));
  road(H_("skylands"), H_("obsidian2")); road(H_("obsidian2"), H_("astralis")); road(H_("astralis"), H_("gorge"));
  road(H_("astralis"), H_("spire")); road(H_("aurora"), H_("kelp2"), true); road(H_("kelp2"), H_("marsh"), true);
  road(H_("kelp2"), H_("crystal2")); road(H_("crystal2"), H_("marsh"), true); road(H_("crystal2"), H_("sunken2"), true);
  road(H_("sunken2"), H_("lagoon")); road(H_("sunken2"), H_("dunes2")); road(H_("dunes2"), H_("lagoon"));
  road(H_("dunes2"), H_("caldera2")); road(H_("ember"), H_("caldera2")); road(H_("caldera2"), H_("lotus"));
  road(H_("orchard"), H_("lotus")); road(H_("lotus"), H_("crown")); road(H_("spire"), H_("crown"));
  road(H_("aurora"), H_("stargrave")); road(H_("stargrave"), H_("frostarch")); road(H_("frostarch"), H_("cometpeak"));
  road(H_("cometpeak"), H_("bamboo2")); road(H_("cometpeak"), H_("stormrim")); road(H_("stormrim"), H_("skylands"));
  road(H_("stormrim"), H_("abyssal")); road(H_("abyssal"), H_("obsidian2")); road(H_("abyssal"), H_("glassbay"));
  road(H_("glassbay"), H_("astralis")); road(H_("glassbay"), H_("spire")); road(H_("glassbay"), H_("elysium"));
  road(H_("crown"), H_("elysium")); road(H_("stargrave"), H_("mossveil"), true); road(H_("mossveil"), H_("kelp2"), true);
  road(H_("mossveil"), H_("crystal2")); road(H_("mossveil"), H_("coralspire")); road(H_("coralspire"), H_("sunken2"));
  road(H_("coralspire"), H_("mirage")); road(H_("mirage"), H_("dunes2")); road(H_("mirage"), H_("magmacore"));
  road(H_("magmacore"), H_("caldera2")); road(H_("magmacore"), H_("sakuraend")); road(H_("sakuraend"), H_("lotus"));
  road(H_("sakuraend"), H_("elysium")); road(H_("stargrave"), H_("celestial")); road(H_("celestial"), H_("voidfrost"));
  road(H_("voidfrost"), H_("frostarch")); road(H_("voidfrost"), H_("zenith")); road(H_("zenith"), H_("cometpeak"));
  road(H_("zenith"), H_("nebula")); road(H_("nebula"), H_("stormrim")); road(H_("nebula"), H_("starabyss"));
  road(H_("starabyss"), H_("abyssal")); road(H_("starabyss"), H_("sunmirror")); road(H_("sunmirror"), H_("glassbay"));
  road(H_("sunmirror"), H_("astralend")); road(H_("elysium"), H_("astralend")); road(H_("celestial"), H_("dreamfen"), true);
  road(H_("dreamfen"), H_("mossveil"), true); road(H_("dreamfen"), H_("pearlrim"), true); road(H_("pearlrim"), H_("coralspire"));
  road(H_("pearlrim"), H_("golddune")); road(H_("golddune"), H_("mirage")); road(H_("golddune"), H_("inferno"));
  road(H_("inferno"), H_("magmacore")); road(H_("inferno"), H_("blossomend")); road(H_("blossomend"), H_("sakuraend"));
  road(H_("blossomend"), H_("astralend"));

  // Ring 5 Outer Halo roads
  road(H_("celestial"), H_("starocean"));
  road(H_("starocean"), H_("glacialrim"));
  road(H_("glacialrim"), H_("voidfrost"));
  road(H_("glacialrim"), H_("aurorapeak"));
  road(H_("aurorapeak"), H_("zenith"));
  road(H_("aurorapeak"), H_("meteorsea"));
  road(H_("meteorsea"), H_("nebula"));
  road(H_("meteorsea"), H_("voidtrench"));
  road(H_("voidtrench"), H_("starabyss"));
  road(H_("voidtrench"), H_("solareast"));
  road(H_("solareast"), H_("sunmirror"));
  road(H_("solareast"), H_("omega"));
  road(H_("astralend"), H_("omega"));
  road(H_("starocean"), H_("jadewest"));
  road(H_("jadewest"), H_("dreamfen"), true);
  road(H_("jadewest"), H_("coralend"));
  road(H_("coralend"), H_("pearlrim"));
  road(H_("coralend"), H_("ambersea"));
  road(H_("ambersea"), H_("golddune"));
  road(H_("ambersea"), H_("pyrecore"));
  road(H_("pyrecore"), H_("inferno"));
  road(H_("pyrecore"), H_("lotusend"));
  road(H_("lotusend"), H_("blossomend"));
  road(H_("lotusend"), H_("omega"));

  // Ring 6 Infinite Horizon roads
  road(H_("starocean"), H_("aetherbay"));
  road(H_("aetherbay"), H_("glacierend"));
  road(H_("glacierend"), H_("glacialrim"));
  road(H_("glacierend"), H_("polarzenith"));
  road(H_("polarzenith"), H_("aurorapeak"));
  road(H_("polarzenith"), H_("cometsea"));
  road(H_("cometsea"), H_("meteorsea"));
  road(H_("cometsea"), H_("voidedge"));
  road(H_("voidedge"), H_("voidtrench"));
  road(H_("voidedge"), H_("dawneast"));
  road(H_("dawneast"), H_("solareast"));
  road(H_("dawneast"), H_("infinity"));
  road(H_("omega"), H_("infinity"));
  road(H_("aetherbay"), H_("mistwest"), true);
  road(H_("mistwest"), H_("jadewest"), true);
  road(H_("mistwest"), H_("sapphireend"));
  road(H_("sapphireend"), H_("coralend"));
  road(H_("sapphireend"), H_("dunesend"));
  road(H_("dunesend"), H_("ambersea"));
  road(H_("dunesend"), H_("coreend"));
  road(H_("coreend"), H_("pyrecore"));
  road(H_("coreend"), H_("petalend"));
  road(H_("petalend"), H_("lotusend"));
  road(H_("petalend"), H_("infinity"));

  for (const b of W2_BUILDINGS) {
    const d = w2Door(b);
    let bestK = "crossing", bd = 1e9;
    for (const k of Object.keys(W2_REGIONS)) {
      const [hx, hy] = H_(k);
      const q = (d[0] - hx) ** 2 + (d[1] - hy) ** 2;
      if (q < bd) { bd = q; bestK = k; }
    }
    road(d, H_(bestK), ["marsh", "kelp2", "sunken2", "mossveil", "dreamfen"].includes(bestK));
  }

  const reserve = new Uint8Array(W2 * H2);
  const hold = (x, y, n) => {
    for (let j = y - n; j <= y + n; j++) {
      for (let i = x - n; i <= x + n; i++) {
        if (i >= 0 && j >= 0 && i < W2 && j < H2) reserve[j * W2 + i] = 1;
      }
    }
  };
  for (const b of W2_BUILDINGS) {
    for (let y = b[2] - 2; y < b[2] + b[4] + 3; y++) {
      for (let x = b[1] - 2; x < b[1] + b[3] + 2; x++) hold(x, y, 0);
    }
  }
  for (const n of W2_NPCS) {
    const [x, y] = w2NpcPos(n);
    hold(x, y, 2);
    if (at(x, y) === t.water || at(x, y) === t.lava) put(x, y, t.plaza);
  }
  for (const l of W2_BELLS) {
    hold(l.x, l.y, 2);
    if (at(l.x, l.y) === t.water || at(l.x, l.y) === t.lava) put(l.x, l.y, t.plaza);
  }
  hold(W2_SPAWN[0], W2_SPAWN[1], 7);
  for (let y = 600; y <= 605; y++) for (let x = 791; x <= 798; x++) { put(x, y, t.meadow); hold(x, y, 1); }

  for (let y = 2; y < H2 - 2; y++) {
    for (let x = 2; x < W2 - 2; x++) {
      if (reserve[y * W2 + x]) continue;
      const v = at(x, y);
      if (isRoad(v) || [t.water, t.lava, t.ice, t.brass].includes(v)) continue;
      let near = false;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (isRoad(at(x + i, y + j))) near = true;
      if (near) continue;
      const q = r();
      const belt = 0.14 + (Math.sin(x / 10 + y / 12) + Math.cos(y / 8 - x / 15)) * 0.08;
      if (v === t.meadow) {
        if (q < belt) put(x, y, t.tree);
        else if (q > 0.87) put(x, y, t.flower);
      } else if (v === t.snow && q < belt * 0.85) {
        put(x, y, t.pine);
      } else if (v === t.sakura && q < belt * 1.05) {
        put(x, y, t.tree);
      } else if (v === t.bamboo && q < 0.16) {
        put(x, y, t.tree);
      } else if ((v === t.canyon || v === t.crystal || v === t.ruin) && q < 0.045) {
        put(x, y, t.mesa);
      }
    }
  }

  for (let i = 0; i < W2 * H2; i++) {
    solid[i] = [t.water, t.lava, t.tree, t.pine, t.mesa].includes(g[i]) ? 1 : 0;
  }
  for (const b of W2_BUILDINGS) {
    for (let y = b[2]; y < b[2] + b[4]; y++) {
      for (let x = b[1]; x < b[1] + b[3]; x++) solid[y * W2 + x] = 1;
    }
  }

  const reach = new Uint8Array(W2 * H2);
  const queue = [W2_SPAWN[1] * W2 + W2_SPAWN[0]];
  reach[queue[0]] = 1;
  for (let h = 0; h < queue.length; h++) {
    const i = queue[h], x = i % W2, y = (i - x) / W2;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy, k = Y * W2 + X;
      if (X >= 0 && Y >= 0 && X < W2 && Y < H2 && !solid[k] && !reach[k]) {
        reach[k] = 1;
        queue.push(k);
      }
    }
  }

  // Place 3,200 Star-Motes and 400 Relics across all 60 provinces
  const open = queue.filter((i) => !isRoad(g[i]));
  const motes = [];
  let guard = 0;
  while (motes.length < 4500 && guard++ < 420000) {
    const i = open[Math.floor(r() * open.length)];
    const mx = i % W2, my = Math.floor(i / W2);
    if (!motes.some((m) => Math.abs(m.x - mx) + Math.abs(m.y - my) < 6)) {
      motes.push({ id: i, x: mx, y: my });
    }
  }
  const relics = [];
  guard = 0;
  while (relics.length < 600 && guard++ < 150000) {
    const i = open[Math.floor(r() * open.length)];
    const rx = i % W2, ry = Math.floor(i / W2);
    if (!relics.some((m) => Math.abs(m.x - rx) + Math.abs(m.y - ry) < 12)) {
      relics.push({ id: i, x: rx, y: ry });
    }
  }

  return { g, solid, reach, motes, relics, open, at };
}

export function w2TileSprites() {
  const S = {};
  for (const [k, col] of Object.entries(W2_COLORS)) {
    const id = +k;
    S[k] = [0, 1, 2].map((v) => {
      const c = document.createElement("canvas");
      c.width = c.height = T2;
      const g = c.getContext("2d");
      const r = rng(id * 41 + v * 11 + 5);
      g.fillStyle = col;
      g.fillRect(0, 0, T2, T2);
      for (let i = 0; i < 9; i++) {
        g.fillStyle = shade(col, r() > 0.5 ? 1.07 : 0.92);
        g.fillRect(Math.floor(r() * 30), Math.floor(r() * 30), 2 + Math.floor(r() * 3), 2);
      }
      if (id === t.flower || id === t.petal) {
        for (let i = 0; i < 4; i++) {
          const fx = 5 + r() * 22, fy = 5 + r() * 22;
          g.fillStyle = id === t.petal ? "#ffe4f0" : ["#ffe066", "#ff8fb1", "#fff", "#a6d8ff"][i];
          g.fillRect(fx - 1, fy, 3, 2);
          g.fillRect(fx, fy - 1, 2, 3);
        }
      }
      if (id === t.plaza || id === t.ruin) {
        g.strokeStyle = id === t.ruin ? "#948a76" : "#a6a2b8";
        g.strokeRect(0.5, 0.5, 15, 15);
        g.strokeRect(16.5, 16.5, 15, 15);
      }
      if (id === t.bridge || id === t.boardwalk) {
        g.fillStyle = shade(col, 0.72);
        for (let y = 0; y < T2; y += 8) g.fillRect(0, y, T2, 2);
      }
      if (id === t.brass) {
        g.strokeStyle = "#7a5c22";
        g.lineWidth = 1.5;
        g.strokeRect(2, 2, 28, 28);
        g.beginPath();
        g.arc(16, 16, 6, 0, 7);
        g.stroke();
      }
      if (id === t.ice || id === t.crystal) {
        g.strokeStyle = "rgba(255,255,255,0.6)";
        g.beginPath();
        g.moveTo(4, 24);
        g.lineTo(14, 12);
        g.lineTo(26, 8);
        g.stroke();
      }
      return c;
    });
  }
  S.wave = [0, 1].map((f) => {
    const c = document.createElement("canvas");
    c.width = c.height = T2;
    const g = c.getContext("2d");
    g.fillStyle = "#3484ba";
    g.fillRect(0, 0, T2, T2);
    g.strokeStyle = "#8fd0ef";
    g.lineWidth = 2;
    for (const [x, y] of [[4 + f * 5, 9], [17 - f * 4, 24]]) {
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 4, y - 4, x + 9, y);
      g.stroke();
    }
    return c;
  });
  return S;
}

export function drawW2Mesa(g, x, y, isCrystal) {
  const px = x * T2, py = y * T2;
  if (isCrystal) {
    g.fillStyle = "#9ec8f2";
    g.beginPath();
    g.moveTo(px + 4, py + 30);
    g.lineTo(px + 12, py + 3);
    g.lineTo(px + 22, py + 8);
    g.lineTo(px + 29, py + 30);
    g.closePath();
    g.fill();
    g.strokeStyle = "#5a88b8";
    g.lineWidth = 1.5;
    g.stroke();
  } else {
    g.fillStyle = "#9a542c";
    g.beginPath();
    g.moveTo(px + 2, py + 31);
    g.lineTo(px + 8, py + 7);
    g.lineTo(px + 24, py + 7);
    g.lineTo(px + 30, py + 31);
    g.closePath();
    g.fill();
    g.fillStyle = "#c9854c";
    g.fillRect(px + 8, py + 5, 16, 5);
  }
}
