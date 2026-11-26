// Canonical 63-species Sunscale Reptile House catalog, habitats, and exact Terrarium Pod drop probabilities.
import { species } from "./data.js";
import { today } from "../util.js";

export const REPTILE_TIERS = {
  c: { key: "c", label: "Common", color: "#8aa0b8", totalPct: "55%", perPct: "4.23%", note: "55% total (4.23% each)" },
  r: { key: "r", label: "Rare", color: "#3f8fe0", totalPct: "28%", perPct: "2.33%", note: "28% total (2.33% each)" },
  e: { key: "e", label: "Epic", color: "#9a5be0", totalPct: "12%", perPct: "0.63%", note: "12% total (0.63% each)" },
  l: { key: "l", label: "Legendary", color: "#f2a81d", totalPct: "4.845%", perPct: "0.323%", note: "4.845% total (0.323% each)" },
  chase: { key: "chase", label: "Chase", color: "#ff5cb8", totalPct: "0.155%", perPct: "0.005%–0.05%", note: "0.155% total (1 in 2,000 to 1 in 20,000)" },
};

export const HABITATS = {
  mesa: { id: "mesa", name: "Arid Basking Mesa", badge: "🪨", color: "#d9924c", desc: "Sun-warmed sandstone ledges, burrow sand, and succulent plots." },
  canopy: { id: "canopy", name: "Emerald Canopy Atrium", badge: "🌿", color: "#35b868", desc: "High bromeliad vines, misting branches, and cloud-forest moss." },
  lagoon: { id: "lagoon", name: "Sunlit Mangrove Lagoon", badge: "💧", color: "#38a8d8", desc: "Clear crystal shallows, cypress roots, and basking driftwood." },
  outback: { id: "outback", name: "Outback Varanid Pavilion", badge: "🦎", color: "#b8f23a", desc: "Red-rock terraces, hollow logs, and eucalyptus trunks." },
};

// [id, scientificName, regionNote, tierKey, chanceLabel, habitatId]
const ROWS = [
  // Common — 55% total (4.23% each, 13 species)
  ["leopardgecko", "Eublepharis macularius", "Rocky Deserts", "c", "4.23%", "mesa"],
  ["crestedgecko", "Correlophus ciliatus", "New Caledonia", "c", "4.23%", "canopy"],
  ["beardeddragon", "Pogona vitticeps", "Central Australia", "c", "4.23%", "mesa"],
  ["cornsnake", "Pantherophis guttatus", "Pine Woodlands", "c", "4.23%", "mesa"],
  ["ballpython", "Python regius", "West African Savanna", "c", "4.23%", "mesa"],
  ["hognose", "Heterodon nasicus", "Prairie Dunes", "c", "4.23%", "mesa"],
  ["sandboa", "Eryx colubrinus", "East African Sands", "c", "4.23%", "mesa"],
  ["greensnake", "Opheodrys aestivus", "Leafy Vines", "c", "4.23%", "canopy"],
  ["boxturtle", "Terrapene carolina", "Woodland Floor", "c", "4.23%", "lagoon"],
  ["redfoottortoise", "Chelonoidis carbonarius", "Neotropical Edges", "c", "4.23%", "canopy"],
  ["savannahmonitor", "Varanus exanthematicus", "Sub-Saharan Savanna", "c", "4.23%", "outback"],
  ["ackiemonitor", "Varanus acanthurus", "Australian Outback", "c", "4.23%", "outback"],
  ["fwc_normal", "Hydrodynastes gigas (Normal)", "Wetland Marshes", "c", "4.23%", "lagoon"],

  // Rare — 28% total (2.33% each, 12 species)
  ["bluetongueskink", "Tiliqua scincoides", "Australian Scrub", "r", "2.33%", "outback"],
  ["waterdragon", "Physignathus cocincinus", "Stream Overhangs", "r", "2.33%", "lagoon"],
  ["uromastyx", "Uromastyx aegyptia", "Sunbaked Gravel", "r", "2.33%", "mesa"],
  ["greeniguana", "Iguana iguana", "River Canopy", "r", "2.33%", "canopy"],
  ["tokaygecko", "Gekko gecko", "Tropical Groves", "r", "2.33%", "canopy"],
  ["shingleback", "Tiliqua rugosa", "Mallee Bushland", "r", "2.33%", "outback"],
  ["rainbowboa", "Epicrates cenchria", "Humid Forest", "r", "2.33%", "canopy"],
  ["sulcata", "Centrochelys sulcata", "Sahel Grasslands", "r", "2.33%", "mesa"],
  ["nilemonitor", "Varanus niloticus", "Riverbanks & Reeds", "r", "2.33%", "outback"],
  ["watermonitor", "Varanus salvator", "Mangroves & Lagoons", "r", "2.33%", "outback"],
  ["argusmonitor", "Varanus panoptes", "Northern Grasslands", "r", "2.33%", "outback"],
  ["fwc_hypo", "Hydrodynastes gigas (Hypo)", "Caramel Morph", "r", "2.33%", "lagoon"],

  // Epic — 12% total (0.63% each, 19 species)
  ["argentinetegu", "Salvator merianae", "Pampas & Woods", "e", "0.63%", "outback"],
  ["leachianus", "Rhacodactylus leachianus", "Grande Terre Trees", "e", "0.63%", "canopy"],
  ["pantherchameleon", "Furcifer pardalis", "Coastal Forests", "e", "0.63%", "canopy"],
  ["veiledchameleon", "Chamaeleo calyptratus", "Highland Plateaus", "e", "0.63%", "canopy"],
  ["frilledlizard", "Chlamydosaurus kingii", "Eucalyptus Savanna", "e", "0.63%", "outback"],
  ["rhinoiguana", "Cyclura cornuta", "Limestone Caves", "e", "0.63%", "mesa"],
  ["armadillolizard", "Ouroborus cataphractus", "Karoo Rock Crevices", "e", "0.63%", "mesa"],
  ["leaftailgecko", "Uroplatus phantasticus", "Cloud Leaf Litter", "e", "0.63%", "canopy"],
  ["gilamonster", "Heloderma suspectum", "Sonoran Burrows", "e", "0.63%", "mesa"],
  ["greentreepython", "Morelia viridis", "Rainforest Vines", "e", "0.63%", "canopy"],
  ["emeraldtreeboa", "Corallus batesii", "Amazon Canopy", "e", "0.63%", "canopy"],
  ["matamata", "Chelus fimbriata", "Still Blackwater", "e", "0.63%", "lagoon"],
  ["spectacledcaiman", "Caiman crocodilus", "Warm Wetlands", "e", "0.63%", "lagoon"],
  ["dwarfcaiman", "Paleosuchus palpebrosus", "Flooded Forests", "e", "0.63%", "lagoon"],
  ["lacemonitor", "Varanus varius", "Eucalyptus Canopy", "e", "0.63%", "outback"],
  ["perentie", "Varanus giganteus", "Red Desert Outcrops", "e", "0.63%", "outback"],
  ["treemonitor", "Varanus prasinus", "Emerald Rainforest", "e", "0.63%", "outback"],
  ["bluemonitor", "Varanus doreanus", "Papuan River Forests", "e", "0.63%", "outback"],
  ["fwc_superhypo", "Hydrodynastes gigas (Super Hypo)", "Honey-Apricot Morph", "e", "0.63%", "lagoon"],

  // Legendary — 4.845% total (0.323% each, 15 species)
  ["reticpython", "Malayopython reticulatus", "Island Jungles", "l", "0.323%", "canopy"],
  ["kingcobra", "Ophiophagus hannah", "Bamboo Highlands", "l", "0.323%", "canopy"],
  ["boomslang", "Dispholidus typus", "Acacia Crowns", "l", "0.323%", "canopy"],
  ["rhinoviper", "Bitis nasicornis", "Equatorial Streams", "l", "0.323%", "canopy"],
  ["spiderviper", "Pseudocerastes urarachnoides", "Gypsum Cliffs", "l", "0.323%", "mesa"],
  ["alligatorsnapper", "Macrochelys temminckii", "Deep Cypress Rivers", "l", "0.323%", "lagoon"],
  ["pignoseturtle", "Carettochelys insculpta", "Fly River Shallows", "l", "0.323%", "lagoon"],
  ["radiatedtortoise", "Astrochelys radiata", "Spiny Thickets", "l", "0.323%", "mesa"],
  ["galapagostortoise", "Chelonoidis niger", "Volcanic Highlands", "l", "0.323%", "mesa"],
  ["gharial", "Gavialis gangeticus", "Clear River Sandbars", "l", "0.323%", "lagoon"],
  ["chinesealligator", "Alligator sinensis", "Yangtze Reedbeds", "l", "0.323%", "lagoon"],
  ["tuatara", "Sphenodon punctatus", "Cook Strait Isles", "l", "0.323%", "mesa"],
  ["crocmonitor", "Varanus salvadorii", "High Papuan Canopy", "l", "0.323%", "outback"],
  ["komodo", "Varanus komodoensis", "Sunlit Volcanic Isles", "l", "0.323%", "outback"],
  ["fwc_truehypo", "Hydrodynastes gigas (True Hypo)", "Recessive Pastel Morph", "l", "0.323%", "lagoon"],

  // Chase — 0.155% total (4 species)
  ["blackdragon", "Varanus salvator (Melanistic Morph)", "Melanistic Water Morph", "chase", "0.05% (1 in 2,000)", "outback"],
  ["fwc_lavender", "Hydrodynastes gigas (Lavender)", "Chase Lavender Morph", "chase", "0.05% (1 in 2,000)", "lagoon"],
  ["bluepitviper", "Trimeresurus insularis", "Komodo Blue Pit Viper", "chase", "0.05% (1 in 2,000)", "canopy"],
  ["fwc_patternless", "Hydrodynastes gigas (Patternless Lavender)", "Ultra-Rare Morph", "chase", "0.005% (1 in 20,000)", "lagoon"],
];

export const REPTILE_LIST = ROWS.map(([id, sci, habit, tier, chance, zone]) => ({
  id,
  sci,
  habit,
  tier,
  chance,
  zone,
}));

export const REPTILE_META = Object.fromEntries(
  ROWS.map(([id, sci, habit, tier, chance, zone]) => [id, [sci, habit, tier, chance, zone]])
);

export const REPTILE_IDS = ROWS.map(([id]) => id);

export const COMMON_REPTILES = ROWS.filter((r) => r[3] === "c").map((r) => r[0]);
export const RARE_REPTILES = ROWS.filter((r) => r[3] === "r").map((r) => r[0]);
export const EPIC_REPTILES = ROWS.filter((r) => r[3] === "e").map((r) => r[0]);
export const LEGENDARY_REPTILES = ROWS.filter((r) => r[3] === "l").map((r) => r[0]);
export const CHASE_REPTILES = ROWS.filter((r) => r[3] === "chase").map((r) => r[0]);

export const DAILY_POD_CAP = 15;
export const DAILY_CRICKET_CAP = 3;

export function ensureSanctuary(s) {
  const sc = (s.sanctuary ||= { day: "", plays: 0, freeDay: "", adopts: 0 });
  if (sc.day !== today()) {
    sc.day = today();
    sc.plays = 0;
    sc.adopts = 0;
  }
  return sc;
}

export function rollReptileId(u = Math.random() * 100) {
  if (u < 55) {
    const idx = Math.min(COMMON_REPTILES.length - 1, Math.floor((u / 55) * COMMON_REPTILES.length));
    return { id: COMMON_REPTILES[idx], tier: "c" };
  }
  if (u < 83) {
    const idx = Math.min(RARE_REPTILES.length - 1, Math.floor(((u - 55) / 28) * RARE_REPTILES.length));
    return { id: RARE_REPTILES[idx], tier: "r" };
  }
  if (u < 95) {
    const idx = Math.min(EPIC_REPTILES.length - 1, Math.floor(((u - 83) / 12) * EPIC_REPTILES.length));
    return { id: EPIC_REPTILES[idx], tier: "e" };
  }
  if (u < 99.845) {
    const idx = Math.min(LEGENDARY_REPTILES.length - 1, Math.floor(((u - 95) / 4.845) * LEGENDARY_REPTILES.length));
    return { id: LEGENDARY_REPTILES[idx], tier: "l" };
  }
  if (u < 99.895) return { id: "blackdragon", tier: "chase" };
  if (u < 99.945) return { id: "fwc_lavender", tier: "chase" };
  if (u < 99.995) return { id: "bluepitviper", tier: "chase" };
  return { id: "fwc_patternless", tier: "chase" };
}

export function rollReptilePod(X) {
  const s = X.xs();
  const { id, tier } = rollReptileId();
  const sp = species(id);
  const meta = REPTILE_META[id];
  if (s.pets[id]) {
    s.pets[id].xp = (s.pets[id].xp || 0) + 60;
    s.pets[id].joy = 100;
    X.save();
    return { dupe: true, id, sp, tier, meta };
  }
  s.pets[id] = {
    sp: id,
    name: sp[1],
    xp: 0,
    hunger: 92,
    joy: 96,
    at: Date.now(),
    born: today(),
  };
  if (!s.active) s.active = id;
  X.save();
  return { dupe: false, id, sp, tier, meta };
}

const FWC_SIG = {
  kind: "hood",
  tag: "Hood Flare",
  btn: "Flare Hood!",
  desc: "Spreads its neck ribs horizontally into a wide, flat Hydrodynastes cobra hood!",
};
const BTS_SIG = {
  kind: "bluetongue",
  tag: "Blue Tongue Flash",
  btn: "Flash Blue Tongue!",
  desc: "Gapes wide and flashes a broad ultraviolet-cobalt warning tongue!",
};
const CHAM_SIG = {
  kind: "chromashift",
  tag: "Mood Colour Shift",
  btn: "Shift Mood Colours!",
  desc: "Shifts chromatophore pigments across Calm, Fired-Up Love, Sleepy Pastel & Stressed Dark!",
};

export const SIGNATURE_BEHAVIOURS = {
  hognose: {
    kind: "playdead",
    tag: "Plays Dead",
    btn: "Startle (Play Dead!)",
    desc: "Rolls belly-up with mouth agape and forked tongue hanging limp when startled!",
  },
  fwc_normal: FWC_SIG,
  fwc_hypo: FWC_SIG,
  fwc_superhypo: FWC_SIG,
  fwc_truehypo: FWC_SIG,
  fwc_lavender: FWC_SIG,
  fwc_patternless: FWC_SIG,
  frilledlizard: {
    kind: "frillrun",
    tag: "Frill & Bipedal Run",
    btn: "Pop Frill & Run!",
    desc: "Snaps open its pleated sunburst collar and bolts upright on its two hind legs!",
  },
  bluetongueskink: BTS_SIG,
  shingleback: BTS_SIG,
  armadillolizard: {
    kind: "tailring",
    tag: "Tail-Bite Ring",
    btn: "Bite Tail & Roll!",
    desc: "Clamps its spiny tail in its jaws to form an armored ouroboros wheel and rolls!",
  },
  leaftailgecko: {
    kind: "leafcamo",
    tag: "Leaf Camouflage",
    btn: "Blend into Leaves!",
    desc: "Vanishes into veined dead autumn foliage until you spot its slit eye!",
  },
  alligatorsnapper: {
    kind: "wormlure",
    tag: "Worm-Lure Tongue",
    btn: "Wiggle Worm Lure!",
    desc: "Rests motionless with hooked beak wide open, wriggling its pink worm-shaped tongue lure!",
  },
  matamata: {
    kind: "suctiongulp",
    tag: "Suction-Gulp",
    btn: "Suction-Gulp Feed!",
    desc: "Drops its fringed throat like a bellows to vacuum-gulp water and prey in milliseconds!",
  },
  pantherchameleon: CHAM_SIG,
  veiledchameleon: CHAM_SIG,
};

export const BEHAVIOUR_SHOWCASE = [
  "hognose",
  "fwc_normal",
  "frilledlizard",
  "bluetongueskink",
  "armadillolizard",
  "leaftailgecko",
  "alligatorsnapper",
  "matamata",
  "pantherchameleon",
];
