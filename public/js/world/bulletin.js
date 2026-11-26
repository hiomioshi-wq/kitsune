// World Bulletin & Progress Dashboard: overview of every Kitsune World system with one-click jump buttons.
import { esc } from "../util.js";

export function createBulletin(o) {
  const { s, panel, LANTERNS, FAR_QUESTS, NPCS, FISH, openActivity, kvGet, kvSet, playerName } = o;

  function finishedCollections() {
    const out = [];
    if (Object.keys(s.lit || {}).length >= LANTERNS.length) out.push("🏮 Country Lanterns");
    if (Object.keys(s.far?.lit || {}).length >= FAR_QUESTS.length) out.push("🔥 Far Beacons");
    if (Object.keys(s.museum?.donated || {}).length >= 16) out.push("🏛️ Museum");
    if (Object.keys(s.badges?.claimed || {}).length >= 16) out.push("🏆 Badges");
    if (Object.keys(s.stargaze?.done || {}).length >= 6) out.push("🔭 Constellations");
    if (Object.keys(s.fish || {}).length >= FISH.length) out.push("🐟 Angler");
    return out;
  }

  async function open() {
    const mine = finishedCollections();
    const me = playerName?.() || "Fox";
    let wall = {};
    if (kvGet && kvSet) {
      wall = (await kvGet("shared-lantern-wall", {})) || {};
      wall[me] = { lit: mine, count: mine.length, at: Date.now() };
      await kvSet("shared-lantern-wall", wall);
    }
    const wallRows = Object.entries(wall).map(([who, info]) => {
      const lanterns = (info.lit || []).length ? info.lit.join(" · ") : "No completed collections lit yet";
      return `<div class="se-good"><span><strong>🏮 ${esc(who)} (${(info.lit || []).length}/6)</strong><small>${esc(lanterns)}</small></span></div>`;
    }).join("");

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
      <h4>🏮 Shared Lantern Wall (${mine.length}/6 Lit by ${esc(me)})</h4>
      <p class="muted">Finished collections light a lantern on the shared hub wall for everyone sharing this library.</p>
      <div class="se-mkt" style="margin-bottom:12px">${wallRows || `<p class="muted">Complete a collection to light the first lantern!</p>`}</div>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      e.querySelectorAll("[data-go]").forEach((b) => {
        b.onclick = () => openActivity?.(b.dataset.go);
      });
    });
  }

  return { open };
}
