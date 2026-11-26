// Canonical 48-bird Dawn Aviary catalog: habitats, exact Nest Pod odds and signature behaviours.
import { species } from "./data.js";
import { today } from "../util.js";

export const BIRD_TIERS = {
  c: { key: "c", label: "Common", color: "#8aa0b8", pct: 55 },
  r: { key: "r", label: "Rare", color: "#3f8fe0", pct: 28 },
  e: { key: "e", label: "Epic", color: "#9a5be0", pct: 12 },
  l: { key: "l", label: "Legendary", color: "#f2a81d", pct: 4.8 },
  chase: { key: "chase", label: "Chase", color: "#ff5cb8", pct: 0.2 },
};

export const BIRD_HABITATS = {
  song: { id: "song", name: "Hedgerow Song Hall", badge: "🎵", color: "#e0a23a", desc: "Bramble perches, seed hoppers, and a window full of morning light." },
  raptor: { id: "raptor", name: "High Raptor Loft", badge: "🪶", color: "#c88a3a", desc: "Tall beams, wind baffles, and a broad ledge over the whole room." },
  water: { id: "water", name: "Reed & Shore Pool", badge: "💧", color: "#38a8d8", desc: "A shallow glass pool, river stones, and nodding reeds." },
  tropic: { id: "tropic", name: "Sun Canopy Court", badge: "🌴", color: "#3fae6a", desc: "Warm mist, curling vines, and ropes strung between the rafters." },
};

// [id, scientificName, regionNote, tierKey, habitatId]
const ROWS = [
  ["sparrow", "Passer domesticus", "Hedgerows & Windowsills", "c", "song"],
  ["bluetit", "Cyanistes caeruleus", "European Woodlands", "c", "song"],
  ["goldfinch", "Carduelis carduelis", "Thistle Meadows", "c", "song"],
  ["cardinal", "Cardinalis cardinalis", "North American Thickets", "c", "song"],
  ["bluejay", "Cyanocitta cristata", "Eastern Oak Forests", "c", "song"],
  ["mallard", "Anas platyrhynchos", "Pond Edges", "c", "water"],
  ["pigeon", "Columba livia", "Cliffs & Town Squares", "c", "song"],
  ["chickadee", "Poecile atricapillus", "Northern Mixed Woods", "c", "song"],
  ["budgie", "Melopsittacus undulatus", "Australian Grasslands", "c", "tropic"],
  ["cockatiel", "Nymphicus hollandicus", "Australian Inland", "c", "tropic"],
  ["zebrafinch", "Taeniopygia castanotis", "Dry Australian Scrub", "c", "song"],
  ["canary", "Serinus canaria domestica", "Atlantic Island Stock", "c", "song"],
  ["speckledstarling", "Sturnus vulgaris", "Rooftops & Wires", "c", "song"],
  ["chaffinch", "Fringilla coelebs", "Woodland Eaves", "c", "song"],

  ["barnowl", "Tyto alba", "Old Rafters & Barns", "r", "raptor"],
  ["kookaburra", "Dacelo novaeguineae", "Eucalyptus Woodland", "r", "tropic"],
  ["lovebird", "Agapornis roseicollis", "Namib Dry Country", "r", "tropic"],
  ["hummingbird", "Archilochus colubris", "Flowering Forest Edges", "r", "tropic"],
  ["kingfisher", "Alcedo atthis", "Clear Riverbanks", "r", "water"],
  ["woodpecker", "Dryocopus pileatus", "Mature Forest Snags", "r", "song"],
  ["mandarinduck", "Aix galericulata", "East Asian Wooded Rivers", "r", "water"],
  ["muteswan", "Cygnus olor", "Lakes & Slow Rivers", "r", "water"],
  ["hoopoe", "Upupa epops", "Sunny Orchards", "r", "song"],
  ["raven", "Corvus corax", "Crags & Old Forest", "r", "raptor"],
  ["amberkestrel", "Falco tinnunculus", "Open Verges & Cliffs", "r", "raptor"],
  ["oakjay", "Garrulus glandarius", "Oak Woods", "r", "song"],
  ["sunconure", "Aratinga solstitialis", "Northern South American Savanna", "r", "tropic"],

  ["scarletmacaw", "Ara macao", "Rainforest Crowns", "e", "tropic"],
  ["toucan", "Ramphastos toco", "South American Woodland", "e", "tropic"],
  ["flamingo", "Phoenicopterus roseus", "Salt Lagoons", "e", "water"],
  ["peacock", "Pavo cristatus", "South Asian Forest Edges", "e", "tropic"],
  ["africangrey", "Psittacus erithacus", "Central African Rainforest", "e", "tropic"],
  ["cockatoo", "Cacatua galerita", "Australian Woodland", "e", "tropic"],
  ["hornbill", "Buceros bicornis", "Asian Hill Forest", "e", "tropic"],
  ["crownedcrane", "Balearica regulorum", "East African Wetlands", "e", "water"],
  ["greyheron", "Ardea cinerea", "Reed Shallows", "e", "water"],

  ["baldeagle", "Haliaeetus leucocephalus", "North American Waterways", "l", "raptor"],
  ["shoebill", "Balaeniceps rex", "Central African Swamps", "l", "water"],
  ["harpyeagle", "Harpia harpyja", "Neotropical Rainforest", "l", "raptor"],
  ["kakapo", "Strigops habroptilus", "New Zealand Refuge Isles", "l", "tropic"],
  ["quetzal", "Pharomachrus mocinno", "Central American Cloud Forest", "l", "tropic"],
  ["birdofparadise", "Paradisaea raggiana", "New Guinea Forest", "l", "tropic"],
  ["goldeneagle", "Aquila chrysaetos", "High Ridge Thermals", "l", "raptor"],
  ["dawnphoenix", "Phoenix aurora (storybook)", "First Light Over the Ridge", "l", "tropic"],

  ["hyacinthmacaw", "Anodorhynchus hyacinthinus", "Pantanal Palm Wetlands", "chase", "tropic"],
  ["spixmacaw", "Cyanopsitta spixii", "Brazilian Caatinga", "chase", "tropic"],
  ["whitepeacock", "Pavo cristatus (leucistic)", "Snow-White Courtier Morph", "chase", "tropic"],
  ["aurorapeacock", "Pavo aurora (storybook)", "A Hundred Waking Skies", "chase", "tropic"],
];

const countOf = (t) => ROWS.filter((r) => r[3] === t).length;
const fmt = (n) => `${+n.toFixed(2)}%`;
for (const t of Object.values(BIRD_TIERS)) {
  const each = t.pct / countOf(t.key);
  t.count = countOf(t.key);
  t.totalPct = fmt(t.pct);
  t.perPct = fmt(each);
  t.note = t.key === "chase" ? `${t.totalPct} total (each 1 in ${Math.round(100 / each).toLocaleString("en-US")})` : `${t.totalPct} total (${t.perPct} each)`;
}

export const BIRD_LIST = ROWS.map(([id, sci, habit, tier, zone]) => {
  const t = BIRD_TIERS[tier];
  const chance = tier === "chase" ? `${t.perPct} (1 in ${Math.round(100 / (t.pct / t.count)).toLocaleString("en-US")})` : t.perPct;
  return { id, sci, habit, tier, chance, zone };
});
export const BIRD_META = Object.fromEntries(BIRD_LIST.map((r) => [r.id, r]));
export const BIRD_IDS = BIRD_LIST.map((r) => r.id);
export const CHASE_BIRDS = BIRD_LIST.filter((r) => r.tier === "chase").map((r) => r.id);

export const DAILY_NEST_CAP = 15;
export const DAILY_CHORUS_CAP = 3;
export const NEST_PRICE = { bells: 50, mon: 75 };
export const CHORUS_FREE_AT = 6;

export function ensureDawnAviary(s) {
  const a = (s.dawnAviary ||= { day: "", adopts: 0, plays: 0, freeDay: "", best: 0 });
  if (a.day !== today()) {
    a.day = today();
    a.adopts = 0;
    a.plays = 0;
  }
  return a;
}

/** u is a roll in [0, 100). Each tier owns a contiguous band, split evenly between its birds. */
export function rollBirdId(u = Math.random() * 100) {
  let floor = 0;
  for (const t of Object.values(BIRD_TIERS)) {
    if (u < floor + t.pct || t.key === "chase") {
      const pool = BIRD_LIST.filter((r) => r.tier === t.key);
      const idx = Math.max(0, Math.min(pool.length - 1, Math.floor(((u - floor) / t.pct) * pool.length)));
      return { id: pool[idx].id, tier: t.key };
    }
    floor += t.pct;
  }
}

export function rollBirdPod(X) {
  const s = X.xs();
  const { id, tier } = rollBirdId();
  const sp = species(id);
  const meta = BIRD_META[id];
  if (s.pets[id]) {
    s.pets[id].xp = (s.pets[id].xp || 0) + 60;
    s.pets[id].joy = 100;
    X.save();
    return { dupe: true, id, sp, tier, meta };
  }
  s.pets[id] = { sp: id, name: sp[1], xp: 0, hunger: 92, joy: 96, at: Date.now(), born: today() };
  if (!s.active) s.active = id;
  X.save();
  return { dupe: false, id, sp, tier, meta };
}

const sig = (kind, tag, btn, desc) => ({ kind, tag, btn, desc });
const FAN = sig("fan", "Train Unfurl", "Unfurl the Fan!", "Raises its long upper-tail coverts into a shimmering wheel of eyespots.");

export const BIRD_BEHAVIOURS = {
  cockatoo: sig("crest", "Crest Flare", "Raise the Crest!", "Snaps its forward-curling yellow crest straight up when excited."),
  harpyeagle: sig("crest", "Split Crest", "Raise the Crest!", "Lifts its double crest and stares, focusing sound toward its face."),
  barnowl: sig("swivel", "Head Swivel", "Swivel Head!", "Turns its head far around because its eyes cannot move in their sockets."),
  kookaburra: sig("laugh", "Dawn Laugh", "Start Laughing!", "Throws its head back into the rolling territorial 'laugh'."),
  hummingbird: sig("hover", "Hover & Dart", "Hover and Dart!", "Wings blur in a figure-eight as it holds still, then darts backward."),
  kingfisher: sig("dive", "Plunge Dive", "Dive!", "Tips bill-first into the water and pops back up in a ring of splashes."),
  flamingo: sig("filter", "Upside-Down Filter Feeding", "Filter Feed!", "Swings its head upside down and sieves the shallows through its bent bill."),
  woodpecker: sig("drum", "Drum Roll", "Drum!", "Hammers a hollow snag in a rapid roll to claim the territory."),
  shoebill: sig("clatter", "Bill Clatter", "Clatter Bill!", "Claps its enormous mandibles together like wooden blocks in greeting."),
  birdofparadise: sig("plumes", "Plume Dance", "Dance!", "Throws its flame flank plumes up over its back and shivers them."),
  crownedcrane: sig("dance", "Crane Dance", "Dance!", "Bounces with half-open wings in the pair dance cranes are famous for."),
  kakapo: sig("boom", "Mating Boom", "Boom!", "Inflates its chest sacs and sends a low boom rolling across the valley."),
  bluetit: sig("hang", "Acrobat Hang", "Hang Upside Down!", "Flips underneath a twig to pick insects off the other side."),
  africangrey: sig("mimic", "Perfect Mimicry", "Say Something!", "Repeats a household phrase in uncanny detail."),
  baldeagle: sig("spread", "Wingspread", "Spread Wings!", "Opens broad plank-like wings and shows its fingered primaries."),
  goldeneagle: sig("spread", "Wingspread", "Spread Wings!", "Opens long wings and tests the ridge wind."),
  peacock: FAN,
  whitepeacock: FAN,
  aurorapeacock: FAN,
};

export const BIRD_SHOWCASE = ["peacock", "barnowl", "kingfisher", "hummingbird", "cockatoo", "kookaburra", "flamingo", "woodpecker", "shoebill", "birdofparadise", "crownedcrane", "kakapo", "bluetit", "africangrey", "baldeagle", "harpyeagle"];
