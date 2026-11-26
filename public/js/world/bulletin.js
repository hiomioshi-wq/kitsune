// World Bulletin & Progress Dashboard: overview of every Kitsune World system with one-click jump buttons.
import { esc } from "../util.js";

export function createBulletin(o) {
  const { s, panel, LANTERNS, FAR_QUESTS, NPCS, FISH, openActivity } = o;

  function open() {
    const stats = [
      ["🏮 Country Lanterns", `${Object.keys(s.lit || {}).length}/${LANTERNS.length}`, ""],
      ["🔥 Far Beacons", `${Object.keys(s.far?.lit || {}).length}/${FAR_QUESTS.length}`, ""],
      ["👥 Residents Met", `${Object.keys(s.met || {}).length}/${NPCS.length}`, ""],
      ["🐟 Fish Caught", `${Object.keys(s.fish || {}).length}/${FISH.length} species (${s.caught || 0} total)`, ""],
      ["🎩 Hats Collected", `${(s.hats || []).length}`, "inventory"],
      ["🏛️ Museum Exhibits", `${Object.keys(s.museum?.donated || {}).length}/16`, "museum"],
      ["🏆 Milestone Badges", `${Object.keys(s.badges?.claimed || {}).length}/16`, "badges"],
      ["🎰 Roulette Wins", `${s.roulette?.wins || 0} (Best: ${s.roulette?.best || 0} mon)`, "roulette"],
      ["🍺 Tavern Wins", `${s.tavern?.wins || 0}`, "tavern"],
      ["🎟️ Keno & Scratch Wins", `${s.keno?.wins || 0}`, "keno"],
      ["📈 Exchange Profit", `${s.exchange?.profit || 0} mon`, "exchange"],
      ["🎓 Quiz Best", `${s.quiz?.best || 0}/5`, "quiz"],
      ["🐾 Companion Rank", `Rank ${s.petArena?.lv || 1}`, "petarena"],
      ["🔭 Constellations", `${Object.keys(s.stargaze?.done || {}).length}/6`, "stargaze"],
      ["📮 Post Deliveries", `${s.postOffice?.done || 0}`, "postoffice"],
      ["🦪 Tidepool Pearls", `${s.tidepool?.pearls || 0}`, "tidepool"],
    ];

    const rows = stats.map(([label, val, act]) =>
      `<div class="se-good">
        <span><strong>${esc(label)}</strong><small>${esc(val)}</small></span>
        ${act ? `<button type="button" class="btn btn-sm" data-go="${act}">Open</button>` : ""}
      </div>`
    ).join("");

    panel("World Progress Bulletin", `
      <p class="muted">Your complete ledger across Kitsune World. Purse: <strong>${s.mon} mon</strong> · Lucky Ripples: <strong>${s.luck || 0}</strong>.</p>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      e.querySelectorAll("[data-go]").forEach((b) => {
        b.onclick = () => openActivity?.(b.dataset.go);
      });
    });
  }

  return { open };
}
