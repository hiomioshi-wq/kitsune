// Massive High Seas Boating Expansion: Naval Armory (Cannons, Sails, Figureheads), Dynamic Sea Weather, Naval Ranks, Sea Expeditions, and Ghost/Serpent Encounters.
export const CANNONS = {
  iron: { name: "Iron Culverins", desc: "Standard 3-shot spread.", cost: 0, shots: 3, dmg: 1, rate: 1, color: "#ffd27a", core: "#1c1c22" },
  chain: { name: "Chain-Shot Cannons", desc: "+20% damage, wider 3-shot salvo.", cost: 900, shots: 3, dmg: 1.2, rate: .95, color: "#9fe8ff", core: "#1c2838" },
  foxfire: { name: "Foxfire Mortars", desc: "5-shot wide salvo with scorching fireballs.", cost: 2200, shots: 5, dmg: 1.25, rate: .92, color: "#ff9a3a", core: "#5c1f12" },
  astral: { name: "Astral Broadside", desc: "7-shot starlight salvo & rapid reload.", cost: 5000, shots: 7, dmg: 1.35, rate: .82, color: "#d48cff", core: "#2b1640" },
};

export const RIGGING = {
  linen: { name: "Saltwick Linen", desc: "Dependable coastal canvas.", cost: 0, speed: 1, loot: 1, dmg: 1, tint: null },
  stormsilk: { name: "Storm-Silk Rigging", desc: "+12% top speed in any wind.", cost: 800, speed: 1.12, loot: 1, dmg: 1, tint: "#bfe8ff" },
  crimson: { name: "Corsair Crimson", desc: "+20% pirate & captain bounty mon.", cost: 1800, speed: 1.06, loot: 1.2, dmg: 1.05, tint: "#e05058" },
  moonweave: { name: "Moonweave Sails", desc: "+18% speed & +15% cannon damage.", cost: 3600, speed: 1.18, loot: 1.1, dmg: 1.15, tint: "#d8b4ff" },
};

export const FIGUREHEADS = {
  none: { name: "Plain Timber Prow", desc: "Unadorned bowsprit.", cost: 0, speed: 1, dmg: 1, salvage: 1, color: null },
  fox: { name: "Golden Fox Prow", desc: "+10% speed & lucky wind.", cost: 700, speed: 1.10, dmg: 1, salvage: 1.1, color: "#ffd25a" },
  kraken: { name: "Kraken Maw", desc: "+18% cannon damage.", cost: 1500, speed: 1, dmg: 1.18, salvage: 1, color: "#7fe8d0" },
  lantern: { name: "Foxfire Beacon Prow", desc: "+30% salvage & island mon.", cost: 2600, speed: 1.05, dmg: 1.08, salvage: 1.3, color: "#ff9a3a" },
};

export const SEA_WEATHER = [
  { id: "trade", name: "Trade Winds", icon: "🌬️", desc: "+18% ship speed", speed: 1.18, loot: 1, tint: null },
  { id: "calm", name: "Glass Calm", icon: "🪞", desc: "+25% dredge & salvage yield", speed: 1, loot: 1.25, tint: "rgba(180,230,255,.05)" },
  { id: "squall", name: "Monsoon Squall", icon: "⛈️", desc: "+30% pirate bounty mon", speed: 1.08, loot: 1.3, tint: "rgba(20,40,70,.16)" },
  { id: "fog", name: "Moonlit Fog", icon: "🌫️", desc: "+20% island & flotsam finds", speed: .96, loot: 1.2, tint: "rgba(210,225,240,.14)" },
  { id: "starfall", name: "Starfall Tide", icon: "🌠", desc: "+15% speed & +25% all sea mon", speed: 1.15, loot: 1.25, tint: "rgba(140,100,220,.08)" },
];

export function currentSeaWeather(now = Date.now()) {
  return SEA_WEATHER[Math.floor(now / 240000) % SEA_WEATHER.length];
}

export const NAVAL_RANKS = [
  [0, "Deckhand"],
  [5, "Bosun"],
  [12, "Quartermaster"],
  [24, "First Mate"],
  [40, "Captain"],
  [65, "Commodore"],
  [95, "High Admiral"],
  [135, "Sovereign of the Horizon"],
];

export function navalRank(st) {
  const score = Object.keys(st.ports || {}).length
    + Object.keys(st.islands || {}).length * 2
    + (st.ships || 0)
    + (st.contracts || 0) * 2
    + Object.keys(st.sunk || {}).length * 3;
  let rank = NAVAL_RANKS[0][1];
  for (const [req, name] of NAVAL_RANKS) if (score >= req) rank = name;
  return { rank, score };
}

export const SEA_EXPEDITIONS = [
  ["ports5", "Chart 5 Harbours", (st) => Object.keys(st.ports || {}).length >= 5, 250],
  ["ports15", "Chart 15 Harbours", (st) => Object.keys(st.ports || {}).length >= 15, 650],
  ["islands4", "Explore 4 Ocean Islands", (st) => Object.keys(st.islands || {}).length >= 4, 400],
  ["islands12", "Chart All 12 Ocean Islands", (st) => Object.keys(st.islands || {}).length >= 12, 1600],
  ["sink10", "Sink 10 Pirate Vessels", (st) => (st.ships || 0) >= 10, 450],
  ["charter5", "Complete 5 Sea Charters", (st) => (st.contracts || 0) >= 5, 800],
  ["fleet3", "Own 3 Different Ships", (st) => Object.keys(st.fleet || {}).length >= 3, 1000],
  ["dredge10", "Cast the Deep-Sea Dredge 10 Times", (st) => (st.dredges || 0) >= 10, 350],
];

export const GHOST_FOES = [
  { id: "ghost_galleon", name: "The Phantom Galleon", hp: 380, dmg: 18, sp: 102, rate: 1.45, loot: 420, r: 34, c: "#3b4c5e", sail: "#b8fff0", boss: false },
  { id: "sea_serpent", name: "Abyssal Sea Serpent", hp: 520, dmg: 22, sp: 115, rate: 1.35, loot: 620, r: 36, c: "#1d5e58", sail: "#7fe8d0", boss: false },
  { id: "iron_leviathan", name: "The Iron Leviathan", hp: 740, dmg: 26, sp: 82, rate: 1.25, loot: 900, r: 40, c: "#2c2438", sail: "#ff7a48", boss: false },
];
