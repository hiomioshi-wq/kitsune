// Unified Overworld Book Districts: projects all Book Realm NPCs, characters, stories, and quests
// directly onto the single Kitsune World map so no separate-world silos are required.
import { REALMS } from "./realms.js";
import { GATES } from "./gates.js";
import { T } from "./data.js";

export function buildOverworldRealmActors(castFn, map, W, H, blocked) {
  const actors = [];
  const okTile = (tx, ty) => {
    if (!map || tx < 1 || ty < 1 || tx >= W - 1 || ty >= H - 1) return true;
    const i = ty * W + tx;
    if (!map.reach[i] || map.solid[i]) return false;
    return !blocked?.((tx + 0.5) * T, (ty + 0.5) * T);
  };
  const findOpen = (cx, cy, taken) => {
    for (let r = 1; r <= 7; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = Math.round(cx) + dx, ty = Math.round(cy) + dy;
          const key = `${tx},${ty}`;
          if (!taken.has(key) && okTile(tx, ty)) {
            taken.add(key);
            return [(tx + 0.5) * T, (ty + 0.5) * T];
          }
        }
      }
    }
    return [cx * T, (cy + 1.5) * T];
  };

  for (const gate of GATES) {
    const r = REALMS[gate.id];
    if (!r) continue;
    const seenNames = new Set();
    const npcs = [];
    for (const area of Object.values(r.scenes || r.areas || {})) {
      for (const n of area.npcs || []) {
        if (!n.name || seenNames.has(n.name)) continue;
        seenNames.add(n.name);
        npcs.push(n);
      }
    }
    const taken = new Set([`${Math.round(gate.cx)},${Math.round(gate.cy)}`]);
    npcs.slice(0, 8).forEach((n, idx) => {
      const [x, y] = findOpen(gate.cx, gate.cy + 1.5, taken);
      const img = new Image();
      const svg = typeof castFn === "function" ? castFn(n, r.series || gate.id) : "";
      if (svg) img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
      actors.push({
        id: `${gate.id}:${n.id || idx}`,
        realmId: gate.id,
        realmTitle: r.title || gate.name,
        warn: gate.warn || "",
        series: r.series || gate.id,
        name: n.name,
        lines: n.lines || ["The boundary between stories feels thin here."],
        story: n.story || null,
        goal: n.goal || null,
        x,
        y,
        line: 0,
        img,
      });
    });
  }
  return actors;
}
