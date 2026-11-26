// Foxhold Botanical Garden: plant, water, and harvest 5 rare World flowers in 4 pots for mon and Renown.
import { esc } from "../util.js";

const SEEDS = [
  { id: "lotus", name: "Moonlight Lotus", icon: "🪷", cost: 10, sell: 28, ren: 12 },
  { id: "orchid", name: "Foxfire Orchid", icon: "🌺", cost: 16, sell: 44, ren: 18 },
  { id: "rose", name: "Brask Brass-Rose", icon: "🌹", cost: 22, sell: 60, ren: 22 },
  { id: "sealily", name: "Saltwick Sea-Lily", icon: "💠", cost: 28, sell: 78, ren: 28 },
  { id: "epoppy", name: "Emerald Poppy", icon: "🌷", cost: 36, sell: 105, ren: 35 },
];

export function createBotanical(o) {
  const { s, panel, toast, ping, save, hud, addRenown } = o;
  const st = (s.botanical ||= {});
  st.pots ||= [null, null, null, null]; // { id, stage: 0..2 }
  st.harvested ||= 0;

  let seedId = "lotus";

  function open() {
    const seedBtns = SEEDS.map((sd) =>
      `<button type="button" class="chip${seedId === sd.id ? " on" : ""}" data-sd="${sd.id}">${sd.icon} ${esc(sd.name)} (${sd.cost}→${sd.sell})</button>`
    ).join("");

    const potsHtml = st.pots.map((pot, i) => {
      if (!pot) {
        const sd = SEEDS.find((x) => x.id === seedId) || SEEDS[0];
        return `<div class="se-good">
          <span><strong>🪴 Pot ${i + 1} · Empty</strong><small>Plant ${esc(sd.name)} for ${sd.cost} mon</small></span>
          <button type="button" class="btn btn-sm btn-accent" data-pl="${i}" ${s.mon < sd.cost ? "disabled" : ""}>Plant (${sd.cost})</button>
        </div>`;
      }
      const sd = SEEDS.find((x) => x.id === pot.id) || SEEDS[0];
      const ready = pot.stage >= 2;
      return `<div class="se-good">
        <span><strong>${ready ? sd.icon : "🌱"} Pot ${i + 1} · ${esc(sd.name)}</strong><small>${ready ? `In full bloom! Harvest for +${sd.sell} mon & +${sd.ren} Renown` : `Growth stage ${pot.stage}/2 — water to grow`}</small></span>
        ${ready
          ? `<button type="button" class="btn btn-sm btn-accent" data-hv="${i}">Harvest (+${sd.sell})</button>`
          : `<button type="button" class="btn btn-sm btn-accent" data-wt="${i}">Water 💧</button>`}
      </div>`;
    }).join("");

    panel(`Foxhold Botanical Garden · ${st.harvested} Harvested`, `
      <p class="muted">Choose a rare seed, plant it in your greenhouse pots, water twice to bloom, and harvest for mon &amp; Renown.</p>
      <div class="chips" style="margin:10px 0">${seedBtns}</div>
      <div class="se-mkt">${potsHtml}</div>
    `, (e) => {
      e.querySelectorAll("[data-sd]").forEach((b) => (b.onclick = () => { seedId = b.dataset.sd; open(); }));
      e.querySelectorAll("[data-pl]").forEach((b) => {
        b.onclick = () => {
          const i = +b.dataset.pl, sd = SEEDS.find((x) => x.id === seedId);
          if (!sd || st.pots[i] || s.mon < sd.cost) return;
          s.mon -= sd.cost;
          st.pots[i] = { id: sd.id, stage: 0 };
          ping("choice"); save(); hud(); open();
        };
      });
      e.querySelectorAll("[data-wt]").forEach((b) => {
        b.onclick = () => {
          const pot = st.pots[+b.dataset.wt];
          if (!pot || pot.stage >= 2) return;
          pot.stage++;
          ping("blip"); save(); open();
        };
      });
      e.querySelectorAll("[data-hv]").forEach((b) => {
        b.onclick = () => {
          const i = +b.dataset.hv, pot = st.pots[i];
          if (!pot || pot.stage < 2) return;
          const sd = SEEDS.find((x) => x.id === pot.id) || SEEDS[0];
          st.pots[i] = null;
          st.harvested++;
          s.mon += sd.sell;
          addRenown?.(sd.ren);
          ping("done");
          toast(`Harvested ${sd.name}! +${sd.sell} mon & +${sd.ren} Renown!`);
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
