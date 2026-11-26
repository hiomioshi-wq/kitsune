// Lantern Bakery: buy fresh pastries or bake treats from your forage for speed boosts and Lucky Ripples.
import { esc, today } from "../util.js";
import { item as findItem } from "./extras.js";

const PASTRIES = [
  { id: "brioche", name: "Foxfire Brioche", icon: "🥐", cost: 14, need: { honey: 1, acorn: 1 }, speedSec: 120, luck: 1 },
  { id: "tart", name: "Snowberry Tart", icon: "🥧", cost: 18, need: { berry: 2, honey: 1 }, speedSec: 150, luck: 2 },
  { id: "roll", name: "Cinnamon Lantern Roll", icon: "🥨", cost: 16, need: { herb: 2, honey: 1 }, speedSec: 120, luck: 1 },
  { id: "macaron", name: "Emerald Macaron", icon: "🟢", cost: 24, need: { poppy: 1, honey: 1 }, speedSec: 180, luck: 2 },
  { id: "croissant", name: "Moonwake Croissant", icon: "🌙", cost: 22, need: { kelp: 1, berry: 1 }, speedSec: 150, luck: 2 },
];

export function createBakery(o) {
  const { s, panel, toast, ping, save, hud, extras, addRenown } = o;
  const st = (s.bakery ||= {});
  st.baked ||= 0;

  const bag = () => extras.state.bag;

  function applyTreat(p) {
    extras.state.buff = Math.max(extras.state.buff, Date.now()) + p.speedSec * 1000;
    s.luck = (s.luck || 0) + p.luck;
    addRenown?.(8);
    ping("done");
    toast(`${p.name}! +${p.speedSec}s speed boost & +${p.luck} Lucky Ripples!`);
    save(); hud(); open();
  }

  function open() {
    if (st.buyDay !== today()) { st.buyDay = today(); st.buyN = 0; }
    const canBuy = (st.buyN || 0) < 5;
    const canBake = (reqs) => Object.entries(reqs).every(([k, n]) => (bag()[k] || 0) >= n);
    const reqTxt = (reqs) => Object.entries(reqs).map(([k, n]) => `${esc(findItem(k)?.[1] || k)} ${bag()[k] || 0}/${n}`).join(" · ");

    const rows = PASTRIES.map((p) => {
      const ok = canBake(p.need);
      return `<div class="se-good">
        <span>
          <strong>${p.icon} ${esc(p.name)}</strong>
          <small>+${p.speedSec}s speed &amp; +${p.luck} Luck · Bake: ${reqTxt(p.need)}</small>
        </span>
        <div style="display:flex;gap:6px">
          <button type="button" class="btn btn-sm btn-accent" data-bk="${p.id}" ${ok ? "" : "disabled"}>Bake</button>
          <button type="button" class="btn btn-sm" data-by="${p.id}" ${!canBuy || s.mon < p.cost ? "disabled" : ""}>Buy ${p.cost}</button>
        </div>
      </div>`;
    }).join("");

    panel(`Lantern Bakery · ${st.baked} Baked`, `
      <p class="muted">Bake pastries from your forage for free, or buy them warm off the counter for instant speed &amp; fishing luck.</p>
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
