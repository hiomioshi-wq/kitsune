// Foxhold Smithy & Anvil: smelt ores into Astral Motes & mon, or temper your RPG gear.
import { esc, today } from "../util.js";
import { item as findItem } from "./extras.js";

export function createSmithy(o) {
  const { s, panel, toast, ping, save, hud, extras, addRenown } = o;
  const st = (s.smithy ||= {});
  st.smelted ||= 0;
  st.temperDay ||= "";

  const bag = () => extras.state.bag;
  const RECIPES = [
    { id: "iron_mote", name: "Smelt Iron → 8 Astral Motes", need: { iron: 2 }, motes: 8, mon: 12 },
    { id: "quartz_mote", name: "Refine Quartz → 14 Astral Motes", need: { quartz: 2 }, motes: 14, mon: 18 },
    { id: "gold_bar", name: "Cast Gold Bar → 45 mon", need: { gold: 2 }, motes: 6, mon: 45 },
    { id: "emerald_core", name: "Cut Emerald Core → 22 Astral Motes", need: { emerald: 1, gear: 1 }, motes: 22, mon: 30 },
  ];

  function open() {
    const canTemper = st.temperDay !== today();
    const canUse = (reqs) => Object.entries(reqs).every(([k, n]) => (bag()[k] || 0) >= n);
    const reqTxt = (reqs) => Object.entries(reqs).map(([k, n]) => `${esc(findItem(k)?.[1] || k)} ${bag()[k] || 0}/${n}`).join(" · ");

    const rows = RECIPES.map((r) => {
      const ok = canUse(r.need);
      return `<div class="se-good">
        <span><strong>⚒️ ${esc(r.name)}</strong><small>${reqTxt(r.need)} · +${r.mon} mon, +${r.motes} Motes</small></span>
        <button type="button" class="btn btn-sm btn-accent" data-sm="${r.id}" ${ok ? "" : "disabled"}>Smelt</button>
      </div>`;
    }).join("");

    panel(`Foxhold Smithy · ${st.smelted} Smelted`, `
      <div class="se-mkt" style="margin-bottom:12px">
        <div class="se-good">
          <span><strong>🔥 Daily Anvil Temper</strong><small>Strike the anvil once a day for +20 mon &amp; +15 Renown</small></span>
          <button type="button" class="btn btn-sm btn-accent" id="sm-tmp" ${canTemper ? "" : "disabled"}>${canTemper ? "Strike Anvil" : "Tempered Today ✓"}</button>
        </div>
      </div>
      <h4>Smelting &amp; Refining</h4>
      <div class="se-mkt">${rows}</div>
    `, (e) => {
      const tmp = e.querySelector("#sm-tmp");
      if (tmp) tmp.onclick = () => {
        if (st.temperDay === today()) return;
        st.temperDay = today();
        s.mon += 20;
        addRenown?.(15);
        ping("done");
        toast("Clang! +20 mon & +15 Renown.");
        save(); hud(); open();
      };

      e.querySelectorAll("[data-sm]").forEach((b) => {
        b.onclick = () => {
          const r = RECIPES.find((x) => x.id === b.dataset.sm);
          if (!r || !canUse(r.need)) return;
          for (const [k, n] of Object.entries(r.need)) bag()[k] -= n;
          st.smelted++;
          s.mon += r.mon;
          s.nexus ||= {};
          s.nexus.motes = (s.nexus.motes || 0) + r.motes;
          addRenown?.(12);
          ping("done");
          toast(`Smelted! +${r.mon} mon & +${r.motes} Astral Motes!`);
          save(); hud(); open();
        };
      });
    });
  }

  return { open, state: st };
}
