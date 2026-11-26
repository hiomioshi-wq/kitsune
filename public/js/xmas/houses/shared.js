// Turns a pet-house pack (pure data) into catalog rows, odds and rolls. No imports, so data.js can use it.
export const TIERS = {
  c: { key: "c", label: "Common", color: "#8aa0b8", pct: 55 },
  r: { key: "r", label: "Rare", color: "#3f8fe0", pct: 28 },
  e: { key: "e", label: "Epic", color: "#9a5be0", pct: 12 },
  l: { key: "l", label: "Legendary", color: "#f2a81d", pct: 4.8 },
  chase: { key: "chase", label: "Chase", color: "#ff5cb8", pct: 0.2 },
};
const fmt = (n) => `${+n.toFixed(2)}%`;
const odds = (n) => Math.round(100 / n).toLocaleString("en-US");

export function buildHouse(pack, art) {
  const rows = pack.pets.map(([id, name, tier, zone, body, belly, accent, sci, habit, personality]) => ({ id, name, tier, zone, body, belly, accent, sci, habit, personality }));
  const tiers = Object.fromEntries(Object.values(TIERS).map((t) => {
    const count = rows.filter((r) => r.tier === t.key).length, each = t.pct / (count || 1);
    const note = t.key === "chase" ? `${fmt(t.pct)} total (each 1 in ${odds(each)})` : `${fmt(t.pct)} total (${fmt(each)} each)`;
    return [t.key, { ...t, count, each, totalPct: fmt(t.pct), perPct: fmt(each), note }];
  }));
  for (const r of rows) r.chance = r.tier === "chase" ? `${tiers.chase.perPct} (1 in ${odds(tiers.chase.each)})` : tiers[r.tier].perPct;
  const behaviours = Object.fromEntries(Object.entries(pack.behaviours).map(([id, [tag, btn, desc]]) => [id, { tag, btn, desc }]));
  return {
    ...pack,
    art,
    rows,
    tiers,
    behaviours,
    ids: rows.map((r) => r.id),
    meta: Object.fromEntries(rows.map((r) => [r.id, r])),
    chaseIds: rows.filter((r) => r.tier === "chase").map((r) => r.id),
    // Same row shape as SPECIES in data.js: id, name, rarity, body, belly, accent, family, tail, personality.
    species: rows.map((r) => [r.id, r.name, r.tier === "chase" ? "l" : r.tier, r.body, r.belly, r.accent, `house:${pack.slug}`, "", r.personality]),
  };
}

/** u is a roll in [0, 100). Each tier owns a contiguous band, split evenly between its pets. */
export function rollHouseId(house, u = Math.random() * 100) {
  let floor = 0;
  for (const t of Object.values(house.tiers)) {
    if (u < floor + t.pct || t.key === "chase") {
      const pool = house.rows.filter((r) => r.tier === t.key);
      const i = Math.max(0, Math.min(pool.length - 1, Math.floor(((u - floor) / t.pct) * pool.length)));
      return pool[i].id;
    }
    floor += t.pct;
  }
}
