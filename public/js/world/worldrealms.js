// Unified Overworld Book Districts: projects all Book Realm NPCs, characters, stories, and quests
// directly onto the single Kitsune World map so no separate-world silos are required.
import { REALMS } from "./realms.js";
import { GATES } from "./gates.js";
import { T } from "./data.js";

export function buildOverworldRealmActors(castFn) {
  const actors = [];
  for (const gate of GATES) {
    const r = REALMS[gate.id];
    if (!r) continue;
    const seenNames = new Set();
    const npcs = [];
    for (const area of Object.values(r.areas || {})) {
      for (const n of area.npcs || []) {
        if (!n.name || seenNames.has(n.name)) continue;
        seenNames.add(n.name);
        npcs.push(n);
      }
    }
    const baseX = gate.cx * T;
    const baseY = (gate.cy + 1.5) * T;
    npcs.slice(0, 8).forEach((n, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = baseX + (col - 1.5) * 44;
      const y = baseY + row * 48;
      const img = new Image();
      const svg = castFn?.(n.cast);
      if (svg) img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
      actors.push({
        id: `${gate.id}:${n.id || idx}`,
        realmId: gate.id,
        realmTitle: r.title || gate.name,
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
