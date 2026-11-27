// Lantern Bakery: 9 pastries (including Blackwood & Moonwake specials), Daily Hearth Order bonus, and Baker Mastery ranks.
import { esc, today } from "../util.js";
import { item as findItem } from "./extras.js";

const PASTRIES = [
  { id: "brioche", name: "Foxfire Brioche", icon: "🥐", cost: 14, need: { honey: 1, acorn: 1 }, speedSec: 120, luck: 1 },
  { id: "biscuit", name: "Meridian Ginger Biscuit", icon: "🍪", cost: 15, need: { acorn: 2 }, speedSec: 130, luck: 2 },
  { id: "roll", name: "Cinnamon Lantern Roll", icon: "🥨", cost: 16, need: { herb: 2, honey: 1 }, speedSec: 120, luck: 1 },
  { id: "tart", name: "Snowberry Tart", icon: "🥧", cost: 18, need: { berry: 2, honey: 1 }, speedSec: 150, luck: 2 },
  { id: "cupcake", name: "Madison's Pink Cupcake", icon: "🧁", cost: 20, need: { berry: 1, honey: 1 }, speedSec: 160, luck: 2 },
  { id: "croissant", name: "Moonwake Croissant", icon: "🌙", cost: 22, need: { kelp: 1, berry: 1 }, speedSec: 150, luck: 2 },
  { id: "macaron", name: "Emerald Macaron", icon: "🟢", cost: 24, need: { poppy: 1, honey: 1 }, speedSec: 180, luck: 2 },
  { id: "aubergine", name: "Saffron's Aubergine Tart", icon: "🍆", cost: 26, need: { mushroom: 1, herb: 2 }, speedSec: 210, luck: 3 },
  { id: "moonbun", name: "Starfall Moon-Bun", icon: "🥮", cost: 32, need: { pearl: 1, honey: 1 }, speedSec: 240, luck: 4 },
];

const bakerRank = (n) => (n >= 40 ? "Grand Confectioner" : n >= 20 ? "Master Patissier" : n >= 8 ? "Hearth-Keeper" : "Apprentice Baker");

export function createBakery(o) {
  const { s, panel, toast, ping, save, hud, extras, addRenown } = o;
  const st = (s.bakery ||= {});
  st.baked ||= 0;
  st.orderDay ||= "";

  const bag = () => extras.state.bag;
  const dailyPick = () => {
    const idx = today().split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PASTRIES.length;
    return PASTRIES[idx];
  };

  function applyTreat(p) {
    extras.state.buff = Math.max(extras.state.buff, Date.now()) + p.speedSec * 1000;
    s.luck = (s.luck || 0) + p.luck;
    addRenown?.(8);
    let bonusTxt = "";
    if (st.orderDay !== today() && p.id === dailyPick().id) {
      st.orderDay = today();
      s.mon += 40;
      addRenown?.(25);
      bonusTxt = " · Daily Hearth Order! (+40 mon, +25 Renown)";
    }
    ping("done");
    toast(`${p.name}! +${p.speedSec}s speed boost & +${p.luck} Lucky Ripples${bonusTxt}`);
    save(); hud(); open();
  }

  function open() {
    if (st.buyDay !== today()) { st.buyDay = today(); st.buyN = 0; }
    const canBuy = (st.buyN || 0) < 5;
    const canBake = (reqs) => Object.entries(reqs).every(([k, n]) => (bag()[k] || 0) >= n);
    const reqTxt = (reqs) => Object.entries(reqs).map(([k, n]) => `${esc(findItem(k)?.[1] || k)} ${bag()[k] || 0}/${n}`).join(" · ");
    const featured = dailyPick();
    const orderDone = st.orderDay === today();

    const rows = PASTRIES.map((p) => {
      const ok = canBake(p.need);
      const isOrder = p.id === featured.id && !orderDone;
      return `<div class="se-good${isOrder ? " wanted" : ""}">
        <span>
          <strong>${p.icon} ${esc(p.name)}${isOrder ? " ★" : ""}</strong>
          <small>+${p.speedSec}s speed &amp; +${p.luck} Luck · Bake: ${reqTxt(p.need)}</small>
        </span>
        <div style="display:flex;gap:6px">
          <button type="button" class="btn btn-sm btn-accent" data-bk="${p.id}" ${ok ? "" : "disabled"}>Bake</button>
          <button type="button" class="btn btn-sm" data-by="${p.id}" ${!canBuy || s.mon < p.cost ? "disabled" : ""}>Buy ${p.cost}</button>
        </div>
      </div>`;
    }).join("");

    panel(`Lantern Bakery · ${bakerRank(st.baked)}`, `
      <p class="muted">Baked: <strong>${st.baked}</strong> · Today's Hearth Order: <strong>${featured.icon} ${esc(featured.name)}</strong> ${orderDone ? "(Completed ✓)" : "(+40 mon & +25 Renown bonus!)"} · Counter buys today: <strong>${st.buyN || 0}/5</strong></p>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      e.querySelectorAll("[data-bk]").forEach((b) => {
        b.onclick = () => {
          const p = PASTRIES.find((x) => x.id === b.dataset.bk);
          if (!p || !canBake(p.need)) return;
          for (const [k, n] of Object.entries(p.need)) bag()[k] -= n;
          st.baked++;
          applyTreat(p);
        };
      });
      e.querySelectorAll("[data-by]").forEach((b) => {
        b.onclick = () => {
          const p = PASTRIES.find((x) => x.id === b.dataset.by);
          if (!p || s.mon < p.cost || (st.buyN || 0) >= 5) return;
          s.mon -= p.cost;
          st.buyN = (st.buyN || 0) + 1;
          applyTreat(p);
        };
      });
    });
  }

  return { open, state: st };
}
