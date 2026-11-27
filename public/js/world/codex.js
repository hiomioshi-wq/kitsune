// World Codex: unified Encyclopedia & Completion Almanac across all 25 regions, 7 realms, bosses, weapons, and activities.
import { REGIONS, HATS, FURNITURE, FISH } from "./data.js";
import { REALMS } from "./realms.js";
import { BOSSES } from "./boss.js";
import { WEAPONS } from "./rpg.js";
import { ARENA_CHAMPS } from "./arena.js";
import { SPECIES, GOALS, HOMES, RIDES } from "./baycore.js";
import { BUGS, PLUSH, NETS } from "./baywild.js";
import { FISHDEX } from "./bayfish.js";
import { SHELLS } from "./bayfun.js";
import { SHIPS, CREW, ISLANDS, CATCHES, PORTS } from "./seacore.js";
import { SEA_EXPEDITIONS, navalRank } from "./sea-extra.js";
import { esc } from "../util.js";

export function createCodex(o) {
  const { s, panel } = o;

  function open(tab = "realms") {
    const tabs = [
      ["realms", "Realms (9)"],
      ["bosses", "Bosses & Arena"],
      ["gear", "Weapons & Gear"],
      ["bay", "Moonwake Bay"],
      ["seas", "High Seas & Sanctuaries"],
      ["atlas", "153-Region Atlas"],
    ];

    let body = "";
    if (tab === "realms") {
      const ids = ["blackwood", "blackwood2", "incarnate", "backrooms", "express", "citadel", "undermarket", "clockworks", "emeraldvault"];
      body = `<div class="se-mkt">${ids.map((id) => {
        const R = REALMS[id], rs = s.realm?.[id] || {};
        const scenes = Object.keys(R.scenes).length;
        const vis = Object.keys(rs.visited || {}).length;
        const found = Object.keys(rs.found || {}).length;
        const relics = R.relics?.length || 0;
        const step = Math.min(rs.step || 0, R.quest?.length || 0);
        const totalQ = R.quest?.length || 0;
        return `<div class="se-good${found >= relics && step >= totalQ ? " cheap" : ""}">
          <span><strong>${esc(R.title)}</strong><small>${vis ? `Visited ${vis}/${scenes}` : `${scenes} scenes`} · Chapters ${step}/${totalQ} · Relics ${found}/${relics}</small></span>
          <em>${rs.deaths || 0} falls</em>
        </div>`;
      }).join("")}</div>`;
    } else if (tab === "bosses") {
      const beatMap = {};
      for (const rs of Object.values(s.realm || {})) {
        for (const [k, v] of Object.entries(rs.beat || {})) beatMap[k] = (beatMap[k] || 0) + v;
      }
      for (const [k, v] of Object.entries(s.arena?.beat || {})) beatMap[k] = (beatMap[k] || 0) + v;
      const list = Object.entries(BOSSES).filter(([k]) => !k.startsWith("d-"));
      body = `<div class="se-mkt">${list.map(([id, B]) => {
        const n = beatMap[id] || 0;
        const tag = ARENA_CHAMPS.includes(id) ? "Arena Champion" : "Realm Boss";
        return `<div class="se-good${n ? " cheap" : ""}">
          <span><strong>${esc(B.name)}</strong><small>${tag} · Drops ${esc(B.hatName)} & ${esc(B.furnName)}</small></span>
          <em>${n ? `Beaten ×${n}` : "Unbeaten"}</em>
        </div>`;
      }).join("")}</div>`;
    } else if (tab === "gear") {
      const ownedW = s.rpg?.weapons || ["claws"];
      body = `<p class="muted">Hats: <strong>${(s.hats || []).length}/${HATS.length}</strong> · Furniture types: <strong>${FURNITURE.length}</strong> · Fish species: <strong>${FISH.length}</strong></p>
        <div class="se-mkt">${Object.entries(WEAPONS).map(([id, w]) => {
          const own = ownedW.includes(id);
          return `<div class="se-good${own ? " cheap" : ""}">
            <span><strong>${esc(w[0])}</strong><small>${w[1]} dmg · ${w[2]} reach · ${esc(w[6])}</small></span>
            <em>${own ? "Owned" : esc(w[5] || "Starter")}</em>
          </div>`;
        }).join("")}</div>`;
    } else if (tab === "bay") {
      const bay = s.bay || {}, wild = bay.wild || {};
      const crit = Object.keys(bay.dex || {}).length, bugs = Object.keys(wild.bugs || {}).length, fish = Object.keys(bay.fish || {}).length, shells = Object.keys(bay.album || {}).length, plushN = Object.keys(wild.plush || {}).length;
      const jobs = Object.values(bay.jobs || {}).reduce((a, n) => a + n, 0), goalN = GOALS.filter((g) => bay.goals?.[g[0]]).length;
      const net = NETS[wild.net || 0], home = HOMES.find((h) => h[0] === bay.home), rides = (bay.rides || []).length;
      const row = (n, total, label, extra = "") => `<div class="se-good${n >= total ? " cheap" : ""}"><span><strong>${label}</strong><small>${extra}</small></span><em>${n}/${total}</em></div>`;
      body = `<p class="muted">Everything collectable in Moonwake Bay, at a glance.</p><div class="se-mkt">
        ${row(crit, SPECIES.length, "Critters discovered")}
        ${row(bugs, BUGS.length, "Bug species", `Net: ${esc(net[1])}`)}
        ${row(fish, FISHDEX.length, "Pier fish")}
        ${row(shells, SHELLS.length, "Shell album")}
        ${row(plushN, PLUSH.length, "Plushies")}
        ${row(goalN, GOALS.length, "Bay Goals", bay.champ ? "Moonwake sunhat earned" : "Finish them all for the sunhat")}
        ${row(jobs, 50, "Job shifts worked", `${esc(home ? home[1] : "No home yet")} · ${rides} ride${rides === 1 ? "" : "s"}`)}
      </div>`;
    } else if (tab === "seas") {
      const sea = s.sea || {}, rk = navalRank(sea);
      const row = (n, total, label, extra = "") => `<div class="se-good${n >= total ? " cheap" : ""}"><span><strong>${label}</strong><small>${extra}</small></span><em>${n}/${total}</em></div>`;
      body = `<p class="muted">Naval Rank: <strong>${esc(rk.rank)}</strong> (Score ${rk.score}) · Sanctuary &amp; High Seas completion.</p><div class="se-mkt">
        ${row(Object.keys(sea.ports || {}).length, PORTS.length, "High Seas Ports")}
        ${row(Object.keys(sea.islands || {}).length, ISLANDS.length, "Ocean Islands Charted")}
        ${row(Object.keys(sea.fleet || { sloop: 1 }).length, Object.keys(SHIPS).length, "Ship Hulls Commissioned")}
        ${row(Object.keys(sea.hired || {}).length, Object.keys(CREW).length, "Sea Officers Hired")}
        ${row(Object.keys(sea.exp || {}).length, SEA_EXPEDITIONS.length, "Sea Expeditions Claimed")}
        ${row(Object.keys(sea.caught || {}).length, CATCHES.length, "High Seas Creatures")}
        ${row(Object.keys(s.aquarium?.display || {}).length, 40, "Aquarium Displayed Species", `Quizzes solved: ${s.aquarium?.trivia || 0}`)}
        ${row(Object.keys(s.botanical?.dex || {}).length, 12, "Botanical Herbarium", `Harvested: ${s.botanical?.harvested || 0}`)}
        ${row(Object.keys(s.observatory?.atlas || {}).length, 8, "Observatory Star Atlas", `Star-Dust: ${s.observatory?.dust || 0}`)}
        ${row(Object.keys(s.aviary?.seen || {}).length, 16, "Foxhold Aviary Life List")}
        ${row(Object.keys(s.tarot?.seen || {}).length, 22, "Nine-Tail Tarot Arcana")}
      </div>`;
    } else {
      body = `<ol class="wd-list">${Object.entries(REGIONS).map(([k, r]) => {
        const lit = k in (s.lit || {}) || k in (s.far?.lit || {});
        return `<li class="${lit ? "ok" : ""}"><strong>${esc(r[0])}</strong><span>Hub (${r[1]}, ${r[2]})</span></li>`;
      }).join("")}</ol>`;
    }

    panel("World Codex", `<p class="muted">Complete encyclopedia of Kitsune World's 9 realms, ${Object.keys(REGIONS).length} regions, bosses, and arsenal.</p>
      <div class="dy-tabs">${tabs.map(([k, l]) => `<button type="button" class="${k === tab ? "on" : ""}" data-t="${k}">${l}</button>`).join("")}</div>${body}`, (e) => {
      e.querySelectorAll("[data-t]").forEach((b) => (b.onclick = () => open(b.dataset.t)));
    });
  }

  return { open };
}
